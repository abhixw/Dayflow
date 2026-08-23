import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { authApi } from "@/api/auth";
import { ROUTES } from "@/utils/constants";
import type { ApiError } from "@/types/auth";

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

type FormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(resetPasswordSchema) });

  async function onSubmit(values: FormValues) {
    if (!token) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword: values.newPassword });
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.login, { replace: true }), 2000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(
        apiError.status === 400 ? "This reset link is invalid or has expired." : apiError.message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <AuthLayout title="Reset password">
        <div className="flex flex-col gap-4">
          <Alert variant="error">This reset link is missing its token. Request a new one.</Alert>
          <Link to={ROUTES.forgotPassword}>
            <Button className="w-full">Back to forgot password</Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset password" subtitle="Choose a new password for your account.">
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {success ? (
        <Alert variant="success">Password reset. Redirecting you to sign in...</Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Reset password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
