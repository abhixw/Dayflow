import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface QuickAccessCardProps {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

export function QuickAccessCard({ label, description, to, icon: Icon }: QuickAccessCardProps) {
  return (
    <Link to={to}>
      <Card className="flex items-start gap-4 p-5 transition-shadow hover:shadow-md">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
      </Card>
    </Link>
  );
}
