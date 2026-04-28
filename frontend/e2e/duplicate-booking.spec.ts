import { expect, test } from "@playwright/test";
import { createEventType, listSlots } from "./helpers/api";

test("second attempt to book the same slot gets a slot conflict", async ({ browser, page, request }) => {
  const suffix = Date.now().toString();
  const eventType = await createEventType(request, {
    name: `E2E duplicate ${suffix}`,
    description: `Duplicate booking event type ${suffix}`,
    durationMinutes: 30,
  });

  const slots = await listSlots(request, eventType.id);
  expect(slots.length).toBeGreaterThan(0);

  const secondContext = await browser.newContext();
  const secondPage = await secondContext.newPage();

  try {
    await Promise.all([page.goto(`/book/${eventType.id}`), secondPage.goto(`/book/${eventType.id}`)]);

    const firstPageSlot = page.getByTestId("slot-option").first();
    const secondPageSlot = secondPage.getByTestId("slot-option").first();

    await expect(firstPageSlot).toBeVisible();
    await expect(secondPageSlot).toBeVisible();

    await Promise.all([firstPageSlot.click(), secondPageSlot.click()]);

    await expect(page.getByTestId("booking-confirm")).toBeVisible();
    await expect(secondPage.getByTestId("booking-confirm")).toBeVisible();

    await page.getByTestId("booking-submit").click();
    await expect(page.getByTestId("booking-success")).toBeVisible();

    await secondPage.getByTestId("booking-submit").click();
    await expect(secondPage.getByTestId("booking-slot-conflict")).toBeVisible();
    await expect(secondPage.getByTestId("booking-slot-conflict")).toContainText("Слот уже занят");
    await expect(secondPage.getByTestId("booking-slot-conflict")).toContainText("Выбрать другой слот");
  } finally {
    await secondContext.close();
  }
});
