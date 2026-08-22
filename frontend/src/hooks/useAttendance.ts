import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/api/attendance";
import type { AttendanceDateRange } from "@/types/attendance";

const attendanceQueryKey = (params?: AttendanceDateRange) => ["attendance", "me", params ?? {}];

export function useMyAttendance(params?: AttendanceDateRange) {
  return useQuery({
    queryKey: attendanceQueryKey(params),
    queryFn: () => attendanceApi.getMine(params),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "me"] }),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance", "me"] }),
  });
}

export function useAllAttendance(employeeId: string, params?: AttendanceDateRange) {
  return useQuery({
    queryKey: ["attendance", "all", employeeId || "all", params ?? {}],
    queryFn: () => (employeeId ? attendanceApi.getByEmployee(employeeId, params) : attendanceApi.getAll(params)),
  });
}
