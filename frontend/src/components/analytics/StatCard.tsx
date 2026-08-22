import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string | number;
  tone?: "default" | "emphasize";
}

export function StatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1.5 ${tone === "emphasize" ? "text-2xl font-semibold text-slate-900" : "text-xl font-semibold text-slate-800"}`}>
        {value}
      </p>
    </Card>
  );
}
