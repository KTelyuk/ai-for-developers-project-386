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

// Свободный слот: моменты ISO 8601 со смещением Алматы `+05:00`.
model Slot {
  startAt: offsetDateTime;
  endAt: offsetDateTime;
}

@route("/api/event-types/{id}/slots")
@tag("Slots")
interface Slots {
  // Свободные слоты на день `YYYY-MM-DD` по Алматы. Выходной — пустой список;
  // дата вне окна записи или в неверном формате — 400.
  @get
  @operationId("listSlots")
  list(@path id: string, @query date: plainDate): Slot[] | ValidationError | NotFoundError;
}

@error
model SlotTakenError {
  @statusCode _: 409;
  ...ApiError;
}

// Запись гостя. Токен отмены в модель не входит: он отдаётся один раз, в ответе на бронирование.
model Booking {
  @format("uuid") id: string;
  eventTypeId: string;
  guestName: string;
  guestEmail: string;
  startAt: offsetDateTime;
  endAt: offsetDateTime;
  createdAt: offsetDateTime;
}

// Тело брони. Имя обрезается по краям на сервере; email — `local@domain`, до 254 символов.
model CreateBooking {
  eventTypeId: string;
  startAt: offsetDateTime;

  @minLength(1)
  @maxLength(100)
  guestName: string;

  @maxLength(254)
  @pattern("^[^\\s@]+@[^\\s@]+$")
  guestEmail: string;
}

// Ответ на бронирование: запись, токен отмены и ссылка на страницу записи
// `/bookings/{id}?token={token}` (путь от корня сайта).
model BookingCreated {
  booking: Booking;
  token: string;
  link: string;
}

@route("/api/bookings")
@tag("Bookings")
interface Bookings {
  // `startAt` не слот этого типа встречи (не на сетке, вне часов или окна) — 400 SLOT_UNAVAILABLE;
  // время занято — 409 SLOT_TAKEN.
  @post
  @operationId("createBooking")
  create(@body body: CreateBooking): {
    @statusCode _: 201;
    @body body: BookingCreated;
  } | ValidationError | NotFoundError | SlotTakenError;
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
