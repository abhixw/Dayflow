import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatters";
import type { Payroll } from "@/types/payroll";

function PayrollField({ label, value, emphasize = false }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 ${emphasize ? "text-lg font-semibold text-slate-900" : "text-sm text-slate-900"}`}>
        {formatCurrency(value)}
      </p>
    </div>
  );
}

export function PayrollSummary({ payroll }: { payroll: Payroll }) {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PayrollField label="Basic Salary" value={payroll.basicSalary} />
        <PayrollField label="Allowances" value={payroll.allowances} />
        <PayrollField label="Deductions" value={payroll.deductions} />
        <PayrollField label="Gross Salary" value={payroll.grossSalary} emphasize />
        <PayrollField label="Net Salary" value={payroll.netSalary} emphasize />
      </div>
    </Card>
  );
}
