from uuid import UUID

from pydantic import EmailStr, field_validator

from app.models.enums import Role
from app.schemas.base import CamelModel

PUBLIC_ROLES = {Role.EMPLOYEE, Role.HR}


class SignupRequest(CamelModel):
    employee_id: str
    email: EmailStr
    password: str
    role: Role
    # Optional: not part of the MVP's core 4-field signup contract, but if the
    # frontend collects it, store it immediately instead of discarding it —
    # otherwise HR has to fill it in later via the employee-management PATCH.
    name: str | None = None

    @field_validator("role")
    @classmethod
    def role_must_be_public(cls, value: Role) -> Role:
        if value not in PUBLIC_ROLES:
            raise ValueError("Public signup may only create EMPLOYEE or HR accounts")
        return value

    @field_validator("password")
    @classmethod
    def password_min_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value

    @field_validator("employee_id")
    @classmethod
    def employee_id_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("employee_id must not be blank")
        return value.strip()


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserOut(CamelModel):
    id: UUID
    employee_id: str
    email: EmailStr
    role: Role
    email_verified: bool
