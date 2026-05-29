"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Customer, Order, orderService } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
  onSendWhatsApp: (phone: string, message?: string) => void;
  formatCurrency: (amount: number) => string;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
}

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TABS: TabConfig[] = [
  { id: "orders", label: "Orders", icon: "fa-shopping-bag" },
  { id: "messages", label: "Messages", icon: "fa-comments" },
  { id: "activity", label: "Activity", icon: "fa-chart-line" },
  { id: "preferences", label: "Preferences", icon: "fa-cog" },
];

const ORDER_STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  pending: { bg: "bg-[rgba(245,158,11,0.12)]", text: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
  processing: { bg: "bg-[rgba(59,130,246,0.12)]", text: "text-[#3b82f6]", dot: "bg-[#3b82f6]" },
  delivered: { bg: "bg-[rgba(37,211,102,0.12)]", text: "text-[#10b981]", dot: "bg-[#10b981]" },
  cancelled: { bg: "bg-[rgba(239,68,68,0.12)]", text: "text-[#ef4444]", dot: "bg-[#ef4444]" },
};

const TAG_COLORS = [
  { bg: "bg-[#ede9fe]", text: "text-[#8b5cf6]", border: "border-[#8b5cf6]/20" },
  { bg: "bg-[#dbeafe]", text: "text-[#3b82f6]", border: "border-[#3b82f6]/20" },
  { bg: "bg-[#dcfce7]", text: "text-[#10b981]", border: "border-[#10b981]/20" },
  { bg: "bg-[#fef3c7]", text: "text-[#f59e0b]", border: "border-[#f59e0b]/20" },
  { bg: "bg-[#fee2e2]", text: "text-[#ef4444]", border: "border-[#ef4444]/20" },
  { bg: "bg-surface-variant", text: "text-on-surface-variant", border: "border-[#64748b]/20" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getOrderStatusConfig(status: string) {
  return ORDER_STATUS_CONFIG[status] || {
    bg: "bg-surface-variant",
    text: "text-on-surface-variant",
    dot: "bg-[#94a3b8]",
  };
}

function getTagColor(index: number) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

function getDaysSince(dateStr?: string): string {
  if (!dateStr) return "Unknown";
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, delay = 0 }: {
  label: string;
  value: string | number;
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
      bg-surface rounded-xl p-3 border border-outline-variant transition-all duration-300
      ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
    `} style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2 mb-1">
        <i className={`fas ${icon} ${color} text-xs`} />
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-lg font-extrabold ${color}`}>{value}</div>
    </div>
  );
}

