"use client";

import { useState, useEffect } from "react";
import { BiometricAuth, BiometryType } from "@aparajita/capacitor-biometric-auth";

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export function useBiometricAuth() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("none");
  const [isLoading, setIsLoading] = useState(false);

  // Check if biometric auth is available on device
  useEffect(() => {
    checkAvailability();
  }, []);

  const checkAvailability = async () => {
    try {
      const result = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      
      if (result.isAvailable) {
        // Convert BiometryType enum to readable string
        let typeStr = "none";
        switch (result.biometryType) {
          case BiometryType.touchId:
            typeStr = "fingerprint";
            break;
          case BiometryType.faceId:
            typeStr = "face";
            break;
          case BiometryType.fingerprintAuthentication:
            typeStr = "fingerprint";
            break;
          case BiometryType.faceAuthentication:
            typeStr = "face";
            break;
          case BiometryType.irisAuthentication:
            typeStr = "iris";
            break;
        }
        setBiometricType(typeStr);
        console.log("[BiometricAuth] Available:", typeStr);
      }
    } catch (error) {
      console.error("[BiometricAuth] Error checking availability:", error);
      setIsAvailable(false);
    }
  };

  const authenticate = async (reason?: string): Promise<BiometricAuthResult> => {
    if (!isAvailable) {
      return {
        success: false,
        error: "Biometric authentication not available on this device",
      };
    }

    setIsLoading(true);

    try {
      await BiometricAuth.authenticate({
        reason: reason || "Authenticate to continue",
      });

      setIsLoading(false);
      console.log("[BiometricAuth] Authentication successful");
      
      return {
        success: true,
        biometricType: biometricType,
      };
    } catch (error: any) {
      setIsLoading(false);
      console.error("[BiometricAuth] Authentication error:", error);
      
      return {
        success: false,
        error: error.message || "Authentication failed or cancelled",
      };
    }
  };

  const getBiometricLabel = (): string => {
    switch (biometricType) {
      case "fingerprint":
        return "Fingerprint";
      case "face":
        return "Face ID";
      case "iris":
        return "Iris Scan";
      default:
        return "Biometric";
    }
  };

  return {
    isAvailable,
    biometricType,
    isLoading,
    authenticate,
    getBiometricLabel,
    checkAvailability,
  };
}
