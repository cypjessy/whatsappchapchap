"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Product, defaultProductCategories } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ViewProductModalDesktopProps {
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

const STOCK_CONFIG = {
  out: { text: "Out of Stock", color: "#ef4444", bg: "#ef4444", bgLight: "#fee2e2", gradient: "from-[#ef4444] to-[#dc2626]" },
  low: { text: "Low Stock", color: "#f59e0b", bg: "#f59e0b", bgLight: "#fef3c7", gradient: "from-[#f59e0b] to-[#d97706]" },
  medium: { text: "In Stock", color: "#3b82f6", bg: "#3b82f6", bgLight: "#dbeafe", gradient: "from-[#3b82f6] to-[#2563eb]" },
  good: { text: "Well Stocked", color: "#10b981", bg: "#10b981", bgLight: "#d1fae5", gradient: "from-[#10b981] to-[#059669]" },
};

// ─── Helper Functions ───────────────────────────────────────────────────────

function getStockConfig(stock: number, lowAlert?: number) {
  if (stock === 0) return STOCK_CONFIG.out;
  if (stock <= (lowAlert || 5)) return STOCK_CONFIG.low;
  if (stock <= 20) return STOCK_CONFIG.medium;
  return STOCK_CONFIG.good;
}

function getCategoryEmoji(category: string) {
  const found = defaultProductCategories.find((c) => c.id === category);
  return found?.icon || "📦";
}

// ── Image Lightbox ────────────────────────────────────────────────────────

function ImageLightbox({ src, alt, isOpen, onClose }: { src: string; alt: string; isOpen: boolean; onClose: () => void }) {
  const [imageError, setImageError] = useState(false);
  useEffect(() => { if (isOpen) setImageError(false); }, [isOpen, src]);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-8 animate-fadeIn" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 hover:rotate-90 transition-all duration-300">
        <i className="fas fa-times text-2xl" />
      </button>
      {imageError ? (
        <div className="text-white text-center">
          <i className="fas fa-image text-8xl opacity-50 mb-4" />
          <p className="text-lg">Image not available</p>
        </div>
      ) : (
        <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()} onError={() => setImageError(true)} />
      )}
    </div>
  );
}

