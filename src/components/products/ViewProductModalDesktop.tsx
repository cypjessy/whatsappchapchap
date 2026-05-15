"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

// ─── Constants ──────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "fa-eye" },
  { id: "details", label: "Details", icon: "fa-list" },
  { id: "inventory", label: "Inventory", icon: "fa-boxes" },
  { id: "specs", label: "Specs", icon: "fa-cogs" },
];

const STOCK_CONFIG = {
  out: { text: "Out of Stock", color: "#ef4444", bg: "#ef4444", bgLight: "#fee2e2" },
  low: { text: "Low Stock", color: "#f59e0b", bg: "#f59e0b", bgLight: "#fef3c7" },
  medium: { text: "In Stock", color: "#3b82f6", bg: "#3b82f6", bgLight: "#dbeafe" },
  good: { text: "In Stock", color: "#10b981", bg: "#10b981", bgLight: "#d1fae5" },
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
      className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-md flex items-center justify-center p-8 animate-fadeIn" 
      onClick={onClose}
    >
      <button 
        onClick={onClose} 
        className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <i className="fas fa-times text-2xl" />
      </button>
      {imageError ? (
        <div className="text-white text-center">
          <i className="fas fa-image text-8xl opacity-50"></i>
          <p className="mt-4 text-lg">Image not available</p>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-scaleIn"
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
    <div className="fixed top-6 right-6 z-[3000] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 min-w-[320px] animate-slideInRight
            ${toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}
          `}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} text-xl`} />
          <span className="text-base font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ViewProductModalDesktop({ isOpen, onClose, product, onEdit }: ViewProductModalDesktopProps) {
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
    () => getStockConfig(product?.stock || 0, product?.lowStockAlert),
    [product?.stock, product?.lowStockAlert]
  );
  
  const hasDiscount = useMemo(
    () => !!(product?.salePrice && product.salePrice > 0 && product.salePrice < product?.price),
    [product?.salePrice, product?.price]
  );
  
  const discountPercent = useMemo(
    () => hasDiscount ? Math.round((((product?.price || 0) - (product?.salePrice || 0)) / (product?.price || 1)) * 100) : 0,
    [hasDiscount, product?.price, product?.salePrice]
  );
  
  const allImages = useMemo(
    () => [product?.image, ...(product?.images || [])].filter(Boolean) as string[],
    [product?.image, product?.images]
  );
  
  const currentImage = useMemo(
    () => allImages[selectedImage] || null, 
    [allImages, selectedImage]
  );
  
  const profit = useMemo(
    () => (product?.costPrice ? (product?.price || 0) - product.costPrice : 0),
    [product?.costPrice, product?.price]
  );
  
  const profitMargin = useMemo(
    () => product?.costPrice && product.costPrice > 0 ? Math.round((profit / (product?.price || 1)) * 100) : 0,
    [product?.costPrice, profit, product?.price]
  );

  // Keyboard shortcuts for desktop
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on Escape
      if (e.key === "Escape") {
        if (lightboxOpen) {
          setLightboxOpen(false);
        } else {
          handleClose();
        }
      }
      
      // Navigate images with arrow keys
      if (lightboxOpen || activeTab === "overview") {
        if (e.key === "ArrowLeft" && selectedImage > 0) {
          setSelectedImage((prev) => prev - 1);
          setMainImageError(false);
        }
        if (e.key === "ArrowRight" && selectedImage < allImages.length - 1) {
          setSelectedImage((prev) => prev + 1);
          setMainImageError(false);
        }
      }
      
      // Switch tabs with number keys
      if (!lightboxOpen) {
        const tabNum = parseInt(e.key);
        if (tabNum >= 1 && tabNum <= TABS.length) {
          setActiveTab(TABS[tabNum - 1].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, lightboxOpen, selectedImage, allImages.length, activeTab, handleClose]);

  // ✅ Early return AFTER all hooks
  if (!isOpen || !product) return null;

  // Render functions for each tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Price & Stock */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl font-bold text-gray-900">{formatCurrency(product.price)}</span>
              {hasDiscount && (
                <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-full">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>
            {hasDiscount && product.salePrice && (
              <p className="text-gray-500 line-through">{formatCurrency(product.salePrice)}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stockConfig.color }}></span>
            <span className="font-semibold" style={{ color: stockConfig.color }}>{stockConfig.text}</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Stock Level</p>
          <p className="text-2xl font-bold text-gray-900">{product.stock || 0}</p>
          <p className="text-xs text-gray-500 mt-1">units available</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Views</p>
          <p className="text-2xl font-bold text-gray-900">{product.views || 0}</p>
          <p className="text-xs text-gray-500 mt-1">total views</p>
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
        </div>
      )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Product Details</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Category</p>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <span>{getCategoryEmoji(product.category || "other")}</span>
              {product.category || "Uncategorized"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">SKU</p>
            <p className="font-medium text-gray-900">{product.sku || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              product.status === "active" ? "bg-green-100 text-green-700" : 
              product.status === "paused" ? "bg-amber-100 text-amber-700" : 
              "bg-gray-100 text-gray-700"
            }`}>
              {product.status || "active"}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Created</p>
            <p className="font-medium text-gray-900">
              {product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Details */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Pricing</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Selling Price</span>
            <span className="font-semibold text-gray-900">{formatCurrency(product.price)}</span>
          </div>
          {product.costPrice && (
            <>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Cost Price</span>
                <span className="font-semibold text-gray-900">{formatCurrency(product.costPrice)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Profit per unit</span>
                <span className="font-semibold text-green-600">{formatCurrency(profit)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Profit Margin</span>
                <span className="font-semibold text-green-600">{profitMargin}%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-6">
      {/* Stock Overview */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ backgroundColor: stockConfig.bgLight }}>
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Stock</p>
              <p className="text-3xl font-bold" style={{ color: stockConfig.color }}>{product.stock || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="font-semibold" style={{ color: stockConfig.color }}>{stockConfig.text}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-blue-50">
              <p className="text-sm text-gray-600 mb-1">Low Stock Alert</p>
              <p className="text-2xl font-bold text-blue-600">{product.lowStockAlert || 5}</p>
              <p className="text-xs text-gray-500 mt-1">units threshold</p>
            </div>
            <div className="p-4 rounded-xl bg-purple-50">
              <p className="text-sm text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency((product.price || 0) * (product.stock || 0))}</p>
              <p className="text-xs text-gray-500 mt-1">at current stock</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock History */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Stock Management</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Units Sold</span>
            <span className="font-semibold text-gray-900">{product.orders || 0}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Total Revenue</span>
            <span className="font-semibold text-gray-900">{formatCurrency((product.price || 0) * (product.orders || 0))}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpecs = () => {
    const specs = product.specifications || {};
    const specEntries = Object.entries(specs);
    
    return (
      <div className="space-y-6">
        {specEntries.length > 0 ? (
          <div className="bg-white rounded-2xl p-6 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h4>
            <div className="grid grid-cols-2 gap-4">
              {specEntries.map(([key, value], idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-1 capitalize">{key}</p>
                  <p className="font-medium text-gray-900">{String(value)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-gray-200 text-center">
            <i className="fas fa-cogs text-5xl text-gray-300 mb-4"></i>
            <p className="text-gray-500">No specifications added</p>
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={handleClose}
      />

      {/* Desktop Modal - Two Column Layout */}
      <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 pointer-events-none">
        <div className="w-full max-w-6xl max-h-[85vh] bg-white rounded-3xl shadow-2xl flex pointer-events-auto animate-scaleIn border border-gray-200">
          
          {/* Left Column - Image Gallery */}
          <div className="w-2/5 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-6 space-y-4 sticky top-0">
              {/* Main Image */}
              <div className="relative group">
                <div className="aspect-square rounded-2xl overflow-hidden bg-white shadow-lg cursor-pointer" onClick={() => setLightboxOpen(true)}>
                  {!mainImageError && currentImage ? (
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={() => setMainImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-8xl opacity-30 select-none">{getCategoryEmoji(product.category || "other")}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                    <i className="fas fa-expand text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Image Counter */}
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
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(idx);
                        setMainImageError(false);
                      }}
                      className={`
                        aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105
                        ${selectedImage === idx ? "border-green-500 shadow-lg scale-105" : "border-gray-200 opacity-60 hover:opacity-100"}
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
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <i className="fas fa-image text-gray-400" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button
                  onClick={() => copyToClipboard(window.location.href, "Link copied to clipboard!")}
                  className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-link" />
                  Copy Product Link
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-edit" />
                  Edit Product
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Tabs & Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-gray-900 truncate">{product.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-box"></i>
                    {product.category || "Uncategorized"}
                  </span>
                  {hasDiscount && (
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Keyboard shortcut hints */}
                <div className="hidden xl:flex items-center gap-2 mr-2 text-xs text-gray-500">
                  <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono">Esc</kbd>
                  <span>Close</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 font-mono ml-2">1-5</kbd>
                  <span>Tabs</span>
                </div>
                
                <button
                  onClick={handleClose}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  title="Close (Esc)"
                >
                  <i className="fas fa-times text-gray-600" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white">
              <div className="flex px-6">
                {TABS.map((tab, idx) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 transition-colors
                      ${activeTab === tab.id
                        ? "border-green-500 text-green-600"
                        : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                      }
                    `}
                    title={`Press ${idx + 1}`}
                  >
                    <i className={`fas ${tab.icon}`} />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {tabContent[activeTab]()}
            </div>
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
