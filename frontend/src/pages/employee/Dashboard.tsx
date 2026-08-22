import { User, Clock, Calendar, Wallet } from "lucide-react";
import { QuickAccessCard } from "@/components/common/QuickAccessCard";
import { RecentNotificationsCard } from "@/components/notifications/RecentNotificationsCard";
import { useMe } from "@/hooks/useEmployees";
import { ROUTES } from "@/utils/constants";

export default function Dashboard() {
  const { data: employee, isLoading } = useMe();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          {isLoading ? (
            <span className="inline-block h-7 w-48 animate-pulse rounded bg-slate-200" />
          ) : (
            `Welcome, ${employee?.name ?? ""}`
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here's quick access to what you need.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAccessCard
          label="Profile"
          description="View and update your details"
          to={ROUTES.employeeProfile}
          icon={User}
        />
        <QuickAccessCard
          label="Attendance"
          description="Check in and view your records"
          to={ROUTES.employeeAttendance}
          icon={Clock}
        />
        <QuickAccessCard
          label="Leave Requests"
          description="Apply for leave and track status"
          to={ROUTES.employeeLeaves}
          icon={Calendar}
        />
        <QuickAccessCard
          label="Payroll"
          description="View your salary details"
          to={ROUTES.employeePayroll}
          icon={Wallet}
        />
      </div>

      <RecentNotificationsCard viewAllRoute={ROUTES.employeeNotifications} />
    </div>
  );
}
