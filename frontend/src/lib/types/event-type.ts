export type EventType = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
};

export function isEventType(value: unknown): value is EventType {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.durationMinutes === "number" &&
    Number.isInteger(candidate.durationMinutes)
  );
}
