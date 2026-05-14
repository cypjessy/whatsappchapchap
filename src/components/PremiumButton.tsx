"use client";

import React from "react";
import HapticButton from "./HapticButton";

export interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
  children: React.ReactNode;
}

/**
 * Premium button with multiple variants, sizes, and haptic feedback
 * Consistent button styling across the entire app
 */
export default function PremiumButton({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...props
}: PremiumButtonProps) {
  const baseClasses = "btn-premium transition-premium";
  const variantClasses = {
    primary: "btn-premium-primary",
    secondary: "btn-premium-secondary",
    danger: "btn-premium-danger",
    ghost: "btn-premium-ghost",
  };
  const sizeClasses = {
    sm: "btn-premium-sm",
    md: "",
    lg: "btn-premium-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <HapticButton
      hapticType={variant === "danger" ? "error" : "light"}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <i className="fas fa-spinner fa-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <i className={`fas ${icon}`} />}
          <span>{children}</span>
        </>
      )}
    </HapticButton>
  );
}
