import Fastify from 'fastify';
import openapiGlue from 'fastify-openapi-glue';
import { fileURLToPath } from 'node:url';
import { type Clock, systemClock } from './clock.ts';
import { registerErrorHandling } from './errors.ts';
import { createHandlers } from './handlers.ts';
import { createMemoryStore, type Store } from './store.ts';

const specification = fileURLToPath(new URL('../../openapi/openapi.yaml', import.meta.url));

export type AppOptions = { clock?: Clock; store?: Store };

export function buildApp({ clock = systemClock, store = createMemoryStore() }: AppOptions = {}) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  registerErrorHandling(app);
  app.register(openapiGlue, { specification, serviceHandlers: createHandlers({ clock, store }) });
  return app;
}
