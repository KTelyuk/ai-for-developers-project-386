import { z } from 'zod';

// Правила полей совпадают с контрактом (typespec/main.tsp, CreateBooking): имя 1–100 символов
// после обрезки по краям, email — `local@domain` до 254 символов.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

export const bookingFormSchema = z.object({
  guestName: z.string().trim().min(1, 'Введите имя').max(100, 'Не длиннее 100 символов'),
  guestEmail: z
    .string()
    .trim()
    .regex(EMAIL_PATTERN, 'Введите email в формате name@example.com')
    .max(254, 'Не длиннее 254 символов'),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Дата `2026-11-17` из момента `2026-11-17T09:00:00+05:00` → «вт, 17 ноября».
// Строка читается как полночь UTC, поэтому подпись не зависит от пояса браузера.
const dateLabel = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export function formatBookingDate(iso: string) {
  return dateLabel.format(new Date(iso.slice(0, 10)));
}

// Интервал как пришёл от сервера, по Алматы: `09:00–10:00`.
export function formatTimeRange(startAt: string, endAt: string) {
  return `${startAt.slice(11, 16)}–${endAt.slice(11, 16)}`;
}

// Ссылку сервер отдаёт путём от корня сайта; гостю показываем полный адрес.
export function absoluteLink(link: string) {
  return new URL(link, window.location.origin).toString();
}
