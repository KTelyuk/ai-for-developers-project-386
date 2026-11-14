import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateEventType, EventType, HealthStatus, Slot } from './api/types.gen.ts';
import type { Clock } from './clock.ts';
import { ApiError } from './errors.ts';
import { daySlots, isInWindow } from './schedule.ts';
import type { Store } from './store.ts';

export type Deps = { clock: Clock; store: Store };

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

    createEventType(
      request: FastifyRequest<{ Body: CreateEventType }>,
      reply: FastifyReply,
    ): EventType {
      const { title, description = '', durationMinutes } = request.body;
      // Контракт проверяет длину как есть; название из одних пробелов тоже считается пустым.
      const trimmedTitle = title.trim();
      if (trimmedTitle === '') {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Название не может быть пустым');
      }
      const eventType: EventType = {
        id: randomUUID(),
        title: trimmedTitle,
        description,
        durationMinutes,
      };
      store.eventTypes.save(eventType);
      reply.code(201);
      return eventType;
    },
  };
}
