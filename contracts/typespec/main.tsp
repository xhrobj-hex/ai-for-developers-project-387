import "@typespec/http";
import "@typespec/openapi3";

using Http;

@service(#{
  title: "Calendar Booking API",
})
@server("http://localhost:3000", "Local development")
namespace CalendarBooking;

/**
 * Доменная сущность владельца календаря.
 * В MVP владелец один, заранее заданный, поэтому отдельного endpoint для него пока нет.
 */
model Owner {
  id: string;
  displayName: string;
}

/** Тип события, который создает владелец календаря. */
model EventType {
  id: string;
  name: string;
  description: string;
  durationMinutes: int32;
}

/** Свободный слот, который видит гость. */
model Slot {
  eventTypeId: string;
  startAt: utcDateTime;
  endAt: utcDateTime;
}

/** Бронирование выбранного слота. */
model Booking {
  id: string;
  eventTypeId: string;
  startAt: utcDateTime;
  endAt: utcDateTime;
  createdAt: utcDateTime;
}

/** Бронирование для страницы предстоящих встреч владельца. */
model UpcomingBooking {
  id: string;
  eventTypeId: string;
  eventTypeName: string;
  eventTypeDescription: string;
  startAt: utcDateTime;
  endAt: utcDateTime;
  createdAt: utcDateTime;
}

/** Входные данные для создания типа события. */
model CreateEventTypeRequest {
  @minLength(1)
  name: string;

  @minLength(1)
  description: string;

  @minValue(1)
  durationMinutes: int32;
}

/** Входные данные для создания бронирования. */
model CreateBookingRequest {
  eventTypeId: string;
  startAt: utcDateTime;
}

@error
model ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details?: string[];
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}

@error
model SlotAlreadyBookedError {
  code: "SLOT_ALREADY_BOOKED";
  message: string;
}

@error
model BookingRuleViolationError {
  code: "BOOKING_RULE_VIOLATION";
  message: string;
}

model EventTypeListResponse {
  ...OkResponse;
  ...Body<EventType[]>;
}

model SlotListResponse {
  ...OkResponse;
  ...Body<Slot[]>;
}

model BookingCreatedResponse {
  ...CreatedResponse;
  ...Body<Booking>;
}

model EventTypeCreatedResponse {
  ...CreatedResponse;
  ...Body<EventType>;
}

model UpcomingBookingsResponse {
  ...OkResponse;
  ...Body<UpcomingBooking[]>;
}

model ValidationErrorResponse {
  ...BadRequestResponse;
  ...Body<ValidationError>;
}

model EntityNotFoundResponse {
  ...NotFoundResponse;
  ...Body<NotFoundError>;
}

model SlotAlreadyBookedResponse {
  @statusCode statusCode: 409;
  @body error: SlotAlreadyBookedError;
}

model BookingRuleViolationResponse {
  @statusCode statusCode: 422;
  @body error: BookingRuleViolationError;
}

@route("/event-types")
namespace EventTypes {
  /** Публичный список доступных типов событий. */
  @get
  op list(): EventTypeListResponse;

  /**
   * Публичный список свободных слотов для выбранного типа события.
   * Для MVP сервер возвращает окно записи на ближайшие 14 дней.
   */
  @route("{eventTypeId}/slots")
  @get
  op listSlots(@path eventTypeId: string): SlotListResponse | EntityNotFoundResponse;
}

@route("/bookings")
namespace Bookings {
  /**
   * Создает бронирование на выбранный свободный слот.
   * На одно и то же время нельзя создать две записи,
   * даже если это разные типы событий.
   */
  @post
  op create(@body body: CreateBookingRequest):
    | BookingCreatedResponse
    | ValidationErrorResponse
    | EntityNotFoundResponse
    | SlotAlreadyBookedResponse
    | BookingRuleViolationResponse;
}

@route("/admin/event-types")
namespace AdminEventTypes {
  /** Создает новый тип события в административной части. */
  @post
  op create(@body body: CreateEventTypeRequest):
    | EventTypeCreatedResponse
    | ValidationErrorResponse;
}

@route("/admin/bookings/upcoming")
namespace AdminBookings {
  /** Список предстоящих бронирований всех типов событий. */
  @get
  op listUpcoming(): UpcomingBookingsResponse;
}
