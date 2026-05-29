"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ─── Types ─────────────────────────────────────────────────────────
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
  duration?: number;
}

interface ToastContextType {
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

// ─── Hook ──────────────────────────────────────────────────────────
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// ─── Provider Component ────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((newToast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = newToast.duration || 4000;

    setToasts((prev) => [...prev, { ...newToast, id }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Toast Container Component ─────────────────────────────────────
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── Toast Item Component ──────────────────────────────────────────
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const variantStyles = {
    default: "bg-white border-outline-variant text-on-surface",
    destructive: "bg-[#fef2f2] border-[#fecaca] text-[#dc2626]",
    success: "bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]",
  };

  const iconMap = {
    default: "fa-info-circle text-[#8b5cf6]",
    destructive: "fa-exclamation-circle text-[#ef4444]",
    success: "fa-check-circle text-[#10b981]",
  };

  const icon = iconMap[toast.variant || "default"];

  return (
    <div
      className={`
        pointer-events-auto
        ${variantStyles[toast.variant || "default"]}
        border rounded-xl shadow-lg p-4
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}
      `}
    >
      <div className="flex items-start gap-3">
        <i className={`fas ${icon} text-lg mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.description && (
            <p className="text-xs mt-1 opacity-80">{toast.description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
        >
          <i className="fas fa-times text-xs" />
        </button>
      </div>
    </div>
  );
}
