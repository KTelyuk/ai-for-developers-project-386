import "@typespec/http";
import "@typespec/openapi";

using Http;
using OpenAPI;

@service(#{ title: "Call Calendar API" })
@server("/", "Same origin")
namespace CallCalendar;

// Единый формат ошибки (docs/spec.md, «Контракт API»).
union ErrorCode {
  "VALIDATION_ERROR",
  "NOT_FOUND",
  "INVALID_TOKEN",
  "SLOT_TAKEN",
  "ALREADY_STARTED",
  "SLOT_UNAVAILABLE",
}

model ApiError {
  code: ErrorCode;
  message: string;
}

@error
model ValidationError {
  @statusCode _: 400;
  ...ApiError;
}

@error
model NotFoundError {
  @statusCode _: 404;
  ...ApiError;
}

model HealthStatus {
  status: "ok";
}

@route("/api/health")
@tag("System")
interface Health {
  @get
  @operationId("getHealth")
  check(): HealthStatus;
}

// Длительность типа встречи в минутах — только из списка.
union DurationMinutes {
  15,
  30,
  45,
  60,
}

model EventType {
  @format("uuid") id: string;

  @minLength(1)
  @maxLength(100)
  title: string;

  @maxLength(500)
  description: string;

  durationMinutes: DurationMinutes;
}

// Тело создания: название обязательно, описание — нет.
model CreateEventType {
  @minLength(1)
  @maxLength(100)
  title: string;

  @maxLength(500)
  description?: string;

  durationMinutes: DurationMinutes;
}

// Тело изменения: каждое поле необязательно, неуказанные остаются прежними.
model UpdateEventType {
  @minLength(1)
  @maxLength(100)
  title?: string;

  @maxLength(500)
  description?: string;

  durationMinutes?: DurationMinutes;
}

@route("/api/event-types")
@tag("Event types")
interface EventTypes {
  @get
  @operationId("listEventTypes")
  list(): EventType[];

  @get
  @route("/{id}")
  @operationId("getEventType")
  get(@path id: string): EventType | NotFoundError;
}

@route("/api/admin/event-types")
@tag("Admin")
interface AdminEventTypes {
  @post
  @operationId("createEventType")
  create(@body body: CreateEventType): {
    @statusCode _: 201;
    @body body: EventType;
  } | ValidationError;

  @patch(#{ implicitOptionality: false })
  @route("/{id}")
  @operationId("updateEventType")
  update(@path id: string, @body body: UpdateEventType):
    | EventType
    | ValidationError
    | NotFoundError;
}
