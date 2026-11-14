import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/api';
import App from '@/App.tsx';

// Все функции SDK становятся шпионами, сохраняя реализацию.
vi.mock('@/api', { spy: true });

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function adminLinks() {
  return screen
    .getAllByRole('link')
    .map((link) => link.getAttribute('href') ?? '')
    .filter((href) => href.startsWith('/admin'));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('главная', () => {
  it('рассказывает о сервисе и показывает кнопку «Записаться»', () => {
    renderAt('/');

    expect(screen.getByRole('banner')).toHaveTextContent('Календарь звонков');
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/без регистрации/i)).toBeInTheDocument();

    const steps = screen.getByRole('list', { name: 'Как это работает' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);

    expect(screen.getByRole('link', { name: 'Записаться' })).toHaveAttribute('href', '/book');
  });

  it('не делает запросов к API', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}'));
    renderAt('/');
    // Запросы SDK асинхронные — даём эффектам отработать.
    await new Promise((resolve) => setTimeout(resolve, 50));

    const calledSdkFunctions = Object.entries(api)
      .filter(([, fn]) => vi.isMockFunction(fn) && fn.mock.calls.length > 0)
      .map(([name]) => name);
    expect(calledSdkFunctions).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('не содержит ссылок на /admin', () => {
    renderAt('/');
    expect(adminLinks()).toEqual([]);
  });
});

describe('страница бронирования', () => {
  it('открывается по кнопке «Записаться» и возвращает на главную', async () => {
    const user = userEvent.setup();
    renderAt('/');

    await user.click(screen.getByRole('link', { name: 'Записаться' }));
    expect(screen.getByText('Скоро здесь можно будет записаться')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'На главную' }));
    expect(screen.getByRole('link', { name: 'Записаться' })).toBeInTheDocument();
  });

  it('не содержит ссылок на /admin', () => {
    renderAt('/book');
    expect(adminLinks()).toEqual([]);
  });
});
