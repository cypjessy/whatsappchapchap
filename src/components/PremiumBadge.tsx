import React from "react";

export interface PremiumBadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  icon?: string;
  className?: string;
}

/**
 * Premium badge/chip component for status indicators and labels
 */
export default function PremiumBadge({
  children,
  variant = "neutral",
  icon,
  className = "",
}: PremiumBadgeProps) {
  const baseClasses = "badge-premium";
  const variantClasses = {
    success: "badge-premium-success",
    warning: "badge-premium-warning",
    danger: "badge-premium-danger",
    info: "badge-premium-info",
    neutral: "badge-premium-neutral",
    primary: "badge-premium-primary",
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {icon && <i className={`fas ${icon}`} style={{ fontSize: "0.75rem" }} />}
      {children}
    </span>
  );
}
