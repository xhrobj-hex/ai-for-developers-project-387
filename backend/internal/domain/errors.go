package domain

import "errors"

var (
	ErrEventTypeNotFound    = errors.New("event type not found")
	ErrSlotAlreadyBooked    = errors.New("slot already booked")
	ErrBookingRuleViolation = errors.New("booking rule violation")
)
