import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { EmployeeUpdatePayload } from "@/types/employee";

const profileSchema = z.object({
  phone: z
    .string()
    .regex(/^\+?[0-9\s-]{7,15}$/, "Enter a valid phone number")
    .optional()
    .or(z.literal("")),
  address: z.string().max(200, "Address is too long").optional().or(z.literal("")),
});

interface ProfileFormProps {
  defaultValues: EmployeeUpdatePayload;
  onCancel: () => void;
  onSubmit: (payload: EmployeeUpdatePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function ProfileForm({ defaultValues, onCancel, onSubmit, isSubmitting }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeUpdatePayload>({ resolver: zodResolver(profileSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
      <Input label="Address" error={errors.address?.message} {...register("address")} />
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
