"use client";

import { useState, useCallback, useEffect, useMemo, memo, useRef } from "react";
import { Product } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import {
  CheckSquare,
  Square,
  MinusSquare,
  Pause,
  Play,
  Copy,
  Share2,
  Printer,
  MessageCircle,
  Trash2,
  MoreHorizontal,
  ArrowUpRight,
  Eye,
  ShoppingCart,
  Star,
  Package,
  Loader2,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductListViewProps {
  products: Product[];
  bulkMode: boolean;
  bulkSelected: string[];
  toggleBulkSelect: (id: string) => void;
  selectAllProducts: () => void;
  openProductModal: (product: Product) => void;
  handleToggleStatus: (product: Product) => void;
  handleDuplicateProduct: (product: Product) => void;
  handleShareProduct: (product: Product) => void;
  shareProductWhatsApp: (product: Product) => void;
  printProductCatalog: (product: Product) => void;
  getCategoryEmoji: (category: string) => string;
  getCategoryColor: (category: string) => string;
  getStockStyle: (stock: number) => { color: string; width: string };
  /** Optional: Show delete confirmation dialog */
  showDeleteConfirm?: boolean;
  /** Optional: Callback for delete action */
  onDeleteProduct?: (product: Product) => Promise<void>;
  /** Optional: Maximum products to show initially */
  initialDisplayCount?: number;
}

interface ActionConfig {
  key: string;
  getIcon?: (status: string) => React.ElementType;
  icon?: React.ElementType;
  getColor?: (status: string) => ActionColor;
  color?: ActionColor;
  getLabel?: (status: string) => string;
  label?: string;
  handler: string;
  ariaLabel?: string | ((status: string) => string);
  requiresConfirmation?: boolean;
}

type ActionColor = "green" | "blue" | "amber" | "cyan" | "red";

// ─── Constants ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<ActionColor, string> = {
  green: "text-[#128C7E] bg-[#f0fdf4] hover:bg-[#25D366] hover:text-white border-[#25D366]/20 focus:ring-[#25D366]",
  blue: "text-[#3b82f6] bg-[#eff6ff] hover:bg-[#3b82f6] hover:text-white border-[#3b82f6]/20 focus:ring-[#3b82f6]",
  amber: "text-[#f59e0b] bg-[#fffbeb] hover:bg-[#f59e0b] hover:text-white border-[#f59e0b]/20 focus:ring-[#f59e0b]",
  cyan: "text-[#06b6d4] bg-[#ecfeff] hover:bg-[#06b6d4] hover:text-white border-[#06b6d4]/20 focus:ring-[#06b6d4]",
  red: "text-[#ef4444] bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white border-[#ef4444]/20 focus:ring-[#ef4444]",
};

const MOBILE_COLOR_MAP: Record<ActionColor, string> = {
  green: "text-[#128C7E] bg-[#f0fdf4]",
  blue: "text-[#3b82f6] bg-[#eff6ff]",
  amber: "text-[#f59e0b] bg-[#fffbeb]",
  cyan: "text-[#06b6d4] bg-[#ecfeff]",
  red: "text-[#ef4444] bg-[#fef2f2]",
};

const DESKTOP_ACTIONS: readonly ActionConfig[] = [
  {
    key: "toggle",
    getIcon: (status: string) => (status === "active" ? Pause : Play),
    getColor: (status: string): ActionColor => (status === "active" ? "amber" : "green"),
    getLabel: (status: string) => (status === "active" ? "Pause" : "Activate"),
    handler: "handleToggleStatus",
    ariaLabel: (status: string) => status === "active" ? "Pause product" : "Activate product",
  },
  { 
    key: "duplicate", 
    icon: Copy, 
    color: "blue" as const, 
    label: "Duplicate", 
    handler: "handleDuplicateProduct",
    ariaLabel: "Duplicate product",
  },
  { 
    key: "share", 
    icon: Share2, 
    color: "green" as const, 
    label: "Share", 
    handler: "handleShareProduct",
    ariaLabel: "Share product",
  },
  { 
    key: "whatsapp", 
    icon: MessageCircle, 
    color: "green" as const, 
    label: "WhatsApp", 
    handler: "shareProductWhatsApp",
    ariaLabel: "Share via WhatsApp",
  },
  { 
    key: "print", 
    icon: Printer, 
    color: "cyan" as const, 
    label: "Print", 
    handler: "printProductCatalog",
    ariaLabel: "Print product catalog",
  },
  { 
    key: "delete", 
    icon: Trash2, 
    color: "red" as const, 
    label: "Delete", 
    handler: "handleDelete",
    ariaLabel: "Delete product",
    requiresConfirmation: true,
  },
] as const;

