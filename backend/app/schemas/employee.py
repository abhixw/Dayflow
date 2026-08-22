import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.enums import Role


class EmployeeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: str
    email: EmailStr
    role: Role
    is_verified: bool
    is_active: bool
    first_name: str
    last_name: str
    phone: str | None
    address: str | None
    profile_picture: str | None
    job_title: str | None
    department: str | None
    joining_date: date | None
    documents: list
    created_at: datetime
    updated_at: datetime


class EmployeeListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: str
    first_name: str
    last_name: str
    job_title: str | None
    department: str | None


class EmployeeSelfUpdate(BaseModel):
    """Fields an employee may edit on their own profile."""

    phone: str | None = None
    address: str | None = None
    profile_picture: str | None = None


class EmployeeAdminUpdate(BaseModel):
    """Fields HR/Admin may edit on any employee's profile."""

    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    address: str | None = None
    profile_picture: str | None = None
    job_title: str | None = None
    department: str | None = None
    joining_date: date | None = None
