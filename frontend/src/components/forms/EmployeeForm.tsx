import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { EmployeeAdminUpdatePayload } from "@/types/employee";

const employeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().max(200, "Address is too long").optional().or(z.literal("")),
  department: z.string().min(1, "Department is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  joiningDate: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"], { message: "Status is required" }),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  defaultValues: EmployeeFormValues;
  onCancel: () => void;
  onSubmit: (payload: EmployeeAdminUpdatePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function EmployeeForm({ defaultValues, onCancel, onSubmit, isSubmitting }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormValues>({ resolver: zodResolver(employeeSchema), defaultValues });

  function submit(values: EmployeeFormValues) {
    return onSubmit({ ...values, joiningDate: values.joiningDate || undefined });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
        <Input label="Department" error={errors.department?.message} {...register("department")} />
        <Input label="Job title" error={errors.jobTitle?.message} {...register("jobTitle")} />
        <Input
          label="Joining date"
          type="date"
          error={errors.joiningDate?.message}
          {...register("joiningDate")}
        />
        <Select label="Status" error={errors.status?.message} {...register("status")}>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <Input label="Address" error={errors.address?.message} {...register("address")} />
      </div>
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
