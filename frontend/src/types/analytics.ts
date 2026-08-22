export interface AttendanceAnalytics {
  total: number;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
  percentage: number;
}

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  absent: number;
  halfDay: number;
  leave: number;
}

export interface LeaveAnalytics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  paid: number;
  sick: number;
  unpaid: number;
}

export interface PayrollAnalyticsSelf {
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
}

export interface AnalyticsEmployee {
  attendance: AttendanceAnalytics;
  leave: LeaveAnalytics;
  payroll: PayrollAnalyticsSelf | null;
  attendanceTrend: AttendanceTrendPoint[];
}

export interface DepartmentCount {
  department: string;
  count: number;
}

export interface EmployeeStatistics {
  totalEmployees: number;
  activeEmployees: number;
  departmentDistribution: DepartmentCount[];
}

export interface DepartmentPayroll {
  department: string;
  total: number;
}

export interface PayrollAnalyticsAdmin {
  totalPayroll: number;
  averageSalary: number;
  departmentPayroll: DepartmentPayroll[];
}

export interface AnalyticsAdmin {
  employees: EmployeeStatistics;
  attendance: AttendanceAnalytics;
  attendanceTrend: AttendanceTrendPoint[];
  leave: LeaveAnalytics;
  payroll: PayrollAnalyticsAdmin;
}

export interface AnalyticsDateRange {
  start_date?: string;
  end_date?: string;
}
