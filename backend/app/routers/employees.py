import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_hr_or_admin
from app.core.exceptions import EmployeeNotFoundError
from app.db.database import get_db
from app.models.user import User
from app.schemas.employee import EmployeeAdminUpdate, EmployeeListItem, EmployeeOut, EmployeeSelfUpdate
from app.services import employee_service

router = APIRouter(prefix="/api/employees", tags=["employees"])


@router.get("/me", response_model=EmployeeOut)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    try:
        return await employee_service.get_own_profile(db, current_user.id)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.patch("/me", response_model=EmployeeOut)
async def update_my_profile(
    payload: EmployeeSelfUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    try:
        return await employee_service.update_own_profile(db, current_user.id, payload)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.get("", response_model=list[EmployeeListItem])
async def list_employees(
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> list[EmployeeListItem]:
    return await employee_service.list_employees(db)


@router.get("/{employee_id}", response_model=EmployeeOut)
async def get_employee(
    employee_id: uuid.UUID,
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    try:
        return await employee_service.get_profile_by_employee_id(db, employee_id)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")


@router.patch("/{employee_id}", response_model=EmployeeOut)
async def update_employee(
    employee_id: uuid.UUID,
    payload: EmployeeAdminUpdate,
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    try:
        return await employee_service.update_profile_by_admin(db, employee_id, payload)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
