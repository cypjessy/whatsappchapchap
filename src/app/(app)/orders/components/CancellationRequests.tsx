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

// ─── Status Configuration ─────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending: {
    bg: "bg-red-500",
    border: "border-red-300",
    borderHover: "hover:border-red-500",
    text: "text-white",
    icon: "fa-clock",
    label: "Pending",
    lightBg: "bg-red-50",
    lightBorder: "border-red-200",
    lightText: "text-red-700",
  },
  approved: {
    bg: "bg-green-500",
    border: "border-green-300",
    borderHover: "hover:border-green-500",
    text: "text-white",
    icon: "fa-check-circle",
    label: "Approved",
    lightBg: "bg-green-50",
    lightBorder: "border-green-200",
    lightText: "text-green-700",
  },
  rejected: {
    bg: "bg-surface",
    border: "border-outline",
    borderHover: "hover:border-gray-500",
    text: "text-white",
    icon: "fa-times-circle",
    label: "Rejected",
    lightBg: "bg-surface",
    lightBorder: "border-outline-variant",
    lightText: "text-on-surface",
  },
} as const;

const FILTER_CONFIG = {
  all: { color: "#25D366", hoverBorder: "hover:border-[#25D366]" },
  pending: { color: "#ef4444", hoverBorder: "hover:border-red-500" },
  approved: { color: "#22c55e", hoverBorder: "hover:border-green-500" },
  rejected: { color: "#6b7280", hoverBorder: "hover:border-gray-500" },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: any): string {
  if (!date) return "N/A";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Skeleton Components ──────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-surface border-2 border-outline-variant rounded-xl p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-6 w-24 bg-surface-container-high rounded" />
          <div className="h-3 w-32 bg-surface-variant rounded" />
        </div>
        <div className="h-7 w-20 bg-surface-container-high rounded-full" />
      </div>
      <div className="space-y-3 mb-4">
        <div className="h-10 bg-surface-variant rounded-lg" />
        <div className="h-10 bg-surface-variant rounded-lg" />
        <div className="h-16 bg-surface-variant rounded-lg" />
      </div>
      <div className="h-12 bg-surface-variant rounded-lg" />
    </div>
  );
}

function SkeletonCardAnimated({ delay }: { delay: number }) {
  return (
    <div
      className="bg-surface border-2 border-outline-variant rounded-xl p-5 animate-fadeIn"
      style={{ animationDelay: `${delay * 0.1}s` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <div className="h-6 w-24 bg-surface-container-high rounded animate-pulse" />
          <div className="h-3 w-32 bg-surface-variant rounded animate-pulse" />
        </div>
        <div className="h-7 w-20 bg-surface-container-high rounded-full animate-pulse" />
      </div>
      <div className="space-y-3 mb-4">
        <div className="h-10 bg-surface-variant rounded-lg animate-pulse" />
        <div className="h-10 bg-surface-variant rounded-lg animate-pulse" />
        <div className="h-16 bg-surface-variant rounded-lg animate-pulse" />
      </div>
      <div className="h-12 bg-surface-variant rounded-lg animate-pulse" />
    </div>
  );
}

function SkeletonFilter() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-10 w-28 bg-surface-container-high rounded-lg animate-pulse flex-shrink-0" />
      ))}
    </div>
  );
}

// ─── Confirmation Modal ───────────────────────────────────────────────────────

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  confirmColor,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmColor: string;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slideUp">
        <div className="w-14 h-14 rounded-full bg-surface-variant flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-2xl text-on-surface-variant" />
        </div>
        <h3 className="text-xl font-bold text-on-surface text-center mb-2">
          {title}
        </h3>
        <p className="text-on-surface-variant text-center mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-surface-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-3 ${confirmColor} text-white rounded-xl font-semibold transition-all active:scale-95 shadow-lg hover:shadow-xl`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({
  filter,
  searchQuery,
}: {
  filter: string;
  searchQuery: string;
}) {
  const getMessage = () => {
    if (searchQuery) {
      return {
        title: "No Results Found",
        desc: `No cancellation requests match "${searchQuery}"`,
      };
    }
    switch (filter) {
      case "all":
        return {
          title: "No Cancellation Requests",
          desc: "No cancellation requests have been submitted yet.",
        };
      case "pending":
        return {
          title: "No Pending Requests",
          desc: "All pending requests have been processed. Great job!",
        };
      case "approved":
        return {
          title: "No Approved Requests",
          desc: "No requests have been approved yet.",
        };
      case "rejected":
        return {
          title: "No Rejected Requests",
          desc: "No requests have been rejected yet.",
        };
      default:
        return { title: "No Requests", desc: "No requests found." };
    }
  };

  const msg = getMessage();

  return (
    <div className="p-8 sm:p-12 text-center bg-surface border-2 border-dashed border-outline rounded-2xl animate-fadeIn">
      <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-inbox text-3xl text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-on-surface mb-2">{msg.title}</h3>
      <p className="text-on-surface-variant max-w-sm mx-auto">{msg.desc}</p>
    </div>
  );
}

