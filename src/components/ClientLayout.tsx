"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ReactNode } from "react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
