"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  out: { text: "Out of Stock", color: "#ef4444", bg: "bg-error/10", dot: "bg-error" },
  low: { text: "Low Stock", color: "#f59e0b", bg: "bg-warning/10", dot: "bg-warning" },
  medium: { text: "In Stock", color: "#3b82f6", bg: "bg-info/10", dot: "bg-info" },
  good: { text: "In Stock", color: "#10b981", bg: "bg-success/10", dot: "bg-success" },
};

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

// ── Image Lightbox ─────────────────────────────────────────────────────────

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
  
  useEffect(() => {
    if (isOpen) {
      setImageError(false);
    }
  }, [isOpen, src]);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn" 
      onClick={onClose}
    >
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 w-12 h-12 rounded-full bg-surface-variant/20 text-on-surface-variant flex items-center justify-center hover:bg-surface-variant/30 transition-colors"
      >
        <i className="fas fa-times text-xl" />
      </button>
      {imageError ? (
        <div className="text-on-surface text-center">
          <i className="fas fa-image text-6xl opacity-50"></i>
          <p className="mt-4 text-sm">Image not available</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg animate-scaleIn"
          onClick={(e) => e.stopPropagation()}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

// ─── Toast Component ────────────────────────────────────────────────────────

function Toast({ toasts }: { toasts: { id: number; type: string; message: string }[] }) {
  return (
    <div className="fixed top-4 right-4 z-[3000] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 min-w-[300px] animate-slideInRight
            ${toast.type === "success" ? "bg-success text-on-success" : "bg-error text-on-error"}
          `}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`} />
          <span className="text-sm font-medium">{toast.message}</span>
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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setSelectedImage(0);
      setMainImageError(false);
      setThumbnailErrors(new Set());
    }
  }, [isOpen, product?.id]);

  // Toast helper
  const showToast = useCallback((type: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  // Close handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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

  // ✅ ALL useMemo hooks must be HERE, before any early return
  const stockConfig = useMemo(
    () => getStockConfig(product?.stock || 0),
    [product?.stock]
  );
  
  const allImages = useMemo(
    () => [product?.image, ...(product?.images || [])].filter(Boolean) as string[],
    [product?.image, product?.images]
  );
  
  const currentImage = useMemo(
    () => allImages[selectedImage] || null, 
    [allImages, selectedImage]
  );

  // ✅ Early return AFTER all hooks
  if (!isOpen || !product) return null;

  // ─── Tab Content Renderers ────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-4 animate-fadeIn">
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="space-y-3">
          <div className="relative group">
            <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 cursor-pointer shadow-lg" onClick={() => setLightboxOpen(true)}>
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
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-all duration-300 flex items-center justify-center">
                <i className="fas fa-expand text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </div>
            
            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-semibold rounded-full shadow-lg backdrop-blur-sm">
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
                    flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all
                    ${selectedImage === idx ? "border-primary shadow-lg scale-105" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"}
                  `}
                >
                  {!thumbnailErrors.has(idx) ? (
                    <img 
                      src={img} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={() => {
                        setThumbnailErrors(prev => new Set(prev).add(idx));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      <i className="fas fa-image text-primary/30" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Header Card */}
      <div className="bg-gradient-to-br from-primary/15 via-surface to-secondary/15 rounded-2xl p-6 space-y-4 shadow-lg border border-outline-variant/30 relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        
        {/* Category Badge */}
        {product.categoryName && (
          <div className="flex items-center justify-center gap-2 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-surface/90 backdrop-blur-sm rounded-full shadow-md border border-outline-variant/40 hover:border-primary/40 transition-colors">
              <span className="text-xl">{getCategoryEmoji(product.category || "other")}</span>
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">{product.categoryName}</span>
            </div>
          </div>
        )}

        {/* Product Name */}
        <h2 className="text-2xl font-black text-on-surface text-center leading-tight relative z-10">{product.name}</h2>
        
        {/* Description */}
        {product.description && (
          <p className="text-sm text-on-surface-variant text-center leading-relaxed relative z-10 max-w-md mx-auto">{product.description}</p>
        )}

        {/* Price with gradient */}
        <div className="text-center relative z-10">
          <div className="inline-flex items-baseline gap-2 px-6 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-outline-variant/30 shadow-inner">
            <span className="text-4xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
              {formatCurrency(product.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Stock & Status Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Stock Card */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${stockConfig.dot === 'bg-success' ? 'from-emerald-500/20 via-emerald-400/10 to-emerald-500/15' : stockConfig.dot === 'bg-warning' ? 'from-amber-500/20 via-amber-400/10 to-amber-500/15' : stockConfig.dot === 'bg-error' ? 'from-red-500/20 via-red-400/10 to-red-500/15' : 'from-blue-500/20 via-blue-400/10 to-blue-500/15'} rounded-2xl p-5 border border-outline-variant/30 shadow-lg group hover:shadow-xl transition-all duration-300`}>
          {/* Background glow effect */}
          <div className={`absolute -top-8 -right-8 w-24 h-24 ${stockConfig.dot} opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`} />
          
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className={`w-10 h-10 rounded-xl ${stockConfig.dot} flex items-center justify-center shadow-lg ring-2 ring-white/20`}>
              <i className="fas fa-box text-white text-sm" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Stock</span>
          </div>
          <div className="text-3xl font-black text-on-surface relative z-10">{product.stock || 0}</div>
          <div className="text-xs font-bold mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-surface/50 rounded-lg" style={{ color: stockConfig.color }}>
            <div className={`w-1.5 h-1.5 rounded-full ${stockConfig.dot}`} />
            {stockConfig.text}
          </div>
        </div>

        {/* Status Card */}
        <div className={`relative overflow-hidden bg-gradient-to-br ${product.status === "active" ? 'from-emerald-500/20 via-emerald-400/10 to-emerald-500/15' : 'from-red-500/20 via-red-400/10 to-red-500/15'} rounded-2xl p-5 border border-outline-variant/30 shadow-lg group hover:shadow-xl transition-all duration-300`}>
          {/* Background glow effect */}
          <div className={`absolute -top-8 -right-8 w-24 h-24 ${product.status === "active" ? 'bg-success' : 'bg-error'} opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`} />
          
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className={`w-10 h-10 rounded-xl ${product.status === "active" ? 'bg-success' : 'bg-error'} flex items-center justify-center shadow-lg ring-2 ring-white/20`}>
              <i className={`fas ${product.status === "active" ? 'fa-check-circle' : 'fa-times-circle'} text-white text-sm`} />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</span>
          </div>
          <div className={`text-xl font-black ${product.status === "active" ? 'text-success' : 'text-error'} relative z-10`}>
            {product.status === "active" ? "Active" : "Inactive"}
          </div>
          <div className="text-xs font-semibold text-on-surface-variant/70 mt-2 relative z-10">
            {product.status === "active" ? "Available for sale" : "Not selling"}
          </div>
        </div>
      </div>

      {/* Variants Section */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <i className="fas fa-layer-group text-primary text-xs" />
            </div>
            <span className="text-sm font-bold text-on-surface">Variants ({product.variants.length})</span>
          </div>
          
          <div className="space-y-2">
            {product.variants.map((variant, idx) => (
              <div key={idx} className="bg-gradient-to-r from-surface to-surface-variant/10 rounded-xl p-4 border border-outline-variant/20 hover:border-primary/30 transition-all hover:shadow-sm group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <span className="text-xs font-bold text-primary">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-semibold text-on-surface">{Object.values(variant.specs).join(" / ")}</span>
                  </div>
                  <span className="text-sm font-black text-primary">{formatCurrency(variant.price)}</span>
                </div>
                <div className="flex items-center gap-2 pl-10">
                  <div className={`w-2 h-2 rounded-full ${variant.stock > 0 ? 'bg-success' : 'bg-error'}`} />
                  <span className="text-xs font-medium text-on-surface-variant">
                    {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters/Options Section */}
      {product.filters && Object.keys(product.filters).length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded-lg bg-secondary/10 flex items-center justify-center">
              <i className="fas fa-tags text-secondary text-xs" />
            </div>
            <span className="text-sm font-bold text-on-surface">Options</span>
          </div>
          
          <div className="bg-surface-variant/10 rounded-xl p-4 border border-outline-variant/20">
            <div className="flex flex-wrap gap-2">
              {Object.entries(product.filters).map(([key, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                  return values.map((value, idx) => (
                    <span key={`${key}-${idx}`} className="px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-full text-xs font-semibold text-on-surface-variant hover:from-primary/20 hover:to-secondary/20 transition-all cursor-default shadow-sm">
                      {value}
                    </span>
                  ));
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4 animate-fadeIn">
      {/* Product Information Card */}
      <div className="bg-gradient-to-br from-blue-500/15 via-surface to-indigo-500/15 rounded-2xl p-6 border border-outline-variant/30 shadow-lg relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg ring-2 ring-white/20">
            <i className="fas fa-info text-white text-base" />
          </div>
          <h3 className="text-xl font-black text-on-surface">Product Information</h3>
        </div>
        
        <div className="space-y-3 relative z-10">
          {/* Category */}
          <div className="flex items-center justify-between p-4 bg-surface/80 backdrop-blur-sm rounded-xl border border-outline-variant/30 hover:border-primary/40 transition-all group shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <span className="text-xl">{getCategoryEmoji(product.category || "other")}</span>
              </div>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Category</span>
            </div>
            <span className="text-sm font-black text-on-surface px-3 py-1.5 bg-primary/10 rounded-lg">{product.categoryName || product.category || "N/A"}</span>
          </div>
          
          {/* Brand */}
          {product.brand && (
            <div className="flex items-center justify-between p-4 bg-surface/80 backdrop-blur-sm rounded-xl border border-outline-variant/30 hover:border-info/40 transition-all group shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-info/20 to-info/10 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <i className="fas fa-copyright text-info text-base" />
                </div>
                <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Brand</span>
              </div>
              <span className="text-sm font-black text-on-surface px-3 py-1.5 bg-info/10 rounded-lg">{product.brand}</span>
            </div>
          )}
          
          {/* Created Date */}
          <div className="flex items-center justify-between p-4 bg-surface/80 backdrop-blur-sm rounded-xl border border-outline-variant/30 hover:border-warning/40 transition-all group shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                <i className="fas fa-calendar-alt text-warning text-base" />
              </div>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Created</span>
            </div>
            <span className="text-sm font-black text-on-surface px-3 py-1.5 bg-warning/10 rounded-lg">
              {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Card */}
      <div className="bg-gradient-to-br from-emerald-500/15 via-surface to-green-500/15 rounded-2xl p-6 border border-outline-variant/30 shadow-lg relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-to-tr from-success/10 to-success/5 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success to-success-dark flex items-center justify-center shadow-lg ring-2 ring-white/20">
            <i className="fas fa-tag text-white text-base" />
          </div>
          <h3 className="text-xl font-black text-on-surface">Pricing</h3>
        </div>
        
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between p-5 bg-surface/80 backdrop-blur-sm rounded-xl border border-outline-variant/30 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md">
                <i className="fas fa-money-bill-wave text-primary text-base" />
              </div>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">Price</span>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
              {formatCurrency(product.price)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-4 animate-fadeIn">
      {/* Stock Overview Card */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${stockConfig.dot === 'bg-success' ? 'from-emerald-500/25 via-emerald-400/15 to-emerald-500/20' : stockConfig.dot === 'bg-warning' ? 'from-amber-500/25 via-amber-400/15 to-amber-500/20' : stockConfig.dot === 'bg-error' ? 'from-red-500/25 via-red-400/15 to-red-500/20' : 'from-blue-500/25 via-blue-400/15 to-blue-500/20'} rounded-2xl p-6 border border-outline-variant/30 shadow-xl`}>
        {/* Decorative background effects */}
        <div className={`absolute -top-16 -right-16 w-48 h-48 ${stockConfig.dot} opacity-15 rounded-full blur-3xl`} />
        <div className={`absolute -bottom-16 -left-16 w-48 h-48 ${stockConfig.dot} opacity-10 rounded-full blur-3xl`} />
        
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${stockConfig.dot} flex items-center justify-center shadow-xl ring-2 ring-white/20`}>
              <i className="fas fa-boxes text-white text-xl" />
            </div>
            <h3 className="text-xl font-black text-on-surface">Stock Level</h3>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${stockConfig.bg} shadow-lg border border-outline-variant/30 backdrop-blur-sm`}>
            <div className={`w-2.5 h-2.5 rounded-full ${stockConfig.dot} animate-pulse`} />
            <span className="text-xs font-black" style={{ color: stockConfig.color }}>{stockConfig.text}</span>
          </div>
        </div>
        
        <div className="text-center py-6 relative z-10">
          <div className="inline-flex items-baseline gap-1">
            <span className="text-7xl font-black text-on-surface drop-shadow-lg">{product.stock ?? 0}</span>
            <span className="text-base font-bold text-on-surface-variant ml-2">units</span>
          </div>
          <div className="text-sm text-on-surface-variant mt-3 font-semibold">available in inventory</div>
        </div>

        {/* Stock Level Indicator */}
        <div className="mt-6 pt-5 border-t border-outline-variant/30 relative z-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Stock Level</span>
            <span className="text-xs font-black" style={{ color: stockConfig.color }}>{stockConfig.text}</span>
          </div>
          <div className="w-full h-4 bg-surface/50 rounded-full overflow-hidden shadow-inner border border-outline-variant/20">
            <div 
              className={`h-full rounded-full transition-all duration-700 ease-out ${stockConfig.dot} shadow-lg`} 
              style={{ 
                width: (product.stock ?? 0) === 0 ? '0%' : (product.stock ?? 0) <= 5 ? '25%' : (product.stock ?? 0) <= 20 ? '50%' : '100%' 
              }} 
            />
          </div>
        </div>
      </div>


      {/* Variants Section */}
      {product.variants && product.variants.length > 0 && (
        <div className="bg-gradient-to-br from-purple-500/15 via-surface to-violet-500/15 rounded-2xl p-6 border border-outline-variant/30 shadow-lg relative overflow-hidden">
          {/* Decorative glow */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-purple-500/10 to-violet-500/10 rounded-full blur-3xl" />
          
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center shadow-xl ring-2 ring-white/20">
              <i className="fas fa-layer-group text-white text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-black text-on-surface">Product Variants</h3>
              <p className="text-xs text-on-surface-variant font-bold">{product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <div className="space-y-3 relative z-10">
            {product.variants.map((variant, idx) => (
              <div key={idx} className="bg-surface/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/30 hover:border-purple-500/40 transition-all hover:shadow-lg group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-violet-500/20 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <span className="text-sm font-black text-purple-600">{idx + 1}</span>
                    </div>
                    <span className="text-sm font-bold text-on-surface">{Object.values(variant.specs).join(" / ")}</span>
                  </div>
                  <span className="text-lg font-black bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">{formatCurrency(variant.price)}</span>
                </div>
                <div className="flex items-center gap-2 pl-13">
                  <div className={`w-2.5 h-2.5 rounded-full ${variant.stock > 0 ? 'bg-success' : 'bg-error'} shadow-md`} />
                  <span className="text-xs font-bold text-on-surface-variant">
                    {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
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
    // Build specs from filters or product fields
    const specs: { label: string; value: string; icon: string; color: string }[] = [];
    
    if (product.brand) specs.push({ label: "Brand", value: product.brand, icon: "fa-copyright", color: "text-info" });
    if (product.categoryName) specs.push({ label: "Category", value: product.categoryName, icon: "fa-folder", color: "text-primary" });
    if (product.subcategory) specs.push({ label: "Subcategory", value: product.subcategory, icon: "fa-tag", color: "text-secondary" });
    
    const specColors = [
      'from-blue-500/20 to-blue-400/10', 
      'from-purple-500/20 to-purple-400/10', 
      'from-pink-500/20 to-pink-400/10', 
      'from-orange-500/20 to-orange-400/10', 
      'from-green-500/20 to-green-400/10'
    ];
    
    return (
      <div className="space-y-4 animate-fadeIn">
        {specs.length > 0 ? (
          <div className="bg-gradient-to-br from-cyan-500/15 via-surface to-teal-500/15 rounded-2xl p-6 border border-outline-variant/30 shadow-lg relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl" />
            
            <div className="flex items-center gap-3 mb-5 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-xl ring-2 ring-white/20">
                <i className="fas fa-cogs text-white text-xl" />
              </div>
              <div>
                <h3 className="text-xl font-black text-on-surface">Specifications</h3>
                <p className="text-xs text-on-surface-variant font-bold">{specs.length} specification{specs.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <div className="space-y-3 relative z-10">
              {specs.map((spec, idx) => (
                <div key={idx} className={`relative overflow-hidden bg-gradient-to-r ${specColors[idx % specColors.length]} rounded-xl p-5 border border-outline-variant/30 hover:shadow-lg transition-all group`}>
                  {/* Subtle background glow */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface/80 backdrop-blur-sm flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <i className={`fas ${spec.icon} ${spec.color} text-base`} />
                      </div>
                      <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wide">{spec.label}</span>
                    </div>
                    <span className="text-sm font-black text-on-surface px-3 py-1.5 bg-surface/60 rounded-lg shadow-sm">{spec.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-500/10 via-surface to-gray-400/10 rounded-2xl p-16 border border-outline-variant/30 text-center relative overflow-hidden">
            {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-on-surface-variant rounded-full" />
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 border-4 border-on-surface-variant rotate-45" />
            </div>
            
            <div className="relative z-10">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-surface-variant/40 to-surface-variant/20 flex items-center justify-center mx-auto mb-5 shadow-xl">
                <i className="fas fa-info-circle text-4xl text-on-surface-variant/60" />
              </div>
              <p className="text-base font-black text-on-surface-variant">No specifications available</p>
              <p className="text-xs text-on-surface-variant/70 mt-2 font-medium">Add product details to see them here</p>
            </div>
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
        className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal - Mobile Bottom Sheet Only */}
      <div className="fixed inset-0 z-[2100] flex items-end justify-center pointer-events-none">
        <div className="w-full max-h-[90vh] bg-surface rounded-t-3xl shadow-2xl flex flex-col pointer-events-auto animate-slideUp">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0">
                {!mainImageError && currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setMainImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl">{getCategoryEmoji(product.category || "other")}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-on-surface truncate">{product.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">{formatCurrency(product.price)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              
              <button
                onClick={() => onEdit(product)}
                className="w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center transition-colors"
                title="Edit Product (E)"
              >
                <i className="fas fa-edit text-on-surface-variant" />
              </button>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center transition-colors"
                title="Close (Esc)"
              >
                <i className="fas fa-times text-on-surface-variant" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-outline-variant/30">
            <div className="flex overflow-x-auto scrollbar-hide px-4">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-on-surface-variant hover:text-on-surface hover:border-on-surface-variant/30"
                    }
                  `}
                >
                  <i className={`fas ${tab.icon}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content - Mobile Only */}
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
      <Toast toasts={toasts} />
    </>
  );
}