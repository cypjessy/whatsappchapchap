"use client";

import { useState, useCallback, useEffect, useMemo, memo } from "react";
import { Product } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import {
  Eye,
  ShoppingCart,
  Star,
  Pause,
  Play,
  Copy,
  Share2,
  Printer,
  MessageCircle,
  CheckSquare,
  Square,
  MinusSquare,
  MoreHorizontal,
  ChevronDown,
  ArrowUpRight,
  Package,
  Loader2,
  TrendingUp,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductGridViewProps {
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
  getBadgeStyle: (stock: number) => { badge: string; label: string };
  /** Optional: Enable virtual scrolling for large lists */
  virtualScroll?: boolean;
  /** Optional: Items per page for pagination */
  itemsPerPage?: number;
}

interface ActionConfig {
  key: string;
  getIcon?: (status: string) => React.ElementType;
  icon?: React.ElementType;
  getLabel?: (status: string) => string;
  label?: string;
  getColor?: (status: string) => "green" | "blue" | "amber";
  color?: "green" | "blue" | "amber";
  handler: string;
  /** Accessibility label - can be string or function */
  ariaLabel?: string | ((status: string) => string);
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: readonly ActionConfig[] = [
  {
    key: "toggle",
    getIcon: (status: string) => (status === "active" ? Pause : Play),
    getLabel: (status: string) => (status === "active" ? "Pause" : "Activate"),
    getColor: (status: string): "green" | "blue" | "amber" => (status === "active" ? "amber" : "green"),
    handler: "handleToggleStatus",
    ariaLabel: (status: string) => status === "active" ? "Pause product" : "Activate product",
  },
  {
    key: "duplicate",
    icon: Copy,
    label: "Copy",
    color: "blue" as const,
    handler: "handleDuplicateProduct",
    ariaLabel: "Duplicate product",
  },
  {
    key: "share",
    icon: Share2,
    label: "Share",
    color: "green" as const,
    handler: "handleShareProduct",
    ariaLabel: "Share product",
  },
  {
    key: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    color: "green" as const,
    handler: "shareProductWhatsApp",
    ariaLabel: "Share via WhatsApp",
  },
  {
    key: "print",
    icon: Printer,
    label: "Print",
    color: "blue" as const,
    handler: "printProductCatalog",
    ariaLabel: "Print product catalog",
  },
] as const;

// Fallback image URL (replace with your actual fallback image)
const FALLBACK_IMAGE_URL = "/images/placeholder-product.jpg";

// ─── Sub-Components ───────────────────────────────────────────────────────────

const ShimmerCard = memo(() => {
  return (
    <div 
      className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden"
      aria-label="Loading product card"
    >
      <div className="relative h-36 sm:h-40 md:h-48 bg-white overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      </div>
      <div className="p-3 md:p-4 space-y-3">
        <div className="h-3 bg-[#f1f5f9] rounded-lg w-16" />
        <div className="h-5 bg-[#f1f5f9] rounded-lg w-3/4" />
        <div className="h-6 bg-[#f1f5f9] rounded-lg w-1/2" />
        <div className="pt-2 border-t border-[#e2e8f0] space-y-2">
          <div className="h-3 bg-[#f1f5f9] rounded-lg w-full" />
          <div className="h-8 bg-[#f1f5f9] rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
});

ShimmerCard.displayName = "ShimmerCard";

const BulkHeader = memo(({
  bulkSelected,
  totalProducts,
  onSelectAll,
}: {
  bulkSelected: string[];
  totalProducts: number;
  onSelectAll: () => void;
}) => {
  const isAllSelected = bulkSelected.length === totalProducts && totalProducts > 0;
  const isPartialSelected = bulkSelected.length > 0 && !isAllSelected;
  const selectedPercentage = totalProducts > 0 ? Math.round((bulkSelected.length / totalProducts) * 100) : 0;

  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectAll();
    }
  };

  return (
    <div 
      className="mb-4 flex items-center justify-between bg-gradient-to-r from-[#f8fafc] to-white p-3.5 md:p-4 rounded-xl md:rounded-2xl border border-[#e2e8f0] shadow-sm animate-fadeIn"
      role="region"
      aria-label="Bulk selection controls"
    >
      <button
        onClick={onSelectAll}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2.5 group transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] rounded-lg"
        aria-label={bulkSelected.length > 0 ? `Deselect all ${totalProducts} products` : `Select all ${totalProducts} products`}
      >
        <CheckboxIcon
          className={`w-5 h-5 transition-all duration-200 ${
            bulkSelected.length > 0
              ? "text-[#25D366]"
              : "text-[#cbd5e1] group-hover:text-[#94a3b8]"
          }`}
          strokeWidth={bulkSelected.length > 0 ? 2.5 : 2}
          aria-hidden="true"
        />
        <span className="text-sm font-semibold text-[#64748b]">
          {bulkSelected.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <span 
                className="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-[#25D366] text-white text-[10px] font-bold"
                aria-label={`${bulkSelected.length} products selected`}
              >
                {bulkSelected.length}
              </span>
              <span>selected of {totalProducts}</span>
            </span>
          ) : (
            <span>Select all ({totalProducts})</span>
          )}
        </span>
      </button>

      {bulkSelected.length > 0 && (
        <div 
          className="text-xs text-[#94a3b8] font-medium"
          aria-label={`${selectedPercentage} percent selected`}
        >
          {selectedPercentage}%
        </div>
      )}
    </div>
  );
});

