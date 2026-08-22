from datetime import date

from app.schemas.base import CamelModel


class AttendanceAnalytics(CamelModel):
    total: int
    present: int
    absent: int
    half_day: int
    leave: int
    percentage: float


class AttendanceTrendPoint(CamelModel):
    date: date
    present: int
    absent: int
    half_day: int
    leave: int


class LeaveAnalytics(CamelModel):
    total: int
    pending: int
    approved: int
    rejected: int
    paid: int
    sick: int
    unpaid: int


class PayrollAnalyticsSelf(CamelModel):
    basic_salary: float
    allowances: float
    deductions: float
    gross_salary: float
    net_salary: float


class AnalyticsEmployeeResponse(CamelModel):
    attendance: AttendanceAnalytics
    leave: LeaveAnalytics
    payroll: PayrollAnalyticsSelf | None
    attendance_trend: list[AttendanceTrendPoint]


class DepartmentCount(CamelModel):
    department: str
    count: int


class EmployeeStatistics(CamelModel):
    total_employees: int
    active_employees: int
    department_distribution: list[DepartmentCount]


class DepartmentPayroll(CamelModel):
    department: str
    total: float


class PayrollAnalyticsAdmin(CamelModel):
    total_payroll: float
    average_salary: float
    department_payroll: list[DepartmentPayroll]


class AnalyticsAdminResponse(CamelModel):
    employees: EmployeeStatistics
    attendance: AttendanceAnalytics
    attendance_trend: list[AttendanceTrendPoint]
    leave: LeaveAnalytics
    payroll: PayrollAnalyticsAdmin
