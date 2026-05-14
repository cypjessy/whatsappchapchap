"use client";

import { useHaptics } from "@/hooks/useNativeAndroid";
import React from "react";

interface HapticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  hapticType?: "light" | "medium" | "heavy" | "success" | "error" | "warning";
  children: React.ReactNode;
}

/**
 * Button with built-in haptic feedback for premium Android feel
 * Automatically provides tactile feedback on press
 */
export default function HapticButton({
  hapticType = "light",
  onClick,
  children,
  className = "",
  ...props
}: HapticButtonProps) {
  const {
    impactLight,
    impactMedium,
    impactHeavy,
    notificationSuccess,
    notificationError,
    notificationWarning,
    isAvailable,
  } = useHaptics();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Trigger haptic feedback
    switch (hapticType) {
      case "light":
        await impactLight();
        break;
      case "medium":
        await impactMedium();
        break;
      case "heavy":
        await impactHeavy();
        break;
      case "success":
        await notificationSuccess();
        break;
      case "error":
        await notificationError();
        break;
      case "warning":
        await notificationWarning();
        break;
    }

    // Call original onClick
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`${className} ${isAvailable ? "cursor-pointer" : ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
