"use client";

import { Booking } from "@/lib/db";
import BookingTimeline from "../BookingTimeline";

interface TimelineTabProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading: boolean;
  onUpdateStatus?: (bookingId: string, status: Booking["status"]) => void;
  onDelete?: (bookingId: string) => void;
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
