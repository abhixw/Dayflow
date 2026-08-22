import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { GRID_STROKE, LEAVE_TYPE_COLORS } from "@/components/analytics/chartColors";
import type { LeaveAnalytics } from "@/types/analytics";

export function LeaveTypeChart({ data }: { data: LeaveAnalytics }) {
  const slices = [
    { name: "Paid", value: data.paid, color: LEAVE_TYPE_COLORS.paid },
    { name: "Sick", value: data.sick, color: LEAVE_TYPE_COLORS.sick },
    { name: "Unpaid", value: data.unpaid, color: LEAVE_TYPE_COLORS.unpaid },
  ].filter((slice) => slice.value > 0);

  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-slate-900">Leave Type Breakdown</p>
      <div className="mt-4 h-64">
        {slices.length === 0 ? (
          <EmptyState message="No leave data available." />
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
