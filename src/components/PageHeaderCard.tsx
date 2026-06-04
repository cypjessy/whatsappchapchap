"use client";

import { ReactNode } from "react";

interface PageHeaderCardProps {
  children: ReactNode;
  className?: string;
}

export default function PageHeaderCard({ children, className = "" }: PageHeaderCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl md:rounded-2xl border border-white/20 bg-white/70 shadow-lg shadow-black/5 backdrop-blur-xl ${className}`}
    >
      {/* Subtle gradient accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-purple-500/40" />
      <div className="px-4 py-3 md:px-6 md:py-5">{children}</div>
    </div>
  );
}
