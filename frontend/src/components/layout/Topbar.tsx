import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatRole } from "@/utils/formatters";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <button onClick={onMenuClick} aria-label="Open menu" className="text-slate-500 hover:text-slate-700 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center justify-end gap-3">
        <NotificationBell />
        {user && (
          <div className="text-right">
            <p className="text-sm font-medium text-slate-900">{user.email}</p>
            <p className="text-xs text-slate-500">{formatRole(user.role)}</p>
          </div>
        )}
      </div>
    </header>
  );
}
