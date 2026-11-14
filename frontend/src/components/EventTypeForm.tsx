import { zodResolver } from '@hookform/resolvers/zod';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import type { CreateEventType, DurationMinutes } from '@/api';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Textarea } from '@/components/ui/textarea.tsx';
import {
  DURATIONS,
  type EventTypeFormInput,
  type EventTypeFormValues,
  eventTypeFormSchema,
  formatDuration,
} from '@/lib/event-types.ts';

type Props = {
  submitLabel: string;
  pending: boolean;
  // Сообщение сервера, если сохранить не удалось.
  serverError?: string;
  // Возвращает true, если сохранено: тогда форма очищается.
  onSubmit: (values: CreateEventType) => Promise<boolean>;
};

const EMPTY: EventTypeFormInput = { title: '', description: '', durationMinutes: '30' };

const selectClassName =
  'h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30';

export function EventTypeForm({ submitLabel, pending, serverError, onSubmit }: Props) {
  const id = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventTypeFormInput, unknown, EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    defaultValues: EMPTY,
  });

  const submit = handleSubmit(async (values) => {
    const saved = await onSubmit({
      title: values.title,
      description: values.description,
      durationMinutes: Number(values.durationMinutes) as DurationMinutes,
    });
    if (saved) reset(EMPTY);
  });

  const fieldError = (name: keyof EventTypeFormInput) => {
    const message = errors[name]?.message;
    return {
      'aria-invalid': message ? true : undefined,
      'aria-describedby': message ? `${id}-${name}-error` : undefined,
      error: message ? (
        <p id={`${id}-${name}-error`} className="text-sm text-destructive">
          {message}
        </p>
      ) : null,
    };
  };
  const title = fieldError('title');
  const description = fieldError('description');

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-title`}>Название</Label>
        <Input
          id={`${id}-title`}
          className="h-11"
          aria-invalid={title['aria-invalid']}
          aria-describedby={title['aria-describedby']}
          {...register('title')}
        />
        {title.error}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-description`}>Описание</Label>
        <Textarea
          id={`${id}-description`}
          rows={3}
          aria-invalid={description['aria-invalid']}
          aria-describedby={description['aria-describedby']}
          {...register('description')}
        />
        {description.error}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-duration`}>Длительность</Label>
        <select id={`${id}-duration`} className={selectClassName} {...register('durationMinutes')}>
          {DURATIONS.map((minutes) => (
            <option key={minutes} value={String(minutes)}>
              {formatDuration(minutes)}
            </option>
          ))}
        </select>
      </div>
      {serverError ? (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      ) : null}
      <Button type="submit" size="lg" className="h-11 self-start px-6" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  );
}
