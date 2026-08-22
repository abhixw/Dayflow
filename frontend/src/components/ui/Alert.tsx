import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

type AlertVariant = "error" | "success" | "info";

const variantStyles: Record<AlertVariant, { container: string; icon: ReactNode }> = {
  error: {
    container: "border-red-200 bg-red-50 text-red-800",
    icon: <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />,
  },
  success: {
    container: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" aria-hidden="true" />,
  },
  info: {
    container: "border-blue-200 bg-blue-50 text-blue-800",
    icon: <Info className="h-5 w-5 shrink-0 text-blue-500" aria-hidden="true" />,
  },
};

interface AlertProps {
  variant: AlertVariant;
  children: ReactNode;
}

export function Alert({ variant, children }: AlertProps) {
  const styles = variantStyles[variant];
  return (
    <div role="alert" className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles.container}`}>
      {styles.icon}
      <div>{children}</div>
    </div>
  );
}
