"use client";

import { useState, useEffect } from "react";
import { Device } from "@capacitor/device";

export interface DeviceInfo {
  model: string;
  platform: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
}

export class DeviceService {
  private static deviceInfo: DeviceInfo | null = null;

  /**
   * Get complete device information
   */
  static async getInfo(): Promise<DeviceInfo> {
    try {
      if (this.deviceInfo) {
        return this.deviceInfo;
      }

      const info = await Device.getInfo();
      const battery = await this.getBatteryInfo();

      this.deviceInfo = {
        model: info.model || "Unknown",
        platform: info.platform || "web",
        osVersion: info.osVersion || "Unknown",
        manufacturer: info.manufacturer || "Unknown",
        isVirtual: info.isVirtual || false,
        batteryLevel: battery.batteryLevel,
        isCharging: battery.isCharging,
      };

      console.log("[Device] Info:", this.deviceInfo);
      return this.deviceInfo;
    } catch (error) {
      console.error("[Device] Error getting info:", error);
      throw error;
    }
  }

  /**
   * Get battery information
   */
  static async getBatteryInfo(): Promise<{ batteryLevel?: number; isCharging?: boolean }> {
    try {
      const battery = await Device.getBatteryInfo();
      return {
        batteryLevel: battery.batteryLevel,
        isCharging: battery.isCharging,
      };
    } catch (error) {
      console.error("[Device] Error getting battery info:", error);
      return {};
    }
  }

  /**
   * Check if device is in low power mode (battery < 20%)
   */
  static async isLowPowerMode(): Promise<boolean> {
    const battery = await this.getBatteryInfo();
    return (battery.batteryLevel ?? 100) < 20;
  }

  /**
   * Get language code
   */
  static async getLanguageCode(): Promise<string> {
    try {
      const result = await Device.getLanguageCode();
      return result.value;
    } catch (error) {
      console.error("[Device] Error getting language code:", error);
      return "en";
    }
  }

  /**
   * Check if running on mobile device
   */
  static async isMobile(): Promise<boolean> {
    const info = await this.getInfo();
    return info.platform === "android" || info.platform === "ios";
  }

  /**
   * Check if device is charging
   */
  static async isCharging(): Promise<boolean> {
    const battery = await this.getBatteryInfo();
    return battery.isCharging ?? false;
  }

  /**
   * Get performance recommendations based on device state
   */
  static async getPerformanceRecommendations(): Promise<{
    reduceAnimations: boolean;
    enableLazyLoading: boolean;
    reduceImageQuality: boolean;
    reason: string;
  }> {
    const [lowPower, charging, info] = await Promise.all([
      this.isLowPowerMode(),
      this.isCharging(),
      this.getInfo(),
    ]);

    // Reduce animations and quality when on low battery and not charging
    const shouldOptimize = lowPower && !charging;

    return {
      reduceAnimations: shouldOptimize,
      enableLazyLoading: true, // Always enable for better performance
      reduceImageQuality: shouldOptimize,
      reason: shouldOptimize
        ? `Low battery (${info.batteryLevel}%) - optimizing for power saving`
        : "Normal operation",
    };
  }
}

/**
 * React hook for device information
 */
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | undefined>(undefined);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeviceInfo();
  }, []);

  const loadDeviceInfo = async () => {
    setLoading(true);
    try {
      const info = await DeviceService.getInfo();
      setDeviceInfo(info);
      setBatteryLevel(info.batteryLevel);
      setIsCharging(info.isCharging ?? false);
    } catch (error) {
      console.error("[useDeviceInfo] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshBattery = async () => {
    const battery = await DeviceService.getBatteryInfo();
    setBatteryLevel(battery.batteryLevel);
    setIsCharging(battery.isCharging ?? false);
  };

  return {
    deviceInfo,
    batteryLevel,
    isCharging,
    loading,
    refresh: loadDeviceInfo,
    refreshBattery,
  };
}
