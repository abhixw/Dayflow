import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { NotificationFeed } from "@/components/notifications/NotificationFeed";
import { useMarkNotificationRead, useNotifications } from "@/hooks/useNotifications";

const RECENT_LIMIT = 5;

export function RecentNotificationsCard({ viewAllRoute }: { viewAllRoute: string }) {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Recent Notifications</p>
        <Link to={viewAllRoute} className="text-xs font-medium text-brand-600 hover:underline">
          View all
        </Link>
      </div>
      <NotificationFeed
        notifications={data?.items.slice(0, RECENT_LIMIT)}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        onMarkRead={(id) => markRead.mutate(id)}
      />
    </Card>
  );
}
