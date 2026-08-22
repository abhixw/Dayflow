import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import type { Notification } from "@/types/notification";

interface NotificationFeedProps {
  notifications: Notification[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onMarkRead: (notificationId: string) => void;
  onRetry?: () => void;
  emptyMessage?: string;
}

export function NotificationFeed({
  notifications,
  isLoading,
  isError,
  onMarkRead,
  onRetry,
  emptyMessage = "No notifications yet.",
}: NotificationFeedProps) {
  if (isLoading) return <LoadingState label="Loading notifications..." />;
  if (isError) return <ErrorState message="Unable to load notifications." onRetry={onRetry} />;
  if (!notifications || notifications.length === 0) return <EmptyState message={emptyMessage} />;

  return (
    <div className="divide-y divide-slate-100">
      {notifications.map((notification) => (
        <NotificationItem key={notification.id} notification={notification} onMarkRead={onMarkRead} />
      ))}
    </div>
  );
}
