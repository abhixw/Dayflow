from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.models.enums import Role

PUBLIC_ROLES = {Role.EMPLOYEE, Role.HR}


class SignupRequest(BaseModel):
    employee_id: str
    email: EmailStr
    password: str
    role: Role
    first_name: str
    last_name: str

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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    employee_id: str
    email: EmailStr
    role: Role
    is_verified: bool
    is_active: bool
