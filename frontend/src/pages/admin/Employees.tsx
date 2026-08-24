import { useMemo, useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { EmployeeTable } from "@/components/tables/EmployeeTable";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useEmployeesList } from "@/hooks/useEmployees";
import { employeeMatchesSearch } from "@/utils/formatters";
import type { EmployeeStatus } from "@/types/employee";

export default function Employees() {
  const { data: employees, isLoading, isError, refetch } = useEmployeesList();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [status, setStatus] = useState<EmployeeStatus | "">("");
  const [sortByJoiningDate, setSortByJoiningDate] = useState(false);

  const departments = useMemo(
    () => Array.from(new Set((employees ?? []).map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );
  const jobTitles = useMemo(
    () => Array.from(new Set((employees ?? []).map((e) => e.jobTitle).filter(Boolean))).sort(),
    [employees]
  );

  const filtered = useMemo(() => {
    if (!employees) return [];
    let result = employees.filter(
      (employee) =>
        employeeMatchesSearch(employee, search) &&
        (!department || employee.department === department) &&
        (!jobTitle || employee.jobTitle === jobTitle) &&
        (!status || employee.status === status)
    );
    if (sortByJoiningDate) {
      result = [...result].sort((a, b) => (a.joiningDate || "").localeCompare(b.joiningDate || ""));
    }
    return result;
  }, [employees, search, department, jobTitle, status, sortByJoiningDate]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Employees</h1>
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, email, department"
            aria-label="Search employees"
            className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-48">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-48">
          <option value="">All job titles</option>
          {jobTitles.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as EmployeeStatus | "")}
          className="w-40"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <Button
          type="button"
          variant={sortByJoiningDate ? "primary" : "secondary"}
          onClick={() => setSortByJoiningDate((v) => !v)}
        >
          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
          Sort by joining date
        </Button>
      </div>

      {isLoading && <LoadingState label="Loading employees..." />}
      {isError && <ErrorState message="Unable to load employees." onRetry={() => refetch()} />}
      {!isLoading && !isError && <EmployeeTable employees={filtered} />}
    </div>
  );
}
