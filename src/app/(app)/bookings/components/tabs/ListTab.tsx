"use client";

import { Booking } from "@/lib/db";
import BookingListView from "../BookingListView";

interface ListTabProps {
  bookings: Booking[];
  onViewBooking: (booking: Booking) => void;
  isLoading: boolean;
  onUpdateStatus?: (bookingId: string, status: Booking["status"]) => void;
  onDelete?: (bookingId: string) => void;
}

export default function ListTab({
  bookings,
  onViewBooking,
  isLoading,
  onUpdateStatus,
  onDelete,
}: ListTabProps) {
  return (
    <BookingListView
      bookings={bookings}
      onViewBooking={onViewBooking}
      isLoading={isLoading}
      onUpdateStatus={onUpdateStatus}
      onDelete={onDelete}
    />
  );
}
