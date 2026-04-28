export type Slot = {
  eventTypeId: string;
  startAt: string;
  endAt: string;
};

export function isSlot(value: unknown): value is Slot {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.eventTypeId === "string" &&
    typeof candidate.startAt === "string" &&
    typeof candidate.endAt === "string"
  );
}
