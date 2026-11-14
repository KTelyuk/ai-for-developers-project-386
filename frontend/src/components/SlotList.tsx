import { useQuery } from '@tanstack/react-query';
import { listSlotsOptions } from '@/api/@tanstack/react-query.gen.ts';
import { OWNER_TIME_ZONE_LABEL } from '@/lib/event-types.ts';
import { formatSlotTime } from '@/lib/schedule.ts';

// Свободное время выбранного дня; время показывается как пришло от сервера, по Алматы.
// Выбор слота и переход к форме добавит тикет бронирования.
export function SlotList({ eventTypeId, date }: { eventTypeId: string; date: string | undefined }) {
  return (
    <section aria-labelledby="choose-time" className="flex flex-col gap-4">
      <h2 id="choose-time" className="text-xl font-semibold">
        Время
      </h2>
      <p className="text-sm text-muted-foreground">{OWNER_TIME_ZONE_LABEL}</p>
      {date ? (
        <Slots eventTypeId={eventTypeId} date={date} />
      ) : (
        <p className="text-muted-foreground">Сначала выберите день</p>
      )}
    </section>
  );
}

function Slots({ eventTypeId, date }: { eventTypeId: string; date: string }) {
  const slots = useQuery(listSlotsOptions({ path: { id: eventTypeId }, query: { date } }));

  if (slots.isPending) return <p className="text-muted-foreground">Загружаем время…</p>;
  if (slots.isError) {
    return (
      <p role="alert" className="text-destructive">
        Не удалось загрузить время
      </p>
    );
  }
  if (slots.data.length === 0) {
    return <p className="text-muted-foreground">На этот день свободного времени нет</p>;
  }
  return (
    <ul aria-label="Свободное время" className="flex flex-col gap-2">
      {slots.data.map((slot) => (
        <li key={slot.startAt}>
          <button
            type="button"
            className="min-h-11 w-full rounded-lg border px-4 py-2 font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            {formatSlotTime(slot.startAt)}
          </button>
        </li>
      ))}
    </ul>
  );
}
