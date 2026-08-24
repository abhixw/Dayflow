import { Users, Clock, Calendar, Wallet } from "lucide-react";
import { QuickAccessCard } from "@/components/common/QuickAccessCard";
import { StatTile } from "@/components/common/StatTile";
import { RecentNotificationsCard } from "@/components/notifications/RecentNotificationsCard";
import { LoadingState } from "@/components/common/LoadingState";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useEmployees";
import { useAdminAnalytics } from "@/hooks/useAnalytics";
import { formatCurrency } from "@/utils/formatters";
import { ROUTES } from "@/utils/constants";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: employee } = useMe();
  const { data: analytics, isLoading } = useAdminAnalytics();

  const displayName = employee?.name ?? (user?.email ? user.email.split("@")[0] : null);

  return (
    <div className="flex flex-col gap-8 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0B091A]">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">Here's how the org is doing today.</p>
      </div>

      {isLoading && <LoadingState label="Loading overview..." />}

      {!isLoading && analytics && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={Users}
            label="Active employees"
            value={analytics.employees.activeEmployees}
            sublabel={`${analytics.employees.totalEmployees} total`}
          />
          <StatTile
            icon={Clock}
            label="Attendance rate"
            value={`${Math.round(analytics.attendance.percentage)}%`}
            sublabel="This period"
          />
          <StatTile
            icon={Calendar}
            label="Pending leave requests"
            value={analytics.leave.pending}
            sublabel={`${analytics.leave.total} total`}
          />
          <StatTile
            icon={Wallet}
            label="Total payroll"
            value={formatCurrency(analytics.payroll.totalPayroll)}
            sublabel="Per month"
          />
        </div>
      )}

      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Quick access</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAccessCard
            label="Employees"
            description="View and manage employee records"
            to={ROUTES.adminEmployees}
            icon={Users}
          />
          <QuickAccessCard
            label="Attendance"
            description="View attendance across the team"
            to={ROUTES.adminAttendance}
            icon={Clock}
          />
          <QuickAccessCard
            label="Leave Requests"
            description="Review and approve leave requests"
            to={ROUTES.adminLeaves}
            icon={Calendar}
          />
          <QuickAccessCard
            label="Payroll"
            description="View and update salary structures"
            to={ROUTES.adminPayroll}
            icon={Wallet}
          />
        </div>
      </div>

      <RecentNotificationsCard viewAllRoute={ROUTES.adminNotifications} />
    </div>
  );
}
