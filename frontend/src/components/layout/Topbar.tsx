import { Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { formatRole } from "@/utils/formatters";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ROUTES } from "@/utils/constants";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = location.pathname === ROUTES.employeeDashboard;

  return (
    <header
      className={`flex h-16 shrink-0 items-center justify-between px-4 lg:px-6 transition-all ${
        isDashboard ? "bg-transparent border-b-0" : "border-b border-slate-200 bg-white"
      }`}
    >
      <button
        onClick={onMenuClick}
        aria-label="Open menu"
        className={`text-slate-500 hover:text-slate-700 lg:hidden ${isDashboard ? "mt-4" : ""}`}
      >
        <Menu className="h-5 w-5" />
      </button>

      {!isDashboard && (
        <div className="flex flex-1 items-center justify-end gap-3">
          <NotificationBell />
          {user && (
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user.email}</p>
              <p className="text-xs text-slate-500">{formatRole(user.role)}</p>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
