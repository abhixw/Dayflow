import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { LoginForm } from "@/components/forms/LoginForm";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/constants";
import type { ApiError } from "@/types/auth";
import type { LoginPayload, Role } from "@/types/auth";

function dashboardForRole(role: Role): string {
  return role === "EMPLOYEE" ? ROUTES.employeeDashboard : ROUTES.adminDashboard;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(payload: LoginPayload) {
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login(payload);
      navigate(from ?? dashboardForRole(user.role), { replace: true });
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.status === 401 ? "Invalid email or password." : apiError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <>
          Don't have an account?{" "}
          <Link to={ROUTES.signup} className="font-medium text-brand-600 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link to={ROUTES.forgotPassword} className="font-medium text-brand-600 hover:underline">
          Forgot password?
        </Link>
      </p>
    </AuthLayout>
  );
}
