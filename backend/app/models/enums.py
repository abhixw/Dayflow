import enum


class Role(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    HR = "HR"
    ADMIN = "ADMIN"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    LEAVE = "LEAVE"


class LeaveType(str, enum.Enum):
    PAID = "PAID"
    SICK = "SICK"
    UNPAID = "UNPAID"


class LeaveStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class NotificationType(str, enum.Enum):
    LEAVE_SUBMITTED = "LEAVE_SUBMITTED"
    LEAVE_APPROVED = "LEAVE_APPROVED"
    LEAVE_REJECTED = "LEAVE_REJECTED"
    PAYROLL_UPDATED = "PAYROLL_UPDATED"
    ATTENDANCE_ALERT = "ATTENDANCE_ALERT"
    PROFILE_UPDATED = "PROFILE_UPDATED"
    SYSTEM = "SYSTEM"
