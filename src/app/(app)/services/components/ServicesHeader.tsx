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
  Loader2,
} from "lucide-react";
import PageHeaderCard from "@/components/PageHeaderCard";

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
  selectedCount, totalCount, onActivate, onDelete, onCancel, isLoading,
}: {
  selectedCount: number; totalCount: number; onActivate: () => void; onDelete: () => void; onCancel: () => void; isLoading: boolean;
}) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  return (
    <div className="bg-surface border-y border-outline-variant px-4 py-3 animate-fadeIn mt-3 rounded-xl border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
            <CheckSquare className="w-4 h-4 text-[#8b5cf6]" />
          </div>
          <div>
            <span className="text-sm font-bold text-on-surface">{selectedCount} of {totalCount} selected</span>
            <p className="text-[10px] text-outline">Choose an action below</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showConfirmDelete ? (
            <>
              <span className="text-xs font-bold text-[#ef4444] mr-1">Sure?</span>
              <button onClick={() => { onDelete(); setShowConfirmDelete(false); }} disabled={isLoading}
                className="px-3 py-2 bg-[#ef4444] text-white rounded-lg text-xs font-bold hover:bg-[#dc2626] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                Yes, Delete
              </button>
              <button onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-2 bg-surface-variant text-on-surface-variant rounded-lg text-xs font-bold hover:bg-surface-variant transition-all">
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={onActivate} disabled={isLoading || selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#10b981] text-white rounded-lg text-xs font-bold hover:bg-[#059669] transition-all active:scale-95 disabled:opacity-50 shadow-sm">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Activate
              </button>
              <button onClick={() => setShowConfirmDelete(true)} disabled={isLoading || selectedCount === 0}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#ef4444]/10 text-[#ef4444] rounded-lg text-xs font-bold hover:bg-[#ef4444] hover:text-white transition-all active:scale-95 disabled:opacity-50">
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
              <div className="w-px h-6 bg-surface-variant mx-1" />
              <button onClick={onCancel}
                className="px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors">
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
  icon: Icon, label, onClick, variant = "default", isActive = false, isLoading = false, badge, mobileLabel,
}: {
  icon: React.ElementType; label: string; onClick: () => void; variant?: "default" | "primary" | "danger";
  isActive?: boolean; isLoading?: boolean; badge?: number; mobileLabel?: string;
}) {
  const variants = {
    default: isActive
      ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md shadow-[#8b5cf6]/20 border-0"
      : "bg-surface border-2 border-outline-variant text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:shadow-md hover:-translate-y-0.5",
    primary: "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/25 hover:shadow-[#8b5cf6]/40 hover:-translate-y-0.5 border-0",
    danger: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
  };

  return (
    <button onClick={onClick} disabled={isLoading}
      className={`relative flex items-center gap-2 px-3 md:px-4 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all duration-200 active:scale-95 shrink-0 snap-start ${
        isLoading ? "opacity-50 cursor-wait" : "hover:-translate-y-0.5"
      } ${variants[variant]}`}>
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
      <span className="hidden sm:inline">{label}</span>
      {mobileLabel && <span className="sm:hidden">{mobileLabel}</span>}
      {badge !== undefined && badge > 0 && (
        <span className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold ${
          variant === "primary" || variant === "danger" ? "bg-surface text-on-surface" : "bg-[#8b5cf6] text-white"
        }`}>
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServicesHeader({
  servicesCount, bulkMode, setBulkMode, bulkSelected, filteredServices,
  viewLayout, setViewLayout, handleBulkStatusUpdate, handleBulkDelete, handleExportCSV, onAddService,
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

  return (
    <PageHeaderCard className="sticky top-0 z-30">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        {/* Left: Title */}
        <div className="flex items-center gap-3 md:gap-4 min-w-0 w-full md:w-auto">
          {/* Premium gradient icon with glow */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] blur-md opacity-30 animate-pulse" />
            <div className="relative w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white shadow-lg shadow-[#8b5cf6]/20">
              <Layers className="w-5 h-5 md:w-6 md:h-6" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl lg:text-[1.625rem] font-extrabold text-on-surface tracking-tight">
              Services
            </h1>
            <p className="text-xs md:text-sm text-outline mt-0.5 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse mr-1.5 align-middle" />
              {servicesCount.toLocaleString()} service{servicesCount !== 1 ? "s" : ""} total
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar pb-0.5 md:pb-0 snap-x">
          <IconButton icon={Download} label="Export" onClick={handleExport} isLoading={exportLoading} mobileLabel="" />
          <IconButton
            icon={CheckSquare}
            label={bulkMode ? "Done" : "Bulk"}
            onClick={() => setBulkMode(!bulkMode)}
            isActive={bulkMode}
            badge={bulkMode ? bulkSelected.length : undefined}
            mobileLabel={bulkMode ? "Done" : "Bulk"}
          />
          <IconButton
            icon={viewLayout === "grid" ? List : Grid3X3}
            label={viewLayout === "grid" ? "List" : "Grid"}
            onClick={() => setViewLayout(viewLayout === "grid" ? "list" : "grid")}
            mobileLabel=""
          />
          <IconButton icon={Plus} label="Add Service" onClick={onAddService} variant="primary" mobileLabel="Add" />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkMode && (
        <BulkActionBar
          selectedCount={bulkSelected.length} totalCount={filteredServices.length}
          onActivate={handleActivate} onDelete={handleDelete} onCancel={() => setBulkMode(false)} isLoading={bulkLoading}
        />
      )}
    </PageHeaderCard>
  );
}
