import uuid
from datetime import datetime
from decimal import Decimal

from app.schemas.base import CamelModel


class PayrollUpdate(CamelModel):
    basic_salary: Decimal | None = None
    allowances: Decimal | None = None
    deductions: Decimal | None = None
    gross_salary: Decimal | None = None
    net_salary: Decimal | None = None


class PayrollOut(CamelModel):
    id: uuid.UUID
    employee_id: str
    # float, not Decimal: the frontend's types declare these as `number`, and
    # Pydantic serializes Decimal as a JSON string by default, which would
    # silently violate that contract. DB storage stays Decimal for precision.
    basic_salary: float
    allowances: float
    deductions: float
    gross_salary: float
    net_salary: float
    updated_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