// ─── Toast Component ────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[3000] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-md3-level3 text-sm font-semibold backdrop-blur-md ${
          toast.type === "success" ? "bg-[#10B981]/95 text-white" : toast.type === "error" ? "bg-[#EF4444]/95 text-white" : "bg-[#8B5CF6]/95 text-white"
        }`}>
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

function PremiumSectionHeader({ icon, title, color = "#8B5CF6" }: { icon: string; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
        <i className={`fas ${icon} text-xs`} style={{ color }} />
      </div>
      <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">{title}</span>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ViewProductModalDesktop({ isOpen, onClose, product, onEdit }: ViewProductModalDesktopProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mainImageError, setMainImageError] = useState(false);
  const [thumbnailErrors, setThumbnailErrors] = useState<Set<number>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const toastIdRef = useRef(0);

  // Reset state when modal opens
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

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const copyToClipboard = useCallback(async (text: string, successMsg: string) => {
    try { await navigator.clipboard.writeText(text); showToast("success", successMsg); }
    catch { showToast("error", "Failed to copy"); }
  }, [showToast]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); onClose(); }, 200);
  }, [onClose]);

  // All useMemo hooks before early return
  const stockConfig = useMemo(() => getStockConfig(product?.stock || 0, product?.lowStockAlert), [product?.stock, product?.lowStockAlert]);
  const hasDiscount = useMemo(() => !!(product?.salePrice && product.salePrice > 0 && product.salePrice < product?.price), [product?.salePrice, product?.price]);
  const discountPercent = useMemo(() => hasDiscount ? Math.round((((product?.price || 0) - (product?.salePrice || 0)) / (product?.price || 1)) * 100) : 0, [hasDiscount, product?.price, product?.salePrice]);
  const allImages = useMemo(() => [product?.image, ...(product?.images || [])].filter(Boolean) as string[], [product?.image, product?.images]);
  const currentImage = useMemo(() => allImages[selectedImage] || null, [allImages, selectedImage]);
  const profit = useMemo(() => (product?.costPrice ? (product?.price || 0) - product.costPrice : 0), [product?.costPrice, product?.price]);
  const profitMargin = useMemo(() => product?.costPrice && product.costPrice > 0 ? Math.round((profit / (product?.price || 1)) * 100) : 0, [product?.costPrice, profit, product?.price]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (lightboxOpen) setLightboxOpen(false); else handleClose(); }
      if (e.key === "ArrowLeft" && selectedImage > 0) { setSelectedImage((prev) => prev - 1); setMainImageError(false); }
      if (e.key === "ArrowRight" && selectedImage < allImages.length - 1) { setSelectedImage((prev) => prev + 1); setMainImageError(false); }
      if (!lightboxOpen) { const tabNum = parseInt(e.key); if (tabNum >= 1 && tabNum <= TABS.length) setActiveTab(TABS[tabNum - 1].id); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, lightboxOpen, selectedImage, allImages.length, handleClose]);

  if (!isOpen || !product) return null;

  // Render functions
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Price & Stock Hero */}
      <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-md3-level1 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#f0fdf4] to-transparent rounded-bl-full opacity-50" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl font-bold text-on-surface">{formatCurrency(product.price)}</span>
                {hasDiscount && (
                  <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-full">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>
              {hasDiscount && product.salePrice && (
                <p className="text-on-surface-variant line-through">{formatCurrency(product.salePrice)}</p>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ backgroundColor: stockConfig.bgLight }}>
              <span className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: stockConfig.color }} />
              <span className="font-bold text-sm" style={{ color: stockConfig.color }}>{stockConfig.text}</span>
            </div>
          </div>
          {product.category && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-variant rounded-full text-xs font-bold text-on-surface-variant">
              <span>{getCategoryEmoji(product.category)}</span>
              {product.categoryName || product.category}
            </span>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-md3-level1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#ede9fe] flex items-center justify-center">
              <i className="fas fa-box text-[#8b5cf6] text-sm" />
            </div>
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider">Stock Level</p>
              <p className="text-2xl font-bold text-on-surface">{product.stock || 0}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: (product.stock ?? 0) === 0 ? "0%" : (product.stock ?? 0) <= 5 ? "25%" : (product.stock ?? 0) <= 20 ? "50%" : "100%", backgroundColor: stockConfig.color }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-outline-variant shadow-md3-level1">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-[#fef3c7] flex items-center justify-center">
              <i className="fas fa-eye text-[#f59e0b] text-sm" />
            </div>
            <div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider">Total Views</p>
              <p className="text-2xl font-bold text-on-surface">{product.views || 0}</p>
            </div>
          </div>
          <p className="text-xs text-outline">Popularity metric</p>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-2xl p-6 border border-outline-variant shadow-md3-level1">
          <PremiumSectionHeader icon="fa-align-left" title="Description" color="#8B5CF6" />
          <p className="text-on-surface leading-relaxed whitespace-pre-wrap text-sm">{product.description}</p>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-md3-level1">
        <PremiumSectionHeader icon="fa-info" title="Product Details" color="#8B5CF6" />
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Category", value: product.categoryName || product.category || "N/A", icon: "fa-folder", color: "#8b5cf6" },
            { label: "SKU", value: product.sku || "N/A", icon: "fa-barcode", color: "#f59e0b" },
            { label: "Status", value: product.status || "active", icon: "fa-toggle-on", color: "#10b981" },
            { label: "Created", value: product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : "N/A", icon: "fa-calendar-alt", color: "#3b82f6" },
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60 hover:border-outline-variant transition-all">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                  <i className={`fas ${item.icon} text-xs`} style={{ color: item.color }} />
                </div>
                <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-on-surface capitalize">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-md3-level1">
        <PremiumSectionHeader icon="fa-tag" title="Pricing" color="#10B981" />
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 px-4 bg-[#f0fdf4] rounded-xl border border-[#10b981]/20">
            <span className="text-sm font-bold text-outline uppercase tracking-wider">Selling Price</span>
            <span className="text-2xl font-black text-[#8b5cf6]">{formatCurrency(product.price)}</span>
          </div>
          {product.costPrice && (
            <>
              <div className="flex justify-between items-center py-3 px-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60">
                <span className="text-sm font-bold text-outline uppercase tracking-wider">Cost Price</span>
                <span className="font-bold text-on-surface">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-[#f0fdf4] rounded-xl border border-[#10b981]/20">
                <span className="text-sm font-bold text-outline uppercase tracking-wider">Profit per unit</span>
                <span className="font-bold text-green-600">{formatCurrency(profit)}</span>
              </div>
              <div className="flex justify-between items-center py-3 px-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60">
                <span className="text-sm font-bold text-outline uppercase tracking-wider">Profit Margin</span>
                <span className="font-bold text-green-600">{profitMargin}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-md3-level1">
        <PremiumSectionHeader icon="fa-boxes" title="Inventory Overview" color="#3B82F6" />
        <div className="space-y-4">
          <div className="p-5 rounded-xl border-2" style={{ backgroundColor: stockConfig.bgLight, borderColor: `${stockConfig.color}30` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-outline uppercase tracking-wider mb-1">Current Stock</p>
                <p className="text-4xl font-black" style={{ color: stockConfig.color }}>{product.stock || 0}</p>
                <p className="text-xs text-on-surface-variant mt-1">units available</p>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${stockConfig.color}20` }}>
                  <i className="fas fa-boxes text-2xl" style={{ color: stockConfig.color }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#fef3c7] border border-[#f59e0b]/20">
              <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/20 flex items-center justify-center mb-2">
                <i className="fas fa-exclamation-triangle text-[#f59e0b] text-xs" />
              </div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider mb-1">Low Stock Alert</p>
              <p className="text-2xl font-bold text-[#f59e0b]">{product.lowStockAlert || 5}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">units threshold</p>
            </div>
            <div className="p-4 rounded-xl bg-[#ede9fe] border border-[#8b5cf6]/20">
              <div className="w-8 h-8 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center mb-2">
                <i className="fas fa-coins text-[#8b5cf6] text-xs" />
              </div>
              <p className="text-xs text-outline font-bold uppercase tracking-wider mb-1">Total Value</p>
              <p className="text-2xl font-bold text-[#8b5cf6]">{formatCurrency((product.price || 0) * (product.stock || 0))}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">at current stock</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-md3-level1">
        <PremiumSectionHeader icon="fa-chart-line" title="Sales Performance" color="#10B981" />
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#f0fdf4] rounded-xl border border-[#10b981]/20">
            <p className="text-xs text-outline font-bold uppercase tracking-wider mb-1">Units Sold</p>
            <p className="text-3xl font-black text-[#10b981]">{product.orders || 0}</p>
          </div>
          <div className="p-4 bg-[#f0fdf4] rounded-xl border border-[#10b981]/20">
            <p className="text-xs text-outline font-bold uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-black text-[#10b981]">{formatCurrency((product.price || 0) * (product.orders || 0))}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpecs = () => {
    const specs: { label: string; value: string; icon: string }[] = [];
    if (product.brand) specs.push({ label: "Brand", value: product.brand, icon: "fa-copyright" });
    if (product.categoryName) specs.push({ label: "Category", value: product.categoryName, icon: "fa-folder" });
    if (product.subcategory) specs.push({ label: "Subcategory", value: product.subcategory, icon: "fa-tag" });
    if (product.sku) specs.push({ label: "SKU", value: product.sku, icon: "fa-barcode" });

    return (
      <div className="space-y-6">
        {specs.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-outline-variant shadow-md3-level1">
            <PremiumSectionHeader icon="fa-cogs" title="Specifications" color="#3B82F6" />
            <div className="grid grid-cols-2 gap-4">
              {specs.map((spec, idx) => (
                <div key={idx} className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/60 hover:shadow-md3-level1 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-[#ede9fe] flex items-center justify-center">
                      <i className={`fas ${spec.icon} text-[#8b5cf6] text-xs`} />
                    </div>
                    <span className="text-[10px] font-bold text-outline uppercase tracking-wider">{spec.label}</span>
                  </div>
                  <p className="text-sm font-bold text-on-surface capitalize">{spec.value}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-outline-variant text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mx-auto mb-4 shadow-inner">
              <i className="fas fa-cogs text-3xl text-[#cbd5e1]" />
            </div>
            <p className="text-sm font-bold text-on-surface-variant">No specifications added</p>
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

      {/* Backdrop */}
      <div className={`fixed inset-0 z-[2000] transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`} onClick={handleClose}>
        <div className={`absolute inset-0 transition-all duration-300 ${isClosing ? "bg-black/0 backdrop-blur-0" : "bg-black/60 backdrop-blur-sm"}`} />
      </div>

      {/* Desktop Modal - Two Column Layout */}
      <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 pointer-events-none">
        <div className={`w-full max-w-6xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex pointer-events-auto border border-outline-variant overflow-hidden transition-all duration-300 ${
          isVisible && !isClosing ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
        }`}>
          
          {/* Left Column - Image Gallery */}
          <div className="w-2/5 border-r border-outline-variant overflow-y-auto bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
            <div className="p-6 space-y-4 sticky top-0">
              {/* Main Image */}
              <div className="relative group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-md3-level3 cursor-pointer" onClick={() => setLightboxOpen(true)}>
                  {!mainImageError && currentImage ? (
                    <img src={currentImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setMainImageError(true)} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-variant">
                      <span className="text-8xl opacity-30 select-none">{getCategoryEmoji(product.category || "other")}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <i className="fas fa-expand text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-md3-level3" />
                  </div>
                </div>
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 px-4 py-2 bg-black/70 backdrop-blur-sm rounded-full text-sm text-white font-medium">
                    {selectedImage + 1} / {allImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnails Grid */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {allImages.map((img, idx) => (
                    <button key={idx} onClick={() => { setSelectedImage(idx); setMainImageError(false); }}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                        selectedImage === idx ? "border-[#8b5cf6] shadow-md3-level3 scale-105" : "border-outline-variant opacity-60 hover:opacity-100"
                      }`}
                    >
                      {!thumbnailErrors.has(idx) ? (
                        <img src={img} alt="" className="w-full h-full object-cover" onError={() => setThumbnailErrors((prev) => new Set(prev).add(idx))} />
                      ) : (
                        <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                          <i className="fas fa-image text-gray-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="pt-4 border-t border-outline-variant space-y-3">
                <button onClick={() => copyToClipboard(window.location.href, "Link copied!")}
                  className="w-full px-4 py-3 bg-surface hover:bg-surface-variant rounded-xl text-sm font-bold text-on-surface transition-all flex items-center justify-center gap-2 border-2 border-outline-variant hover:border-[#8b5cf6]/30 hover:text-[#8b5cf6] active:scale-95"
                >
                  <i className="fas fa-link text-xs" />
                  Copy Product Link
                </button>
                <button onClick={() => onEdit(product)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl text-sm font-bold shadow-lg shadow-[#8b5cf6]/25 hover:shadow-xl hover:shadow-[#8b5cf6]/30 hover:-translate-y-0.5 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <i className="fas fa-edit text-xs" />
                  Edit Product
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Tabs & Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant bg-white">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {product.categoryName && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-variant text-on-surface-variant">
                      <span className="text-xs">{getCategoryEmoji(product.category || "other")}</span>
                      {product.categoryName}
                    </span>
                  )}
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${stockConfig.color}15`, color: stockConfig.color }}>
                    {stockConfig.text}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-on-surface truncate">{product.name}</h3>
              </div>
              
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <div className="hidden xl:flex items-center gap-2 mr-2 text-[10px] text-on-surface-variant">
                  <kbd className="px-2 py-1 bg-surface-variant rounded border border-outline font-mono text-[10px] font-bold">Esc</kbd>
                  <span>Close</span>
                  <kbd className="px-2 py-1 bg-surface-variant rounded border border-outline font-mono text-[10px] font-bold ml-2">1-4</kbd>
                  <span>Tabs</span>
                </div>
                <button onClick={handleClose} className="w-10 h-10 rounded-full hover:bg-surface-variant flex items-center justify-center transition-all hover:rotate-90" title="Close (Esc)">
                  <i className="fas fa-times text-on-surface-variant" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-outline-variant bg-white shrink-0">
              <div className="flex px-6">
                {TABS.map((tab, idx) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-4 text-sm font-bold border-b-2 transition-all ${
                      activeTab === tab.id ? "border-[#8b5cf6] text-[#8b5cf6]" : "border-transparent text-outline hover:text-on-surface-variant hover:border-outline"
                    }`}
                    title={`Press ${idx + 1}`}
                  >
                    <i className={`fas ${tab.icon} text-xs`} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-surface-container-lowest">
              {tabContent[activeTab]()}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <ImageLightbox src={currentImage || ""} alt={product.name} isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
    </>
  );
}
