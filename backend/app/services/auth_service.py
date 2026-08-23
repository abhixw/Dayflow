import secrets
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import (
    DuplicateEmailError,
    DuplicateEmployeeIdError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidResetTokenError,
)
from app.core.security import create_access_token, hash_password, verify_password
from app.models.employee import Employee
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, UserOut
from app.services.email_service import send_email

PASSWORD_RESET_TOKEN_TTL = timedelta(hours=1)


def _to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        employee_id=user.employee_id,
        email=user.email,
        role=user.role,
        email_verified=user.is_verified,
    )


async def create_user(db: AsyncSession, payload: SignupRequest) -> tuple[str, UserOut]:
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
    token = create_access_token(user_id=user.id, role=user.role.value)
    return token, _to_user_out(user)


async def authenticate_user(db: AsyncSession, payload: LoginRequest) -> tuple[str, UserOut]:
    user = await db.scalar(select(User).where(User.email == payload.email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise InvalidCredentialsError

    if not user.is_active:
        raise InactiveUserError

    token = create_access_token(user_id=user.id, role=user.role.value)
    return token, _to_user_out(user)


async def request_password_reset(db: AsyncSession, email: str) -> None:
    # Always behaves the same whether or not the email is registered, so the
    # caller can't use this endpoint to enumerate real accounts.
    user = await db.scalar(select(User).where(User.email == email))
    if user is None:
        return

    token = secrets.token_urlsafe(32)
    user.password_reset_token = token
    user.password_reset_token_expires_at = datetime.now(timezone.utc) + PASSWORD_RESET_TOKEN_TTL
    await db.commit()

    reset_link = f"{settings.frontend_url}/reset-password?token={token}"
    await send_email(
        user.email,
        "Reset your Dayflow password",
        f"We received a request to reset your Dayflow password.\n\n"
        f"Reset it here (expires in 1 hour): {reset_link}\n\n"
        f"If you didn't request this, you can ignore this email.",
    )


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    user = await db.scalar(select(User).where(User.password_reset_token == token))
    now = datetime.now(timezone.utc)
    if user is None or user.password_reset_token_expires_at is None or user.password_reset_token_expires_at < now:
        raise InvalidResetTokenError

    user.password_hash = hash_password(new_password)
    user.password_reset_token = None
    user.password_reset_token_expires_at = None
    await db.commit()
