import { Users, Clock, Calendar, Wallet } from "lucide-react";
import { QuickAccessCard } from "@/components/common/QuickAccessCard";
import { RecentNotificationsCard } from "@/components/notifications/RecentNotificationsCard";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useEmployees";
import { ROUTES } from "@/utils/constants";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: employee } = useMe();

  // Resolve display name: prefer full employee name, fall back to email prefix
  const displayName =
    employee?.name ??
    (user?.email ? user.email.split("@")[0] : null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome{displayName ? `, ${displayName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Here's quick access to what you need.</p>
      </div>

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

      <RecentNotificationsCard viewAllRoute={ROUTES.adminNotifications} />
    </div>
  );
}
