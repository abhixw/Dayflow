import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate, formatLeaveStatus, formatLeaveType, leaveStatusTone } from "@/utils/formatters";
import type { LeaveRequest } from "@/types/leave";

interface LeaveApprovalTableProps {
  leaves: LeaveRequest[];
  employeeLabel: (employeeId: string) => string;
  onView: (leave: LeaveRequest) => void;
  onApprove: (leave: LeaveRequest) => void;
  onReject: (leave: LeaveRequest) => void;
  emptyMessage?: string;
}

export function LeaveApprovalTable({
  leaves,
  employeeLabel,
  onView,
  onApprove,
  onReject,
  emptyMessage = "No leave requests found.",
}: LeaveApprovalTableProps) {
  if (leaves.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Employee</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Leave Type</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Start Date</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">End Date</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Remarks</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {leaves.map((leave) => {
            const isPending = leave.status === "PENDING";
            return (
              <tr key={leave.id}>
                <td className="whitespace-nowrap px-4 py-3 text-slate-900">{employeeLabel(leave.employeeId)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatLeaveType(leave.leaveType)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(leave.startDate)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(leave.endDate)}</td>
                <td className="max-w-[200px] truncate px-4 py-3 text-slate-600">{leave.remarks || "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge tone={leaveStatusTone(leave.status)}>{formatLeaveStatus(leave.status)}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(leave)}
                      className="text-sm font-medium text-brand-600 hover:underline"
                    >
                      View
                    </button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!isPending}
                      onClick={() => onApprove(leave)}
                      className="px-2.5 py-1 text-xs"
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      disabled={!isPending}
                      onClick={() => onReject(leave)}
                      className="px-2.5 py-1 text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
