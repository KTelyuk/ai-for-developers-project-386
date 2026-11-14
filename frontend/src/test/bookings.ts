import { http, HttpResponse } from 'msw/http';
import type { Booking, BookingCreated, CreateBooking, EventType, Slot } from '@/api';
import { server } from '@/test/msw.ts';

export const BOOKING_ID = '33333333-3333-4333-8333-333333333333';
export const BOOKING_TOKEN = 'secret-token_123';

// Слоты и бронирование в памяти теста: забронированное время пропадает из слотов.
// `reject` подменяет ответ на бронь ошибкой, чтобы проверить сообщения сервера.
// Возвращает тела броней и запрошенные даты слотов, чтобы тест видел, что ушло на сервер.
export function mockBookingApi({
  slots,
  reject,
}: {
  slots: Record<string, Slot[]>;
  reject?: { status: number; code: string; message: string };
}) {
  const free = Object.fromEntries(Object.entries(slots).map(([date, list]) => [date, [...list]]));
  const created: CreateBooking[] = [];
  const slotRequests: string[] = [];
  server.use(
    http.get('*/api/event-types/:id/slots', ({ request }) => {
      const date = new URL(request.url).searchParams.get('date') ?? '';
      slotRequests.push(date);
      return HttpResponse.json(free[date] ?? []);
    }),
    http.post('*/api/bookings', async ({ request }) => {
      const body = (await request.json()) as CreateBooking;
      created.push(body);
      if (reject) {
        return HttpResponse.json(
          { code: reject.code, message: reject.message },
          { status: reject.status },
        );
      }
      const date = body.startAt.slice(0, 10);
      const slot = free[date]?.find((item) => item.startAt === body.startAt);
      free[date] = (free[date] ?? []).filter((item) => item !== slot);
      const response: BookingCreated = {
        booking: {
          id: BOOKING_ID,
          eventTypeId: body.eventTypeId,
          guestName: body.guestName,
          guestEmail: body.guestEmail,
          startAt: body.startAt,
          endAt: slot?.endAt ?? body.startAt,
          createdAt: '2026-11-16T10:00:00+05:00',
        },
        token: BOOKING_TOKEN,
        link: `/bookings/${BOOKING_ID}?token=${BOOKING_TOKEN}`,
      };
      return HttpResponse.json(response, { status: 201 });
    }),
  );
  return { created, slotRequests };
}

export const guestBooking: Booking = {
  id: BOOKING_ID,
  eventTypeId: '22222222-2222-4222-8222-222222222222',
  guestName: 'Анна',
  guestEmail: 'anna@example.com',
  startAt: '2026-11-17T09:00:00+05:00',
  endAt: '2026-11-17T10:00:00+05:00',
  createdAt: '2026-11-16T10:00:00+05:00',
};

type ErrorReply = { status: number; code: string; message: string };

function errorReply({ status, code, message }: ErrorReply) {
  return HttpResponse.json({ code, message }, { status });
}

// Страница записи в памяти теста: одна запись `guestBooking` с токеном `BOOKING_TOKEN`
// и её тип встречи. Чужой токен — 403, после отмены запись не найти — 404.
// `cancelError` подменяет ответ на отмену ошибкой. Возвращает токены отмен, ушедших на сервер.
export function mockGuestBookingApi({
  eventType,
  cancelError,
}: {
  eventType: EventType;
  cancelError?: ErrorReply;
}) {
  let exists = true;
  const cancelled: string[] = [];
  function denied(id: unknown, request: Request) {
    const token = new URL(request.url).searchParams.get('token');
    if (!exists || id !== BOOKING_ID) {
      return errorReply({ status: 404, code: 'NOT_FOUND', message: 'Запись не найдена' });
    }
    if (token !== BOOKING_TOKEN) {
      return errorReply({ status: 403, code: 'INVALID_TOKEN', message: 'Неверная ссылка' });
    }
    return undefined;
  }
  server.use(
    http.get('*/api/event-types/:id', ({ params }) =>
      params.id === eventType.id
        ? HttpResponse.json(eventType)
        : errorReply({ status: 404, code: 'NOT_FOUND', message: 'Тип встречи не найден' }),
    ),
    http.get(
      '*/api/bookings/:id',
      ({ params, request }) => denied(params.id, request) ?? HttpResponse.json(guestBooking),
    ),
    http.delete('*/api/bookings/:id', ({ params, request }) => {
      cancelled.push(new URL(request.url).searchParams.get('token') ?? '');
      const reply = denied(params.id, request);
      if (reply) return reply;
      if (cancelError) return errorReply(cancelError);
      exists = false;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { cancelled };
}
