"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceGridViewProps {
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
  active:  { dot: "#10b981", glow: "rgba(16,185,129,0.2)",  label: "Active",  bg: "bg-[#10b981]/10" },
  paused:  { dot: "#f59e0b", glow: "rgba(245,158,11,0.2)",  label: "Paused",  bg: "bg-[#f59e0b]/10" },
  draft:   { dot: "#64748b", glow: "rgba(100,116,139,0.2)", label: "Draft",   bg: "bg-[#64748b]/10" },
};

function getStatusConfig(status: string = "active") {
  return STATUS_CONFIG[status] || STATUS_CONFIG.active;
}

function getRelativeTime(date: any): string {
  if (!date) return "";
  const d = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-surface rounded-2xl border border-outline/80 overflow-hidden relative animate-pulse">
      <div className="h-44 bg-surface-variant" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-surface-variant rounded-lg w-3/4" />
        <div className="flex gap-2">
          <div className="h-4 bg-surface-variant rounded-lg w-16" />
          <div className="h-4 bg-surface-variant rounded-lg w-20" />
        </div>
        <div className="h-6 bg-surface-variant rounded-lg w-24" />
        <div className="h-8 bg-surface-variant rounded-lg w-full" />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const config = getStatusConfig(status);
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex w-2 h-2">
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-40"
          style={{ backgroundColor: config.dot }}
        />
        <span
          className="relative inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: config.dot }}
        />
      </span>
      <span className="text-[11px] font-semibold text-white">{config.label}</span>
    </div>
  );
}

function DropdownMenu({ isOpen, onClose, children }: { isOpen: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  return (
    <div ref={ref} className="absolute right-0 top-full mt-1.5 bg-surface border border-outline rounded-xl shadow-xl z-30 w-52 overflow-hidden animate-scaleIn origin-top-right backdrop-blur-xl">
      {children}
    </div>
  );
}

function DropdownItem({ icon, label, color = "text-on-surface-variant", onClick, disabled, divider }: {
  icon?: string; label?: string; color?: string; onClick?: () => void; disabled?: boolean; divider?: boolean;
}) {
  if (divider) return <div className="border-t border-outline-variant mx-2 my-1" />;
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-surface-container-lowest active:bg-surface-variant"
      } ${color}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <i className={`fas ${icon} w-4 text-center text-xs`} />}
      {label}
    </button>
  );
}

