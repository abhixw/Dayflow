import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/api/notifications";

const notificationsKey = ["notifications", "list"];
const unreadCountKey = ["notifications", "unread-count"];

export function useNotifications() {
  return useQuery({ queryKey: notificationsKey, queryFn: notificationsApi.list });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: unreadCountKey,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationsApi.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey });
      queryClient.invalidateQueries({ queryKey: unreadCountKey });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKey });
      queryClient.invalidateQueries({ queryKey: unreadCountKey });
    },
  });
}
