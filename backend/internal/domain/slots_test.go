package domain

import (
	"testing"
	"time"
)

func TestValidateSlotStart(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, time.April, 11, 8, 0, 0, 0, time.UTC)
	eventType := EventType{ID: "evt-1", DurationMinutes: 30}

	if err := ValidateSlotStart(now, eventType, time.Date(2026, time.April, 11, 9, 0, 0, 0, time.UTC)); err != nil {
		t.Fatalf("expected slot to be valid, got %v", err)
	}

	if err := ValidateSlotStart(now, eventType, time.Date(2026, time.April, 11, 9, 15, 0, 0, time.UTC)); err == nil {
		t.Fatal("expected non-grid slot to be rejected")
	}
}

func TestGenerateSlotsSkipsBookedIntervals(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, time.April, 11, 8, 0, 0, 0, time.UTC)
	eventType := EventType{ID: "evt-1", DurationMinutes: 30}
	bookings := []Booking{
		{
			ID:          "bkg-1",
			EventTypeID: "evt-1",
			StartAt:     time.Date(2026, time.April, 11, 9, 30, 0, 0, time.UTC),
			EndAt:       time.Date(2026, time.April, 11, 10, 0, 0, 0, time.UTC),
		},
	}

	slots := GenerateSlots(now, eventType, bookings)

	for _, slot := range slots {
		if slot.StartAt.Equal(time.Date(2026, time.April, 11, 9, 30, 0, 0, time.UTC)) {
			t.Fatal("expected booked slot to be excluded")
		}
	}
}
