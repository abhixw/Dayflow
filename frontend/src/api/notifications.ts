import { apiClient } from "@/api/client";
import type { Notification, NotificationList, UnreadCount } from "@/types/notification";

export const notificationsApi = {
  list: () => apiClient.get<NotificationList>("/api/notifications"),
  unreadCount: () => apiClient.get<UnreadCount>("/api/notifications/unread-count"),
  markRead: (notificationId: string) =>
    apiClient.patch<Notification>(`/api/notifications/${notificationId}/read`),
  markAllRead: () => apiClient.patch<void>("/api/notifications/read-all"),
};
