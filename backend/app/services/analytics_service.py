import uuid
from datetime import date as date_

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import EmployeeNotFoundError
from app.models.attendance import Attendance
from app.models.employee import Employee
from app.models.enums import AttendanceStatus, LeaveStatus, LeaveType
from app.models.leave import Leave
from app.models.payroll import Payroll
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsAdminResponse,
    AnalyticsEmployeeResponse,
    AttendanceAnalytics,
    AttendanceTrendPoint,
    DepartmentCount,
    DepartmentPayroll,
    EmployeeStatistics,
    LeaveAnalytics,
    PayrollAnalyticsAdmin,
    PayrollAnalyticsSelf,
)


def _count_when(condition) -> object:
    return func.coalesce(func.sum(case((condition, 1), else_=0)), 0)


async def _attendance_analytics(
    db: AsyncSession, employee_id: uuid.UUID | None, start_date: date_ | None, end_date: date_ | None
) -> AttendanceAnalytics:
    query = select(
        func.count().label("total"),
        _count_when(Attendance.status == AttendanceStatus.PRESENT).label("present"),
        _count_when(Attendance.status == AttendanceStatus.ABSENT).label("absent"),
        _count_when(Attendance.status == AttendanceStatus.HALF_DAY).label("half_day"),
        _count_when(Attendance.status == AttendanceStatus.LEAVE).label("leave"),
    )
    if employee_id is not None:
        query = query.where(Attendance.employee_id == employee_id)
    if start_date is not None:
        query = query.where(Attendance.date >= start_date)
    if end_date is not None:
        query = query.where(Attendance.date <= end_date)

    row = (await db.execute(query)).one()
    total = row.total or 0
    percentage = round((row.present / total) * 100, 2) if total else 0.0
    return AttendanceAnalytics(
        total=total, present=row.present, absent=row.absent, half_day=row.half_day, leave=row.leave,
        percentage=percentage,
    )


async def _attendance_trend(
    db: AsyncSession, employee_id: uuid.UUID | None, start_date: date_ | None, end_date: date_ | None
) -> list[AttendanceTrendPoint]:
    query = (
        select(
            Attendance.date,
            _count_when(Attendance.status == AttendanceStatus.PRESENT).label("present"),
            _count_when(Attendance.status == AttendanceStatus.ABSENT).label("absent"),
            _count_when(Attendance.status == AttendanceStatus.HALF_DAY).label("half_day"),
            _count_when(Attendance.status == AttendanceStatus.LEAVE).label("leave"),
        )
        .group_by(Attendance.date)
        .order_by(Attendance.date)
    )
    if employee_id is not None:
        query = query.where(Attendance.employee_id == employee_id)
    if start_date is not None:
        query = query.where(Attendance.date >= start_date)
    if end_date is not None:
        query = query.where(Attendance.date <= end_date)

    rows = (await db.execute(query)).all()
    return [
        AttendanceTrendPoint(date=r.date, present=r.present, absent=r.absent, half_day=r.half_day, leave=r.leave)
        for r in rows
    ]


async def _leave_analytics(
    db: AsyncSession, employee_id: uuid.UUID | None, start_date: date_ | None, end_date: date_ | None
) -> LeaveAnalytics:
    query = select(
        func.count().label("total"),
        _count_when(Leave.status == LeaveStatus.PENDING).label("pending"),
        _count_when(Leave.status == LeaveStatus.APPROVED).label("approved"),
        _count_when(Leave.status == LeaveStatus.REJECTED).label("rejected"),
        _count_when(Leave.leave_type == LeaveType.PAID).label("paid"),
        _count_when(Leave.leave_type == LeaveType.SICK).label("sick"),
        _count_when(Leave.leave_type == LeaveType.UNPAID).label("unpaid"),
    )
    if employee_id is not None:
        query = query.where(Leave.employee_id == employee_id)
    # Date filter semantics: leaves whose start_date falls within the window
    # (i.e. leave activity scheduled during this period).
    if start_date is not None:
        query = query.where(Leave.start_date >= start_date)
    if end_date is not None:
        query = query.where(Leave.start_date <= end_date)

    row = (await db.execute(query)).one()
    return LeaveAnalytics(
        total=row.total or 0, pending=row.pending, approved=row.approved, rejected=row.rejected,
        paid=row.paid, sick=row.sick, unpaid=row.unpaid,
    )


async def get_employee_analytics(
    db: AsyncSession, user_id: uuid.UUID, start_date: date_ | None, end_date: date_ | None
) -> AnalyticsEmployeeResponse:
    employee = await db.scalar(select(Employee).where(Employee.user_id == user_id))
    if employee is None:
        raise EmployeeNotFoundError

    attendance = await _attendance_analytics(db, employee.id, start_date, end_date)
    trend = await _attendance_trend(db, employee.id, start_date, end_date)
    leave = await _leave_analytics(db, employee.id, start_date, end_date)

    payroll_row = await db.scalar(select(Payroll).where(Payroll.employee_id == employee.id))
    payroll = (
        PayrollAnalyticsSelf(
            basic_salary=payroll_row.basic_salary,
            allowances=payroll_row.allowances,
            deductions=payroll_row.deductions,
            gross_salary=payroll_row.gross_salary,
            net_salary=payroll_row.net_salary,
        )
        if payroll_row is not None
        else None
    )

    return AnalyticsEmployeeResponse(attendance=attendance, leave=leave, payroll=payroll, attendance_trend=trend)


async def _employee_statistics(db: AsyncSession) -> EmployeeStatistics:
    total = await db.scalar(select(func.count()).select_from(Employee))
    active = await db.scalar(
        select(func.count())
        .select_from(Employee)
        .join(User, Employee.user_id == User.id)
        .where(User.is_active.is_(True))
    )
    dept_rows = (await db.execute(select(Employee.department, func.count()).group_by(Employee.department))).all()
    department_distribution = [
        DepartmentCount(department=department or "Unassigned", count=count) for department, count in dept_rows
    ]
    return EmployeeStatistics(
        total_employees=total or 0, active_employees=active or 0, department_distribution=department_distribution
    )


async def _payroll_analytics_admin(db: AsyncSession) -> PayrollAnalyticsAdmin:
    totals = (await db.execute(select(func.sum(Payroll.net_salary), func.avg(Payroll.net_salary)))).one()
    total_payroll = float(totals[0] or 0)
    average_salary = float(totals[1] or 0)

    dept_rows = (
        await db.execute(
            select(Employee.department, func.sum(Payroll.net_salary))
            .join(Payroll, Payroll.employee_id == Employee.id)
            .group_by(Employee.department)
        )
    ).all()
    department_payroll = [
        DepartmentPayroll(department=department or "Unassigned", total=float(total or 0))
        for department, total in dept_rows
    ]
    return PayrollAnalyticsAdmin(
        total_payroll=total_payroll, average_salary=average_salary, department_payroll=department_payroll
    )


async def get_admin_analytics(
    db: AsyncSession, start_date: date_ | None, end_date: date_ | None
) -> AnalyticsAdminResponse:
    employees_stats = await _employee_statistics(db)
    attendance = await _attendance_analytics(db, None, start_date, end_date)
    trend = await _attendance_trend(db, None, start_date, end_date)
    leave = await _leave_analytics(db, None, start_date, end_date)
    payroll = await _payroll_analytics_admin(db)

    return AnalyticsAdminResponse(
        employees=employees_stats, attendance=attendance, attendance_trend=trend, leave=leave, payroll=payroll
    )
