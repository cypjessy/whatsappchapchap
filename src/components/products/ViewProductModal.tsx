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
    <div className="space-y-5 animate-fadeIn">
      {/* Image Gallery */}
      {allImages.length > 0 && (
        <div className="space-y-3">
          <div className="relative group">
            <div className="aspect-video rounded-2xl overflow-hidden bg-surface-variant cursor-pointer" onClick={() => setLightboxOpen(true)}>
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
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <i className="fas fa-expand text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </div>
            
            {/* Image Counter */}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white">
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
                    ${selectedImage === idx ? "border-primary shadow-md" : "border-transparent opacity-60 hover:opacity-100"}
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
                    <div className="w-full h-full bg-surface-variant flex items-center justify-center">
                      <i className="fas fa-image text-on-surface-variant/30" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Product Name */}
      <div>
        <h2 className="text-xl font-bold text-on-surface">{product.name}</h2>
        {product.description && (
          <p className="text-sm text-on-surface-variant mt-2">{product.description}</p>
        )}
      </div>

      {/* Category */}
      {product.categoryName && (
        <div className="flex items-center gap-2">
          <span className="text-xl">{getCategoryEmoji(product.category || "other")}</span>
          <span className="text-sm text-on-surface-variant">{product.categoryName}</span>
        </div>
      )}

      {/* Price */}
      <div className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</div>

      {/* Stock & Status */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-variant/20 rounded-xl p-3">
          <div className="text-xs text-on-surface-variant mb-1">Stock</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stockConfig.dot}`} />
            <span className="text-lg font-bold text-on-surface">{product.stock || 0}</span>
          </div>
        </div>
        <div className="bg-surface-variant/20 rounded-xl p-3">
          <div className="text-xs text-on-surface-variant mb-1">Status</div>
          <span className={`text-sm font-semibold ${product.status === "active" ? "text-success" : "text-error"}`}>
            {product.status === "active" ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-on-surface">Variants</div>
          {product.variants.map((variant, idx) => (
            <div key={idx} className="bg-surface-variant/20 rounded-xl p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-on-surface">{Object.values(variant.specs).join(" / ")}</span>
                <span className="text-sm font-bold text-primary">{formatCurrency(variant.price)}</span>
              </div>
              <div className="text-xs text-on-surface-variant mt-1">{variant.stock} in stock</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters/Options */}
      {product.filters && Object.keys(product.filters).length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-semibold text-on-surface">Options</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(product.filters).map(([key, values]) => {
              if (Array.isArray(values) && values.length > 0) {
                return values.map((value, idx) => (
                  <span key={`${key}-${idx}`} className="px-3 py-1 bg-surface-variant/30 rounded-full text-xs text-on-surface-variant">
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
    <div className="space-y-6 animate-fadeIn">
      {/* Product Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-on-surface">Product Information</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
            <span className="text-sm text-on-surface-variant">Category</span>
            <span className="text-sm font-medium text-on-surface">{product.categoryName || product.category || "N/A"}</span>
          </div>
          
          {product.brand && (
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
              <span className="text-sm text-on-surface-variant">Brand</span>
              <span className="text-sm font-medium text-on-surface">{product.brand}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
            <span className="text-sm text-on-surface-variant">Created</span>
            <span className="text-sm font-medium text-on-surface">
              {product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-on-surface">Pricing</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
            <span className="text-sm text-on-surface-variant">Price</span>
            <span className="text-sm font-semibold text-on-surface">{formatCurrency(product.price)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Stock Overview */}
      <div className="bg-surface-variant/20 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-on-surface">Stock Level</h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${stockConfig.bg}`}>
            <div className={`w-2 h-2 rounded-full ${stockConfig.dot}`} />
            <span className="text-xs font-semibold" style={{ color: stockConfig.color }}>{stockConfig.text}</span>
          </div>
        </div>
        
        <div className="text-center">
          <span className="text-5xl font-bold text-on-surface">{product.stock || 0}</span>
          <div className="text-sm text-on-surface-variant mt-1">units available</div>
        </div>
      </div>


      {/* Variants */}
      {product.variants && product.variants.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-on-surface">Product Variants</h3>
          <div className="space-y-2">
            {product.variants.map((variant, idx) => (
              <div key={idx} className="bg-surface-variant/20 rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-on-surface">{Object.values(variant.specs).join(" / ")}</span>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(variant.price)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <i className="fas fa-box" />
                  <span>{variant.stock} in stock</span>
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
    const specs: { label: string; value: string }[] = [];
    
    if (product.brand) specs.push({ label: "Brand", value: product.brand });
    if (product.categoryName) specs.push({ label: "Category", value: product.categoryName });
    if (product.subcategory) specs.push({ label: "Subcategory", value: product.subcategory });
    
    return (
      <div className="space-y-6 animate-fadeIn">
        {specs.length > 0 ? (
          <div className="space-y-3">
            {specs.map((spec, idx) => (
              <div key={idx} className="bg-surface-variant/20 rounded-xl p-4">
                <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">{spec.label}</div>
                <div className="text-sm font-medium text-on-surface">{spec.value}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <i className="fas fa-info-circle text-4xl mb-3 opacity-50" />
            <p className="text-sm">No specifications available for this product</p>
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