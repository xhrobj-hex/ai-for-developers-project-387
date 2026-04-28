import { ApiError, apiGet, apiPost } from "@/lib/api/client";
import { isBooking, type Booking } from "@/lib/types/booking";
import { isUpcomingBooking, type UpcomingBooking } from "@/lib/types/upcoming-booking";

type CreateBookingInput = {
  eventTypeId: string;
  startAt: string;
};

type CreateBookingOptions = {
  signal?: AbortSignal;
};

type ListUpcomingBookingsOptions = {
  signal?: AbortSignal;
};

export async function createBooking(
  input: CreateBookingInput,
  options: CreateBookingOptions = {},
): Promise<Booking> {
  const payload = await apiPost("/bookings", input, options);

  if (!isBooking(payload)) {
    throw new Error("API returned an unexpected booking payload");
  }

  return payload;
}

export async function listUpcomingBookings(
  options: ListUpcomingBookingsOptions = {},
): Promise<UpcomingBooking[]> {
  const payload = await apiGet("/admin/bookings/upcoming", options);

  if (!Array.isArray(payload) || !payload.every(isUpcomingBooking)) {
    throw new Error("API returned an unexpected upcoming bookings payload");
  }

  return payload;
}

export function isApiErrorWithCode(
  error: unknown,
  status: number,
  code: "BOOKING_RULE_VIOLATION" | "SLOT_ALREADY_BOOKED",
): error is ApiError {
  return error instanceof ApiError && error.status === status && error.code === code;
}
