import { apiClient } from "@/api/client";
import type { AnalyticsAdmin, AnalyticsDateRange, AnalyticsEmployee } from "@/types/analytics";

function toQueryString(params?: AnalyticsDateRange): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.start_date) search.set("start_date", params.start_date);
  if (params.end_date) search.set("end_date", params.end_date);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const analyticsApi = {
  getMine: (params?: AnalyticsDateRange) =>
    apiClient.get<AnalyticsEmployee>(`/api/analytics/me${toQueryString(params)}`),
  getAdmin: (params?: AnalyticsDateRange) =>
    apiClient.get<AnalyticsAdmin>(`/api/analytics/admin${toQueryString(params)}`),
};
