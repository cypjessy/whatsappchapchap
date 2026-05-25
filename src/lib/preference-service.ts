"use client";

import { useState, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";

export interface PreferenceOptions {
  key: string;
  value: string;
}

export class PreferenceService {
  /**
   * Set a preference value
   */
  static async set({ key, value }: PreferenceOptions): Promise<void> {
    try {
      await Preferences.set({ key, value });
      console.log(`[Preferences] Set ${key}:`, value);
    } catch (error) {
      console.error(`[Preferences] Error setting ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a preference value
   */
  static async get(key: string): Promise<string | null> {
    try {
      const result = await Preferences.get({ key });
      return result.value;
    } catch (error) {
      console.error(`[Preferences] Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove a preference
   */
  static async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key });
      console.log(`[Preferences] Removed ${key}`);
    } catch (error) {
      console.error(`[Preferences] Error removing ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all preferences
   */
  static async clear(): Promise<void> {
    try {
      await Preferences.clear();
      console.log("[Preferences] Cleared all preferences");
    } catch (error) {
      console.error("[Preferences] Error clearing preferences:", error);
      throw error;
    }
  }

  /**
   * Get all keys
   */
  static async keys(): Promise<string[]> {
    try {
      const result = await Preferences.keys();
      return result.keys;
    } catch (error) {
      console.error("[Preferences] Error getting keys:", error);
      return [];
    }
  }
}

/**
 * React hook for managing preferences with state
 */
export function usePreference(key: string, defaultValue: string = "") {
  const [value, setValue] = useState<string>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreference();
  }, [key]);

  const loadPreference = async () => {
    setLoading(true);
    const storedValue = await PreferenceService.get(key);
    setValue(storedValue || defaultValue);
    setLoading(false);
  };

  const updateValue = async (newValue: string) => {
    await PreferenceService.set({ key, value: newValue });
    setValue(newValue);
  };

  const removeValue = async () => {
    await PreferenceService.remove(key);
    setValue(defaultValue);
  };

  return {
    value,
    loading,
    setValue: updateValue,
    remove: removeValue,
    reload: loadPreference,
  };
}

// Common preference keys for the app
export const PREF_KEYS = {
  BIOMETRIC_ENABLED: "biometric_enabled",
  THEME_MODE: "theme_mode",
  LAST_LOGIN_METHOD: "last_login_method",
  USER_PREFERENCES: "user_preferences",
  APP_SETTINGS: "app_settings",
  CACHED_TOKEN: "cached_token",
  OFFLINE_DATA: "offline_data",
  BIOMETRIC_EMAIL: "biometric_email",
  BIOMETRIC_PASSWORD: "biometric_password",
} as const;
