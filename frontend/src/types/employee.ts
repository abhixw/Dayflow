import type { Role } from "@/types/auth";

export type EmployeeStatus = "ACTIVE" | "INACTIVE";

export interface Employee {
  employeeId: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  department: string;
  jobTitle: string;
  role: Role;
  joiningDate: string;
  profilePictureUrl?: string;
  status: EmployeeStatus;
}

export interface EmployeeUpdatePayload {
  phone?: string;
  address?: string;
}

// Fields an HR/Admin can change from the employee management screens.
// Role and salary are deliberately excluded: role changes are security-sensitive
// and not confirmed as part of this endpoint, salary belongs to the Payroll API.
export interface EmployeeAdminUpdatePayload {
  name?: string;
  phone?: string;
  address?: string;
  department?: string;
  jobTitle?: string;
  status?: EmployeeStatus;
}
