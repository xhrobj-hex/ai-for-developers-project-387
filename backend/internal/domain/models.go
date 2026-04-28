package domain

import "time"

type EventType struct {
	ID              string    `json:"id"`
	Name            string    `json:"name"`
	Description     string    `json:"description"`
	DurationMinutes int       `json:"durationMinutes"`
	CreatedAt       time.Time `json:"-"`
}

type Booking struct {
	ID          string    `json:"id"`
	EventTypeID string    `json:"eventTypeId"`
	StartAt     time.Time `json:"startAt"`
	EndAt       time.Time `json:"endAt"`
	CreatedAt   time.Time `json:"createdAt"`
}

type Slot struct {
	EventTypeID string    `json:"eventTypeId"`
	StartAt     time.Time `json:"startAt"`
	EndAt       time.Time `json:"endAt"`
}

type UpcomingBooking struct {
	ID                   string    `json:"id"`
	EventTypeID          string    `json:"eventTypeId"`
	EventTypeName        string    `json:"eventTypeName"`
	EventTypeDescription string    `json:"eventTypeDescription"`
	StartAt              time.Time `json:"startAt"`
	EndAt                time.Time `json:"endAt"`
	CreatedAt            time.Time `json:"createdAt"`
}
