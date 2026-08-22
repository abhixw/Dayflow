from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_hr_or_admin
from app.core.exceptions import EmployeeNotFoundError
from app.db.database import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsAdminResponse, AnalyticsEmployeeResponse
from app.services import analytics_service

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/me", response_model=AnalyticsEmployeeResponse)
async def get_my_analytics(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsEmployeeResponse:
    try:
        return await analytics_service.get_employee_analytics(db, current_user.id, start_date, end_date)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.get("/admin", response_model=AnalyticsAdminResponse)
async def get_admin_analytics(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsAdminResponse:
    return await analytics_service.get_admin_analytics(db, start_date, end_date)
