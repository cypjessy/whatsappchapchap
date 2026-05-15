"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "fa-eye" },
  { id: "details", label: "Details", icon: "fa-list" },
  { id: "inventory", label: "Inventory", icon: "fa-boxes" },
  { id: "specs", label: "Specs", icon: "fa-cogs" },
];

const STOCK_CONFIG = {
  out: { text: "Out of Stock", color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", dot: "bg-[#ef4444]", bar: "bg-[#ef4444]" },
  low: { text: "Low Stock", color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10", dot: "bg-[#f59e0b]", bar: "bg-[#f59e0b]" },
  medium: { text: "In Stock", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", dot: "bg-[#3b82f6]", bar: "bg-[#3b82f6]" },
  good: { text: "In Stock", color: "text-[#10b981]", bg: "bg-[#10b981]/10", dot: "bg-[#10b981]", bar: "bg-[#10b981]" },
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

function getStockBarWidth(stock: number): string {
  if (stock === 0) return "0%";
  if (stock <= 5) return "25%";
  if (stock <= 20) return "50%";
  return "100%";
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function ImageLightbox({
  src,
  alt,
  isOpen,
  onClose,
}: {
  src: string;
  alt: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setImageError(false);
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen, src]);

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[2500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4
        transition-opacity duration-300
        ${isVisible ? "opacity-100" : "opacity-0"}
      `}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
      >
        <i className="fas fa-times text-xl" />
      </button>
      {imageError ? (
        <div className="text-white text-center">
          <i className="fas fa-image text-6xl opacity-50 mb-4" />
          <p className="text-sm">Image not available</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={`
            max-w-full max-h-[85vh] object-contain rounded-lg
            transition-all duration-300
            ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}
          `}
          onClick={(e) => e.stopPropagation()}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: { id: number; type: string; message: string }[] }) {
  return (
    <div className="fixed top-4 right-4 z-[3000] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px]
            transition-all duration-300 animate-slideInRight
            ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"}
          `}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ViewProductModal({ isOpen, onClose, product, onEdit }: ViewProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<number>>(new Set());
  const [modalVisible, setModalVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setSelectedImage(0);
      setMainImageError(false);
      setThumbnailErrors(new Set());
      requestAnimationFrame(() => setModalVisible(true));
    } else {
      setModalVisible(false);
    }
  }, [isOpen, product?.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        if (lightboxOpen) setLightboxOpen(false);
        else onClose();
      }
      if (e.key === "e" || e.key === "E") {
        if (product) onEdit(product);
      }
      if (e.key === "ArrowLeft" && allImages.length > 1) {
        setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
        setMainImageError(false);
      }
      if (e.key === "ArrowRight" && allImages.length > 1) {
        setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
        setMainImageError(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, lightboxOpen, product, onClose, onEdit]);

  // Toast helper
  const showToast = useCallback((type: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Copy to clipboard
  const copyToClipboard = useCallback(
    async (text: string, successMsg: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("success", successMsg);
      } catch {
        showToast("error", "Failed to copy");
      }
    },
    [showToast]
  );

  // Computed values
  const stockConfig = useMemo(() => getStockConfig(product?.stock || 0), [product?.stock]);
  const allImages = useMemo(() => {
    const mainImage = product?.image;
    const otherImages = product?.images || [];
    
    // If no main image, just return other images
    if (!mainImage) return otherImages.filter(Boolean) as string[];
    
    // Filter out duplicate of main image from other images
    const uniqueOtherImages = otherImages.filter(img => img !== mainImage);
    
    // Return main image + unique other images
    return [mainImage, ...uniqueOtherImages].filter(Boolean) as string[];
  }, [product?.image, product?.images]);
  const currentImage = useMemo(() => allImages[selectedImage] || null, [allImages, selectedImage]);

  // Early return
  if (!isOpen || !product) return null;

  // ─── Tab Content Renderers ────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-5 animate-fadeIn">
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="space-y-3">
          <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] shadow-lg">
            <div
              className="aspect-video cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            >
              {!mainImageError && currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={() => setMainImageError(true)}
                />
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

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(idx);
                    setMainImageError(false);
                  }}
                  className={`
                    flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200
                    ${selectedImage === idx
                      ? "border-[#8b5cf6] shadow-md scale-105"
                      : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                    }
                  `}
                >
                  {!thumbnailErrors.has(idx) ? (
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={() => setThumbnailErrors((prev) => new Set(prev).add(idx))}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#f1f5f9] flex items-center justify-center">
                      <i className="fas fa-image text-[#cbd5e1] text-sm" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Header */}
      <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
        {product.categoryName && (
          <div className="flex justify-center mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-full text-xs font-bold text-[#64748b] shadow-sm">
              <span className="text-lg">{getCategoryEmoji(product.category || "other")}</span>
              <span className="uppercase tracking-wider">{product.categoryName}</span>
            </span>
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-black text-[#1e293b] text-center mb-2">{product.name}</h2>

        {product.description && (
          <p className="text-sm text-[#64748b] text-center leading-relaxed max-w-md mx-auto mb-4">
            {product.description}
          </p>
        )}

        <div className="text-center">
          <span className="inline-flex items-baseline gap-1 px-5 py-2 bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
            <span className="text-xs text-[#94a3b8] font-bold">KES</span>
            <span className="text-3xl font-black text-[#8b5cf6]">{product.price.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Stock & Status */}
      <div className="grid grid-cols-2 gap-3">
        {/* Stock */}
        <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${stockConfig.dot} flex items-center justify-center`}>
              <i className="fas fa-box text-white text-xs" />
            </div>
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Stock</span>
          </div>
          <div className="text-2xl font-black text-[#1e293b]">{product.stock || 0}</div>
          <span className={`text-[10px] font-bold inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full ${stockConfig.bg} ${stockConfig.color}`}>
            <span className={`w-1 h-1 rounded-full ${stockConfig.dot}`} />
            {stockConfig.text}
          </span>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg ${product.status === "active" ? "bg-[#10b981]" : "bg-[#ef4444]"} flex items-center justify-center`}>
              <i className={`fas ${product.status === "active" ? "fa-check-circle" : "fa-times-circle"} text-white text-xs`} />
            </div>
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Status</span>
          </div>
          <div className={`text-lg font-black ${product.status === "active" ? "text-[#10b981]" : "text-[#ef4444]"}`}>
            {product.status === "active" ? "Active" : "Inactive"}
          </div>
          <span className="text-[10px] text-[#94a3b8] font-medium">
            {product.status === "active" ? "Available for sale" : "Not selling"}
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
            <span className="text-sm font-bold text-[#1e293b]">Variants ({product.variants.length})</span>
          </div>

          <div className="space-y-2">
            {product.variants.map((variant, idx) => (
              <div
                key={idx}
                className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6]/30 hover:shadow-sm transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#8b5cf6]">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#1e293b]">{Object.values(variant.specs).join(" / ")}</span>
                  </div>
                  <span className="text-sm font-black text-[#8b5cf6]">KES {variant.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 pl-9">
                  <div className={`w-2 h-2 rounded-full ${variant.stock > 0 ? "bg-[#10b981]" : "bg-[#ef4444]"}`} />
                  <span className="text-xs text-[#64748b]">
                    {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters/Options */}
      {product.filters && Object.keys(product.filters).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-[#dbeafe] flex items-center justify-center">
              <i className="fas fa-tags text-[#3b82f6] text-xs" />
            </div>
            <span className="text-sm font-bold text-[#1e293b]">Options</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(product.filters).map(([key, values]) => {
              if (Array.isArray(values) && values.length > 0) {
                return values.map((value, idx) => (
                  <span
                    key={`${key}-${idx}`}
                    className="px-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-xs font-semibold text-[#64748b] hover:border-[#8b5cf6]/30 transition-all"
                  >
                    {value}
                  </span>
                ));
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-5 animate-fadeIn">
      {/* Info Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center">
            <i className="fas fa-info text-[#8b5cf6] text-sm" />
          </div>
          <h3 className="text-lg font-bold text-[#1e293b]">Product Information</h3>
        </div>

        <div className="space-y-2">
          {[
            { label: "Category", value: product.categoryName || product.category || "N/A", icon: "fa-folder", color: "text-[#8b5cf6]", bg: "bg-[#ede9fe]" },
            { label: "Brand", value: product.brand, icon: "fa-copyright", color: "text-[#3b82f6]", bg: "bg-[#dbeafe]" },
            { label: "Created", value: product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A", icon: "fa-calendar-alt", color: "text-[#f59e0b]", bg: "bg-[#fef3c7]" },
          ].filter((item) => item.value).map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]/60 hover:border-[#e2e8f0] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <i className={`fas ${item.icon} ${item.color} text-xs`} />
                </div>
                <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-[#1e293b]">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#dcfce7] flex items-center justify-center">
            <i className="fas fa-tag text-[#10b981] text-sm" />
          </div>
          <h3 className="text-lg font-bold text-[#1e293b]">Pricing</h3>
        </div>
        <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center">
              <i className="fas fa-money-bill-wave text-[#8b5cf6] text-xs" />
            </div>
            <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Price</span>
          </div>
          <span className="text-2xl font-black text-[#8b5cf6]">KES {product.price.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-5 animate-fadeIn">
      {/* Stock Overview */}
      <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-xl ${stockConfig.dot} flex items-center justify-center shadow-md`}>
              <i className="fas fa-boxes text-white text-sm" />
            </div>
            <h3 className="text-lg font-bold text-[#1e293b]">Stock Level</h3>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${stockConfig.bg} ${stockConfig.color} border border-current/10`}>
            <span className={`w-1.5 h-1.5 rounded-full ${stockConfig.dot} animate-pulse`} />
            {stockConfig.text}
          </span>
        </div>

        <div className="text-center py-6">
          <span className="text-6xl font-black text-[#1e293b]">{product.stock ?? 0}</span>
          <span className="text-sm text-[#94a3b8] font-medium ml-2">units</span>
        </div>

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between text-[10px] font-bold text-[#94a3b8] uppercase mb-1.5">
            <span>Stock Level</span>
            <span className={stockConfig.color}>{stockConfig.text}</span>
          </div>
          <div className="w-full h-3 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${stockConfig.bar} transition-all duration-700 ease-out`}
              style={{ width: getStockBarWidth(product.stock || 0) }}
            />
          </div>
        </div>
      </div>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center">
              <i className="fas fa-layer-group text-[#8b5cf6] text-sm" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1e293b]">Variants</h3>
              <p className="text-[10px] text-[#94a3b8] font-bold">{product.variants.length} total</p>
            </div>
          </div>

          <div className="space-y-2">
            {product.variants.map((variant, idx) => (
              <div
                key={idx}
                className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6]/30 hover:shadow-sm transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                      <span className="text-xs font-bold text-[#8b5cf6]">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#1e293b]">{Object.values(variant.specs).join(" / ")}</span>
                  </div>
                  <span className="text-sm font-black text-[#8b5cf6]">KES {variant.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 pl-9">
                  <div className={`w-2 h-2 rounded-full ${variant.stock > 0 ? "bg-[#10b981]" : "bg-[#ef4444]"}`} />
                  <span className="text-xs text-[#64748b]">
                    {variant.stock > 0 ? `${variant.stock} in stock` : "Out of stock"}
                  </span>
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

    return (
      <div className="space-y-5 animate-fadeIn">
        {specs.length > 0 ? (
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#dbeafe] flex items-center justify-center">
                <i className="fas fa-cogs text-[#3b82f6] text-sm" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1e293b]">Specifications</h3>
                <p className="text-[10px] text-[#94a3b8] font-bold">{specs.length} items</p>
              </div>
            </div>

            <div className="space-y-2">
              {specs.map((spec, idx) => {
                const color = SPEC_COLORS[idx % SPEC_COLORS.length];
                return (
                  <div
                    key={idx}
                    className={`relative overflow-hidden bg-gradient-to-r ${color.from} ${color.to} rounded-xl p-4 border border-[#e2e8f0]/60 hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${color.iconBg} flex items-center justify-center`}>
                          <i className={`fas ${spec.icon} ${color.icon} text-xs`} />
                        </div>
                        <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{spec.label}</span>
                      </div>
                      <span className="text-sm font-bold text-[#1e293b] px-2 py-1 bg-white/60 rounded-lg">{spec.value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-[#64748b]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
              <i className="fas fa-info-circle text-2xl text-[#cbd5e1]" />
            </div>
            <p className="text-sm font-bold text-[#475569]">No specifications</p>
            <p className="text-xs text-[#94a3b8] mt-1">Add product details to see them here</p>
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm
          transition-opacity duration-300
          ${modalVisible ? "opacity-100" : "opacity-0"}
        `}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[2100] flex items-end md:items-center justify-center pointer-events-none p-0 md:p-4">
        <div
          ref={modalRef}
          className={`
            w-full md:w-[600px] md:max-w-2xl max-h-[90vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col pointer-events-auto
            transition-all duration-300 ease-out
            ${modalVisible ? "opacity-100 translate-y-0 md:scale-100" : "opacity-100 translate-y-full md:scale-95"}
          `}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0] shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#f8fafc] flex-shrink-0 border border-[#e2e8f0]">
                {!mainImageError && currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setMainImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xl">{getCategoryEmoji(product.category || "other")}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#1e293b] truncate">{product.name}</h3>
                <p className="text-xs text-[#8b5cf6] font-bold">KES {product.price.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onEdit(product)}
                className="w-9 h-9 rounded-lg hover:bg-[#f8fafc] flex items-center justify-center transition-colors active:scale-90"
                title="Edit (E)"
              >
                <i className="fas fa-edit text-[#64748b] text-sm" />
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg hover:bg-[#f8fafc] flex items-center justify-center transition-colors active:scale-90"
                title="Close (Esc)"
              >
                <i className="fas fa-times text-[#64748b] text-sm" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#e2e8f0] shrink-0">
            <div className="flex overflow-x-auto scrollbar-hide px-2">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all
                    ${activeTab === tab.id
                      ? "border-[#8b5cf6] text-[#8b5cf6]"
                      : "border-transparent text-[#94a3b8] hover:text-[#64748b]"
                    }
                  `}
                >
                  <i className={`fas ${tab.icon} text-[10px]`} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {tabContent[activeTab]()}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        src={currentImage || ""}
        alt={product.name}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </>
  );
}