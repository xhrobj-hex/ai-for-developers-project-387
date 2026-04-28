import { expect, test } from "@playwright/test";
import { createEventType, listSlots } from "./helpers/api";

test("booking confirm page restores selected slot from deep link", async ({ page, request }) => {
  const suffix = Date.now().toString();
  const eventType = await createEventType(request, {
    name: `E2E deep link ${suffix}`,
    description: `Deep link event type ${suffix}`,
    durationMinutes: 30,
  });

  const slots = await listSlots(request, eventType.id);
  expect(slots.length).toBeGreaterThan(0);

  const selectedSlot = slots[0];
  const displayedStart = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(selectedSlot.startAt));

  await page.goto(`/book/${eventType.id}/confirm?startAt=${encodeURIComponent(selectedSlot.startAt)}`);

  await expect(page.getByTestId("booking-confirm")).toBeVisible();
  await expect(page.getByTestId("booking-confirm")).toContainText(displayedStart);

  await page.getByTestId("booking-submit").click();
  await expect(page.getByTestId("booking-success")).toBeVisible();
});
