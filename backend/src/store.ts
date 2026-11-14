// Хранилище в памяти. Интерфейс синхронный: бронирование проверяет пересечение и сохраняет запись
// одной операцией без `await` (docs/spec.md, «Модули бэкенда»). Замена на базу сохраняет интерфейс.

import type { EventType } from './api/types.gen.ts';

export type { EventType };

export type Booking = {
  id: string;
  eventTypeId: string;
  guestName: string;
  guestEmail: string;
  startAt: string;
  endAt: string;
  createdAt: string;
  cancelToken: string;
};

export interface Repository<T extends { id: string }> {
  list(): T[];
  get(id: string): T | undefined;
  // Создаёт или заменяет запись с тем же `id`.
  save(item: T): void;
  // Возвращает false, если записи не было.
  delete(id: string): boolean;
}

export type Store = {
  eventTypes: Repository<EventType>;
  bookings: Repository<Booking>;
};

function createMemoryRepository<T extends { id: string }>(): Repository<T> {
  const items = new Map<string, T>();
  return {
    list: () => [...items.values()],
    get: (id) => items.get(id),
    save: (item) => {
      items.set(item.id, item);
    },
    delete: (id) => items.delete(id),
  };
}

export function createMemoryStore(): Store {
  return { eventTypes: createMemoryRepository(), bookings: createMemoryRepository() };
}
