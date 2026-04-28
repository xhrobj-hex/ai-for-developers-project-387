import { useEffect, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBooking, isApiErrorWithCode } from "@/lib/api/bookings";
import { listEventTypeSlots } from "@/lib/api/slots";
import { formatUtcDateTime, formatUtcTime } from "@/lib/format/utc";
import type { Booking } from "@/lib/types/booking";
import { isSlot, type Slot } from "@/lib/types/slot";
import { cn } from "@/lib/utils";

type BookingConfirmState =
  | { status: "resolving" }
  | { status: "idle"; slot: Slot }
  | { status: "submitting"; slot: Slot }
  | { status: "success"; booking: Booking }
  | { status: "slot-conflict"; slot: Slot; message: string }
  | { status: "rule-violation"; slot: Slot; message: string }
  | { status: "error"; slot?: Slot; message: string };

export function BookingConfirmPage() {
  const { eventTypeId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const slotFromState = getSlotFromLocationState(location.state);
  const requestedStartAt = searchParams.get("startAt")?.trim() ?? "";
  const selectedSlot = getSelectedSlot(slotFromState, eventTypeId, requestedStartAt);
  const [state, setState] = useState<BookingConfirmState>(() =>
    buildInitialState(eventTypeId, requestedStartAt, selectedSlot),
  );

  const canReturnToSlots = Boolean(eventTypeId);

  useEffect(() => {
    if (!eventTypeId) {
      setState({
        status: "error",
        message: "Не удалось определить тип встречи по текущей ссылке.",
      });
      return;
    }

    if (selectedSlot) {
      setState({ status: "idle", slot: selectedSlot });
      return;
    }

    if (!requestedStartAt) {
      setState({
        status: "error",
        message: "Ссылка не содержит выбранный слот. Вернитесь к списку времени и выберите его заново.",
      });
      return;
    }

    const controller = new AbortController();
    setState({ status: "resolving" });

    listEventTypeSlots(eventTypeId, { signal: controller.signal })
      .then((slots) => {
        const resolvedSlot = slots.find((slot) => slot.startAt === requestedStartAt);

        if (!resolvedSlot) {
          setState({
            status: "error",
            message: "Выбранный слот больше недоступен. Откройте список свободного времени и выберите другой.",
          });
          return;
        }

        setState({
          status: "idle",
          slot: resolvedSlot,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message: "Не удалось проверить выбранное время. Вернитесь к слотам и выберите его заново.",
        });
      });

    return () => {
      controller.abort();
    };
  }, [eventTypeId, requestedStartAt, selectedSlot?.eventTypeId, selectedSlot?.startAt, selectedSlot?.endAt]);

  async function handleSubmit() {
    if (state.status === "resolving" || state.status === "success" || (state.status === "error" && !state.slot)) {
      return;
    }

    const activeSlot = "slot" in state ? state.slot : undefined;
    if (!activeSlot) {
      return;
    }

    setState({
      status: "submitting",
      slot: activeSlot,
    });

    try {
      const booking = await createBooking({
        eventTypeId: activeSlot.eventTypeId,
        startAt: activeSlot.startAt,
      });

      setState({
        status: "success",
        booking,
      });
    } catch (error: unknown) {
      if (isApiErrorWithCode(error, 409, "SLOT_ALREADY_BOOKED")) {
        setState({
          status: "slot-conflict",
          slot: activeSlot,
          message: error.message,
        });
        return;
      }

      if (isApiErrorWithCode(error, 422, "BOOKING_RULE_VIOLATION")) {
        setState({
          status: "rule-violation",
          slot: activeSlot,
          message: error.message,
        });
        return;
      }

      setState({
        status: "error",
        slot: activeSlot,
        message: "Сервис временно недоступен. Попробуйте ещё раз чуть позже.",
      });
    }
  }

  if (state.status === "error" && !state.slot) {
    return (
      <section className="screen-grid">
        <Card className="screen-state" data-testid="booking-missing-slot">
          <CardHeader>
            <CardTitle>Не удалось открыть подтверждение</CardTitle>
            <CardDescription>Похоже, ссылка устарела или выбранное время уже недоступно.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="screen-note screen-note--muted">{state.message}</p>
            <div className="screen-actions">
              {canReturnToSlots && (
                <Link className={cn("ui-button", "ui-button--primary")} to={`/book/${eventTypeId}`}>
                  Вернуться к слотам
                </Link>
              )}
              <Link className={cn("ui-button", "ui-button--ghost")} to="/">
                К списку встреч
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (state.status === "resolving") {
    return (
      <section className="screen-grid">
        <Card className="screen-state" data-testid="booking-resolving-slot">
          <CardHeader>
            <CardTitle>Проверяем выбранное время</CardTitle>
            <CardDescription>Убеждаемся, что слот из ссылки всё ещё доступен.</CardDescription>
          </CardHeader>
        </Card>
      </section>
    );
  }

  if (state.status === "success") {
    return (
      <section className="screen-grid">
        <Card className="screen-state" data-testid="booking-success">
          <CardHeader>
            <CardTitle>Запись подтверждена</CardTitle>
            <CardDescription>Встреча сохранена. Выбранное время указано ниже.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="booking-highlight">
              <p className="booking-highlight__label">Выбранное время</p>
              <p className="booking-highlight__value">{formatUtcDateTime(state.booking.startAt)} UTC</p>
              <p className="booking-highlight__caption">До {formatUtcTime(state.booking.endAt)} UTC</p>
            </div>
            <div className="screen-actions">
              <Link className={cn("ui-button", "ui-button--ghost")} to={`/book/${state.booking.eventTypeId}`}>
                Выбрать другой слот
              </Link>
              <Link className={cn("ui-button", "ui-button--primary")} to="/">
                К списку встреч
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  const activeSlot = state.slot;
  if (!activeSlot) {
    return null;
  }

  return (
    <section className="screen-grid">
      <Card className="hero-card" data-testid="booking-confirm">
        <CardHeader>
          <CardTitle>Подтвердите запись</CardTitle>
          <CardDescription>Проверьте выбранное время и завершите бронирование. Все времена на странице указаны в UTC.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="booking-highlight">
            <p className="booking-highlight__label">Выбранное время</p>
            <p className="booking-highlight__value">{formatUtcDateTime(activeSlot.startAt)} UTC</p>
            <p className="booking-highlight__caption">До {formatUtcTime(activeSlot.endAt)} UTC</p>
          </div>
          <div className="screen-actions">
            <Link className={cn("ui-button", "ui-button--ghost")} to={`/book/${eventTypeId}`}>
              Вернуться к слотам
            </Link>
            <Button data-testid="booking-submit" onClick={handleSubmit} disabled={state.status === "submitting"}>
              {state.status === "submitting" ? "Подтверждаем..." : "Подтвердить запись"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {state.status === "submitting" && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Подтверждаем запись</CardTitle>
            <CardDescription>Это займёт всего несколько секунд.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {state.status === "slot-conflict" && (
        <Card className="screen-state" data-testid="booking-slot-conflict">
          <CardHeader>
            <CardTitle>Слот уже занят</CardTitle>
            <CardDescription>Это время уже занято. Вернитесь к списку и выберите другой интервал.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="screen-note screen-note--muted">{state.message}</p>
            <div className="screen-actions">
              <Link className={cn("ui-button", "ui-button--primary")} to={`/book/${eventTypeId}`}>
                Выбрать другой слот
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "rule-violation" && (
        <Card className="screen-state" data-testid="booking-rule-violation">
          <CardHeader>
            <CardTitle>Это время больше недоступно</CardTitle>
            <CardDescription>Откройте список слотов и выберите другой вариант.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="screen-note screen-note--muted">{state.message}</p>
            <div className="screen-actions">
              <Link className={cn("ui-button", "ui-button--primary")} to={`/book/${eventTypeId}`}>
                Вернуться к слотам
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "error" && state.slot && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Не удалось создать бронирование</CardTitle>
            <CardDescription>Попробуйте выбрать слот заново или повторить попытку чуть позже.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="screen-note screen-note--muted">{state.message}</p>
            <div className="screen-actions">
              <Link className={cn("ui-button", "ui-button--ghost")} to={`/book/${eventTypeId}`}>
                Вернуться к слотам
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

function getSlotFromLocationState(value: unknown): Slot | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as { slot?: unknown };

  return isSlot(candidate.slot) ? candidate.slot : undefined;
}

function buildInitialState(
  eventTypeId: string | undefined,
  requestedStartAt: string,
  selectedSlot: Slot | undefined,
): BookingConfirmState {
  if (!eventTypeId) {
    return {
      status: "error",
      message: "Не удалось определить тип встречи по текущей ссылке.",
    };
  }

  if (selectedSlot) {
    return {
      status: "idle",
      slot: selectedSlot,
    };
  }

  if (requestedStartAt) {
    return {
      status: "resolving",
    };
  }

  return {
    status: "error",
    message: "Ссылка не содержит выбранный слот. Вернитесь к списку времени и выберите его заново.",
  };
}

function getSelectedSlot(
  slot: Slot | undefined,
  eventTypeId: string | undefined,
  requestedStartAt: string,
): Slot | undefined {
  if (!slot) {
    return undefined;
  }

  if (eventTypeId && slot.eventTypeId !== eventTypeId) {
    return undefined;
  }

  if (requestedStartAt && slot.startAt !== requestedStartAt) {
    return undefined;
  }

  return slot;
}
