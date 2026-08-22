export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeTime(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const divisions: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  for (const [unit, secondsInUnit] of divisions) {
    if (Math.abs(diffSeconds) >= secondsInUnit) {
      return formatter.format(Math.round(diffSeconds / secondsInUnit), unit);
    }
  }
  return formatter.format(diffSeconds, "second");
}

export function formatTime(value: string | undefined | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISODate(): string {
  return toISODate(new Date());
}

export function defaultWeekStart(): string {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  return toISODate(date);
}

export function formatRole(role: string): string {
  switch (role) {
    case "EMPLOYEE":
      return "Employee";
    case "HR":
      return "HR";
    case "ADMIN":
      return "Admin";
    default:
      return role;
  }
}

export function attendanceStatusTone(status: string): "green" | "red" | "amber" | "blue" | "slate" {
  switch (status) {
    case "PRESENT":
      return "green";
    case "ABSENT":
      return "red";
    case "HALF_DAY":
      return "amber";
    case "LEAVE":
      return "blue";
    default:
      return "slate";
  }
}

export function formatAttendanceStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

export function leaveStatusTone(status: string): "green" | "red" | "amber" | "blue" | "slate" {
  switch (status) {
    case "APPROVED":
      return "green";
    case "REJECTED":
      return "red";
    case "PENDING":
      return "amber";
    default:
      return "slate";
  }
}

export function formatLeaveType(type: string): string {
  switch (type) {
    case "PAID":
      return "Paid Leave";
    case "SICK":
      return "Sick Leave";
    case "UNPAID":
      return "Unpaid Leave";
    default:
      return type;
  }
}

export function formatLeaveStatus(status: string): string {
  return status[0] + status.slice(1).toLowerCase();
}

export function employeeStatusTone(status: string): "green" | "red" | "amber" | "blue" | "slate" {
  return status === "ACTIVE" ? "green" : "slate";
}

export function employeeMatchesSearch(
  employee: { name: string; employeeId: string; email: string; department: string },
  search: string
): boolean {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    employee.name.toLowerCase().includes(term) ||
    employee.employeeId.toLowerCase().includes(term) ||
    employee.email.toLowerCase().includes(term) ||
    employee.department.toLowerCase().includes(term)
  );
}
