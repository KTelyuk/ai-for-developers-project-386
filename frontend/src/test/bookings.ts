import { http, HttpResponse } from 'msw/http';
import type { BookingCreated, CreateBooking, Slot } from '@/api';
import { mockAvailabilityApi } from '@/test/availability.ts';
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
  // Счётчики календаря считаются по тем же свободным слотам и обновляются после брони.
  mockAvailabilityApi(() =>
    Object.fromEntries(Object.entries(free).map(([date, list]) => [date, list.length])),
  );
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
