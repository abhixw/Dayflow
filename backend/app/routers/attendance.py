from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_hr_or_admin
from app.core.exceptions import (
    CheckOutBeforeCheckInError,
    DuplicateCheckInError,
    DuplicateCheckOutError,
    EmployeeNotFoundError,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.attendance import AttendanceOut
from app.services import attendance_service

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.post("/check-in", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
async def check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AttendanceOut:
    try:
        return await attendance_service.check_in(db, current_user.id)
    except DuplicateCheckInError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already checked in today.")
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.post("/check-out", response_model=AttendanceOut)
async def check_out(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AttendanceOut:
    try:
        return await attendance_service.check_out(db, current_user.id)
    except CheckOutBeforeCheckInError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You must check in before checking out.")
    except DuplicateCheckOutError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already checked out today.")
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.get("/me", response_model=list[AttendanceOut])
async def get_my_attendance(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceOut]:
    try:
        return await attendance_service.get_own_attendance(db, current_user.id, start_date, end_date)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.get("", response_model=list[AttendanceOut])
async def list_attendance(
    employee_id: str | None = Query(default=None),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceOut]:
    return await attendance_service.list_all_attendance(db, employee_id, start_date, end_date)


@router.get("/{employee_id}", response_model=list[AttendanceOut])
async def get_employee_attendance(
    employee_id: str,
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> list[AttendanceOut]:
    try:
        return await attendance_service.get_attendance_for_employee(db, employee_id, start_date, end_date)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
