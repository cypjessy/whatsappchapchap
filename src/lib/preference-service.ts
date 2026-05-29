"use client";

import { useState, useEffect } from "react";

// ─── Storage Adapter ──────────────────────────────────────────────────────────
// Try Capacitor Preferences first, fall back to localStorage for WebView/Capacitor
// environments where the native plugin may not be properly synced.

let capacitorModule: typeof import("@capacitor/preferences") | null = null;
let capacitorLoadAttempted = false;

async function getCapacitorModule() {
  if (!capacitorLoadAttempted) {
    capacitorLoadAttempted = true;
    try {
      capacitorModule = await import("@capacitor/preferences");
    } catch {
      console.warn("[Preferences] @capacitor/preferences not available, using localStorage fallback");
    }
  }
  return capacitorModule;
}

function hasCapacitorEnvironment(): boolean {
  return typeof window !== "undefined" && (
    (window as any).Capacitor !== undefined ||
    (window as any).CapacitorPlatforms !== undefined
  );
}

export interface PreferenceOptions {
  key: string;
  value: string;
}

export class PreferenceService {
  /**
   * Set a preference value — uses Capacitor Preferences in native, localStorage fallback otherwise
   */
  static async set({ key, value }: PreferenceOptions): Promise<void> {
    try {
      const cap = await getCapacitorModule();
      if (cap) {
        await cap.Preferences.set({ key, value });
      } else {
        localStorage.setItem(key, value);
      }
      console.log(`[Preferences] Set ${key}:`, value);
    } catch (error) {
      // Final fallback
      console.warn(`[Preferences] Capacitor set failed for ${key}, using localStorage:`, error);
      localStorage.setItem(key, value);
    }
  }

  /**
   * Get a preference value
   */
  static async get(key: string): Promise<string | null> {
    try {
      const cap = await getCapacitorModule();
      if (cap) {
        const result = await cap.Preferences.get({ key });
        if (result.value !== null && result.value !== undefined) {
          return result.value;
        }
        // Fallback: check localStorage in case it was saved there
        return localStorage.getItem(key);
      }
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`[Preferences] Capacitor get failed for ${key}, using localStorage:`, error);
      return localStorage.getItem(key);
    }
  }

  /**
   * Remove a preference
   */
  static async remove(key: string): Promise<void> {
    try {
      const cap = await getCapacitorModule();
      if (cap) {
        await cap.Preferences.remove({ key });
      }
      localStorage.removeItem(key);
      console.log(`[Preferences] Removed ${key}`);
    } catch (error) {
      console.warn(`[Preferences] remove failed for ${key}:`, error);
      localStorage.removeItem(key);
    }
  }

  /**
   * Clear all preferences
   */
  static async clear(): Promise<void> {
    try {
      const cap = await getCapacitorModule();
      if (cap) {
        await cap.Preferences.clear();
      }
      localStorage.clear();
      console.log("[Preferences] Cleared all preferences");
    } catch (error) {
      console.warn("[Preferences] clear failed:", error);
      localStorage.clear();
    }
  }

  /**
   * Get all keys
   */
  static async keys(): Promise<string[]> {
    const keys = new Set<string>();
    try {
      const cap = await getCapacitorModule();
      if (cap) {
        const result = await cap.Preferences.keys();
        result.keys.forEach((k) => keys.add(k));
      }
    } catch {
      // ignore
    }
    // Also gather localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.add(k);
    }
    return Array.from(keys);
  }

  /**
   * Returns true if the storage backend is operational
   */
  static async healthCheck(): Promise<boolean> {
    const testKey = "__health_check__";
    try {
      await this.set({ key: testKey, value: "ok" });
      const val = await this.get(testKey);
      await this.remove(testKey);
      return val === "ok";
    } catch {
      return false;
    }
  }

  /**
   * Migrates all keys from Capacitor Preferences to localStorage (or vice versa)
   * to ensure data is not lost when switching between storage backends.
   */
  static async migrateToLocalStorage(): Promise<void> {
    try {
      const cap = await getCapacitorModule();
      if (!cap) return;
      const { keys } = await cap.Preferences.keys();
      for (const key of keys) {
        const result = await cap.Preferences.get({ key });
        if (result.value !== null && result.value !== undefined) {
          localStorage.setItem(key, result.value);
        }
      }
      console.log(`[Preferences] Migrated ${keys.length} keys to localStorage`);
    } catch (error) {
      console.warn("[Preferences] Migration failed:", error);
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
