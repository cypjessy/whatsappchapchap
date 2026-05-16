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
            typeStr = "touchId";
            break;
          case BiometryType.faceId:
            typeStr = "faceId";
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

      console.log("[BiometricAuth] Authentication successful");
      return {
        success: true,
        biometricType,
      };
    } catch (error: any) {
      console.error("[BiometricAuth] Authentication failed:", error);
      
      let errorMessage = "Authentication failed";
      if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getBiometricIcon = (): string => {
    switch (biometricType) {
      case "fingerprint":
        return "fas fa-fingerprint";
      case "face":
      case "faceId":
        return "fas fa-face-viewfinder";
      case "touchId":
        return "fas fa-fingerprint";
      case "iris":
        return "fas fa-eye";
      default:
        return "fas fa-shield-halved";
    }
  };

  const getBiometricLabel = (): string => {
    switch (biometricType) {
      case "fingerprint":
        return "Use Fingerprint";
      case "face":
      case "faceId":
        return "Use Face ID";
      case "touchId":
        return "Use Touch ID";
      case "iris":
        return "Use Iris Scan";
      default:
        return "Use Biometrics";
    }
  };

  return {
    isAvailable,
    biometricType,
    isLoading,
    authenticate,
    getBiometricIcon,
    getBiometricLabel,
    refresh: checkAvailability,
  };
}
