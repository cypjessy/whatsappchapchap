"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Product, defaultProductCategories } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

type TabId = "overview" | "details" | "inventory" | "specs";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "fa-eye" },
  { id: "details", label: "Details", icon: "fa-list" },
  { id: "inventory", label: "Inventory", icon: "fa-boxes" },
  { id: "specs", label: "Specs", icon: "fa-cogs" },
];

const STOCK_CONFIG: Record<string, { text: string; color: string; bg: string; dot: string; bar: string; gradient: string }> = {
  out: { text: "Out of Stock", color: "text-[#ef4444]", bg: "bg-[#fee2e2]", dot: "bg-[#ef4444]", bar: "bg-[#ef4444]", gradient: "from-[#ef4444] to-[#dc2626]" },
  low: { text: "Low Stock", color: "text-[#f59e0b]", bg: "bg-[#fef3c7]", dot: "bg-[#f59e0b]", bar: "bg-[#f59e0b]", gradient: "from-[#f59e0b] to-[#d97706]" },
  medium: { text: "In Stock", color: "text-[#3b82f6]", bg: "bg-[#dbeafe]", dot: "bg-[#3b82f6]", bar: "bg-[#3b82f6]", gradient: "from-[#3b82f6] to-[#2563eb]" },
  good: { text: "Well Stocked", color: "text-[#10b981]", bg: "bg-[#d1fae5]", dot: "bg-[#10b981]", bar: "bg-[#10b981]", gradient: "from-[#10b981] to-[#059669]" },
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  food: "from-[#f59e0b] to-[#d97706]",
  beverages: "from-[#3b82f6] to-[#2563eb]",
  electronics: "from-[#8b5cf6] to-[#7c3aed]",
  fashion: "from-[#ec4899] to-[#db2777]",
  beauty: "from-[#f472b6] to-[#ec4899]",
  health: "from-[#10b981] to-[#059669]",
  home: "from-[#f97316] to-[#ea580c]",
  sports: "from-[#14b8a6] to-[#0d9488]",
  books: "from-[#6366f1] to-[#4f46e5]",
  other: "from-[#64748b] to-[#475569]",
};

const SPEC_COLORS = [
  { from: "from-[#3b82f6]/20", to: "to-[#3b82f6]/10", iconBg: "bg-[#dbeafe]", icon: "text-[#3b82f6]" },
  { from: "from-[#8b5cf6]/20", to: "to-[#8b5cf6]/10", iconBg: "bg-[#ede9fe]", icon: "text-[#8b5cf6]" },
  { from: "from-[#ec4899]/20", to: "to-[#ec4899]/10", iconBg: "bg-[#fce7f3]", icon: "text-[#ec4899]" },
  { from: "from-[#f59e0b]/20", to: "to-[#f59e0b]/10", iconBg: "bg-[#fef3c7]", icon: "text-[#f59e0b]" },
  { from: "from-[#10b981]/20", to: "to-[#10b981]/10", iconBg: "bg-[#dcfce7]", icon: "text-[#10b981]" },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

function getStockConfig(stock: number) {
  if (stock === 0) return STOCK_CONFIG.out;
  if (stock <= 5) return STOCK_CONFIG.low;
  if (stock <= 20) return STOCK_CONFIG.medium;
  return STOCK_CONFIG.good;
}

function getCategoryEmoji(category: string) {
  const found = defaultProductCategories.find((c) => c.id === category);
  return found?.icon || "📦";
}

function getCategoryGradient(category?: string) {
  return CATEGORY_GRADIENTS[category || "other"] || CATEGORY_GRADIENTS.other;
}

function getStockBarWidth(stock: number): string {
  if (stock === 0) return "0%";
  if (stock <= 5) return "25%";
  if (stock <= 20) return "50%";
  return "100%";
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[3000] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold backdrop-blur-md ${
            toast.type === "success" ? "bg-[#10B981]/95 text-white" : toast.type === "error" ? "bg-[#EF4444]/95 text-white" : "bg-[#8B5CF6]/95 text-white"
          }`}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : toast.type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}`} />
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 hover:rotate-90 transition-all duration-300">
        <i className="fas fa-times" />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function PremiumSectionHeader({ icon, title, color = "#8B5CF6" }: { icon: string; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <i className={`fas ${icon} text-xs`} style={{ color }} />
      </div>
      <span className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-on-surface-variant">{title}</span>
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, delay = 0 }: {
  icon: string; iconBg: string; iconColor: string; label: string; value: string; delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`bg-surface rounded-2xl p-3.5 md:p-4 border border-outline-variant transition-all duration-500 ease-out cursor-default hover:shadow-md hover:-translate-y-0.5 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center mb-2.5`}>
        <i className={`fas ${icon} text-sm md:text-base`} />
      </div>
      <div className="text-[10px] md:text-xs text-outline font-bold uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-extrabold text-sm md:text-base text-on-surface truncate">{value}</div>
    </div>
  );
}

