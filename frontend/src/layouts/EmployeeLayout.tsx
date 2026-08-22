import { useState } from "react";
import { Outlet } from "react-router-dom";
import { LayoutDashboard, User, Clock, Calendar, Wallet } from "lucide-react";
import { Sidebar, type SidebarNavItem } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { ROUTES } from "@/utils/constants";

const navItems: SidebarNavItem[] = [
  { label: "Dashboard", to: ROUTES.employeeDashboard, icon: LayoutDashboard },
  { label: "My profile", to: ROUTES.employeeProfile, icon: User },
  { label: "Attendance", to: ROUTES.employeeAttendance, icon: Clock },
  { label: "Time off", to: ROUTES.employeeLeaves, icon: Calendar },
  { label: "Payroll", to: ROUTES.employeePayroll, icon: Wallet },
];

export default function EmployeeLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full bg-[#F8F9FC]">
      <Sidebar items={navItems} isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto px-6 pb-8 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
