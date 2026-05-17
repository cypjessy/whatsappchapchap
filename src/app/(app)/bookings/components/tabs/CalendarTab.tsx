"use client";

import { Booking } from "@/lib/db";
import BookingCalendar from "../BookingCalendar";

interface CalendarTabProps {
  bookings: Booking[];
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  onViewBooking: (booking: Booking) => void;
  isLoading: boolean;
}

export default function CalendarTab({
  bookings,
  selectedDate,
  onDateSelect,
  onViewBooking,
  isLoading,
}: CalendarTabProps) {
  return (
    <BookingCalendar
      bookings={bookings}
      selectedDate={selectedDate}
      onDateSelect={onDateSelect}
      onViewBooking={onViewBooking}
      isLoading={isLoading}
    />
  );
}
