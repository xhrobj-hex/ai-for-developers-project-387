import { expect, test } from "@playwright/test";

test("owner creates an event type, guest books a slot, owner sees upcoming booking", async ({ page }) => {
  const suffix = Date.now().toString();
  const eventTypeName = `E2E happy ${suffix}`;
  const eventTypeDescription = `Happy path event type ${suffix}`;

  await page.goto("/admin");

  const form = page.getByTestId("event-type-form");
  await form.locator('[name="name"]').fill(eventTypeName);
  await form.locator('[name="description"]').fill(eventTypeDescription);
  await form.locator('[name="durationMinutes"]').fill("30");
  await page.getByTestId("event-type-submit").click();

  await expect(page.getByTestId("event-type-success")).toBeVisible();
  await expect(page.getByTestId("event-type-success")).toContainText(eventTypeName);
  await expect(page.getByTestId("event-type-success")).toContainText(eventTypeDescription);

  await page.goto("/");

  const eventTypeCard = page.getByTestId("event-type-card").filter({ hasText: eventTypeName });
  await expect(eventTypeCard).toBeVisible();
  await eventTypeCard.getByTestId("event-type-open").click();

  const firstSlot = page.getByTestId("slot-option").first();
  await expect(firstSlot).toBeVisible();
  await firstSlot.click();

  await expect(page).toHaveURL(/\/book\/.+\/confirm\?startAt=/);
  await expect(page.getByTestId("booking-confirm")).toBeVisible();
  await page.reload();
  await expect(page.getByTestId("booking-confirm")).toBeVisible();
  await page.getByTestId("booking-submit").click();
  await expect(page.getByTestId("booking-success")).toBeVisible();

  await page.goto("/admin");

  const upcomingItem = page.getByTestId("upcoming-booking-item").filter({ hasText: eventTypeName });
  await expect(upcomingItem).toBeVisible();
  await expect(upcomingItem).toContainText(eventTypeDescription);
});
