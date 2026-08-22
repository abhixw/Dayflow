import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/common/EmptyState";
import { AXIS_TICK_STYLE, GRID_STROKE } from "@/components/analytics/chartColors";

interface DepartmentBarChartProps {
  title: string;
  data: { department: string; value: number }[];
  valueFormatter?: (value: number) => string;
  barColor?: string;
}

// Magnitude comparison across a dynamic set of departments — identity isn't
// the point here, so every bar uses one hue rather than a per-category color.
export function DepartmentBarChart({ title, data, valueFormatter, barColor = "#3b66f5" }: DepartmentBarChartProps) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <div className="mt-4 h-64">
        {data.length === 0 ? (
          <EmptyState message="No data available." />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tick={AXIS_TICK_STYLE}
                tickLine={false}
                axisLine={{ stroke: GRID_STROKE }}
                tickFormatter={valueFormatter}
              />
              <YAxis
                type="category"
                dataKey="department"
                width={100}
                tick={AXIS_TICK_STYLE}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value: number) => (valueFormatter ? valueFormatter(value) : value)}
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: GRID_STROKE }}
              />
              <Bar dataKey="value" fill={barColor} radius={[0, 4, 4, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
