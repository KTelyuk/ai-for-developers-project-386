// Начальные данные для разработки: `mise run dev` запускает сервер с флагом `--seed`, и после
// каждого перезапуска (`node --watch`) типы встреч уже есть. Продакшен и тесты стартуют пустыми.

import { randomUUID } from 'node:crypto';
import type { EventType, Store } from './store.ts';

export const DEV_EVENT_TYPES: readonly Omit<EventType, 'id'>[] = [
  {
    title: 'Знакомство',
    description: 'Короткий звонок, чтобы познакомиться и понять задачу',
    durationMinutes: 15,
  },
  {
    title: 'Консультация',
    description: 'Ответы на вопросы и разбор ситуации',
    durationMinutes: 30,
  },
  {
    title: 'Разбор задачи',
    description: 'Подробный разбор вашей задачи с планом действий',
    durationMinutes: 60,
  },
];

// Записей нет: им нужны даты в окне записи, а гость всё равно получает ссылку только при брони.
export function seedDevData(store: Store): void {
  for (const eventType of DEV_EVENT_TYPES) {
    store.eventTypes.save({ id: randomUUID(), ...eventType });
  }
}
