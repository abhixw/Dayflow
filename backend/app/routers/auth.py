from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import ACCESS_TOKEN_COOKIE_NAME, get_current_user
from app.core.exceptions import (
    DuplicateEmailError,
    DuplicateEmployeeIdError,
    InactiveUserError,
    InvalidCredentialsError,
    InvalidResetTokenError,
)
from app.core.rate_limit import rate_limit
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import ForgotPasswordRequest, LoginRequest, ResetPasswordRequest, SignupRequest, UserOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Named module-level dependencies (not inline in the decorator) so tests can
# swap them out via app.dependency_overrides — see tests/conftest.py.
login_rate_limiter = rate_limit(max_requests=10, window_seconds=60)
signup_rate_limiter = rate_limit(max_requests=5, window_seconds=60)
forgot_password_rate_limiter = rate_limit(max_requests=5, window_seconds=60)


def _set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=token,
        max_age=settings.access_token_expire_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )


@router.post(
    "/signup",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(signup_rate_limiter)],
)
async def signup(payload: SignupRequest, response: Response, db: AsyncSession = Depends(get_db)) -> UserOut:
    try:
        token, user = await auth_service.create_user(db, payload)
    except DuplicateEmailError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")
    except DuplicateEmployeeIdError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee ID is already in use.")

    _set_auth_cookie(response, token)
    return user


@router.post("/login", response_model=UserOut, dependencies=[Depends(login_rate_limiter)])
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> UserOut:
    try:
        token, user = await auth_service.authenticate_user(db, payload)
    except (InvalidCredentialsError, InactiveUserError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    _set_auth_cookie(response, token)
    return user


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(
        id=current_user.id,
        employee_id=current_user.employee_id,
        email=current_user.email,
        role=current_user.role,
        email_verified=current_user.is_verified,
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(response: Response, current_user: User = Depends(get_current_user)) -> dict:
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
    )
    return {"detail": "Logged out."}


@router.post(
    "/forgot-password",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(forgot_password_rate_limiter)],
)
async def forgot_password(payload: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    await auth_service.request_password_reset(db, payload.email)
    # Same response whether or not the email exists, on purpose.
    return {"detail": "If an account with that email exists, a reset link has been sent."}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(payload: ResetPasswordRequest, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        await auth_service.reset_password(db, payload.token, payload.new_password)
    except InvalidResetTokenError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This reset link is invalid or has expired.")
    return {"detail": "Password reset successful."}
