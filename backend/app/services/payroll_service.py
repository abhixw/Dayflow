import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmployeeNotFoundError, PayrollNotFoundError
from app.models.employee import Employee
from app.models.payroll import Payroll
from app.schemas.payroll import PayrollOut, PayrollUpdate


async def _get_employee_for_user(db: AsyncSession, user_id: uuid.UUID) -> Employee:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    return employee


async def get_own_payroll(db: AsyncSession, user_id: uuid.UUID) -> PayrollOut:
    employee = await _get_employee_for_user(db, user_id)
    payroll = await db.scalar(select(Payroll).where(Payroll.employee_id == employee.id))
    if payroll is None:
        raise PayrollNotFoundError
    return PayrollOut.model_validate(payroll)


async def get_payroll_by_employee_id(db: AsyncSession, employee_id: uuid.UUID) -> PayrollOut:
    employee = await db.get(Employee, employee_id)
    if employee is None:
        raise EmployeeNotFoundError
    payroll = await db.scalar(select(Payroll).where(Payroll.employee_id == employee_id))
    if payroll is None:
        raise PayrollNotFoundError
    return PayrollOut.model_validate(payroll)


async def upsert_payroll(
    db: AsyncSession, employee_id: uuid.UUID, updated_by: uuid.UUID, payload: PayrollUpdate
) -> PayrollOut:
    employee = await db.get(Employee, employee_id)
    if employee is None:
        raise EmployeeNotFoundError

    payroll = await db.scalar(select(Payroll).where(Payroll.employee_id == employee_id))
    if payroll is None:
        payroll = Payroll(id=uuid.uuid4(), employee_id=employee_id)
        db.add(payroll)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(payroll, field, value)
    payroll.updated_by = updated_by

    await db.commit()
    await db.refresh(payroll)
    return PayrollOut.model_validate(payroll)
