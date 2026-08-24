import { Sparkles } from "lucide-react";
import { computeWorkJourney, formatTenure } from "@/utils/workJourney";
import { formatDate } from "@/utils/formatters";

interface WorkJourneyProps {
  joiningDate: string | null | undefined;
}

export function WorkJourney({ joiningDate }: WorkJourneyProps) {
  const journey = computeWorkJourney(joiningDate);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">Your Dayflow journey</h2>

      {journey.status === "missing" && (
        <p className="mt-3 text-sm text-slate-500">Joining date not available.</p>
      )}

      {journey.status === "future" && (
        <p className="mt-3 text-sm text-slate-500">Starts {formatDate(journey.joiningDate)}.</p>
      )}

      {journey.status === "active" && (
        <>
          <p className="mt-1 text-xs text-slate-400">Joined {formatDate(journey.joiningDate)}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {formatTenure(journey.tenure)}
          </p>
          {journey.isAnniversaryToday && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Happy work anniversary!
            </p>
          )}
          <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Next milestone</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {journey.nextMilestone.years} {journey.nextMilestone.years === 1 ? "year" : "years"} with Dayflow
            </p>
            <p className="text-xs text-slate-400">{formatDate(journey.nextMilestone.date)}</p>
          </div>
        </>
      )}
    </div>
  );
}
