import { cn } from '@/lib/utils.ts';
import type { WindowDay } from '@/lib/schedule.ts';

// Простой выбор дня в окне записи; выходные неактивны. Календарь со счётчиками заменит его.
export function DayPicker({
  days,
  selected,
  onSelect,
}: {
  days: WindowDay[];
  selected: string | undefined;
  onSelect: (date: string) => void;
}) {
  return (
    <section aria-labelledby="choose-day" className="flex flex-col gap-4">
      <h2 id="choose-day" className="text-xl font-semibold">
        Выберите день
      </h2>
      <ul aria-label="Дни" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {days.map((day) => (
          <li key={day.date}>
            <button
              type="button"
              disabled={day.weekend}
              aria-pressed={day.date === selected}
              onClick={() => onSelect(day.date)}
              className={cn(
                'min-h-11 w-full rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-40',
                day.date === selected &&
                  'border-primary bg-primary text-primary-foreground hover:bg-primary',
              )}
            >
              {day.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
