import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.dependencies import get_current_user, require_hr_or_admin
from app.core.exceptions import EmployeeNotFoundError
from app.db.database import get_db
from app.models.user import User
from app.schemas.employee import EmployeeAdminUpdate, EmployeeOut, EmployeeSelfUpdate
from app.services import employee_service

router = APIRouter(prefix="/api/employees", tags=["employees"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "static" / "uploads"
ALLOWED_IMAGE_CONTENT_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024


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


@router.patch("/me/profile-picture", response_model=EmployeeOut)
async def update_my_profile_picture(
    file: UploadFile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    if file.content_type not in ALLOWED_IMAGE_CONTENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload a JPEG, PNG, GIF, or WebP image.")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Image must be smaller than 5MB.")

    extension = Path(file.filename or "").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{extension}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(contents)

    picture_url = f"{settings.backend_url}/static/uploads/{filename}"
    try:
        return await employee_service.set_own_profile_picture(db, current_user.id, picture_url)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found.")


@router.get("", response_model=list[EmployeeOut])
async def list_employees(
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> list[EmployeeOut]:
    return await employee_service.list_employees(db)


@router.get("/{employee_id}", response_model=EmployeeOut)
async def get_employee(
    employee_id: str,
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    try:
        return await employee_service.get_profile_by_employee_code(db, employee_id)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")


@router.patch("/{employee_id}", response_model=EmployeeOut)
async def update_employee(
    employee_id: str,
    payload: EmployeeAdminUpdate,
    _: User = Depends(require_hr_or_admin),
    db: AsyncSession = Depends(get_db),
) -> EmployeeOut:
    try:
        return await employee_service.update_profile_by_admin(db, employee_id, payload)
    except EmployeeNotFoundError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")
