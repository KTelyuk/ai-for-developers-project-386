import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Clock, Globe } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import type { BookingCreated, EventType, Slot } from '@/api';
import { listEventTypesOptions } from '@/api/@tanstack/react-query.gen.ts';
import { BookingConfirmation } from '@/components/BookingConfirmation.tsx';
import { BookingForm } from '@/components/BookingForm.tsx';
import { DayPicker } from '@/components/DayPicker.tsx';
import { SlotList } from '@/components/SlotList.tsx';
import { Button } from '@/components/ui/button.tsx';
import { OWNER_TIME_ZONE_LABEL, formatDuration } from '@/lib/event-types.ts';
import { windowDays } from '@/lib/schedule.ts';

// Выбор хранится в адресе: `/book?eventType=<id>&date=YYYY-MM-DD`.
const EVENT_TYPE_PARAM = 'eventType';
const DATE_PARAM = 'date';

function EventTypeInfo({ eventType }: { eventType: EventType }) {
  return (
    <section
      aria-labelledby="booking-info"
      className="flex flex-col gap-3 rounded-xl border p-5 lg:max-w-sm"
    >
      <h2 id="booking-info" className="text-sm font-medium text-muted-foreground">
        Информация
      </h2>
      <h3 className="text-xl font-semibold break-words">{eventType.title}</h3>
      {eventType.description ? (
        <p className="break-words text-muted-foreground">{eventType.description}</p>
      ) : null}
      <p className="flex items-center gap-2 text-sm">
        <Clock className="size-4" aria-hidden="true" />
        {formatDuration(eventType.durationMinutes)}
      </p>
      <p className="flex items-center gap-2 text-sm">
        <Globe className="size-4" aria-hidden="true" />
        {OWNER_TIME_ZONE_LABEL}
      </p>
    </section>
  );
}

export function BookPage() {
  const eventTypes = useQuery(listEventTypesOptions());
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get(EVENT_TYPE_PARAM);
  const selected = eventTypes.data?.find((eventType) => eventType.id === selectedId);
  // Окно считается от даты открытия страницы: при следующем заходе оно сдвинется вместе с датой.
  const [days] = useState(() => windowDays(new Date()));
  const dateParam = searchParams.get(DATE_PARAM);
  const selectedDate = days.find((day) => day.date === dateParam && !day.weekend)?.date;
  // Выбранное время, сообщение о занятом времени и созданная запись живут только на этой странице:
  // токен из ответа не попадает в адрес и историю.
  const [slot, setSlot] = useState<Slot>();
  const [notice, setNotice] = useState<string>();
  const [created, setCreated] = useState<BookingCreated>();
  const chosenSlot = slot && slot.startAt.slice(0, 10) === selectedDate ? slot : undefined;

  function chooseSlot(next: Slot | undefined, message?: string) {
    setSlot(next);
    setNotice(message);
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Бронирование</h1>
      {eventTypes.isPending ? (
        <p className="text-muted-foreground">Загружаем типы встреч…</p>
      ) : eventTypes.isError ? (
        <p role="alert" className="text-destructive">
          Не удалось загрузить типы встреч
        </p>
      ) : eventTypes.data.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-lg font-medium">Записаться пока нельзя</p>
          <p className="text-muted-foreground">
            Владелец ещё не опубликовал ни одного типа встречи.
          </p>
          <Button asChild variant="outline" size="lg" className="h-11 px-6 text-base">
            <Link to="/">На главную</Link>
          </Button>
        </div>
      ) : selected && created ? (
        <BookingConfirmation eventType={selected} created={created} />
      ) : selected ? (
        <div className="flex flex-col gap-6">
          <div>
            <Button
              variant="outline"
              size="lg"
              className="h-11 px-6 text-base"
              onClick={() => {
                chooseSlot(undefined);
                setSearchParams({});
              }}
            >
              Назад
            </Button>
          </div>
          {notice ? (
            <p role="alert" className="text-destructive">
              {notice}
            </p>
          ) : null}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="md:col-span-2 lg:col-span-1">
              <EventTypeInfo eventType={selected} />
            </div>
            {chosenSlot ? (
              <div className="lg:col-span-2">
                <BookingForm
                  eventType={selected}
                  slot={chosenSlot}
                  onBooked={setCreated}
                  onSlotGone={(message) => chooseSlot(undefined, message)}
                  onBack={() => chooseSlot(undefined)}
                />
              </div>
            ) : (
              <>
                <DayPicker
                  days={days}
                  selected={selectedDate}
                  onSelect={(date) => {
                    chooseSlot(undefined);
                    setSearchParams({ [EVENT_TYPE_PARAM]: selected.id, [DATE_PARAM]: date });
                  }}
                />
                <SlotList
                  eventTypeId={selected.id}
                  date={selectedDate}
                  onSelect={(next) => chooseSlot(next)}
                />
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <section aria-labelledby="choose-event-type" className="flex flex-col gap-4">
            <h2 id="choose-event-type" className="text-xl font-semibold">
              Выберите тип встречи
            </h2>
            <ul aria-label="Типы встреч" className="grid gap-3 sm:grid-cols-2">
              {eventTypes.data.map((eventType) => {
                return (
                  <li key={eventType.id} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setSearchParams({ [EVENT_TYPE_PARAM]: eventType.id })}
                      className="flex min-h-11 w-full flex-col gap-1 rounded-xl border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <span className="flex w-full flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium break-words">{eventType.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDuration(eventType.durationMinutes)}
                        </span>
                      </span>
                      {eventType.description ? (
                        <span className="text-sm break-words text-muted-foreground">
                          {eventType.description}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
