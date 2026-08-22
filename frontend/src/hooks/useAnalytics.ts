import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics";
import type { AnalyticsDateRange } from "@/types/analytics";

export function useMyAnalytics(params?: AnalyticsDateRange) {
  return useQuery({
    queryKey: ["analytics", "me", params],
    queryFn: () => analyticsApi.getMine(params),
  });
}

export function useAdminAnalytics(params?: AnalyticsDateRange) {
  return useQuery({
    queryKey: ["analytics", "admin", params],
    queryFn: () => analyticsApi.getAdmin(params),
  });
}
