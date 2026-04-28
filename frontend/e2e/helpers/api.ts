import { expect, type APIRequestContext } from "@playwright/test";

const backendBaseUrl = "http://127.0.0.1:18080";

export type EventType = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

export type Slot = {
  eventTypeId: string;
  startAt: string;
  endAt: string;
};

export async function createEventType(
  request: APIRequestContext,
  input: Omit<EventType, "id">,
): Promise<EventType> {
  const response = await request.post(`${backendBaseUrl}/admin/event-types`, {
    data: input,
  });

  expect(response.ok()).toBeTruthy();

  return (await response.json()) as EventType;
}

export async function listEventTypes(request: APIRequestContext): Promise<EventType[]> {
  const response = await request.get(`${backendBaseUrl}/event-types`);

  expect(response.ok()).toBeTruthy();

  return (await response.json()) as EventType[];
}

export async function listSlots(request: APIRequestContext, eventTypeId: string): Promise<Slot[]> {
  const response = await request.get(`${backendBaseUrl}/event-types/${eventTypeId}/slots`);

  expect(response.ok()).toBeTruthy();

  return (await response.json()) as Slot[];
}
