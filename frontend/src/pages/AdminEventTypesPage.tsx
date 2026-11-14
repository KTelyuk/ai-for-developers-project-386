import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiError } from '@/api';
import {
  createEventTypeMutation,
  listEventTypesOptions,
  listEventTypesQueryKey,
} from '@/api/@tanstack/react-query.gen.ts';
import { EventTypeForm } from '@/components/EventTypeForm.tsx';
import { formatDuration } from '@/lib/event-types.ts';

function errorMessage(error: unknown) {
  const message = (error as Partial<ApiError> | null)?.message;
  return typeof message === 'string' && message ? message : 'Не удалось сохранить тип встречи';
}

export function AdminEventTypesPage() {
  const queryClient = useQueryClient();
  const eventTypes = useQuery(listEventTypesOptions());
  const create = useMutation({
    ...createEventTypeMutation(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listEventTypesQueryKey() }),
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:py-12">
      <h1 className="text-3xl font-bold tracking-tight">Типы встреч</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="event-types-list" className="flex min-w-0 flex-col gap-4">
          <h2 id="event-types-list" className="text-xl font-semibold">
            Опубликованные
          </h2>
          {eventTypes.isPending ? (
            <p className="text-muted-foreground">Загружаем…</p>
          ) : eventTypes.isError ? (
            <p role="alert" className="text-destructive">
              Не удалось загрузить типы встреч
            </p>
          ) : eventTypes.data.length === 0 ? (
            <p className="text-muted-foreground">Типов встреч пока нет</p>
          ) : (
            <ul aria-label="Типы встреч" className="flex flex-col gap-3">
              {eventTypes.data.map((eventType) => (
                <li key={eventType.id} className="flex flex-col gap-1 rounded-xl border p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-medium break-words">{eventType.title}</h3>
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(eventType.durationMinutes)}
                    </span>
                  </div>
                  {eventType.description ? (
                    <p className="text-sm break-words text-muted-foreground">
                      {eventType.description}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
        <section aria-labelledby="event-type-new" className="flex flex-col gap-4">
          <h2 id="event-type-new" className="text-xl font-semibold">
            Новый тип встречи
          </h2>
          <EventTypeForm
            submitLabel="Создать"
            pending={create.isPending}
            serverError={create.isError ? errorMessage(create.error) : undefined}
            onSubmit={async (body) => {
              try {
                await create.mutateAsync({ body });
                return true;
              } catch {
                return false;
              }
            }}
          />
        </section>
      </div>
    </div>
  );
}
