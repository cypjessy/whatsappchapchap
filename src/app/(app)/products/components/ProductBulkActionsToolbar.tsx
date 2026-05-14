"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  CheckSquare,
  Square,
  MinusSquare,
  Play,
  Pause,
  FileText,
  Trash2,
  X,
  ChevronDown,
  AlertTriangle,
  Loader2,
  Layers,
} from "lucide-react";
import "./product-bulk-actions-toolbar.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductBulkActionsToolbarProps {
  bulkSelected: string[];
  filteredProductsCount: number;
  onBulkStatusUpdate: (status: "active" | "paused" | "draft") => void;
  onBulkDelete: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

type ProductStatus = "active" | "paused" | "draft";

interface StatusOption {
  value: ProductStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  hoverBg: string;
  hoverText: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_OPTIONS: StatusOption[] = [
  {
    value: "active",
    label: "Activate",
    description: "Make visible to customers",
    icon: <Play className="w-4 h-4 text-[#10b981]" fill="currentColor" />,
    iconBg: "bg-[#10b981]/10",
    hoverBg: "hover:bg-[#f0fdf4]",
    hoverText: "hover:text-[#059669]",
  },
  {
    value: "paused",
    label: "Pause",
    description: "Temporarily hide from store",
    icon: <Pause className="w-4 h-4 text-[#f59e0b]" fill="currentColor" />,
    iconBg: "bg-[#f59e0b]/10",
    hoverBg: "hover:bg-[#fffbeb]",
    hoverText: "hover:text-[#d97706]",
  },
  {
    value: "draft",
    label: "Draft",
    description: "Move to drafts folder",
    icon: <FileText className="w-4 h-4 text-[#64748b]" />,
    iconBg: "bg-[#f1f5f9]",
    hoverBg: "hover:bg-white",
    hoverText: "hover:text-[#475569]",
  },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SelectionBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-[#10b981] text-white text-[10px] font-bold shadow-sm shadow-[#10b981]/20 animate-scaleIn">
      {count}
    </span>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  return (
    <div className="sm:hidden flex-1 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] rounded-full transition-all duration-500 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function StatusDropdown({
  isOpen,
  onClose,
  onSelect,
  disabled,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (status: ProductStatus) => void;
  disabled: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl shadow-black/10 border border-[#e2e8f0] overflow-hidden z-50 animate-scaleIn origin-top-right"
    >
      <div className="p-1.5 space-y-0.5">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onSelect(option.value);
              onClose();
            }}
            disabled={disabled}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-[#1e293b] transition-all duration-200
              ${option.hoverBg} ${option.hoverText}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <div className={`w-9 h-9 rounded-lg ${option.iconBg} flex items-center justify-center shrink-0`}>
              {option.icon}
            </div>
            <div className="text-left">
              <div className="font-semibold">{option.label}</div>
              <div className="text-[10px] text-[#94a3b8]">{option.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmationBanner({
  status,
  count,
  onConfirm,
  onCancel,
}: {
  status: ProductStatus;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const config = STATUS_OPTIONS.find((o) => o.value === status);

  return (
    <div
      className={`
        mb-4 p-4 md:p-5 rounded-xl border-2 transition-all duration-300
        ${status === "paused" ? "bg-[#fffbeb] border-[#f59e0b]/20" : "bg-white border-[#e2e8f0]"}
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`
          w-10 h-10 rounded-full flex items-center justify-center shrink-0
          ${status === "paused" ? "bg-[#f59e0b]/10" : "bg-[#e2e8f0]"}
        `}>
          <AlertTriangle className={`w-5 h-5 ${status === "paused" ? "text-[#f59e0b]" : "text-[#64748b]"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-[#1e293b] mb-1">
            Change status to {status}?
          </h4>
          <p className="text-xs text-[#64748b] mb-3">
            This will affect <span className="font-bold text-[#1e293b]">{count}</span> selected {count === 1 ? "product" : "products"}.
            {config && (
              <span className="block mt-0.5 text-[#94a3b8]">{config.description}</span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onConfirm}
              className={`
                px-4 py-2 rounded-lg text-sm font-bold text-white transition-all active:scale-95
                ${status === "paused"
                  ? "bg-[#f59e0b] hover:bg-[#d97706] shadow-md shadow-[#f59e0b]/20"
                  : "bg-[#64748b] hover:bg-[#475569] shadow-md shadow-[#64748b]/20"
                }
              `}
            >
              Confirm
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-white border-2 border-[#e2e8f0] text-[#64748b] rounded-lg text-sm font-bold hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductBulkActionsToolbar({
  bulkSelected,
  filteredProductsCount,
  onBulkStatusUpdate,
  onBulkDelete,
  onSelectAll,
  onCancel,
  isLoading = false,
}: ProductBulkActionsToolbarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProductStatus | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const selectedCount = bulkSelected.length;
  const isAllSelected = selectedCount === filteredProductsCount && filteredProductsCount > 0;
  const isPartialSelected = selectedCount > 0 && !isAllSelected;
  const hasSelection = selectedCount > 0;

  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

  const handleStatusClick = useCallback((status: ProductStatus) => {
    if (status === "paused" || status === "draft") {
      setPendingStatus(status);
      setShowStatusMenu(false);
      setTimeout(() => setShowConfirm(true), 100);
    } else {
      onBulkStatusUpdate(status);
      setShowStatusMenu(false);
    }
  }, [onBulkStatusUpdate]);

  const confirmStatusChange = useCallback(() => {
    if (pendingStatus) {
      onBulkStatusUpdate(pendingStatus);
      setPendingStatus(null);
      setShowConfirm(false);
    }
  }, [pendingStatus, onBulkStatusUpdate]);

  const cancelConfirmation = useCallback(() => {
    setShowConfirm(false);
    setPendingStatus(null);
  }, []);

  // Close status menu when selection changes to empty
  useEffect(() => {
    if (!hasSelection) {
      setShowStatusMenu(false);
      setShowConfirm(false);
    }
  }, [hasSelection]);

  if (!hasSelection && !showConfirm) return null;

  return (
    <>
      <div
        className={`
          relative mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between 
          gap-3 sm:gap-0 p-3 sm:p-4 rounded-xl md:rounded-2xl 
          border-2 transition-all duration-300
          ${hasSelection
            ? "bg-gradient-to-r from-[#f0fdf4] to-white border-[#10b981]/20 shadow-lg shadow-[#10b981]/5"
            : "bg-white border-[#e2e8f0]"
          }
          ${isHovered && hasSelection ? "shadow-xl shadow-[#10b981]/10" : ""}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Top progress bar */}
        {hasSelection && (
          <div className="absolute top-0 left-4 right-4 h-[2px] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#10b981] to-[#059669] transition-all duration-500 rounded-full"
              style={{ width: `${(selectedCount / Math.max(filteredProductsCount, 1)) * 100}%`, opacity: 0.4 }}
            />
          </div>
        )}

        {/* Selection info */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onSelectAll}
            disabled={isLoading || filteredProductsCount === 0}
            className={`
              flex items-center gap-2.5 group transition-all disabled:opacity-50 active:scale-95
              ${hasSelection ? "text-[#10b981]" : "text-[#94a3b8] hover:text-[#64748b]"}
            `}
            aria-label={isAllSelected ? "Deselect all" : "Select all"}
          >
            <CheckboxIcon
              className={`
                w-5 h-5 transition-all duration-200
                ${hasSelection ? "text-[#10b981]" : "text-[#cbd5e1] group-hover:text-[#94a3b8]"}
              `}
              strokeWidth={hasSelection ? 2.5 : 2}
            />
            <span className="text-sm font-semibold whitespace-nowrap">
              {selectedCount > 0 ? (
                <span className="flex items-center gap-1.5">
                  <SelectionBadge count={selectedCount} />
                  <span className="text-[#64748b]">
                    {selectedCount === 1 ? "item selected" : "items selected"}
                  </span>
                  <span className="text-[#94a3b8] text-xs">
                    of {filteredProductsCount}
                  </span>
                </span>
              ) : (
                <span className="text-[#64748b]">Select all ({filteredProductsCount})</span>
              )}
            </span>
          </button>

          <ProgressBar current={selectedCount} total={filteredProductsCount} />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 scrollbar-hide">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={!hasSelection || isLoading}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm 
                transition-all active:scale-95 whitespace-nowrap
                ${hasSelection && !isLoading
                  ? "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#10b981] hover:text-[#059669] hover:shadow-sm"
                  : "bg-[#f1f5f9] border-2 border-transparent text-[#cbd5e1] cursor-not-allowed"
                }
              `}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Status</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${showStatusMenu ? "rotate-180" : ""}`}
              />
            </button>

            <StatusDropdown
              isOpen={showStatusMenu}
              onClose={() => setShowStatusMenu(false)}
              onSelect={handleStatusClick}
              disabled={isLoading}
            />
          </div>

          {/* Delete button */}
          <button
            onClick={onBulkDelete}
            disabled={!hasSelection || isLoading}
            className={`
              flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs md:text-sm 
              transition-all active:scale-95 whitespace-nowrap
              ${hasSelection && !isLoading
                ? "bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white hover:opacity-90 shadow-lg shadow-[#ef4444]/25 hover:shadow-[#ef4444]/40"
                : "bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>{isLoading ? "Deleting..." : "Delete"}</span>
            {hasSelection && !isLoading && (
              <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-white/25 text-[10px] font-bold">
                {selectedCount}
              </span>
            )}
          </button>

          {/* Cancel */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-bold text-xs md:text-sm text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-95 disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>
      </div>

      {/* Confirmation banner */}
      {showConfirm && pendingStatus && (
        <ConfirmationBanner
          status={pendingStatus}
          count={selectedCount}
          onConfirm={confirmStatusChange}
          onCancel={cancelConfirmation}
        />
      )}
    </>
  );
}