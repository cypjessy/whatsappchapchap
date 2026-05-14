"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AlertTriangle, X, Trash2, Loader2, ShieldAlert } from "lucide-react";
import "./delete-confirm-modal.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName?: string;
  isLoading?: boolean;
  confirmText?: string;
  itemCount?: number;
  itemType?: "product" | "booking" | "order" | "service";
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ITEM_TYPE_CONFIG: Record<string, { label: string; icon: string }> = {
  product: { label: "Product", icon: "fa-box" },
  booking: { label: "Booking", icon: "fa-calendar" },
  order: { label: "Order", icon: "fa-shopping-cart" },
  service: { label: "Service", icon: "fa-concierge-bell" },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ProgressBar({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;
  return (
    <div className="absolute top-0 left-0 right-0 h-1 bg-red-100 overflow-hidden rounded-t-2xl">
      <div className="h-full bg-gradient-to-r from-red-400 to-red-600 animate-progress rounded-full" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isLoading = false,
  confirmText,
  itemCount = 1,
  itemType = "product",
}: DeleteConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [typedConfirm, setTypedConfirm] = useState("");
  const [shake, setShake] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const requiresTyping = !!confirmText;
  const canConfirm = !requiresTyping || typedConfirm === confirmText;
  const isPlural = itemCount > 1;
  const typeConfig = ITEM_TYPE_CONFIG[itemType] || ITEM_TYPE_CONFIG.product;

  // Entrance animation
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPadding = document.body.style.paddingRight;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPadding;
      };
    }
  }, [isOpen]);

  // Reset state & focus
  useEffect(() => {
    if (isOpen) {
      setTypedConfirm("");
      setShake(false);
      const timer = setTimeout(() => {
        if (requiresTyping) {
          inputRef.current?.focus();
        } else {
          cancelBtnRef.current?.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, requiresTyping]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        e.preventDefault();
        onClose();
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute("disabled"));

        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      // Enter to confirm when valid
      if (e.key === "Enter" && canConfirm && !isLoading) {
        e.preventDefault();
        onConfirm();
      }
    },
    [isLoading, onClose, canConfirm, onConfirm]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Click outside
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !isLoading) {
      onClose();
    }
  };

  // Shake animation for invalid confirm
  const handleConfirmClick = () => {
    if (!canConfirm) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        transition-all duration-300
        ${isVisible ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"}
      `}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className={`
          relative bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}
          ${shake ? "animate-shake" : ""}
        `}
      >
        <ProgressBar isLoading={isLoading} />

        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-[#64748b] hover:bg-[#f1f5f9] transition-all disabled:opacity-50 z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-8">
          {/* Icon with effects */}
          <div className="text-center mb-6">
            <div className="relative w-16 h-16 mx-auto mb-4">
              {/* Pulse ring */}
              {!isLoading && (
                <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-20" />
              )}
              {/* Rotating ring when loading */}
              {isLoading && (
                <div className="absolute -inset-1 rounded-full border-2 border-red-200 border-t-red-500 animate-spin" />
              )}
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center border-2 border-red-200 shadow-sm">
                {isLoading ? (
                  <Loader2 className="w-7 h-7 text-red-500 animate-spin" strokeWidth={2.5} />
                ) : (
                  <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={2.5} />
                )}
              </div>
            </div>

            <h3
              id="delete-modal-title"
              className="text-xl font-bold text-[#1e293b] mb-2 tracking-tight"
            >
              Delete {isPlural ? `${itemCount} ` : ""}
              {typeConfig.label}
              {isPlural ? "s" : ""}?
            </h3>

            {productName && !isPlural && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#e2e8f0] mb-3">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                <span className="text-sm font-semibold text-[#1e293b] truncate max-w-[200px]">
                  {productName}
                </span>
              </div>
            )}

            <p id="delete-modal-desc" className="text-[#64748b] text-sm leading-relaxed">
              This action{" "}
              <span className="font-semibold text-red-500">cannot be undone</span>.{" "}
              {isPlural
                ? `All ${itemCount} ${typeConfig.label.toLowerCase()}s and their associated data will be permanently removed.`
                : `The ${typeConfig.label.toLowerCase()} and all associated data will be permanently removed from the system.`}
            </p>
          </div>

          {/* Type-to-confirm safety feature */}
          {requiresTyping && (
            <div className="mb-5 space-y-2">
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider">
                Type{" "}
                <span className="text-[#1e293b] font-bold font-mono bg-[#f1f5f9] px-1.5 py-0.5 rounded">
                  {confirmText}
                </span>{" "}
                to confirm
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={typedConfirm}
                  onChange={(e) => setTypedConfirm(e.target.value)}
                  placeholder={`Type "${confirmText}" here...`}
                  disabled={isLoading}
                  className={`
                    w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                    focus:outline-none focus:ring-4 focus:ring-red-500/10
                    disabled:opacity-50
                    ${typedConfirm === confirmText
                      ? "border-red-500 bg-red-50/50 text-red-700 shadow-sm shadow-red-500/10"
                      : typedConfirm.length > 0
                        ? "border-red-300 bg-white text-[#1e293b]"
                        : "border-[#e2e8f0] bg-white text-[#1e293b] focus:border-red-300"
                    }
                  `}
                />
                {typedConfirm === confirmText && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <i className="fas fa-check text-[10px]" />
                    </div>
                  </div>
                )}
              </div>
              {typedConfirm.length > 0 && typedConfirm !== confirmText && (
                <p className="text-[11px] text-red-500 font-medium flex items-center gap-1 animate-fadeIn">
                  <i className="fas fa-exclamation-circle text-[10px]" />
                  Text doesn't match. Please type exactly: {confirmText}
                </p>
              )}
            </div>
          )}

          {/* Warning items list for bulk delete */}
          {isPlural && !requiresTyping && (
            <div className="mb-5 p-3 bg-red-50/50 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  Bulk Delete Warning
                </span>
              </div>
              <p className="text-xs text-red-600/80">
                You are about to delete {itemCount} items. This is a destructive action that cannot be reversed.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              ref={cancelBtnRef}
              onClick={onClose}
              disabled={isLoading}
              className={`
                flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all
                border-2 border-[#e2e8f0] text-[#64748b]
                hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:bg-[#f5f3ff]
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Cancel
            </button>

            <button
              ref={confirmBtnRef}
              onClick={handleConfirmClick}
              disabled={isLoading || !canConfirm}
              className={`
                flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all
                flex items-center justify-center gap-2
                active:scale-95
                ${canConfirm && !isLoading
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                  : "bg-red-300 cursor-not-allowed"
                }
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete {isPlural ? `(${itemCount})` : ""}</span>
                </>
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-[11px] text-[#94a3b8] mt-4 flex items-center justify-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-[#94a3b8]" />
            Press
            <kbd className="px-1.5 py-0.5 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] text-[10px] font-mono font-bold">
              Esc
            </kbd>
            to cancel
            {canConfirm && !isLoading && (
              <>
                <span className="mx-1">•</span>
                <kbd className="px-1.5 py-0.5 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] text-[10px] font-mono font-bold">
                  Enter
                </kbd>
                to confirm
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}