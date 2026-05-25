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
  ChevronDown,
  TrendingUp,
  X,
  ImageOff,
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
  handleDeleteProduct: (productId: string) => void;
  getCategoryEmoji: (category: string) => string;
  getCategoryColor: (category: string) => string;
  getStockStyle: (stock: number) => { color: string; width: string };
  isLoading?: boolean;
}

type ActionColor = "green" | "blue" | "amber" | "cyan" | "red";

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
  shouldShow?: (product: Product) => boolean;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const COLOR_MAP: Record<ActionColor, string> = {
  green: "hover:text-white hover:bg-[#25D366] focus:ring-[#25D366]",
  blue: "hover:text-white hover:bg-[#3b82f6] focus:ring-[#3b82f6]",
  amber: "hover:text-white hover:bg-[#f59e0b] focus:ring-[#f59e0b]",
  cyan: "hover:text-white hover:bg-[#06b6d4] focus:ring-[#06b6d4]",
  red: "hover:text-white hover:bg-[#ef4444] focus:ring-[#ef4444]",
};

const BG_MAP: Record<ActionColor, string> = {
  green: "bg-[#f0fdf4] text-[#128C7E] border-[#25D366]/20",
  blue: "bg-[#eff6ff] text-[#3b82f6] border-[#3b82f6]/20",
  amber: "bg-[#fffbeb] text-[#f59e0b] border-[#f59e0b]/20",
  cyan: "bg-[#ecfeff] text-[#06b6d4] border-[#06b6d4]/20",
  red: "bg-[#fef2f2] text-[#ef4444] border-[#ef4444]/20",
};

const DESKTOP_ACTIONS: readonly ActionConfig[] = [
  {
    key: "toggle",
    getIcon: (s) => (s === "active" ? Pause : Play),
    getColor: (s) => (s === "active" ? "amber" : "green"),
    getLabel: (s) => (s === "active" ? "Pause" : "Activate"),
    handler: "handleToggleStatus",
    ariaLabel: (s) => s === "active" ? "Pause product" : "Activate product",
    shouldShow: () => true, // Always show toggle
  },
  { 
    key: "duplicate", 
    icon: Copy, 
    color: "blue", 
    label: "Duplicate", 
    handler: "handleDuplicateProduct",
    shouldShow: (product: Product) => product.status !== "draft", // Hide for draft products
  },
  { 
    key: "share", 
    icon: Share2, 
    color: "green", 
    label: "Share", 
    handler: "handleShareProduct",
    shouldShow: (product: Product) => product.status === "active", // Only share active products
  },
  { 
    key: "whatsapp", 
    icon: MessageCircle, 
    color: "green", 
    label: "WhatsApp", 
    handler: "shareProductWhatsApp",
    shouldShow: (product: Product) => product.status === "active" && (product.stock ?? 0) > 0, // Only if active and in stock
  },
  { 
    key: "print", 
    icon: Printer, 
    color: "cyan", 
    label: "Print", 
    handler: "printProductCatalog",
    shouldShow: () => true, // Always available
  },
  { 
    key: "delete", 
    icon: Trash2, 
    color: "red", 
    label: "Delete", 
    handler: "handleDelete",
    shouldShow: (product: Product) => product.status !== "draft", // Hide for draft products
  },
] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

const ShimmerRow = memo(() => (
  <div className="relative overflow-hidden px-3 md:px-4 py-3 md:py-4 border-b border-[#f1f5f9]">
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    <div className="hidden md:grid grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-4 items-center">
      <div className="w-8 h-8 rounded-lg bg-surface-variant" />
      <div className="w-14 h-14 rounded-xl bg-surface-variant" />
      <div className="space-y-2"><div className="h-4 bg-surface-variant rounded-lg w-3/4" /><div className="h-3 bg-surface-variant rounded-lg w-1/2" /></div>
      <div className="h-6 bg-surface-variant rounded-lg w-20" />
      <div className="h-5 bg-surface-variant rounded-lg w-16" />
      <div className="h-4 bg-surface-variant rounded-lg w-24" />
      <div className="flex justify-end gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-9 h-9 bg-surface-variant rounded-lg" />
        ))}
      </div>
    </div>
    <div className="md:hidden flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-surface-variant shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-surface-variant rounded-lg w-3/4" />
        <div className="h-3 bg-surface-variant rounded-lg w-1/2" />
      </div>
      <div className="w-8 h-8 bg-surface-variant rounded-lg" />
    </div>
  </div>
));
ShimmerRow.displayName = "ShimmerRow";

