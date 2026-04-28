package httpapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/xhrobj-hex/ai-for-developers-project-386/backend/internal/store"
)

func TestCreateBookingConflictFlow(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, time.April, 11, 8, 0, 0, 0, time.UTC)
	repo := store.NewMemoryStore()
	handler := &Handler{
		store: repo,
		now: func() time.Time {
			return now
		},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /admin/event-types", handler.createEventType)
	mux.HandleFunc("POST /bookings", handler.createBooking)

	createEventTypeBody := []byte(`{"name":"Demo call","description":"First event type","durationMinutes":30}`)
	createEventTypeReq := httptest.NewRequest(http.MethodPost, "/admin/event-types", bytes.NewReader(createEventTypeBody))
	createEventTypeReq.Header.Set("Content-Type", "application/json")
	createEventTypeRec := httptest.NewRecorder()

	mux.ServeHTTP(createEventTypeRec, createEventTypeReq)

	if createEventTypeRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 for event type creation, got %d", createEventTypeRec.Code)
	}

	var createdEventType struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(createEventTypeRec.Body.Bytes(), &createdEventType); err != nil {
		t.Fatalf("decode created event type: %v", err)
	}

	firstBookingBody := []byte(`{"eventTypeId":"` + createdEventType.ID + `","startAt":"2026-04-11T09:00:00Z"}`)
	firstBookingReq := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewReader(firstBookingBody))
	firstBookingReq.Header.Set("Content-Type", "application/json")
	firstBookingRec := httptest.NewRecorder()

	mux.ServeHTTP(firstBookingRec, firstBookingReq)

	if firstBookingRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 for booking creation, got %d: %s", firstBookingRec.Code, firstBookingRec.Body.String())
	}

	conflictReq := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewReader(firstBookingBody))
	conflictReq.Header.Set("Content-Type", "application/json")
	conflictRec := httptest.NewRecorder()

	mux.ServeHTTP(conflictRec, conflictReq)

	if conflictRec.Code != http.StatusConflict {
		t.Fatalf("expected 409 for duplicate booking, got %d: %s", conflictRec.Code, conflictRec.Body.String())
	}

	var conflictBody struct {
		Code string `json:"code"`
	}
	if err := json.Unmarshal(conflictRec.Body.Bytes(), &conflictBody); err != nil {
		t.Fatalf("decode conflict response: %v", err)
	}

	if conflictBody.Code != "SLOT_ALREADY_BOOKED" {
		t.Fatalf("expected SLOT_ALREADY_BOOKED code, got %q", conflictBody.Code)
	}
}

func TestListUpcomingBookingsIncludesEventTypeDescription(t *testing.T) {
	t.Parallel()

	now := time.Date(2026, time.April, 11, 8, 0, 0, 0, time.UTC)
	repo := store.NewMemoryStore()
	handler := &Handler{
		store: repo,
		now: func() time.Time {
			return now
		},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /admin/event-types", handler.createEventType)
	mux.HandleFunc("POST /bookings", handler.createBooking)
	mux.HandleFunc("GET /admin/bookings/upcoming", handler.listUpcomingBookings)

	createEventTypeBody := []byte(`{"name":"Intro call","description":"Короткий созвон для знакомства","durationMinutes":30}`)
	createEventTypeReq := httptest.NewRequest(http.MethodPost, "/admin/event-types", bytes.NewReader(createEventTypeBody))
	createEventTypeReq.Header.Set("Content-Type", "application/json")
	createEventTypeRec := httptest.NewRecorder()

	mux.ServeHTTP(createEventTypeRec, createEventTypeReq)

	if createEventTypeRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 for event type creation, got %d", createEventTypeRec.Code)
	}

	var createdEventType struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(createEventTypeRec.Body.Bytes(), &createdEventType); err != nil {
		t.Fatalf("decode created event type: %v", err)
	}

	createBookingBody := []byte(`{"eventTypeId":"` + createdEventType.ID + `","startAt":"2026-04-11T09:00:00Z"}`)
	createBookingReq := httptest.NewRequest(http.MethodPost, "/bookings", bytes.NewReader(createBookingBody))
	createBookingReq.Header.Set("Content-Type", "application/json")
	createBookingRec := httptest.NewRecorder()

	mux.ServeHTTP(createBookingRec, createBookingReq)

	if createBookingRec.Code != http.StatusCreated {
		t.Fatalf("expected 201 for booking creation, got %d: %s", createBookingRec.Code, createBookingRec.Body.String())
	}

	upcomingReq := httptest.NewRequest(http.MethodGet, "/admin/bookings/upcoming", nil)
	upcomingRec := httptest.NewRecorder()

	mux.ServeHTTP(upcomingRec, upcomingReq)

	if upcomingRec.Code != http.StatusOK {
		t.Fatalf("expected 200 for upcoming bookings, got %d: %s", upcomingRec.Code, upcomingRec.Body.String())
	}

	var upcoming []struct {
		EventTypeDescription string `json:"eventTypeDescription"`
	}
	if err := json.Unmarshal(upcomingRec.Body.Bytes(), &upcoming); err != nil {
		t.Fatalf("decode upcoming bookings: %v", err)
	}

	if len(upcoming) != 1 {
		t.Fatalf("expected 1 upcoming booking, got %d", len(upcoming))
	}

	if upcoming[0].EventTypeDescription != "Короткий созвон для знакомства" {
		t.Fatalf("expected event type description to be preserved, got %q", upcoming[0].EventTypeDescription)
	}
}
