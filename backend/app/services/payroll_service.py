import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmployeeNotFoundError, PayrollNotFoundError
from app.models.employee import Employee
from app.models.enums import NotificationType
from app.models.payroll import Payroll
from app.models.user import User
from app.schemas.payroll import PayrollOut, PayrollUpdate
from app.services import email_service, notification_service


def _to_out(payroll: Payroll, employee_code: str) -> PayrollOut:
    return PayrollOut(
        id=payroll.id,
        employee_id=employee_code,
        basic_salary=payroll.basic_salary,
        allowances=payroll.allowances,
        deductions=payroll.deductions,
        gross_salary=payroll.gross_salary,
        net_salary=payroll.net_salary,
        updated_by=payroll.updated_by,
        created_at=payroll.created_at,
        updated_at=payroll.updated_at,
    )


async def _get_employee_by_code(db: AsyncSession, employee_code: str) -> Employee:
    employee = await db.scalar(select(Employee).where(Employee.employee_id == employee_code))
    if employee is None:
        raise EmployeeNotFoundError
    return employee


async def get_own_payroll(db: AsyncSession, user_id: uuid.UUID) -> PayrollOut:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    payroll = await db.scalar(select(Payroll).where(Payroll.employee_id == employee.id))
    if payroll is None:
        raise PayrollNotFoundError
    return _to_out(payroll, employee.employee_id)


async def get_payroll_by_employee_code(db: AsyncSession, employee_code: str) -> PayrollOut:
    employee = await _get_employee_by_code(db, employee_code)
    payroll = await db.scalar(select(Payroll).where(Payroll.employee_id == employee.id))
    if payroll is None:
        raise PayrollNotFoundError
    return _to_out(payroll, employee.employee_id)


async def upsert_payroll(
    db: AsyncSession, employee_code: str, updated_by: uuid.UUID, payload: PayrollUpdate
) -> PayrollOut:
    employee = await _get_employee_by_code(db, employee_code)

    payroll = await db.scalar(select(Payroll).where(Payroll.employee_id == employee.id))
    if payroll is None:
        payroll = Payroll(id=uuid.uuid4(), employee_id=employee.id)
        db.add(payroll)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(payroll, field, value)
    payroll.updated_by = updated_by

    await db.commit()
    await db.refresh(payroll)

    employee_user = await db.get(User, employee.user_id)
    title = "Payroll Updated"
    message = "Your payroll information was updated."
    await notification_service.create_notification(db, employee_user.id, NotificationType.PAYROLL_UPDATED, title, message)
    await email_service.send_email(employee_user.email, title, message)

    return _to_out(payroll, employee.employee_id)
