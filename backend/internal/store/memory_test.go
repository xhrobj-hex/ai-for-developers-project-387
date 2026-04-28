package store

import (
	"testing"
	"time"

	"github.com/xhrobj-hex/ai-for-developers-project-386/backend/internal/domain"
)

func TestCreateBookingReturnsConflict(t *testing.T) {
	t.Parallel()

	repo := NewMemoryStore()
	now := time.Date(2026, time.April, 11, 8, 0, 0, 0, time.UTC)

	_, err := repo.CreateBooking(
		"evt-1",
		time.Date(2026, time.April, 11, 9, 0, 0, 0, time.UTC),
		time.Date(2026, time.April, 11, 9, 30, 0, 0, time.UTC),
		now,
	)
	if err != nil {
		t.Fatalf("expected first booking to be created, got %v", err)
	}

	_, err = repo.CreateBooking(
		"evt-2",
		time.Date(2026, time.April, 11, 9, 15, 0, 0, time.UTC),
		time.Date(2026, time.April, 11, 9, 45, 0, 0, time.UTC),
		now,
	)
	if err != domain.ErrSlotAlreadyBooked {
		t.Fatalf("expected slot conflict error, got %v", err)
	}
}
