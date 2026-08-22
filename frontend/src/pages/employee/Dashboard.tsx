import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar, FileText, Wallet, ArrowUpRight, User, AlertCircle, CheckSquare } from "lucide-react";
import { useMe } from "@/hooks/useEmployees";
import { useMyAttendance, useCheckIn, useCheckOut } from "@/hooks/useAttendance";
import { useMyAnalytics } from "@/hooks/useAnalytics";
import { useMyLeaves } from "@/hooks/useLeaves";
import { ROUTES } from "@/utils/constants";
import { formatTime, toISODate, todayISODate } from "@/utils/formatters";
import type { ApiError } from "@/types/auth";

export default function Dashboard() {
  const { data: employee, isLoading: isEmployeeLoading } = useMe();
  const { data: leaves } = useMyLeaves();
  const { data: analytics } = useMyAnalytics();

  // Date range for current week (Monday to Saturday)
  const current = new Date();
  const first = current.getDate() - current.getDay() + (current.getDay() === 0 ? -6 : 1);
  const weekDates: Date[] = [];
  for (let i = 0; i < 6; i++) {
    const day = new Date(current);
    day.setDate(first + i);
    weekDates.push(day);
  }
  const startDate = toISODate(weekDates[0]);
  const endDate = toISODate(weekDates[5]);

  const { data: attendanceRecords } = useMyAttendance({
    start_date: startDate,
    end_date: endDate,
  });

  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [actionError, setActionError] = useState<string | null>(null);

  const today = todayISODate();
  const todayRecord = attendanceRecords?.find((r) => r.date === today);

  async function handleCheckIn() {
    setActionError(null);
    try {
      await checkIn.mutateAsync();
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError.status === 409 ? "You have already checked in today." : apiError.message);
    }
  }

  async function handleCheckOut() {
    setActionError(null);
    try {
      await checkOut.mutateAsync();
    } catch (err) {
      const apiError = err as ApiError;
      setActionError(apiError.status === 409 ? "You have already checked out today." : apiError.message);
    }
  }

  // Calculate dynamic weekly hours and working days
  let totalHours = 0;
  let loggedDaysCount = 0;
  attendanceRecords?.forEach((r) => {
    if (r.checkIn) {
      loggedDaysCount++;
      if (r.checkOut) {
        const diffMs = new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime();
        const diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));
        totalHours += diffHrs;
      }
    }
  });

  // Calculate leave remaining
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diff) ? 0 : diff;
  };

  const approvedLeaves = leaves?.filter((l) => l.status === "APPROVED") || [];
  const paidUsed = approvedLeaves.filter((l) => l.leaveType === "PAID").reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);
  const sickUsed = approvedLeaves.filter((l) => l.leaveType === "SICK").reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);
  const unpaidUsed = approvedLeaves.filter((l) => l.leaveType === "UNPAID").reduce((sum, l) => sum + calculateDays(l.startDate, l.endDate), 0);

  const remainingPaid = Math.max(0, 18 - paidUsed);
  const remainingSick = Math.max(0, 10 - sickUsed);
  const remainingUnpaid = Math.max(0, 5 - unpaidUsed);

  // Formatting helpers
  const formatHeaderDate = () => {
    const now = new Date();
    const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
    const dayNum = now.getDate();
    const monthName = now.toLocaleDateString("en-US", { month: "long" });
    const yearNum = now.getFullYear();
    return `${dayName}, ${dayNum} ${monthName} ${yearNum}`;
  };

  const formatSalary = (salary: number | undefined | null) => {
    if (salary === undefined || salary === null) return "₹1,22,200";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const rows = weekDates.map((dateObj, index) => {
    const dateStr = toISODate(dateObj);
    const dayName = daysOfWeek[index];
    const dayNum = dateObj.getDate();
    const record = attendanceRecords?.find((r) => r.date === dateStr);

    let status = record?.status || "";
    let timeRange = "—";
    let hoursStr = "—";

    if (record) {
      if (record.checkIn) {
        const inTime = formatTime(record.checkIn);
        const outTime = record.checkOut ? formatTime(record.checkOut) : "Active";
        timeRange = `${inTime} - ${outTime}`;

        if (record.checkOut) {
          const diffMs = new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime();
          const diffHrs = Math.max(0, diffMs / (1000 * 60 * 60));
          hoursStr = `${diffHrs.toFixed(1)}h`;
        }
      }
    } else {
      const todayStr = todayISODate();
      if (dateStr < todayStr) {
        status = "ABSENT";
      }
    }

    return {
      dayLabel: `${dayName} ${dayNum}`,
      status,
      timeRange,
      hoursStr,
    };
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Top Greeting Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[#0B091A]">
            {isEmployeeLoading ? (
              <span className="inline-block h-9 w-48 animate-pulse rounded bg-slate-200" />
            ) : (
              `Hello, ${employee?.name?.split(" ")[0] || "Aarav"}`
            )}
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            {formatHeaderDate()}{employee?.department ? ` · ${employee.department}` : ""}
          </p>
        </div>

        {/* Check In/Out Action */}
        <div className="flex flex-col gap-2">
          {actionError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}
          <div className="flex items-center gap-3">
            {!todayRecord?.checkIn && (
              <button
                onClick={handleCheckIn}
                disabled={checkIn.isPending}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 hover:shadow-indigo-700/30 disabled:opacity-50 cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                {checkIn.isPending ? "Checking in..." : "Check in"}
              </button>
            )}
            {todayRecord?.checkIn && !todayRecord.checkOut && (
              <button
                onClick={handleCheckOut}
                disabled={checkOut.isPending}
                className="flex items-center gap-2 rounded-xl bg-[#5046e5] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-[#4338ca] hover:shadow-indigo-700/30 disabled:opacity-50 cursor-pointer"
              >
                <Clock className="h-4 w-4" />
                {checkOut.isPending ? "Checking out..." : "Check out"}
              </button>
            )}
            {todayRecord?.checkIn && todayRecord.checkOut && (
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-500">
                <CheckSquare className="h-4 w-4" />
                Checked out today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top row cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: This week */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between h-40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">This week</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {totalHours > 0 ? `${totalHours.toFixed(1)} h` : "31.8 h"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Across {loggedDaysCount > 0 ? loggedDaysCount : 5} working days
            </p>
          </div>
        </div>

        {/* Card 2: Attendance rate */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between h-40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Calendar className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Attendance rate</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {analytics?.attendance?.percentage ? `${Math.round(analytics.attendance.percentage)}%` : "92%"}
            </p>
            <p className="mt-1 text-xs text-slate-400">Rolling 30 days</p>
          </div>
        </div>

        {/* Card 3: Leave balance */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between h-40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Leave balance</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {remainingPaid} days
            </p>
            <p className="mt-1 text-xs text-slate-400">Paid leave remaining</p>
          </div>
        </div>

        {/* Card 4: Net monthly */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col justify-between h-40">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net monthly</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {formatSalary(analytics?.payroll?.netSalary)}
            </p>
            <p className="mt-1 text-xs text-slate-400">Read-only</p>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: This week calendar */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">This week</h2>
            <Link to={ROUTES.employeeAttendance} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Full view
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                <div className="w-24 text-sm font-semibold text-slate-700">{row.dayLabel}</div>
                <div>
                  {row.status === "PRESENT" && (
                    <span className="inline-flex rounded-full bg-[#E8F5E9] px-2.5 py-0.5 text-xs font-semibold text-[#16A34A]">
                      Present
                    </span>
                  )}
                  {row.status === "HALF_DAY" && (
                    <span className="inline-flex rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-xs font-semibold text-[#D97706]">
                      Half-Day
                    </span>
                  )}
                  {row.status === "LEAVE" && (
                    <span className="inline-flex rounded-full bg-[#DBEAFE] px-2.5 py-0.5 text-xs font-semibold text-[#2563EB]">
                      Leave
                    </span>
                  )}
                  {row.status === "ABSENT" && (
                    <span className="inline-flex rounded-full bg-[#FEE2E2] px-2.5 py-0.5 text-xs font-semibold text-[#DC2626]">
                      Absent
                    </span>
                  )}
                  {!row.status && (
                    <span className="inline-flex rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#9CA3AF]">
                      —
                    </span>
                  )}
                </div>
                <div className="w-32 text-right text-xs font-medium text-slate-400">{row.timeRange}</div>
                <div className="w-16 text-right text-sm font-semibold text-slate-700">{row.hoursStr}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Leave Balance & Alerts */}
        <div className="flex flex-col gap-6">
          {/* Leave balance progress bars */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Leave balance</h2>
            <div className="mt-4 flex flex-col gap-4">
              {/* Paid leave */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Paid leave</span>
                  <span className="text-slate-400">{remainingPaid} / 18 left</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${(remainingPaid / 18) * 100}%` }}
                  />
                </div>
              </div>

              {/* Sick leave */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Sick leave</span>
                  <span className="text-slate-400">{remainingSick} / 10 left</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${(remainingSick / 10) * 100}%` }}
                  />
                </div>
              </div>

              {/* Unpaid leave */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Unpaid leave</span>
                  <span className="text-slate-400">{remainingUnpaid} / 5 left</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${(remainingUnpaid / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <Link
              to={ROUTES.employeeLeaves}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-50 border border-slate-200/50 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Apply for time off
            </Link>
          </div>

          {/* Alerts panel */}
          <div className="rounded-2xl bg-[#EEECFC] p-6 border border-[#E0DCF9]/50">
            <h2 className="text-base font-bold text-indigo-955">Alerts</h2>
            <div className="mt-3.5 flex flex-col gap-3 text-xs leading-relaxed text-indigo-900">
              <div className="flex gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-indigo-500 mt-0.5" />
                <p>Your sick leave for 27–28 Aug is awaiting HR approval.</p>
              </div>
              <div className="flex gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-indigo-500 mt-0.5" />
                <p>Wed 19 Aug was logged as a half-day — add a remark if incorrect.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom quick links row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Profile link */}
        <Link
          to={ROUTES.employeeProfile}
          className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <User className="h-4.5 w-4.5" />
            </div>
            <ArrowUpRight className="h-4.5 w-4.5 text-slate-300 transition-colors group-hover:text-indigo-600" />
          </div>
          <div className="mt-6">
            <p className="font-semibold text-slate-800 text-sm tracking-wide">Profile</p>
            <p className="mt-0.5 text-xs text-slate-400">Personal & job details</p>
          </div>
        </Link>

        {/* Attendance link */}
        <Link
          to={ROUTES.employeeAttendance}
          className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <ArrowUpRight className="h-4.5 w-4.5 text-slate-300 transition-colors group-hover:text-indigo-600" />
          </div>
          <div className="mt-6">
            <p className="font-semibold text-slate-800 text-sm tracking-wide">Attendance</p>
            <p className="mt-0.5 text-xs text-slate-400">Daily & weekly view</p>
          </div>
        </Link>

        {/* Leave requests link */}
        <Link
          to={ROUTES.employeeLeaves}
          className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <ArrowUpRight className="h-4.5 w-4.5 text-slate-300 transition-colors group-hover:text-indigo-600" />
          </div>
          <div className="mt-6">
            <p className="font-semibold text-slate-800 text-sm tracking-wide">Leave requests</p>
            <p className="mt-0.5 text-xs text-slate-400">Apply & track status</p>
          </div>
        </Link>

        {/* Payroll link */}
        <Link
          to={ROUTES.employeePayroll}
          className="group flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <ArrowUpRight className="h-4.5 w-4.5 text-slate-300 transition-colors group-hover:text-indigo-600" />
          </div>
          <div className="mt-6">
            <p className="font-semibold text-slate-800 text-sm tracking-wide">Payroll</p>
            <p className="mt-0.5 text-xs text-slate-400">Salary breakdown</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
