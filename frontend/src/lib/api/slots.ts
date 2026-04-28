import { apiGet } from "@/lib/api/client";
import { isSlot, type Slot } from "@/lib/types/slot";

type ListEventTypeSlotsOptions = {
  signal?: AbortSignal;
};

export async function listEventTypeSlots(
  eventTypeId: string,
  options: ListEventTypeSlotsOptions = {},
): Promise<Slot[]> {
  const payload = await apiGet(`/event-types/${encodeURIComponent(eventTypeId)}/slots`, options);

  if (!Array.isArray(payload) || !payload.every(isSlot)) {
    throw new Error("API returned an unexpected slots payload");
  }

  return payload;
}
