"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";

interface ProductBulkActionsToolbarProps {
  bulkSelected: string[];
  filteredProductsCount: number;
  onBulkStatusUpdate: (status: "active" | "paused" | "draft") => void;
  onBulkDelete: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"active" | "paused" | "draft" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedCount = bulkSelected.length;
  const isAllSelected = selectedCount === filteredProductsCount && filteredProductsCount > 0;
  const isPartialSelected = selectedCount > 0 && !isAllSelected;
  const hasSelection = selectedCount > 0;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Handle status change with confirmation for destructive actions
  const handleStatusClick = (status: "active" | "paused" | "draft") => {
    if (status === "draft" || status === "paused") {
      setPendingStatus(status);
      setShowStatusMenu(false);
      // Small delay to allow dropdown close animation
      setTimeout(() => setShowDeleteConfirm(true), 150);
    } else {
      onBulkStatusUpdate(status);
      setShowStatusMenu(false);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      onBulkStatusUpdate(pendingStatus);
      setPendingStatus(null);
      setShowDeleteConfirm(false);
    }
  };

  // Checkbox icon based on state
  const CheckboxIcon = isAllSelected
    ? CheckSquare
    : isPartialSelected
      ? MinusSquare
      : Square;

  return (
    <>
      <div
        className={`
          relative mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between 
          gap-3 sm:gap-0 bg-[#f8fafc] p-3 sm:p-4 rounded-xl 
          border border-[#e2e8f0] transition-all duration-300
          ${hasSelection ? "ring-2 ring-[#25D366]/20 shadow-lg shadow-[#25D366]/5" : ""}
        `}
      >
        {/* Selection info */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onSelectAll}
            disabled={isLoading || filteredProductsCount === 0}
            className={`
              flex items-center gap-2.5 group transition-all disabled:opacity-50
              ${hasSelection ? "text-[#25D366]" : "text-[#94a3b8] hover:text-[#64748b]"}
            `}
            aria-label={isAllSelected ? "Deselect all" : "Select all"}
          >
            <CheckboxIcon
              className={`
                w-5 h-5 transition-all duration-200
                ${hasSelection ? "text-[#25D366]" : "text-[#cbd5e1] group-hover:text-[#94a3b8]"}
              `}
              strokeWidth={hasSelection ? 2.5 : 2}
            />
            <span className="text-sm font-semibold whitespace-nowrap">
              {selectedCount > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-[#25D366] text-white text-[10px] font-bold">
                    {selectedCount}
                  </span>
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

          {/* Selection progress bar (mobile) */}
          {hasSelection && (
            <div className="sm:hidden flex-1 h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full transition-all duration-500"
                style={{ width: `${(selectedCount / filteredProductsCount) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto sm:overflow-visible pb-1 sm:pb-0 hide-scrollbar">
          {/* Status dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              disabled={!hasSelection || isLoading}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm 
                transition-all active:scale-95 whitespace-nowrap
                ${hasSelection && !isLoading
                  ? "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] hover:shadow-sm"
                  : "bg-[#f1f5f9] border-2 border-transparent text-[#cbd5e1] cursor-not-allowed"
                }
              `}
            >
              <Play className="w-4 h-4" />
              <span>Status</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${showStatusMenu ? "rotate-180" : ""}`}
              />
            </button>

            {/* Dropdown menu */}
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl shadow-black/10 border border-[#e2e8f0] overflow-hidden z-50 animate-scaleIn origin-top-right">
                <div className="p-1">
                  <button
                    onClick={() => handleStatusClick("active")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#1e293b] hover:bg-[#f0fdf4] hover:text-[#128C7E] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <Play className="w-4 h-4 text-[#25D366]" fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Activate</div>
                      <div className="text-[10px] text-[#94a3b8]">Make visible to customers</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleStatusClick("paused")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#1e293b] hover:bg-[#fffbeb] hover:text-amber-600 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Pause className="w-4 h-4 text-amber-500" fill="currentColor" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Pause</div>
                      <div className="text-[10px] text-[#94a3b8]">Temporarily hide</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleStatusClick("draft")}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#1e293b] hover:bg-[#f8fafc] hover:text-[#64748b] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-[#64748b]" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Draft</div>
                      <div className="text-[10px] text-[#94a3b8]">Move to drafts</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Delete button */}
          <button
            onClick={onBulkDelete}
            disabled={!hasSelection || isLoading}
            className={`
              flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm 
              transition-all active:scale-95 whitespace-nowrap
              ${hasSelection && !isLoading
                ? "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                : "bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed"
              }
            `}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
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
            className="flex items-center gap-1.5 px-3 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] transition-all active:scale-95 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </div>
      </div>

      {/* Inline confirmation for status changes */}
      {showDeleteConfirm && pendingStatus && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900 text-sm mb-1">
                Change status to {pendingStatus}?
              </h4>
              <p className="text-xs text-amber-700 mb-3">
                This will affect {selectedCount} selected {selectedCount === 1 ? "product" : "products"}.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={confirmStatusChange}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-all active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPendingStatus(null);
                  }}
                  className="px-4 py-2 bg-white border border-amber-200 text-amber-800 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}