// Доступ гостя к своей записи по ссылке `/bookings/{id}?token=...` (docs/spec.md, «Контракт API»).

import { timingSafeEqual } from 'node:crypto';
import { ApiError } from './errors.ts';
import type { Store, StoredBooking } from './store.ts';

// Сравнение за постоянное время: по времени ответа токен не подобрать.
function sameToken(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Запись гостя по идентификатору и токену из ссылки.
// Записи нет (в том числе уже отменённой) — 404; токен не тот — 403.
export function findGuestBooking(store: Store, id: string, token: string): StoredBooking {
  const booking = store.bookings.get(id);
  if (!booking) throw new ApiError(404, 'NOT_FOUND', 'Запись не найдена');
  if (!sameToken(booking.cancelToken, token)) {
    throw new ApiError(403, 'INVALID_TOKEN', 'Неверная ссылка на запись');
  }
  return booking;
}

// Отмена гостем: те же проверки доступа, а начавшуюся встречу (start ≤ now) отменить нельзя — 409.
// Отменённая запись удаляется, и её время снова свободно.
export function cancelGuestBooking(store: Store, id: string, token: string, now: Date): void {
  const booking = findGuestBooking(store, id, token);
  if (Date.parse(booking.startAt) <= now.getTime()) {
    throw new ApiError(409, 'ALREADY_STARTED', 'Встреча уже началась, отменить её нельзя');
  }
  store.bookings.delete(id);
}
