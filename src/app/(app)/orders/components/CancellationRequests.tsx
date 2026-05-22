"use client";

import { useState, useMemo, useCallback } from "react";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CancellationRequest {
  id: string;
  orderId: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: any;
  customerPhone: string;
  orderData?: {
    customerName: string;
    total: number;
  };
  reason?: string;
  responseNote?: string;
  respondedAt?: any;
}

interface CancellationRequestsProps {
  cancellationRequests: CancellationRequest[];
  cancellationFilter: "all" | "pending" | "approved" | "rejected";
  setCancellationFilter: (filter: "all" | "pending" | "approved" | "rejected") => void;
  onAction: (requestId: string, orderId: string, action: "approve" | "reject") => void;
  isLoading?: boolean;
}

// ─── M3 Color Tokens ──────────────────────────────────────────────────────────

const M3 = {
  surface: "#FFFBFF",
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#49454F",
  outline: "#79747E",
  outlineLight: "#CAC4D0",
  surfaceVariant: "#E7E0EC",
  primary: "#25D366",
  primaryContainer: "#DCF8C6",
  onPrimary: "#FFFFFF",
  error: "#BA1A1A",
  errorContainer: "#FFDAD6",
  hoverBg: "#F5F5F5",
} as const;

const STATUS_STYLE: Record<string, { bg: string; text: string; container: string; icon: string; label: string }> = {
  pending: {
    bg: M3.errorContainer,
    text: M3.error,
    container: "#FFDAD6",
    icon: "fa-hourglass-half",
    label: "Pending",
  },
  approved: {
    bg: M3.primaryContainer,
    text: "#1C6B3E",
    container: M3.primaryContainer,
    icon: "fa-check-circle",
    label: "Approved",
  },
  rejected: {
    bg: M3.surfaceVariant,
    text: M3.onSurfaceVariant,
    container: M3.surfaceVariant,
    icon: "fa-times-circle",
    label: "Rejected",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: any): string {
  if (!date) return "N/A";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(date: any): string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(date: any): string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(date: any): string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-[#FFFBFF] rounded-2xl p-5 animate-pulse shadow-sm border border-[#CAC4D0]/30">
      <div className="flex items-start justify-between mb-5">
        <div className="space-y-2.5">
          <div className="h-5 w-28 bg-[#E7E0EC] rounded" />
          <div className="h-3 w-36 bg-[#E7E0EC]/60 rounded" />
        </div>
        <div className="h-7 w-20 bg-[#E7E0EC] rounded-full" />
      </div>
      <div className="space-y-3 mb-5">
        <div className="h-10 bg-[#E7E0EC]/40 rounded-xl" />
        <div className="h-10 bg-[#E7E0EC]/40 rounded-xl" />
        <div className="h-14 bg-[#E7E0EC]/40 rounded-xl" />
      </div>
      <div className="h-12 bg-[#E7E0EC]/40 rounded-xl" />
    </div>
  );
}

function SkeletonFilter() {
  return (
    <div className="flex gap-2 flex-wrap">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 w-24 bg-[#E7E0EC] rounded-full animate-pulse" />
      ))}
    </div>
  );
}

// ─── M3 Dialog ────────────────────────────────────────────────────────────────

