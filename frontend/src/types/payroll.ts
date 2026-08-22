export interface Payroll {
  employeeId: string;
  basicSalary: number;
  allowances: number;
  deductions: number;
  grossSalary: number;
  netSalary: number;
}

// Gross/net salary are excluded: the backend computes them, the frontend never derives payroll values itself.
export interface PayrollUpdatePayload {
  basicSalary: number;
  allowances: number;
  deductions: number;
}
