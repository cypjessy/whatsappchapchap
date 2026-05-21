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
  Package,
  Loader2,
  X,
  ImageOff,
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
  isLoading?: boolean;
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
  ariaLabel?: string | ((status: string) => string);
  shouldShow?: (product: Product) => boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ACTION_CONFIG: readonly ActionConfig[] = [
  {
    key: "toggle",
    getIcon: (status: string) => (status === "active" ? Pause : Play),
    getLabel: (status: string) => (status === "active" ? "Pause" : "Activate"),
    getColor: (status: string) => (status === "active" ? "amber" : "green"),
    handler: "handleToggleStatus",
    ariaLabel: (status: string) => status === "active" ? "Pause product" : "Activate product",
    shouldShow: () => true, // Always show toggle
  },
  {
    key: "duplicate",
    icon: Copy,
    label: "Copy",
    color: "blue",
    handler: "handleDuplicateProduct",
    ariaLabel: "Duplicate product",
    shouldShow: (product: Product) => product.status !== "draft", // Hide for draft products
  },
  {
    key: "share",
    icon: Share2,
    label: "Share",
    color: "green",
    handler: "handleShareProduct",
    ariaLabel: "Share product",
    shouldShow: (product: Product) => product.status === "active", // Only share active products
  },
  {
    key: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    color: "green",
    handler: "shareProductWhatsApp",
    ariaLabel: "Share via WhatsApp",
    shouldShow: (product: Product) => product.status === "active" && (product.stock ?? 0) > 0, // Only if active and in stock
  },
  {
    key: "print",
    icon: Printer,
    label: "Print",
    color: "blue",
    handler: "printProductCatalog",
    ariaLabel: "Print product catalog",
    shouldShow: () => true, // Always available
  },
] as const;

const FALLBACK_IMAGE_URL = "/images/placeholder-product.jpg";

// ─── Animated Counter Hook ────────────────────────────────────────────────────

function useAnimatedCounter(target: number, duration: number = 1000, delay: number = 0) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [hasStarted, target, duration]);

  return count;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

const ShimmerCard = memo(() => (
  <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden shadow-md3-level1">
    <div className="relative h-36 sm:h-40 md:h-48 bg-surface-container-lowest overflow-hidden">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
    <div className="p-3 md:p-4 space-y-3">
      <div className="h-3 bg-surface-variant rounded-lg w-16" />
      <div className="h-5 bg-surface-variant rounded-lg w-3/4" />
      <div className="h-6 bg-surface-variant rounded-lg w-1/2" />
      <div className="pt-2 border-t border-outline-variant space-y-2">
        <div className="h-3 bg-surface-variant rounded-lg w-full" />
        <div className="h-8 bg-surface-variant rounded-lg w-full" />
      </div>
    </div>
  </div>
));
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
  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

  return (
    <div className="flex items-center justify-between bg-gradient-to-r from-[#f8fafc] to-white p-3.5 md:p-4 rounded-xl md:rounded-2xl border border-outline-variant shadow-md3-level1 animate-fadeIn">
      <button
        onClick={onSelectAll}
        className="flex items-center gap-2.5 group transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#25D366] rounded-lg"
      >
        <CheckboxIcon
          className={`w-5 h-5 transition-all duration-200 ${
            bulkSelected.length > 0 ? "text-[#25D366]" : "text-[#cbd5e1] group-hover:text-outline"
          }`}
          strokeWidth={bulkSelected.length > 0 ? 2.5 : 2}
        />
        <span className="text-sm font-semibold text-on-surface-variant">
          {bulkSelected.length > 0 ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-[#25D366] text-white text-[10px] font-bold">
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
        <div className="text-xs text-outline font-medium">
          {Math.round((bulkSelected.length / totalProducts) * 100)}%
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
  color = "text-on-surface-variant",
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
    <div className={`flex items-center gap-1 text-[10px] md:text-xs ${color}`} title={label}>
      <Icon className={`w-3 h-3 ${fill ? "fill-current" : ""}`} />
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

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-on-surface-variant 
        transition-all duration-200 active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-1
        ${colorMap[color]}
      `}
      title={label}
      aria-label={ariaLabel || label}
    >
      <Icon className="w-3.5 h-3.5" />
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

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold
        border transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1
        ${colorMap[color]}
      `}
      style={{ animationDelay: `${delay}ms` }}
      aria-label={ariaLabel || label}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
});
MobileActionButton.displayName = "MobileActionButton";

