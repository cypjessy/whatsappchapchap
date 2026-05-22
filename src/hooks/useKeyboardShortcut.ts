"use client";

import { useEffect } from "react";

type Handler = (e: KeyboardEvent) => void;

export function useKeyboardShortcut(key: string, handler: Handler, deps: any[] = []) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle keyboard shortcuts like cmd+k, cmd+n, cmd+r, esc
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmd = isMac ? e.metaKey : e.ctrlKey;

      if (key === "esc" && e.key === "Escape") {
        handler(e);
        return;
      }

      if (key.startsWith("cmd+") && isCmd) {
        const shortcutKey = key.split("+")[1];
        if (e.key === shortcutKey) {
          e.preventDefault();
          handler(e);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, deps);
}
