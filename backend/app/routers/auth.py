from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import ACCESS_TOKEN_COOKIE_NAME, get_current_user
from app.core.exceptions import DuplicateEmailError, DuplicateEmployeeIdError, InactiveUserError, InvalidCredentialsError
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, SignupRequest, UserOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db: AsyncSession = Depends(get_db)) -> UserOut:
    try:
        return await auth_service.create_user(db, payload)
    except DuplicateEmailError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered.")
    except DuplicateEmployeeIdError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Employee ID is already in use.")


@router.post("/login", response_model=UserOut)
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)) -> UserOut:
    try:
        token, user = await auth_service.authenticate_user(db, payload)
    except (InvalidCredentialsError, InactiveUserError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=token,
        max_age=settings.access_token_expire_seconds,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )
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
