import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listEventTypes } from "@/lib/api/event-types";
import type { EventType } from "@/lib/types/event-type";
import { cn } from "@/lib/utils";

type HomePageState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; eventTypes: EventType[] };

export function HomePage() {
  const [state, setState] = useState<HomePageState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    setState({ status: "loading" });

    listEventTypes({ signal: controller.signal })
      .then((eventTypes) => {
        setState({ status: "success", eventTypes });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          status: "error",
          message: "Не удалось загрузить встречи.",
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <section className="screen-grid">
      <Card className="hero-card">
        <CardHeader className="hero-card__header">
          <CardTitle>Выберите тип встречи</CardTitle>
          <CardDescription>Подберите подходящий формат, а на следующем шаге мы покажем свободное время.</CardDescription>
        </CardHeader>
        <CardContent className="hero-card__content">
          <p className="screen-note">Короткие варианты для знакомства, обсуждения задачи или быстрого созвона.</p>
        </CardContent>
      </Card>

      {state.status === "loading" && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Загружаем доступные встречи</CardTitle>
            <CardDescription>Сейчас появятся форматы, которые можно забронировать.</CardDescription>
          </CardHeader>
        </Card>
      )}

      {state.status === "error" && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Не удалось открыть список встреч</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {state.status === "success" && state.eventTypes.length === 0 && (
        <Card className="screen-state">
          <CardHeader>
            <CardTitle>Встреч пока нет</CardTitle>
            <CardDescription>Добавьте первый тип встречи в разделе управления, и он сразу появится здесь.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="screen-actions">
              <Link className={cn("ui-button", "ui-button--primary")} to="/admin">
                Открыть управление
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {state.status === "success" && state.eventTypes.length > 0 && (
        <div className="event-type-grid">
          {state.eventTypes.map((eventType) => (
            <Card key={eventType.id} className="event-type-card" data-testid="event-type-card">
              <CardHeader>
                <Badge>{formatDuration(eventType.durationMinutes)}</Badge>
                <CardTitle>{eventType.name}</CardTitle>
                <CardDescription>{eventType.description}</CardDescription>
              </CardHeader>
              <CardContent className="event-type-card__content">
                <p className="event-type-card__meta">Свободные слоты на ближайшие 14 дней.</p>
                <Link
                  className={cn("ui-button", "ui-button--primary", "screen-action")}
                  data-testid="event-type-open"
                  to={`/book/${eventType.id}`}
                >
                  Выбрать время
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function formatDuration(durationMinutes: number) {
  return `${durationMinutes} мин`;
}
