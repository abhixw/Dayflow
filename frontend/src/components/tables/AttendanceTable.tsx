import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatAttendanceStatus, attendanceStatusTone, formatDate, formatTime } from "@/utils/formatters";
import type { AttendanceRecord } from "@/types/attendance";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showEmployee?: boolean;
  employeeLabel?: (employeeId: string) => string;
}

export function AttendanceTable({ records, showEmployee = false, employeeLabel }: AttendanceTableProps) {
  if (records.length === 0) {
    return <EmptyState message="No attendance records found." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
            {showEmployee && <th className="px-4 py-3 text-left font-medium text-slate-500">Employee</th>}
            <th className="px-4 py-3 text-left font-medium text-slate-500">Check-in</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Check-out</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-900">{formatDate(record.date)}</td>
              {showEmployee && (
                <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                  {employeeLabel ? employeeLabel(record.employeeId) : record.employeeId}
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatTime(record.checkIn)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatTime(record.checkOut)}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <Badge tone={attendanceStatusTone(record.status)}>{formatAttendanceStatus(record.status)}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
