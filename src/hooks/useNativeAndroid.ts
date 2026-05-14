"use client";

/**
 * Centralized Native Android Features
 * Exports all Capacitor plugin hooks for easy import across the app
 */

// Haptic Feedback
export { useHaptics } from './useHaptics';

// Network Status
export { useNetworkStatus } from './useNetworkStatus';

// Clipboard Operations
export { useClipboard } from './useClipboard';

// Share Functionality
export { useShare } from './useShare';

// Toast Messages
export { useToast } from './useToast';

// App Lifecycle Management
export { useAppLifecycle } from './useAppLifecycle';

// Mobile Optimizations
export { useMobileOptimizations } from './useMobileOptimizations';

// Re-export types for convenience
export type { ImpactStyle, NotificationType } from '@capacitor/haptics';
export type { Style as StatusBarStyle } from '@capacitor/status-bar';