function OrderCard({ order, index, formatCurrency }: {
  order: Order;
  index: number;
  formatCurrency: (amount: number) => string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const config = getOrderStatusConfig(order.status || "pending");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className={`
      flex justify-between items-center p-3.5 md:p-4 bg-surface rounded-xl border border-transparent
      hover:border-outline-variant hover:shadow-sm transition-all duration-200 cursor-pointer
      ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
    `} style={{ transitionDelay: `${index * 80}ms` }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${config.bg} ${config.text}
        `}>
          <i className="fas fa-shopping-bag text-sm" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">
            Order #{order.id?.substring(0, 8) || "N/A"}
          </div>
          <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
            <i className="fas fa-calendar text-[9px]" />
            {order.createdAt?.toDate
              ? order.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : "N/A"
            }
          </div>
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <div className="font-bold text-sm">{formatCurrency(order.total || 0)}</div>
        <span className={`
          inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-1
          ${config.bg} ${config.text}
        `}>
          <span className={`w-1 h-1 rounded-full ${config.dot}`} />
          {order.status || "pending"}
        </span>
      </div>
    </div>
  );
}

function ActivityItem({ icon, iconColor, iconBg, title, subtitle, time }: {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center shrink-0
        ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-110
      `}>
        <i className={`fas ${icon} text-sm`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-on-surface-variant">{subtitle}</div>
      </div>
      <div className="text-[10px] text-outline font-medium shrink-0">{time}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerModal({
  customer,
  onClose,
  onDelete,
  onUpdateNotes,
  onSendWhatsApp,
  formatCurrency,
  getColorFromString,
  getInitials,
}: CustomerModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customerNotes, setCustomerNotes] = useState(customer.notes || "");
  const [customerTags, setCustomerTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [isClosing, setIsClosing] = useState(false);
  const notesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animate in
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    if (activeTab === "orders") {
      loadCustomerOrders();
    }
  }, [activeTab]);

  const loadCustomerOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const orders = await orderService.getOrders(user);
      const filtered = orders.filter(o => o.customerId === customer.id);
      setCustomerOrders(filtered);
    } catch (error) {
      console.error("Error loading customer orders:", error);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Auto-save notes with debounce
  const handleNotesChange = (value: string) => {
    setCustomerNotes(value);
    setSaveStatus("saving");
    
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current as any);
    }
    notesTimeoutRef.current = setTimeout(async () => {
      try {
        await onUpdateNotes(value);
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Error updating notes:", error);
        setSaveStatus("idle");
      }
    }, 1000);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (!customerTags.includes(newTag.trim())) {
      setCustomerTags([...customerTags, newTag.trim()]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setCustomerTags(customerTags.filter(t => t !== tag));
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
      onDelete();
    }
  };

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-start justify-center p-4 md:p-8 overflow-y-auto
        md3-dialog-backdrop transition-opacity duration-200
        ${isVisible && !isClosing ? "opacity-100" : "opacity-0"}
      `}
      onClick={handleClose}
    >
      <div
        className={`
          md3-dialog w-full max-w-4xl my-4 md:my-8
          transition-all duration-300 ease-out
          ${isVisible && !isClosing ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4"}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header - MD3 Dialog Header */}
        <div className="px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] flex justify-between items-center">
          <div className="flex items-center gap-3 md:gap-4">
            <div className={`
              w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} 
              flex items-center justify-center text-xl md:text-3xl font-medium text-white shrink-0
              shadow-lg shadow-current/20
            `}>
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-normal truncate text-[var(--md-sys-color-on-surface)]">{customer.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs md:text-sm text-[var(--md-sys-color-on-surface-variant)]">
                <span className="flex items-center gap-1">
                  <i className="fab fa-whatsapp text-[#25D366]" />
                  {customer.phone}
                </span>
                {customer.email && (
                  <>
                    <span className="text-[var(--md-sys-color-outline)]">•</span>
                    <span className="hidden sm:inline truncate">{customer.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`
              w-9 h-9 md:w-10 md:h-10 rounded-full border-2 border-outline-variant 
              flex items-center justify-center text-on-surface-variant 
              hover:bg-[#ef4444] hover:border-[#ef4444] hover:text-white 
              transition-all duration-200 active:scale-90 shrink-0
            `}
            aria-label="Close modal"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 md:gap-6">
            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard
                  label="Total Spent"
                  value={formatCurrency(customer.totalSpent || 0)}
                  icon="fa-wallet"
                  color="text-[#8b5cf6]"
                  delay={0}
                />
                <StatCard
                  label="Visits"
                  value={customer.visits || 0}
                  icon="fa-calendar-check"
                  color="text-[#10b981]"
                  delay={100}
                />
                <StatCard
                  label="Last Visit"
                  value={getDaysSince(customer.lastVisit || customer.updatedAt)}
                  icon="fa-clock"
                  color="text-[#f59e0b]"
                  delay={200}
                />
                <StatCard
                  label="Orders"
                  value={customerOrders.length}
                  icon="fa-shopping-bag"
                  color="text-[#3b82f6]"
                  delay={300}
                />
              </div>

              {/* Actions */}
              <div className="bg-surface rounded-2xl p-4 md:p-5 space-y-2.5">
                <button
                  onClick={() => onSendWhatsApp(customer.phone)}
                  className={`
                    w-full py-2.5 md:py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] 
                    text-white rounded-xl font-bold flex items-center justify-center gap-2 
                    shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/30 
                    hover:-translate-y-0.5 transition-all duration-200 active:scale-95
                  `}
                >
                  <i className="fab fa-whatsapp" />
                  Send WhatsApp
                </button>

                <button
                  onClick={() => customer.email && window.open(`mailto:${customer.email}`)}
                  disabled={!customer.email}
                  className={`
                    w-full py-2.5 md:py-3 rounded-xl font-bold flex items-center justify-center gap-2
                    border-2 transition-all duration-200 active:scale-95
                    ${customer.email
                      ? "bg-surface border-outline-variant text-on-surface hover:border-[#3b82f6] hover:text-[#3b82f6]"
                      : "bg-surface-variant border-outline-variant text-outline cursor-not-allowed"
                    }
                  `}
                >
                  <i className="fas fa-envelope" />
                  Send Email
                </button>

                <button
                  onClick={handleDelete}
                  className="
                    w-full py-2.5 md:py-3 rounded-lg font-medium flex items-center justify-center gap-2
                    md3-btn-outlined text-[var(--md-sys-color-error)] border-[var(--md-sys-color-error)]
                    hover:bg-[var(--md-sys-color-error-container)]
                    transition-all duration-200 active:scale-95
                  "
                >
                  <i className="fas fa-trash text-sm" />
                  Delete Customer
                </button>
              </div>

              {/* Contact Info */}
              <div className="bg-surface rounded-2xl p-4 md:p-5 space-y-3">
                {[
                  { label: "Phone", value: customer.phone, icon: "fa-phone", color: "text-[#25D366]" },
                  { label: "Email", value: customer.email || "N/A", icon: "fa-envelope", color: "text-[#3b82f6]" },
                  { label: "Location", value: customer.location || "N/A", icon: "fa-map-marker-alt", color: "text-[#f59e0b]" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2.5">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                      ${item.color.replace("text-", "bg-").replace("]", "]/10")}
                    `}>
                      <i className={`fas ${item.icon} ${item.color} text-xs`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-outline uppercase tracking-wider">{item.label}</div>
                      <div className="font-semibold text-sm truncate">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="bg-surface rounded-2xl p-4 md:p-5 border border-outline-variant">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-sm">Customer Notes</h4>
                  <span className={`
                    text-[10px] font-bold uppercase tracking-wider transition-colors
                    ${saveStatus === "saving" ? "text-[#f59e0b]" : saveStatus === "saved" ? "text-[#10b981]" : "text-outline"}
                  `}>
                    {saveStatus === "saving" && <i className="fas fa-circle-notch fa-spin mr-1" />}
                    {saveStatus === "saved" && <i className="fas fa-check mr-1" />}
                    {saveStatus === "idle" ? "Auto-save" : saveStatus === "saving" ? "Saving..." : "Saved"}
                  </span>
                </div>
                <textarea
                  className={`
                    w-full bg-surface p-3 rounded-xl text-sm text-on-surface 
                    resize-none min-h-[100px] focus:outline-none 
                    border-2 border-outline-variant focus:border-[#8b5cf6]
                    transition-colors duration-200 placeholder:text-outline
                  `}
                  placeholder="Add notes about this customer..."
                  value={customerNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="min-w-0">
              {/* Tabs */}
              <div className="flex gap-1 border-b-2 border-outline-variant mb-4 md:mb-6 overflow-x-auto scrollbar-hide">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative px-3 md:px-4 py-2.5 md:py-3 font-bold text-xs md:text-sm capitalize 
                      whitespace-nowrap transition-colors duration-200 flex items-center gap-1.5
                      ${activeTab === tab.id ? "text-[#8b5cf6]" : "text-on-surface-variant hover:text-on-surface"}
                    `}
                  >
                    <i className={`fas ${tab.icon} text-xs`} />
                    {tab.label}
                    {tab.count !== undefined && (
                      <span className={`
                        ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]
                        ${activeTab === tab.id ? "bg-[#ede9fe] text-[#8b5cf6]" : "bg-surface-variant text-on-surface-variant"}
                      `}>
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-[#8b5cf6] rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[300px]">
                {activeTab === "orders" && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm md:text-base">
                        {customer.visits || 0} Visits • {formatCurrency(customer.totalSpent || 0)} Total
                      </h3>
                      {customerOrders.length > 0 && (
                        <span className="text-xs text-outline font-medium">
                          {customerOrders.length} order{customerOrders.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {loadingOrders ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin mb-3" />
                        <span className="text-sm text-on-surface-variant">Loading orders...</span>
                      </div>
                    ) : customerOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
                        <div className="w-14 h-14 rounded-xl bg-surface-variant flex items-center justify-center mb-3">
                          <i className="fas fa-shopping-bag text-xl text-[#cbd5e1]" />
                        </div>
                        <p className="font-semibold text-sm">No orders found</p>
                        <p className="text-xs text-outline mt-1">This customer hasn't placed any orders yet</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customerOrders.map((order, idx) => (
                          <OrderCard
                            key={order.id}
                            order={order}
                            index={idx}
                            formatCurrency={formatCurrency}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "messages" && (
                  <div className="bg-surface rounded-2xl p-6 md:p-8 text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center mx-auto mb-4">
                      <i className="fab fa-whatsapp text-3xl md:text-4xl text-[#25D366]" />
                    </div>
                    <h3 className="font-bold text-base md:text-lg mb-2">WhatsApp Chat History</h3>
                    <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
                      View all WhatsApp conversations with this customer
                    </p>
                    <button
                      onClick={() => onSendWhatsApp(customer.phone)}
                      className={`
                        px-5 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] 
                        text-white rounded-xl font-bold inline-flex items-center gap-2
                        shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:-translate-y-0.5
                        transition-all duration-200 active:scale-95
                      `}
                    >
                      <i className="fab fa-whatsapp" />
                      Open Chat
                    </button>
                  </div>
                )}

                {activeTab === "activity" && (
                  <div className="space-y-1">
                    <ActivityItem
                      icon="fa-user-plus"
                      iconColor="text-[#10b981]"
                      iconBg="bg-[rgba(37,211,102,0.1)]"
                      title="Customer created"
                      subtitle="Customer added to system"
                      time={getDaysSince(customer.createdAt)}
                    />
                    {customer.lastVisit && (
                      <ActivityItem
                        icon="fa-calendar-check"
                        iconColor="text-[#8b5cf6]"
                        iconBg="bg-[rgba(139,92,246,0.1)]"
                        title="Last visit"
                        subtitle={`Visited on ${new Date(customer.lastVisit).toLocaleDateString()}`}
                        time={getDaysSince(customer.lastVisit)}
                      />
                    )}
                    {customerOrders.length > 0 && (
                      <ActivityItem
                        icon="fa-shopping-bag"
                        iconColor="text-[#3b82f6]"
                        iconBg="bg-[rgba(59,130,246,0.1)]"
                        title={`Placed ${customerOrders.length} order${customerOrders.length !== 1 ? 's' : ''}`}
                        subtitle="Most recent order completed"
                        time={getDaysSince(customerOrders[0]?.createdAt?.toDate?.().toISOString())}
                      />
                    )}
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-4">
                    {/* Tags */}
                    <div className="bg-surface p-4 md:p-5 rounded-2xl border border-outline-variant">
                      <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                        <i className="fas fa-tags text-[#8b5cf6]" />
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {customerTags.map((tag, i) => {
                          const colors = getTagColor(i);
                          return (
                            <span
                              key={tag}
                              className={`
                                px-3 py-1.5 rounded-full text-xs font-semibold 
                                border flex items-center gap-1.5 transition-all duration-200
                                ${colors.bg} ${colors.text} ${colors.border}
                                hover:shadow-sm
                              `}
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
                                aria-label={`Remove ${tag}`}
                              >
                                <i className="fas fa-times text-[9px]" />
                              </button>
                            </span>
                          );
                        })}
                        {customerTags.length === 0 && (
                          <span className="text-sm text-outline italic">No tags added yet</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTag()}
                          className={`
                            flex-1 px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm
                            focus:outline-none focus:border-[#8b5cf6] transition-colors
                            placeholder:text-outline
                          `}
                          placeholder="Add a tag..."
                        />
                        <button
                          onClick={addTag}
                          disabled={!newTag.trim()}
                          className={`
                            px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95
                            ${newTag.trim()
                              ? "bg-[#8b5cf6] text-white hover:bg-[#7c3aed] shadow-md shadow-[#8b5cf6]/20"
                              : "bg-surface-variant text-outline cursor-not-allowed"
                            }
                          `}
                        >
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}