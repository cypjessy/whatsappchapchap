"use client";

import { Booking } from "@/lib/db";
import BookingTimeline from "../BookingTimeline";

interface TimelineTabProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading: boolean;
}

export default function TimelineTab({
  bookings,
  onViewBooking,
  isLoading,
}: TimelineTabProps) {
  return (
    <BookingTimeline
      bookings={bookings}
      onViewBooking={onViewBooking}
      isLoading={isLoading}
    />
  );
}
