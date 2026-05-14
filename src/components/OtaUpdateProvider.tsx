"use client";

import { useOtaUpdate } from "@/hooks/useOtaUpdate";

export default function OtaUpdateProvider({ children }: { children: React.ReactNode }) {
  useOtaUpdate();
  
  return <>{children}</>;
}
