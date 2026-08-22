import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "@/api/employees";
import type { EmployeeAdminUpdatePayload, EmployeeUpdatePayload } from "@/types/employee";

const meQueryKey = ["employees", "me"];
const listQueryKey = ["employees", "list"];
const employeeQueryKey = (employeeId: string) => ["employees", employeeId];

export function useMe() {
  return useQuery({ queryKey: meQueryKey, queryFn: employeesApi.getMe });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeeUpdatePayload) => employeesApi.updateMe(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meQueryKey }),
  });
}

export function useUpdateMyProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => employeesApi.updateMyProfilePicture(file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: meQueryKey }),
  });
}

export function useEmployeesList() {
  return useQuery({ queryKey: listQueryKey, queryFn: employeesApi.list });
}

export function useEmployee(employeeId: string) {
  return useQuery({
    queryKey: employeeQueryKey(employeeId),
    queryFn: () => employeesApi.getById(employeeId),
    enabled: Boolean(employeeId),
  });
}

export function useUpdateEmployee(employeeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeeAdminUpdatePayload) => employeesApi.update(employeeId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKey(employeeId) });
      queryClient.invalidateQueries({ queryKey: listQueryKey });
    },
  });
}
