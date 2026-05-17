"use client";

import { Booking } from "@/lib/db";
import BookingGridView from "../BookingGridView";

interface GridTabProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading: boolean;
}

export default function GridTab({
  bookings,
  onViewBooking,
  isLoading,
}: GridTabProps) {
  return (
    <BookingGridView
      bookings={bookings}
      onViewBooking={onViewBooking}
      isLoading={isLoading}
    />
  );
}
