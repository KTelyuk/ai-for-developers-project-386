import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

// Коды ошибок API (docs/spec.md, «Контракт API»).
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INVALID_TOKEN'
  | 'SLOT_TAKEN'
  | 'ALREADY_STARTED'
  | 'SLOT_UNAVAILABLE';

export type ErrorBody = { code: ErrorCode; message: string };

// Ошибка, которую обработчик бросает, чтобы ответить 4xx в едином формате.
export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;

  constructor(statusCode: number, code: ErrorCode, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

// Ответ на неизвестный путь в едином формате; подключает `buildApp` вместе с отдачей фронтенда.
export function sendNotFound(request: FastifyRequest, reply: FastifyReply) {
  const body: ErrorBody = {
    code: 'NOT_FOUND',
    message: `Route ${request.method} ${request.url} not found`,
  };
  return reply.status(404).send(body);
}

// Все ответы 4xx — `{ code, message }`: ошибки обработчиков и валидации из OpenAPI.
export function registerErrorHandling(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | ApiError, request, reply) => {
    if (error instanceof ApiError) {
      const body: ErrorBody = { code: error.code, message: error.message };
      return reply.status(error.statusCode).send(body);
    }
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 400 && statusCode < 500) {
      // Ошибки самого Fastify: валидация по схеме OpenAPI, неверный JSON, неподдерживаемый тип тела.
      const body: ErrorBody = {
        code: statusCode === 404 ? 'NOT_FOUND' : 'VALIDATION_ERROR',
        message: error.message,
      };
      return reply.status(statusCode).send(body);
    }
    request.log.error(error);
    return reply.status(500).send({ code: 'INTERNAL_ERROR', message: 'Internal Server Error' });
  });
}
