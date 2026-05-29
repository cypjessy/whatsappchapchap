"use client";

import dynamic from "next/dynamic";

const BookingPageContent = dynamic(() => import("./BookingPageContent"), { ssr: false });

export default function BookingPageClient() {
  return <BookingPageContent />;
}
