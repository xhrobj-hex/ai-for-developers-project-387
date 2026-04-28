const utcDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

const utcDateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const utcTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatUtcDate(dateTime: string) {
  return utcDateFormatter.format(new Date(dateTime));
}

export function formatUtcDateTime(dateTime: string) {
  return utcDateTimeFormatter.format(new Date(dateTime));
}

export function formatUtcTime(dateTime: string) {
  return utcTimeFormatter.format(new Date(dateTime));
}
