import uuid
from datetime import date, datetime

from app.models.enums import AttendanceStatus
from app.schemas.base import CamelModel


class AttendanceOut(CamelModel):
    id: uuid.UUID
    employee_id: str
    date: date
    check_in: datetime | None
    check_out: datetime | None
    status: AttendanceStatus
    created_at: datetime
    updated_at: datetime
