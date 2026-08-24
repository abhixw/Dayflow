import { toISODate } from "@/utils/formatters";

export interface Tenure {
  years: number;
  months: number;
  days: number;
}

export type WorkJourney =
  | { status: "missing" }
  | { status: "future"; joiningDate: string }
  | {
      status: "active";
      joiningDate: string;
      tenure: Tenure;
      totalDays: number;
      isAnniversaryToday: boolean;
      nextMilestone: { years: number; date: string };
    };

function dateOnly(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

function parseISODateOnly(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return dateOnly(year, month - 1, day);
}

/**
 * Computes tenure and next-anniversary from a joining date, entirely from
 * real data (joiningDate + "now") — never hard-coded. Handles: no joining
 * date, a future joining date, an exact one-year boundary, and leap-year
 * joining dates (Feb 29 anniversaries fall on Mar 1 in non-leap years,
 * which is what JS's own Date arithmetic does with an out-of-range day —
 * a deterministic, if debatable, convention; there's no universal
 * standard for this case).
 */
export function computeWorkJourney(
  joiningDateISO: string | null | undefined,
  now: Date = new Date()
): WorkJourney {
  if (!joiningDateISO) return { status: "missing" };

  const joining = parseISODateOnly(joiningDateISO);
  const today = dateOnly(now.getFullYear(), now.getMonth(), now.getDate());

  if (joining.getTime() > today.getTime()) {
    return { status: "future", joiningDate: joiningDateISO };
  }

  let years = today.getFullYear() - joining.getFullYear();
  let months = today.getMonth() - joining.getMonth();
  let days = today.getDate() - joining.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = dateOnly(today.getFullYear(), today.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((today.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24));

  let anniversaryYear = today.getFullYear();
  let anniversary = dateOnly(anniversaryYear, joining.getMonth(), joining.getDate());
  const isAnniversaryToday = anniversary.getTime() === today.getTime();
  // "Next" milestone means still ahead — if today IS the anniversary, that
  // one is happening now (isAnniversaryToday covers celebrating it), so the
  // next one is a year further out.
  if (anniversary.getTime() <= today.getTime()) {
    anniversaryYear += 1;
    anniversary = dateOnly(anniversaryYear, joining.getMonth(), joining.getDate());
  }
  const milestoneYears = anniversaryYear - joining.getFullYear();

  return {
    status: "active",
    joiningDate: joiningDateISO,
    tenure: { years, months, days },
    totalDays,
    isAnniversaryToday,
    nextMilestone: { years: milestoneYears, date: toISODate(anniversary) },
  };
}

export function formatTenure(tenure: Tenure): string {
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

  if (tenure.years > 0) {
    return tenure.months > 0
      ? `${plural(tenure.years, "year")} ${plural(tenure.months, "month")}`
      : plural(tenure.years, "year");
  }
  if (tenure.months > 0) {
    return tenure.days > 0
      ? `${plural(tenure.months, "month")} ${plural(tenure.days, "day")}`
      : plural(tenure.months, "month");
  }
  return tenure.days > 0 ? plural(tenure.days, "day") : "Joined today";
}
