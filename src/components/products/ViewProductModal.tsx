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

type TabId = "overview" | "details" | "inventory" | "specs" | "ai";

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "fa-eye" },
  { id: "details", label: "Details", icon: "fa-list" },
  { id: "inventory", label: "Inventory", icon: "fa-boxes" },
  { id: "specs", label: "Specs", icon: "fa-cogs" },
  { id: "ai", label: "AI Insights", icon: "fa-robot" },
];

const STOCK_CONFIG = {
  out: { text: "Out of Stock", color: "#ef4444", bg: "bg-error/10", dot: "bg-error" },
  low: { text: "Low Stock", color: "#f59e0b", bg: "bg-warning/10", dot: "bg-warning" },
  medium: { text: "In Stock", color: "#3b82f6", bg: "bg-info/10", dot: "bg-info" },
  good: { text: "In Stock", color: "#10b981", bg: "bg-success/10", dot: "bg-success" },
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

  // Early return if not open
  if (!isOpen || !product) return null;

  // Memoize derived values
  const stockConfig = useMemo(() => getStockConfig(product.stock || 0, product.lowStockAlert), [product.stock, product.lowStockAlert]);
  const hasDiscount = useMemo(() => product.salePrice && product.salePrice > 0 && product.salePrice < product.price, [product.salePrice, product.price]);
  const discountPercent = useMemo(() => hasDiscount ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0, [hasDiscount, product.price, product.salePrice]);
  const allImages = useMemo(() => [product.image, ...(product.images || [])].filter(Boolean) as string[], [product.image, product.images]);
  const currentImage = useMemo(() => allImages[selectedImage] || null, [allImages, selectedImage]);
  const profit = useMemo(() => product.costPrice ? product.price - product.costPrice : 0, [product.costPrice, product.price]);
  const profitMargin = useMemo(() => product.costPrice && product.costPrice > 0 ? Math.round((profit / product.price) * 100) : 0, [product.costPrice, profit, product.price]);

  // ─── Tab Content Renderers ────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* Product Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-variant/30 rounded-full">
          <span className="text-2xl">{getCategoryEmoji(product.category || "other")}</span>
          <span className="text-sm font-medium text-on-surface-variant">{product.categoryName || product.category || "Uncategorized"}</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-on-surface">{product.name}</h2>
        {product.description && (
          <p className="text-sm text-on-surface-variant max-w-md mx-auto line-clamp-3">{product.description}</p>
        )}
      </div>

      {/* Price Section */}
      <div className="bg-surface-variant/20 rounded-2xl p-6 text-center space-y-2">
        {hasDiscount ? (
          <>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl md:text-4xl font-bold text-success">{formatCurrency(product.salePrice || 0)}</span>
              <span className="text-lg text-on-surface-variant/60 line-through">{formatCurrency(product.price)}</span>
            </div>
            <div className="inline-flex items-center px-3 py-1 bg-success/10 rounded-full">
              <span className="text-xs font-bold text-success">-{discountPercent}% OFF</span>
            </div>
          </>
        ) : (
          <span className="text-3xl md:text-4xl font-bold text-primary">{formatCurrency(product.price)}</span>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-variant/20 rounded-xl p-4 text-center space-y-1">
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Stock Level</div>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${stockConfig.dot}`} />
            <span className="text-lg font-bold text-on-surface">{product.stock || 0}</span>
          </div>
          <div className="text-xs" style={{ color: stockConfig.color }}>{stockConfig.text}</div>
        </div>
        
        <div className="bg-surface-variant/20 rounded-xl p-4 text-center space-y-1">
          <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
            product.status === "active" ? "bg-success/10 text-success" : "bg-error/10 text-error"
          }`}>
            {product.status === "active" ? "✓ Active" : "✗ Inactive"}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 md3-button-filled px-4 py-3 text-sm font-semibold"
        >
          <i className="fas fa-edit mr-2" />
          Edit Product
        </button>
        {product.orderLink && (
          <button
            onClick={() => copyToClipboard(product.orderLink!, "Order link copied!")}
            className="flex-1 md3-button-outlined px-4 py-3 text-sm font-semibold"
          >
            <i className="fas fa-copy mr-2" />
            Copy Link
          </button>
        )}
      </div>
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
          
          {product.sku && (
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
              <span className="text-sm text-on-surface-variant">SKU</span>
              <span className="text-sm font-medium text-on-surface">{product.sku}</span>
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
            <span className="text-sm text-on-surface-variant">Regular Price</span>
            <span className="text-sm font-semibold text-on-surface">{formatCurrency(product.price)}</span>
          </div>
          
          {product.salePrice && (
            <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
              <span className="text-sm text-on-surface-variant">Sale Price</span>
              <span className="text-sm font-semibold text-success">{formatCurrency(product.salePrice)}</span>
            </div>
          )}
          
          {product.costPrice && (
            <>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
                <span className="text-sm text-on-surface-variant">Cost Price</span>
                <span className="text-sm font-medium text-on-surface">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-outline-variant/50">
                <span className="text-sm text-on-surface-variant">Profit Margin</span>
                <span className="text-sm font-bold text-success">{profitMargin}%</span>
              </div>
            </>
          )}
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

        {product.lowStockAlert && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <i className="fas fa-bell text-warning" />
            <span>Alert when stock drops below {product.lowStockAlert} units</span>
          </div>
        )}
      </div>

      {/* Stock Value */}
      {product.costPrice && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-variant/20 rounded-xl p-4 text-center space-y-2">
            <div className="text-xs font-semibold text-on-surface-variant uppercase">Unit Cost</div>
            <div className="text-xl font-bold text-on-surface">{formatCurrency(product.costPrice)}</div>
          </div>
          <div className="bg-surface-variant/20 rounded-xl p-4 text-center space-y-2">
            <div className="text-xs font-semibold text-on-surface-variant uppercase">Total Value</div>
            <div className="text-xl font-bold text-on-surface">{formatCurrency((product.costPrice || 0) * (product.stock || 0))}</div>
          </div>
        </div>
      )}

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
                  {variant.sku && <span className="ml-auto">SKU: {variant.sku}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSpecs = () => {
    // Build specs from specifications field or available product fields
    const specs: { label: string; value: string }[] = [];
    
    // Use specifications field if available
    if (product.specifications && Object.keys(product.specifications).length > 0) {
      Object.entries(product.specifications).forEach(([key, value]) => {
        specs.push({ label: key, value: String(value) });
      });
    } else {
      // Fallback to building specs from product fields
      if (product.brand) specs.push({ label: "Brand", value: product.brand });
      if (product.sku) specs.push({ label: "SKU", value: product.sku });
      if (product.barcode) specs.push({ label: "Barcode", value: product.barcode });
      if (product.weight) specs.push({ label: "Weight", value: `${product.weight} ${product.weightUnit || "kg"}` });
      if (product.warranty) specs.push({ label: "Warranty", value: product.warranty });
      if (product.dimensions) {
        const dims = [];
        if (product.dimensions.length) dims.push(`L: ${product.dimensions.length}`);
        if (product.dimensions.width) dims.push(`W: ${product.dimensions.width}`);
        if (product.dimensions.height) dims.push(`H: ${product.dimensions.height}`);
        if (dims.length > 0) specs.push({ label: "Dimensions", value: dims.join(" × ") });
      }
      if (product.taxEnabled) specs.push({ label: "Tax Rate", value: `${product.taxRate || 0}%` });
    }
    
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

  const renderAIInsights = () => (
    <div className="space-y-6 animate-fadeIn">
      {/* AI Pricing Suggestion */}
      <div className="bg-primary-container/20 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <i className="fas fa-robot text-primary text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-primary-container">AI Pricing Insight</h3>
            <p className="text-xs text-on-primary-container/70">Based on market analysis</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <p className="text-on-primary-container">
            💡 <strong>Recommendation:</strong> Your pricing is competitive. Consider offering bundle deals to increase average order value.
          </p>
          {hasDiscount && (
            <p className="text-on-primary-container">
              🎯 <strong>Sale Active:</strong> {discountPercent}% discount may boost conversion by 15-20%
            </p>
          )}
        </div>
      </div>

      {/* Stock Insights */}
      <div className="bg-surface-variant/20 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
            <i className="fas fa-chart-line text-info text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-on-surface">Inventory Insights</h3>
            <p className="text-xs text-on-surface-variant/70">Stock optimization tips</p>
          </div>
        </div>
        
        <div className="space-y-2 text-sm text-on-surface">
          {product.stock === 0 && (
            <p>⚠️ <strong>Critical:</strong> Product is out of stock. Restock immediately to avoid lost sales.</p>
          )}
          {product.stock && product.stock > 0 && product.stock <= 5 && (
            <p>⚡ <strong>Low Stock:</strong> Only {product.stock} units remaining. Consider reordering soon.</p>
          )}
          {product.stock && product.stock > 20 && (
            <p>✅ <strong>Good Level:</strong> Stock level is healthy. No immediate action needed.</p>
          )}
          {profitMargin > 30 && (
            <p>💰 <strong>High Margin:</strong> {profitMargin}% profit margin is excellent. Consider increasing marketing spend.</p>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-variant/20 rounded-xl p-4 text-center space-y-2">
          <div className="text-2xl font-bold text-primary">{product.stock || 0}</div>
          <div className="text-xs text-on-surface-variant">Units in Stock</div>
        </div>
        <div className="bg-surface-variant/20 rounded-xl p-4 text-center space-y-2">
          <div className="text-2xl font-bold text-success">{profitMargin}%</div>
          <div className="text-xs text-on-surface-variant">Profit Margin</div>
        </div>
      </div>
    </div>
  );

  const tabContent: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    details: renderDetails,
    inventory: renderInventory,
    specs: renderSpecs,
    ai: renderAIInsights,
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[2100] flex items-end md:items-center justify-center pointer-events-none">
        <div className="w-full max-w-2xl max-h-[90vh] md:max-h-[85vh] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col pointer-events-auto animate-slideUp">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-outline-variant/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0">
                {!mainImageError && currentImage ? (
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={() => setMainImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl md:text-4xl">{getCategoryEmoji(product.category || "other")}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg md:text-xl font-bold text-on-surface truncate">{product.name}</h3>
                <p className="text-sm text-on-surface-variant">{formatCurrency(product.price)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(product)}
                className="w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center transition-colors"
                title="Edit Product"
              >
                <i className="fas fa-edit text-on-surface-variant" />
              </button>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full hover:bg-surface-variant/30 flex items-center justify-center transition-colors"
                title="Close"
              >
                <i className="fas fa-times text-on-surface-variant" />
              </button>
            </div>
          </div>

          {/* Image Gallery */}
          {allImages.length > 0 && (
            <div className="px-4 md:px-6 pt-4">
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
                      <span className="text-6xl md:text-8xl opacity-30 select-none">{getCategoryEmoji(product.category || "other")}</span>
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
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(idx);
                        setMainImageError(false);
                      }}
                      className={`
                        flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all
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

          {/* Tabs */}
          <div className="border-b border-outline-variant/30">
            <div className="flex overflow-x-auto scrollbar-hide px-4 md:px-6">
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
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