function PremiumActionButton({ icon, label, variant = "default", onClick, disabled, loading }: {
  icon: string; label: string; variant?: "default" | "danger" | "success" | "whatsapp" | "primary"; onClick: () => void; disabled?: boolean; loading?: boolean;
}) {
  const variants = {
    default: "bg-surface text-on-surface-variant border-2 border-outline-variant hover:border-[#8B5CF6]/30 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/5",
    danger: "bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white shadow-lg shadow-[#EF4444]/25 hover:shadow-xl hover:shadow-[#EF4444]/30",
    success: "bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg shadow-[#10B981]/25 hover:shadow-xl hover:shadow-[#10B981]/30",
    whatsapp: "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg shadow-[#25D366]/25 hover:shadow-xl hover:shadow-[#25D366]/30",
    primary: "bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 active:scale-[0.97] w-full ${
        variants[variant]
      } ${disabled || loading ? "opacity-50 cursor-not-allowed" : "hover:-translate-y-0.5"}`}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <i className={`fas ${icon} text-sm`} />
      )}
      <span>{label}</span>
    </button>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ViewProductModal({ isOpen, onClose, product, onEdit }: ViewProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<number>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const toastIdRef = useRef(0);

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const copyToClipboard = useCallback(async (text: string, successMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", successMsg);
    } catch {
      showToast("error", "Failed to copy");
    }
  }, [showToast]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setSelectedImage(0);
      setMainImageError(false);
      setThumbnailErrors(new Set());
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen, product?.id]);

  // Scroll progress
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const progress = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setScrollProgress(Math.min(progress, 1));
  }, []);

  // Close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  }, [onClose]);

  // Keyboard and outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) handleClose();
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxOpen) setLightboxOpen(false);
        else handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose, lightboxOpen]);

  // Hooks before early return
  const stockConfig = useMemo(() => getStockConfig(product?.stock || 0), [product?.stock]);
  const allImages = useMemo(() => {
    const mainImage = product?.image;
    const otherImages = product?.images || [];
    if (!mainImage) return otherImages.filter(Boolean) as string[];
    const uniqueOtherImages = otherImages.filter(img => img !== mainImage);
    return [mainImage, ...uniqueOtherImages].filter(Boolean) as string[];
  }, [product?.image, product?.images]);
  const currentImage = useMemo(() => allImages[selectedImage] || null, [allImages, selectedImage]);
  const productGradient = useMemo(() => getCategoryGradient(product?.category), [product?.category]);

  if (!isOpen || !product) return null;

  const config = stockConfig;

  // ─── Tab Content ──────────────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-5">
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="space-y-3">
          <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] shadow-lg">
            <div className="aspect-video cursor-pointer" onClick={() => setLightboxOpen(true)}>
              {!mainImageError && currentImage ? (
                <img src={currentImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setMainImageError(true)} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl opacity-30 select-none">{getCategoryEmoji(product.category || "other")}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <i className="fas fa-expand text-white text-xl" />
                </div>
              </div>
            </div>
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-xs font-bold rounded-full backdrop-blur-sm">
                {selectedImage + 1} / {allImages.length}
              </div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button key={idx} onClick={() => { setSelectedImage(idx); setMainImageError(false); }}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                    selectedImage === idx ? "border-[#8b5cf6] shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                  }`}
                >
                  {!thumbnailErrors.has(idx) ? (
                    <img src={img} alt="" className="w-full h-full object-cover" onError={() => setThumbnailErrors((prev) => new Set(prev).add(idx))} />
                  ) : (
                    <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                      <i className="fas fa-image text-[#cbd5e1] text-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Info Card */}
      <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-2xl p-5 border border-outline-variant shadow-sm">
        {product.categoryName && (
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-outline-variant rounded-full text-xs font-bold text-on-surface-variant shadow-sm">
              <span className="text-lg">{getCategoryEmoji(product.category || "other")}</span>
              <span className="uppercase tracking-wider">{product.categoryName}</span>
            </span>
          </div>
        )}
        <h2 className="text-xl md:text-2xl font-black text-on-surface text-center mb-2">{product.name}</h2>
        {product.description && (
          <p className="text-sm text-on-surface-variant text-center leading-relaxed max-w-md mx-auto mb-4">{product.description}</p>
        )}
        <div className="text-center">
          <span className="inline-flex items-baseline gap-1 px-5 py-2 bg-white rounded-xl border border-outline-variant shadow-sm">                  <span className="text-xs text-outline font-bold">KES</span>
            <span className="text-3xl font-black text-[#8b5cf6]">{formatCurrency(product.price)}</span>
          </span>
        </div>
      </div>

      {/* Stock & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center">
              <i className="fas fa-box text-[#8b5cf6] text-xs" />
            </div>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Stock</span>
          </div>
          <div className="text-2xl font-black text-on-surface">{product.stock || 0}</div>
          <span className={`text-[10px] font-bold inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
            <span className={`w-1 h-1 rounded-full ${config.dot}`} />
            {config.text}
          </span>
        </div>
        <div className="bg-white rounded-xl p-4 border border-outline-variant shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${product.status === "active" ? "bg-[#10b981]" : "bg-[#ef4444]"} flex items-center justify-center`}>
              <i className={`fas ${product.status === "active" ? "fa-check-circle" : "fa-times-circle"} text-white text-xs`} />
            </div>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Status</span>
          </div>
          <div className={`text-lg font-black ${product.status === "active" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
            {product.status === "active" ? "Active" : product.status === "paused" ? "Paused" : "Inactive"}
          </div>
          <span className="text-[10px] text-outline font-medium">
            {product.status === "active" ? "Available for sale" : product.status === "paused" ? "Temporarily paused" : "Not selling"}
          </span>
        </div>
      </div>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-[#ede9fe] flex items-center justify-center">
              <i className="fas fa-layer-group text-[#8b5cf6] text-xs" />
            </div>
            <span className="text-sm font-bold text-on-surface">Variants ({product.variants.length})</span>
          </div>
          <div className="space-y-2">
            {product.variants.map((variant, idx) => (
              <div key={idx} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant hover:border-[#8b5cf6]/30 hover:shadow-sm transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#8b5cf6]">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{Object.values(variant.specs).join(" / ")}</span>
                  </div>
                  <span className="text-sm font-black text-[#8b5cf6]">KES {variant.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 pl-9">
                  <div className={`w-2 h-2 rounded-full ${variant.stock > 0 ? "bg-[#10b981]" : "bg-[#ef4444]"}`} />
                  <span className="text-xs text-on-surface-variant">{variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm">
        <PremiumSectionHeader icon="fa-info" title="Product Information" color="#8B5CF6" />
        <div className="space-y-2">
          {[
            { label: "Category", value: product.categoryName || product.category || "N/A", icon: "fa-folder", color: "text-[#8b5cf6]", bg: "bg-[#ede9fe]" },
            { label: "Brand", value: product.brand, icon: "fa-copyright", color: "text-[#3b82f6]", bg: "bg-[#dbeafe]" },
            { label: "SKU", value: product.sku, icon: "fa-barcode", color: "text-[#f59e0b]", bg: "bg-[#fef3c7]" },
            { label: "Created", value: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A", icon: "fa-calendar-alt", color: "text-[#10b981]", bg: "bg-[#d1fae5]" },
          ].filter((item) => item.value && item.value !== "N/A").map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60 hover:border-outline-variant transition-all">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <i className={`fas ${item.icon} ${item.color} text-xs`} />
                </div>
                <span className="text-xs font-bold text-outline uppercase tracking-wider">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-on-surface">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm">
        <PremiumSectionHeader icon="fa-tag" title="Pricing" color="#10B981" />
        <div className="p-4 bg-[#f0fdf4] rounded-xl border border-[#10b981]/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center">
              <i className="fas fa-money-bill-wave text-[#8b5cf6] text-xs" />
            </div>
            <span className="text-xs font-bold text-outline uppercase tracking-wider">Price</span>
          </div>
          <span className="text-2xl font-black text-[#8b5cf6]">KES {product.price.toLocaleString()}</span>
        </div>
        {product.costPrice && (
          <div className="mt-2 flex items-center justify-between p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/60">
            <span className="text-xs font-bold text-outline uppercase tracking-wider">Cost Price</span>
            <span className="text-sm font-bold text-on-surface">KES {product.costPrice.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl ${config.dot} flex items-center justify-center shadow-md`}>
              <i className="fas fa-boxes text-white text-sm" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-on-surface">Stock Level</h3>
              <p className="text-[10px] text-outline font-bold">{config.text}</p>
            </div>
          </div>
        </div>
        <div className="text-center py-6">
          <span className="text-6xl font-black text-on-surface">{product.stock ?? 0}</span>
          <span className="text-sm text-outline font-medium ml-2">units</span>
        </div>
        <div className="mt-2">
          <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${config.bar} transition-all duration-700 ease-out`} style={{ width: getStockBarWidth(product.stock || 0) }} />
          </div>
        </div>
      </div>

      {product.variants && product.variants.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm">
          <PremiumSectionHeader icon="fa-layer-group" title="Variants" color="#8B5CF6" />
          <div className="space-y-2">
            {product.variants.map((variant, idx) => (
              <div key={idx} className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant hover:border-[#8b5cf6]/30 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#8b5cf6]">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{Object.values(variant.specs).join(" / ")}</span>
                  </div>
                  <span className="text-sm font-black text-[#8b5cf6]">KES {variant.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 pl-9">
                  <div className={`w-2 h-2 rounded-full ${variant.stock > 0 ? "bg-[#10b981]" : "bg-[#ef4444]"}`} />
                  <span className="text-xs text-on-surface-variant">{variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSpecs = () => {
    const specs: { label: string; value: string; icon: string }[] = [];
    if (product.brand) specs.push({ label: "Brand", value: product.brand, icon: "fa-copyright" });
    if (product.categoryName) specs.push({ label: "Category", value: product.categoryName, icon: "fa-folder" });
    if (product.subcategory) specs.push({ label: "Subcategory", value: product.subcategory, icon: "fa-tag" });
    if (product.sku) specs.push({ label: "SKU", value: product.sku, icon: "fa-barcode" });

    return (
      <div className="space-y-5">
        {specs.length > 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-sm">
            <PremiumSectionHeader icon="fa-cogs" title="Specifications" color="#3B82F6" />
            <div className="space-y-2">
              {specs.map((spec, idx) => {
                const color = SPEC_COLORS[idx % SPEC_COLORS.length];
                return (
                  <div key={idx} className={`relative overflow-hidden bg-gradient-to-r ${color.from} ${color.to} rounded-xl p-4 border border-outline-variant/60 hover:shadow-sm transition-all`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${color.iconBg} flex items-center justify-center`}>
                          <i className={`fas ${spec.icon} ${color.icon} text-xs`} />
                        </div>
                        <span className="text-xs font-bold text-outline uppercase tracking-wider">{spec.label}</span>
                      </div>
                      <span className="text-sm font-bold text-on-surface px-2 py-1 bg-white/60 rounded-lg">{spec.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
              <i className="fas fa-info-circle text-2xl text-[#cbd5e1]" />
            </div>
            <p className="text-sm font-bold text-on-surface-variant">No specifications</p>
            <p className="text-xs text-outline mt-1">Add product details to see them here</p>
          </div>
        )}
      </div>
    );
  };

  const tabContent: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    details: renderDetails,
    inventory: renderInventory,
    specs: renderSpecs,
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      {lightboxOpen && currentImage && <ImageLightbox src={currentImage} alt={product.name} onClose={() => setLightboxOpen(false)} />}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`}
        onClick={handleClose}
      >
        <div className={`absolute inset-0 transition-all duration-300 ${isClosing ? "bg-black/0 backdrop-blur-0" : "bg-black/60 backdrop-blur-sm"}`} />

        {/* Modal */}
        <div
          ref={modalRef}
          className={`relative w-full max-w-[680px] max-h-[94vh] sm:max-h-[88vh] rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ease-out bg-surface ${
            isVisible && !isClosing ? "opacity-100 translate-y-0 sm:scale-100" : "opacity-0 translate-y-12 sm:scale-[0.97]"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scroll progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-surface-variant z-30">
            <div className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-full transition-all duration-150" style={{ width: `${scrollProgress * 100}%` }} />
          </div>

          {/* ========== HERO HEADER ========== */}
          <div className="relative h-48 md:h-52 shrink-0 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${productGradient}`} />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-8 -right-8 text-9xl text-white/20">{getCategoryEmoji(product.category || "other")}</div>
              <div className="absolute bottom-4 left-4 text-5xl opacity-50 text-white/20">✦</div>
              <div className="absolute top-6 right-12 text-3xl opacity-30 text-white/20">✦</div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${product.stock === 0 ? "" : "animate-pulse"}`} />
                  <i className="fas fa-box text-[9px]" />
                  {config.text}
                </span>
                {product.status !== "active" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ef4444]/80 backdrop-blur-md text-white border border-white/20">
                    <i className="fas fa-pause-circle text-[9px]" />
                    {product.status}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-1 leading-tight truncate">{product.name}</h1>
              <div className="flex items-center gap-3 text-sm text-white/80 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-tag text-xs opacity-70" />
                  {formatCurrency(product.price)}
                </span>
                <span className="text-white/40">•</span>
                <span className="flex items-center gap-1.5">
                  <i className="fas fa-box text-xs opacity-70" />
                  {product.stock || 0} in stock
                </span>
              </div>
            </div>

            <button onClick={handleClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 hover:rotate-90 transition-all duration-300 z-10 border border-white/20">
              <i className="fas fa-times" />
            </button>
          </div>

          {/* ========== TABS ========== */}
          <div className="border-b border-outline-variant shrink-0 bg-surface">
            <div className="flex overflow-x-auto scrollbar-hide px-3">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 md:px-4 py-3 text-[11px] md:text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab.id ? "border-[#8b5cf6] text-[#8b5cf6]" : "border-transparent text-outline hover:text-on-surface-variant"
                  }`}
                >
                  <i className={`fas ${tab.icon} text-[10px]`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* ========== SCROLLABLE BODY ========== */}
          <div ref={contentRef} className="flex-1 overflow-y-auto scroll-smooth" onScroll={handleScroll}>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3 p-4 md:p-5 border-b border-outline-variant bg-gradient-to-b from-surface to-surface-variant/30">
              <StatCard icon="fa-tag" iconBg="bg-[#EDE9FE]" iconColor="text-[#8B5CF6]" label="Price" value={formatCurrency(product.price)} delay={0} />
              <StatCard icon="fa-box" iconBg="bg-[#D1FAE5]" iconColor="text-[#10B981]" label="Stock" value={`${product.stock ?? 0} units`} delay={80} />
              <StatCard icon="fa-eye" iconBg="bg-[#FEF3C7]" iconColor="text-[#F59E0B]" label="Views" value={`${product.views || 0}`} delay={160} />
              <StatCard icon="fa-shopping-cart" iconBg="bg-[#DBEAFE]" iconColor="text-[#3B82F6]" label="Orders" value={`${product.orders || 0}`} delay={240} />
            </div>

            {/* Tab Content */}
            <div className="p-4 md:p-5">
              {tabContent[activeTab]()}
            </div>

            {/* Bottom spacing */}
            <div className="h-2" />
          </div>

          {/* ========== FOOTER ACTIONS ========== */}
          <div className="shrink-0 p-4 md:p-5 border-t border-outline-variant bg-gradient-to-t from-surface to-surface/95">
            <div className="flex flex-col gap-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <PremiumActionButton icon="fa-edit" label="Edit Product" variant="primary" onClick={() => onEdit(product)} />
                <PremiumActionButton icon="fa-link" label="Copy Link" variant="default" onClick={() => copyToClipboard(window.location.href, "Link copied!")} />
              </div>
              <PremiumActionButton icon="fa-times" label="Close" variant="default" onClick={handleClose} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
