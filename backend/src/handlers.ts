import type { Clock } from './clock.ts';
import type { Store } from './store.ts';

export type Deps = { clock: Clock; store: Store };

// Обработчики по operationId из openapi/openapi.yaml. Зависимости приходят из buildApp.
export function createHandlers(_deps: Deps) {
  return {
    getHealth() {
      return { status: 'ok' as const };
    },
  };
}
