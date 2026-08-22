import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_hr_or_admin
from app.core.exceptions import (
    EmployeeNotFoundError,
    LeaveNotFoundError,
    LeaveNotPendingError,
    OverlappingLeaveError,
)
from app.db.database import get_db
from app.models.enums import LeaveStatus
from app.models.user import User
from app.schemas.leave import LeaveCreate, LeaveOut, LeaveReviewRequest
from app.services import leave_service

router = APIRouter(prefix="/api/leaves", tags=["leaves"])


@router.post("", response_model=LeaveOut, status_code=status.HTTP_201_CREATED)
async def create_leave(
    payload: LeaveCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeaveOut:
    try:
        return await leave_service.create_leave(db, current_user.id, payload)
    except OverlappingLeaveError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This leave request overlaps with an existing pending or approved leave.",
        )
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.get("/me", response_model=list[LeaveOut])
async def get_my_leaves(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[LeaveOut]:
    try:
        return await leave_service.get_own_leaves(db, current_user.id)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.get("", response_model=list[LeaveOut])
async def list_leaves(
    employee_id: str | None = Query(default=None),
    status_filter: LeaveStatus | None = Query(default=None, alias="status"),
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> list[LeaveOut]:
    return await leave_service.list_all_leaves(db, employee_id, status_filter)


@router.get("/{leave_id}", response_model=LeaveOut)
async def get_leave(
    leave_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LeaveOut:
    try:
        return await leave_service.get_leave_by_id(db, current_user.id, current_user.role, leave_id)
    except LeaveNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")


@router.patch("/{leave_id}/approve", response_model=LeaveOut)
async def approve_leave(
    leave_id: uuid.UUID,
    payload: LeaveReviewRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> LeaveOut:
    try:
        return await leave_service.approve_leave(db, leave_id, current_user.id, payload.comment)
    except LeaveNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")
    except LeaveNotPendingError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Only pending leave requests can be processed."
        )


@router.patch("/{leave_id}/reject", response_model=LeaveOut)
async def reject_leave(
    leave_id: uuid.UUID,
    payload: LeaveReviewRequest,
    current_user: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> LeaveOut:
    try:
        return await leave_service.reject_leave(db, leave_id, current_user.id, payload.comment)
    except LeaveNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found.")
    except LeaveNotPendingError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Only pending leave requests can be processed."
        )
