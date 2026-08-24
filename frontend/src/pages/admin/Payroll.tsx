import { useState } from "react";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmptyState } from "@/components/common/EmptyState";
import { PayrollSummary } from "@/components/common/PayrollSummary";
import { PayrollForm } from "@/components/forms/PayrollForm";
import { useEmployeePayroll, useUpdatePayroll } from "@/hooks/usePayroll";
import { useEmployeesList } from "@/hooks/useEmployees";
import type { ApiError } from "@/types/auth";
import type { PayrollUpdatePayload } from "@/types/payroll";

export default function Payroll() {
  const { data: employees } = useEmployeesList();
  const [employeeId, setEmployeeId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: payroll, isLoading, isError, error, refetch } = useEmployeePayroll(employeeId);
  const updatePayroll = useUpdatePayroll(employeeId);
  const isNotFound = (error as ApiError | null)?.status === 404;

  async function handleSave(payload: PayrollUpdatePayload) {
    setSaveError(null);
    try {
      await updatePayroll.mutateAsync(payload);
      setIsEditing(false);
    } catch (err) {
      setSaveError((err as ApiError).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Payroll</h1>
        <Select
          label="Employee"
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            setIsEditing(false);
            setSaveError(null);
          }}
          className="w-64"
        >
          <option value="">Select an employee</option>
          {employees?.map((employee) => (
            <option key={employee.employeeId} value={employee.employeeId}>
              {employee.name} ({employee.employeeId})
            </option>
          ))}
        </Select>
      </div>

      {!employeeId && <EmptyState message="Select an employee to view their payroll." />}

      {employeeId && isLoading && <LoadingState label="Loading payroll..." />}

      {employeeId && isError && isNotFound && !isEditing && (
        <EmptyState
          message="No payroll information set up for this employee yet."
          action={
            <Button type="button" onClick={() => setIsEditing(true)}>
              Set Salary Structure
            </Button>
          }
        />
      )}
      {employeeId && isError && !isNotFound && (
        <ErrorState message="Unable to load payroll." onRetry={() => refetch()} />
      )}

      {employeeId && !isLoading && (isNotFound || payroll) && (
        <>
          {!isEditing && payroll && (
            <>
              <PayrollSummary payroll={payroll} />
              <div>
                <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit Salary Structure
                </Button>
              </div>
            </>
          )}

          {isEditing && (
            <Card className="p-6">
              <h2 className="text-base font-semibold text-slate-900">
                {payroll ? "Edit salary structure" : "Set salary structure"}
              </h2>

              {saveError && (
                <div className="mt-4">
                  <Alert variant="error">{saveError}</Alert>
                </div>
              )}

              <div className="mt-4">
                <PayrollForm
                  defaultValues={{
                    basicSalary: payroll?.basicSalary ?? 0,
                    allowances: payroll?.allowances ?? 0,
                    deductions: payroll?.deductions ?? 0,
                    grossSalary: payroll?.grossSalary ?? 0,
                    netSalary: payroll?.netSalary ?? 0,
                  }}
                  onCancel={() => {
                    setIsEditing(false);
                    setSaveError(null);
                  }}
                  onSubmit={handleSave}
                  isSubmitting={updatePayroll.isPending}
                />
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
