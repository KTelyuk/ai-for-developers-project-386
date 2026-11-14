import { randomBytes, randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type {
  Booking,
  BookingCreated,
  CreateBooking,
  CreateEventType,
  DayAvailability,
  EventType,
  HealthStatus,
  Slot,
  UpdateEventType,
} from './api/types.gen.ts';
import type { Clock } from './clock.ts';
import { ApiError } from './errors.ts';
import { cancelGuestBooking, findGuestBooking, publicBooking } from './guest-bookings.ts';
import { isIntervalFree } from './overlap.ts';
import { daySlots, formatOwnerTime, isInWindow, rangeDates, slotStartingAt } from './schedule.ts';
import type { Booking as StoredBooking, Store } from './store.ts';

// Ссылка на страницу записи — путь от корня сайта с идентификатором и токеном отмены.
function bookingLink(id: string, token: string): string {
  return `/bookings/${id}?token=${encodeURIComponent(token)}`;
}

export type Deps = { clock: Clock; store: Store };

// Контракт проверяет длину как есть; название из одних пробелов тоже считается пустым.
function normalizeTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed === '') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Название не может быть пустым');
  }
  return trimmed;
}

// Обработчики по operationId из openapi/openapi.yaml. Зависимости приходят из buildApp.
// Форму тела, длины полей и список длительностей уже проверил fastify-openapi-glue по контракту.
export function createHandlers({ clock, store }: Deps) {
  function findEventType(id: string): EventType {
    const eventType = store.eventTypes.get(id);
    if (!eventType) throw new ApiError(404, 'NOT_FOUND', 'Тип встречи не найден');
    return eventType;
  }

  return {
    getHealth(): HealthStatus {
      return { status: 'ok' };
    },

    listEventTypes(): EventType[] {
      return store.eventTypes.list();
    },

    getEventType(request: FastifyRequest<{ Params: { id: string } }>): EventType {
      return findEventType(request.params.id);
    },

    listSlots(
      request: FastifyRequest<{ Params: { id: string }; Querystring: { date: string } }>,
    ): Slot[] {
      const { durationMinutes } = findEventType(request.params.id);
      const { date } = request.query;
      const now = clock();
      // Формат даты проверил контракт; здесь — что день существует и попадает в окно записи.
      if (!isInWindow(date, now)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'День вне окна записи');
      }
      return daySlots({ date, durationMinutes, bookings: store.bookings.list(), now });
    },

    listAvailability(
      request: FastifyRequest<{
        Params: { id: string };
        Querystring: { from: string; to: string };
      }>,
    ): DayAvailability[] {
      const { durationMinutes } = findEventType(request.params.id);
      const dates = rangeDates(request.query.from, request.query.to);
      if (!dates) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Неверный диапазон дней');
      }
      const now = clock();
      const bookings = store.bookings.list();
      // Тот же расчёт, что и у слотов дня: счётчик всегда совпадает с их числом.
      return dates.map((date) => ({
        date,
        freeSlots: daySlots({ date, durationMinutes, bookings, now }).length,
      }));
    },

    // Проверка слота, пересечения и сохранение — одна синхронная операция без `await`:
    // между проверкой и записью другой запрос не вклинится, и одно время не займут дважды.
    createBooking(
      request: FastifyRequest<{ Body: CreateBooking }>,
      reply: FastifyReply,
    ): BookingCreated {
      const { eventTypeId, startAt, guestEmail } = request.body;
      const guestName = request.body.guestName.trim();
      if (guestName === '') {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Имя не может быть пустым');
      }
      const { durationMinutes } = findEventType(eventTypeId);
      const now = clock();
      const slot = slotStartingAt({ startAt, durationMinutes, now });
      if (!slot) {
        throw new ApiError(400, 'SLOT_UNAVAILABLE', 'Это время нельзя забронировать');
      }
      if (!isIntervalFree(slot, store.bookings.list())) {
        throw new ApiError(409, 'SLOT_TAKEN', 'Это время уже занято');
      }
      // endAt берётся из длительности на момент брони: смена длительности типа его не меняет.
      const record: StoredBooking = {
        id: randomUUID(),
        eventTypeId,
        guestName,
        guestEmail,
        startAt: slot.startAt,
        endAt: slot.endAt,
        createdAt: formatOwnerTime(now.getTime()),
        cancelToken: randomBytes(32).toString('base64url'),
      };
      store.bookings.save(record);
      reply.code(201);
      const { cancelToken: token, ...booking } = record;
      return { booking, token, link: bookingLink(booking.id, token) };
    },

    getBooking(
      request: FastifyRequest<{ Params: { id: string }; Querystring: { token: string } }>,
    ): Booking {
      return publicBooking(findGuestBooking(store, request.params.id, request.query.token));
    },

    cancelBooking(
      request: FastifyRequest<{ Params: { id: string }; Querystring: { token: string } }>,
      reply: FastifyReply,
    ): void {
      cancelGuestBooking(store, request.params.id, request.query.token, clock());
      reply.code(204).send();
    },

    createEventType(
      request: FastifyRequest<{ Body: CreateEventType }>,
      reply: FastifyReply,
    ): EventType {
      const { title, description = '', durationMinutes } = request.body;
      const eventType: EventType = {
        id: randomUUID(),
        title: normalizeTitle(title),
        description,
        durationMinutes,
      };
      store.eventTypes.save(eventType);
      reply.code(201);
      return eventType;
    },

    // Частичное изменение: неуказанные поля остаются прежними.
    // Созданные записи хранят свой endAt, поэтому новая длительность их не трогает.
    updateEventType(
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateEventType }>,
    ): EventType {
      const current = findEventType(request.params.id);
      const { title, description, durationMinutes } = request.body;
      const eventType: EventType = {
        ...current,
        ...(title === undefined ? {} : { title: normalizeTitle(title) }),
        ...(description === undefined ? {} : { description }),
        ...(durationMinutes === undefined ? {} : { durationMinutes }),
      };
      store.eventTypes.save(eventType);
      return eventType;
    },
  };
}
