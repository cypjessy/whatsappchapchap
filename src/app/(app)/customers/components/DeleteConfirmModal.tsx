"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Customer } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  customer: Customer | null;
  onConfirm: () => void;
  onCancel: () => void;
  requireTypeConfirm?: boolean;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function CustomerPreview({ customer }: { customer: Customer }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] mb-4">
      <div className={`
        w-10 h-10 rounded-full bg-gradient-to-br from-[#ef4444]/10 to-[#ef4444]/5
        flex items-center justify-center font-bold text-sm text-[#ef4444]
      `}>
        {customer.name?.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="min-w-0 text-left">
        <div className="font-bold text-sm truncate">{customer.name}</div>
        <div className="text-xs text-[#64748b] flex items-center gap-1">
          <i className="fab fa-whatsapp text-[#25D366] text-[10px]" />
          {customer.phone}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeleteConfirmModal({
  customer,
  onConfirm,
  onCancel,
  requireTypeConfirm = false,
}: DeleteConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [canDelete, setCanDelete] = useState(!requireTypeConfirm);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animate in
  useEffect(() => {
    if (customer) {
      requestAnimationFrame(() => setIsVisible(true));
      setIsClosing(false);
      setConfirmText("");
      setIsDeleting(false);
      setCountdown(3);
      setCanDelete(!requireTypeConfirm);
    }
  }, [customer, requireTypeConfirm]);

  // Focus input when required
  useEffect(() => {
    if (requireTypeConfirm && customer && isVisible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [requireTypeConfirm, customer, isVisible]);

  // Countdown timer
  useEffect(() => {
    if (!requireTypeConfirm || !customer) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanDelete(true);
    }
  }, [countdown, requireTypeConfirm, customer]);

  // Check typed confirmation
  useEffect(() => {
    if (!requireTypeConfirm || !customer) return;
    setCanDelete(
      countdown === 0 &&
      confirmText.toLowerCase().trim() === customer.name?.toLowerCase().trim()
    );
  }, [confirmText, customer, countdown, requireTypeConfirm]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onCancel, 250);
  }, [onCancel]);

  const handleConfirm = useCallback(async () => {
    if (!canDelete) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setIsDeleting(true);
    // Small delay for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 400));
    onConfirm();
  }, [canDelete, onConfirm]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose, isDeleting]);

  if (!customer) return null;

  const expectedText = customer.name || "";

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-[#0f172a]/60 backdrop-blur-sm
        transition-opacity duration-250
        ${isVisible && !isClosing ? "opacity-100" : "opacity-0"}
      `}
      onClick={handleClose}
    >
      <div
        className={`
          bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden
          transition-all duration-300 ease-out
          ${isVisible && !isClosing
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
          }
          ${isShaking ? "animate-shake" : ""}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning header bar */}
        <div className="h-1.5 bg-gradient-to-r from-[#ef4444] via-[#f87171] to-[#ef4444]" />

        <div className="p-5 md:p-6 text-center">
          {/* Warning icon with pulse */}
          <div className="relative mx-auto mb-4 w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-[#ef4444]/10 animate-ping" />
            <div className="relative w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-2xl md:text-3xl text-[#ef4444]" />
            </div>
          </div>

          <h2 className="text-lg md:text-xl font-extrabold mb-2 text-[#1e293b]">
            Delete Customer?
          </h2>
          <p className="text-sm text-[#64748b] mb-4 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-bold text-[#1e293b]">{customer.name}</span>?
            <br />
            <span className="text-[#ef4444] font-semibold">
              This action cannot be undone.
            </span>
          </p>

          {/* Customer preview */}
          <CustomerPreview customer={customer} />

          {/* Type to confirm */}
          {requireTypeConfirm && (
            <div className="text-left space-y-2">
              <label className="text-xs font-bold text-[#64748b] uppercase tracking-wider">
                Type <span className="text-[#ef4444] font-extrabold">"{expectedText}"</span> to confirm
                {countdown > 0 && (
                  <span className="ml-2 text-[#f59e0b]">
                    ({countdown}s)
                  </span>
                )}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
                placeholder={`Type "${expectedText}"...`}
                disabled={countdown > 0 || isDeleting}
                className={`
                  w-full px-4 py-3 rounded-xl border-2 text-sm font-medium
                  focus:outline-none transition-all duration-200
                  ${confirmText.toLowerCase().trim() === expectedText.toLowerCase().trim()
                    ? "border-[#10b981] bg-[#10b981]/5 text-[#10b981]"
                    : "border-[#e2e8f0] bg-[#f8fafc] text-[#1e293b] focus:border-[#ef4444]"
                  }
                  ${countdown > 0 ? "opacity-50 cursor-not-allowed" : ""}
                `}
              />
              {/* Progress indicator */}
              <div className="h-1 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ef4444] rounded-full transition-all duration-1000"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Consequences list */}
          <div className="mt-4 p-3 bg-[#fef2f2] rounded-xl border border-[#fecaca] text-left">
            <div className="text-xs font-bold text-[#ef4444] uppercase tracking-wider mb-2">
              <i className="fas fa-info-circle mr-1" />
              This will permanently delete:
            </div>
            <ul className="space-y-1.5 text-xs text-[#991b1b]">
              <li className="flex items-center gap-2">
                <i className="fas fa-times-circle text-[10px] shrink-0" />
                Customer profile and contact information
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-times-circle text-[10px] shrink-0" />
                All associated order history
              </li>
              <li className="flex items-center gap-2">
                <i className="fas fa-times-circle text-[10px] shrink-0" />
                Notes, tags, and preferences
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 md:p-6 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end gap-2.5 md:gap-3">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className={`
              px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm
              bg-white border-2 border-[#e2e8f0] text-[#64748b]
              hover:border-[#64748b] hover:text-[#1e293b]
              transition-all duration-200 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            className={`
              relative px-4 md:px-5 py-2.5 rounded-xl font-semibold text-sm
              transition-all duration-200 active:scale-95
              flex items-center gap-2 overflow-hidden
              ${canDelete && !isDeleting
                ? "bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/25 hover:shadow-xl hover:shadow-[#ef4444]/30 hover:-translate-y-0.5"
                : "bg-[#ef4444]/40 text-white/70 cursor-not-allowed"
              }
            `}
          >
            {isDeleting ? (
              <>
                <i className="fas fa-circle-notch fa-spin text-xs" />
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash text-xs" />
                Delete
                {requireTypeConfirm && countdown > 0 && (
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md">
                    {countdown}s
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}