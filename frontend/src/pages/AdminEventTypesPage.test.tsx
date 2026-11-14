import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw/http';
import { describe, expect, it } from 'vitest';
import { consultation, intro, mockEventTypesApi } from '@/test/event-types.ts';
import { server } from '@/test/msw.ts';
import { renderAt } from '@/test/render.tsx';

const PATH = '/admin/event-types';

async function eventTypesList() {
  return screen.findByRole('list', { name: 'Типы встреч' });
}

describe('админка: типы встреч', () => {
  it('показывает типы встреч владельца с описанием и длительностью', async () => {
    mockEventTypesApi([intro, consultation]);
    renderAt(PATH);

    const items = within(await eventTypesList()).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Знакомство');
    expect(items[0]).toHaveTextContent('Короткий звонок, чтобы познакомиться');
    expect(items[0]).toHaveTextContent('15 мин');
    expect(items[1]).toHaveTextContent('Консультация');
    expect(items[1]).toHaveTextContent('60 мин');
  });

  it('без типов встреч сообщает, что их пока нет', async () => {
    mockEventTypesApi();
    renderAt(PATH);

    expect(await screen.findByText('Типов встреч пока нет')).toBeInTheDocument();
  });

  it('создаёт тип встречи, и он появляется в списке', async () => {
    const user = userEvent.setup();
    const { created } = mockEventTypesApi([intro]);
    renderAt(PATH);
    await eventTypesList();

    await user.type(screen.getByLabelText('Название'), 'Разбор кода');
    await user.type(screen.getByLabelText('Описание'), 'Смотрим ваш PR вместе');
    await user.selectOptions(screen.getByLabelText('Длительность'), '45 мин');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    const list = await eventTypesList();
    expect(await within(list).findByText('Разбор кода')).toBeInTheDocument();
    expect(created).toEqual([
      { title: 'Разбор кода', description: 'Смотрим ваш PR вместе', durationMinutes: 45 },
    ]);
    // Форма очищается для следующего типа встречи.
    expect(screen.getByLabelText('Название')).toHaveValue('');
  });

  it('длительность по умолчанию — 30 минут, выбор только из 15/30/45/60', async () => {
    mockEventTypesApi();
    renderAt(PATH);

    const duration = await screen.findByLabelText('Длительность');
    expect(duration).toHaveDisplayValue('30 мин');
    expect(
      within(duration)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['15 мин', '30 мин', '45 мин', '60 мин']);
  });

  it('не отправляет форму с пустым названием и показывает ошибку под полем', async () => {
    const user = userEvent.setup();
    const { created } = mockEventTypesApi();
    renderAt(PATH);
    await screen.findByText('Типов встреч пока нет');

    await user.type(screen.getByLabelText('Название'), '   ');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    const title = screen.getByLabelText('Название');
    expect(title).toHaveAccessibleDescription('Введите название');
    expect(title).toHaveAttribute('aria-invalid', 'true');
    expect(created).toEqual([]);
  });

  it('показывает ошибки длины под полями', async () => {
    const user = userEvent.setup();
    const { created } = mockEventTypesApi();
    renderAt(PATH);
    await screen.findByText('Типов встреч пока нет');

    await user.click(screen.getByLabelText('Название'));
    await user.paste('а'.repeat(101));
    await user.click(screen.getByLabelText('Описание'));
    await user.paste('б'.repeat(501));
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(screen.getByLabelText('Название')).toHaveAccessibleDescription(
      'Не длиннее 100 символов',
    );
    expect(screen.getByLabelText('Описание')).toHaveAccessibleDescription(
      'Не длиннее 500 символов',
    );
    expect(created).toEqual([]);
  });

  it('показывает ошибку сервера, если создать не удалось', async () => {
    const user = userEvent.setup();
    mockEventTypesApi();
    server.use(
      http.post('*/api/admin/event-types', () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', message: 'Название не может быть пустым' },
          { status: 400 },
        ),
      ),
    );
    renderAt(PATH);
    await screen.findByText('Типов встреч пока нет');

    await user.type(screen.getByLabelText('Название'), 'Звонок');
    await user.click(screen.getByRole('button', { name: 'Создать' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Название не может быть пустым');
  });

  it('сообщает, если список не загрузился', async () => {
    server.use(http.get('*/api/event-types', () => HttpResponse.json({}, { status: 500 })));
    renderAt(PATH);

    expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось загрузить типы встреч');
  });
});
