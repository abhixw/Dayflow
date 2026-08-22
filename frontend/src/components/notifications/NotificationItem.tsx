import { formatRelativeTime } from "@/utils/formatters";
import type { Notification } from "@/types/notification";

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (notificationId: string) => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={() => !notification.isRead && onMarkRead(notification.id)}
      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
        notification.isRead ? "" : "bg-brand-50/40"
      }`}
    >
      <span
        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-brand-500"}`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className={`block text-sm ${notification.isRead ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}>
          {notification.title}
        </span>
        <span className="mt-0.5 block text-sm text-slate-500">{notification.message}</span>
        <span className="mt-1 block text-xs text-slate-400">{formatRelativeTime(notification.createdAt)}</span>
      </span>
    </button>
  );
}
