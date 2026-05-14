import React from "react";

export interface PremiumCardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "compact";
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

/**
 * Premium card component with enhanced shadows and hover effects
 * Provides consistent card styling across the app
 */
export default function PremiumCard({
  children,
  variant = "default",
  className = "",
  onClick,
  hoverable = true,
}: PremiumCardProps) {
  const baseClasses = "card-premium transition-premium";
  const variantClasses = {
    default: "",
    elevated: "card-premium-elevated",
    compact: "card-premium-compact",
  };

  const hoverClass = hoverable && onClick ? "hover-lift cursor-pointer" : "";
  const clickHandler = onClick ? { onClick } : {};

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClass} ${className}`}
      {...clickHandler}
    >
      {children}
    </div>
  );
}
