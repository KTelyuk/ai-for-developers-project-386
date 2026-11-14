import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import type { ApiError } from '@/api';
import {
  cancelBookingMutation,
  getBookingOptions,
  getEventTypeOptions,
} from '@/api/@tanstack/react-query.gen.ts';
import { Button } from '@/components/ui/button.tsx';
import { formatBookingDate, formatTimeRange } from '@/lib/bookings.ts';

function errorCode(error: unknown) {
  return (error as Partial<ApiError> | null)?.code;
}

// Итог страницы, когда записи показать нельзя: заголовок и ссылки дальше.
function Outcome({ title, text, rebook }: { title: string; text: string; rebook?: boolean }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-start gap-4 px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-muted-foreground">{text}</p>
      <div className="flex flex-wrap gap-2">
        {rebook ? (
          <Button asChild size="lg" className="h-11 px-6">
            <Link to="/book">Записаться снова</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" size="lg" className="h-11 px-6">
          <Link to="/">На главную</Link>
        </Button>
      </div>
    </div>
  );
}

const NOT_FOUND = (
  <Outcome title="Запись не найдена" text="Возможно, её уже отменили или ссылка устарела." rebook />
);

const UNAVAILABLE = (
  <Outcome
    title="Запись недоступна"
    text="Ссылка неверна. Откройте ссылку, которую получили при записи."
  />
);

// Страница записи: гость открывает её по ссылке `/bookings/{id}?token=...` и может отменить запись.
// Токен из ссылки уходит в каждый запрос; без верного токена сервер отвечает 403.
export function BookingPage() {
  const headingId = useId();
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const booking = useQuery(getBookingOptions({ path: { id }, query: { token } }));
  const eventTypeId = booking.data?.eventTypeId ?? '';
  const eventType = useQuery({
    ...getEventTypeOptions({ path: { id: eventTypeId } }),
    enabled: eventTypeId !== '',
  });
  const cancel = useMutation({
    ...cancelBookingMutation(),
    // Освободившееся время должно сразу появиться в слотах и счётчиках дней.
    onSettled: () => queryClient.invalidateQueries(),
  });

  const cancelCode = errorCode(cancel.error);
  if (cancel.isSuccess) {
    return <Outcome title="Запись отменена" text="Время снова свободно." rebook />;
  }
  if (cancelCode === 'NOT_FOUND') return NOT_FOUND;
  if (cancelCode === 'INVALID_TOKEN') return UNAVAILABLE;

  if (booking.isPending) {
    return <p className="mx-auto max-w-xl px-4 py-8 text-muted-foreground">Загрузка…</p>;
  }
  if (booking.isError) {
    const code = errorCode(booking.error);
    if (code === 'NOT_FOUND') return NOT_FOUND;
    if (code === 'INVALID_TOKEN') return UNAVAILABLE;
    return (
      <p role="alert" className="mx-auto max-w-xl px-4 py-8 text-destructive">
        Не удалось загрузить запись. Обновите страницу.
      </p>
    );
  }

  const { startAt, endAt, guestName } = booking.data;
  const started = cancelCode === 'ALREADY_STARTED';

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-8 sm:py-12">
      <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-xl border p-5">
        <h1 id={headingId} className="text-2xl font-semibold">
          Ваша запись
        </h1>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt className="text-muted-foreground">Встреча</dt>
          <dd className="break-words">{eventType.data?.title ?? '…'}</dd>
          <dt className="text-muted-foreground">Дата</dt>
          <dd>{formatBookingDate(startAt)}</dd>
          <dt className="text-muted-foreground">Время</dt>
          <dd>{formatTimeRange(startAt, endAt)} (Алматы)</dd>
          <dt className="text-muted-foreground">Имя</dt>
          <dd className="break-words">{guestName}</dd>
        </dl>

        {started ? (
          <p role="alert" className="text-sm font-medium">
            Встреча уже началась — отменить её нельзя
          </p>
        ) : confirming && !cancel.isError ? (
          <div className="flex flex-col gap-3">
            <p className="font-medium">Отменить запись? Время освободится для других.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="h-11 px-6"
                disabled={cancel.isPending}
                onClick={() => cancel.mutate({ path: { id }, query: { token } })}
              >
                Да, отменить
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-11 px-6"
                disabled={cancel.isPending}
                onClick={() => setConfirming(false)}
              >
                Не отменять
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 px-6"
              onClick={() => {
                cancel.reset();
                setConfirming(true);
              }}
            >
              Отменить
            </Button>
            {cancel.isError ? (
              <p role="alert" className="text-sm text-destructive">
                Не удалось отменить запись. Попробуйте ещё раз.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
