import { useState } from "react";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { LeaveForm } from "@/components/forms/LeaveForm";
import { useCreateLeave, useMyLeaves } from "@/hooks/useLeaves";
import { formatDate, formatLeaveStatus, formatLeaveType, leaveStatusTone } from "@/utils/formatters";
import type { ApiError } from "@/types/auth";
import type { CreateLeavePayload, LeaveRequest } from "@/types/leave";

function LeaveDetailsModal({ leave, onClose }: { leave: LeaveRequest; onClose: () => void }) {
  return (
    <Modal title={formatLeaveType(leave.leaveType)} onClose={onClose}>
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
            {leave.reviewComment && (
              <div className="mb-2">
                <p className="text-slate-500">Reviewer comment</p>
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

function LeaveListItem({ leave, onSelect }: { leave: LeaveRequest; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left"
      aria-label={`View details for ${formatLeaveType(leave.leaveType)} request`}
    >
      <Card className="flex items-center justify-between p-4 transition-shadow hover:shadow-md">
        <div>
          <p className="text-sm font-semibold text-slate-900">{formatLeaveType(leave.leaveType)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
          </p>
        </div>
        <Badge tone={leaveStatusTone(leave.status)}>{formatLeaveStatus(leave.status)}</Badge>
      </Card>
    </button>
  );
}

export default function Leaves() {
  const { data: leaves, isLoading, isError, refetch } = useMyLeaves();
  const createLeave = useCreateLeave();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleCreate(payload: CreateLeavePayload) {
    setSubmitError(null);
    try {
      await createLeave.mutateAsync(payload);
      setIsApplyOpen(false);
    } catch (err) {
      setSubmitError((err as ApiError).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Leave Requests</h1>
        <Button onClick={() => setIsApplyOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Apply for Leave
        </Button>
      </div>

      {isLoading && <LoadingState label="Loading leave requests..." />}
      {isError && <ErrorState message="Unable to load leave requests." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {leaves && leaves.length > 0 ? (
            <div className="flex flex-col gap-3">
              {leaves.map((leave) => (
                <LeaveListItem key={leave.id} leave={leave} onSelect={() => setSelectedLeave(leave)} />
              ))}
            </div>
          ) : (
            <EmptyState
              message="No leave requests yet."
              action={<Button onClick={() => setIsApplyOpen(true)}>Apply for Leave</Button>}
            />
          )}
        </>
      )}

      {isApplyOpen && (
        <Modal
          title="Apply for Leave"
          onClose={() => {
            setIsApplyOpen(false);
            setSubmitError(null);
          }}
        >
          {submitError && (
            <div className="mb-4">
              <Alert variant="error">{submitError}</Alert>
            </div>
          )}
          <LeaveForm onSubmit={handleCreate} isSubmitting={createLeave.isPending} />
        </Modal>
      )}

      {selectedLeave && <LeaveDetailsModal leave={selectedLeave} onClose={() => setSelectedLeave(null)} />}
    </div>
  );
}
