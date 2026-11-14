import { useEffect, useState } from 'react';
import { getHealth } from '@/api';

type ApiStatus = 'loading' | 'ok' | 'error';

const statusText: Record<ApiStatus, string> = {
  loading: 'Проверяем API…',
  ok: 'API работает',
  error: 'API недоступен',
};

function App() {
  const [status, setStatus] = useState<ApiStatus>('loading');

  useEffect(() => {
    getHealth()
      .then(({ data }) => setStatus(data?.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="mx-auto flex min-h-svh max-w-5xl flex-col gap-4 px-4 py-16">
      <h1 className="text-4xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">Запись на звонок. Каркас приложения.</p>
      <p data-testid="api-status">{statusText[status]}</p>
    </main>
  );
}

export default App;
