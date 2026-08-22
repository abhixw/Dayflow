export type NotificationType =
  | "LEAVE_SUBMITTED"
  | "LEAVE_APPROVED"
  | "LEAVE_REJECTED"
  | "PAYROLL_UPDATED"
  | "ATTENDANCE_ALERT"
  | "PROFILE_UPDATED"
  | "SYSTEM";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: Notification[];
  unreadCount: number;
}

export interface UnreadCount {
  unreadCount: number;
}