const MOBILE_ACTIONS: readonly ActionConfig[] = [
  {
    key: "toggle",
    getIcon: (status: string) => (status === "active" ? Pause : Play),
    getColor: (status: string): ActionColor => (status === "active" ? "amber" : "green"),
    getLabel: (status: string) => (status === "active" ? "Pause" : "Activate"),
    handler: "handleToggleStatus",
    ariaLabel: (status: string) => status === "active" ? "Pause product" : "Activate product",
  },
  { 
    key: "duplicate", 
    icon: Copy, 
    color: "blue" as const, 
    label: "Duplicate", 
    handler: "handleDuplicateProduct",
    ariaLabel: "Duplicate product",
  },
  { 
    key: "share", 
    icon: Share2, 
    color: "green" as const, 
    label: "Share", 
    handler: "handleShareProduct",
    ariaLabel: "Share product",
  },
  { 
    key: "whatsapp", 
    icon: MessageCircle, 
    color: "green" as const, 
    label: "WhatsApp", 
    handler: "shareProductWhatsApp",
    ariaLabel: "Share via WhatsApp",
  },
  { 
    key: "print", 
    icon: Printer, 
    color: "cyan" as const, 
    label: "Print", 
    handler: "printProductCatalog",
    ariaLabel: "Print product catalog",
  },
  { 
    key: "delete", 
    icon: Trash2, 
    color: "red" as const, 
    label: "Delete", 
    handler: "handleDelete",
    ariaLabel: "Delete product",
    requiresConfirmation: true,
  },
] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

const ShimmerRow = memo(() => {
  return (
    <div 
      className="relative overflow-hidden px-3 md:px-4 py-3 md:py-4 border-b border-[#f1f5f9]"
      aria-label="Loading product row"
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="hidden md:grid grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-4 items-center">
        <div className="w-8 h-8 rounded-lg bg-[#f1f5f9]" />
        <div className="w-14 h-14 rounded-xl bg-[#f1f5f9]" />
        <div className="space-y-2">
          <div className="h-4 bg-[#f1f5f9] rounded-lg w-3/4" />
          <div className="h-3 bg-[#f1f5f9] rounded-lg w-1/2" />
        </div>
        <div className="h-6 bg-[#f1f5f9] rounded-lg w-20" />
        <div className="h-5 bg-[#f1f5f9] rounded-lg w-16" />
        <div className="h-4 bg-[#f1f5f9] rounded-lg w-24" />
        <div className="flex justify-end gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-9 h-9 bg-[#f1f5f9] rounded-lg" />
          ))}
        </div>
      </div>
      <div className="md:hidden flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-[#f1f5f9] shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#f1f5f9] rounded-lg w-3/4" />
          <div className="h-3 bg-[#f1f5f9] rounded-lg w-1/2" />
        </div>
        <div className="w-8 h-8 bg-[#f1f5f9] rounded-lg" />
      </div>
    </div>
  );
});

ShimmerRow.displayName = "ShimmerRow";

const METRIC_COLORS: Record<string, string> = {
  "text-[#64748b]": "text-[#64748b]",
  "text-[#f59e0b]": "text-[#f59e0b]",
};

const MetricBadge = memo(({
  icon: Icon,
  value,
  label,
  color = "text-[#64748b]",
  fill = false,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color?: string;
  fill?: boolean;
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value as string);
  const displayValue = !isNaN(numericValue) 
    ? (numericValue > 999 ? `${(numericValue / 1000).toFixed(1)}k` : numericValue.toLocaleString())
    : value;

  const colorClass = METRIC_COLORS[color] || "text-[#64748b]";

  return (
    <div 
      className={`flex items-center gap-1 text-[10px] ${colorClass}`} 
      title={label}
      aria-label={`${label}: ${displayValue}`}
    >
      <Icon className={`w-3 h-3 ${fill ? "fill-current" : ""}`} aria-hidden="true" />
      <span className="font-medium">{displayValue}</span>
    </div>
  );
});

