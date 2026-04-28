import { expect, test } from "@playwright/test";
import { listEventTypes } from "./helpers/api";

test("invalid owner form submit shows an error and does not create a new event type", async ({ page, request }) => {
  const eventTypesBefore = await listEventTypes(request);

  await page.goto("/admin");
  await page.getByTestId("event-type-submit").click();

  await expect(page.getByTestId("event-type-error")).toBeVisible();
  await expect(page.getByTestId("event-type-submit")).toBeEnabled();

  const eventTypesAfter = await listEventTypes(request);
  expect(eventTypesAfter).toHaveLength(eventTypesBefore.length);
});