function ActionChip({ icon, label, color, onClick, loading }: {
  icon: string; label: string; color: string; onClick: (e: React.MouseEvent) => void; loading?: boolean;
}) {
  return (
    <button
      className={`flex-1 min-w-0 py-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${color} hover:shadow-sm`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <i className="fas fa-circle-notch fa-spin text-[10px]" />
      ) : (
        <i className={`fas ${icon} text-[10px]`} />
      )}
      <span className="hidden xs:inline">{label}</span>
    </button>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────

function ServiceCard({
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const statusConfig = getStatusConfig(service.status);

  const handleAction = useCallback(async (action: string, handler: () => Promise<void> | void) => {
    setLoadingAction(action);
    try { await handler(); }
    finally { setLoadingAction(null); setShowDropdown(false); }
  }, []);

  const handleCardClick = useCallback(() => {
    if (bulkMode) toggleBulkSelect(service.id);
    else onSelectService(service);
  }, [bulkMode, service.id, toggleBulkSelect, onSelectService]);

  const hasImage = (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) && !imageError;
  const relativeTime = useMemo(() => getRelativeTime(service.createdAt), [service.createdAt]);

  const isActive = service.status === "active";
  const canModify = service.status !== "draft";

  const progressPercent = isActive ? "75%" : service.status === "paused" ? "40%" : "20%";

  return (
    <div
      className={`group relative bg-surface rounded-2xl border border-outline/80 shadow-sm transition-all duration-300 overflow-hidden cursor-pointer animate-fadeIn ${
        isVisible ? "opacity-100" : "opacity-0"
      } ${isHovered ? "shadow-lg -translate-y-0.5 border-outline" : ""} ${
        isSelected ? "ring-2 ring-[#8b5cf6]" : ""
      }`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Premium Top Glow ── */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all duration-500 z-10"
        style={{
          background: `linear-gradient(90deg, ${statusConfig.dot}, transparent)`,
          boxShadow: isHovered ? `0 0 20px ${statusConfig.glow}` : "none",
        }}
      />

      {/* ── Hero Image/Emoji Header ── */}
      <div className="relative h-44 overflow-hidden">
        <div
          className={`w-full h-full bg-gradient-to-br ${service.bgGradient || "from-gray-100 to-gray-200"} flex items-center justify-center transition-transform duration-500 ${isHovered ? "scale-105" : "scale-100"}`}
        >
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
            <span className="text-5xl transition-transform duration-300 group-hover:scale-110">{service.emoji || "✨"}</span>
          )}
        </div>

        {/* Gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent transition-opacity duration-300`} />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          <StatusBadge status={service.status} />
        </div>

        {/* Three-dot menu */}
        {!bulkMode && (
          <div className="absolute top-3 right-3 z-10">
            <button
              className="w-8 h-8 rounded-xl bg-black/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition-all duration-200"
              onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown); }}
              aria-label="More actions"
            >
              <i className="fas fa-ellipsis text-xs" />
            </button>

            <DropdownMenu isOpen={showDropdown} onClose={() => setShowDropdown(false)}>
              <DropdownItem icon="fa-link" label="Copy Link" color="text-[#3b82f6]" onClick={() => { handleAction("copy", () => onCopyLink(service)); setShowDropdown(false); }} />
              <DropdownItem icon={isActive ? "fa-pause" : "fa-play"} label={isActive ? "Pause" : "Activate"} color="text-[#10b981]" onClick={() => { handleAction("toggle", () => onToggleStatus(service)); setShowDropdown(false); }} disabled={loadingAction === "toggle"} />
              <DropdownItem icon="fa-copy" label="Duplicate" onClick={() => { handleAction("duplicate", () => onDuplicateService(service)); setShowDropdown(false); }} disabled={loadingAction === "duplicate"} />
              <DropdownItem icon="fa-share-alt" label="Share" color="text-[#25D366]" onClick={() => { handleAction("share", () => onShareService(service)); setShowDropdown(false); }} />
              <DropdownItem divider />
              <DropdownItem icon="fa-trash-alt" label="Delete" color="text-red-500" onClick={() => { setShowDropdown(false); onDeleteService(service.id); }} />
            </DropdownMenu>
          </div>
        )}

        {/* Bulk Select */}
        {bulkMode && (
          <div className="absolute top-3 left-3 z-20" onClick={(e) => e.stopPropagation()}>
            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected ? "bg-[#8b5cf6] border-[#8b5cf6] text-white" : "bg-surface border-outline hover:border-[#8b5cf6]"
            }`}>
              {isSelected && <i className="fas fa-check text-white text-xs" />}
            </div>
            <input type="checkbox" checked={isSelected} onChange={() => toggleBulkSelect(service.id)} className="sr-only" />
          </div>
        )}

        {/* Service name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-bold text-lg text-white mb-0.5 truncate">{service.name}</h3>
          <div className="flex items-center gap-3 text-[11px] text-white/70">
            {service.businessType && (
              <span className="flex items-center gap-1">
                <i className="fas fa-store text-[9px]" />
                {service.businessType}
              </span>
            )}
            {service.duration && (
              <span className="flex items-center gap-1">
                <i className="fas fa-clock text-[9px]" />
                {service.duration}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          <div className="text-center p-2 rounded-xl bg-surface-variant/50">
            <div className="text-sm font-extrabold text-on-surface">{service.bookings || 0}</div>
            <div className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">Bookings</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-surface-variant/50">
            <div className="text-sm font-extrabold text-on-surface">{service.views || 0}</div>
            <div className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">Views</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-surface-variant/50">
            <div className="text-sm font-extrabold text-on-surface">{service.rating ? service.rating.toFixed(1) : "—"}</div>
            <div className="text-[9px] text-on-surface-variant font-medium uppercase tracking-wider">Rating</div>
          </div>
        </div>

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {service.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-surface-variant/70 rounded-md text-[10px] text-on-surface-variant font-medium">{tag}</span>
            ))}
            {service.tags.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] text-on-surface-variant font-medium">+{service.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-baseline gap-2 mb-3.5">
          <span className="text-[10px] text-on-surface-variant font-medium uppercase tracking-wider">From</span>
          <span className="text-xl font-extrabold text-[#8b5cf6]">{formatCurrency(service.priceMin ?? 0)}</span>
          {service.priceMax != null && service.priceMin != null && service.priceMax > service.priceMin && (
            <span className="text-xs text-on-surface-variant">– {formatCurrency(service.priceMax)}</span>
          )}
        </div>

        {/* Progress bar */}
        {isActive && (
          <div className="mb-3.5">
            <div className="flex items-center justify-between text-[10px] text-outline mb-1.5">
              <span>Performance</span>
              <span className="font-semibold" style={{ color: statusConfig.dot }}>{isActive ? "Active" : "Paused"}</span>
            </div>
            <div className="h-1.5 bg-outline/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: progressPercent,
                  background: `linear-gradient(90deg, ${statusConfig.dot}, transparent)`,
                }}
              />
            </div>
          </div>
        )}

        {/* ── Action Buttons ── */}
        {!bulkMode && (
          <div className="flex gap-2 pt-3 border-t border-outline/50">
            <ActionChip icon="fa-link" label="Copy" color="bg-surface-variant/70 text-on-surface-variant hover:bg-surface-variant" onClick={(e) => { e.stopPropagation(); handleAction("copy", () => onCopyLink(service)); }} loading={loadingAction === "copy"} />
            <ActionChip icon={isActive ? "fa-pause" : "fa-play"} label={isActive ? "Pause" : "Activate"} color="bg-surface-variant/70 text-on-surface-variant hover:bg-surface-variant" onClick={(e) => { e.stopPropagation(); handleAction("toggle", () => onToggleStatus(service)); }} loading={loadingAction === "toggle"} />
            <ActionChip icon="fa-copy" label="Duplicate" color="bg-surface-variant/70 text-on-surface-variant hover:bg-surface-variant" onClick={(e) => { e.stopPropagation(); handleAction("duplicate", () => onDuplicateService(service)); }} loading={loadingAction === "duplicate"} />
            <ActionChip icon="fa-share-alt" label="Share" color="bg-[#f0fdf4] text-[#128C7E] hover:bg-[#dcfce7]" onClick={(e) => { e.stopPropagation(); handleAction("share", () => onShareService(service)); }} loading={loadingAction === "share"} />
          </div>
        )}
      </div>

      {/* ── Bottom Status Glow ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-30 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${statusConfig.dot}, transparent)`,
          opacity: isHovered ? 0.5 : 0.2,
        }}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 md:py-24 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] flex items-center justify-center mb-4 shadow-sm">
        <i className="fas fa-th-large text-3xl md:text-4xl text-[#8b5cf6]/40" />
      </div>
      <p className="text-base md:text-lg font-bold text-on-surface mb-1">No services found</p>
      <p className="text-xs md:text-sm text-on-surface-variant max-w-xs text-center">
        Try adjusting your filters or add a new service to get started.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceGridView({
  services, bulkMode, bulkSelected, toggleBulkSelect, onSelectService,
  onShareService, onCopyLink, onToggleStatus, onDuplicateService, onDeleteService, isLoading = false,
}: ServiceGridViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => <ShimmerCard key={i} />)}
      </div>
    );
  }

  if (services.length === 0) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {services.map((service, index) => (
        <ServiceCard
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
