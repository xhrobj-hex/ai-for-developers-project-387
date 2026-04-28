import { ApiError, apiGet, apiPost } from "@/lib/api/client";
import { isEventType, type EventType } from "@/lib/types/event-type";

type ListEventTypesOptions = {
  signal?: AbortSignal;
};

type CreateEventTypeInput = {
  name: string;
  description: string;
  durationMinutes: number;
};

type CreateEventTypeOptions = {
  signal?: AbortSignal;
};

export async function listEventTypes(options: ListEventTypesOptions = {}): Promise<EventType[]> {
  const payload = await apiGet("/event-types", options);

  if (!Array.isArray(payload) || !payload.every(isEventType)) {
    throw new Error("API returned an unexpected event types payload");
  }

  return payload;
}

export async function createEventType(
  input: CreateEventTypeInput,
  options: CreateEventTypeOptions = {},
): Promise<EventType> {
  const payload = await apiPost("/admin/event-types", input, options);

  if (!isEventType(payload)) {
    throw new Error("API returned an unexpected event type payload");
  }

  return payload;
}

export function isCreateEventTypeValidationError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 400 && error.code === "VALIDATION_ERROR";
}
