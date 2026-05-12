"use client";

import React from 'react';
import { useHaptics } from '@/hooks/useHaptics';

/**
 * Enhanced button component with haptic feedback
 * Wraps any clickable element to add tactile feedback on Capacitor devices
 */
export function HapticButton({
  children,
  onClick,
  hapticType = 'light',
  className = '',
  ...props
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent | React.TouchEvent) => void;
  hapticType?: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'none';
  className?: string;
  [key: string]: any;
}) {
  const { 
    impactLight, 
    impactMedium, 
    impactHeavy,
    notificationSuccess,
    notificationError,
    notificationWarning,
    isAvailable 
  } = useHaptics();

  const handleInteraction = async (e: React.MouseEvent | React.TouchEvent) => {
    // Trigger haptic feedback if available and not disabled
    if (isAvailable && hapticType !== 'none') {
      switch (hapticType) {
        case 'light':
          await impactLight();
          break;
        case 'medium':
          await impactMedium();
          break;
        case 'heavy':
          await impactHeavy();
          break;
        case 'success':
          await notificationSuccess();
          break;
        case 'error':
          await notificationError();
          break;
        case 'warning':
          await notificationWarning();
          break;
      }
    }

    // Call original onClick handler
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}
