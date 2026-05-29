import { Suspense } from "react";
import OrderPageClient from "./OrderPageClient";

export function generateStaticParams() {
  return [{ slug: ["order"] }];
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin"></div>
      </div>
    }>
      <OrderPageClient />
    </Suspense>
  );
}
