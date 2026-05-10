"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
}

// ─── Constants ─────────────────────────────────────────────────────────────

const ACTION_CONFIG = [
  {
    key: "toggle",
    getIcon: (status: string) => (status === "active" ? Pause : Play),
    getLabel: (status: string) => (status === "active" ? "Pause" : "Activate"),
    getColor: (status: string): "green" | "amber" => (status === "active" ? "amber" : "green"),
    handler: "handleToggleStatus",
  },
  {
    key: "duplicate",
    icon: Copy,
    label: "Copy",
    color: "blue" as const,
    handler: "handleDuplicateProduct",
  },
  {
    key: "share",
    icon: Share2,
    label: "Share",
    color: "green" as const,
    handler: "handleShareProduct",
  },
  {
    key: "whatsapp",
    icon: MessageCircle,
    label: "WhatsApp",
    color: "green" as const,
    handler: "shareProductWhatsApp",
  },
  {
    key: "print",
    icon: Printer,
    label: "Print",
    color: "blue" as const,
    handler: "printProductCatalog",
  },
] as const;

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ShimmerCard() {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden">
      <div className="relative h-36 sm:h-40 md:h-48 bg-[#f8fafc] overflow-hidden">
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
}

function BulkHeader({
  bulkSelected,
  totalProducts,
  onSelectAll,
}: {
  bulkSelected: string[];
  totalProducts: number;
  onSelectAll: () => void;
}) {
  const isAllSelected = bulkSelected.length === totalProducts && totalProducts > 0;
  const isPartialSelected = bulkSelected.length > 0 && !isAllSelected;

  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

  return (
    <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-[#f8fafc] to-white p-3.5 md:p-4 rounded-xl md:rounded-2xl border border-[#e2e8f0] shadow-sm animate-fadeIn">
      <button
        onClick={onSelectAll}
        className="flex items-center gap-2.5 group transition-all active:scale-95"
      >
        <CheckboxIcon
          className={`w-5 h-5 transition-all duration-200 ${
            bulkSelected.length > 0
              ? "text-[#25D366]"
              : "text-[#cbd5e1] group-hover:text-[#94a3b8]"
          }`}
          strokeWidth={bulkSelected.length > 0 ? 2.5 : 2}
        />
        <span className="text-sm font-semibold text-[#64748b]">
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
        <div className="text-xs text-[#94a3b8] font-medium">
          {Math.round((bulkSelected.length / totalProducts) * 100)}%
        </div>
      )}
    </div>
  );
}

