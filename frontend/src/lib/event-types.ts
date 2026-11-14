import { z } from 'zod';
import type { DurationMinutes } from '@/api';

// Длительности типа встречи — те же, что в контракте (typespec/main.tsp, DurationMinutes).
export const DURATIONS = [15, 30, 45, 60] as const satisfies readonly DurationMinutes[];

// Подпись часового пояса владельца: всё время в интерфейсе — по Алматы (docs/spec.md).
export const OWNER_TIME_ZONE_LABEL = 'Asia/Almaty (UTC+05:00)';

export function formatDuration(minutes: number) {
  return `${minutes} мин`;
}

// Правила полей совпадают с контрактом: название 1–100 символов, описание до 500.
// Название обрезается по краям, как на сервере.
export const eventTypeFormSchema = z.object({
  title: z.string().trim().min(1, 'Введите название').max(100, 'Не длиннее 100 символов'),
  description: z.string().max(500, 'Не длиннее 500 символов'),
  durationMinutes: z.enum(DURATIONS.map(String) as ['15', '30', '45', '60']),
});

export type EventTypeFormInput = z.input<typeof eventTypeFormSchema>;
export type EventTypeFormValues = z.output<typeof eventTypeFormSchema>;
