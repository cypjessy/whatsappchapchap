"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceListViewProps {
  services: Service[];
  bulkMode: boolean;
  bulkSelected: string[];
  toggleBulkSelect: (id: string) => void;
  onSelectService: (service: Service) => void;
  onShareService: (service: Service) => void;
  onCopyLink: (service: Service) => void;
  onToggleStatus: (service: Service) => void;
  onDuplicateService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
  isLoading?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; glow: string; label: string; bg: string }> = {
  active:  { dot: "#10b981", glow: "rgba(16,185,129,0.2)",  label: "Active",  bg: "bg-[#10b981]" },
  paused:  { dot: "#f59e0b", glow: "rgba(245,158,11,0.2)",  label: "Paused",  bg: "bg-[#f59e0b]" },
  draft:   { dot: "#64748b", glow: "rgba(100,116,139,0.2)", label: "Draft",   bg: "bg-[#64748b]" },
};

function getStatusConfig(status: string = "active") {
  return STATUS_CONFIG[status] || STATUS_CONFIG.active;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerRow() {
  return (
    <div className="relative overflow-hidden bg-surface rounded-2xl border border-outline/80 p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-surface-variant shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-4 bg-surface-variant rounded-lg w-48" />
          <div className="flex gap-3">
            <div className="h-3 bg-surface-variant rounded-lg w-20" />
            <div className="h-3 bg-surface-variant rounded-lg w-16" />
            <div className="h-3 bg-surface-variant rounded-lg w-24" />
          </div>
        </div>
        <div className="h-6 bg-surface-variant rounded-lg w-20" />
      </div>
    </div>
  );
}

function ActionChip({ icon, label, color, onClick, loading }: {
  icon: string; label: string; color: string; onClick: (e: React.MouseEvent) => void; loading?: boolean;
}) {
  return (
    <button
      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 active:scale-90 ${color} hover:shadow-sm`}
      onClick={onClick}
      disabled={loading}
      aria-label={label}
    >
      {loading ? (
        <i className="fas fa-circle-notch fa-spin text-[10px]" />
      ) : (
        <i className={`fas ${icon} text-[11px]`} />
      )}
    </button>
  );
}

function ServiceRow({
  service, index, bulkMode, isSelected, toggleBulkSelect, onSelectService,
  onShareService, onCopyLink, onToggleStatus, onDuplicateService, onDeleteService,
}: {
  service: Service; index: number; bulkMode: boolean; isSelected: boolean;
  toggleBulkSelect: (id: string) => void;
  onSelectService: (service: Service) => void;
  onShareService: (service: Service) => void;
  onCopyLink: (service: Service) => void;
  onToggleStatus: (service: Service) => void;
  onDuplicateService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
}) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const statusConfig = getStatusConfig(service.status);
  const hasImage = (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) && !imageError;
  const isActive = service.status === "active";

  const handleAction = useCallback(async (action: string, handler: () => Promise<void> | void) => {
    setLoadingAction(action);
    try { await handler(); }
    finally { setLoadingAction(null); }
  }, []);

  const handleClick = useCallback(() => {
    if (bulkMode) toggleBulkSelect(service.id);
    else onSelectService(service);
  }, [bulkMode, service.id, toggleBulkSelect, onSelectService]);

  return (
    <div
      className={`group relative bg-surface rounded-2xl border border-outline/80 p-4 transition-all duration-200 cursor-pointer ${
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
      } ${isSelected ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10" : ""} ${
        isHovered && !isSelected ? "shadow-lg -translate-y-0.5 border-outline" : "shadow-sm"
      }`}
      style={{ transitionDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300 ${
        isHovered || isSelected ? "opacity-100" : "opacity-0"
      }`} style={{ backgroundColor: statusConfig.dot }} />

      <div className="flex items-center gap-3 md:gap-4">
        {/* Bulk Select */}
        {bulkMode && (
          <div onClick={(e) => e.stopPropagation()}>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 cursor-pointer ${
              isSelected ? "bg-[#8b5cf6] border-[#8b5cf6]" : "bg-surface border-outline hover:border-[#8b5cf6]"
            }`}>
              {isSelected && <i className="fas fa-check text-white text-xs" />}
            </div>
            <input type="checkbox" checked={isSelected} onChange={() => toggleBulkSelect(service.id)} className="sr-only" />
          </div>
        )}

        {/* Image/Icon */}
        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br ${
          service.bgGradient || "from-gray-100 to-gray-200"
        } flex items-center justify-center transition-transform duration-300 ${isHovered ? "scale-105" : "scale-100"}`}>
          {hasImage ? (
            <img
              src={service.imageUrl || service.portfolioImages![0]}
              alt={service.name}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImageError(true)}
            />
          ) : (
            <span className="text-2xl md:text-3xl">{service.emoji || "✨"}</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-sm md:text-base truncate">{service.name}</h3>
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide text-white ${statusConfig.bg}`}>
              <span className="w-1 h-1 rounded-full bg-surface/80" />
              {statusConfig.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-on-surface-variant">
            {service.businessType && (
              <span className="flex items-center gap-1">
                <i className="fas fa-store text-[9px] text-[#8b5cf6]" />
                {service.businessType}
              </span>
            )}
            {service.duration && (
              <span className="flex items-center gap-1">
                <i className="fas fa-clock text-[9px] text-[#8b5cf6]" />
                {service.duration}
              </span>
            )}
            <span className="flex items-center gap-1">
              <i className="fas fa-calendar-check text-[9px] text-[#8b5cf6]" />
              {service.bookings || 0}
            </span>
            {service.rating && (
              <span className="flex items-center gap-1">
                <i className="fas fa-star text-[9px] text-[#f59e0b]" />
                {service.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Tags - mobile */}
          <div className="flex flex-wrap gap-1 mt-1.5 md:hidden">
            {service.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-surface-variant/70 rounded text-[9px] text-on-surface-variant">{tag}</span>
            ))}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <div className="text-lg font-extrabold text-[#8b5cf6]">{formatCurrency(service.priceMin ?? 0)}</div>
          {service.priceMax != null && service.priceMin != null && service.priceMax > service.priceMin && (
            <div className="text-[10px] text-outline">– {formatCurrency(service.priceMax)}</div>
          )}
        </div>

        {/* Desktop Actions */}
        {!bulkMode && (
          <div className={`hidden md:flex gap-1 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-70"}`}>
            <ActionChip icon="fa-link" label="Copy Link" color="bg-[#eff6ff] text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white" onClick={(e) => { e.stopPropagation(); handleAction("copy", () => onCopyLink(service)); }} loading={loadingAction === "copy"} />
            <ActionChip icon={isActive ? "fa-pause" : "fa-play"} label={isActive ? "Pause" : "Activate"} color="bg-[rgba(16,185,129,0.1)] text-[#10b981] hover:bg-[#10b981] hover:text-white" onClick={(e) => { e.stopPropagation(); handleAction("toggle", () => onToggleStatus(service)); }} loading={loadingAction === "toggle"} />
            <ActionChip icon="fa-copy" label="Duplicate" color="bg-[#f5f3ff] text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white" onClick={(e) => { e.stopPropagation(); handleAction("duplicate", () => onDuplicateService(service)); }} loading={loadingAction === "duplicate"} />
            <ActionChip icon="fa-share-alt" label="Share" color="bg-[rgba(37,211,102,0.1)] text-[#25D366] hover:bg-[#25D366] hover:text-white" onClick={(e) => { e.stopPropagation(); handleAction("share", () => onShareService(service)); }} loading={loadingAction === "share"} />
            <ActionChip icon="fa-trash-alt" label="Delete" color="bg-[rgba(239,68,68,0.1)] text-[#ef4444] hover:bg-[#ef4444] hover:text-white" onClick={(e) => { e.stopPropagation(); onDeleteService(service.id); }} />
          </div>
        )}

        {/* Mobile: chevron */}
        {!bulkMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelectService(service); }}
            className="md:hidden w-8 h-8 rounded-lg bg-surface-variant/50 flex items-center justify-center text-on-surface-variant"
          >
            <i className="fas fa-chevron-right text-xs" />
          </button>
        )}
      </div>

      {/* Bottom Status Glow */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-20 transition-opacity duration-300" style={{
        background: `linear-gradient(90deg, transparent, ${statusConfig.dot}, transparent)`,
        opacity: isHovered ? 0.4 : 0.1,
      }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] flex items-center justify-center mb-4 shadow-sm">
        <i className="fas fa-list text-3xl md:text-4xl text-[#8b5cf6]/40" />
      </div>
      <p className="text-base md:text-lg font-bold text-on-surface mb-1">No services found</p>
      <p className="text-xs md:text-sm text-on-surface-variant max-w-xs text-center">
        Try adjusting your filters or add a new service to get started.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceListView({
  services, bulkMode, bulkSelected, toggleBulkSelect, onSelectService,
  onShareService, onCopyLink, onToggleStatus, onDuplicateService, onDeleteService, isLoading = false,
}: ServiceListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <ShimmerRow key={i} />)}
      </div>
    );
  }

  if (services.length === 0) return <EmptyState />;

  return (
    <div className="space-y-2.5 md:space-y-3">
      {services.map((service, index) => (
        <ServiceRow
          key={service.id} service={service} index={index}
          bulkMode={bulkMode} isSelected={bulkSelected.includes(service.id)}
          toggleBulkSelect={toggleBulkSelect} onSelectService={onSelectService}
          onShareService={onShareService} onCopyLink={onCopyLink}
          onToggleStatus={onToggleStatus} onDuplicateService={onDuplicateService}
          onDeleteService={onDeleteService}
        />
      ))}
    </div>
  );
}
