package httpapi

import "time"

type createEventTypeRequest struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"durationMinutes"`
}

type createBookingRequest struct {
	EventTypeID string    `json:"eventTypeId"`
	StartAt     time.Time `json:"startAt"`
}

type validationErrorResponse struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Details []string `json:"details,omitempty"`
}

type notFoundErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type slotAlreadyBookedErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

type bookingRuleViolationErrorResponse struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}
