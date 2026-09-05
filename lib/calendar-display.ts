export type DisplayDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_LABELS: Record<DisplayDay, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat"
};

/**
 * Arc Week law:
 * - weekends off => Monday through Friday
 * - weekends on => Sunday through Saturday, Sunday first
 */
export function weekDisplayOrder(weekendsVisible: boolean): DisplayDay[] {
  return weekendsVisible ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5];
}

/**
 * Arc Year Map law: attendance-oriented school weeks are always Mon-Fri.
 * Weekend visibility in Week view must never change this order.
 */
export function yearAttendanceDisplayOrder(): DisplayDay[] {
  return [1, 2, 3, 4, 5];
}

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Return the Sunday or Monday that anchors the current Week presentation. */
export function weekDisplayStart(anchor: Date, weekendsVisible: boolean): Date {
  const start = new Date(anchor);
  start.setHours(12, 0, 0, 0);

  const currentDay = start.getDay();
  const targetDay = weekendsVisible ? 0 : 1;
  let delta = targetDay - currentDay;
  if (delta > 0) delta -= 7;
  start.setDate(start.getDate() + delta);
  return start;
}

export function weekDisplayDates(anchor: Date, weekendsVisible: boolean) {
  const order = weekDisplayOrder(weekendsVisible);
  const start = weekDisplayStart(anchor, weekendsVisible);

  return order.map((weekday, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      weekday,
      label: WEEKDAY_LABELS[weekday],
      key: dateKey(date),
      number: date.getDate(),
      month: date.toLocaleDateString(undefined, { month: "short" })
    };
  });
}
