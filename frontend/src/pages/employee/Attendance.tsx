import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { useCheckIn, useCheckOut, useMyAttendance } from "@/hooks/useAttendance";
import {
  attendanceStatusTone,
  defaultWeekStart,
  formatAttendanceStatus,
  formatTime,
  todayISODate,
} from "@/utils/formatters";
import type { ApiError } from "@/types/auth";

function TodayCard() {
  const today = todayISODate();
  const { data, isLoading, isError, refetch } = useMyAttendance({ start_date: today, end_date: today });
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const [actionError, setActionError] = useState<string | null>(null);

  const record = data?.[0];

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
      setActionError(
        apiError.status === 409 ? "You have already checked out today." : apiError.message
      );
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-slate-900">Today</h2>

      {isLoading && <LoadingState label="Loading today's attendance..." />}

      {isError && <ErrorState message="Unable to load today's attendance." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <div className="mt-4">
          {actionError && (
            <div className="mb-4">
              <Alert variant="error">{actionError}</Alert>
            </div>
          )}

          {!record?.checkIn && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">You haven't checked in today.</p>
              <Button onClick={handleCheckIn} isLoading={checkIn.isPending}>
                Check In
              </Button>
            </div>
          )}

          {record?.checkIn && !record.checkOut && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-700">
                Checked in: <span className="font-medium">{formatTime(record.checkIn)}</span>
              </p>
              <Button onClick={handleCheckOut} isLoading={checkOut.isPending}>
                Check Out
              </Button>
            </div>
          )}

          {record?.checkIn && record.checkOut && (
            <div className="flex flex-col gap-1 text-sm text-slate-700">
              <p>
                Check-in: <span className="font-medium">{formatTime(record.checkIn)}</span>
              </p>
              <p>
                Check-out: <span className="font-medium">{formatTime(record.checkOut)}</span>
              </p>
              <p className="flex items-center gap-2">
                Status: <Badge tone={attendanceStatusTone(record.status)}>{formatAttendanceStatus(record.status)}</Badge>
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function HistorySection() {
  const [startDate, setStartDate] = useState(defaultWeekStart());
  const [endDate, setEndDate] = useState(todayISODate());
  const { data, isLoading, isError, refetch } = useMyAttendance({ start_date: startDate, end_date: endDate });

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-base font-semibold text-slate-900">History</h2>
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Start date"
            type="date"
            value={startDate}
            max={endDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End date"
            type="date"
            value={endDate}
            min={startDate}
            max={todayISODate()}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingState label="Loading attendance history..." />}
        {isError && <ErrorState message="Unable to load attendance history." onRetry={() => refetch()} />}
        {!isLoading && !isError && <AttendanceTable records={data ?? []} />}
      </div>
    </Card>
  );
}

export default function Attendance() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>
      <TodayCard />
      <HistorySection />
    </div>
  );
}
