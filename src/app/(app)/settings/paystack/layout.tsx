"use client";

import { ModeProvider } from "@/context/ModeContext";

export default function PaystackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModeProvider>
      <div className="w-full min-h-screen bg-[#f8fafc]">
        {children}
      </div>
    </ModeProvider>
  );
}
