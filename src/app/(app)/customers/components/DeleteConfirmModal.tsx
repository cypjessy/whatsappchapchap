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
    <div className="flex items-center gap-3 p-3 bg-[var(--md-sys-color-surface)] rounded-lg border border-[var(--md-sys-color-outline-variant)] mb-4">
      <div className={`
        w-10 h-10 rounded-full bg-[var(--md-sys-color-error-container)]
        flex items-center justify-center font-medium text-sm text-[var(--md-sys-color-error)]
      `}>
        {customer.name?.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="min-w-0 text-left">
        <div className="font-medium text-sm truncate text-[var(--md-sys-color-on-surface)]">{customer.name}</div>
        <div className="text-xs text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1">
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
        md3-dialog-backdrop
        transition-opacity duration-250
        ${isVisible && !isClosing ? "opacity-100" : "opacity-0"}
      `}
      onClick={handleClose}
    >
      <div
        className={`
          md3-dialog w-full max-w-md overflow-hidden
          transition-all duration-300 ease-out
          ${isVisible && !isClosing
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
          }
          ${isShaking ? "animate-shake" : ""}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Warning header bar - MD3 */}
        <div className="h-1.5 bg-gradient-to-r from-[var(--md-sys-color-error)] via-[var(--md-sys-color-error-container)] to-[var(--md-sys-color-error)]" />

        <div className="p-5 md:p-6 text-center">
          {/* Warning icon with pulse - MD3 */}
          <div className="relative mx-auto mb-4 w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-[var(--md-sys-color-error)]/10 animate-ping" />
            <div className="relative w-16 h-16 bg-[var(--md-sys-color-error-container)] rounded-full flex items-center justify-center">
              <i className="fas fa-exclamation-triangle text-2xl md:text-3xl text-[var(--md-sys-color-error)]" />
            </div>
          </div>

          <h2 className="text-lg md:text-xl font-normal mb-2 text-[var(--md-sys-color-on-surface)]">
            Delete Customer?
          </h2>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-4 leading-relaxed">
            Are you sure you want to delete{" "}
            <span className="font-medium text-[var(--md-sys-color-on-surface)]">{customer.name}</span>?
            <br />
            <span className="text-[var(--md-sys-color-error)] font-medium">
              This action cannot be undone.
            </span>
          </p>

          {/* Customer preview */}
          <CustomerPreview customer={customer} />

          {/* Type to confirm - MD3 */}
          {requireTypeConfirm && (
            <div className="text-left space-y-2">
              <label className="text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                Type <span className="text-[var(--md-sys-color-error)] font-medium">"{expectedText}"</span> to confirm
                {countdown > 0 && (
                  <span className="ml-2 text-[var(--md-sys-color-warning)]">
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
                  w-full px-4 py-3 rounded-lg border-2 text-sm font-medium
                  focus:outline-none transition-all duration-200
                  ${confirmText.toLowerCase().trim() === expectedText.toLowerCase().trim()
                    ? "border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
                    : "border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:border-[var(--md-sys-color-error)]"
                  }
                  ${countdown > 0 ? "opacity-50 cursor-not-allowed" : ""}
                `}
              />
              {/* Progress indicator - MD3 */}
              <div className="h-1 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--md-sys-color-error)] rounded-full transition-all duration-1000"
                  style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Consequences list - MD3 */}
          <div className="mt-4 p-3 bg-[var(--md-sys-color-error-container)] rounded-lg border border-[var(--md-sys-color-error)]/20 text-left">
            <div className="text-xs font-medium text-[var(--md-sys-color-error)] uppercase tracking-wider mb-2">
              <i className="fas fa-info-circle mr-1" />
              This will permanently delete:
            </div>
            <ul className="space-y-1.5 text-xs text-[var(--md-sys-color-on-error-container)]">
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

        {/* Actions - MD3 Dialog Actions */}
        <div className="md3-dialog-actions">
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="md3-btn-text disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
            className={`
              md3-btn-filled disabled:opacity-50 flex items-center gap-2
              ${(canDelete && !isDeleting) ? '' : 'cursor-not-allowed'}
            `}
          >
            {isDeleting ? (
              <>
                <i className="fas fa-circle-notch fa-spin text-sm" />
                Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash text-sm" />
                Delete
                {requireTypeConfirm && countdown > 0 && (
                  <span className="text-[10px] opacity-80">
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