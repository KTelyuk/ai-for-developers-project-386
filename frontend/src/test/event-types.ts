import { http, HttpResponse } from 'msw/http';
import type { CreateEventType, EventType } from '@/api';
import { server } from '@/test/msw.ts';

export const intro: EventType = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Знакомство',
  description: 'Короткий звонок, чтобы познакомиться',
  durationMinutes: 15,
};

export const consultation: EventType = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Консультация',
  description: 'Подробный разбор вашей задачи',
  durationMinutes: 60,
};

// API типов встреч в памяти теста: созданный тип сразу появляется в списке.
// Возвращает тела запросов на создание, чтобы тест видел, что ушло на сервер.
export function mockEventTypesApi(initial: EventType[] = []) {
  const eventTypes = [...initial];
  const created: CreateEventType[] = [];
  server.use(
    http.get('*/api/event-types', () => HttpResponse.json(eventTypes)),
    http.post('*/api/admin/event-types', async ({ request }) => {
      const body = (await request.json()) as CreateEventType;
      created.push(body);
      const eventType: EventType = {
        id: `00000000-0000-4000-8000-${String(eventTypes.length + 1).padStart(12, '0')}`,
        title: body.title,
        description: body.description ?? '',
        durationMinutes: body.durationMinutes,
      };
      eventTypes.push(eventType);
      return HttpResponse.json(eventType, { status: 201 });
    }),
  );
  return { created };
}
