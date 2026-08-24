import { Wallet, TrendingUp, MinusCircle } from "lucide-react";
import { StatTile } from "@/components/common/StatTile";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { useMyPayroll } from "@/hooks/usePayroll";
import { formatCurrency } from "@/utils/formatters";
import type { ApiError } from "@/types/auth";

function BreakdownField({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(value)}</p>
    </div>
  );
}

export default function Payroll() {
  const { data: payroll, isLoading, isError, error, refetch } = useMyPayroll();
  const isNotFound = (error as ApiError | null)?.status === 404;

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0B091A]">Payroll</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">Your salary breakdown — read-only.</p>
      </div>

      {isLoading && <LoadingState label="Loading payroll..." />}
      {isError && isNotFound && <EmptyState message="No payroll information available yet." />}
      {isError && !isNotFound && <ErrorState message="Unable to load payroll." onRetry={() => refetch()} />}

      {!isLoading && !isError && payroll && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatTile
              icon={Wallet}
              label="Net salary"
              value={formatCurrency(payroll.netSalary)}
              sublabel="Take-home per month"
            />
            <StatTile
              icon={TrendingUp}
              label="Gross salary"
              value={formatCurrency(payroll.grossSalary)}
              sublabel="Before deductions"
            />
            <StatTile
              icon={MinusCircle}
              label="Deductions"
              value={formatCurrency(payroll.deductions)}
              sublabel="Per month"
            />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="border-b border-slate-100 pb-4 text-lg font-bold text-slate-900">Salary structure</h2>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <BreakdownField label="Basic salary" value={payroll.basicSalary} />
              <BreakdownField label="Allowances" value={payroll.allowances} />
              <BreakdownField label="Deductions" value={payroll.deductions} />
              <BreakdownField label="Gross salary" value={payroll.grossSalary} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
