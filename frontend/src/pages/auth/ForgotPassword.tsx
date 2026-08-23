import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { authApi } from "@/api/auth";
import { ROUTES } from "@/utils/constants";
import type { ApiError, ForgotPasswordPayload } from "@/types/auth";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordPayload>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(payload: ForgotPasswordPayload) {
    setError(null);
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(payload);
      setSubmitted(true);
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={
        <>
          Remembered your password?{" "}
          <Link to={ROUTES.login} className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {submitted ? (
        <Alert variant="success">
          If an account with that email exists, we've sent a password reset link to it. Check your inbox.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
