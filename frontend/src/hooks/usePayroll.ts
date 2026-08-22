import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "@/api/payroll";
import type { PayrollUpdatePayload } from "@/types/payroll";

const myPayrollQueryKey = ["payroll", "me"];
const payrollQueryKey = (employeeId: string) => ["payroll", employeeId];

export function useMyPayroll() {
  return useQuery({ queryKey: myPayrollQueryKey, queryFn: payrollApi.getMine });
}

export function useEmployeePayroll(employeeId: string) {
  return useQuery({
    queryKey: payrollQueryKey(employeeId),
    queryFn: () => payrollApi.getByEmployee(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function useUpdatePayroll(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PayrollUpdatePayload) => payrollApi.update(employeeId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: payrollQueryKey(employeeId) }),
  });
}
