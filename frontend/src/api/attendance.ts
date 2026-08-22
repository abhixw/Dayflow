import { apiClient } from "@/api/client";
import type { AttendanceDateRange, AttendanceRecord } from "@/types/attendance";

function toQueryString(params?: AttendanceDateRange): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.start_date) search.set("start_date", params.start_date);
  if (params.end_date) search.set("end_date", params.end_date);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const attendanceApi = {
  checkIn: () => apiClient.post<AttendanceRecord>("/api/attendance/check-in"),
  checkOut: () => apiClient.post<AttendanceRecord>("/api/attendance/check-out"),
  getMine: (params?: AttendanceDateRange) =>
    apiClient.get<AttendanceRecord[]>(`/api/attendance/me${toQueryString(params)}`),

  getAll: (params?: AttendanceDateRange) =>
    apiClient.get<AttendanceRecord[]>(`/api/attendance${toQueryString(params)}`),
  getByEmployee: (employeeId: string, params?: AttendanceDateRange) =>
    apiClient.get<AttendanceRecord[]>(`/api/attendance/${employeeId}${toQueryString(params)}`),
};
