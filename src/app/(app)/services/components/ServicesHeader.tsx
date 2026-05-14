"use client";

import { useState, useCallback } from "react";
import { Service } from "@/lib/db";
import {
  Download,
  CheckSquare,
  Plus,
  Layers,
  List,
  Grid3X3,
  Trash2,
  Play,
  X,
  ChevronDown,
  Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServicesHeaderProps {
  servicesCount: number;
  bulkMode: boolean;
  setBulkMode: (mode: boolean) => void;
  bulkSelected: string[];
  filteredServices: Service[];
  viewLayout: "grid" | "list";
  setViewLayout: (layout: "grid" | "list") => void;
  handleBulkStatusUpdate: (status: "active" | "paused" | "draft") => Promise<void>;
  handleBulkDelete: () => Promise<void>;
  handleExportCSV: () => void;
  onAddService: () => void;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function BulkActionBar({
  selectedCount,
  totalCount,
  onActivate,
  onDelete,
  onCancel,
  isLoading,
}: {
  selectedCount: number;
  totalCount: number;
  onActivate: () => void;
  onDelete: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="bg-white border-y border-[#e2e8f0] px-4 py-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-[#8b5cf6]" />
          </div>
          <div>
            <span className="text-sm font-bold text-[#1e293b]">
              {selectedCount} of {totalCount} selected
            </span>
            <p className="text-[10px] text-[#94a3b8]">Choose an action below</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showConfirmDelete ? (
            <>
              <span className="text-xs font-bold text-[#ef4444] mr-1">Sure?</span>
              <button
                onClick={() => {
                  onDelete();
                  setShowConfirmDelete(false);
                }}
                disabled={isLoading}
                className="px-3 py-2 bg-[#ef4444] text-white rounded-lg text-xs font-bold hover:bg-[#dc2626] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg text-xs font-bold hover:bg-[#e2e8f0] transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onActivate}
                disabled={isLoading || selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#10b981] text-white rounded-lg text-xs font-bold hover:bg-[#059669] transition-all active:scale-95 disabled:opacity-50 shadow-sm"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Activate
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                disabled={isLoading || selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#ef4444]/10 text-[#ef4444] rounded-lg text-xs font-bold hover:bg-[#ef4444] hover:text-white transition-all active:scale-95 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
              <div className="w-px h-6 bg-[#e2e8f0] mx-1" />
              <button
                onClick={onCancel}
                className="px-3 py-2 text-xs font-bold text-[#64748b] hover:text-[#1e293b] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  isActive = false,
  isLoading = false,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
  isActive?: boolean;
  isLoading?: boolean;
  badge?: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const variants = {
    default: isActive
      ? "bg-[#8b5cf6] text-white shadow-lg shadow-[#8b5cf6]/25"
      : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]",
    primary: "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/25 hover:shadow-[#8b5cf6]/40",
    danger: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      className={`
        relative flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl font-semibold text-sm
        transition-all duration-200 active:scale-95 shrink-0
        ${isLoading ? "opacity-50 cursor-wait" : "hover:-translate-y-0.5"}
        ${variants[variant]}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className={`w-4 h-4 transition-transform duration-200 ${isHovered ? "scale-110" : "scale-100"}`} />
      )}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`
          absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full 
          flex items-center justify-center text-[10px] font-bold
          ${variant === "primary" || variant === "danger" ? "bg-white text-[#1e293b]" : "bg-[#8b5cf6] text-white"}
        `}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServicesHeader({
  servicesCount,
  bulkMode,
  setBulkMode,
  bulkSelected,
  filteredServices,
  viewLayout,
  setViewLayout,
  handleBulkStatusUpdate,
  handleBulkDelete,
  handleExportCSV,
  onAddService,
}: ServicesHeaderProps) {
  const [bulkLoading, setBulkLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleActivate = useCallback(async () => {
    setBulkLoading(true);
    await handleBulkStatusUpdate("active");
    setBulkLoading(false);
  }, [handleBulkStatusUpdate]);

  const handleDelete = useCallback(async () => {
    setBulkLoading(true);
    await handleBulkDelete();
    setBulkLoading(false);
  }, [handleBulkDelete]);

  const handleExport = useCallback(async () => {
    setExportLoading(true);
    handleExportCSV();
    setTimeout(() => setExportLoading(false), 1000);
  }, [handleExportCSV]);

  const exitBulkMode = useCallback(() => {
    setBulkMode(false);
  }, [setBulkMode]);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0]">
      <div className="px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
          {/* Left: Title */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/20">
                <Layers className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              {/* Subtle pulse ring */}
              <div className="absolute inset-0 rounded-xl ring-2 ring-[#8b5cf6]/20 animate-ping opacity-30" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-2xl font-extrabold text-[#1e293b] tracking-tight">
                Services
              </h1>
              <p className="text-xs md:text-sm text-[#94a3b8] mt-0.5 font-medium">
                {servicesCount.toLocaleString()} service{servicesCount !== 1 ? "s" : ""} total
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0 snap-x snap-mandatory">
            {/* Export */}
            <IconButton
              icon={Download}
              label="Export"
              onClick={handleExport}
              isLoading={exportLoading}
            />

            {/* Bulk Toggle */}
            <IconButton
              icon={CheckSquare}
              label={bulkMode ? "Done" : "Bulk"}
              onClick={() => setBulkMode(!bulkMode)}
              isActive={bulkMode}
              badge={bulkMode ? bulkSelected.length : undefined}
            />

            {/* View Toggle */}
            <IconButton
              icon={viewLayout === "grid" ? List : Grid3X3}
              label={viewLayout === "grid" ? "List" : "Grid"}
              onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")}
            />

            {/* Add Service */}
            <IconButton
              icon={Plus}
              label="Add Service"
              onClick={onAddService}
              variant="primary"
            />
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkMode && (
        <BulkActionBar
          selectedCount={bulkSelected.length}
          totalCount={filteredServices.length}
          onActivate={handleActivate}
          onDelete={handleDelete}
          onCancel={exitBulkMode}
          isLoading={bulkLoading}
        />
      )}
    </header>
  );
}