import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmployeeNotFoundError
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import EmployeeAdminUpdate, EmployeeListItem, EmployeeOut, EmployeeSelfUpdate


def _to_out(employee: Employee, user: User) -> EmployeeOut:
    return EmployeeOut(
        id=employee.id,
        employee_id=employee.employee_id,
        email=user.email,
        role=user.role,
        is_verified=user.is_verified,
        is_active=user.is_active,
        first_name=employee.first_name,
        last_name=employee.last_name,
        phone=employee.phone,
        address=employee.address,
        profile_picture=employee.profile_picture,
        job_title=employee.job_title,
        department=employee.department,
        joining_date=employee.joining_date,
        documents=employee.documents,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


async def get_own_profile(db: AsyncSession, user_id: uuid.UUID) -> EmployeeOut:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    user = await db.get(User, user_id)
    return _to_out(employee, user)


async def update_own_profile(db: AsyncSession, user_id: uuid.UUID, payload: EmployeeSelfUpdate) -> EmployeeOut:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    user = await db.get(User, user_id)
    return _to_out(employee, user)


async def get_profile_by_employee_id(db: AsyncSession, employee_id: uuid.UUID) -> EmployeeOut:
    employee = await db.get(Employee, employee_id)
    if employee is None:
        raise EmployeeNotFoundError
    user = await db.get(User, employee.user_id)
    return _to_out(employee, user)


async def update_profile_by_admin(
    db: AsyncSession, employee_id: uuid.UUID, payload: EmployeeAdminUpdate
) -> EmployeeOut:
    employee = await db.get(Employee, employee_id)
    if employee is None:
        raise EmployeeNotFoundError
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)
    await db.commit()
    await db.refresh(employee)
    user = await db.get(User, employee.user_id)
    return _to_out(employee, user)


async def list_employees(db: AsyncSession) -> list[EmployeeListItem]:
    result = await db.scalars(select(Employee).order_by(Employee.employee_id))
    return [EmployeeListItem.model_validate(employee) for employee in result]
