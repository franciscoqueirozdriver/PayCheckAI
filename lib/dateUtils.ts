// Funções utilitárias de datas para o cálculo de DSR
import { eachDayOfInterval } from 'date-fns';
import { listHolidays } from './feriados';

export function getMonthDays(year: number, month0: number): Date[] {
  const start = new Date(year, month0, 1);
  const end = new Date(year, month0 + 1, 0);
  return eachDayOfInterval({ start, end });
}

export function countSundays(dates: Date[]): number {
  return dates.filter((d) => d.getDay() === 0).length;
}

export function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some(
    (h) =>
      h.getFullYear() === date.getFullYear() &&
      h.getMonth() === date.getMonth() &&
      h.getDate() === date.getDate()
  );
}

export function isBusinessDay(
  date: Date,
  opts: { includeSaturday: boolean; holidays: Date[] }
): boolean {
  const day = date.getDay();
  if (day === 0) return false;
  if (!opts.includeSaturday && day === 6) return false;
  if (isHoliday(date, opts.holidays)) return false;
  return true;
}

export function countBusinessDays(
  dates: Date[],
  opts: { includeSaturday: boolean; holidays: Date[] }
): number {
  return dates.filter((d) => isBusinessDay(d, opts)).length;
}

export function listHolidaysWrapper(uf: string, municipio?: string): Date[] {
  return listHolidays(uf, municipio);
}
