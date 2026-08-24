import { useState } from "react";
import { Plus, CalendarClock, CheckCircle2, XCircle, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Modal } from "@/components/ui/Modal";
import { StatTile } from "@/components/common/StatTile";
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
      className="group w-full text-left"
      aria-label={`View details for ${formatLeaveType(leave.leaveType)} request`}
    >
      <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-100 hover:shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-100">
            <CalendarClock className="h-4.5 w-4.5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{formatLeaveType(leave.leaveType)}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDate(leave.startDate)} → {formatDate(leave.endDate)}
            </p>
          </div>
        </div>
        <Badge tone={leaveStatusTone(leave.status)}>{formatLeaveStatus(leave.status)}</Badge>
      </div>
    </button>
  );
}

export default function Leaves() {
  const { data: leaves, isLoading, isError, refetch } = useMyLeaves();
  const createLeave = useCreateLeave();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pendingCount = leaves?.filter((l) => l.status === "PENDING").length ?? 0;
  const approvedCount = leaves?.filter((l) => l.status === "APPROVED").length ?? 0;
  const rejectedCount = leaves?.filter((l) => l.status === "REJECTED").length ?? 0;

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
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0B091A]">Time off</h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">Apply for leave and track your requests.</p>
        </div>
        <Button
          onClick={() => setIsApplyOpen(true)}
          className="rounded-xl px-5 py-2.5 shadow-lg shadow-brand-600/20"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Apply for leave
        </Button>
      </div>

      {isLoading && <LoadingState label="Loading leave requests..." />}
      {isError && <ErrorState message="Unable to load leave requests." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {leaves && leaves.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatTile icon={Hourglass} label="Pending" value={pendingCount} sublabel="Awaiting review" />
                <StatTile icon={CheckCircle2} label="Approved" value={approvedCount} sublabel="All time" />
                <StatTile icon={XCircle} label="Rejected" value={rejectedCount} sublabel="All time" />
              </div>

              <div className="flex flex-col gap-3">
                {leaves.map((leave) => (
                  <LeaveListItem key={leave.id} leave={leave} onSelect={() => setSelectedLeave(leave)} />
                ))}
              </div>
            </>
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
