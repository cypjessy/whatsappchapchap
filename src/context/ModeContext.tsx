"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type AppMode = "product" | "service";

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
}

const defaultValue: ModeContextType = {
  mode: "product",
  setMode: () => {},
  toggleMode: () => {},
};

const ModeContext = createContext<ModeContextType>(defaultValue);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("product");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("app-mode") as AppMode;
    if (saved && (saved === "product" || saved === "service")) {
      setModeState(saved);
    }
    setMounted(true);
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("app-mode", newMode);
    }
  };

  const toggleMode = () => {
    const newMode = mode === "product" ? "service" : "product";
    setMode(newMode);
  };

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}