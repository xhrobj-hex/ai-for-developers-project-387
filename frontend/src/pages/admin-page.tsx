import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createEventType, isCreateEventTypeValidationError } from "@/lib/api/event-types";
import { listUpcomingBookings } from "@/lib/api/bookings";
import { formatUtcDateTime } from "@/lib/format/utc";
import type { EventType } from "@/lib/types/event-type";
import type { UpcomingBooking } from "@/lib/types/upcoming-booking";

type CreateFormState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; eventType: EventType }
  | { status: "error"; message: string };

type UpcomingBookingsState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "success"; bookings: UpcomingBooking[] };

type FormValues = {
  name: string;
  description: string;
  durationMinutes: string;
};

const initialFormValues: FormValues = {
  name: "",
  description: "",
  durationMinutes: "30",
};

export function AdminPage() {
  const [formValues, setFormValues] = useState<FormValues>(initialFormValues);
  const [createState, setCreateState] = useState<CreateFormState>({ status: "idle" });
  const [upcomingState, setUpcomingState] = useState<UpcomingBookingsState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    setUpcomingState({ status: "loading" });

    listUpcomingBookings({ signal: controller.signal })
      .then((bookings) => {
        if (bookings.length === 0) {
          setUpcomingState({ status: "empty" });
          return;
        }

        setUpcomingState({
          status: "success",
          bookings,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) {
          return;
        }

        setUpcomingState({
          status: "error",
          message: "Попробуйте обновить страницу чуть позже.",
        });
      });

    return () => {
      controller.abort();
    };
  }, []);

  function handleChange(field: keyof FormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (createState.status !== "submitting") {
      setCreateState({ status: "idle" });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = formValues.name.trim();
    const description = formValues.description.trim();
    const durationMinutes = Number(formValues.durationMinutes);

    if (!name || !description || !Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      setCreateState({
        status: "error",
        message: "Заполните название, описание и длительность встречи.",
      });
      return;
    }

    setCreateState({ status: "submitting" });

    try {
      const eventType = await createEventType({
        name,
        description,
        durationMinutes,
      });

      setCreateState({
        status: "success",
        eventType,
      });
      setFormValues(initialFormValues);
    } catch (error: unknown) {
      if (isCreateEventTypeValidationError(error)) {
        const details = error.details?.length ? ` Проверьте поля: ${error.details.join("; ")}.` : "";

        setCreateState({
          status: "error",
          message: `${error.message}${details}`,
        });
        return;
      }

      setCreateState({
        status: "error",
        message: "Не удалось сохранить тип встречи. Попробуйте ещё раз.",
      });
    }
  }

  return (
    <section className="screen-grid screen-grid--admin">
      <Card>
        <CardHeader>
          <CardTitle>Новый тип встречи</CardTitle>
          <CardDescription>Он сразу появится на странице записи и будет доступен для бронирования.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="admin-form" data-testid="event-type-form" onSubmit={handleSubmit}>
            <label className="form-field">
              <span className="form-field__label">Название</span>
              <input
                className="form-field__control"
                type="text"
                name="name"
                value={formValues.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Короткое знакомство"
                autoComplete="off"
              />
            </label>

            <label className="form-field">
              <span className="form-field__label">Описание</span>
              <textarea
                className="form-field__control form-field__control--textarea"
                name="description"
                value={formValues.description}
                onChange={(event) => handleChange("description", event.target.value)}
                placeholder="15-минутный созвон, чтобы быстро обсудить задачу"
                rows={4}
              />
            </label>

            <label className="form-field">
              <span className="form-field__label">Длительность, минут</span>
              <input
                className="form-field__control"
                type="number"
                min="1"
                step="1"
                name="durationMinutes"
                value={formValues.durationMinutes}
                onChange={(event) => handleChange("durationMinutes", event.target.value)}
              />
            </label>

            <div className="screen-actions">
              <Button data-testid="event-type-submit" type="submit" disabled={createState.status === "submitting"}>
                {createState.status === "submitting" ? "Сохраняем..." : "Сохранить тип встречи"}
              </Button>
            </div>
          </form>

          {createState.status === "idle" && (
            <p className="admin-inline-note">Новый тип встречи будет виден на странице записи сразу после сохранения.</p>
          )}

          {createState.status === "success" && (
            <div className="admin-feedback admin-feedback--success" data-testid="event-type-success">
              <p className="admin-feedback__title">Тип встречи сохранён</p>
              <p className="admin-feedback__text">
                <strong>{createState.eventType.name}</strong> · {createState.eventType.durationMinutes} мин
              </p>
              <p className="admin-feedback__text">{createState.eventType.description}</p>
            </div>
          )}

          {createState.status === "error" && (
            <div className="admin-feedback admin-feedback--error" data-testid="event-type-error">
              <p className="admin-feedback__title">Не удалось сохранить тип встречи</p>
              <p className="admin-feedback__text">{createState.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Предстоящие встречи</CardTitle>
          <CardDescription>Новые записи появятся здесь автоматически после подтверждения.</CardDescription>
        </CardHeader>
        <CardContent data-testid="upcoming-bookings">
          {upcomingState.status === "loading" && (
            <div className="admin-feedback">
              <p className="admin-feedback__title">Загружаем встречи</p>
              <p className="admin-feedback__text">Сейчас покажем ближайшие бронирования.</p>
            </div>
          )}

          {upcomingState.status === "empty" && (
            <div className="admin-feedback">
              <p className="admin-feedback__title">Пока пусто</p>
              <p className="admin-feedback__text">Как только кто-то подтвердит запись, встреча появится здесь.</p>
            </div>
          )}

          {upcomingState.status === "error" && (
            <div className="admin-feedback admin-feedback--error">
              <p className="admin-feedback__title">Не удалось загрузить встречи</p>
              <p className="admin-feedback__text">{upcomingState.message}</p>
            </div>
          )}

          {upcomingState.status === "success" && (
            <div className="admin-list">
              {upcomingState.bookings.map((booking) => (
                <article key={booking.id} className="admin-list__item" data-testid="upcoming-booking-item">
                  <div className="admin-list__heading">
                    <strong>{booking.eventTypeName}</strong>
                    <span className="admin-list__eyebrow">{formatUtcDateTime(booking.startAt)} UTC</span>
                  </div>
                  <p className="admin-list__description">{booking.eventTypeDescription}</p>
                  <dl className="summary-list">
                    <div className="summary-list__row">
                      <dt>Начало</dt>
                      <dd>{formatUtcDateTime(booking.startAt)} UTC</dd>
                    </div>
                    <div className="summary-list__row">
                      <dt>Конец</dt>
                      <dd>{formatUtcDateTime(booking.endAt)} UTC</dd>
                    </div>
                    <div className="summary-list__row">
                      <dt>Создана</dt>
                      <dd>{formatUtcDateTime(booking.createdAt)} UTC</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
