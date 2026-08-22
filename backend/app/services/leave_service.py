import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    EmployeeNotFoundError,
    LeaveNotFoundError,
    LeaveNotPendingError,
    OverlappingLeaveError,
)
from app.models.employee import Employee
from app.models.enums import LeaveStatus, NotificationType, Role
from app.models.leave import Leave
from app.models.user import User
from app.schemas.leave import LeaveCreate, LeaveOut
from app.services import email_service, notification_service


def _to_out(leave: Leave, employee_code: str) -> LeaveOut:
    return LeaveOut(
        id=leave.id,
        employee_id=employee_code,
        leave_type=leave.leave_type,
        start_date=leave.start_date,
        end_date=leave.end_date,
        remarks=leave.remarks,
        status=leave.status,
        reviewer_id=leave.reviewer_id,
        review_comment=leave.review_comment,
        reviewed_at=leave.reviewed_at,
        created_at=leave.created_at,
        updated_at=leave.updated_at,
    )


async def _get_employee_for_user(db: AsyncSession, user_id: uuid.UUID) -> Employee:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    return employee


async def _notify_hr_and_admins_of_new_leave(db: AsyncSession, applicant: Employee, leave: Leave) -> None:
    reviewers = await db.scalars(select(User).where(User.role.in_([Role.HR, Role.ADMIN])))
    name = f"{applicant.first_name or ''} {applicant.last_name or ''}".strip() or applicant.employee_id
    title = "New Leave Request"
    message = f"{name} submitted a {leave.leave_type.value.lower()} leave request ({leave.start_date} to {leave.end_date})."
    for reviewer in reviewers:
        await notification_service.create_notification(db, reviewer.id, NotificationType.LEAVE_SUBMITTED, title, message)
        await email_service.send_email(reviewer.email, title, message)


async def create_leave(db: AsyncSession, user_id: uuid.UUID, payload: LeaveCreate) -> LeaveOut:
    employee = await _get_employee_for_user(db, user_id)

    overlap = await db.scalar(
        select(Leave).where(
            Leave.employee_id == employee.id,
            Leave.status.in_([LeaveStatus.PENDING, LeaveStatus.APPROVED]),
            Leave.start_date <= payload.end_date,
            Leave.end_date >= payload.start_date,
        )
    )
    if overlap is not None:
        raise OverlappingLeaveError

    leave = Leave(
        id=uuid.uuid4(),
        employee_id=employee.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        remarks=payload.remarks,
        status=LeaveStatus.PENDING,
    )
    db.add(leave)
    await db.commit()
    await db.refresh(leave)

    await _notify_hr_and_admins_of_new_leave(db, employee, leave)

    return _to_out(leave, employee.employee_id)


async def get_own_leaves(db: AsyncSession, user_id: uuid.UUID) -> list[LeaveOut]:
    employee = await _get_employee_for_user(db, user_id)
    result = await db.scalars(
        select(Leave).where(Leave.employee_id == employee.id).order_by(Leave.created_at.desc())
    )
    return [_to_out(leave, employee.employee_id) for leave in result]


async def get_leave_by_id(
    db: AsyncSession, user_id: uuid.UUID, role: Role, leave_id: uuid.UUID
) -> LeaveOut:
    leave = await db.get(Leave, leave_id)
    if leave is None:
        raise LeaveNotFoundError

    leave_employee = await db.get(Employee, leave.employee_id)

    if role in (Role.HR, Role.ADMIN):
        return _to_out(leave, leave_employee.employee_id)

    employee = await _get_employee_for_user(db, user_id)
    if leave.employee_id != employee.id:
        raise LeaveNotFoundError
    return _to_out(leave, employee.employee_id)


async def list_all_leaves(
    db: AsyncSession, employee_code: str | None, status: LeaveStatus | None
) -> list[LeaveOut]:
    query = select(Leave, Employee).join(Employee, Leave.employee_id == Employee.id)
    if employee_code is not None:
        query = query.where(Employee.employee_id == employee_code)
    if status is not None:
        query = query.where(Leave.status == status)
    query = query.order_by(Leave.created_at.desc())

    result = await db.execute(query)
    return [_to_out(leave, employee.employee_id) for leave, employee in result.all()]


async def _review_leave(
    db: AsyncSession,
    leave_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    new_status: LeaveStatus,
    comment: str | None,
) -> LeaveOut:
    leave = await db.get(Leave, leave_id)
    if leave is None:
        raise LeaveNotFoundError
    if leave.status != LeaveStatus.PENDING:
        raise LeaveNotPendingError

    leave.status = new_status
    leave.reviewer_id = reviewer_id
    leave.review_comment = comment
    leave.reviewed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(leave)

    employee = await db.get(Employee, leave.employee_id)
    applicant_user = await db.get(User, employee.user_id)

    notif_type = NotificationType.LEAVE_APPROVED if new_status == LeaveStatus.APPROVED else NotificationType.LEAVE_REJECTED
    title = "Leave Approved" if new_status == LeaveStatus.APPROVED else "Leave Rejected"
    verb = "approved" if new_status == LeaveStatus.APPROVED else "rejected"
    message = f"Your {leave.leave_type.value.lower()} leave request ({leave.start_date} to {leave.end_date}) has been {verb}."
    if comment:
        message += f" Comment: {comment}"

    await notification_service.create_notification(db, applicant_user.id, notif_type, title, message)
    await email_service.send_email(applicant_user.email, title, message)

    return _to_out(leave, employee.employee_id)


async def approve_leave(
    db: AsyncSession, leave_id: uuid.UUID, reviewer_id: uuid.UUID, comment: str | None
) -> LeaveOut:
    return await _review_leave(db, leave_id, reviewer_id, LeaveStatus.APPROVED, comment)


async def reject_leave(
    db: AsyncSession, leave_id: uuid.UUID, reviewer_id: uuid.UUID, comment: str | None
) -> LeaveOut:
    return await _review_leave(db, leave_id, reviewer_id, LeaveStatus.REJECTED, comment)
