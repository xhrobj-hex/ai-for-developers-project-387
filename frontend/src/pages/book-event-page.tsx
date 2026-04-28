import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatUtcDate, formatUtcTime } from "@/lib/format/utc";
import { listEventTypeSlots } from "@/lib/api/slots";
import type { Slot } from "@/lib/types/slot";
import { cn } from "@/lib/utils";

type BookEventPageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; slots: Slot[] };

type SlotGroup = {
  dateKey: string;
  label: string;
  slots: Slot[];
};

export function BookEventPage() {
  const { eventTypeId } = useParams();
  const [state, setState] = useState<BookEventPageState>({ status: "loading" });

  useEffect(() => {
    if (!eventTypeId) {
      setState({
        status: "error",
        message: "Не удалось открыть страницу встречи.",
      });
      return;
    }

    const controller = new AbortController();

    setState({ status: "loading" });

    listEventTypeSlots(eventTypeId, { signal: controller.signal })
      .then((slots) => {
        setState({ status: "success", slots });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message: "Попробуйте открыть страницу ещё раз.",
        });
      });

    return () => {
      controller.abort();
    };
  }, [eventTypeId]);

  const groupedSlots = useMemo(() => {
    if (state.status !== "success") {
      return [];
    }

    return groupSlotsByDate(state.slots);
  }, [state]);

  return (
    <section className="screen-grid">
      <Card className="hero-card">
        <CardHeader className="hero-card__header">
          <CardTitle>Выберите удобный слот</CardTitle>
          <CardDescription>Показываем ближайшие свободные интервалы. Все времена на странице указаны в UTC.</CardDescription>
        </CardHeader>
        <CardContent className="hero-card__content hero-card__content--inline">
          <p className="screen-note">После выбора времени останется только подтвердить запись.</p>
          <div className="screen-actions">
            <Link className={cn("ui-button", "ui-button--ghost")} to="/">
              К списку встреч
            </Link>
          </div>
        </CardContent>
      </Card>

      {state.status === "loading" && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Загружаем свободные слоты</CardTitle>
            <CardDescription>Подбираем доступное время для этой встречи.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {state.status === "error" && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Не удалось загрузить свободные слоты</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="screen-actions">
              <Link className={cn("ui-button", "ui-button--ghost")} to="/">
                На главную
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "success" && state.slots.length === 0 && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Свободного времени пока нет</CardTitle>
            <CardDescription>Попробуйте вернуться позже или выберите другой формат встречи.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="screen-actions">
              <Link className={cn("ui-button", "ui-button--ghost")} to="/">
                К списку встреч
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "success" && state.slots.length > 0 && (
        <div className="slot-group-list">
          {groupedSlots.map((group) => (
            <Card key={group.dateKey} className="slot-group-card" data-testid="slot-group">
              <CardHeader>
                <div className="slot-group-card__top">
                  <CardTitle>{group.label}</CardTitle>
                  <Badge>{group.slots.length} слотов</Badge>
                </div>
                <CardDescription>Свободные интервалы в UTC.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="slot-grid">
                  {group.slots.map((slot) => (
                    <Link
                      key={`${slot.eventTypeId}-${slot.startAt}`}
                      className={cn("slot-pill", "slot-pill--interactive")}
                      data-testid="slot-option"
                      to={`/book/${slot.eventTypeId}/confirm?startAt=${encodeURIComponent(slot.startAt)}`}
                      state={{ slot }}
                    >
                      <span>{formatUtcTime(slot.startAt)}</span>
                      <span className="slot-pill__divider">—</span>
                      <span>{formatUtcTime(slot.endAt)}</span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function groupSlotsByDate(slots: Slot[]): SlotGroup[] {
  const groups = new Map<string, Slot[]>();

  for (const slot of slots) {
    const dateKey = slot.startAt.slice(0, 10);
    const dateSlots = groups.get(dateKey) ?? [];

    dateSlots.push(slot);
    groups.set(dateKey, dateSlots);
  }

  return Array.from(groups.entries()).map(([dateKey, groupedSlots]) => ({
    dateKey,
    label: formatUtcDate(`${dateKey}T00:00:00Z`),
    slots: groupedSlots,
  }));
}
