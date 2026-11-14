// Дни и время по Алматы. Слоты считает сервер; фронтенд только показывает их как есть
// и строит список дней окна для выбора (docs/spec.md, «Правила расписания»).

const OWNER_OFFSET_MS = 5 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;
export const WINDOW_DAYS = 14;

export type WindowDay = {
  date: string;
  // `пн, 16 ноября`.
  label: string;
  dayOfMonth: number;
  // День недели с понедельника: 0 — понедельник, 6 — воскресенье.
  weekday: number;
  weekend: boolean;
};

// Дата `YYYY-MM-DD` читается как полночь UTC: так день недели и подпись не зависят от пояса браузера.
const dayLabel = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

// 14 календарных дней начиная с сегодняшнего по Алматы.
export function windowDays(now: Date): WindowDay[] {
  const today = Date.parse(new Date(now.getTime() + OWNER_OFFSET_MS).toISOString().slice(0, 10));
  return Array.from({ length: WINDOW_DAYS }, (_, index) => {
    const day = new Date(today + index * DAY_MS);
    const weekday = (day.getUTCDay() + 6) % 7;
    return {
      date: day.toISOString().slice(0, 10),
      label: dayLabel.format(day),
      dayOfMonth: day.getUTCDate(),
      weekday,
      weekend: weekday >= 5,
    };
  });
}

// Время слота как пришло от сервера: `2026-11-16T09:00:00+05:00` → `09:00`.
export function formatSlotTime(iso: string) {
  return iso.slice(11, 16);
}