BulkHeader.displayName = "BulkHeader";

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
  
  return (
    <div
      className={`flex items-center gap-1 text-[10px] md:text-xs ${color}`}
      title={label}
      aria-label={`${label}: ${typeof value === 'number' ? value.toLocaleString() : value}`}
    >
      <Icon className={`w-3 h-3 ${fill ? "fill-current" : ""}`} aria-hidden="true" />
      <span className="font-medium">
        {typeof value === 'number' ? (numericValue > 999 ? `${(numericValue / 1000).toFixed(1)}k` : value.toLocaleString()) : value}
      </span>
    </div>
  );
});

MetricBadge.displayName = "MetricBadge";

const ActionButton = memo(({
  onClick,
  icon: Icon,
  label,
  color,
  ariaLabel,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: "green" | "blue" | "amber";
  ariaLabel?: string;
}) => {
  const colorMap = {
    green: "hover:text-[#128C7E] hover:bg-[#f0fdf4] focus:ring-[#25D366]",
    blue: "hover:text-[#3b82f6] hover:bg-[#eff6ff] focus:ring-[#3b82f6]",
    amber: "hover:text-[#f59e0b] hover:bg-[#fffbeb] focus:ring-[#f59e0b]",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`
        flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[#64748b] 
        transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-1
        ${colorMap[color]}
      `}
      title={label}
      aria-label={ariaLabel || label}
    >
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      <span className="text-[10px] font-semibold truncate w-full text-center">{label}</span>
    </button>
  );
});

ActionButton.displayName = "ActionButton";

const MobileActionButton = memo(({
  onClick,
  icon: Icon,
  label,
  color,
  delay = 0,
  ariaLabel,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: "green" | "blue" | "amber";
  delay?: number;
  ariaLabel?: string;
}) => {
  const colorMap = {
    green: "text-[#128C7E] bg-[#f0fdf4] border-[#25D366]/20 focus:ring-[#25D366]",
    blue: "text-[#3b82f6] bg-[#eff6ff] border-[#3b82f6]/20 focus:ring-[#3b82f6]",
    amber: "text-[#f59e0b] bg-[#fffbeb] border-[#f59e0b]/20 focus:ring-[#f59e0b]",
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(e as unknown as React.MouseEvent);
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`
        flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold
        border transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1
        ${colorMap[color]}
      `}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={ariaLabel || label}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
});

MobileActionButton.displayName = "MobileActionButton";

