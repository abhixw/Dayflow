export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
}

export interface AttendanceDateRange {
  start_date?: string;
  end_date?: string;
}