const MetricBadge = memo(({
  icon: Icon, value, label, color = "text-on-surface-variant", fill = false,
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
  return (
    <div className={`flex items-center gap-1 text-[10px] ${color}`} title={label}>
      <Icon className={`w-3 h-3 ${fill ? "fill-current" : ""}`} />
      <span className="font-medium">{displayValue}</span>
    </div>
  );
});
MetricBadge.displayName = "MetricBadge";

const ActionIconButton = memo(({
  onClick, icon: Icon, color, label, disabled = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  color: ActionColor;
  label: string;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-9 h-9 flex items-center justify-center rounded-lg border transition-all duration-200
      active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-1
      disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
      ${BG_MAP[color]} ${COLOR_MAP[color]}
    `}
    title={label}
    aria-label={label}
  >
    <Icon className="w-4 h-4" />
  </button>
));
ActionIconButton.displayName = "ActionIconButton";

const DeleteConfirmDialog = memo(({
  product, onConfirm, onCancel,
}: {
  product: Product | null;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  if (!product) return null;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onCancel}>
      <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#fee2e2] flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-[#ef4444]" />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Delete Product?</h3>
          <p className="text-sm text-on-surface-variant">
            Are you sure you want to delete <span className="font-semibold text-on-surface">"{product.name}"</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-3 border-2 border-outline-variant rounded-xl font-bold text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-95">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-3 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-xl font-bold shadow-md3-level2 hover:shadow-md3-level3 active:scale-95 transition-all">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});
DeleteConfirmDialog.displayName = "DeleteConfirmDialog";

// ─── Product Row ──────────────────────────────────────────────────────────────

const ProductRow = memo(({
  product, bulkMode, isSelected, onToggleSelect, onOpenModal, onAction,
  getCategoryEmoji, getCategoryColor, getStockStyle, index,
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
  index: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 40);
    return () => clearTimeout(timer);
  }, [index]);

  const stock = Math.max(0, product.stock || 0);
  const stockStyle = getStockStyle(stock);
  const hasImage = (product.image || product.imageUrl) && !imageError;
  const isOnSale = product.salePrice && product.salePrice > 0 && (product.price || 0) > product.salePrice;
  const status = product.status || "active";
  const category = product.category || "Uncategorized";

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => { setImageError(true); setImageLoaded(true); }, []);

  const handleRowClick = useCallback(() => { if (!bulkMode) onOpenModal(product); }, [bulkMode, product, onOpenModal]);
  const handleToggleSelectWrapper = useCallback((e: React.MouseEvent) => { e.stopPropagation(); onToggleSelect(product.id); }, [product.id, onToggleSelect]);

  const handleActionWrapper = useCallback((handler: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (handler === "handleDelete") {
      setShowDeleteDialog(true);
      return;
    }
    onAction(handler, product);
  }, [product, onAction]);

  const handleDeleteConfirm = useCallback(() => {
    onAction("handleDelete", product);
    setShowDeleteDialog(false);
  }, [product, onAction]);

  // Swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = touchStartX.current - e.touches[0].clientX;
    if (diff > 0 && diff < 140) setSwipeOffset(diff);
  }, []);
  const handleTouchEnd = useCallback(() => {
    setSwipeOffset(swipeOffset > 70 ? 120 : 0);
  }, [swipeOffset]);

  const productIdShort = product.id.slice(0, 8);
  const views = product.views || 0;
  const orders = product.orders || 0;
  const rating = product.rating;

  return (
    <>
      <div
        className={`
          group relative transition-all duration-200
          ${isSelected ? "bg-[#ede9fe]/30" : "hover:bg-surface-container-lowest"}
          ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"}
        `}
        style={{ transitionDelay: `${index * 40}ms` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Left accent bar */}
        <div
          className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-300 ${isHovered && !isSelected ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundColor: stockStyle.color }}
        />

        {/* Swipe reveal actions (mobile) */}
        <div className="md:hidden absolute inset-y-0 right-0 flex items-center gap-1 pr-2 z-0">
          <button onClick={(e) => { e.stopPropagation(); handleActionWrapper("shareProductWhatsApp", e); }} className="w-11 h-11 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md3-level3 active:scale-90">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleActionWrapper("handleToggleStatus", e); }} className="w-11 h-11 rounded-xl bg-[#f59e0b] text-white flex items-center justify-center shadow-md3-level3 active:scale-90">
            {status === "active" ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
        </div>

        {/* Main row content */}
        <div
          className="relative z-10 bg-surface transition-transform duration-200 ease-out"
          style={{ transform: `translateX(-${swipeOffset}px)` }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center"
            onClick={handleRowClick}
            role={!bulkMode ? "button" : "gridcell"}
            tabIndex={!bulkMode ? 0 : -1}
          >
            {/* Checkbox */}
            {bulkMode && (
              <div className="flex items-center justify-center" onClick={handleToggleSelectWrapper}>
                <div className={`
                  w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                  ${isSelected ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-md3-level1" : "border-outline-variant hover:border-[#8b5cf6] bg-surface"}
                `}>
                  {isSelected && <CheckSquare className="w-4 h-4" strokeWidth={2.5} />}
                </div>
              </div>
            )}

            {/* Image */}
            <div className={`
              relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0
              ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(category)}` : "bg-surface-container-lowest"}
            `}>
              {hasImage ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 bg-surface-container-lowest flex items-center justify-center">
                      <Loader2 className="w-4 h-4 text-[#8b5cf6] animate-spin" />
                    </div>
                  )}
                  <img
                    src={product.image || product.imageUrl}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    loading="lazy"
                    decoding="async"
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg md:text-2xl">
                  {getCategoryEmoji(category)}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-bold text-sm truncate transition-colors duration-200 ${isHovered ? "text-[#8b5cf6]" : "text-on-surface"}`}>
                  {product.name}
                </h3>
                {status !== "active" && (
                  <span className={`hidden md:inline-flex shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${status === "paused" ? "bg-[#fef3c7] text-[#f59e0b]" : "bg-surface-variant text-on-surface-variant"}`}>
                    {status === "paused" ? "Paused" : "Archived"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-outline font-mono">#{productIdShort}</span>
                <div className="flex md:hidden items-center gap-2">
                  {views > 0 && <MetricBadge icon={Eye} value={views} label="Views" />}
                  {orders > 0 && <MetricBadge icon={ShoppingCart} value={orders} label="Orders" />}
                  {rating && rating > 0 && <MetricBadge icon={Star} value={rating.toFixed(1)} label="Rating" color="text-[#f59e0b]" fill />}
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 mt-1.5">
                {views > 0 && <MetricBadge icon={Eye} value={views} label="Views" />}
                {orders > 0 && <MetricBadge icon={ShoppingCart} value={orders} label="Orders" />}
                {rating && rating > 0 && <MetricBadge icon={Star} value={rating.toFixed(1)} label="Rating" color="text-[#f59e0b]" fill />}
              </div>
            </div>

            {/* Category (desktop) */}
            <div className="hidden md:block">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-surface-container-lowest text-xs font-medium text-on-surface-variant capitalize border border-outline-variant">
                {category}
              </span>
            </div>

            {/* Price */}
            <div className="hidden md:block">
              <div className="font-bold text-sm text-on-surface">{formatCurrency(product.price)}</div>
              {isOnSale && <div className="text-[10px] text-outline line-through">{formatCurrency(product.salePrice!)}</div>}
            </div>

            {/* Stock */}
            <div className="hidden md:block">
              <div className="flex items-center gap-1.5 mb-1">
                <Package className="w-3 h-3 text-outline" />
                <span className="text-sm font-semibold" style={{ color: stockStyle.color }}>{stock.toLocaleString()}</span>
              </div>
              <div className="w-full max-w-[80px] h-1.5 bg-surface-variant rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: stockStyle.width, backgroundColor: stockStyle.color }} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2 justify-end">
              {!bulkMode && (
                <>
                  {/* Desktop actions */}
                  <div className="hidden md:flex items-center gap-1.5">
                    {DESKTOP_ACTIONS
                      .filter((action) => !action.shouldShow || action.shouldShow(product))
                      .map((action) => {
                        const Icon = action.key === "toggle" ? action.getIcon!(status) : action.icon!;
                        const color = action.key === "toggle" ? action.getColor!(status) : action.color!;
                        const label = action.key === "toggle" ? action.getLabel!(status) : action.label!;
                        const ariaLabel = typeof action.ariaLabel === 'function' ? action.ariaLabel(status) : action.ariaLabel;
                        return (
                          <ActionIconButton
                            key={action.key}
                            onClick={(e) => handleActionWrapper(action.handler, e)}
                            icon={Icon}
                            color={color}
                            label={ariaLabel || label}
                          />
                        );
                      })}
                  </div>

                  {/* Mobile expand */}
                  <div className="md:hidden">
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedMobile(!expandedMobile); }}
                      className={`
                        w-8 h-8 flex items-center justify-center rounded-lg transition-all
                        ${expandedMobile ? "bg-[#8b5cf6] text-white shadow-md3-level2" : "text-outline hover:bg-surface-variant"}
                      `}
                    >
                      {expandedMobile ? <ChevronDown className="w-4 h-4" /> : <MoreHorizontal className="w-4 h-4" />}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile expanded actions */}
          <div className={`md:hidden overflow-hidden transition-all duration-300 ${expandedMobile ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
            <div className="px-3 pb-3">
              <div className="grid grid-cols-3 gap-2 p-2 bg-surface-container-lowest rounded-xl border border-outline-variant">
                {DESKTOP_ACTIONS
                  .filter((action) => !action.shouldShow || action.shouldShow(product))
                  .map((action, idx) => {
                    const Icon = action.key === "toggle" ? action.getIcon!(status) : action.icon!;
                    const color = action.key === "toggle" ? action.getColor!(status) : action.color!;
                    const label = action.key === "toggle" ? action.getLabel!(status) : action.label!;
                    return (
                      <button
                        key={action.key}
                        onClick={(e) => handleActionWrapper(action.handler, e)}
                        className={`
                          flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold
                          border transition-all active:scale-95
                          ${BG_MAP[color]} ${COLOR_MAP[color]}
                        `}
                        style={{ transitionDelay: `${idx * 50}ms` }}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px]">{label}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <DeleteConfirmDialog product={product} onConfirm={handleDeleteConfirm} onCancel={() => setShowDeleteDialog(false)} />
      )}
    </>
  );
});
ProductRow.displayName = "ProductRow";

// ─── List Header ─────────────────────────────────────────────────────────────

function ListHeader({
  bulkMode, bulkSelected, totalProducts, onSelectAll,
}: {
  bulkMode: boolean;
  bulkSelected: string[];
  totalProducts: number;
  onSelectAll: () => void;
}) {
  const isAllSelected = bulkSelected.length === totalProducts && totalProducts > 0;
  const isPartialSelected = bulkSelected.length > 0 && !isAllSelected;
  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-b from-[#f8fafc] to-[#f8fafc]/95 backdrop-blur-sm border-b-2 border-outline-variant">
      <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center">
        {bulkMode && (
          <button onClick={onSelectAll} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-variant transition-all active:scale-95">
            <CheckboxIcon className={`w-5 h-5 transition-all ${bulkSelected.length > 0 ? "text-[#8b5cf6]" : "text-[#cbd5e1]"}`} strokeWidth={bulkSelected.length > 0 ? 2.5 : 2} />
          </button>
        )}
        <div className="hidden md:block text-[10px] font-bold text-outline uppercase tracking-wider text-center">Image</div>
        <div className="hidden md:block text-[10px] font-bold text-outline uppercase tracking-wider">Product</div>
        <div className="hidden md:block text-[10px] font-bold text-outline uppercase tracking-wider">Category</div>
        <div className="hidden md:block text-[10px] font-bold text-outline uppercase tracking-wider">Price</div>
        <div className="hidden md:block text-[10px] font-bold text-outline uppercase tracking-wider">Stock</div>
        <div className="hidden md:block text-[10px] font-bold text-outline uppercase tracking-wider text-right">Actions</div>
        <div className="md:hidden flex items-center justify-between flex-1">
          <span className="text-xs font-semibold text-on-surface-variant">{totalProducts} {totalProducts === 1 ? "product" : "products"}</span>
          {bulkMode && bulkSelected.length > 0 && (
            <span className="text-xs font-bold text-[#8b5cf6]">{bulkSelected.length} selected</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
        <Package className="w-10 h-10 text-[#cbd5e1]" />
      </div>
      <p className="text-base md:text-lg font-bold text-on-surface-variant mb-1">No products found</p>
      <p className="text-xs md:text-sm text-outline max-w-xs text-center">Try adjusting your filters or search criteria.</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductListView({
  products, bulkMode, bulkSelected, toggleBulkSelect, selectAllProducts,
  openProductModal, handleToggleStatus, handleDuplicateProduct, handleShareProduct,
  shareProductWhatsApp, printProductCatalog, handleDeleteProduct, getCategoryEmoji, getCategoryColor,
  getStockStyle, isLoading = false,
}: ProductListViewProps) {
  const handleAction = useCallback((handler: string, product: Product) => {
    const handlers: Record<string, (p: Product) => void> = {
      handleToggleStatus, handleDuplicateProduct, handleShareProduct,
      shareProductWhatsApp, printProductCatalog,
      handleDelete: (p) => handleDeleteProduct(p.id),
    };
    handlers[handler]?.(product);
  }, [handleToggleStatus, handleDuplicateProduct, handleShareProduct, shareProductWhatsApp, printProductCatalog, handleDeleteProduct]);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden shadow-md3-level1">
        <ListHeader bulkMode={bulkMode} bulkSelected={bulkSelected} totalProducts={0} onSelectAll={() => {}} />
        {Array.from({ length: 8 }).map((_, i) => <ShimmerRow key={i} />)}
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
      <ListHeader bulkMode={bulkMode} bulkSelected={bulkSelected} totalProducts={products.length} onSelectAll={selectAllProducts} />
      <div className="divide-y divide-[#f1f5f9]">
        {products.map((product, index) => (
          <ProductRow
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
          />
        ))}
      </div>
    </div>
  );
}