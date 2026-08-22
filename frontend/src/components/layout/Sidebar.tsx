import { NavLink } from "react-router-dom";
import { LogOut, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useEmployees";

export interface SidebarNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: SidebarNavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ items, isOpen, onClose }: SidebarProps) {
  const { logout } = useAuth();
  const { data: employee } = useMe();

  const initials = employee?.name
    ? employee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AM";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/60 lg:hidden backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col border-r border-white/5 bg-[#0B091A] transition-transform lg:static lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo Section */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-700 to-indigo-500 font-serif text-lg font-bold text-white shadow-lg shadow-indigo-500/20">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-sans text-sm font-semibold tracking-wide text-white">Dayflow</span>
              <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-widest leading-none mt-0.5">HRMS</span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close menu" className="text-slate-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-white/5 text-white font-semibold shadow-inner border-l-2 border-indigo-500"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 shrink-0 opacity-80" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Profile card */}
        <div className="border-t border-white/5 p-4 bg-white/[0.01]">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 font-bold text-white text-sm shadow-md shadow-indigo-600/10">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white leading-snug">
                {employee?.name || "Aarav Mehta"}
              </p>
              <p className="truncate text-xs text-slate-400">
                {employee?.jobTitle || "Employee"}
              </p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/5 hover:text-white hover:border-white/15 transition-all duration-200"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