function ConfirmModal({
  isOpen, onClose, onConfirm, title, message, confirmText, isDestructive,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  isDestructive: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-6 animate-fadeIn">
      {/* Scrim */}
      <div className="absolute inset-0 bg-[#1C1B1F]/40" onClick={onClose} />

      {/* Dialog surface */}
      <div
        className="relative bg-[#FFFBFF] rounded-[28px] shadow-2xl w-full max-w-sm p-6 animate-slideUp"
        style={{ animationDuration: "250ms" }}
      >
        {/* Icon */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 ${
            isDestructive ? "bg-[#FFDAD6]" : "bg-[#DCF8C6]"
          }`}
        >
          <i
            className={`fas fa-exclamation-triangle text-lg ${
              isDestructive ? "text-[#BA1A1A]" : "text-[#25D366]"
            }`}
          />
        </div>

        {/* Headline */}
        <h2 className="text-[#1C1B1F] text-xl font-bold text-center mb-2">
          {title}
        </h2>

        {/* Body */}
        <p className="text-[#49454F] text-sm text-center leading-relaxed mb-6">
          {message}
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-full border-2 border-[#79747E] text-[#1C1B1F] font-semibold text-sm hover:bg-[#F5F5F5] transition-all duration-150 active:scale-[0.97]"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-12 rounded-full font-semibold text-sm transition-all duration-150 active:scale-[0.97] shadow-sm hover:shadow-md ${
              isDestructive
                ? "bg-[#BA1A1A] text-white hover:bg-[#9C1010]"
                : "bg-[#25D366] text-white hover:bg-[#1EA952]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ filter, searchQuery }: { filter: string; searchQuery: string }) {
  const getMessage = () => {
    if (searchQuery) {
      return { title: "No results found", desc: `No cancellation requests match "${searchQuery}"` };
    }
    switch (filter) {
      case "all":
        return { title: "No cancellation requests", desc: "No cancellation requests have been submitted yet." };
      case "pending":
        return { title: "All clear", desc: "All pending requests have been processed. Great job!" };
      case "approved":
        return { title: "No approved requests", desc: "No requests have been approved yet." };
      case "rejected":
        return { title: "No rejected requests", desc: "No requests have been rejected yet." };
      default:
        return { title: "No requests", desc: "No requests found." };
    }
  };

  const msg = getMessage();

  return (
    <div className="p-10 text-center animate-fadeIn">
      <div className="w-20 h-20 rounded-full bg-[#E7E0EC] flex items-center justify-center mx-auto mb-5">
        <i className="fas fa-inbox text-2xl text-[#49454F]" />
      </div>
      <h3 className="text-[#1C1B1F] text-xl font-bold mb-1.5">{msg.title}</h3>
      <p className="text-[#49454F] text-sm max-w-xs mx-auto">{msg.desc}</p>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  request, onConfirmAction, index = 0,
}: {
  request: CancellationRequest;
  onConfirmAction: (request: CancellationRequest, action: "approve" | "reject") => void;
  index?: number;
}) {
  const status = STATUS_STYLE[request.status];
  const isPending = request.status === "pending";

  return (
    <div
      className="bg-[#FFFBFF] rounded-2xl border border-[#CAC4D0]/40 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden animate-fadeIn"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Top accent bar */}
      <div className={`h-1.5 w-full ${isPending ? "bg-[#FFDAD6]" : status.bg}`} />

      <div className="p-4 sm:p-5">
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[#1C1B1F] text-base font-bold truncate">
                {request.orderId}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#49454F]/70 mt-1">
              <i className="fas fa-calendar text-[10px]" />
              <span>{formatDate(request.requestedAt)}</span>
              <span className="text-[#CAC4D0]">•</span>
              <span>{timeAgo(request.requestedAt)}</span>
            </div>
          </div>

          {/* M3 tonal status chip */}
          <span
            className={`flex-shrink-0 h-7 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold`}
            style={{ backgroundColor: status.bg, color: status.text }}
          >
            <i className={`fas ${status.icon} text-[10px]`} />
            {status.label}
          </span>
        </div>

        {/* ── Customer info rows ── */}
        <div className="space-y-2 mb-4">
          {/* Customer name */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#E7E0EC]/30">
            <div className="w-8 h-8 rounded-full bg-[#FFFBFF] flex items-center justify-center shadow-sm flex-shrink-0">
              <i className="fas fa-user text-xs text-[#49454F]/60" />
            </div>
            <span className="text-[#1C1B1F] text-sm font-medium truncate">
              {request.orderData?.customerName || "Unknown Customer"}
            </span>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#E7E0EC]/30">
            <div className="w-8 h-8 rounded-full bg-[#FFFBFF] flex items-center justify-center shadow-sm flex-shrink-0">
              <i className="fas fa-phone-alt text-xs text-[#49454F]/60" />
            </div>
            <span className="text-[#1C1B1F] text-sm font-medium truncate">
              {request.customerPhone || "N/A"}
            </span>
          </div>

          {/* Amount - highlighted */}
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-[#DCF8C6]/50 border border-[#DCF8C6]">
            <div className="w-8 h-8 rounded-full bg-[#FFFBFF] flex items-center justify-center shadow-sm flex-shrink-0">
              <i className="fas fa-coins text-xs text-[#25D366]" />
            </div>
            <div>
              <div className="text-[#49454F] text-[11px] font-medium uppercase tracking-wide">
                Refund Amount
              </div>
              <div className="text-[#1C1B1F] text-lg font-bold">
                {formatCurrency(request.orderData?.total || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reason ── */}
        {request.reason && (
          <div className="mb-4 px-3 py-3 rounded-xl bg-[#E7E0EC]/30 border border-[#CAC4D0]/30">
            <div className="flex items-start gap-2.5">
              <i className="fas fa-quote-left text-[#49454F]/40 mt-0.5 text-sm flex-shrink-0" />
              <div>
                <span className="text-[#49454F] text-[11px] font-semibold uppercase tracking-wide block mb-0.5">
                  Reason
                </span>
                <span className="text-[#1C1B1F] text-sm leading-relaxed">
                  {request.reason}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Response Note ── */}
        {request.responseNote && (
          <div
            className="mb-4 px-3 py-3 rounded-xl border"
            style={{
              backgroundColor: request.status === "approved" ? "#DCF8C6" : "#E7E0EC",
              borderColor: request.status === "approved" ? "#DCF8C6" : "#CAC4D0",
            }}
          >
            <div className="flex items-start gap-2.5">
              <i
                className={`fas ${
                  request.status === "approved" ? "fa-check-circle text-[#1C6B3E]" : "fa-comment-slash text-[#49454F]"
                } mt-0.5 text-sm flex-shrink-0`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[#1C1B1F] text-[11px] font-semibold uppercase tracking-wide block mb-0.5">
                  Response
                </span>
                <span className="text-[#1C1B1F] text-sm">{request.responseNote}</span>
                {request.respondedAt && (
                  <div className="text-[#49454F]/60 text-[11px] mt-1 flex items-center gap-1">
                    <i className="fas fa-clock text-[10px]" />
                    {formatDateTime(request.respondedAt)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {isPending ? (
          <div className="flex gap-2.5">
            <button
              onClick={() => onConfirmAction(request, "approve")}
              className="flex-1 h-12 rounded-full bg-[#25D366] text-white font-semibold text-sm shadow-sm hover:bg-[#1EA952] hover:shadow-md transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 touch-manipulation"
            >
              <i className="fas fa-check-circle text-sm" />
              <span>Approve & Refund</span>
            </button>
            <button
              onClick={() => onConfirmAction(request, "reject")}
              className="flex-1 h-12 rounded-full border-2 border-[#CAC4D0] text-[#49454F] font-semibold text-sm hover:bg-[#F5F5F5] hover:border-[#79747E] transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2 touch-manipulation"
            >
              <i className="fas fa-times-circle text-sm" />
              <span>Reject</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#E7E0EC]/30 text-[#49454F]/70 text-xs font-medium">
            <i className="fas fa-check-double" />
            <span>Processed {formatDate(request.respondedAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CancellationRequests({
  cancellationRequests, cancellationFilter, setCancellationFilter, onAction, isLoading = false,
}: CancellationRequestsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean; request: CancellationRequest | null; action: "approve" | "reject" | null;
  }>({ isOpen: false, request: null, action: null });

  // ─── Filter, search, sort ───────────────────────────────────────────────────

  const filteredRequests = useMemo(() => {
    let result = [...cancellationRequests];
    if (cancellationFilter !== "all") {
      result = result.filter((r) => r.status === cancellationFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.orderId.toLowerCase().includes(q) ||
          r.customerPhone.toLowerCase().includes(q) ||
          r.orderData?.customerName?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (b.requestedAt?.toDate?.() || new Date(0)).getTime() - (a.requestedAt?.toDate?.() || new Date(0)).getTime();
        case "oldest":
          return (a.requestedAt?.toDate?.() || new Date(0)).getTime() - (b.requestedAt?.toDate?.() || new Date(0)).getTime();
        case "amount":
          return (b.orderData?.total || 0) - (a.orderData?.total || 0);
        default:
          return 0;
      }
    });
    return result;
  }, [cancellationRequests, cancellationFilter, searchQuery, sortBy]);

  const counts = useMemo(() => ({
    all: cancellationRequests.length,
    pending: cancellationRequests.filter((r) => r.status === "pending").length,
    approved: cancellationRequests.filter((r) => r.status === "approved").length,
    rejected: cancellationRequests.filter((r) => r.status === "rejected").length,
  }), [cancellationRequests]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleConfirmAction = useCallback(
    (request: CancellationRequest, action: "approve" | "reject") => {
      setConfirmModal({ isOpen: true, request, action });
    }, []
  );

  const handleConfirm = useCallback(() => {
    if (confirmModal.request && confirmModal.action) {
      onAction(confirmModal.request.id, confirmModal.request.orderId, confirmModal.action);
    }
    setConfirmModal({ isOpen: false, request: null, action: null });
  }, [confirmModal, onAction]);

  const handleCloseModal = useCallback(() => {
    setConfirmModal({ isOpen: false, request: null, action: null });
  }, []);

  const confirmConfig = confirmModal.action === "approve"
    ? {
        title: "Approve cancellation?",
        message: `This will process a refund of ${formatCurrency(confirmModal.request?.orderData?.total || 0)} for order ${confirmModal.request?.orderId}. The customer will be notified via WhatsApp.`,
        confirmText: "Approve & Refund",
        isDestructive: false,
      }
    : {
        title: "Reject cancellation?",
        message: `The cancellation request for order ${confirmModal.request?.orderId} will be rejected. The customer will be notified via WhatsApp.`,
        confirmText: "Reject Request",
        isDestructive: true,
      };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const filterChips = [
    { id: "all" as const, label: "All", icon: "fa-list" },
    { id: "pending" as const, label: "Pending", icon: "fa-hourglass-half" },
    { id: "approved" as const, label: "Approved", icon: "fa-check-circle" },
    { id: "rejected" as const, label: "Rejected", icon: "fa-times-circle" },
  ];

  return (
    <div className="animate-fadeIn">
      {/* ── Header ── */}
      <div className="mb-6 px-3 animate-fadeIn">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DCF8C6] to-[#25D366] flex items-center justify-center shadow-lg flex-shrink-0">
            <i className="fas fa-exclamation-triangle text-white text-lg" />
          </div>
          <div>
            <h1 className="text-[#1C1B1F] text-2xl font-bold">Cancellation Requests</h1>
            <p className="text-[#49454F] text-sm mt-0.5">Review and process order cancellations</p>
          </div>
        </div>

        {/* ── Search & Sort ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5" style={{ animationDelay: "0.1s" }}>
          {/* Search - M3 outlined text field */}
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#49454F]/50 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Search by order, phone, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 pr-10 bg-[#FFFBFF] border border-[#CAC4D0] rounded-full text-sm text-[#1C1B1F] placeholder:text-[#49454F]/40 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#E7E0EC] flex items-center justify-center hover:bg-[#CAC4D0] transition-colors"
              >
                <i className="fas fa-times text-[10px] text-[#49454F]" />
              </button>
            )}
          </div>

          {/* Sort - M3 outlined select */}
          <div className="relative sm:w-44">
            <i className="fas fa-arrow-up-wide-short absolute left-4 top-1/2 -translate-y-1/2 text-[#49454F]/50 text-sm pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full h-12 pl-10 pr-10 bg-[#FFFBFF] border border-[#CAC4D0] rounded-full text-sm text-[#1C1B1F] appearance-none cursor-pointer focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/15 transition-all"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount">Highest amount</option>
            </select>
            <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[#49454F]/40 text-xs pointer-events-none" />
          </div>
        </div>

        {/* ── M3 Filter chips ── */}
        {isLoading ? (
          <SkeletonFilter />
        ) : (
          <div className="flex flex-wrap gap-2" style={{ animationDelay: "0.15s" }}>
            {filterChips.map((chip) => {
              const isActive = cancellationFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setCancellationFilter(chip.id)}
                  className={`h-10 px-4 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] ${
                    isActive
                      ? "bg-[#DCF8C6] text-[#1C1B1F] shadow-sm"
                      : "bg-[#FFFBFF] border border-[#CAC4D0] text-[#49454F] hover:bg-[#F5F5F5] hover:border-[#79747E]"
                  }`}
                >
                  <i className={`fas ${chip.icon} text-xs ${isActive ? "" : "opacity-60"}`} />
                  <span>{chip.label}</span>
                  <span
                    className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold leading-none ${
                      isActive ? "bg-[#25D366]/15 text-[#1C1B1F]" : "bg-[#E7E0EC] text-[#49454F]"
                    }`}
                  >
                    {counts[chip.id]}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Results count ── */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-3" style={{ animationDelay: "0.2s" }}>
          <p className="text-sm text-[#49454F]/70">
            <span className="font-semibold text-[#1C1B1F]">{filteredRequests.length}</span>{" "}
            {filteredRequests.length === 1 ? "request" : "requests"}
            {searchQuery && (
              <span> for &ldquo;<span className="text-[#25D366]">{searchQuery}</span>&rdquo;</span>
            )}
          </p>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState filter={cancellationFilter} searchQuery={searchQuery} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 px-3" style={{ animationDelay: "0.25s" }}>
          {filteredRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              onConfirmAction={handleConfirmAction}
              index={index}
            />
          ))}
        </div>
      )}

      {/* ── Confirmation Dialog ── */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        {...confirmConfig}
      />
    </div>
  );
}
