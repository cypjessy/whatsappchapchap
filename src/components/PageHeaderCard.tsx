"use client";

import { ReactNode, useEffect, useState } from "react";

interface PageHeaderCardProps {
  children: ReactNode;
  className?: string;
  gradient?: string;
}

export default function PageHeaderCard({ children, className = "", gradient }: PageHeaderCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl md:rounded-[20px]
        shadow-xl shadow-black/5
        backdrop-blur-xl
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}
        ${className}
      `}
      style={{
        background: gradient || "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      {/* Premium MD3-style surface border */}
      <div className="absolute inset-0 rounded-2xl md:rounded-[20px] border border-black/[0.04] pointer-events-none" />

      {/* Gradient accent line — MD3 primary color sweep */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#0d6b4f] opacity-80" />

      {/* Subtle decorative glow orbs — MD3 ambient light */}
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-gradient-to-br from-[#25D366]/[0.04] to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-gradient-to-tr from-[#8b5cf6]/[0.03] to-transparent blur-2xl pointer-events-none" />

      {/* Content */}
      <div className="relative px-4 py-3.5 md:px-6 md:py-5">{children}</div>
    </div>
  );
}
