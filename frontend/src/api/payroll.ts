import { apiClient } from "@/api/client";
import type { Payroll, PayrollUpdatePayload } from "@/types/payroll";

export const payrollApi = {
  getMine: () => apiClient.get<Payroll>("/api/payroll/me"),
  getByEmployee: (employeeId: string) => apiClient.get<Payroll>(`/api/payroll/${employeeId}`),
  update: (employeeId: string, payload: PayrollUpdatePayload) =>
    apiClient.patch<Payroll>(`/api/payroll/${employeeId}`, payload),
};
