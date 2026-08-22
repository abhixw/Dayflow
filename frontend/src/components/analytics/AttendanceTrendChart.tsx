import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { ATTENDANCE_COLORS, AXIS_TICK_STYLE, GRID_STROKE } from "@/components/analytics/chartColors";
import { formatDate } from "@/utils/formatters";
import type { AttendanceTrendPoint } from "@/types/analytics";

export function AttendanceTrendChart({ data }: { data: AttendanceTrendPoint[] }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-slate-900">Attendance Trend</p>
      <div className="mt-4 h-72">
        {data.length === 0 ? (
          <EmptyState message="No attendance data available." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => formatDate(value)}
                tick={AXIS_TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: GRID_STROKE }}
              />
              <YAxis allowDecimals={false} tick={AXIS_TICK_STYLE} tickLine={false} axisLine={false} />
              <Tooltip
                labelFormatter={(value: any) => formatDate(String(value))}
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_STROKE }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                type="monotone"
                dataKey="present"
                name="Present"
                stroke={ATTENDANCE_COLORS.present}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="absent"
                name="Absent"
                stroke={ATTENDANCE_COLORS.absent}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="halfDay"
                name="Half Day"
                stroke={ATTENDANCE_COLORS.halfDay}
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="leave"
                name="Leave"
                stroke={ATTENDANCE_COLORS.leave}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
