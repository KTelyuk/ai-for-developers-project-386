import { z } from 'zod';
import { EMAIL_MAX_LENGTH, EMAIL_PATTERN, GUEST_NAME_MAX_LENGTH } from '@/lib/limits.ts';

// Имя проверяется после обрезки по краям, как на сервере; email — `local@domain`.
export const bookingFormSchema = z.object({
  guestName: z
    .string()
    .trim()
    .min(1, 'Введите имя')
    .max(GUEST_NAME_MAX_LENGTH, `Не длиннее ${GUEST_NAME_MAX_LENGTH} символов`),
  guestEmail: z
    .string()
    .trim()
    .regex(EMAIL_PATTERN, 'Введите email в формате name@example.com')
    .max(EMAIL_MAX_LENGTH, `Не длиннее ${EMAIL_MAX_LENGTH} символов`),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

// Ссылку сервер отдаёт путём от корня сайта; гостю показываем полный адрес.
export function absoluteLink(link: string) {
  return new URL(link, window.location.origin).toString();
}
