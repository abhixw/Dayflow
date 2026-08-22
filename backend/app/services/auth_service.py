import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateEmailError, DuplicateEmployeeIdError, InactiveUserError, InvalidCredentialsError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.employee import Employee
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, UserOut


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        employee_id=user.employee_id,
        email=user.email,
        role=user.role,
        email_verified=user.is_verified,
    )


async def create_user(db: AsyncSession, payload: SignupRequest) -> UserOut:
    existing_email = await db.scalar(select(User).where(User.email == payload.email))
    if existing_email:
        raise DuplicateEmailError

    existing_employee_id = await db.scalar(select(User).where(User.employee_id == payload.employee_id))
    if existing_employee_id:
        raise DuplicateEmployeeIdError

    user = User(
        id=uuid.uuid4(),
        employee_id=payload.employee_id,
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_verified=False,
        is_active=True,
    )
    db.add(user)
    await db.flush()

    first_name, last_name = None, None
    if payload.name:
        parts = payload.name.split(maxsplit=1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""

    employee = Employee(
        id=uuid.uuid4(),
        user_id=user.id,
        employee_id=user.employee_id,
        first_name=first_name,
        last_name=last_name,
    )
    db.add(employee)

    await db.commit()
    await db.refresh(user)
    return _to_user_out(user)


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> tuple[str, UserOut]:
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise InvalidCredentialsError

    if not user.is_active:
        raise InactiveUserError

    token = create_access_token(user_id=user.id, role=user.role.value)
    return token, _to_user_out(user)
