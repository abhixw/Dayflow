import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ATTENDANCE_COLORS, GRID_STROKE } from "@/components/analytics/chartColors";
import type { AttendanceAnalytics } from "@/types/analytics";

export function AttendanceStatusChart({ data }: { data: AttendanceAnalytics }) {
  const slices = [
    { name: "Present", value: data.present, color: ATTENDANCE_COLORS.present },
    { name: "Absent", value: data.absent, color: ATTENDANCE_COLORS.absent },
    { name: "Half Day", value: data.halfDay, color: ATTENDANCE_COLORS.halfDay },
    { name: "Leave", value: data.leave, color: ATTENDANCE_COLORS.leave },
  ].filter((slice) => slice.value > 0);

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-slate-900">Attendance Breakdown</p>
      <div className="mt-4 h-64">
        {slices.length === 0 ? (
          <EmptyState message="No attendance data available." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="80%"
                paddingAngle={2}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_STROKE }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
