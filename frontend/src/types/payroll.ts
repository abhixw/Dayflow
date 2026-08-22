export interface Payroll {
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
}

// No automatic calculation: the backend stores exactly what HR enters here,
// gross/net included (the MVP spec explicitly excludes automated payroll math).
export interface PayrollUpdatePayload {
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
}