function ProductCard({
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
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState(false);

  const stockStyle = getStockStyle(product.stock || 0);
  const badgeInfo = getBadgeStyle(product.stock || 0);
  const hasImage = (product.image || product.imageUrl) && !imageError;
  const isOnSale = product.salePrice && product.salePrice > (product.price || 0);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  return (
    <div
      className={`
        group relative bg-white rounded-xl md:rounded-2xl border overflow-hidden 
        transition-all duration-200 ease-out
        ${isSelected
          ? "border-[#25D366] ring-2 ring-[#25D366]/20 shadow-lg shadow-[#25D366]/10"
          : "border-[#e2e8f0] hover:border-[#25D366]/30 hover:shadow-xl hover:-translate-y-1"
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => !bulkMode && onOpenModal(product)}
    >
      {/* Image section */}
      <div
        className={`
          relative h-36 sm:h-40 md:h-48 overflow-hidden
          ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(product.category || "")}` : "bg-[#f8fafc]"}
        `}
      >
        {/* Bulk checkbox overlay */}
        {bulkMode && (
          <div
            className="absolute top-3 left-3 z-20"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(product.id);
            }}
          >
            <div
              className={`
                w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200
                ${isSelected
                  ? "bg-[#25D366] border-[#25D366] text-white shadow-lg shadow-[#25D366]/30"
                  : "bg-white/90 backdrop-blur-sm border-[#e2e8f0] hover:border-[#25D366] hover:shadow-md"
                }
              `}
            >
              {isSelected && <CheckSquare className="w-4 h-4" strokeWidth={2.5} />}
            </div>
          </div>
        )}

        {/* Stock badge */}
        {!bulkMode && badgeInfo.badge !== "new" && (
          <span
            className={`
              absolute top-3 left-3 z-10 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm
              ${badgeInfo.badge === "out" ? "bg-[#64748b] text-white" : "bg-[#f59e0b] text-white"}
            `}
          >
            {badgeInfo.label}
          </span>
        )}

        {/* Status badge */}
        {!bulkMode && product.status && product.status !== "active" && (
          <span
            className={`
              absolute top-3 right-3 z-10 px-2 md:px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-sm backdrop-blur-sm
              ${product.status === "paused" ? "bg-[#f59e0b]/90 text-white" : "bg-[#64748b]/90 text-white"}
            `}
          >
            {product.status}
          </span>
        )}

        {/* Image or emoji */}
        {hasImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-[#25D366] animate-spin" />
              </div>
            )}
            <img
              src={product.image || product.imageUrl}
              alt={product.name}
              className={`
                w-full h-full object-cover transition-transform duration-500
                ${imageLoaded ? "opacity-100" : "opacity-0"}
                ${isHovered ? "scale-110" : "scale-100"}
              `}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading="lazy"
            />
            {/* Hover overlay */}
            <div
              className={`
                absolute inset-0 bg-black/0 transition-all duration-300
                flex items-center justify-center
                ${isHovered ? "bg-black/10" : "bg-black/0"}
              `}
            >
              <div
                className={`
                  w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg
                  transition-all duration-300
                  ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"}
                `}
              >
                <ArrowUpRight className="w-5 h-5 text-[#25D366]" />
              </div>
            </div>
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
          <span className="text-[10px] md:text-xs font-bold text-[#25D366] uppercase tracking-wider truncate">
            {product.category || "Uncategorized"}
          </span>
          {product.sku && (
            <span className="text-[9px] text-[#94a3b8] font-mono truncate">
              #{product.sku}
            </span>
          )}
        </div>

        {/* Name */}
        <h3
          className={`
            font-bold text-sm md:text-base text-[#1e293b] mb-2 line-clamp-2 leading-snug
            transition-colors duration-200
            ${isHovered ? "text-[#128C7E]" : "text-[#1e293b]"}
          `}
        >
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2 md:mb-3">
          <span className="text-lg md:text-xl font-extrabold text-[#1e293b]">
            {formatCurrency(product.price)}
          </span>
          {isOnSale && (
            <span className="text-xs text-[#94a3b8] line-through font-medium">
              {formatCurrency(product.salePrice!)}
            </span>
          )}
          {isOnSale && (
            <span className="text-[10px] font-bold text-[#ef4444] bg-[#ef4444]/10 px-1.5 py-0.5 rounded">
              SALE
            </span>
          )}
        </div>

        {/* Stock & metrics */}
        <div className="pt-2 md:pt-3 border-t border-[#e2e8f0]">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[#64748b] mb-1">
                <Package className="w-3 h-3 shrink-0" />
                <span className="truncate">{product.stock || 0} in stock</span>
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
            <div className="relative pt-2 border-t border-[#e2e8f0]">
              {/* Desktop: Full actions */}
              <div className="hidden sm:grid grid-cols-5 gap-1">
                {ACTION_CONFIG.map((action) => {
                  const Icon = action.key === "toggle"
                    ? action.getIcon!(product.status || "active")
                    : action.icon;
                  const label = action.key === "toggle"
                    ? action.getLabel!(product.status || "active")
                    : action.label;
                  const color = action.key === "toggle"
                    ? action.getColor!(product.status || "active")
                    : action.color;

                  return (
                    <ActionButton
                      key={action.key}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction(action.handler, product);
                      }}
                      icon={Icon}
                      label={label}
                      color={color}
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
                      : "text-[#64748b] hover:text-[#128C7E] hover:bg-[#f8fafc]"
                    }
                  `}
                >
                  <MoreHorizontal className="w-4 h-4" />
                  <span>{expandedMobile ? "Less" : "Actions"}</span>
                  <ChevronDown
                    className={`
                      w-3 h-3 transition-transform duration-200
                      ${expandedMobile ? "rotate-180" : "rotate-0"}
                    `}
                  />
                </button>

                <div
                  className={`
                    overflow-hidden transition-all duration-300 ease-out
                    ${expandedMobile ? "max-h-[300px] opacity-100 mt-1.5" : "max-h-0 opacity-0 mt-0"}
                  `}
                >
                  <div className="grid grid-cols-2 gap-1.5">
                    {ACTION_CONFIG.map((action, idx) => {
                      const Icon = action.key === "toggle"
                        ? action.getIcon!(product.status || "active")
                        : action.icon;
                      const label = action.key === "toggle"
                        ? action.getLabel!(product.status || "active")
                        : action.label;
                      const color = action.key === "toggle"
                        ? action.getColor!(product.status || "active")
                        : action.color;

                      return (
                        <MobileActionButton
                          key={action.key}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAction(action.handler, product);
                          }}
                          icon={Icon}
                          label={label}
                          color={color}
                          delay={idx * 50}
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
    <div
      className={`flex items-center gap-1 text-[10px] md:text-xs ${color}`}
      title={label}
    >
      <Icon className={`w-3 h-3 ${fill ? "fill-current" : ""}`} />
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  label,
  color,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: "green" | "blue" | "amber";
}) {
  const colorMap = {
    green: "hover:text-[#128C7E] hover:bg-[#f0fdf4]",
    blue: "hover:text-[#3b82f6] hover:bg-[#eff6ff]",
    amber: "hover:text-[#f59e0b] hover:bg-[#fffbeb]",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[#64748b] 
        transition-all duration-200 active:scale-90 ${colorMap[color]}
      `}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-semibold truncate w-full text-center">{label}</span>
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
  color: "green" | "blue" | "amber";
  delay?: number;
}) {
  const colorMap = {
    green: "text-[#128C7E] bg-[#f0fdf4] border-[#25D366]/20",
    blue: "text-[#3b82f6] bg-[#eff6ff] border-[#3b82f6]/20",
    amber: "text-[#f59e0b] bg-[#fffbeb] border-[#f59e0b]/20",
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold
        border transition-all active:scale-95 ${colorMap[color]}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
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
}: ProductGridViewProps) {
  const [expandedActions, setExpandedActions] = useState<string | null>(null);

  const handleAction = useCallback(
    (handler: string, product: Product) => {
      const handlers: Record<string, (p: Product) => void> = {
        handleToggleStatus,
        handleDuplicateProduct,
        handleShareProduct,
        shareProductWhatsApp,
        printProductCatalog,
      };
      handlers[handler]?.(product);
    },
    [handleToggleStatus, handleDuplicateProduct, handleShareProduct, shareProductWhatsApp, printProductCatalog]
  );

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm animate-fadeIn">
      {/* Bulk selection header */}
      {bulkMode && (
        <div className="p-3 md:p-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
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