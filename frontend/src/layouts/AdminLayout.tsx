import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Clock, Calendar, Wallet, Bell, BarChart3 } from "lucide-react";
import { Sidebar, type SidebarNavItem } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ROUTES } from "@/utils/constants";

const navItems: SidebarNavItem[] = [
  { label: "Dashboard", to: ROUTES.adminDashboard, icon: LayoutDashboard },
  { label: "Employees", to: ROUTES.adminEmployees, icon: Users },
  { label: "Attendance", to: ROUTES.adminAttendance, icon: Clock },
  { label: "Leave Requests", to: ROUTES.adminLeaves, icon: Calendar },
  { label: "Payroll", to: ROUTES.adminPayroll, icon: Wallet },
  { label: "Analytics", to: ROUTES.adminAnalytics, icon: BarChart3 },
  { label: "Notifications", to: ROUTES.adminNotifications, icon: Bell },
];

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar items={navItems} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
