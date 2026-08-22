import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { NotificationFeed } from "@/components/notifications/NotificationFeed";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";

export function NotificationsPageContent() {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button type="button" variant="secondary" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <NotificationFeed
          notifications={data?.items}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onMarkRead={(id) => markRead.mutate(id)}
        />
      </Card>
    </div>
  );
}
