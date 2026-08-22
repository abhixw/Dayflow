class DuplicateEmailError(Exception):
    pass


class DuplicateEmployeeIdError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class InactiveUserError(Exception):
    pass


class EmployeeNotFoundError(Exception):
    pass


class DuplicateCheckInError(Exception):
    pass


class CheckOutBeforeCheckInError(Exception):
    pass


class DuplicateCheckOutError(Exception):
    pass


class LeaveNotFoundError(Exception):
    pass


class OverlappingLeaveError(Exception):
    pass


class LeaveNotPendingError(Exception):
    pass


class PayrollNotFoundError(Exception):
    pass