// ─── Request Card ─────────────────────────────────────────────────────────────

function RequestCard({
  request,
  onAction,
  onConfirmAction,
  index = 0,
}: {
  request: CancellationRequest;
  onAction: (requestId: string, orderId: string, action: "approve" | "reject") => void;
  onConfirmAction: (request: CancellationRequest, action: "approve" | "reject") => void;
  index?: number;
}) {
  const statusStyle = STATUS_CONFIG[request.status];

  return (
    <div
      className={`group bg-surface border-2 ${statusStyle.border} ${statusStyle.borderHover} rounded-xl p-4 sm:p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 animate-fadeIn`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[#25D366] text-lg sm:text-xl truncate">
            {request.orderId}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1.5">
            <i className="fas fa-calendar-alt text-[10px]" />
            <span>{formatDate(request.requestedAt)}</span>
            <span className="text-gray-300">•</span>
            <span>{formatTime(request.requestedAt)}</span>
          </div>
        </div>
        <span
          className={`flex-shrink-0 px-3 py-1.5 ${statusStyle.bg} ${statusStyle.text} rounded-full text-xs font-bold shadow-md flex items-center gap-1.5`}
        >
          <i className={`fas ${statusStyle.icon}`} />
          <span className="hidden sm:inline">{statusStyle.label}</span>
        </span>
      </div>

      {/* Customer Info */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2.5 text-on-surface-variant bg-surface p-2.5 rounded-lg text-sm">
          <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center shadow-sm flex-shrink-0">
            <i className="fas fa-phone-alt text-xs text-gray-400" />
          </div>
          <span className="font-medium truncate">{request.customerPhone || "N/A"}</span>
        </div>

        <div className="flex items-center gap-2.5 text-on-surface-variant bg-surface p-2.5 rounded-lg text-sm">
          <div className="w-7 h-7 rounded-full bg-surface flex items-center justify-center shadow-sm flex-shrink-0">
            <i className="fas fa-user text-xs text-gray-400" />
          </div>
          <span className="font-medium truncate">
            {request.orderData?.customerName || "N/A"}
          </span>
        </div>

        <div className="font-bold text-on-surface text-xl sm:text-2xl bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-sm flex-shrink-0">
            <i className="fas fa-coins text-sm text-green-600" />
          </div>
          <span>{formatCurrency(request.orderData?.total || 0)}</span>
        </div>
      </div>

      {/* Reason */}
      <div className="text-sm text-on-surface-variant mb-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <i className="fas fa-info-circle text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-blue-700">Reason: </span>
            <span className="text-blue-600/80">
              {request.reason || "Customer requested cancellation"}
            </span>
          </div>
        </div>
      </div>

      {/* Response Note */}
      {request.responseNote && (
        <div
          className={`text-sm mb-4 p-3 rounded-lg border ${statusStyle.lightBg} ${statusStyle.lightBorder} ${statusStyle.lightText}`}
        >
          <div className="flex items-start gap-2">
            <i
              className={`fas ${
                request.status === "approved"
                  ? "fa-comment-dots text-green-600"
                  : "fa-comment-slash text-on-surface-variant"
              } mt-0.5 flex-shrink-0`}
            />
            <div className="flex-1 min-w-0">
              <span className="font-semibold">Note: </span>
              <span className="opacity-90">{request.responseNote}</span>
              {request.respondedAt?.toDate && (
                <div className="text-xs mt-1.5 opacity-60 flex items-center gap-1">
                  <i className="fas fa-clock text-[10px]" />
                  {formatDateTime(request.respondedAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {request.status === "pending" && (
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => onConfirmAction(request, "approve")}
            className="flex-1 px-3 sm:px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-sm hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
          >
            <i className="fas fa-check-circle text-base sm:text-lg" />
            <span className="hidden sm:inline">Approve & Refund</span>
            <span className="sm:hidden">Approve</span>
          </button>
          <button
            onClick={() => onConfirmAction(request, "reject")}
            className="flex-1 px-3 sm:px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-sm hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 touch-manipulation"
          >
            <i className="fas fa-times-circle text-base sm:text-lg" />
            <span>Reject</span>
          </button>
        </div>
      )}

      {/* Processed Badge */}
      {request.status !== "pending" && (
        <div className="flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 bg-surface rounded-lg">
          <i className="fas fa-check-double" />
          <span>Processed on {formatDate(request.respondedAt)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CancellationRequests({
  cancellationRequests,
  cancellationFilter,
  setCancellationFilter,
  onAction,
  isLoading = false,
}: CancellationRequestsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount">("newest");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    request: CancellationRequest | null;
    action: "approve" | "reject" | null;
  }>({ isOpen: false, request: null, action: null });

  // Filter & Search & Sort
  const filteredRequests = useMemo(() => {
    let result = [...cancellationRequests];

    // Status filter
    if (cancellationFilter !== "all") {
      result = result.filter((r) => r.status === cancellationFilter);
    }

    // Search
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

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            (b.requestedAt?.toDate?.() || new Date(0)).getTime() -
            (a.requestedAt?.toDate?.() || new Date(0)).getTime()
          );
        case "oldest":
          return (
            (a.requestedAt?.toDate?.() || new Date(0)).getTime() -
            (b.requestedAt?.toDate?.() || new Date(0)).getTime()
          );
        case "amount":
          return (b.orderData?.total || 0) - (a.orderData?.total || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [cancellationRequests, cancellationFilter, searchQuery, sortBy]);

  // Counts
  const counts = useMemo(() => {
    const all = cancellationRequests.length;
    const pending = cancellationRequests.filter((r) => r.status === "pending").length;
    const approved = cancellationRequests.filter((r) => r.status === "approved").length;
    const rejected = cancellationRequests.filter((r) => r.status === "rejected").length;
    return { all, pending, approved, rejected };
  }, [cancellationRequests]);

  // Handlers
  const handleConfirmAction = useCallback(
    (request: CancellationRequest, action: "approve" | "reject") => {
      setConfirmModal({ isOpen: true, request, action });
    },
    []
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

  const getConfirmConfig = () => {
    if (confirmModal.action === "approve") {
      return {
        title: "Approve Cancellation?",
        message: `Are you sure you want to approve the cancellation for order ${confirmModal.request?.orderId}? This will process a refund of ${formatCurrency(
          confirmModal.request?.orderData?.total || 0
        )}.`,
        confirmText: "Yes, Approve & Refund",
        confirmColor: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700",
      };
    }
    return {
      title: "Reject Cancellation?",
      message: `Are you sure you want to reject the cancellation request for order ${confirmModal.request?.orderId}? The customer will be notified.`,
      confirmText: "Yes, Reject",
      confirmColor: "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700",
    };
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fadeIn">
      {/* Header Section */}
      <div className="mb-6 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg flex-shrink-0 animate-slideUp">
            <i className="fas fa-exclamation-triangle text-lg sm:text-xl" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              Cancellation Requests
            </h2>
            <p className="text-sm text-on-surface-variant">
              View and manage all cancellation requests
            </p>
          </div>
        </div>

        {/* Search & Sort Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search by order ID, phone, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-on-surface-variant"
              >
                <i className="fas fa-times-circle" />
              </button>
            )}
          </div>
          <div className="relative">
            <i className="fas fa-sort-amount-down absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="pl-10 pr-8 py-2.5 bg-surface border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all appearance-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount">Highest Amount</option>
            </select>
            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
          </div>
        </div>

        {/* Filter Tabs */}
        {isLoading ? (
          <SkeletonFilter />
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            {(["all", "pending", "approved", "rejected"] as const).map((filter) => {
              const config = FILTER_CONFIG[filter];
              const count = counts[filter];
              const isActive = cancellationFilter === filter;

              return (
                <button
                  key={filter}
                  onClick={() => setCancellationFilter(filter)}
                  className={`px-3 sm:px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all duration-200 flex items-center gap-2 flex-shrink-0 active:scale-95 ${
                    isActive
                      ? "text-white shadow-lg"
                      : "bg-surface border-2 border-outline-variant text-on-surface-variant hover:bg-surface"
                  }`}
                  style={
                    isActive
                      ? {
                          background: `linear-gradient(135deg, ${config.color}, ${config.color}dd)`,
                          borderColor: "transparent",
                        }
                      : undefined
                  }
                >
                  {filter !== "all" && (
                    <i
                      className={`fas ${
                        filter === "pending"
                          ? "fa-clock"
                          : filter === "approved"
                          ? "fa-check"
                          : "fa-times"
                      } text-xs`}
                    />
                  )}
                  <span className="capitalize">{filter}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${
                      isActive ? "bg-surface/20" : "bg-surface-variant text-on-surface-variant"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!isLoading && filteredRequests.length > 0 && (
        <div className="flex items-center justify-between mb-4 px-1 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-on-surface-variant">
            Showing <span className="font-semibold text-on-surface">{filteredRequests.length}</span>{" "}
            {filteredRequests.length === 1 ? "request" : "requests"}
            {searchQuery && (
              <span>
                {" "}
                for "<span className="text-[#25D366]">{searchQuery}</span>"
              </span>
            )}
          </p>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCardAnimated key={i} delay={i} />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState filter={cancellationFilter} searchQuery={searchQuery} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fadeIn" style={{ animationDelay: '0.25s' }}>
          {filteredRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              onAction={onAction}
              onConfirmAction={handleConfirmAction}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        {...getConfirmConfig()}
      />
    </div>
  );
}