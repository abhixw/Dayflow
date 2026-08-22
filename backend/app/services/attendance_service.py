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


def _to_out(record: Attendance, employee_code: str) -> AttendanceOut:
    return AttendanceOut(
        id=record.id,
        employee_id=employee_code,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        status=record.status,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


async def _get_employee_for_user(db: AsyncSession, user_id: uuid.UUID) -> Employee:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError
    return employee


async def _get_employee_by_code(db: AsyncSession, employee_code: str) -> Employee:
    employee = await db.scalar(select(Employee).where(Employee.employee_id == employee_code))
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
    return _to_out(record, employee.employee_id)


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
    return _to_out(record, employee.employee_id)


async def _query_attendance(
    db: AsyncSession, employee: Employee, start_date: date_ | None, end_date: date_ | None
) -> list[AttendanceOut]:
    query = select(Attendance).where(Attendance.employee_id == employee.id)
    if start_date is not None:
        query = query.where(Attendance.date >= start_date)
    if end_date is not None:
        query = query.where(Attendance.date <= end_date)
    query = query.order_by(Attendance.date)

    result = await db.scalars(query)
    return [_to_out(record, employee.employee_id) for record in result]


async def get_own_attendance(
    db: AsyncSession, user_id: uuid.UUID, start_date: date_ | None, end_date: date_ | None
) -> list[AttendanceOut]:
    employee = await _get_employee_for_user(db, user_id)
    return await _query_attendance(db, employee, start_date, end_date)


async def get_attendance_for_employee(
    db: AsyncSession, employee_code: str, start_date: date_ | None, end_date: date_ | None
) -> list[AttendanceOut]:
    employee = await _get_employee_by_code(db, employee_code)
    return await _query_attendance(db, employee, start_date, end_date)


async def list_all_attendance(
    db: AsyncSession,
    employee_code: str | None,
    start_date: date_ | None,
    end_date: date_ | None,
) -> list[AttendanceOut]:
    query = select(Attendance, Employee).join(Employee, Attendance.employee_id == Employee.id)
    if employee_code is not None:
        query = query.where(Employee.employee_id == employee_code)
    if start_date is not None:
        query = query.where(Attendance.date >= start_date)
    if end_date is not None:
        query = query.where(Attendance.date <= end_date)
    query = query.order_by(Employee.employee_id, Attendance.date)

    result = await db.execute(query)
    return [_to_out(record, employee.employee_id) for record, employee in result.all()]
