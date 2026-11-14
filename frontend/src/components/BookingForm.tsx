import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import type { ApiError, BookingCreated, EventType, Slot } from '@/api';
import { createBookingMutation } from '@/api/@tanstack/react-query.gen.ts';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import {
  type BookingFormValues,
  bookingFormSchema,
  formatBookingDate,
  formatTimeRange,
} from '@/lib/bookings.ts';

type Props = {
  eventType: EventType;
  slot: Slot;
  onBooked: (created: BookingCreated) => void;
  // Время перестало быть свободным: страница возвращает гостя к обновлённым слотам.
  onSlotGone: (message: string) => void;
  onBack: () => void;
};

const SLOT_GONE_MESSAGE = 'Это время уже заняли. Выберите другое.';

function errorCode(error: unknown) {
  return (error as Partial<ApiError> | null)?.code;
}

// Форма гостя: имя и email для выбранного времени.
export function BookingForm({ eventType, slot, onBooked, onSlotGone, onBack }: Props) {
  const id = useId();
  const queryClient = useQueryClient();
  const book = useMutation({
    ...createBookingMutation(),
    // Занятое время пропадает из слотов и счётчиков всех типов встреч.
    onSettled: () => queryClient.invalidateQueries(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: { guestName: '', guestEmail: '' },
  });

  const submit = handleSubmit(async (values) => {
    try {
      const created = await book.mutateAsync({
        body: { eventTypeId: eventType.id, startAt: slot.startAt, ...values },
      });
      onBooked(created);
    } catch (error) {
      const code = errorCode(error);
      if (code === 'SLOT_TAKEN' || code === 'SLOT_UNAVAILABLE') onSlotGone(SLOT_GONE_MESSAGE);
    }
  });

  const showServerError =
    book.isError && !['SLOT_TAKEN', 'SLOT_UNAVAILABLE'].includes(errorCode(book.error) ?? '');

  const fieldError = (name: keyof BookingFormValues) => {
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
  const name = fieldError('guestName');
  const email = fieldError('guestEmail');

  return (
    <form
      noValidate
      aria-labelledby={`${id}-heading`}
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-xl border p-5"
    >
      <h2 id={`${id}-heading`} className="text-xl font-semibold">
        Ваши данные
      </h2>
      <p className="text-sm text-muted-foreground">
        {formatBookingDate(slot.startAt)}, {formatTimeRange(slot.startAt, slot.endAt)}
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-name`}>Имя</Label>
        <Input
          id={`${id}-name`}
          className="h-11"
          autoComplete="name"
          aria-invalid={name['aria-invalid']}
          aria-describedby={name['aria-describedby']}
          {...register('guestName')}
        />
        {name.error}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-email`}>Email</Label>
        <Input
          id={`${id}-email`}
          type="email"
          inputMode="email"
          autoComplete="email"
          className="h-11"
          aria-invalid={email['aria-invalid']}
          aria-describedby={email['aria-describedby']}
          {...register('guestEmail')}
        />
        {email.error}
      </div>
      {showServerError ? (
        <p role="alert" className="text-sm text-destructive">
          Не удалось записаться. Попробуйте ещё раз.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="lg" className="h-11 px-6" disabled={book.isPending}>
          Записаться
        </Button>
        <Button type="button" variant="outline" size="lg" className="h-11 px-6" onClick={onBack}>
          Другое время
        </Button>
      </div>
    </form>
  );
}
