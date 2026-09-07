const DAY_MS = 86_400_000;

export type WeekPreference = {
  weekends: boolean;
};

export function weekdayIndex(date: string) {
  return new Date(`${date}T12:00:00Z`).getUTCDay();
}

export function isVisiblePlanningDate(date: string, preference: WeekPreference) {
  if (preference.weekends) return true;
  const day = weekdayIndex(date);
  return day >= 1 && day <= 5;
}

export function mondayFor(date: string) {
  const current = new Date(`${date}T12:00:00Z`);
  const day = current.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  return new Date(current.getTime() + delta * DAY_MS).toISOString().slice(0, 10);
}

export function visibleWeekDates(anchorDate: string, preference: WeekPreference) {
  const monday = new Date(`${mondayFor(anchorDate)}T12:00:00Z`);
  const dates: string[] = [];
  const startDelta = preference.weekends ? -1 : 0;
  const count = preference.weekends ? 7 : 5;
  for (let index = 0; index < count; index += 1) {
    dates.push(new Date(monday.getTime() + (startDelta + index) * DAY_MS).toISOString().slice(0, 10));
  }
  return dates;
}
