package httpapi

import (
	"net/http"
	"time"

	"github.com/xhrobj-hex/ai-for-developers-project-386/backend/internal/store"
)

type Handler struct {
	store *store.MemoryStore
	now   func() time.Time
}

func NewHandler(store *store.MemoryStore) http.Handler {
	handler := &Handler{
		store: store,
		now: func() time.Time {
			return time.Now().UTC()
		},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handler.health)
	mux.HandleFunc("GET /event-types", handler.listEventTypes)
	mux.HandleFunc("GET /event-types/{eventTypeId}/slots", handler.listSlots)
	mux.HandleFunc("POST /bookings", handler.createBooking)
	mux.HandleFunc("POST /admin/event-types", handler.createEventType)
	mux.HandleFunc("GET /admin/bookings/upcoming", handler.listUpcomingBookings)

	return mux
}
