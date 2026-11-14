import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import openapiGlue from 'fastify-openapi-glue';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { handlers } from './handlers.ts';

const specification = fileURLToPath(new URL('../../openapi/openapi.yaml', import.meta.url));
const defaultFrontendDir = fileURLToPath(new URL('../../frontend/dist', import.meta.url));

export interface AppOptions {
  /** Built frontend to serve; skipped when the directory does not exist (dev, tests). */
  frontendDir?: string;
}

export function buildApp({ frontendDir = defaultFrontendDir }: AppOptions = {}) {
  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });
  app.register(openapiGlue, { specification, serviceHandlers: handlers });

  const serveFrontend = existsSync(frontendDir);
  if (serveFrontend) {
    app.register(fastifyStatic, { root: frontendDir, wildcard: false });
  }

  app.setNotFoundHandler((request, reply) => {
    const isApi = request.url === '/api' || request.url.startsWith('/api/');
    const isPageRequest = request.method === 'GET' || request.method === 'HEAD';
    if (serveFrontend && !isApi && isPageRequest) {
      return reply.sendFile('index.html');
    }
    return reply
      .code(404)
      .send({ code: 'NOT_FOUND', message: `Route ${request.method} ${request.url} not found` });
  });

  return app;
}
