import type { Plan } from "./domain";

export type UnitRangeReview = {
  allowed: boolean;
  minimumEndDate: string | null;
  reason: string | null;
};

export function minimumUnitEndDate(unit: Plan, children: Plan[]): string | null {
  if (unit.type !== "unit" || !unit.date) return null;
  const scheduledChildDates = children
    .filter((child) => child.parentUnitId === unit.id && child.date)
    .map((child) => child.date as string);
  return [unit.date, ...scheduledChildDates].sort().at(-1) ?? unit.date;
}

export function reviewUnitEndDate(unit: Plan, children: Plan[], nextEndDate: string): UnitRangeReview {
  const minimumEndDate = minimumUnitEndDate(unit, children);
  if (unit.type !== "unit" || !unit.date || !minimumEndDate) {
    return { allowed: false, minimumEndDate, reason: "Schedule the Unit before changing its range." };
  }
  if (!nextEndDate) {
    return { allowed: false, minimumEndDate, reason: "Choose an end date." };
  }
  if (nextEndDate < unit.date) {
    return { allowed: false, minimumEndDate, reason: "A Unit cannot end before it starts." };
  }
  if (nextEndDate < minimumEndDate) {
    return {
      allowed: false,
      minimumEndDate,
      reason: `A scheduled Lesson keeps this Unit open through ${minimumEndDate}.`
    };
  }
  return { allowed: true, minimumEndDate, reason: null };
}
