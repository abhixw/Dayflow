import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { PayrollSummary } from "@/components/common/PayrollSummary";
import { useMyPayroll } from "@/hooks/usePayroll";
import type { ApiError } from "@/types/auth";

export default function Payroll() {
  const { data: payroll, isLoading, isError, error, refetch } = useMyPayroll();
  const isNotFound = (error as ApiError | null)?.status === 404;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Payroll</h1>

      {isLoading && <LoadingState label="Loading payroll..." />}

      {isError && isNotFound && <EmptyState message="No payroll information available yet." />}
      {isError && !isNotFound && <ErrorState message="Unable to load payroll." onRetry={() => refetch()} />}

      {!isLoading && !isError && payroll && <PayrollSummary payroll={payroll} />}
    </div>
  );
}
