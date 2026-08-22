import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, User, Clock, Calendar, Wallet, Bell, BarChart3 } from "lucide-react";
import { Sidebar, type SidebarNavItem } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ROUTES } from "@/utils/constants";

const navItems: SidebarNavItem[] = [
  { label: "Dashboard", to: ROUTES.employeeDashboard, icon: LayoutDashboard },
  { label: "Profile", to: ROUTES.employeeProfile, icon: User },
  { label: "Attendance", to: ROUTES.employeeAttendance, icon: Clock },
  { label: "Leave Requests", to: ROUTES.employeeLeaves, icon: Calendar },
  { label: "Payroll", to: ROUTES.employeePayroll, icon: Wallet },
  { label: "Analytics", to: ROUTES.employeeAnalytics, icon: BarChart3 },
  { label: "Notifications", to: ROUTES.employeeNotifications, icon: Bell },
];

export default function EmployeeLayout() {
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
