import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmployeeTable } from "@/components/tables/EmployeeTable";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { useEmployeesList } from "@/hooks/useEmployees";
import { employeeMatchesSearch } from "@/utils/formatters";

export default function Employees() {
  const { data: employees, isLoading, isError, refetch } = useEmployeesList();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!employees) return [];
    return employees.filter((employee) => employeeMatchesSearch(employee, search));
  }, [employees, search]);

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

      {isLoading && <LoadingState label="Loading employees..." />}
      {isError && <ErrorState message="Unable to load employees." onRetry={() => refetch()} />}
      {!isLoading && !isError && <EmployeeTable employees={filtered} />}
    </div>
  );
}
