// Расписание владельца — чистые функции без ввода-вывода (docs/spec.md, «Правила расписания»).
// «Сейчас» и записи приходят аргументами, поэтому модуль переиспользуют слоты дня, счётчики
// по дням окна и проверка брони.

import { isIntervalFree, type Interval } from './overlap.ts';

// Смещение Алматы задано одной константой: летнего времени нет, а tzdata до 2024a давала UTC+6.
export const OWNER_OFFSET = '+05:00';
const OWNER_OFFSET_MS = 5 * 60 * 60_000;

export const WINDOW_DAYS = 14;
export const SLOT_STEP_MINUTES = 15;

// Рабочий день и обед в минутах от полуночи по Алматы.
const WORK_START = 9 * 60;
const WORK_END = 18 * 60;
const LUNCH_START = 13 * 60;
const LUNCH_END = 14 * 60;

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

export type Slot = { startAt: string; endAt: string };

export type DaySlotsInput = {
  // День `YYYY-MM-DD` по Алматы.
  date: string;
  durationMinutes: number;
  // Записи любого типа встречи: слот не должен с ними пересекаться.
  bookings: readonly Interval[];
  now: Date;
};

// Полночь дня по Алматы в миллисекундах UTC. Дата уже проверена: она из окна записи.
function dayStartMs(date: string): number {
  return Date.parse(`${date}T00:00:00${OWNER_OFFSET}`);
}

function toOwnerDate(ms: number): string {
  return new Date(ms + OWNER_OFFSET_MS).toISOString().slice(0, 10);
}

// Момент времени строкой ISO 8601 со смещением Алматы: `2026-11-16T09:00:00+05:00`.
export function formatOwnerTime(ms: number): string {
  return `${new Date(ms + OWNER_OFFSET_MS).toISOString().slice(0, 19)}${OWNER_OFFSET}`;
}

// Сегодняшняя дата по Алматы.
export function todayInOwnerZone(now: Date): string {
  return toOwnerDate(now.getTime());
}

// Окно записи: 14 календарных дней начиная с сегодняшнего по Алматы.
export function windowDates(now: Date): string[] {
  const today = dayStartMs(todayInOwnerZone(now));
  return Array.from({ length: WINDOW_DAYS }, (_, index) => toOwnerDate(today + index * DAY_MS));
}

export function isInWindow(date: string, now: Date): boolean {
  return windowDates(now).includes(date);
}

// Свободные слоты дня: будни, рабочие часы без обеда, шаг 15 минут, длительность типа встречи.
// Слот недоступен, если его начало наступило (начало ≤ сейчас) или он пересекается с записью.
// Дни вне окна и выходные — пустой список.
export function daySlots({ date, durationMinutes, bookings, now }: DaySlotsInput): Slot[] {
  if (!isInWindow(date, now)) return [];
  const midnight = dayStartMs(date);
  const weekday = new Date(midnight + OWNER_OFFSET_MS).getUTCDay();
  if (weekday === 0 || weekday === 6) return [];

  const slots: Slot[] = [];
  for (let start = WORK_START; start + durationMinutes <= WORK_END; start += SLOT_STEP_MINUTES) {
    const end = start + durationMinutes;
    if (start < LUNCH_END && end > LUNCH_START) continue;
    const startMs = midnight + start * MINUTE_MS;
    if (startMs <= now.getTime()) continue;
    const slot = {
      startAt: formatOwnerTime(startMs),
      endAt: formatOwnerTime(midnight + end * MINUTE_MS),
    };
    if (isIntervalFree(slot, bookings)) slots.push(slot);
  }
  return slots;
}
