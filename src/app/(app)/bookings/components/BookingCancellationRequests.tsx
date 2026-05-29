"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/currency";

interface CancellationRequest {
  id: string;
  tenantId: string;
  bookingId: string;
  customerPhone: string;
  bookingData: any;
  type: string;
  status: "pending" | "approved" | "rejected";
  reason: string;
  requestedAt: any;
  respondedAt: any;
  responseNote: string | null;
}

interface BookingCancellationRequestsProps {
  cancellationRequests: CancellationRequest[];
  cancellationFilter: "all" | "pending" | "approved" | "rejected";
  setCancellationFilter: (filter: "all" | "pending" | "approved" | "rejected") => void;
  onAction: (requestId: string, bookingId: string, action: "approve" | "reject") => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  pending: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    borderHover: "hover:border-amber-300",
    label: "Pending",
    icon: "fa-clock",
  },
  approved: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    borderHover: "hover:border-green-300",
    label: "Approved",
    icon: "fa-check-circle",
  },
  rejected: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    borderHover: "hover:border-red-300",
    label: "Rejected",
    icon: "fa-times-circle",
  },
};

function formatDate(date: any): string {
  if (!date) return "";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d.getTime())) return "";
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
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RequestSkeleton({ delay = 0 }: { delay?: number }) {
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

function EmptyState({ filter }: { filter: string }) {
  const getMessage = () => {
    switch (filter) {
      case "all":
        return {
          title: "No Cancellation Requests",
          desc: "No booking cancellation requests have been submitted yet.",
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

function RequestCard({
  request,
  onAction,
  index = 0,
}: {
  request: CancellationRequest;
  onAction: (requestId: string, bookingId: string, action: "approve" | "reject") => void;
  index?: number;
}) {
  const statusStyle = STATUS_CONFIG[request.status];
  const isPending = request.status === "pending";

  return (
    <div
      className={`group bg-surface border-2 ${statusStyle.border} ${statusStyle.borderHover} rounded-xl p-4 sm:p-5    transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 animate-fadeIn`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[#25D366] text-lg sm:text-xl truncate">
            {request.bookingData?.bookingNumber || request.bookingId}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1.5">
            <i className="fas fa-calendar-alt text-[10px]" />
            <span>{formatDate(request.requestedAt)}</span>
            <span className="text-gray-300">•</span>
            <span>{formatTime(request.requestedAt)}</span>
          </div>
        </div>
        <span
          className={`flex-shrink-0 px-3 py-1.5 ${statusStyle.bg} ${statusStyle.text} rounded-full text-xs font-bold shadow-sm flex items-center gap-1.5`}
        >
          <i className={`fas ${statusStyle.icon}`} />
          <span className="hidden sm:inline">{statusStyle.label}</span>
        </span>
      </div>

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
            {request.bookingData?.client || "N/A"}
          </span>
        </div>

        <div className="font-bold text-on-surface text-xl sm:text-2xl bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg border border-green-200 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shadow-sm flex-shrink-0">
            <i className="fas fa-coins text-sm text-green-600" />
          </div>
          <span>{formatCurrency(request.bookingData?.price || 0)}</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-surface-container-lowest rounded-lg border border-outline-variant">
        <div className="text-sm text-on-surface-variant mb-1">Service:</div>
        <div className="font-semibold text-on-surface">{request.bookingData?.service || "N/A"}</div>
        <div className="text-xs text-outline mt-1">
          📅 {request.bookingData?.date} at {request.bookingData?.time}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-bold uppercase tracking-wider text-outline mb-2 flex items-center gap-1.5">
          <i className="fas fa-comment-alt text-[10px]" />
          Reason
        </div>
        <div className="text-sm text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-outline-variant">
          {request.reason || "Customer requested cancellation"}
        </div>
      </div>

      {request.responseNote && request.status !== "pending" && (
        <div className="mb-4">
          <div className="text-xs font-bold uppercase tracking-wider text-outline mb-2 flex items-center gap-1.5">
            <i className="fas fa-reply text-[10px]" />
            Response
          </div>
          <div className={`text-sm p-3 rounded-lg border ${
            request.status === "approved" 
              ? "bg-green-50 text-green-700 border-green-200" 
              : "bg-red-50 text-red-700 border-red-200"
          }`}>
            {request.responseNote}
          </div>
        </div>
      )}

      {isPending ? (
        <div className="flex gap-2">
          <button
            onClick={() => onAction(request.id, request.bookingId, "approve")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold text-sm shadow-md hover:from-green-600 hover:to-green-700 transition-all active:scale-95"
          >
            <i className="fas fa-check" />
            Approve
          </button>
          <button
            onClick={() => onAction(request.id, request.bookingId, "reject")}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-sm shadow-md hover:from-red-600 hover:to-red-700 transition-all active:scale-95"
          >
            <i className="fas fa-times" />
            Reject
          </button>
        </div>
      ) : (
        <div className="text-center text-xs text-outline py-2">
          <i className={`fas ${request.status === "approved" ? "fa-check-circle text-green-500" : "fa-times-circle text-red-500"} mr-1`} />
          {request.status === "approved" ? "Approved" : "Rejected"}
          {request.respondedAt && (
            <span className="ml-2">
              • {formatDate(request.respondedAt)} at {formatTime(request.respondedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function BookingCancellationRequests({
  cancellationRequests,
  cancellationFilter,
  setCancellationFilter,
  onAction,
  isLoading = false,
}: BookingCancellationRequestsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");

  const filteredRequests = useMemo(() => {
    let result = cancellationRequests;

    if (cancellationFilter !== "all") {
      result = result.filter((r) => r.status === cancellationFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.bookingId.toLowerCase().includes(query) ||
          r.customerPhone.includes(query) ||
          r.bookingData?.client?.toLowerCase().includes(query) ||
          r.bookingData?.service?.toLowerCase().includes(query)
      );
    }

    result = [...result].sort((a, b) => {
      const aTime = a.requestedAt?.toDate?.() || new Date(a.requestedAt);
      const bTime = b.requestedAt?.toDate?.() || new Date(b.requestedAt);
      return sortBy === "newest" ? bTime.getTime() - aTime.getTime() : aTime.getTime() - bTime.getTime();
    });

    return result;
  }, [cancellationRequests, cancellationFilter, searchQuery, sortBy]);

  const counts = useMemo(() => {
    const all = cancellationRequests.length;
    const pending = cancellationRequests.filter((r) => r.status === "pending").length;
    const approved = cancellationRequests.filter((r) => r.status === "approved").length;
    const rejected = cancellationRequests.filter((r) => r.status === "rejected").length;
    return { all, pending, approved, rejected };
  }, [cancellationRequests]);

  return (
    <div className="animate-fadeIn">
      <div className="mb-6 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md flex-shrink-0 animate-slideUp">
            <i className="fas fa-exclamation-triangle text-lg sm:text-xl" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">
              Booking Cancellation Requests
            </h2>
            <p className="text-sm text-on-surface-variant">
              View and manage all booking cancellation requests
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "all", label: "All", count: counts.all, icon: "fa-layer-group" },
            { id: "pending", label: "Pending", count: counts.pending, icon: "fa-clock" },
            { id: "approved", label: "Approved", count: counts.approved, icon: "fa-check-circle" },
            { id: "rejected", label: "Rejected", count: counts.rejected, icon: "fa-times-circle" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCancellationFilter(tab.id as any)}
              className={`
                shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95
                ${cancellationFilter === tab.id
                  ? "bg-gradient-to-r from-[#1e293b] to-[#334155] text-white shadow-md"
                  : "bg-surface border-2 border-outline text-on-surface-variant hover:border-[#1e293b] hover:text-on-surface"
                }
              `}
            >
              <i className={`fas ${tab.icon} text-xs`} />
              <span>{tab.label}</span>
              <span
                className={`
                  ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${cancellationFilter === tab.id ? "bg-surface/20" : "bg-surface-variant"}
                `}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" />
          <input
            type="text"
            placeholder="Search by booking ID, phone, client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface border-2 border-outline-variant rounded-xl text-sm focus:border-[#25D366] focus:outline-none transition-all"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-3 bg-surface border-2 border-outline-variant rounded-xl text-sm font-medium text-on-surface-variant focus:border-[#25D366] focus:outline-none transition-all cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <RequestSkeleton key={i} delay={i} />
          ))}
        </div>
      )}

      {!isLoading && filteredRequests.length === 0 && (
        <EmptyState filter={cancellationFilter} />
      )}

      {!isLoading && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {filteredRequests.map((request, index) => (
            <RequestCard
              key={request.id}
              request={request}
              onAction={onAction}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
