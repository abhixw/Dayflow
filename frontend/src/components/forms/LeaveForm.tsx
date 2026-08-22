import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { formatLeaveType } from "@/utils/formatters";
import type { CreateLeavePayload, LeaveType } from "@/types/leave";

const LEAVE_TYPES: LeaveType[] = ["PAID", "SICK", "UNPAID"];

const leaveSchema = z
  .object({
    leaveType: z.enum(LEAVE_TYPES, { message: "Leave type is required" }),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    remarks: z.string().max(500, "Remarks are too long").optional().or(z.literal("")),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must not be before start date",
    path: ["endDate"],
  });

interface LeaveFormProps {
  onSubmit: (payload: CreateLeavePayload) => Promise<void>;
  isSubmitting: boolean;
}

export function LeaveForm({ onSubmit, isSubmitting }: LeaveFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeavePayload>({ resolver: zodResolver(leaveSchema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Select label="Leave Type" defaultValue="" error={errors.leaveType?.message} {...register("leaveType")}>
        <option value="" disabled>
          Select leave type
        </option>
        {LEAVE_TYPES.map((type) => (
          <option key={type} value={type}>
            {formatLeaveType(type)}
          </option>
        ))}
      </Select>

      <Input label="Start Date" type="date" error={errors.startDate?.message} {...register("startDate")} />
      <Input label="End Date" type="date" error={errors.endDate?.message} {...register("endDate")} />
      <Textarea label="Remarks" error={errors.remarks?.message} {...register("remarks")} />

      <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
        Submit request
      </Button>
    </form>
  );
}
