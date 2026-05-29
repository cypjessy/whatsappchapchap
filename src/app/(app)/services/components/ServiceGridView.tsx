"use client";

import { useState, useEffect, useCallback } from "react";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { Link, Pause, Play, Copy, Share2, Trash2, Eye, CalendarCheck, Star, MoreVertical } from "lucide-react";

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

function getLocationIcon(location: string): string {
  if (!location) return "fa-map-marker-alt";
  const loc = location.toLowerCase();
  if (loc.includes("video") || loc.includes("remote") || loc.includes("online")) return "fa-video";
  if (loc.includes("home") || loc.includes("client")) return "fa-home";
  if (loc.includes("studio") || loc.includes("shop")) return "fa-store";
  return "fa-map-marker-alt";
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="h-40 md:h-44 bg-surface-variant" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-surface-variant rounded-lg w-3/4" />
        <div className="flex gap-2">
          <div className="h-4 bg-surface-variant rounded-lg w-16" />
          <div className="h-4 bg-surface-variant rounded-lg w-16" />
        </div>
        <div className="h-6 bg-surface-variant rounded-lg w-24" />
        <div className="h-8 bg-surface-variant rounded-lg w-full" />
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
          w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center
          transition-all duration-200 active:scale-90
          ${bgColor} ${iconColor}
          ${hoverBg} ${hoverText}
          hover:shadow-md
        `}
        aria-label={label}
      >
        <Icon className="w-4 h-4" />
      </button>
      {showTooltip && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1e293b] text-white text-[10px] font-bold rounded-md whitespace-nowrap shadow-lg animate-fadeIn">
          {label}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e293b] rotate-45" />
        </div>
      )}
    </div>
  );
}

function ServiceCard({
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
  const [showActions, setShowActions] = useState(false);
  const statusConfig = getStatusConfig(service.status);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const handleCardClick = useCallback(() => {
    if (bulkMode) {
      toggleBulkSelect(service.id);
    } else {
      onSelectService(service);
    }
  }, [bulkMode, service.id, toggleBulkSelect, onSelectService]);

  const hasImage = (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) && !imageError;

  return (
    <div
      className={`
        group relative bg-surface rounded-xl border border-outline-variant shadow-sm overflow-hidden cursor-pointer
        transition-all duration-300 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${isSelected
          ? "ring-2 ring-[var(--md-sys-color-primary)] shadow-lg"
          : "hover:shadow-xl hover:-translate-y-1"
        }
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Bulk Select Checkbox */}
      {bulkMode && (
        <div
          className="absolute top-3 left-3 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`
            w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
            ${isSelected
              ? "bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
              : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)]"
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

      {/* Image/Gradient Header */}
      <div className="relative h-40 md:h-48 overflow-hidden">
        <div
          className={`
            w-full h-full bg-gradient-to-br ${service.bgGradient || "from-gray-100 to-gray-200"}
            flex items-center justify-center transition-transform duration-500
            ${isHovered ? "scale-105" : "scale-100"}
          `}
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
            <span className="text-5xl md:text-6xl transition-transform duration-300 group-hover:scale-110">
              {service.emoji || "✨"}
            </span>
          )}
        </div>

        {/* Overlay gradient */}
        <div className={`
          absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent
          transition-opacity duration-300
          ${isHovered ? "opacity-100" : "opacity-0"}
        `} />

        {/* Top actions */}
        {!bulkMode && (
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActions(!showActions);
              }}
              className={`
                w-9 h-9 rounded-full bg-[var(--md-sys-color-surface)] flex items-center justify-center
                text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition-all duration-200 shadow-sm
                ${isHovered || showActions ? "opacity-100" : "opacity-0"}
              `}
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide shadow-md
            ${statusConfig.bg}
          `}>
            <span className={`w-1.5 h-1.5 rounded-full bg-surface/80`} />
            {statusConfig.label}
          </span>
        </div>

        {/* Hover overlay actions */}
        <div className={`
          absolute bottom-3 left-3 right-3 flex justify-center gap-2
          transition-all duration-300
          ${isHovered && !bulkMode ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
        `}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShareService(service);
            }}
            className="px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] text-xs font-medium hover:bg-[var(--md-sys-color-surface-variant)] transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Link className="w-3 h-3" />
            Copy Link
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(service);
            }}
            className="px-3 py-1.5 rounded-lg bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-success)] text-xs font-medium hover:bg-[var(--md-sys-color-surface-variant)] transition-all flex items-center gap-1.5 shadow-sm"
          >
            {service.status === "active" ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {service.status === "active" ? "Pause" : "Activate"}
          </button>
        </div>
      </div>

      {/* Content - MD3 Card Content */}
      <div className="p-3.5 md:p-4">
        {/* Title */}
        <div className="flex items-start gap-2 mb-2">
          <h3 className="font-medium text-sm md:text-base line-clamp-2 flex-1 min-w-0 text-[var(--md-sys-color-on-surface)]">
            {service.name}
          </h3>
          {service.bookings && service.bookings > 10 && (
            <span className="shrink-0 px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[9px] font-medium rounded-full flex items-center gap-0.5">
              <i className="fas fa-fire text-[8px]" />
              Popular
            </span>
          )}
        </div>

        {/* Duration & Location */}
        <div className="flex flex-wrap gap-2 md:gap-3 text-[11px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] mb-2.5 md:mb-3">
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-[var(--md-sys-color-surface)] flex items-center justify-center">
              <i className="fas fa-clock text-[var(--md-sys-color-primary)] text-[9px]" />
            </div>
            {service.duration || "TBD"}
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-[var(--md-sys-color-surface)] flex items-center justify-center">
              <i className={`fas ${getLocationIcon(service.location || "")} text-[var(--md-sys-color-primary)] text-[9px]`} />
            </div>
            <span className="truncate max-w-[100px] md:max-w-[120px]">{service.location || "TBD"}</span>
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2.5 md:mb-3">
          {service.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-md text-[10px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium"
            >
              {tag}
            </span>
          ))}
          {service.tags && service.tags.length > 3 && (
            <span className="px-2 py-0.5 text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
              +{service.tags.length - 3}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-3 md:mb-4">
          <span className="text-[10px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium uppercase tracking-wider">From</span>
          <span className="text-lg md:text-xl font-semibold text-[var(--md-sys-color-primary)]">
            {formatCurrency(service.priceMin ?? 0)}
          </span>
          {service.priceMax != null && service.priceMin != null && service.priceMax > service.priceMin && (
            <span className="text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)]">
              – {formatCurrency(service.priceMax)}
            </span>
          )}
        </div>

        {/* Footer Stats & Actions */}
        <div className="flex justify-between items-center pt-2.5 md:pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <div className="flex gap-2.5 md:gap-3 text-[10px] md:text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium">
            <span className="flex items-center gap-1" title={`${service.bookings || 0} bookings`}>
              <CalendarCheck className="w-3 h-3 text-[#8b5cf6]" />
              {service.bookings || 0}
            </span>
            <span className="flex items-center gap-1" title={`${service.views || 0} views`}>
              <Eye className="w-3 h-3 text-[#8b5cf6]" />
              {service.views || 0}
            </span>
            {service.rating && (
              <span className="flex items-center gap-1" title={`${service.rating.toFixed(1)} rating`}>
                <Star className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" />
                {service.rating.toFixed(1)}
              </span>
            )}
          </div>

          {!bulkMode && (
            <div className="flex gap-1 md:gap-1.5">
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
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-16 md:py-24 text-[var(--md-sys-color-on-surface-variant)] animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center mb-4">
        <i className="fas fa-th-large text-3xl md:text-4xl text-[var(--md-sys-color-on-surface-variant)]/50" />
      </div>
      <p className="text-base md:text-lg font-medium text-[var(--md-sys-color-on-surface)] mb-1">No services found</p>
      <p className="text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)] max-w-xs text-center">
        Try adjusting your filters or add a new service to get started.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServiceGridView({
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
}: ServiceGridViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {services.map((service, index) => (
        <ServiceCard
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