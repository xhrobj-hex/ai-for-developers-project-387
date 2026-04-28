package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/xhrobj-hex/ai-for-developers-project-386/backend/internal/domain"
)

func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) createEventType(w http.ResponseWriter, r *http.Request) {
	var req createEventTypeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeValidationError(w, "Request body is invalid", err.Error())
		return
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Description = strings.TrimSpace(req.Description)

	details := make([]string, 0)
	if req.Name == "" {
		details = append(details, "name is required")
	}
	if req.Description == "" {
		details = append(details, "description is required")
	}
	if req.DurationMinutes <= 0 {
		details = append(details, "durationMinutes must be greater than 0")
	}

	if len(details) > 0 {
		writeValidationError(w, "Request validation failed", details...)
		return
	}

	eventType := h.store.CreateEventType(req.Name, req.Description, req.DurationMinutes, h.now())
	writeJSON(w, http.StatusCreated, eventType)
}

func (h *Handler) listEventTypes(w http.ResponseWriter, r *http.Request) {
	eventTypes := h.store.ListEventTypes()
	if eventTypes == nil {
		eventTypes = make([]domain.EventType, 0)
	}

	writeJSON(w, http.StatusOK, eventTypes)
}

func (h *Handler) listSlots(w http.ResponseWriter, r *http.Request) {
	eventTypeID := r.PathValue("eventTypeId")
	eventType, ok := h.store.GetEventType(eventTypeID)
	if !ok {
		writeNotFound(w, "Event type not found")
		return
	}

	slots := domain.GenerateSlots(h.now(), eventType, h.store.ListBookings())
	if slots == nil {
		slots = make([]domain.Slot, 0)
	}

	writeJSON(w, http.StatusOK, slots)
}

func (h *Handler) createBooking(w http.ResponseWriter, r *http.Request) {
	var req createBookingRequest
	if err := decodeJSON(r, &req); err != nil {
		writeValidationError(w, "Request body is invalid", err.Error())
		return
	}

	if strings.TrimSpace(req.EventTypeID) == "" || req.StartAt.IsZero() {
		writeValidationError(w, "Request validation failed", "eventTypeId and startAt are required")
		return
	}

	eventType, ok := h.store.GetEventType(req.EventTypeID)
	if !ok {
		writeNotFound(w, "Event type not found")
		return
	}

	startAt := req.StartAt.UTC()
	if err := domain.ValidateSlotStart(h.now(), eventType, startAt); err != nil {
		writeBookingRuleViolation(w, "Selected startAt is outside the allowed booking grid")
		return
	}

	endAt := startAt.Add(time.Duration(eventType.DurationMinutes) * time.Minute)
	booking, err := h.store.CreateBooking(eventType.ID, startAt, endAt, h.now())
	if err != nil {
		if errors.Is(err, domain.ErrSlotAlreadyBooked) {
			writeSlotAlreadyBooked(w, "Selected slot is already booked")
			return
		}

		log.Printf("create booking: %v", err)
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, booking)
}

func (h *Handler) listUpcomingBookings(w http.ResponseWriter, r *http.Request) {
	now := h.now()
	bookings := h.store.ListUpcomingBookings(now)
	eventTypes := h.store.ListEventTypes()

	type eventTypeDetails struct {
		name        string
		description string
	}

	eventTypeByID := make(map[string]eventTypeDetails, len(eventTypes))
	for _, eventType := range eventTypes {
		eventTypeByID[eventType.ID] = eventTypeDetails{
			name:        eventType.Name,
			description: eventType.Description,
		}
	}

	response := make([]domain.UpcomingBooking, 0, len(bookings))
	for _, booking := range bookings {
		eventType := eventTypeByID[booking.EventTypeID]

		response = append(response, domain.UpcomingBooking{
			ID:                   booking.ID,
			EventTypeID:          booking.EventTypeID,
			EventTypeName:        eventType.name,
			EventTypeDescription: eventType.description,
			StartAt:              booking.StartAt,
			EndAt:                booking.EndAt,
			CreatedAt:            booking.CreatedAt,
		})
	}

	sort.Slice(response, func(i int, j int) bool {
		return response[i].StartAt.Before(response[j].StartAt)
	})

	writeJSON(w, http.StatusOK, response)
}

func decodeJSON(r *http.Request, v any) error {
	defer r.Body.Close()

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(v); err != nil {
		return err
	}

	if err := decoder.Decode(&struct{}{}); err != io.EOF {
		return errors.New("request body must contain a single JSON object")
	}

	return nil
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		log.Printf("write response: %v", err)
	}
}

func writeValidationError(w http.ResponseWriter, message string, details ...string) {
	writeJSON(w, http.StatusBadRequest, validationErrorResponse{
		Code:    "VALIDATION_ERROR",
		Message: message,
		Details: details,
	})
}

func writeNotFound(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusNotFound, notFoundErrorResponse{
		Code:    "NOT_FOUND",
		Message: message,
	})
}

func writeSlotAlreadyBooked(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusConflict, slotAlreadyBookedErrorResponse{
		Code:    "SLOT_ALREADY_BOOKED",
		Message: message,
	})
}

func writeBookingRuleViolation(w http.ResponseWriter, message string) {
	writeJSON(w, http.StatusUnprocessableEntity, bookingRuleViolationErrorResponse{
		Code:    "BOOKING_RULE_VIOLATION",
		Message: message,
	})
}