// Optimized ProductCard with memo
const ProductCard = memo(({
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
  getBadgeStyle,
}: {
  product: Product;
  index: number;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenModal: (product: Product) => void;
  onAction: (handler: string, product: Product) => void;
  getCategoryEmoji: (category: string) => string;
  getCategoryColor: (category: string) => string;
  getStockStyle: (stock: number) => { color: string; width: string };
  getBadgeStyle: (stock: number) => { badge: string; label: string };
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);

  const stock = Math.max(0, product.stock || 0);
  const stockStyle = getStockStyle(stock);
  const badgeInfo = getBadgeStyle(stock);
  const hasImage = (product.image || product.imageUrl) && !imageError;
  const isOnSale = product.salePrice && product.salePrice > 0 && product.salePrice < (product.price || 0);
  const discountPercent = isOnSale && product.price ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleCardClick = useCallback(() => {
    if (!bulkMode) {
      onOpenModal(product);
    }
  }, [bulkMode, product, onOpenModal]);

  const handleToggleSelectWrapper = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(product.id);
  }, [product.id, onToggleSelect]);

  const handleActionWrapper = useCallback((handler: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(handler, product);
  }, [product, onAction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      className={`
        group relative md3-card-elevated overflow-hidden 
        transition-all duration-200 ease-out
        ${isSelected
          ? "ring-2 ring-[var(--md-sys-color-primary)] shadow-lg"
          : ""
        }
      `}
      style={{ contain: 'layout style paint' }}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role={!bulkMode ? "button" : "article"}
      tabIndex={!bulkMode ? 0 : -1}
      aria-label={`${product.name}, ${formatCurrency(product.price)}`}
    >
      {/* Image section */}
      <div
        className={`
          relative h-36 sm:h-40 md:h-48 overflow-hidden
          ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(product.category || "")}` : "bg-[var(--md-sys-color-surface)]"}
        `}
      >
        {/* Bulk checkbox overlay */}
        {bulkMode && (
          <div
            className="absolute top-3 left-3 z-20"
            onClick={handleToggleSelectWrapper}
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`Select ${product.name}`}
          >
            <div
              className={`
                w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                ${isSelected
                  ? "bg-[var(--md-sys-color-primary)] border-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-md"
                  : "bg-[var(--md-sys-color-surface)] border-[var(--md-sys-color-outline)] hover:border-[var(--md-sys-color-primary)] hover:shadow-sm"
                }
              `}
            >
              {isSelected && <CheckSquare className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />}
            </div>
          </div>
        )}

        {/* Stock badge */}
        {!bulkMode && badgeInfo.badge !== "new" && (
          <span
            className={`
              absolute top-3 left-3 z-10 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium shadow-sm
              ${badgeInfo.badge === "out" ? "bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-error)]" : "bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]"}
            `}
            aria-label={`${badgeInfo.label} stock`}
          >
            {badgeInfo.label}
          </span>
        )}

        {/* Status badge */}
        {!bulkMode && product.status && product.status !== "active" && (
          <span
            className={`
              absolute top-3 right-3 z-10 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium shadow-sm
              ${product.status === "paused" ? "bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)]" : "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"}
            `}
            aria-label={`Product is ${product.status}`}
          >
            {product.status === "paused" ? "Paused" : "Archived"}
          </span>
        )}

        {/* Sale badge */}
        {isOnSale && !bulkMode && (
          <span
            className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-[10px] font-medium bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-error)] shadow-sm"
            aria-label={`${discountPercent}% off`}
          >
            -{discountPercent}%
          </span>
        )}

        {/* Image or emoji */}
        {hasImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-[var(--md-sys-color-surface)] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[var(--md-sys-color-primary)] animate-spin" aria-label="Loading image" />
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
          <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl select-none" aria-hidden="true">
            {getCategoryEmoji(product.category || "")}
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" aria-hidden="true" />
      </div>

      {/* Content */}
      {/* Card content - MD3 Card Content */}
      <div className="p-3 md:p-4">
        {/* Category */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] md:text-xs font-medium text-[var(--md-sys-color-primary)] uppercase tracking-wider truncate">
            {product.category || "Uncategorized"}
          </span>
          {product.sku && (
            <span 
              className="text-[9px] text-[var(--md-sys-color-on-surface-variant)] font-mono truncate"
              aria-label={`SKU: ${product.sku}`}
            >
              #{product.sku}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-medium text-sm md:text-base text-[var(--md-sys-color-on-surface)] mb-2 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2 md:mb-3">
          <span className="text-lg md:text-xl font-semibold text-[var(--md-sys-color-on-surface)]">
            {formatCurrency(product.price)}
          </span>
          {isOnSale && (
            <span className="text-xs text-[var(--md-sys-color-on-surface-variant)] line-through font-normal" aria-label="Original price">
              {formatCurrency(product.salePrice!)}
            </span>
          )}
        </div>

        {/* Stock & metrics */}
        <div className="pt-2 md:pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#64748b] mb-1">
                <Package className="w-3 h-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{stock.toLocaleString()} in stock</span>
              </div>
              <div 
                className="w-full max-w-[80px] h-1.5 bg-[var(--md-sys-color-surface-variant)] rounded-full overflow-hidden"
                aria-label={`Stock level: ${Math.round((stock / 100) * 100)}%`}
              >
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: stockStyle.width,
                    backgroundColor: stockStyle.color,
                  }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Metrics */}
            {!bulkMode && (
              <div className="flex items-center gap-2.5 shrink-0 ml-2">
                {(product.views || 0) > 0 && (
                  <MetricBadge icon={Eye} value={product.views || 0} label="Views" />
                )}
                {(product.orders || 0) > 0 && (
                  <MetricBadge icon={ShoppingCart} value={product.orders || 0} label="Orders" />
                )}
                {product.rating && product.rating > 0 && (
                  <MetricBadge
                    icon={Star}
                    value={product.rating.toFixed(1)}
                    label="Rating"
                    color="text-[#f59e0b]"
                    fill
                  />
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!bulkMode && (
            <div className="relative pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
              {/* Desktop: Full actions */}
              <div className="hidden sm:grid grid-cols-5 gap-1">
                {ACTION_CONFIG.map((action) => {
                  const Icon = action.key === "toggle"
                    ? action.getIcon!(product.status || "active")
                    : action.icon!;
                  const label = action.key === "toggle"
                    ? action.getLabel!(product.status || "active")
                    : action.label!;
                  const color = action.key === "toggle"
                    ? action.getColor!(product.status || "active")
                    : action.color!;
                  const ariaLabel = typeof action.ariaLabel === 'function' 
                    ? action.ariaLabel(product.status || "active")
                    : action.ariaLabel;

                  return (
                    <ActionButton
                      key={action.key}
                      onClick={(e) => handleActionWrapper(action.handler, e)}
                      icon={Icon}
                      label={label}
                      color={color}
                      ariaLabel={ariaLabel}
                    />
                  );
                })}
              </div>

              {/* Mobile: Expandable actions */}
              <div className="sm:hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedMobile(!expandedMobile);
                  }}
                  className={`
                    w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all
                    ${expandedMobile
                      ? "text-[#128C7E] bg-[#f0fdf4]"
                      : "text-[#64748b] hover:text-[#128C7E] hover:bg-white"
                    }
                    focus:outline-none focus:ring-2 focus:ring-[#25D366]
                  `}
                  aria-expanded={expandedMobile}
                  aria-label={`${expandedMobile ? "Hide" : "Show"} product actions`}
                >
                  <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                  <span>{expandedMobile ? "Less" : "Actions"}</span>
                  <ChevronDown
                    className={`
                      w-3 h-3 transition-transform duration-200
                      ${expandedMobile ? "rotate-180" : "rotate-0"}
                    `}
                    aria-hidden="true"
                  />
                </button>

                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${expandedMobile ? "max-h-[300px] opacity-100 mt-1.5" : "max-h-0 opacity-0 mt-0"}
                  `}
                  aria-hidden={!expandedMobile}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {ACTION_CONFIG.map((action, idx) => {
                      const Icon = action.key === "toggle"
                        ? action.getIcon!(product.status || "active")
                        : action.icon!;
                      const label = action.key === "toggle"
                        ? action.getLabel!(product.status || "active")
                        : action.label!;
                      const color = action.key === "toggle"
                        ? action.getColor!(product.status || "active")
                        : action.color!;
                      const ariaLabel = typeof action.ariaLabel === 'function' 
                        ? action.ariaLabel(product.status || "active")
                        : action.ariaLabel;

                      return (
                        <MobileActionButton
                          key={action.key}
                          onClick={(e) => handleActionWrapper(action.handler, e)}
                          icon={Icon}
                          label={label}
                          color={color}
                          delay={idx * 50}
                          ariaLabel={ariaLabel}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = "ProductCard";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductGridView({
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
  getBadgeStyle,
  virtualScroll = true,
  itemsPerPage = 12,
}: ProductGridViewProps) {
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Memoize handlers to prevent unnecessary re-renders
  const handleAction = useCallback(
    (handler: string, product: Product): Promise<void> => {
      const handlers: Record<string, (p: Product) => void | Promise<void>> = {
        handleToggleStatus,
        handleDuplicateProduct,
        handleShareProduct,
        shareProductWhatsApp,
        printProductCatalog,
      };
      
      const handlerFn = handlers[handler];
      if (handlerFn) {
        handlerFn(product);
      }
      return Promise.resolve();
    },
    [handleToggleStatus, handleDuplicateProduct, handleShareProduct, shareProductWhatsApp, printProductCatalog]
  );

  // Pagination or virtual scroll logic
  useEffect(() => {
    if (virtualScroll) {
      // For virtual scroll, we'll implement intersection observer
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && products.length > displayedProducts.length) {
            loadMoreProducts();
          }
        },
        { threshold: 0.1 }
      );

      const sentinel = document.getElementById('product-grid-sentinel');
      if (sentinel) observer.observe(sentinel);

      return () => observer.disconnect();
    } else {
      // Simple pagination
      setDisplayedProducts(products.slice(0, page * itemsPerPage));
    }
  }, [products, virtualScroll, page, itemsPerPage]);

  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    
    setTimeout(() => {
      const nextPage = page + 1;
      setPage(nextPage);
      setDisplayedProducts(products.slice(0, nextPage * itemsPerPage));
      setIsLoadingMore(false);
    }, 100);
  }, [page, products, itemsPerPage, isLoadingMore]);

  if (products.length === 0) return null;

  const productsToRender = virtualScroll ? displayedProducts : products;

  return (
    <div 
      className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm animate-fadeIn"
      role="region"
      aria-label="Product grid"
    >
      {/* Bulk selection header */}
      {bulkMode && (
        <div className="p-3 md:p-4 border-b border-[#e2e8f0] bg-white">
          <BulkHeader
            bulkSelected={bulkSelected}
            totalProducts={products.length}
            onSelectAll={selectAllProducts}
          />
        </div>
      )}

      {/* Grid */}
      <div className="p-4">
        <div 
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4"
          style={{ contain: 'layout' }}
        >
          {productsToRender.map((product, index) => (
            <ProductCard
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
              getBadgeStyle={getBadgeStyle}
            />
          ))}
        </div>

        {/* Loading sentinel for virtual scroll */}
        {virtualScroll && productsToRender.length < products.length && (
          <div id="product-grid-sentinel" className="py-4 flex justify-center">
            <Loader2 className="w-6 h-6 text-[#25D366] animate-spin" />
          </div>
        )}

        {/* Show more button for pagination */}
        {!virtualScroll && productsToRender.length < products.length && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadMoreProducts}
              disabled={isLoadingMore}
              className="px-6 py-2.5 bg-white border border-[#e2e8f0] rounded-xl text-sm font-semibold text-[#64748b] hover:text-[#25D366] hover:border-[#25D366] transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoadingMore ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                `Load More (${products.length - productsToRender.length} remaining)`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}