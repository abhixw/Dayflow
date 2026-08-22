import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { PayrollUpdatePayload } from "@/types/payroll";

const payrollSchema = z.object({
  basicSalary: z.number({ error: "Enter a number" }).nonnegative("Must be zero or greater"),
  allowances: z.number({ error: "Enter a number" }).nonnegative("Must be zero or greater"),
  deductions: z.number({ error: "Enter a number" }).nonnegative("Must be zero or greater"),
});

interface PayrollFormProps {
  defaultValues: PayrollUpdatePayload;
  onCancel: () => void;
  onSubmit: (payload: PayrollUpdatePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function PayrollForm({ defaultValues, onCancel, onSubmit, isSubmitting }: PayrollFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PayrollUpdatePayload>({ resolver: zodResolver(payrollSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Basic Salary"
          type="number"
          step="0.01"
          min="0"
          error={errors.basicSalary?.message}
          {...register("basicSalary", { valueAsNumber: true })}
        />
        <Input
          label="Allowances"
          type="number"
          step="0.01"
          min="0"
          error={errors.allowances?.message}
          {...register("allowances", { valueAsNumber: true })}
        />
        <Input
          label="Deductions"
          type="number"
          step="0.01"
          min="0"
          error={errors.deductions?.message}
          {...register("deductions", { valueAsNumber: true })}
        />
      </div>
      <p className="text-xs text-slate-500">Gross and net salary are calculated automatically after saving.</p>
      <div className="flex gap-3">
        <Button type="submit" isLoading={isSubmitting}>
          Save changes
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
