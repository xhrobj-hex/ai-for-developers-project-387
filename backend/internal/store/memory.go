package store

import (
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/xhrobj-hex/ai-for-developers-project-386/backend/internal/domain"
)

type MemoryStore struct {
	mu            sync.RWMutex
	eventTypes    []domain.EventType
	bookings      []domain.Booking
	nextEventType int
	nextBooking   int
}

func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		eventTypes:    make([]domain.EventType, 0),
		bookings:      make([]domain.Booking, 0),
		nextEventType: 1,
		nextBooking:   1,
	}
}

func (s *MemoryStore) ListEventTypes() []domain.EventType {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]domain.EventType, len(s.eventTypes))
	copy(result, s.eventTypes)

	return result
}

func (s *MemoryStore) CreateEventType(name string, description string, durationMinutes int, now time.Time) domain.EventType {
	s.mu.Lock()
	defer s.mu.Unlock()

	eventType := domain.EventType{
		ID:              fmt.Sprintf("evt-%d", s.nextEventType),
		Name:            name,
		Description:     description,
		DurationMinutes: durationMinutes,
		CreatedAt:       now.UTC(),
	}

	s.nextEventType++
	s.eventTypes = append(s.eventTypes, eventType)

	return eventType
}

func (s *MemoryStore) GetEventType(id string) (domain.EventType, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, eventType := range s.eventTypes {
		if eventType.ID == id {
			return eventType, true
		}
	}

	return domain.EventType{}, false
}

func (s *MemoryStore) ListBookings() []domain.Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]domain.Booking, len(s.bookings))
	copy(result, s.bookings)

	return result
}

func (s *MemoryStore) CreateBooking(eventTypeID string, startAt time.Time, endAt time.Time, now time.Time) (domain.Booking, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if domain.HasConflict(startAt, endAt, s.bookings) {
		return domain.Booking{}, domain.ErrSlotAlreadyBooked
	}

	booking := domain.Booking{
		ID:          fmt.Sprintf("bkg-%d", s.nextBooking),
		EventTypeID: eventTypeID,
		StartAt:     startAt.UTC(),
		EndAt:       endAt.UTC(),
		CreatedAt:   now.UTC(),
	}

	s.nextBooking++
	s.bookings = append(s.bookings, booking)

	return booking, nil
}

func (s *MemoryStore) ListUpcomingBookings(now time.Time) []domain.Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()

	now = now.UTC()
	upcoming := make([]domain.Booking, 0)

	for _, booking := range s.bookings {
		if !booking.StartAt.UTC().Before(now) {
			upcoming = append(upcoming, booking)
		}
	}

	sort.Slice(upcoming, func(i int, j int) bool {
		return upcoming[i].StartAt.Before(upcoming[j].StartAt)
	})

	return upcoming
}
