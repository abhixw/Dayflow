import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Select } from "@/components/ui/Select";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { EmployeeForm } from "@/components/forms/EmployeeForm";
import { useEmployee, useEmployeesList, useUpdateEmployee } from "@/hooks/useEmployees";
import { employeeStatusTone, formatDate, formatRole } from "@/utils/formatters";
import type { ApiError } from "@/types/auth";
import type { EmployeeAdminUpdatePayload } from "@/types/employee";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

export default function EmployeeDetails() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading, isError, refetch } = useEmployee(employeeId ?? "");
  const { data: employees } = useEmployeesList();
  const updateEmployee = useUpdateEmployee(employeeId ?? "");

  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave(payload: EmployeeAdminUpdatePayload) {
    setSaveError(null);
    try {
      await updateEmployee.mutateAsync(payload);
      setIsEditing(false);
    } catch (err) {
      setSaveError((err as ApiError).message);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Employee Details</h1>
        {employees && employees.length > 0 && (
          <Select
            label="Switch employee"
            value={employeeId}
            onChange={(e) => navigate(`/admin/employees/${e.target.value}`)}
            className="sm:w-64"
          >
            {employees.map((emp) => (
              <option key={emp.employeeId} value={emp.employeeId}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </Select>
        )}
      </div>

      {isLoading && <LoadingState label="Loading employee..." />}
      {isError && <ErrorState message="Unable to load this employee." onRetry={() => refetch()} />}

      {!isLoading && !isError && employee && (
        <>
          <Card className="flex items-center justify-between p-6">
            <div>
              <p className="text-lg font-semibold text-slate-900">{employee.name}</p>
              <p className="text-sm text-slate-500">
                {employee.jobTitle} · {employee.department}
              </p>
            </div>
            <Badge tone={employeeStatusTone(employee.status)}>
              {employee.status === "ACTIVE" ? "Active" : "Inactive"}
            </Badge>
          </Card>

          <Card className="p-6">
            <h2 className="text-base font-semibold text-slate-900">Account details</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Employee ID" value={employee.employeeId} />
              <ReadOnlyField label="Role" value={formatRole(employee.role)} />
              <ReadOnlyField label="Email" value={employee.email} />
              <ReadOnlyField label="Joining date" value={formatDate(employee.joiningDate)} />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Employee information</h2>
              {!isEditing && (
                <Button type="button" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Edit
                </Button>
              )}
            </div>

            {saveError && (
              <div className="mt-4">
                <Alert variant="error">{saveError}</Alert>
              </div>
            )}

            <div className="mt-4">
              {isEditing ? (
                <EmployeeForm
                  defaultValues={{
                    name: employee.name,
                    phone: employee.phone ?? "",
                    address: employee.address ?? "",
                    department: employee.department,
                    jobTitle: employee.jobTitle,
                    status: employee.status,
                  }}
                  onCancel={() => {
                    setIsEditing(false);
                    setSaveError(null);
                  }}
                  onSubmit={handleSave}
                  isSubmitting={updateEmployee.isPending}
                />
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <ReadOnlyField label="Phone" value={employee.phone ?? ""} />
                  <ReadOnlyField label="Address" value={employee.address ?? ""} />
                  <ReadOnlyField label="Department" value={employee.department} />
                  <ReadOnlyField label="Job title" value={employee.jobTitle} />
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
