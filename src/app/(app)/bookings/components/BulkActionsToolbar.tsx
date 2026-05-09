"use client";

import { useState, useEffect, useCallback } from "react";
import { Booking } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BulkActionsToolbarProps {
  bulkSelected: string[];
  filteredBookingsCount: number;
  onBulkStatusUpdate: (status: Booking["status"]) => void;
  onBulkDelete: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
}

interface ActionButton {
  label: string;
  icon: string;
  status?: Booking["status"];
  variant: "default" | "danger" | "ghost";
  onClick?: () => void;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_ACTIONS: ActionButton[] = [
  { label: "Confirm", icon: "fa-check-circle", status: "confirmed", variant: "default" },
  { label: "Complete", icon: "fa-check-double", status: "completed", variant: "default" },
  { label: "Pending", icon: "fa-clock", status: "pending", variant: "default" },
  { label: "Cancel", icon: "fa-times-circle", status: "cancelled", variant: "default" },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function DeleteConfirmDialog({
  isOpen,
  count,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scaleIn">
        <div className="w-14 h-14 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-[#ef4444] text-xl" />
        </div>
        <h3 className="text-lg font-bold text-center text-[#1e293b] mb-2">Delete Bookings?</h3>
        <p className="text-sm text-[#64748b] text-center mb-6">
          Are you sure you want to delete <span className="font-bold text-[#ef4444]">{count}</span> selected booking{count !== 1 ? "s" : ""}? This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border-2 border-[#e2e8f0] text-[#64748b] font-semibold text-sm hover:bg-[#f8fafc] transition-all active:scale-95"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[#ef4444] text-white font-semibold text-sm hover:bg-[#dc2626] transition-all active:scale-95 shadow-lg shadow-[#ef4444]/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  action,
  onClick,
  disabled,
}: {
  action: ActionButton;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const variants = {
    default: isHovered
      ? "bg-white text-[#8b5cf6] shadow-lg shadow-white/20"
      : "bg-white/15 text-white hover:bg-white/25",
    danger: isHovered
      ? "bg-[#dc2626] text-white shadow-lg shadow-[#ef4444]/30"
      : "bg-[#ef4444]/80 text-white hover:bg-[#ef4444]",
    ghost: isHovered
      ? "bg-white/30 text-white"
      : "bg-white/10 text-white/80 hover:bg-white/20",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      className={`
        relative flex items-center gap-1.5 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl
        text-xs md:text-sm font-semibold transition-all duration-200
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[action.variant]}
        ${isPressed ? "scale-95" : "scale-100"}
      `}
    >
      <i className={`fas ${action.icon} text-[10px] md:text-xs`} />
      <span className="hidden sm:inline">{action.label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BulkActionsToolbar({
  bulkSelected,
  filteredBookingsCount,
  onBulkStatusUpdate,
  onBulkDelete,
  onSelectAll,
  onCancel,
}: BulkActionsToolbarProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Entrance animation
  useEffect(() => {
    if (bulkSelected.length > 0) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
    setIsVisible(false);
  }, [bulkSelected.length]);

  // Keyboard shortcut: Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && bulkSelected.length > 0) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [bulkSelected.length, onCancel]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    setIsProcessing(true);
    setShowDeleteConfirm(false);
    // Small delay to show processing state
    setTimeout(() => {
      onBulkDelete();
      setIsProcessing(false);
    }, 300);
  }, [onBulkDelete]);

  const handleStatusUpdate = useCallback((status: Booking["status"]) => {
    setIsProcessing(true);
    setTimeout(() => {
      onBulkStatusUpdate(status);
      setIsProcessing(false);
    }, 200);
  }, [onBulkStatusUpdate]);

  if (bulkSelected.length === 0) return null;

  const allSelected = bulkSelected.length === filteredBookingsCount;
  const progressPercent = filteredBookingsCount > 0
    ? Math.round((bulkSelected.length / filteredBookingsCount) * 100)
    : 0;

  return (
    <>
      <div
        className={`
          relative overflow-hidden rounded-xl md:rounded-2xl p-3 md:p-4 mb-6
          bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]
          shadow-lg shadow-[#8b5cf6]/20
          transition-all duration-500 ease-out
          ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}
        `}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/10 blur-xl" />
        </div>

        {/* Progress bar at top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-white/10">
          <div
            className="h-full bg-white/40 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 md:gap-4">
          {/* Left: Selection info */}
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`
              w-9 h-9 md:w-10 md:h-10 rounded-xl bg-white/15 flex items-center justify-center
              transition-transform duration-300
              ${isVisible ? "scale-100" : "scale-75"}
            `}>
              <i className="fas fa-layer-group text-white text-sm" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm md:text-base">
                  {bulkSelected.length} selected
                </span>
                {isProcessing && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
              </div>
              <button
                onClick={onSelectAll}
                className="text-[11px] md:text-xs text-white/70 hover:text-white underline underline-offset-2 transition-colors"
              >
                {allSelected ? "Deselect all" : `Select all ${filteredBookingsCount}`}
              </button>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
            {STATUS_ACTIONS.map((action) => (
              <ActionBtn
                key={action.label}
                action={action}
                onClick={() => action.status && handleStatusUpdate(action.status)}
                disabled={isProcessing}
              />
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-white/20 mx-0.5 hidden sm:block" />

            {/* Delete */}
            <ActionBtn
              action={{ label: "Delete", icon: "fa-trash-alt", variant: "danger" }}
              onClick={handleDelete}
              disabled={isProcessing}
            />

            {/* Cancel */}
            <ActionBtn
              action={{ label: "Close", icon: "fa-times", variant: "ghost" }}
              onClick={onCancel}
              disabled={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        count={bulkSelected.length}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}