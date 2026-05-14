"use client";

import { AuthProvider } from "@/context/AuthContext";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  // Initialize Capacitor lifecycle management to prevent idle freeze
  useAppLifecycle();

  return <AuthProvider>{children}</AuthProvider>;
}
