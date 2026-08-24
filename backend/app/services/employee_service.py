import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmployeeNotFoundError
from app.models.employee import Employee
from app.models.enums import Role
from app.models.user import User
from app.schemas.employee import EmployeeAdminUpdate, EmployeeOut, EmployeeSelfUpdate


def _full_name(employee: Employee) -> str:
    return f"{employee.first_name or ''} {employee.last_name or ''}".strip()


def _to_out(employee: Employee, user: User) -> EmployeeOut:
    return EmployeeOut(
        id=employee.id,
        employee_id=employee.employee_id,
        name=_full_name(employee),
        email=user.email,
        role=user.role,
        phone=employee.phone,
        address=employee.address,
        profile_picture=employee.profile_picture,
        job_title=employee.job_title,
        department=employee.department,
        joining_date=employee.joining_date,
        status="ACTIVE" if user.is_active else "INACTIVE",
        documents=employee.documents,
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


async def _get_by_code(db: AsyncSession, employee_code: str) -> tuple[Employee, User]:
    employee = await db.scalar(select(Employee).where(Employee.employee_id == employee_code))
    if employee is None:
        raise EmployeeNotFoundError
    user = await db.get(User, employee.user_id)
    return employee, user


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


async def get_profile_by_employee_code(db: AsyncSession, employee_code: str) -> EmployeeOut:
    employee, user = await _get_by_code(db, employee_code)
    return _to_out(employee, user)


async def update_profile_by_admin(
    db: AsyncSession, employee_code: str, payload: EmployeeAdminUpdate
) -> EmployeeOut:
    employee, user = await _get_by_code(db, employee_code)
    data = payload.model_dump(exclude_unset=True)

    name = data.pop("name", None)
    if name is not None:
        parts = name.split(maxsplit=1)
        employee.first_name = parts[0] if parts else ""
        employee.last_name = parts[1] if len(parts) > 1 else ""

    status = data.pop("status", None)
    if status is not None:
        user.is_active = status == "ACTIVE"

    for field, value in data.items():
        setattr(employee, field, value)

    await db.commit()
    await db.refresh(employee)
    await db.refresh(user)
    return _to_out(employee, user)


async def set_own_profile_picture(db: AsyncSession, user_id: uuid.UUID, picture_url: str) -> EmployeeOut:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    employee.profile_picture = picture_url
    await db.commit()
    await db.refresh(employee)
    user = await db.get(User, user_id)
    return _to_out(employee, user)


async def list_employees(db: AsyncSession) -> list[EmployeeOut]:
    # Excludes HR/Admin accounts — this list is the managed workforce, not
    # the people managing it. HR/Admin can still be looked up individually
    # by employee code via get_profile_by_employee_code if ever needed.
    result = await db.execute(
        select(Employee, User)
        .join(User, Employee.user_id == User.id)
        .where(User.role == Role.EMPLOYEE)
        .order_by(Employee.employee_id)
    )
    return [_to_out(employee, user) for employee, user in result.all()]
