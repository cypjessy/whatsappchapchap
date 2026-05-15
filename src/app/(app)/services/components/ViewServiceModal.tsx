"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import {
  X,
  Copy,
  Check,
  ExternalLink,
  Clock,
  CalendarCheck,
  Eye,
  Star,
  MapPin,
  Video,
  User,
  ArrowRightLeft,
  Link2,
  Tag,
  AlignLeft,
  Store,
  DollarSign,
  SlidersHorizontal,
  Images,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViewServiceModalProps {
  service: Service | null;
  open: boolean;
  onClose: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BUSINESS_TYPE_NAMES: Record<string, string> = {
  beauty: "Beauty & Hair",
  home: "Home Services",
  health: "Health & Wellness",
  education: "Education",
  automotive: "Automotive",
  events: "Events",
  tech: "Tech Support",
  fitness: "Fitness",
  cleaning: "Cleaning",
  photography: "Photography",
  catering: "Catering",
  medical: "Hospital & Medical",
  other: "Other Services",
};

const MODE_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  "in-person": { label: "In-Person", icon: User },
  remote: { label: "Remote/Video", icon: Video },
  both: { label: "Both Options", icon: ArrowRightLeft },
};

const LOCATION_LABELS: Record<string, string> = {
  "client-place": "Client's Place",
  "my-place": "My Studio/Shop",
  "both-places": "Both Options",
  remote: "Online/Remote Only",
};

