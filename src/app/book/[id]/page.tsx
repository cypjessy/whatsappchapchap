import { Suspense } from "react";
import BookingPageClient from "./BookingPageClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading service...</p>
        </div>
      </div>
    }>
      <BookingPageClient />
    </Suspense>
  );
}
