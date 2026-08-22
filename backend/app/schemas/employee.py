import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import EmailStr, Field

from app.models.enums import Role
from app.schemas.base import CamelModel

EmployeeStatus = Literal["ACTIVE", "INACTIVE"]


class EmployeeOut(CamelModel):
    id: uuid.UUID
    employee_id: str
    name: str
    email: EmailStr
    role: Role
    phone: str | None
    address: str | None
    profile_picture: str | None = Field(serialization_alias="profilePictureUrl")
    job_title: str | None
    department: str | None
    joining_date: date | None
    status: EmployeeStatus
    documents: list
    created_at: datetime
    updated_at: datetime


class EmployeeSelfUpdate(CamelModel):
    """Fields an employee may edit on their own profile."""

    phone: str | None = None
    address: str | None = None
    profile_picture: str | None = Field(default=None, validation_alias="profilePictureUrl")


class EmployeeAdminUpdate(CamelModel):
    """Fields HR/Admin may edit on any employee's profile."""

    name: str | None = None
    phone: str | None = None
    address: str | None = None
    job_title: str | None = None
    department: str | None = None
    joining_date: date | None = None
    status: EmployeeStatus | None = None
