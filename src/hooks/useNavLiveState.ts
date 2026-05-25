"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Live state hook for navigation elements.
 * Prevents "unpressable button" syndrome after app idle by:
 * 1. Periodic health-check re-renders (keeps React fiber alive)
 * 2. App resume / visibility wake-up signals
 * 3. Forced state refresh on any pointer interaction
 * 4. Session-storage backed activity tracking
 */
export function useNavLiveState() {
  const [healthTick, setHealthTick] = useState(0);
  const isLiveRef = useRef(true);
  const wakeCountRef = useRef(0);

  // ── Periodic health-check re-render ──────────────────────────────────
  // Prevents the React fiber from going stale during long idle periods
  useEffect(() => {
    const interval = setInterval(() => {
      // Only bump health tick if we think we're live
      if (isLiveRef.current) {
        setHealthTick((t) => t + 1);
      }
    }, 8_000); // Every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // ── App resume wake-up ───────────────────────────────────────────────
  useEffect(() => {
    const wake = () => {
      isLiveRef.current = true;
      wakeCountRef.current += 1;
      setHealthTick((t) => t + 1); // Force immediate re-render
    };

    const sleep = () => {
      // Mark as potentially stale so next interaction wakes fully
      isLiveRef.current = false;
    };

    window.addEventListener("appresumed", wake);
    window.addEventListener("focus", wake);
    window.addEventListener("pageshow", wake);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        wake();
      } else {
        sleep();
      }
    });

    return () => {
      window.removeEventListener("appresumed", wake);
      window.removeEventListener("focus", wake);
      window.removeEventListener("pageshow", wake);
    };
  }, []);

  // ── Wake on any pointer activity ─────────────────────────────────────
  // Using capture phase to fire BEFORE component-level handlers
  useEffect(() => {
    const wakeOnInteraction = () => {
      if (!isLiveRef.current) {
        isLiveRef.current = true;
        setHealthTick((t) => t + 1);
      }
      sessionStorage.setItem("lastActiveTime", Date.now().toString());
    };

    document.addEventListener("pointerdown", wakeOnInteraction, {
      capture: true,
      passive: true,
    });
    document.addEventListener("touchstart", wakeOnInteraction, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("pointerdown", wakeOnInteraction, {
        capture: true,
      } as any);
      document.removeEventListener("touchstart", wakeOnInteraction, {
        capture: true,
      } as any);
    };
  }, []);

  // ── Public API ───────────────────────────────────────────────────────

  /** Wake the component immediately (call from onPointerDown/onClick) */
  const wake = useCallback(() => {
    isLiveRef.current = true;
    sessionStorage.setItem("lastActiveTime", Date.now().toString());
  }, []);

  return {
    /** Increments periodically — include in component deps to force re-render */
    healthTick,
    /** Call from pointer event handlers to ensure responsive state */
    wake,
    /** True if the component believes it's in a live state */
    getIsLive: () => isLiveRef.current,
    /** Number of wake cycles (useful for debugging) */
    wakeCount: wakeCountRef.current,
  };
}
