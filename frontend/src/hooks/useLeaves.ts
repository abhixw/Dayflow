import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { leavesApi } from "@/api/leaves";
import type { CreateLeavePayload, ReviewLeavePayload } from "@/types/leave";

const myLeavesQueryKey = ["leaves", "me"];
const allLeavesQueryKey = ["leaves", "all"];

export function useMyLeaves() {
  return useQuery({ queryKey: myLeavesQueryKey, queryFn: leavesApi.getMine });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => leavesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: myLeavesQueryKey }),
  });
}

export function useAllLeaves() {
  return useQuery({ queryKey: allLeavesQueryKey, queryFn: leavesApi.listAll });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, payload }: { leaveId: string; payload: ReviewLeavePayload }) =>
      leavesApi.approve(leaveId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leaveId, payload }: { leaveId: string; payload: ReviewLeavePayload }) =>
      leavesApi.reject(leaveId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["leaves"] }),
  });
}
