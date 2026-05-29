"use client";

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook for push and local notifications in Capacitor apps
 * Handles FCM push notifications, local notifications, and permission requests
 */
export function useNotifications() {
  const isCapacitor = typeof window !== 'undefined' && 
    ((window as any).Capacitor || (window as any).CapacitorPlatforms);

  const [hasPermission, setHasPermission] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [pendingNotification, setPendingNotification] = useState<any>(null);

  /**
   * Request notification permissions
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isCapacitor) {
      // Browser fallback - request Notification API permission
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        const granted = result === 'granted';
        setHasPermission(granted);
        return granted;
      }
      return false;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      const granted = result.receive === 'granted';
      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.error('[Notifications] Permission request failed:', err);
      return false;
    }
  }, [isCapacitor]);

  /**
   * Register for push notifications (FCM)
   */
  const register = useCallback(async () => {
    if (!isCapacitor) {
      console.debug('[Notifications] Push notifications not available in browser');
      return null;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Register with FCM
      await PushNotifications.register();

      // Listen for token
      PushNotifications.addListener('registration', (token) => {
        console.log('[Notifications] FCM token received:', token.value);
        setFcmToken(token.value);
      });

      // Listen for registration error
      PushNotifications.addListener('registrationError', (err) => {
        console.error('[Notifications] FCM registration error:', err);
      });

      // Listen for incoming push notifications
      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[Notifications] Push received:', notification);
        setPendingNotification(notification);
      });

      // Listen for notification tap
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[Notifications] Push action performed:', action);
        setPendingNotification(action.notification);
      });

      return true;
    } catch (err) {
      console.error('[Notifications] Registration failed:', err);
      return false;
    }
  }, [isCapacitor]);

  /**
   * Unregister all push notification listeners
   */
  const unregister = useCallback(async () => {
    if (!isCapacitor) return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      PushNotifications.removeAllListeners();
    } catch (err) {
      console.error('[Notifications] Unregister failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Clear the pending notification state after consuming it
   */
  const clearPendingNotification = useCallback(() => {
    setPendingNotification(null);
  }, []);

  /**
   * Show a local notification
   */
  const showLocalNotification = useCallback(async (options: {
    title: string;
    body: string;
    id?: number;
    schedule?: { at: Date };
    extra?: Record<string, any>;
  }) => {
    if (!isCapacitor) {
      // Browser fallback
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(options.title, {
          body: options.body,
        });
      }
      return;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title: options.title,
            body: options.body,
            id: options.id || Date.now(),
            schedule: options.schedule ? { at: options.schedule.at } : undefined,
            extra: options.extra,
          },
        ],
      });
    } catch (err) {
      console.error('[Notifications] Local notification failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Cancel a specific local notification by ID
   */
  const cancelNotification = useCallback(async (id: number) => {
    if (!isCapacitor) return;

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.cancel({ notifications: [{ id }] });
    } catch (err) {
      console.error('[Notifications] Cancel failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Cancel all pending local notifications
   */
  const cancelAllNotifications = useCallback(async () => {
    if (!isCapacitor) return;

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      // Fetch pending notifications first to get their IDs
      const pending = await LocalNotifications.getPending();
      const ids = pending.notifications.map((n) => ({ id: n.id }));
      if (ids.length > 0) {
        await LocalNotifications.cancel({ notifications: ids });
      }
    } catch (err) {
      console.error('[Notifications] Cancel all failed:', err);
    }
  }, [isCapacitor]);

  /**
   * Get all pending local notifications
   */
  const getPendingNotifications = useCallback(async () => {
    if (!isCapacitor) return [];

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (err) {
      console.error('[Notifications] Get pending failed:', err);
      return [];
    }
  }, [isCapacitor]);

  // Check initial permission state
  useEffect(() => {
    if (!isCapacitor && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  }, [isCapacitor]);

  return {
    requestPermission,
    register,
    unregister,
    clearPendingNotification,
    showLocalNotification,
    cancelNotification,
    cancelAllNotifications,
    getPendingNotifications,
    hasPermission,
    fcmToken,
    pendingNotification,
    isAvailable: isCapacitor || (typeof window !== 'undefined' && 'Notification' in window),
  };
}