const TIER_CONFIG = {
  basic: {
    label: "Starter",
    badge: "Basic",
    color: "from-gray-400 to-gray-600",
    bgColor: "bg-white",
    borderColor: "border-gray-200",
    textColor: "text-gray-600",
  },
  standard: {
    label: "Standard",
    badge: "Popular",
    color: "from-[#8b5cf6] to-[#7c3aed]",
    bgColor: "bg-[#ede9fe]",
    borderColor: "border-[#8b5cf6]",
    textColor: "text-[#8b5cf6]",
  },
  premium: {
    label: "Premium",
    badge: "Best",
    color: "from-[#f59e0b] to-[#d97706]",
    bgColor: "bg-[#fef3c7]",
    borderColor: "border-[#f59e0b]",
    textColor: "text-[#f59e0b]",
  },
} as const;

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  active: { bg: "bg-[#10b981]/20", dot: "bg-[#10b981]", label: "Active" },
  paused: { bg: "bg-[#f59e0b]/20", dot: "bg-[#f59e0b]", label: "Paused" },
  draft: { bg: "bg-[#64748b]/20", dot: "bg-[#64748b]", label: "Draft" },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  icon: Icon,
  delay = 0,
}: {
  value: string | number;
  label: string;
  icon: React.ElementType;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        text-center p-3 md:p-4 bg-white rounded-xl border border-[#e2e8f0]
        hover:bg-[#ede9fe] hover:border-[#8b5cf6]/30 hover:-translate-y-0.5
        transition-all duration-300 cursor-default
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="text-xl md:text-2xl font-extrabold text-[#8b5cf6] mb-1">{value}</div>
      <div className="flex items-center justify-center gap-1 text-[10px] md:text-xs text-[#64748b] font-semibold uppercase tracking-wider">
        <Icon className="w-3 h-3" />
        {label}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3 md:mb-4">
      <div className="w-7 h-7 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-[#8b5cf6]" />
      </div>
      <span className="text-[11px] md:text-xs font-bold text-[#64748b] uppercase tracking-wider">
        {title}
      </span>
    </div>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm
        transition-all duration-200 active:scale-95
        ${copied
          ? "bg-[#10b981] text-white"
          : "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-md shadow-[#8b5cf6]/25"
        }
      `}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

function ImageGallery({ images, serviceName }: { images: string[]; serviceName: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const nextImage = () => setLightboxIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length));
  const prevImage = () => setLightboxIndex((prev) => (prev === null ? 0 : (prev - 1 + images.length) % images.length));

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, images.length]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        {images.map((url, idx) => (
          <button
            key={idx}
            onClick={() => openLightbox(idx)}
            className="aspect-square rounded-xl overflow-hidden bg-white group relative"
          >
            <img
              src={url}
              alt={`${serviceName} portfolio ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fadeIn"
          onClick={closeLightbox}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={images[lightboxIndex]}
              alt={`${serviceName} full view`}
              className="w-full h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/40 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-white text-sm font-bold">
                {lightboxIndex + 1} / {images.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/40 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/40 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ViewServiceModal({ service, open, onClose }: ViewServiceModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Close handlers with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, handleClose]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, handleClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Scroll progress
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setScrollProgress(progress);
  }, []);

  if (!open || !service) return null;

  const statusConfig = STATUS_CONFIG[service.status || "active"] || STATUS_CONFIG.active;

  const packagePrices = service.packagePrices || {
    basic: service.priceMin || 0,
    standard: Math.round((service.priceMin || 0) * 1.5),
    premium: Math.round((service.priceMin || 0) * 2),
  };

  const defaultFeatures = {
    basic: ["Core service included", "Professional quality"],
    standard: ["Everything in Basic", "Priority scheduling", "Enhanced support"],
    premium: ["Everything in Standard", "VIP treatment", "24/7 support"],
  };

  const packageFeatures = service.packageFeatures || defaultFeatures;

  const ModeIcon = MODE_LABELS[service.mode]?.icon || User;

  return (
    <div
      className={`
        fixed inset-0 z-[2000] flex items-center justify-center p-2 md:p-4
        bg-black/60 backdrop-blur-sm
        transition-all duration-200
        ${isClosing ? "opacity-0" : "opacity-100 animate-fadeIn"}
      `}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className={`
          relative bg-white rounded-xl md:rounded-2xl w-full max-w-[800px] max-h-[92vh]
          overflow-hidden shadow-2xl flex flex-col
          transition-all duration-300
          ${isClosing ? "scale-95 opacity-0 translate-y-4" : "scale-100 opacity-100 translate-y-0"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scroll progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#e2e8f0] z-30">
          <div
            className="h-full bg-[#8b5cf6] rounded-full transition-all duration-150"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>

        {/* Hero Header */}
        <div className={`
          relative h-48 md:h-56 overflow-hidden shrink-0
          bg-gradient-to-br ${service.bgGradient || "from-[#8b5cf6] to-[#7c3aed]"}
        `}>
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 text-8xl">{service.emoji || "✨"}</div>
            <div className="absolute bottom-4 right-4 text-6xl opacity-50">{service.emoji || "✨"}</div>
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2">
              <span className={`
                inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md
                ${statusConfig.bg}
              `}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${service.status === "active" ? "animate-pulse" : ""}`} />
                {statusConfig.label}
              </span>
              <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white/90">
                {BUSINESS_TYPE_NAMES[service.businessType] || service.businessType}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{service.name}</h1>
            {service.providerName && (
              <p className="text-sm text-white/80 font-medium">by {service.providerName}</p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 hover:rotate-90 transition-all duration-300 z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto flex-1 scroll-smooth"
          onScroll={handleScroll}
        >
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 p-4 md:p-6 border-b border-[#e2e8f0]">
            <StatCard
              value={service.duration || "—"}
              label="Duration"
              icon={Clock}
              delay={0}
            />
            <StatCard
              value={service.bookings || 0}
              label="Bookings"
              icon={CalendarCheck}
              delay={80}
            />
            <StatCard
              value={service.views || 0}
              label="Views"
              icon={Eye}
              delay={160}
            />
            <StatCard
              value={service.rating ? service.rating.toFixed(1) : "—"}
              label={service.rating ? "Rating" : "No Ratings"}
              icon={Star}
              delay={240}
            />
          </div>

          {/* Description */}
          {service.description && (
            <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
              <SectionHeader icon={AlignLeft} title="Description" />
              <p className="text-sm text-[#64748b] leading-relaxed">{service.description}</p>
            </div>
          )}

          {/* Provider */}
          {service.providerName && (
            <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
              <SectionHeader icon={Store} title="Business / Provider" />
              <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#e2e8f0]">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center text-xl shadow-sm">
                  {service.emoji || "✨"}
                </div>
                <div>
                  <div className="font-bold text-[#1e293b]">{service.providerName}</div>
                  <div className="text-xs text-[#64748b]">Service Provider</div>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {service.tags && service.tags.length > 0 && (
            <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
              <SectionHeader icon={Tag} title="Tags" />
              <div className="flex flex-wrap gap-2">
                {service.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-lg text-xs font-semibold text-[#64748b] flex items-center gap-1.5 hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
                  >
                    <Tag className="w-3 h-3 text-[#8b5cf6]" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Tiers */}
          <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
            <SectionHeader icon={DollarSign} title="Pricing Packages" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {(["basic", "standard", "premium"] as const).map((tier) => {
                const config = TIER_CONFIG[tier];
                const isFeatured = tier === "standard";
                return (
                  <div
                    key={tier}
                    className={`
                      relative rounded-xl p-4 border-2 transition-all duration-300
                      ${isFeatured
                        ? `${config.bgColor} ${config.borderColor} shadow-md`
                        : "bg-white border-[#e2e8f0] hover:border-[#cbd5e1]"
                      }
                      hover:-translate-y-0.5 hover:shadow-lg
                    `}
                  >
                    {isFeatured && (
                      <div className="absolute -top-2 left-4 px-2.5 py-0.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white text-[9px] font-bold uppercase rounded-full shadow-sm">
                        Popular
                      </div>
                    )}
                    <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${config.textColor}`}>
                      {config.label}
                    </div>
                    <div className="text-2xl md:text-3xl font-extrabold text-[#1e293b] mb-1">
                      {formatCurrency(packagePrices[tier] || 0)}
                    </div>
                    <div className="text-[11px] text-[#94a3b8] mb-3 pb-3 border-b border-[#e2e8f0]">
                      {service.selectedDuration && !isNaN(service.selectedDuration)
                        ? `${service.selectedDuration} min`
                        : service.duration?.match(/(\d+)/)?.[1]
                          ? `${service.duration.match(/(\d+)/)![1]} min`
                          : "Duration TBD"}
                    </div>
                    <ul className="space-y-2">
                      {(packageFeatures[tier] || defaultFeatures[tier]).map((feature: string, idx: number) => (
                        <li key={idx} className="text-xs text-[#64748b] flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-[#10b981]/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 text-[#10b981]" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service Mode & Location */}
          <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
            <SectionHeader icon={MapPin} title="Service Delivery" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 bg-white rounded-xl border border-[#e2e8f0]">
                <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Mode</div>
                <div className="font-bold text-[#1e293b] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                    <ModeIcon className="w-4 h-4 text-[#8b5cf6]" />
                  </div>
                  {MODE_LABELS[service.mode]?.label || service.mode}
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#e2e8f0]">
                <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Location</div>
                <div className="font-bold text-[#1e293b] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#8b5cf6]" />
                  </div>
                  {LOCATION_LABELS[service.location] || service.location}
                </div>
              </div>
            </div>
          </div>

          {/* Availability */}
          {service.availability?.days && service.availability.days.length > 0 && (
            <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
              <SectionHeader icon={CalendarCheck} title="Availability" />
              <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-4">
                {DAY_NAMES.map((day, idx) => {
                  const isAvailable = service.availability?.days.includes(day);
                  return (
                    <div
                      key={day}
                      className={`
                        text-center p-2 md:p-3 rounded-xl transition-all
                        ${isAvailable
                          ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20"
                          : "bg-white text-[#94a3b8] opacity-50"
                        }
                      `}
                    >
                      <div className="text-[9px] md:text-[10px] font-bold uppercase mb-0.5">{day}</div>
                      <div className="text-xs md:text-sm font-bold">
                        {isAvailable ? <Check className="w-3 h-3 mx-auto" /> : "—"}
                      </div>
                    </div>
                  );
                })}
              </div>
              {service.availability.timeSlots && service.availability.timeSlots.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Time Slots</div>
                  <div className="flex flex-wrap gap-2">
                    {service.availability.timeSlots.slice(0, 8).map((time, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-white border border-[#e2e8f0] rounded-lg text-[11px] font-semibold text-[#64748b]"
                      >
                        {time}
                      </span>
                    ))}
                    {service.availability.timeSlots.length > 8 && (
                      <span className="px-2.5 py-1 bg-[#ede9fe] text-[#8b5cf6] rounded-lg text-[11px] font-bold">
                        +{service.availability.timeSlots.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Specifications */}
          {service.specifications && Object.keys(service.specifications).length > 0 && (
            <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
              <SectionHeader icon={SlidersHorizontal} title="Specifications" />
              <div className="space-y-4">
                {Object.entries(service.specifications).map(([key, values]) => (
                  <div key={key} className="pb-3 border-b border-[#f1f5f9] last:border-0 last:pb-0">
                    <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wider mb-2 capitalize">
                      {key.replace(/_/g, " ")}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(values as string[]).map((val: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 bg-[#ede9fe] text-[#7c3aed] rounded-lg text-xs font-medium border border-[#8b5cf6]/10"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio Images */}
          {service.portfolioImages && service.portfolioImages.length > 0 && (
            <div className="p-4 md:p-6 border-b border-[#e2e8f0]">
              <SectionHeader icon={Images} title={`Portfolio (${service.portfolioImages.length})`} />
              <ImageGallery images={service.portfolioImages} serviceName={service.name} />
            </div>
          )}

          {/* Booking Link */}
          {service.bookingUrl && (
            <div className="p-4 md:p-6">
              <SectionHeader icon={Link2} title="Booking Link" />
              <div className="p-4 bg-[#ede9fe] rounded-xl border-2 border-[#8b5cf6]/30">
                <div className="flex items-center gap-3 mb-3">
                  <code className="text-sm text-[#7c3aed] break-all flex-1 font-mono bg-white/50 px-3 py-2 rounded-lg">
                    {service.bookingUrl}
                  </code>
                  <CopyButton text={service.bookingUrl} />
                </div>
                <p className="text-xs text-[#64748b]">
                  Share this link with clients to let them book appointments directly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-[#e2e8f0] bg-white shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-95"
            >
              Close
            </button>
            {service.bookingUrl && (
              <CopyButton text={service.bookingUrl} label="Copy Link" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}