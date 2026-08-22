import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, ShieldCheck, Sparkles, Wallet } from "lucide-react";
import { ROUTES } from "@/utils/constants";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

const features = [
  {
    icon: CalendarCheck,
    title: "Attendance that tracks itself",
    description: "Check in once, see daily and weekly views.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based access",
    description: "Employees see their own; HR sees everything.",
  },
  {
    icon: Wallet,
    title: "Payroll visibility",
    description: "Read-only salary breakdowns, always current.",
  },
];

function AuthTabs() {
  const { pathname } = useLocation();
  const isSignup = pathname === ROUTES.signup;

  return (
    <div className="inline-flex rounded-full bg-slate-100 p-1">
      <Link
        to={ROUTES.login}
        className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
          !isSignup ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Sign in
      </Link>
      <Link
        to={ROUTES.signup}
        className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
          isSignup ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Sign up
      </Link>
    </div>
  );
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full">
      <div className="relative hidden w-[45%] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#120f36] to-[#1d1657] px-12 py-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: "radial-gradient(circle at 20% 10%, rgba(91,102,246,0.35), transparent 55%)",
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 font-display text-lg font-semibold">
            D
          </div>
          <span className="font-display text-xl font-semibold">Dayflow</span>
        </div>

        <div className="relative flex flex-col gap-8">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Human Resource Management System
            </span>
            <h1 className="mt-6 font-display text-4xl font-medium leading-tight text-white xl:text-5xl">
              Every workday,
              <br />
              perfectly aligned.
            </h1>
            <p className="mt-4 max-w-sm text-sm text-white/70">
              Onboarding, profiles, attendance, leave and payroll — one calm workspace for employees and HR.
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.title}</p>
                  <p className="mt-0.5 text-sm text-white/60">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/40">Dayflow HRMS</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:justify-start">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-display text-base font-semibold text-white">
                D
              </div>
              <span className="font-display text-lg font-semibold text-slate-900">Dayflow</span>
            </div>
            <AuthTabs />
          </div>

          <h2 className="font-display text-2xl font-medium text-slate-900 sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-slate-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
