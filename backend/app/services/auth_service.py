import secrets
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import DuplicateEmailError, DuplicateEmployeeIdError, InactiveUserError, InvalidCredentialsError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.employee import Employee
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest


async def create_user(db: AsyncSession, payload: SignupRequest) -> User:
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
        verification_token=secrets.token_urlsafe(32),
    )
    db.add(user)
    await db.flush()

    employee = Employee(
        id=uuid.uuid4(),
        user_id=user.id,
        employee_id=user.employee_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(employee)

    await db.commit()
    await db.refresh(user)
    return user


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> str:
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise InvalidCredentialsError

    if not user.is_active:
        raise InactiveUserError

    return create_access_token(user_id=user.id, role=user.role.value)
