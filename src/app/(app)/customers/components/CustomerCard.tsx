"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Customer } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerCardProps {
  customer: Customer;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelection: (customerId: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSendWhatsApp: (phone: string) => void;
  onShareWhatsApp: (customer: Customer) => void;
  onDuplicate: (customer: Customer) => void;
  onPrintProfile: (customer: Customer) => void;
  onBulkActivate: (customerId: string) => void;
  onBulkSetVIP: (customerId: string) => void;
  onBulkDelete: (customerId: string) => void;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
  formatCurrency: (amount: number) => string;
  index?: number; // For staggered animation
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string; icon: string }> = {
  vip: { bg: "bg-[#f59e0b]/10", dot: "bg-[#f59e0b]", label: "VIP", icon: "fa-crown" },
  active: { bg: "bg-[#10b981]/10", dot: "bg-[#10b981]", label: "Active", icon: "fa-check" },
  new: { bg: "bg-[#3b82f6]/10", dot: "bg-[#3b82f6]", label: "New", icon: "fa-star" },
  inactive: { bg: "bg-[#64748b]/10", dot: "bg-[#64748b]", label: "Inactive", icon: "fa-moon" },
};

const ACTIONS = [
  { id: "message", label: "Message", icon: "fab fa-whatsapp", color: "text-[#25D366]", bg: "bg-[#DCF8C6]", hover: "hover:bg-[#25D366] hover:text-white" },
  { id: "share", label: "Share", icon: "fas fa-share-alt", color: "text-on-surface-variant", bg: "bg-surface-variant", hover: "hover:bg-[#25D366] hover:text-white" },
  { id: "duplicate", label: "Duplicate", icon: "fas fa-copy", color: "text-on-surface-variant", bg: "bg-surface-variant", hover: "hover:bg-[#3b82f6] hover:text-white" },
  { id: "print", label: "Print", icon: "fas fa-print", color: "text-on-surface-variant", bg: "bg-surface-variant", hover: "hover:bg-[#3b82f6] hover:text-white" },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({ value, label, icon, color, delay = 0 }: {
  value: string;
  label: string;
  icon: string;
  color: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`
      text-center p-2.5 rounded-lg bg-surface border border-outline-variant
      transition-all duration-300
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
    `}>
      <div className={`text-xs ${color} mb-0.5`}>
        <i className={`fas ${icon}`} />
      </div>
      <div className={`font-extrabold text-base md:text-lg ${color}`}>{value}</div>
      <div className="text-[9px] md:text-[10px] text-outline uppercase font-bold tracking-wider">{label}</div>
    </div>
  );
}

