import { apiClient } from "@/api/client";
import type { CreateLeavePayload, LeaveRequest, ReviewLeavePayload } from "@/types/leave";

export const leavesApi = {
  create: (payload: CreateLeavePayload) => apiClient.post<LeaveRequest>("/api/leaves", payload),
  getMine: () => apiClient.get<LeaveRequest[]>("/api/leaves/me"),
  getById: (leaveId: string) => apiClient.get<LeaveRequest>(`/api/leaves/${leaveId}`),

  listAll: () => apiClient.get<LeaveRequest[]>("/api/leaves"),
  approve: (leaveId: string, payload: ReviewLeavePayload) =>
    apiClient.patch<LeaveRequest>(`/api/leaves/${leaveId}/approve`, payload),
  reject: (leaveId: string, payload: ReviewLeavePayload) =>
    apiClient.patch<LeaveRequest>(`/api/leaves/${leaveId}/reject`, payload),
};
