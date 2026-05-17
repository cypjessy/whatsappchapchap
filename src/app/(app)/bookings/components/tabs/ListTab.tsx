"use client";

import { Booking } from "@/lib/db";
import BookingListView from "../BookingListView";

interface ListTabProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading: boolean;
}

export default function ListTab({
  bookings,
  onViewBooking,
  isLoading,
}: ListTabProps) {
  return (
    <BookingListView
      bookings={bookings}
      onViewBooking={onViewBooking}
      isLoading={isLoading}
    />
  );
}
