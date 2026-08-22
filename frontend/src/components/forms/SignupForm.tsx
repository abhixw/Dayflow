import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PUBLIC_SIGNUP_ROLES } from "@/utils/constants";
import { formatRole } from "@/utils/formatters";
import type { SignupPayload } from "@/types/auth";

const passwordRequirements = [
  { test: (v: string) => v.length >= 8, label: "At least 8 characters" },
  { test: (v: string) => /[A-Z]/.test(v), label: "One uppercase letter" },
  { test: (v: string) => /[a-z]/.test(v), label: "One lowercase letter" },
  { test: (v: string) => /[0-9]/.test(v), label: "One number" },
];

const signupSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
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
  } = useForm<SignupPayload>({ resolver: zodResolver(signupSchema) });

  const password = watch("password") ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      <Input label="Employee ID" autoComplete="off" error={errors.employeeId?.message} {...register("employeeId")} />

      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />

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

      <ul className="flex flex-col gap-1 text-xs text-slate-500">
        {passwordRequirements.map((req) => (
          <li key={req.label} className={req.test(password) ? "text-emerald-600" : undefined}>
            {req.test(password) ? "✓" : "·"} {req.label}
          </li>
        ))}
      </ul>

      <Select label="Role" defaultValue="" error={errors.role?.message} {...register("role")}>
        <option value="" disabled>
          Select a role
        </option>
        {PUBLIC_SIGNUP_ROLES.map((role) => (
          <option key={role} value={role}>
            {formatRole(role)}
          </option>
        ))}
      </Select>

      <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
        Create account
      </Button>
    </form>
  );
}
