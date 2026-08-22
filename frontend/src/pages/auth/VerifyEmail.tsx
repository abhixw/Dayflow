import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Alert } from "@/components/ui/Alert";
import { LoadingState } from "@/components/common/LoadingState";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/api/auth";
import { ROUTES } from "@/utils/constants";
import type { ApiError } from "@/types/auth";

type Status = "pending" | "verifying" | "success" | "error";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>(token ? "verifying" : "pending");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    authApi
      .verifyEmail({ token })
      .then(() => setStatus("success"))
      .catch((err: ApiError) => {
        setError(err.message);
        setStatus("error");
      });
  }, [token]);

  return (
    <AuthLayout title="Email verification">
      {status === "pending" && (
        <Alert variant="info">
          We've sent a verification link to your email. Open it to activate your account, then come back and sign
          in.
        </Alert>
      )}

      {status === "verifying" && <LoadingState label="Verifying your email..." />}

      {status === "success" && (
        <div className="flex flex-col gap-4">
          <Alert variant="success">Your email has been verified. You can now sign in.</Alert>
          <Link to={ROUTES.login}>
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col gap-4">
          <Alert variant="error">{error ?? "This verification link is invalid or has expired."}</Alert>
          <Link to={ROUTES.login}>
            <Button variant="secondary" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      )}
    </AuthLayout>
  );
}
