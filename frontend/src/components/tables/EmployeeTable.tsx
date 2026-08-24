import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/common/EmptyState";
import { employeeStatusTone, formatRole } from "@/utils/formatters";
import type { Employee } from "@/types/employee";

interface EmployeeTableProps {
  employees: Employee[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  if (employees.length === 0) {
    return <EmptyState message="No employees found." />;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Employee ID</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Role</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Department</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Job Title</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Email</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
            <th className="px-4 py-3 text-left font-medium text-slate-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {employees.map((employee) => (
            <tr key={employee.employeeId}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-900">{employee.employeeId}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-900">{employee.name}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatRole(employee.role)}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.department}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.jobTitle}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{employee.email}</td>
              <td className="whitespace-nowrap px-4 py-3">
                <Badge tone={employeeStatusTone(employee.status)}>
                  {employee.status === "ACTIVE" ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <Link
                  to={`/admin/employees/${employee.employeeId}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
