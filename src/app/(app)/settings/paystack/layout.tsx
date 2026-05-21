"use client";

import { ModeProvider } from "@/context/ModeContext";

export default function PaystackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider>
      <div className="w-full min-h-screen bg-surface-container-lowest">
        {children}
      </div>
    </ModeProvider>
  );
}
