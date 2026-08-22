import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PUBLIC_SIGNUP_ROLES } from "@/utils/constants";
import type { SignupPayload } from "@/types/auth";

// Label text only — selecting "Admin / HR" still submits role=HR. Public
// signup can never create an ADMIN account; that's enforced server-side
// regardless of what this button is labeled.
const roleLabels: Record<(typeof PUBLIC_SIGNUP_ROLES)[number], string> = {
  EMPLOYEE: "Employee",
  HR: "Admin / HR",
};

// users.employee_id is the same column for every role — only the label
// shown to the person filling the form changes with their selected role.
const idFieldLabels: Record<(typeof PUBLIC_SIGNUP_ROLES)[number], string> = {
  EMPLOYEE: "Employee ID",
  HR: "HR ID",
};

const signupSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  name: z.string().optional(),
  email: z.string().min(1, "Work email is required").email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/[0-9]/, "Password must include a number"),
  role: z.enum(PUBLIC_SIGNUP_ROLES, { message: "Role is required" }),
});

interface SignupFormProps {
  onSubmit: (payload: SignupPayload) => Promise<void>;
  isSubmitting: boolean;
}

export function SignupForm({ onSubmit, isSubmitting }: SignupFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupPayload>({ resolver: zodResolver(signupSchema), defaultValues: { role: "EMPLOYEE" } });

  const selectedRole = watch("role");

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={idFieldLabels[selectedRole ?? "EMPLOYEE"]}
          autoComplete="off"
          error={errors.employeeId?.message}
          {...register("employeeId")}
        />
        <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
      </div>

      <Input label="Work email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />

      <div>
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {!errors.password && (
          <p className="mt-1.5 text-xs text-slate-500">
            Use 8+ characters with an uppercase letter, a lowercase letter, and a number.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-700">Role</p>
        <div className="mt-1.5 grid grid-cols-2 gap-3">
          {PUBLIC_SIGNUP_ROLES.map((role) => {
            const isSelected = selectedRole === role;
            return (
              <label
                key={role}
                className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm font-medium transition-colors ${
                  isSelected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <input type="radio" value={role} className="sr-only" {...register("role")} />
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-brand-500" : "border-slate-300"
                  }`}
                >
                  {isSelected && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                </span>
                {roleLabels[role]}
              </label>
            );
          })}
        </div>
        {errors.role && (
          <p role="alert" className="mt-1.5 text-sm text-red-600">
            {errors.role.message}
          </p>
        )}
      </div>

      <Button type="submit" isLoading={isSubmitting} className="mt-1 w-full">
        Create account
      </Button>
    </form>
  );
}