// ─── Product Card ─────────────────────────────────────────────────────────────

const ProductCard = memo(({
  product,
  bulkMode,
  isSelected,
  onToggleSelect,
  onOpenModal,
  onAction,
  getCategoryEmoji,
  getCategoryColor,
  getStockStyle,
  getBadgeStyle,
  index,
}: {
  product: Product;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenModal: (product: Product) => void;
  onAction: (handler: string, product: Product) => void;
  getCategoryEmoji: (category: string) => string;
  getCategoryColor: (category: string) => string;
  getStockStyle: (stock: number) => { color: string; width: string };
  getBadgeStyle: (stock: number) => { badge: string; label: string };
  index: number;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

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
    if (!bulkMode) onOpenModal(product);
  }, [bulkMode, product, onOpenModal]);

  const handleToggleSelectWrapper = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect(product.id);
  }, [product.id, onToggleSelect]);

  const handleActionWrapper = useCallback((handler: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(handler, product);
  }, [product, onAction]);

  return (
    <div
      className={`
        group relative bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden
        transition-all duration-300 ease-out cursor-pointer
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        ${isSelected ? "ring-2 ring-[#8b5cf6] shadow-md3-level3 shadow-[#8b5cf6]/10" : "shadow-md3-level1"}
        ${isHovered && !bulkMode && !isSelected ? "border-outline-variant shadow-md3-level3 shadow-[#e2e8f0]/40 -translate-y-1" : ""}
      `}
      style={{ transitionDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      role={!bulkMode ? "button" : "article"}
      tabIndex={!bulkMode ? 0 : -1}
      aria-label={`${product.name}, ${formatCurrency(product.price)}`}
    >
      {/* Top accent line on hover */}
      <div className={`
        absolute top-0 left-3 right-3 h-[2px] rounded-full bg-[#8b5cf6] transition-all duration-500 z-20
        ${isHovered && !bulkMode ? "opacity-100" : "opacity-0"}
      `} />

      {/* Image section */}
      <div className={`
        relative h-36 sm:h-40 md:h-48 overflow-hidden
        ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(product.category || "")}` : "bg-surface-container-lowest"}
      `}>
        {/* Bulk checkbox overlay */}
        {bulkMode && (
          <div className="absolute top-3 left-3 z-20" onClick={handleToggleSelectWrapper}>
            <div className={`
              w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200
              ${isSelected
                ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-md3-level2"
                : "bg-surface border-outline-variant hover:border-[#8b5cf6] hover:shadow-md3-level1"
              }
            `}>
              {isSelected && <CheckSquare className="w-4 h-4" strokeWidth={2.5} />}
            </div>
          </div>
        )}

        {/* Stock badge */}
        {!bulkMode && badgeInfo.badge !== "new" && (
          <span className={`
            absolute top-3 left-3 z-10 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium shadow-md3-level1
            ${badgeInfo.badge === "out"
              ? "bg-[#fee2e2] text-[#ef4444]"
              : "bg-[#fef3c7] text-[#f59e0b]"
            }
          `}>
            {badgeInfo.label}
          </span>
        )}

        {/* Status badge */}
        {!bulkMode && product.status && product.status !== "active" && (
          <span className={`
            absolute top-3 right-3 z-10 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium shadow-md3-level1
            ${product.status === "paused" ? "bg-[#fef3c7] text-[#f59e0b]" : "bg-surface-variant text-on-surface-variant"}
          `}>
            {product.status === "paused" ? "Paused" : "Archived"}
          </span>
        )}

        {/* Sale badge */}
        {isOnSale && !bulkMode && (
          <span className="absolute top-3 right-3 z-10 px-2 py-1 rounded-full text-[10px] font-medium bg-[#fee2e2] text-[#ef4444] shadow-md3-level1">
            -{discountPercent}%
          </span>
        )}

        {/* Image or emoji */}
        {hasImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-surface-container-lowest flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#8b5cf6] animate-spin" />
              </div>
            )}
            <img
              src={product.image || product.imageUrl}
              alt={product.name}
              className={`
                w-full h-full object-cover transition-all duration-500
                ${imageLoaded ? "opacity-100" : "opacity-0"}
                ${isHovered ? "scale-105" : "scale-100"}
              `}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
              decoding="async"
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl select-none">
            {getCategoryEmoji(product.category || "")}
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Category */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10px] md:text-xs font-medium text-[#8b5cf6] uppercase tracking-wider truncate">
            {product.category || "Uncategorized"}
          </span>
          {product.sku && (
            <span className="text-[9px] text-outline font-mono truncate">
              #{product.sku}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-bold text-sm md:text-base text-on-surface mb-2 line-clamp-2 leading-snug">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2 md:mb-3">
          <span className="text-lg md:text-xl font-extrabold text-on-surface">
            {formatCurrency(product.price)}
          </span>
          {isOnSale && (
            <span className="text-xs text-outline line-through font-normal">
              {formatCurrency(product.salePrice!)}
            </span>
          )}
        </div>

        {/* Stock & metrics */}
        <div className="pt-2 md:pt-3 border-t border-outline-variant">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-1">
                <Package className="w-3 h-3 shrink-0" />
                <span className="truncate">{stock.toLocaleString()} in stock</span>
              </div>
              <div className="w-full max-w-[80px] h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: stockStyle.width, backgroundColor: stockStyle.color }}
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
                  <MetricBadge icon={Star} value={product.rating.toFixed(1)} label="Rating" color="text-[#f59e0b]" fill />
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!bulkMode && (
            <div className="relative pt-2 border-t border-outline-variant">
              {/* Desktop: Full actions */}
              <div className="hidden sm:grid grid-cols-5 gap-1">
                {ACTION_CONFIG
                  .filter((action) => !action.shouldShow || action.shouldShow(product))
                  .map((action) => {
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
                    ${expandedMobile ? "text-[#128C7E] bg-[#f0fdf4]" : "text-on-surface-variant hover:text-[#128C7E] hover:bg-surface"}
                  `}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>{expandedMobile ? "Less" : "Actions"}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedMobile ? "rotate-180" : "rotate-0"}`} />
                </button>

                <div className={`
                  overflow-hidden transition-all duration-300 ease-out
                  ${expandedMobile ? "max-h-[300px] opacity-100 mt-1.5" : "max-h-0 opacity-0 mt-0"}
                `}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {ACTION_CONFIG
                      .filter((action) => !action.shouldShow || action.shouldShow(product))
                      .map((action, idx) => {
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
        <Package className="w-10 h-10 text-[#cbd5e1]" />
      </div>
      <p className="text-base md:text-lg font-bold text-on-surface-variant mb-1">No products found</p>
      <p className="text-xs md:text-sm text-outline max-w-xs text-center">
        Try adjusting your filters or search criteria to find what you're looking for.
      </p>
    </div>
  );
}

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
  isLoading = false,
}: ProductGridViewProps) {
  const handleAction = useCallback((handler: string, product: Product) => {
    const handlers: Record<string, (p: Product) => void> = {
      handleToggleStatus,
      handleDuplicateProduct,
      handleShareProduct,
      shareProductWhatsApp,
      printProductCatalog,
    };
    handlers[handler]?.(product);
  }, [handleToggleStatus, handleDuplicateProduct, handleShareProduct, shareProductWhatsApp, printProductCatalog]);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden shadow-md3-level1 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <ShimmerCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden shadow-md3-level1">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden shadow-md3-level1 animate-fadeIn">
      {/* Bulk selection header */}
      {bulkMode && (
        <div className="p-3 md:p-4 border-b border-outline-variant bg-surface">
          <BulkHeader
            bulkSelected={bulkSelected}
            totalProducts={products.length}
            onSelectAll={selectAllProducts}
          />
        </div>
      )}

      {/* Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
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
      </div>
    </div>
  );
}