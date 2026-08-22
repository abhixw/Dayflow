// Reuses the app's existing semantic status colors (same hues as
// attendanceStatusTone/Badge) so charts stay visually consistent with badges
// elsewhere. Validated for categorical CVD-safety (see dataviz skill).
export const ATTENDANCE_COLORS = {
  present: "#10b981", // emerald-500
  absent: "#ef4444", // red-500
  halfDay: "#f59e0b", // amber-500
  leave: "#3b66f5", // brand-500
} as const;

export const LEAVE_TYPE_COLORS = {
  paid: "#3b66f5", // brand-500
  sick: "#f59e0b", // amber-500
  unpaid: "#64748b", // slate-500 (neutral, not a status)
} as const;

export const AXIS_TICK_STYLE = { fontSize: 12, fill: "#64748b" };
export const GRID_STROKE = "#e2e8f0"; // slate-200, recessive
