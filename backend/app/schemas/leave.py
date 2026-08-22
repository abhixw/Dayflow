import uuid
from datetime import date, datetime

from pydantic import model_validator

from app.models.enums import LeaveStatus, LeaveType
from app.schemas.base import CamelModel


class LeaveCreate(CamelModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str | None = None

    @model_validator(mode="after")
    def validate_date_range(self) -> "LeaveCreate":
        if self.end_date < self.start_date:
            raise ValueError("end_date must not be before start_date")
        return self


class LeaveReviewRequest(CamelModel):
    comment: str | None = None


class LeaveOut(CamelModel):
    id: uuid.UUID
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str | None
    status: LeaveStatus
    reviewer_id: uuid.UUID | None
    review_comment: str | None
    reviewed_at: datetime | None
    created_at: datetime
    updated_at: datetime
