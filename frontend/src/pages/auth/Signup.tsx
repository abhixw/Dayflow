import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SignupForm } from "@/components/forms/SignupForm";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import type { ApiError, SignupPayload } from "@/types/auth";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(payload: SignupPayload) {
    setError(null);
    setIsSubmitting(true);
    try {
      await signup(payload);
      setSuccess(true);
      setTimeout(() => navigate(ROUTES.login, { replace: true }), 2000);
    } catch (err) {
      const apiError = err as ApiError;
      setError(
        apiError.status === 409
          ? "An account with this email or employee ID already exists."
          : apiError.message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Get started with Dayflow."
      footer={
        <>
          Already have an account?{" "}
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
      {success ? (
        <Alert variant="success">
          Account created. Please check your email to verify your account before signing in.
        </Alert>
      ) : (
        <SignupForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
    </AuthLayout>
  );
}
