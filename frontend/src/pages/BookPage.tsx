import { useQuery } from '@tanstack/react-query';
import { Clock, Globe } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import type { EventType } from '@/api';
import { listEventTypesOptions } from '@/api/@tanstack/react-query.gen.ts';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { OWNER_TIME_ZONE_LABEL, formatDuration } from '@/lib/event-types.ts';

// Выбранный тип встречи хранится в адресе: `/book?eventType=<id>`.
const EVENT_TYPE_PARAM = 'eventType';

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
      ) : (
        <div className="flex flex-col gap-8">
          {selected ? <EventTypeInfo eventType={selected} /> : null}
          <section aria-labelledby="choose-event-type" className="flex flex-col gap-4">
            <h2 id="choose-event-type" className="text-xl font-semibold">
              Выберите тип встречи
            </h2>
            <ul aria-label="Типы встреч" className="grid gap-3 sm:grid-cols-2">
              {eventTypes.data.map((eventType) => {
                const isSelected = eventType.id === selected?.id;
                return (
                  <li key={eventType.id} className="min-w-0">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSearchParams({ [EVENT_TYPE_PARAM]: eventType.id })}
                      className={cn(
                        'flex min-h-11 w-full flex-col gap-1 rounded-xl border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring',
                        isSelected && 'border-primary ring-1 ring-primary',
                      )}
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
