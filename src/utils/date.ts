import { differenceInCalendarDays, parseISO } from "date-fns";

export function daysUntil(isoDate: string): number {
  return differenceInCalendarDays(parseISO(isoDate), new Date());
}

export function isExpired(isoDate: string): boolean {
  return daysUntil(isoDate) < 0;
}

export function isExpiringSoon(isoDate: string, withinDays = 3): boolean {
  const days = daysUntil(isoDate);
  return days >= 0 && days <= withinDays;
}
