"use client";

import { Booking } from "@/lib/db";
import BookingGridView from "../BookingGridView";

interface GridTabProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading: boolean;
  onUpdateStatus?: (bookingId: string, status: Booking["status"]) => void;
  onDelete?: (bookingId: string) => void;
}

export default function GridTab({
  bookings,
  onViewBooking,
  isLoading,
  onUpdateStatus,
  onDelete,
}: GridTabProps) {
  return (
    <BookingGridView
      bookings={bookings}
      onViewBooking={onViewBooking}
      isLoading={isLoading}
      onUpdateStatus={onUpdateStatus}
      onDelete={onDelete}
    />
  );
}
