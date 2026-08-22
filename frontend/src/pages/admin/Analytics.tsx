import { useState } from "react";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { StatCard } from "@/components/analytics/StatCard";
import { AttendanceTrendChart } from "@/components/analytics/AttendanceTrendChart";
import { AttendanceStatusChart } from "@/components/analytics/AttendanceStatusChart";
import { LeaveTypeChart } from "@/components/analytics/LeaveTypeChart";
import { DepartmentBarChart } from "@/components/analytics/DepartmentBarChart";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/utils/formatters";
import { useAdminAnalytics } from "@/hooks/useAnalytics";

export default function Analytics() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data, isLoading, isError, refetch } = useAdminAnalytics({
    start_date: startDate || undefined,
    end_date: endDate || undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Organization Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Attendance, leave, and payroll across the team.</p>
        </div>
        <div className="flex gap-3">
          <Input label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {isLoading && <LoadingState label="Loading analytics..." />}
      {isError && <ErrorState message="Unable to load analytics." onRetry={() => refetch()} />}

      {!isLoading && !isError && data && (
        <>
          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-700">Employees</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard label="Total Employees" value={data.employees.totalEmployees} tone="emphasize" />
              <StatCard label="Active Employees" value={data.employees.activeEmployees} />
            </div>
            <DepartmentBarChart
              title="Department Distribution"
              data={data.employees.departmentDistribution.map((d) => ({ department: d.department, value: d.count }))}
            />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-700">Attendance</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Present" value={data.attendance.present} />
              <StatCard label="Absent" value={data.attendance.absent} />
              <StatCard label="Half Day" value={data.attendance.halfDay} />
              <StatCard label="Leave" value={data.attendance.leave} />
              <StatCard label="Attendance %" value={`${data.attendance.percentage}%`} tone="emphasize" />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <AttendanceTrendChart data={data.attendanceTrend} />
              <AttendanceStatusChart data={data.attendance} />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-700">Leave</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard label="Total" value={data.leave.total} />
              <StatCard label="Pending" value={data.leave.pending} />
              <StatCard label="Approved" value={data.leave.approved} />
              <StatCard label="Rejected" value={data.leave.rejected} />
            </div>
            <LeaveTypeChart data={data.leave} />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-700">Payroll</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <StatCard label="Total Payroll" value={formatCurrency(data.payroll.totalPayroll)} tone="emphasize" />
              <StatCard label="Average Salary" value={formatCurrency(data.payroll.averageSalary)} tone="emphasize" />
            </div>
            <DepartmentBarChart
              title="Payroll by Department"
              data={data.payroll.departmentPayroll.map((d) => ({ department: d.department, value: d.total }))}
              valueFormatter={(value) => formatCurrency(value)}
              barColor="#10b981"
            />
          </section>
        </>
      )}
    </div>
  );
}
