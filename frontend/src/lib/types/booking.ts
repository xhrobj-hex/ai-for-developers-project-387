export type Booking = {
  id: string;
  eventTypeId: string;
  startAt: string;
  endAt: string;
  createdAt: string;
};

export function isBooking(value: unknown): value is Booking {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.eventTypeId === "string" &&
    typeof candidate.startAt === "string" &&
    typeof candidate.endAt === "string" &&
    typeof candidate.createdAt === "string"
  );
}
