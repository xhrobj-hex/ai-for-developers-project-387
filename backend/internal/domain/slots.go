package domain

import "time"

const (
	BookingWindowDays = 14
	SlotStepMinutes   = 30
	workdayStartHour  = 9
	workdayEndHour    = 18
)

func GenerateSlots(now time.Time, eventType EventType, bookings []Booking) []Slot {
	now = now.UTC()
	windowEnd := now.AddDate(0, 0, BookingWindowDays)
	duration := time.Duration(eventType.DurationMinutes) * time.Minute

	slots := make([]Slot, 0)
	startDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)

	for day := 0; day <= BookingWindowDays; day++ {
		currentDay := startDay.AddDate(0, 0, day)
		dayStart := time.Date(currentDay.Year(), currentDay.Month(), currentDay.Day(), workdayStartHour, 0, 0, 0, time.UTC)
		dayEnd := time.Date(currentDay.Year(), currentDay.Month(), currentDay.Day(), workdayEndHour, 0, 0, 0, time.UTC)

		for slotStart := dayStart; !slotStart.Before(dayStart) && slotStart.Add(duration).Before(dayEnd.Add(time.Nanosecond)); slotStart = slotStart.Add(SlotStepMinutes * time.Minute) {
			slotEnd := slotStart.Add(duration)

			if slotStart.Before(now) {
				continue
			}

			if !slotStart.Before(windowEnd) {
				continue
			}

			if hasConflict(slotStart, slotEnd, bookings) {
				continue
			}

			slots = append(slots, Slot{
				EventTypeID: eventType.ID,
				StartAt:     slotStart,
				EndAt:       slotEnd,
			})
		}
	}

	return slots
}

func ValidateSlotStart(now time.Time, eventType EventType, startAt time.Time) error {
	now = now.UTC()
	startAt = startAt.UTC()

	if startAt.Before(now) {
		return ErrBookingRuleViolation
	}

	if !startAt.Before(now.AddDate(0, 0, BookingWindowDays)) {
		return ErrBookingRuleViolation
	}

	if startAt.Second() != 0 || startAt.Nanosecond() != 0 {
		return ErrBookingRuleViolation
	}

	totalMinutes := startAt.Hour()*60 + startAt.Minute()
	workdayStartMinutes := workdayStartHour * 60
	workdayEndMinutes := workdayEndHour * 60
	durationMinutes := eventType.DurationMinutes

	if startAt.Minute()%SlotStepMinutes != 0 {
		return ErrBookingRuleViolation
	}

	if totalMinutes < workdayStartMinutes {
		return ErrBookingRuleViolation
	}

	if totalMinutes+durationMinutes > workdayEndMinutes {
		return ErrBookingRuleViolation
	}

	return nil
}

func HasConflict(startAt time.Time, endAt time.Time, bookings []Booking) bool {
	return hasConflict(startAt.UTC(), endAt.UTC(), bookings)
}

func hasConflict(startAt time.Time, endAt time.Time, bookings []Booking) bool {
	for _, booking := range bookings {
		if startAt.Before(booking.EndAt.UTC()) && booking.StartAt.UTC().Before(endAt) {
			return true
		}
	}

	return false
}
