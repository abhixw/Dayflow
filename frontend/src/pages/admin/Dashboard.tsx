import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user?.email}</h1>
      <p className="mt-1 text-sm text-slate-500">Your dashboard will appear here in a later phase.</p>
    </div>
  );
}
