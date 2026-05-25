"use client";

import { useState, useEffect, useCallback } from "react";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { Link, Pause, Play, Copy, Share2, Trash2, Eye, CalendarCheck, Star, MoreVertical, Clock, MapPin } from "lucide-react";

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

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  active: { bg: "bg-[#10b981]", dot: "bg-[#10b981]", label: "Active" },
  paused: { bg: "bg-[#f59e0b]", dot: "bg-[#f59e0b]", label: "Paused" },
  draft: { bg: "bg-[#64748b]", dot: "bg-[#64748b]", label: "Draft" },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStatusConfig(status: string = "active") {
  return STATUS_CONFIG[status] || { bg: "bg-surface", dot: "bg-surface", label: status };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerRow() {
  return (
    <div className="relative overflow-hidden bg-surface rounded-xl md:rounded-2xl border border-outline-variant p-3 md:p-4">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3 md:gap-4">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-surface-variant shrink-0" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="h-4 bg-surface-variant rounded-lg w-48" />
          <div className="flex gap-3">
            <div className="h-3 bg-surface-variant rounded-lg w-20" />
            <div className="h-3 bg-surface-variant rounded-lg w-16" />
            <div className="h-3 bg-surface-variant rounded-lg w-24" />
          </div>
        </div>
        <div className="hidden md:flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-9 h-9 bg-surface-variant rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  bgColor,
  iconColor,
  hoverBg,
  hoverText,
  onClick,
  label,
}: {
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  hoverBg: string;
  hoverText: string;
  onClick: (e: React.MouseEvent) => void;
  label: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center
          transition-all duration-200 active:scale-90
          ${bgColor} ${iconColor}
          ${hoverBg} ${hoverText}
          hover:shadow-md3-level2
        `}
        aria-label={label}
      >
        <Icon className="w-4 h-4" />
      </button>
      {showTooltip && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1e293b] text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-md3-level3 animate-fadeIn">
          {label}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e293b] rotate-45" />
        </div>
      )}
    </div>
  );
}

function ServiceRow({
  service,
  index,
  bulkMode,
  isSelected,
  toggleBulkSelect,
  onSelectService,
  onShareService,
  onCopyLink,
  onToggleStatus,
  onDuplicateService,
  onDeleteService,
}: {
  service: Service;
  index: number;
  bulkMode: boolean;
  isSelected: boolean;
  toggleBulkSelect: (id: string) => void;
  onSelectService: (service: Service) => void;
  onShareService: (service: Service) => void;
  onCopyLink: (service: Service) => void;
  onToggleStatus: (service: Service) => void;
  onDuplicateService: (service: Service) => void;
  onDeleteService: (serviceId: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const statusConfig = getStatusConfig(service.status);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const hasImage = (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) && !imageError;

  const handleClick = useCallback(() => {
    if (bulkMode) toggleBulkSelect(service.id);
    else onSelectService(service);
  }, [bulkMode, service.id, toggleBulkSelect, onSelectService]);

  return (
    <div
      className={`
        group relative bg-surface rounded-xl md:rounded-2xl border-2 p-3 md:p-4
        transition-all duration-200 cursor-pointer
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
        ${isSelected
          ? "border-[#8b5cf6] shadow-md3-level2 shadow-[#8b5cf6]/10"
          : "border-outline-variant hover:border-outline-variant hover:shadow-md3-level3 hover:-translate-y-0.5"
        }
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Left accent bar */}
      <div className={`
        absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-300
        ${isHovered || isSelected ? "opacity-100" : "opacity-0"}
      `} style={{ backgroundColor: statusConfig.dot.replace("bg-[", "").replace("]", "") }} />

      <div className="flex items-center gap-3 md:gap-4">
        {/* Bulk Select */}
        {bulkMode && (
          <div onClick={(e) => e.stopPropagation()}>
            <div className={`
              w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 cursor-pointer
              ${isSelected
                ? "bg-[#8b5cf6] border-[#8b5cf6]"
                : "bg-surface border-outline-variant hover:border-[#8b5cf6]"
              }
            `}>
              {isSelected && <i className="fas fa-check text-white text-xs" />}
            </div>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleBulkSelect(service.id)}
              className="sr-only"
            />
          </div>
        )}

        {/* Image/Icon */}
        <div className={`
          w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden shrink-0
          bg-gradient-to-br ${service.bgGradient || "from-gray-100 to-gray-200"}
          flex items-center justify-center
          transition-transform duration-300
          ${isHovered ? "scale-105" : "scale-100"}
        `}>
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
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-bold text-sm md:text-base truncate">
              {service.name}
            </h3>
            {service.bookings && service.bookings > 10 && (
              <span className="shrink-0 px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[9px] font-bold rounded-full flex items-center gap-0.5">
                <i className="fas fa-fire text-[8px]" />
                Popular
              </span>
            )}
            <span className={`
              shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full 
              text-[9px] font-bold uppercase tracking-wide text-white
              ${statusConfig.bg}
            `}>
              <span className="w-1 h-1 rounded-full bg-surface/80" />
              {statusConfig.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] md:text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#8b5cf6]" />
              {service.duration || "TBD"}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#8b5cf6]" />
              <span className="truncate max-w-[80px] md:max-w-[120px]">{service.location || "TBD"}</span>
            </span>
            <span className="flex items-center gap-1">
              <CalendarCheck className="w-3 h-3 text-[#8b5cf6]" />
              {service.bookings || 0}
            </span>
            {service.rating && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" />
                {service.rating.toFixed(1)}
              </span>
            )}
            <span className="font-extrabold text-[#8b5cf6] text-sm md:text-base ml-auto md:ml-0">
              {formatCurrency(service.priceMin ?? 0)}
            </span>
            {service.priceMax != null && service.priceMin != null && service.priceMax > service.priceMin && (
              <span className="text-outline hidden md:inline">
                – {formatCurrency(service.priceMax)}
              </span>
            )}
          </div>

          {/* Tags - mobile only */}
          <div className="flex flex-wrap gap-1 mt-1.5 md:hidden">
            {service.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-surface rounded text-[9px] text-on-surface-variant">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Desktop Actions */}
        {!bulkMode && (
          <div className={`
            hidden md:flex gap-1 transition-opacity duration-200
            ${isHovered ? "opacity-100" : "opacity-70"}
          `}>
            <ActionButton
              icon={Link}
              bgColor="bg-[#eff6ff]"
              iconColor="text-[#3b82f6]"
              hoverBg="hover:bg-[#3b82f6]"
              hoverText="hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onCopyLink(service);
              }}
              label="Copy Link"
            />
            <ActionButton
              icon={service.status === "active" ? Pause : Play}
              bgColor="bg-[rgba(16,185,129,0.1)]"
              iconColor="text-[#10b981]"
              hoverBg="hover:bg-[#10b981]"
              hoverText="hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(service);
              }}
              label={service.status === "active" ? "Pause" : "Activate"}
            />
            <ActionButton
              icon={Copy}
              bgColor="bg-[#f5f3ff]"
              iconColor="text-[#8b5cf6]"
              hoverBg="hover:bg-[#8b5cf6]"
              hoverText="hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateService(service);
              }}
              label="Duplicate"
            />
            <ActionButton
              icon={Share2}
              bgColor="bg-[rgba(37,211,102,0.1)]"
              iconColor="text-[#25D366]"
              hoverBg="hover:bg-[#25D366]"
              hoverText="hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onShareService(service);
              }}
              label="Share"
            />
            <ActionButton
              icon={Trash2}
              bgColor="bg-[rgba(239,68,68,0.1)]"
              iconColor="text-[#ef4444]"
              hoverBg="hover:bg-[#ef4444]"
              hoverText="hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteService(service.id);
              }}
              label="Delete"
            />
          </div>
        )}

        {/* Mobile: More button */}
        {!bulkMode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectService(service);
            }}
            className="md:hidden w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-on-surface-variant"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
        <i className="fas fa-list text-3xl md:text-4xl text-[#cbd5e1]" />
      </div>
      <p className="text-base md:text-lg font-bold text-on-surface-variant mb-1">No services found</p>
      <p className="text-xs md:text-sm text-outline max-w-xs text-center">
        Try adjusting your filters or add a new service to get started.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceListView({
  services,
  bulkMode,
  bulkSelected,
  toggleBulkSelect,
  onSelectService,
  onShareService,
  onCopyLink,
  onToggleStatus,
  onDuplicateService,
  onDeleteService,
  isLoading = false,
}: ServiceListViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerRow key={i} />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-2.5 md:space-y-3">
      {services.map((service, index) => (
        <ServiceRow
          key={service.id}
          service={service}
          index={index}
          bulkMode={bulkMode}
          isSelected={bulkSelected.includes(service.id)}
          toggleBulkSelect={toggleBulkSelect}
          onSelectService={onSelectService}
          onShareService={onShareService}
          onCopyLink={onCopyLink}
          onToggleStatus={onToggleStatus}
          onDuplicateService={onDuplicateService}
          onDeleteService={onDeleteService}
        />
      ))}
    </div>
  );
}