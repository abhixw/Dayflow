import { apiClient } from "@/api/client";
import type { Employee, EmployeeAdminUpdatePayload, EmployeeUpdatePayload } from "@/types/employee";

export const employeesApi = {
  getMe: () => apiClient.get<Employee>("/api/employees/me"),
  updateMe: (payload: EmployeeUpdatePayload) => apiClient.patch<Employee>("/api/employees/me", payload),
  // Upload mechanism unconfirmed against the real backend; assumes the same
  // PATCH endpoint accepts a multipart "profilePicture" field.
  updateMyProfilePicture: (file: File) => {
    const formData = new FormData();
    formData.append("profilePicture", file);
    return apiClient.patch<Employee>("/api/employees/me", formData);
  },

  list: () => apiClient.get<Employee[]>("/api/employees"),
  getById: (employeeId: string) => apiClient.get<Employee>(`/api/employees/${employeeId}`),
  update: (employeeId: string, payload: EmployeeAdminUpdatePayload) =>
    apiClient.patch<Employee>(`/api/employees/${employeeId}`, payload),
};
