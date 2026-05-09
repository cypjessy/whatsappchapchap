"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DESKTOP_ACTIONS = [
  {
    key: "toggle",
    getIcon: (status: string) => (status === "active" ? Pause : Play),
    getColor: (status: string): "green" | "amber" => (status === "active" ? "amber" : "green"),
    getLabel: (status: string) => (status === "active" ? "Pause" : "Activate"),
    handler: "handleToggleStatus",
  },
  { key: "duplicate", icon: Copy, color: "blue" as const, label: "Duplicate", handler: "handleDuplicateProduct" },
  { key: "share", icon: Share2, color: "green" as const, label: "Share", handler: "handleShareProduct" },
  { key: "whatsapp", icon: MessageCircle, color: "green" as const, label: "WhatsApp", handler: "shareProductWhatsApp" },
  { key: "print", icon: Printer, color: "cyan" as const, label: "Print", handler: "printProductCatalog" },
  { key: "delete", icon: Trash2, color: "red" as const, label: "Delete", handler: "handleDelete" },
] as const;

const MOBILE_ACTIONS = [
  {
    key: "toggle",
    getIcon: (status: string) => (status === "active" ? Pause : Play),
    getColor: (status: string): "green" | "amber" => (status === "active" ? "amber" : "green"),
    getLabel: (status: string) => (status === "active" ? "Pause" : "Activate"),
    handler: "handleToggleStatus",
  },
  { key: "duplicate", icon: Copy, color: "blue" as const, label: "Duplicate", handler: "handleDuplicateProduct" },
  { key: "share", icon: Share2, color: "green" as const, label: "Share", handler: "handleShareProduct" },
  { key: "whatsapp", icon: MessageCircle, color: "green" as const, label: "WhatsApp", handler: "shareProductWhatsApp" },
  { key: "print", icon: Printer, color: "cyan" as const, label: "Print", handler: "printProductCatalog" },
  { key: "delete", icon: Trash2, color: "red" as const, label: "Delete", handler: "handleDelete" },
] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerRow() {
  return (
    <div className="relative overflow-hidden px-3 md:px-4 py-3 md:py-4 border-b border-[#f1f5f9]">
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
}

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

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-b from-[#f8fafc] to-[#f8fafc]/95 backdrop-blur-sm border-b-2 border-[#e2e8f0]">
      <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center">
        {bulkMode && (
          <button
            onClick={onSelectAll}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#e2e8f0] transition-all active:scale-95"
            aria-label={isAllSelected ? "Deselect all" : "Select all"}
          >
            <CheckboxIcon
              className={`w-5 h-5 transition-all duration-200 ${
                bulkSelected.length > 0 ? "text-[#25D366]" : "text-[#cbd5e1]"
              }`}
              strokeWidth={bulkSelected.length > 0 ? 2.5 : 2}
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
          <span className="text-xs font-semibold text-[#64748b]">
            {totalProducts} {totalProducts === 1 ? "product" : "products"}
          </span>
          {bulkMode && bulkSelected.length > 0 && (
            <span className="text-xs font-bold text-[#25D366]">
              {bulkSelected.length} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductRow({
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
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 40);
    return () => clearTimeout(timer);
  }, [index]);

  const stockStyle = getStockStyle(product.stock || 0);
  const hasImage = (product.image || product.imageUrl) && !imageError;
  const isOnSale = product.salePrice && product.salePrice > (product.price || 0);

  return (
    <div
      className={`
        group relative transition-all duration-200
        ${isSelected ? "bg-[#f0fdf4]" : "hover:bg-[#f8fafc]"}
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"}
      `}
      style={{ transitionDelay: `${index * 40}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left accent bar on hover */}
      <div
        className={`
          absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full transition-all duration-300
          ${isHovered && !isSelected ? "opacity-100" : "opacity-0"}
        `}
        style={{ backgroundColor: stockStyle.color }}
      />

      {/* Main row */}
      <div
        className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center cursor-pointer"
        onClick={() => !bulkMode && onOpenModal(product)}
      >
        {/* Checkbox */}
        {bulkMode && (
          <div
            className="flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(product.id);
            }}
          >
            <div
              className={`
                w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 cursor-pointer
                ${isSelected
                  ? "bg-[#25D366] border-[#25D366] text-white shadow-sm"
                  : "border-[#e2e8f0] hover:border-[#25D366] bg-white"
                }
              `}
            >
              {isSelected && <CheckSquare className="w-4 h-4" strokeWidth={2.5} />}
            </div>
          </div>
        )}

        {/* Image */}
        <div
          className={`
            relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0
            ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(product.category || "")}` : "bg-[#f8fafc]"}
          `}
        >
          {hasImage ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-[#25D366] animate-spin" />
                </div>
              )}
              <img
                src={product.image || product.imageUrl}
                alt={product.name}
                className={`
                  w-full h-full object-cover transition-opacity duration-300
                  ${imageLoaded ? "opacity-100" : "opacity-0"}
                `}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(true);
                }}
                loading="lazy"
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg md:text-2xl">
              {getCategoryEmoji(product.category || "")}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={`
                font-bold text-sm text-[#1e293b] truncate transition-colors duration-200
                ${isHovered ? "text-[#128C7E]" : "text-[#1e293b]"}
              `}
            >
              {product.name}
            </h3>
            {product.status && product.status !== "active" && (
              <span
                className={`
                  hidden md:inline-flex shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold
                  ${product.status === "paused" ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-[#64748b]/10 text-[#64748b]"}
                `}
              >
                {product.status}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-[#94a3b8] font-mono">#{product.id.slice(0, 8)}</span>
            {/* Mobile metrics */}
            <div className="flex md:hidden items-center gap-2">
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
          </div>
          {/* Desktop metrics */}
          <div className="hidden md:flex items-center gap-3 mt-1.5">
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
        </div>

        {/* Category (desktop) */}
        <div className="hidden md:block">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[#f8fafc] text-xs font-medium text-[#64748b] capitalize border border-[#e2e8f0]">
            {product.category || "Uncategorized"}
          </span>
        </div>

        {/* Price */}
        <div className="hidden md:block">
          <div className="font-bold text-sm text-[#1e293b]">{formatCurrency(product.price)}</div>
          {isOnSale && (
            <div className="text-[10px] text-[#94a3b8] line-through font-medium">
              {formatCurrency(product.salePrice!)}
            </div>
          )}
        </div>

        {/* Stock */}
        <div className="hidden md:block">
          <div className="flex items-center gap-1.5 mb-1">
            <Package className="w-3 h-3 text-[#94a3b8]" />
            <span className="text-sm font-semibold" style={{ color: stockStyle.color }}>
              {product.stock || 0}
            </span>
          </div>
          <div className="w-full max-w-[80px] h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: isVisible ? stockStyle.width : "0%",
                backgroundColor: stockStyle.color,
              }}
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
                    ? action.getIcon!(product.status || "active")
                    : action.icon;
                  const color = action.key === "toggle"
                    ? action.getColor!(product.status || "active")
                    : action.color;

                  return (
                    <ActionIconButton
                      key={action.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(action.handler, product);
                      }}
                      icon={Icon}
                      color={color}
                      label={action.key === "toggle" ? action.getLabel!(product.status || "active") : action.label}
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
                    ${expandedMobile
                      ? "bg-[#25D366] text-white shadow-md"
                      : "text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"
                    }
                  `}
                >
                  {expandedMobile ? (
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  ) : (
                    <MoreHorizontal className="w-4 h-4" />
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
      >
        <div className="px-3 pb-3">
          <div className="grid grid-cols-3 gap-2 p-2 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
            {MOBILE_ACTIONS.map((action, idx) => {
              const Icon = action.key === "toggle"
                ? action.getIcon!(product.status || "active")
                : action.icon;
              const color = action.key === "toggle"
                ? action.getColor!(product.status || "active")
                : action.color;

              return (
                <MobileActionButton
                  key={action.key}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(action.handler, product);
                    setExpandedMobile(false);
                  }}
                  icon={Icon}
                  label={action.key === "toggle" ? action.getLabel!(product.status || "active") : action.label}
                  color={color}
                  delay={idx * 50}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricBadge({
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
}) {
  return (
    <div className={`flex items-center gap-1 text-[10px] ${color}`} title={label}>
      <Icon className={`w-3 h-3 ${fill ? "fill-current" : ""}`} />
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ActionIconButton({
  onClick,
  icon: Icon,
  color,
  label,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  color: "green" | "blue" | "amber" | "cyan" | "red";
  label: string;
}) {
  const colorMap = {
    green: "text-[#128C7E] bg-[#f0fdf4] hover:bg-[#25D366] hover:text-white border-[#25D366]/20",
    blue: "text-[#3b82f6] bg-[#eff6ff] hover:bg-[#3b82f6] hover:text-white border-[#3b82f6]/20",
    amber: "text-[#f59e0b] bg-[#fffbeb] hover:bg-[#f59e0b] hover:text-white border-[#f59e0b]/20",
    cyan: "text-[#06b6d4] bg-[#ecfeff] hover:bg-[#06b6d4] hover:text-white border-[#06b6d4]/20",
    red: "text-[#ef4444] bg-[#fef2f2] hover:bg-[#ef4444] hover:text-white border-[#ef4444]/20",
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-9 h-9 flex items-center justify-center rounded-lg border 
        transition-all duration-200 active:scale-90 ${colorMap[color]}
      `}
      title={label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function MobileActionButton({
  onClick,
  icon: Icon,
  label,
  color,
  delay = 0,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: "green" | "blue" | "amber" | "cyan" | "red";
  delay?: number;
}) {
  const colorMap = {
    green: "text-[#128C7E] bg-[#f0fdf4]",
    blue: "text-[#3b82f6] bg-[#eff6ff]",
    amber: "text-[#f59e0b] bg-[#fffbeb]",
    cyan: "text-[#06b6d4] bg-[#ecfeff]",
    red: "text-[#ef4444] bg-[#fef2f2]",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg text-xs font-semibold
        transition-all active:scale-95 ${colorMap[color]}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}

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
}: ProductListViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = useCallback(
    (handler: string, product: Product) => {
      const handlers: Record<string, (p: Product) => void> = {
        handleToggleStatus,
        handleDuplicateProduct,
        handleShareProduct,
        shareProductWhatsApp,
        printProductCatalog,
        handleDelete: () => {}, // placeholder
      };
      handlers[handler]?.(product);
    },
    [handleToggleStatus, handleDuplicateProduct, handleShareProduct, shareProductWhatsApp, printProductCatalog]
  );

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm animate-fadeIn">
      <ListHeader
        bulkMode={bulkMode}
        bulkSelected={bulkSelected}
        totalProducts={products.length}
        onSelectAll={selectAllProducts}
      />

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