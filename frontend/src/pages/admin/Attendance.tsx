import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { AttendanceTable } from "@/components/tables/AttendanceTable";
import { useAllAttendance } from "@/hooks/useAttendance";
import { useEmployeesList } from "@/hooks/useEmployees";
import { defaultWeekStart, todayISODate } from "@/utils/formatters";
import type { AttendanceStatus } from "@/types/attendance";

const STATUS_OPTIONS: AttendanceStatus[] = ["PRESENT", "ABSENT", "HALF_DAY", "LEAVE"];

export default function Attendance() {
  const { data: employees } = useEmployeesList();
  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState(defaultWeekStart());
  const [endDate, setEndDate] = useState(todayISODate());
  const [status, setStatus] = useState("");

  const { data, isLoading, isError, refetch } = useAllAttendance(employeeId, {
    start_date: startDate,
    end_date: endDate,
  });

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    employees?.forEach((employee) => map.set(employee.employeeId, employee.name));
    return map;
  }, [employees]);

  const filteredRecords = useMemo(() => {
    if (!data) return [];
    return status ? data.filter((record) => record.status === status) : data;
  }, [data, status]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Attendance</h1>

      <Card className="p-6">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label="Employee"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-56"
          >
            <option value="">All employees</option>
            {employees?.map((employee) => (
              <option key={employee.employeeId} value={employee.employeeId}>
                {employee.name} ({employee.employeeId})
              </option>
            ))}
          </Select>
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
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-4">
          {isLoading && <LoadingState label="Loading attendance..." />}
          {isError && <ErrorState message="Unable to load attendance." onRetry={() => refetch()} />}
          {!isLoading && !isError && (
            <AttendanceTable
              records={filteredRecords}
              showEmployee={!employeeId}
              employeeLabel={(id) => employeeNameById.get(id) ?? id}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
