import { useMemo, useState } from "react";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { LeaveApprovalTable } from "@/components/tables/LeaveApprovalTable";
import { useAllLeaves, useApproveLeave, useRejectLeave } from "@/hooks/useLeaves";
import { useEmployeesList } from "@/hooks/useEmployees";
import { formatDate, formatLeaveStatus, formatLeaveType, leaveStatusTone } from "@/utils/formatters";
import type { ApiError } from "@/types/auth";
import type { LeaveRequest, LeaveStatus } from "@/types/leave";

const FILTERS: { label: string; value: LeaveStatus | "ALL" }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "ALL" },
];

function LeaveDetailsModal({
  leave,
  employeeName,
  onClose,
}: {
  leave: LeaveRequest;
  employeeName: string;
  onClose: () => void;
}) {
  return (
    <Modal title={`${employeeName} · ${formatLeaveType(leave.leaveType)}`} onClose={onClose}>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Dates</span>
          <span className="font-medium text-slate-900">
            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-500">Status</span>
          <Badge tone={leaveStatusTone(leave.status)}>{formatLeaveStatus(leave.status)}</Badge>
        </div>
        {leave.remarks && (
          <div>
            <p className="text-slate-500">Remarks</p>
            <p className="mt-1 text-slate-900">{leave.remarks}</p>
          </div>
        )}
        {leave.status !== "PENDING" && (
          <div className="border-t border-slate-200 pt-3">
            {leave.reviewerId && (
              <div className="mb-2 flex items-center justify-between">
                <span className="text-slate-500">Reviewer</span>
                <span className="text-slate-900">{leave.reviewerId}</span>
              </div>
            )}
            {leave.reviewComment && (
              <div className="mb-2">
                <p className="text-slate-500">Review comment</p>
                <p className="mt-1 text-slate-900">{leave.reviewComment}</p>
              </div>
            )}
            {leave.reviewedAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reviewed on</span>
                <span className="text-slate-900">{formatDate(leave.reviewedAt)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ReviewModal({
  leave,
  action,
  employeeName,
  onClose,
  onConfirm,
  isSubmitting,
  error,
}: {
  leave: LeaveRequest;
  action: "approve" | "reject";
  employeeName: string;
  onClose: () => void;
  onConfirm: (comment: string) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [comment, setComment] = useState("");

  return (
    <Modal title={`${action === "approve" ? "Approve" : "Reject"} Leave`} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          {employeeName} · {formatLeaveType(leave.leaveType)} · {formatDate(leave.startDate)} →{" "}
          {formatDate(leave.endDate)}
        </p>
        {error && <Alert variant="error">{error}</Alert>}
        <Textarea label="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="flex gap-3">
          <Button
            type="button"
            variant={action === "approve" ? "primary" : "danger"}
            isLoading={isSubmitting}
            onClick={() => onConfirm(comment)}
          >
            Confirm
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function LeaveRequests() {
  const { data: leaves, isLoading, isError, refetch } = useAllLeaves();
  const { data: employees } = useEmployeesList();
  const approveLeave = useApproveLeave();
  const rejectLeave = useRejectLeave();

  const [filter, setFilter] = useState<LeaveStatus | "ALL">("PENDING");
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ leave: LeaveRequest; action: "approve" | "reject" } | null>(
    null
  );
  const [reviewError, setReviewError] = useState<string | null>(null);

  const employeeNameById = useMemo(() => {
    const map = new Map<string, string>();
    employees?.forEach((employee) => map.set(employee.employeeId, employee.name));
    return map;
  }, [employees]);

  const employeeLabel = (employeeId: string) => employeeNameById.get(employeeId) ?? employeeId;

  const filteredLeaves = useMemo(() => {
    if (!leaves) return [];
    return filter === "ALL" ? leaves : leaves.filter((leave) => leave.status === filter);
  }, [leaves, filter]);

  async function handleConfirmReview(comment: string) {
    if (!reviewTarget) return;
    setReviewError(null);
    try {
      if (reviewTarget.action === "approve") {
        await approveLeave.mutateAsync({ leaveId: reviewTarget.leave.id, payload: { comment: comment || undefined } });
      } else {
        await rejectLeave.mutateAsync({ leaveId: reviewTarget.leave.id, payload: { comment: comment || undefined } });
      }
      setReviewTarget(null);
    } catch (err) {
      setReviewError((err as ApiError).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Leave Requests</h1>
        <Select label="Status" value={filter} onChange={(e) => setFilter(e.target.value as LeaveStatus | "ALL")} className="w-40">
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && <LoadingState label="Loading leave requests..." />}
      {isError && <ErrorState message="Unable to load leave requests." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <LeaveApprovalTable
          leaves={filteredLeaves}
          employeeLabel={employeeLabel}
          onView={setSelectedLeave}
          onApprove={(leave) => {
            setReviewError(null);
            setReviewTarget({ leave, action: "approve" });
          }}
          onReject={(leave) => {
            setReviewError(null);
            setReviewTarget({ leave, action: "reject" });
          }}
          emptyMessage={filter === "PENDING" ? "No pending leave requests." : "No leave requests found."}
        />
      )}

      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          employeeName={employeeLabel(selectedLeave.employeeId)}
          onClose={() => setSelectedLeave(null)}
        />
      )}

      {reviewTarget && (
        <ReviewModal
          leave={reviewTarget.leave}
          action={reviewTarget.action}
          employeeName={employeeLabel(reviewTarget.leave.employeeId)}
          onClose={() => setReviewTarget(null)}
          onConfirm={handleConfirmReview}
          isSubmitting={approveLeave.isPending || rejectLeave.isPending}
          error={reviewError}
        />
      )}
    </div>
  );
}
