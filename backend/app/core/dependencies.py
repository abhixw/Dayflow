from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.db.database import get_db
from app.models.enums import Role
from app.models.user import User

ACCESS_TOKEN_COOKIE_NAME = "access_token"


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
    )
    token = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)
    if not token:
        raise credentials_error

    try:
        payload = decode_access_token(token)
        user_id = UUID(payload["user_id"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise credentials_error

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_error

    return user


def require_roles(*allowed_roles: Role):
    async def _check(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this resource.",
            )
        return current_user

    return _check


require_employee = require_roles(Role.EMPLOYEE, Role.HR, Role.ADMIN)
require_hr = require_roles(Role.HR)
require_admin = require_roles(Role.ADMIN)
require_hr_or_admin = require_roles(Role.HR, Role.ADMIN)