function ActionMenu({
  customer,
  onSendWhatsApp,
  onShareWhatsApp,
  onDuplicate,
  onPrintProfile,
}: {
  customer: Customer;
  onSendWhatsApp: (phone: string) => void;
  onShareWhatsApp: (customer: Customer) => void;
  onDuplicate: (customer: Customer) => void;
  onPrintProfile: (customer: Customer) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (actionId: string) => {
    setIsOpen(false);
    switch (actionId) {
      case "message": onSendWhatsApp(customer.phone); break;
      case "share": onShareWhatsApp(customer); break;
      case "duplicate": onDuplicate(customer); break;
      case "print": onPrintProfile(customer); break;
    }
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`
          w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200
          ${isOpen
            ? "bg-[#8b5cf6] text-white shadow-md"
            : "text-on-surface-variant hover:bg-surface-variant"
          }
        `}
      >
        <i className={`fas fa-ellipsis-v text-xs ${isOpen ? "rotate-90" : ""} transition-transform`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-surface rounded-xl border border-outline-variant shadow-xl z-50 overflow-hidden animate-fadeIn">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                handleAction(action.id);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-on-surface-variant
                hover:bg-surface transition-colors text-left
              `}
            >
              <div className={`w-7 h-7 rounded-lg ${action.bg} ${action.color} flex items-center justify-center`}>
                <i className={action.icon} />
              </div>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerCard({
  customer,
  bulkMode,
  isSelected,
  onToggleSelection,
  onSelectCustomer,
  onSendWhatsApp,
  onShareWhatsApp,
  onDuplicate,
  onPrintProfile,
  onBulkActivate,
  onBulkSetVIP,
  onBulkDelete,
  getColorFromString,
  getInitials,
  formatCurrency,
  index = 0,
}: CustomerCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const statusConfig = STATUS_CONFIG[customer.status || "inactive"] || STATUS_CONFIG.inactive;

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const handleCardClick = useCallback(() => {
    if (!bulkMode) onSelectCustomer(customer);
  }, [bulkMode, customer, onSelectCustomer]);

  const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection(customer.id);
  }, [customer.id, onToggleSelection]);

  return (
    <div
      className={`
        group relative bg-surface rounded-xl border border-outline-variant p-4 md:p-5
        transition-all duration-300 ease-out cursor-pointer overflow-hidden
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}
        ${!bulkMode && isHovered ? "shadow-xl -translate-y-1" : "shadow-sm hover:shadow-md"}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Top accent line on hover */}
      {!bulkMode && (
        <div className={`
          absolute top-0 left-4 right-4 h-[2px] rounded-full bg-[#8b5cf6]
          transition-opacity duration-300
          ${isHovered ? "opacity-100" : "opacity-0"}
        `} />
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-3 md:mb-4">
        <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
          {/* Bulk checkbox */}
          {bulkMode && (
            <div className="relative shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                className="peer sr-only"
              />
              <div
                onClick={handleCheckboxClick}
                className={`
                  w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer
                  transition-all duration-200
                  ${isSelected
                    ? "bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] shadow-sm text-[var(--md-sys-color-on-primary)]"
                    : "border-[var(--md-sys-color-outline)] bg-[var(--md-sys-color-surface)] hover:border-[var(--md-sys-color-primary)]"
                  }
                `}
              >
                {isSelected && <i className="fas fa-check text-white text-[10px]" />}
              </div>
            </div>
          )}

          {/* Avatar */}
          <div className={`
            w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)}
            flex items-center justify-center font-medium text-base md:text-lg text-white
            shrink-0 relative transition-transform duration-300
            ${isHovered && !bulkMode ? "scale-110" : "scale-100"}
          `}>
            {getInitials(customer.name)}
            
            {/* Status dot */}
            <div className={`
              absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-white
              ${statusConfig.dot} shadow-sm
            `}>
              <i className={`fas ${statusConfig.icon} text-white text-[6px] md:text-[7px] absolute inset-0 flex items-center justify-center`} />
            </div>
          </div>

          {/* Name & Status */}
          <div className="min-w-0">
            <div className="font-medium text-sm md:text-base text-[var(--md-sys-color-on-surface)] truncate flex items-center gap-1.5">
              {customer.name}
              {customer.status === "vip" && (
                <i className="fas fa-crown text-[var(--md-sys-color-warning)] text-xs shrink-0" title="VIP Customer" />
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`
                inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wider
                ${statusConfig.bg} ${statusConfig.dot.replace("bg-", "text-").replace("[", "").replace("]", "")}
              `}>
                <span className={`w-1 h-1 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
              {customer.services && customer.services.length > 0 && (
                <span className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
                  {customer.services.length} service{customer.services.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!bulkMode ? (
          <ActionMenu
            customer={customer}
            onSendWhatsApp={onSendWhatsApp}
            onShareWhatsApp={onShareWhatsApp}
            onDuplicate={onDuplicate}
            onPrintProfile={onPrintProfile}
          />
        ) : null}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3 md:mb-4 p-2.5 md:p-3 bg-[var(--md-sys-color-surface)] rounded-lg border border-[var(--md-sys-color-outline-variant)]">
        <StatCard
          value={formatCurrency(customer.totalSpent || 0)}
          label="Spent"
          icon="fa-wallet"
          color="text-[#25D366]"
          delay={index * 80 + 100}
        />
        <StatCard
          value={(customer.visits || 0).toString()}
          label="Visits"
          icon="fa-calendar-check"
          color="text-[#8b5cf6]"
          delay={index * 80 + 200}
        />
        <StatCard
          value={customer.rating ? customer.rating.toFixed(1) : "-"}
          label="Rating"
          icon="fa-star"
          color="text-[#f59e0b]"
          delay={index * 80 + 300}
        />
      </div>

      {/* Contact Info */}
      <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
        <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)]">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center shrink-0">
            <i className="fab fa-whatsapp text-[#25D366] text-xs" />
          </div>
          <span className="truncate font-medium">{customer.phone}</span>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center shrink-0">
              <i className="fas fa-envelope text-[var(--md-sys-color-primary)] text-xs" />
            </div>
            <span className="truncate">{customer.email}</span>
          </div>
        )}
        {customer.location && (
          <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)]">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center shrink-0">
              <i className="fas fa-map-marker-alt text-[var(--md-sys-color-warning)] text-xs" />
            </div>
            <span className="truncate">{customer.location}</span>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {!bulkMode ? (
        <div className="grid grid-cols-4 gap-1.5 md:gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={(e) => {
                e.stopPropagation();
                switch (action.id) {
                  case "message": onSendWhatsApp(customer.phone); break;
                  case "share": onShareWhatsApp(customer); break;
                  case "duplicate": onDuplicate(customer); break;
                  case "print": onPrintProfile(customer); break;
                }
              }}
              className={`
                py-2 px-1.5 md:px-2 rounded-xl text-xs font-bold
                flex flex-col md:flex-row items-center justify-center gap-1 md:gap-1.5
                transition-all duration-200 active:scale-95
                ${action.bg} ${action.color} ${action.hover}
              `}
              title={action.label}
            >
              <i className={action.icon} />
              <span className="hidden lg:inline">{action.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onBulkActivate(customer.id); }}
            className="py-2 px-2 rounded-xl bg-[#10b981]/10 text-[#10b981] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#10b981] hover:text-white transition-all active:scale-95"
          >
            <i className="fas fa-check" />
            <span className="hidden sm:inline">Activate</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBulkSetVIP(customer.id); }}
            className="py-2 px-2 rounded-xl bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#f59e0b] hover:text-white transition-all active:scale-95"
          >
            <i className="fas fa-crown" />
            <span className="hidden sm:inline">VIP</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onBulkDelete(customer.id); }}
            className="py-2 px-2 rounded-xl bg-[#ef4444]/10 text-[#ef4444] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#ef4444] hover:text-white transition-all active:scale-95"
          >
            <i className="fas fa-trash" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}