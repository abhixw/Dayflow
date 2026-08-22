import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between bg-transparent px-4 lg:px-6">
      <button onClick={onMenuClick} aria-label="Open menu" className="text-slate-500 hover:text-slate-700 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center justify-end">
        <NotificationBell />
      </div>
    </header>
  );
}
