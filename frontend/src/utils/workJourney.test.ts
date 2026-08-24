import { describe, expect, it } from "vitest";
import { computeWorkJourney, formatTenure } from "./workJourney";

describe("computeWorkJourney", () => {
  it("returns missing when there is no joining date", () => {
    expect(computeWorkJourney(null)).toEqual({ status: "missing" });
    expect(computeWorkJourney(undefined)).toEqual({ status: "missing" });
    expect(computeWorkJourney("")).toEqual({ status: "missing" });
  });

  it("returns future for a joining date after today", () => {
    const result = computeWorkJourney("2027-01-01", new Date(2026, 7, 24));
    expect(result).toEqual({ status: "future", joiningDate: "2027-01-01" });
  });

  it("computes tenure and next milestone for an ordinary in-progress year", () => {
    // Joined 2025-05-12, "today" is 2026-08-24 -> 1 year, 3 months, 12 days
    const result = computeWorkJourney("2025-05-12", new Date(2026, 7, 24));
    if (result.status !== "active") throw new Error("expected active");
    expect(result.tenure).toEqual({ years: 1, months: 3, days: 12 });
    expect(result.isAnniversaryToday).toBe(false);
    expect(result.nextMilestone).toEqual({ years: 2, date: "2027-05-12" });
  });

  it("handles the exact one-year anniversary boundary", () => {
    const result = computeWorkJourney("2025-08-24", new Date(2026, 7, 24));
    if (result.status !== "active") throw new Error("expected active");
    expect(result.tenure).toEqual({ years: 1, months: 0, days: 0 });
    expect(result.isAnniversaryToday).toBe(true);
    // On the anniversary itself, the *next* milestone is one year further out.
    expect(result.nextMilestone).toEqual({ years: 2, date: "2027-08-24" });
  });

  it("handles joining today", () => {
    const result = computeWorkJourney("2026-08-24", new Date(2026, 7, 24));
    if (result.status !== "active") throw new Error("expected active");
    expect(result.tenure).toEqual({ years: 0, months: 0, days: 0 });
    expect(result.totalDays).toBe(0);
    expect(result.isAnniversaryToday).toBe(true);
  });

  it("handles a leap-year joining date (Feb 29)", () => {
    // Joined on a leap day; "today" is in a non-leap year after Mar 1.
    const result = computeWorkJourney("2024-02-29", new Date(2026, 7, 24));
    if (result.status !== "active") throw new Error("expected active");
    // JS Date rolls Feb 29 -> Mar 1 in non-leap years; deterministic, documented.
    expect(result.nextMilestone.date).toBe("2027-03-01");
  });

  it("computes total elapsed days correctly across a leap year", () => {
    // 2024 is a leap year (366 days); from 2024-01-01 to 2025-01-01 is 366 days.
    const result = computeWorkJourney("2024-01-01", new Date(2025, 0, 1));
    if (result.status !== "active") throw new Error("expected active");
    expect(result.totalDays).toBe(366);
  });
});

describe("formatTenure", () => {
  it("formats years and months", () => {
    expect(formatTenure({ years: 1, months: 3, days: 12 })).toBe("1 year 3 months");
    expect(formatTenure({ years: 2, months: 1, days: 0 })).toBe("2 years 1 month");
  });

  it("omits zero months", () => {
    expect(formatTenure({ years: 1, months: 0, days: 0 })).toBe("1 year");
  });

  it("formats months and days when under a year", () => {
    expect(formatTenure({ years: 0, months: 2, days: 5 })).toBe("2 months 5 days");
  });

  it("formats days only when under a month", () => {
    expect(formatTenure({ years: 0, months: 0, days: 5 })).toBe("5 days");
  });

  it("shows a friendly label for day zero", () => {
    expect(formatTenure({ years: 0, months: 0, days: 0 })).toBe("Joined today");
  });
});
