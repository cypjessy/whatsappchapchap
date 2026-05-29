"use client";

import dynamic from "next/dynamic";

const OrderPageContent = dynamic(() => import("./OrderPageContent"), { ssr: false });

export default function OrderPageClient() {
  return <OrderPageContent />;
}
