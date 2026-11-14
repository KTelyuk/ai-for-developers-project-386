// Модуль регистрирует матчеры jest-dom в expect и их типы — импорт ради побочного эффекта.
// oxlint-disable-next-line import/no-unassigned-import
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { client } from '@/api/client.gen.ts';
import { resetStartedRequests, server } from '@/test/msw.ts';

// В Node `fetch` не принимает относительный адрес, поэтому SDK в тестах ходит на origin jsdom.
client.setConfig({ baseUrl: window.location.origin });

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetStartedRequests();
});

afterAll(() => {
  server.close();
});