MetricBadge.displayName = "MetricBadge";

const ActionIconButton = memo(({
  onClick,
  icon: Icon,
  color,
  label,
  disabled = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  color: ActionColor;
  label: string;
  disabled?: boolean;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`
        w-9 h-9 flex items-center justify-center rounded-lg border 
        transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${COLOR_MAP[color]}
      `}
      title={label}
      aria-label={label}
      aria-disabled={disabled}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
});

ActionIconButton.displayName = "ActionIconButton";

const MobileActionButton = memo(({
  onClick,
  icon: Icon,
  label,
  color,
  delay = 0,
  disabled = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: ActionColor;
  delay?: number;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold
        transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${MOBILE_COLOR_MAP[color]}
      `}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={label}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span className="text-[10px]">{label}</span>
    </button>
  );
});

MobileActionButton.displayName = "MobileActionButton";

const DeleteConfirmDialog = memo(({
  product,
  onConfirm,
  onCancel,
}: {
  product: Product | null;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!product) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Delete confirmation"
    >
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-[#1e293b] mb-2">Delete Product?</h3>
          <p className="text-sm text-[#64748b]">
            Are you sure you want to delete "{product.name}"? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-md hover:shadow-lg active:scale-95 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmDialog.displayName = "DeleteConfirmDialog";

function ListHeader({
  bulkMode,
  bulkSelected,
  totalProducts,
  onSelectAll,
}: {
  bulkMode: boolean;
  bulkSelected: string[];
  totalProducts: number;
  onSelectAll: () => void;
}) {
  const isAllSelected = bulkSelected.length === totalProducts && totalProducts > 0;
  const isPartialSelected = bulkSelected.length > 0 && !isAllSelected;
  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectAll();
    }
  };

  const selectAllLabel = isAllSelected 
    ? `Deselect all ${totalProducts} products` 
    : `Select all ${totalProducts} products`;

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-b from-[#f8fafc] to-[#f8fafc]/95 backdrop-blur-sm border-b-2 border-[#e2e8f0]">
      <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center">
        {bulkMode && (
          <button
            onClick={onSelectAll}
            onKeyDown={handleKeyDown}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#e2e8f0] transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366]"
            aria-label={selectAllLabel}
          >
            <CheckboxIcon
              className={`w-5 h-5 transition-all duration-200 ${
                bulkSelected.length > 0 ? "text-[#25D366]" : "text-[#cbd5e1]"
              }`}
              strokeWidth={bulkSelected.length > 0 ? 2.5 : 2}
              aria-hidden="true"
            />
          </button>
        )}

        <div className="hidden md:block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider text-center">
          Image
        </div>
        <div className="hidden md:block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
          Product
        </div>
        <div className="hidden md:block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
          Category
        </div>
        <div className="hidden md:block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
          Price
        </div>
        <div className="hidden md:block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">
          Stock
        </div>
        <div className="hidden md:block text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider text-right">
          Actions
        </div>

        <div className="md:hidden flex items-center justify-between flex-1">
          <span className="text-xs font-semibold text-[#64748b]" aria-label={`${totalProducts} total products`}>
            {totalProducts} {totalProducts === 1 ? "product" : "products"}
          </span>
          {bulkMode && bulkSelected.length > 0 && (
            <span className="text-xs font-bold text-[#25D366]" aria-label={`${bulkSelected.length} products selected`}>
              {bulkSelected.length} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Optimized ProductRow with memo
const ProductRow = memo(({
  product,
  index,
  bulkMode,
  isSelected,
  onToggleSelect,
  onOpenModal,
  onAction,
  getCategoryEmoji,
  getCategoryColor,
  getStockStyle,
  showDeleteConfirm,
  onDeleteProduct,
}: {
  product: Product;
  index: number;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenModal: (product: Product) => void;
  onAction: (handler: string, product: Product, event?: React.MouseEvent) => void | Promise<void>;
  getCategoryEmoji: (category: string) => string;
  getCategoryColor: (category: string) => string;
  getStockStyle: (stock: number) => { color: string; width: string };
  showDeleteConfirm?: boolean;
  onDeleteProduct?: (product: Product) => Promise<void>;
}) => {
  const [isVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const stock = Math.max(0, product.stock || 0);
  const stockStyle = getStockStyle(stock);
  const hasImage = (product.image || product.imageUrl) && !imageError;
  const isOnSale = product.salePrice && product.salePrice > 0 && (product.price || 0) > product.salePrice;

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleRowClick = useCallback(() => {
    if (!bulkMode) {
      onOpenModal(product);
    }
  }, [bulkMode, product, onOpenModal]);

  const handleToggleSelectWrapper = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(product.id);
  }, [product.id, onToggleSelect]);

  const handleActionWrapper = useCallback(async (handler: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (actionInProgress) return;
    
    // Handle delete with confirmation
    if (handler === "handleDelete") {
      if (showDeleteConfirm && onDeleteProduct) {
        setShowDeleteDialog(true);
      } else {
        onAction(handler, product, e);
      }
      return;
    }
    
    setActionInProgress(handler);
    try {
      await onAction(handler, product, e);
    } catch (error) {
      console.error(`Error executing action ${handler}:`, error);
    } finally {
      setTimeout(() => setActionInProgress(null), 300);
    }
  }, [product, onAction, actionInProgress, showDeleteConfirm, onDeleteProduct]);

  const handleDeleteConfirm = useCallback(async () => {
    if (onDeleteProduct) {
      await onDeleteProduct(product);
    }
    setShowDeleteDialog(false);
  }, [product, onDeleteProduct]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteDialog(false);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !bulkMode) {
      e.preventDefault();
      handleRowClick();
    }
  };

  const productIdShort = product.id.slice(0, 8);
  const views = product.views || 0;
  const orders = product.orders || 0;
  const rating = product.rating;
  const status = product.status || "active";
  const category = product.category || "Uncategorized";

  return (
    <>
      <div
        className={`
          group relative transition-all duration-200
          ${isSelected ? "bg-[#f0fdf4]" : "hover:bg-white"}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="row"
      >
        {/* Left accent bar on hover */}
        <div
          className={`
            absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-300
            ${isHovered && !isSelected ? "opacity-100" : "opacity-0"}
          `}
          style={{ backgroundColor: stockStyle.color }}
          aria-hidden="true"
        />

        {/* Main row */}
        <div
          className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center"
          onClick={handleRowClick}
          onKeyDown={handleKeyDown}
          role={!bulkMode ? "button" : "gridcell"}
          tabIndex={!bulkMode ? 0 : -1}
          aria-label={`${product.name}, ${formatCurrency(product.price)}`}
        >
          {/* Checkbox */}
          {bulkMode && (
            <div
              className="flex items-center justify-center"
              onClick={handleToggleSelectWrapper}
              role="checkbox"
              aria-checked={isSelected}
              aria-label={`Select ${product.name}`}
            >
              <div
                className={`
                  w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                  ${isSelected
                    ? "bg-[#25D366] border-[#25D366] text-white shadow-sm"
                    : "border-[#e2e8f0] hover:border-[#25D366] bg-white"
                  }
                `}
              >
                {isSelected && <CheckSquare className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />}
              </div>
            </div>
          )}

          {/* Image */}
          <div
            className={`
              relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0
              ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(category)}` : "bg-white"}
            `}
            aria-label="Product image"
          >
            {hasImage ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-white flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-[#25D366] animate-spin" aria-label="Loading image" />
                  </div>
                )}
                <img
                  src={product.image || product.imageUrl}
                  alt={product.name}
                  className={`
                    w-full h-full object-cover transition-opacity duration-300
                    ${imageLoaded ? "opacity-100" : "opacity-0"}
                  `}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                  decoding="async"
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg md:text-2xl" aria-hidden="true">
                {getCategoryEmoji(category)}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={`
                  font-bold text-sm text-[#1e293b] truncate transition-colors duration-200
                  ${isHovered ? "text-[#128C7E]" : "text-[#1e293b]"}
                `}
              >
                {product.name}
              </h3>
              {status !== "active" && (
                <span
                  className={`
                    hidden md:inline-flex shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold
                    ${status === "paused" ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-[#64748b]/10 text-[#64748b]"}
                  `}
                  aria-label={`Product status: ${status}`}
                >
                  {status === "paused" ? "Paused" : "Archived"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-[#94a3b8] font-mono" aria-label={`Product ID: ${productIdShort}`}>
                #{productIdShort}
              </span>
              {/* Mobile metrics */}
              <div className="flex md:hidden items-center gap-2">
                {views > 0 && (
                  <MetricBadge icon={Eye} value={views} label="Views" />
                )}
                {orders > 0 && (
                  <MetricBadge icon={ShoppingCart} value={orders} label="Orders" />
                )}
                {rating && rating > 0 && (
                  <MetricBadge icon={Star} value={rating.toFixed(1)} label="Rating" color="text-[#f59e0b]" fill />
                )}
              </div>
            </div>
            {/* Desktop metrics */}
            <div className="hidden md:flex items-center gap-3 mt-1.5">
              {views > 0 && (
                <MetricBadge icon={Eye} value={views} label="Views" />
              )}
              {orders > 0 && (
                <MetricBadge icon={ShoppingCart} value={orders} label="Orders" />
              )}
              {rating && rating > 0 && (
                <MetricBadge icon={Star} value={rating.toFixed(1)} label="Rating" color="text-[#f59e0b]" fill />
              )}
            </div>
          </div>

          {/* Category (desktop) */}
          <div className="hidden md:block">
            <span 
              className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white text-xs font-medium text-[#64748b] capitalize border border-[#e2e8f0]"
              aria-label={`Category: ${category}`}
            >
              {category}
            </span>
          </div>

          {/* Price */}
          <div className="hidden md:block">
            <div className="font-bold text-sm text-[#1e293b]" aria-label={`Price: ${formatCurrency(product.price)}`}>
              {formatCurrency(product.price)}
            </div>
            {isOnSale && (
              <div className="text-[10px] text-[#94a3b8] line-through font-medium" aria-label="Original price">
                {formatCurrency(product.salePrice!)}
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="hidden md:block">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="w-3 h-3 text-[#94a3b8]" aria-hidden="true" />
              <span className="text-sm font-semibold" style={{ color: stockStyle.color }} aria-label={`Stock quantity: ${stock}`}>
                {stock.toLocaleString()}
              </span>
            </div>
            <div 
              className="w-full max-w-[80px] h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden"
              aria-label={`Stock level: ${Math.min(Math.round((stock / 100) * 100), 100)}%`}
            >
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: isVisible ? stockStyle.width : "0%",
                  backgroundColor: stockStyle.color,
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2 justify-end">
            {!bulkMode && (
              <>
                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-1.5">
                  {DESKTOP_ACTIONS.map((action) => {
                    const Icon = action.key === "toggle"
                      ? action.getIcon!(status)
                      : action.icon!;
                    const color = action.key === "toggle"
                      ? action.getColor!(status)
                      : action.color!;
                    const label = action.key === "toggle"
                      ? action.getLabel!(status)
                      : action.label!;
                    const ariaLabel = typeof action.ariaLabel === 'function'
                      ? action.ariaLabel(status)
                      : action.ariaLabel;

                    return (
                      <ActionIconButton
                        key={action.key}
                        onClick={(e) => handleActionWrapper(action.handler, e)}
                        icon={Icon}
                        color={color}
                        label={ariaLabel || label}
                        disabled={!!actionInProgress}
                      />
                    );
                  })}
                </div>

                {/* Mobile expand */}
                <div className="md:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedMobile(!expandedMobile);
                    }}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200
                      focus:outline-none focus:ring-2 focus:ring-[#25D366]
                      ${expandedMobile
                        ? "bg-[#25D366] text-white shadow-md"
                        : "text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
                      }
                    `}
                    aria-expanded={expandedMobile}
                    aria-label={`${expandedMobile ? "Hide" : "Show"} product actions for ${product.name}`}
                  >
                    {expandedMobile ? (
                      <ChevronRight className="w-4 h-4 rotate-90" aria-hidden="true" />
                    ) : (
                      <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile expanded actions */}
        <div
          className={`
            md:hidden overflow-hidden transition-all duration-300 ease-out
            ${expandedMobile ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}
          `}
          aria-hidden={!expandedMobile}
        >
          <div className="px-3 pb-3">
            <div className="grid grid-cols-3 gap-2 p-2 bg-white rounded-xl border border-[#e2e8f0]">
              {MOBILE_ACTIONS.map((action, idx) => {
                const Icon = action.key === "toggle"
                  ? action.getIcon!(status)
                  : action.icon!;
                const color = action.key === "toggle"
                  ? action.getColor!(status)
                  : action.color!;
                const label = action.key === "toggle"
                  ? action.getLabel!(status)
                  : action.label!;
                const ariaLabel = typeof action.ariaLabel === 'function'
                  ? action.ariaLabel(status)
                  : action.ariaLabel;

                return (
                  <MobileActionButton
                    key={action.key}
                    onClick={(e) => handleActionWrapper(action.handler, e)}
                    icon={Icon}
                    label={ariaLabel || label}
                    color={color}
                    delay={idx * 50}
                    disabled={!!actionInProgress}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <DeleteConfirmDialog
          product={product}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </>
  );
});

ProductRow.displayName = "ProductRow";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductListView({
  products,
  bulkMode,
  bulkSelected,
  toggleBulkSelect,
  selectAllProducts,
  openProductModal,
  handleToggleStatus,
  handleDuplicateProduct,
  handleShareProduct,
  shareProductWhatsApp,
  printProductCatalog,
  getCategoryEmoji,
  getCategoryColor,
  getStockStyle,
  showDeleteConfirm = false,
  onDeleteProduct,
  initialDisplayCount,
}: ProductListViewProps) {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(initialDisplayCount || 50);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Handle action with proper typing
  const handleAction = useCallback(async (handler: string, product: Product, event?: React.MouseEvent) => {
    const handlers: Record<string, ((p: Product) => void | Promise<void>) | undefined> = {
      handleToggleStatus,
      handleDuplicateProduct,
      handleShareProduct,
      shareProductWhatsApp,
      printProductCatalog,
      handleDelete: onDeleteProduct,
    };
    
    const handlerFn = handlers[handler];
    if (handlerFn) {
      await handlerFn(product);
    }
  }, [handleToggleStatus, handleDuplicateProduct, handleShareProduct, shareProductWhatsApp, printProductCatalog, onDeleteProduct]);

  // Infinite scroll setup
  useEffect(() => {
    if (!initialDisplayCount || products.length <= visibleCount) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && displayedProducts.length < products.length) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [products.length, visibleCount, isLoadingMore, displayedProducts.length, initialDisplayCount]);

  // Initialize displayed products
  useEffect(() => {
    if (initialDisplayCount) {
      setDisplayedProducts(products.slice(0, visibleCount));
    } else {
      setDisplayedProducts(products);
    }
  }, [products, visibleCount, initialDisplayCount]);

  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    // Simulate async loading
    setTimeout(() => {
      const newCount = Math.min(visibleCount + 20, products.length);
      setVisibleCount(newCount);
      setDisplayedProducts(products.slice(0, newCount));
      setIsLoadingMore(false);
    }, 100);
  }, [visibleCount, products, isLoadingMore]);

  if (products.length === 0) return null;

  const productsToRender = initialDisplayCount ? displayedProducts : products;
  const hasMore = initialDisplayCount && productsToRender.length < products.length;

  return (
    <div 
      className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm animate-fadeIn"
      role="region"
      aria-label="Product list"
    >
      <ListHeader
        bulkMode={bulkMode}
        bulkSelected={bulkSelected}
        totalProducts={products.length}
        onSelectAll={selectAllProducts}
      />

      <div className="divide-y divide-[#f1f5f9]" role="rowgroup">
        {productsToRender.map((product, index) => (
          <ProductRow
            key={`${product.id}-${index}`}
            product={product}
            index={index}
            bulkMode={bulkMode}
            isSelected={bulkSelected.includes(product.id)}
            onToggleSelect={toggleBulkSelect}
            onOpenModal={openProductModal}
            onAction={handleAction}
            getCategoryEmoji={getCategoryEmoji}
            getCategoryColor={getCategoryColor}
            getStockStyle={getStockStyle}
            showDeleteConfirm={showDeleteConfirm}
            onDeleteProduct={onDeleteProduct}
          />
        ))}
      </div>

      {/* Loading indicator for infinite scroll */}
      {hasMore && (
        <div 
          ref={sentinelRef}
          className="py-6 flex justify-center items-center"
        >
          {isLoadingMore ? (
            <Loader2 className="w-6 h-6 text-[#25D366] animate-spin" aria-label="Loading more products" />
          ) : (
            <button
              onClick={loadMoreProducts}
              className="px-6 py-2 text-sm font-semibold text-[#25D366] hover:text-[#128C7E] transition-colors"
            >
              Load more ({products.length - productsToRender.length} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}