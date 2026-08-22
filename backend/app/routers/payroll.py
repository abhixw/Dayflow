import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_hr_or_admin
from app.core.exceptions import EmployeeNotFoundError, PayrollNotFoundError
from app.db.database import get_db
from app.models.user import User
from app.schemas.payroll import PayrollOut, PayrollUpdate
from app.services import payroll_service

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


@router.get("/me", response_model=PayrollOut)
async def get_my_payroll(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PayrollOut:
    try:
        return await payroll_service.get_own_payroll(db, current_user.id)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")
    except PayrollNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll has not been set up yet.")


@router.get("/{employee_id}", response_model=PayrollOut)
async def get_employee_payroll(
    employee_id: uuid.UUID,
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> PayrollOut:
    try:
        return await payroll_service.get_payroll_by_employee_id(db, employee_id)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
    except PayrollNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payroll has not been set up yet.")


@router.patch("/{employee_id}", response_model=PayrollOut)
async def update_employee_payroll(
    employee_id: uuid.UUID,
    payload: PayrollUpdate,
    current_user: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> PayrollOut:
    try:
        return await payroll_service.upsert_payroll(db, employee_id, current_user.id, payload)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
