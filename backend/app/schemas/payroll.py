import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PayrollUpdate(BaseModel):
    basic_salary: Decimal | None = None
    allowances: Decimal | None = None
    deductions: Decimal | None = None
    gross_salary: Decimal | None = None
    net_salary: Decimal | None = None


class PayrollOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    employee_id: uuid.UUID
    basic_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    gross_salary: Decimal
    net_salary: Decimal
    updated_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
