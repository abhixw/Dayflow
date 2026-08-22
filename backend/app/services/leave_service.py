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
from app.models.enums import LeaveStatus, Role
from app.models.leave import Leave
from app.schemas.leave import LeaveCreate, LeaveOut


async def _get_employee_for_user(db: AsyncSession, user_id: uuid.UUID) -> Employee:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    return employee


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
    return LeaveOut.model_validate(leave)


async def get_own_leaves(db: AsyncSession, user_id: uuid.UUID) -> list[LeaveOut]:
    employee = await _get_employee_for_user(db, user_id)
    result = await db.scalars(
        select(Leave).where(Leave.employee_id == employee.id).order_by(Leave.created_at.desc())
    )
    return [LeaveOut.model_validate(leave) for leave in result]


async def get_leave_by_id(
    db: AsyncSession, user_id: uuid.UUID, role: Role, leave_id: uuid.UUID
) -> LeaveOut:
    leave = await db.get(Leave, leave_id)
    if leave is None:
        raise LeaveNotFoundError

    if role in (Role.HR, Role.ADMIN):
        return LeaveOut.model_validate(leave)

    employee = await _get_employee_for_user(db, user_id)
    if leave.employee_id != employee.id:
        raise LeaveNotFoundError
    return LeaveOut.model_validate(leave)


async def list_all_leaves(
    db: AsyncSession, employee_id: uuid.UUID | None, status: LeaveStatus | None
) -> list[LeaveOut]:
    query = select(Leave)
    if employee_id is not None:
        query = query.where(Leave.employee_id == employee_id)
    if status is not None:
        query = query.where(Leave.status == status)
    query = query.order_by(Leave.created_at.desc())

    result = await db.scalars(query)
    return [LeaveOut.model_validate(leave) for leave in result]


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
    return LeaveOut.model_validate(leave)


async def approve_leave(
    db: AsyncSession, leave_id: uuid.UUID, reviewer_id: uuid.UUID, comment: str | None
) -> LeaveOut:
    return await _review_leave(db, leave_id, reviewer_id, LeaveStatus.APPROVED, comment)


async def reject_leave(
    db: AsyncSession, leave_id: uuid.UUID, reviewer_id: uuid.UUID, comment: str | None
) -> LeaveOut:
    return await _review_leave(db, leave_id, reviewer_id, LeaveStatus.REJECTED, comment)
