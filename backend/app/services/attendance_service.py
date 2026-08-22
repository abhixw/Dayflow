import uuid
from datetime import date as date_
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    CheckOutBeforeCheckInError,
    DuplicateCheckInError,
    DuplicateCheckOutError,
    EmployeeNotFoundError,
)
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.enums import AttendanceStatus
from app.schemas.attendance import AttendanceOut


async def _get_employee_for_user(db: AsyncSession, user_id: uuid.UUID) -> Employee:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    return employee


async def check_in(db: AsyncSession, user_id: uuid.UUID) -> AttendanceOut:
    employee = await _get_employee_for_user(db, user_id)
    today = date_.today()

    existing = await db.scalar(
        select(Attendance).where(Attendance.employee_id == employee.id, Attendance.date == today)
    )
    if existing is not None:
        raise DuplicateCheckInError

    record = Attendance(
        id=uuid.uuid4(),
        employee_id=employee.id,
        date=today,
        check_in=datetime.now(timezone.utc),
        status=AttendanceStatus.PRESENT,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return AttendanceOut.model_validate(record)


async def check_out(db: AsyncSession, user_id: uuid.UUID) -> AttendanceOut:
    employee = await _get_employee_for_user(db, user_id)
    today = date_.today()

    record = await db.scalar(
        select(Attendance).where(Attendance.employee_id == employee.id, Attendance.date == today)
    )
    if record is None:
        raise CheckOutBeforeCheckInError
    if record.check_out is not None:
        raise DuplicateCheckOutError

    record.check_out = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(record)
    return AttendanceOut.model_validate(record)


async def _query_attendance(
    db: AsyncSession,
    employee_id: uuid.UUID,
    start_date: date_ | None,
    end_date: date_ | None,
) -> list[AttendanceOut]:
    query = select(Attendance).where(Attendance.employee_id == employee_id)
    if start_date is not None:
        query = query.where(Attendance.date >= start_date)
    if end_date is not None:
        query = query.where(Attendance.date <= end_date)
    query = query.order_by(Attendance.date)

    result = await db.scalars(query)
    return [AttendanceOut.model_validate(record) for record in result]


async def get_own_attendance(
    db: AsyncSession, user_id: uuid.UUID, start_date: date_ | None, end_date: date_ | None
) -> list[AttendanceOut]:
    employee = await _get_employee_for_user(db, user_id)
    return await _query_attendance(db, employee.id, start_date, end_date)


async def get_attendance_for_employee(
    db: AsyncSession, employee_id: uuid.UUID, start_date: date_ | None, end_date: date_ | None
) -> list[AttendanceOut]:
    employee = await db.get(Employee, employee_id)
    if employee is None:
        raise EmployeeNotFoundError
    return await _query_attendance(db, employee_id, start_date, end_date)


async def list_all_attendance(
    db: AsyncSession,
    employee_id: uuid.UUID | None,
    start_date: date_ | None,
    end_date: date_ | None,
) -> list[AttendanceOut]:
    query = select(Attendance)
    if employee_id is not None:
        query = query.where(Attendance.employee_id == employee_id)
    if start_date is not None:
        query = query.where(Attendance.date >= start_date)
    if end_date is not None:
        query = query.where(Attendance.date <= end_date)
    query = query.order_by(Attendance.employee_id, Attendance.date)

    result = await db.scalars(query)
    return [AttendanceOut.model_validate(record) for record in result]
