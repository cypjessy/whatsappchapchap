"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { AlertTriangle, X, Trash2, Loader2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  productName?: string;
  isLoading?: boolean;
  confirmText?: string; // Optional: require typing product name to confirm
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  productName,
  isLoading = false,
  confirmText,
}: DeleteConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const [typedConfirm, setTypedConfirm] = useState("");
  const [shake, setShake] = useState(false);

  const requiresTyping = !!confirmText;
  const canConfirm = !requiresTyping || typedConfirm === confirmText;

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Focus trap & initial focus
  useEffect(() => {
    if (isOpen) {
      setTypedConfirm("");
      const timer = setTimeout(() => cancelBtnRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
      if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
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
    },
    [isLoading, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  // Click outside to close
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className={`
          bg-white rounded-2xl w-full max-w-md shadow-2xl
          transform transition-all duration-300 ease-out
          animate-scaleIn
          ${shake ? "animate-shake" : ""}
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-[#64748b] hover:bg-[#f1f5f9] transition-all disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pt-8">
          {/* Icon with pulse effect */}
          <div className="text-center mb-6">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-20" />
              <div className="relative w-full h-full rounded-full bg-red-50 flex items-center justify-center border-2 border-red-100">
                <AlertTriangle className="w-7 h-7 text-red-500" strokeWidth={2.5} />
              </div>
            </div>

            <h3
              id="delete-modal-title"
              className="text-xl font-bold text-[#1e293b] mb-2 tracking-tight"
            >
              Delete Product?
            </h3>

            {productName && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] mb-3">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" />
                <span className="text-sm font-semibold text-[#1e293b]">{productName}</span>
              </div>
            )}

            <p id="delete-modal-desc" className="text-[#64748b] text-sm leading-relaxed">
              This action <span className="font-semibold text-red-500">cannot be undone</span>. The
              product and all associated data will be permanently removed from the system.
            </p>
          </div>

          {/* Type-to-confirm safety feature */}
          {requiresTyping && (
            <div className="mb-5">
              <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                Type <span className="text-[#1e293b] font-bold">{confirmText}</span> to confirm
              </label>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={`Type "${confirmText}" here...`}
                className={`
                  w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-red-500/20
                  ${typedConfirm === confirmText 
                    ? "border-red-500 bg-red-50/50 text-red-700" 
                    : "border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b] focus:border-red-300"
                  }
                `}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              ref={cancelBtnRef}
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] hover:bg-[#f0fdf4] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>

            <button
              ref={confirmBtnRef}
              onClick={handleConfirmClick}
              disabled={isLoading || !canConfirm}
              className={`
                flex-1 px-4 py-3 rounded-xl font-bold text-white transition-all active:scale-95
                flex items-center justify-center gap-2
                ${canConfirm && !isLoading
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
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
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>

          {/* Safety tip */}
          <p className="text-center text-[11px] text-[#94a3b8] mt-4 flex items-center justify-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#94a3b8]" />
            Press <kbd className="px-1.5 py-0.5 rounded bg-[#f1f5f9] border border-[#e2e8f0] text-[10px] font-mono">Esc</kbd> to cancel
          </p>
        </div>
      </div>
    </div>
  );
}