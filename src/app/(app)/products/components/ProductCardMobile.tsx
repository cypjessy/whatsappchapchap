"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  Trash2,
  MoreHorizontal,
  Package,
  ChevronDown,
  CheckSquare,
  Square,
  ImageOff,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductCardMobileProps {
  product: Product;
  onOpenModal: (product: Product) => void;
  handleToggleStatus: (product: Product) => void;
  handleDuplicateProduct: (product: Product) => void;
  handleShareProduct: (product: Product) => void;
  shareProductWhatsApp: (product: Product) => void;
  printProductCatalog: (product: Product) => void;
  handleDeleteProduct: (productId: string) => void;
  getCategoryEmoji: (category: string) => string;
  getCategoryColor: (category: string) => string;
  getStockStyle: (stock: number) => { color: string; width: string };
  getBadgeStyle: (stock: number) => { badge: string; label: string };
  index: number;
  bulkMode?: boolean;
  isSelected?: boolean;
  toggleBulkSelect?: (id: string) => void;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ActionChipButton({
  icon: Icon,
  label,
  color,
  onClick,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  color: string;
  onClick: (e: React.MouseEvent) => void;
  loading?: boolean;
}) {
  return (
    <button
      className={`flex-1 min-w-0 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${color} hover:shadow-sm`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? (
        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductCardMobile({
  product,
  onOpenModal,
  handleToggleStatus,
  handleDuplicateProduct,
  handleShareProduct,
  shareProductWhatsApp,
  printProductCatalog,
  handleDeleteProduct,
  getCategoryEmoji,
  getCategoryColor,
  getStockStyle,
  getBadgeStyle,
  index,
  bulkMode = false,
  isSelected = false,
  toggleBulkSelect,
}: ProductCardMobileProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const stock = Math.max(0, product.stock || 0);
  const stockStyle = getStockStyle(stock);
  const badgeInfo = getBadgeStyle(stock);
  const hasImage = (product.image || product.imageUrl) && !imageError;
  const category = product.category || "Uncategorized";
  const isOnSale = product.salePrice && product.salePrice > 0 && product.salePrice < (product.price || 0);
  const discountPercent = isOnSale && product.price ? Math.round(((product.price - product.salePrice!) / product.price) * 100) : 0;
  const status = product.status || "active";
  const accentColor = stockStyle.color;
  const views = product.views || 0;
  const orders = product.orders || 0;
  const rating = product.rating;

  const runAction = useCallback(
    async (actionName: string, handler: () => Promise<void> | void) => {
      setLoadingAction(actionName);
      try {
        await handler();
      } finally {
        setLoadingAction(null);
        setShowDropdown(false);
      }
    },
    []
  );

  const handleCardClick = useCallback(() => {
    if (!bulkMode) onOpenModal(product);
  }, [bulkMode, product, onOpenModal]);

  const handleBulkToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleBulkSelect?.(product.id);
    },
    [toggleBulkSelect, product.id]
  );

  return (
    <div
      ref={cardRef}
      className={`group relative bg-surface rounded-2xl border-2 border-outline shadow-md overflow-hidden transition-all duration-300 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      } ${isSelected ? "ring-2 ring-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/10 border-[#8b5cf6]/30" : ""}`}
      style={{ transitionDelay: `${index * 60}ms` }}
      onClick={handleCardClick}
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: accentColor }}
      />

      <div className="pl-4 pr-3 py-3">
        {/* Header: Product Name + Category + Status */}
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm text-on-surface truncate max-w-[180px]">
                {product.name}
              </span>
              {badgeInfo.badge !== "new" && (
                <span
                  className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    badgeInfo.badge === "out"
                      ? "bg-red-50 text-red-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {badgeInfo.label}
                </span>
              )}
              {status === "paused" && (
                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-50 text-amber-600">
                  Paused
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-on-surface-variant">
              <span>{getCategoryEmoji(category)}</span>
              <span className="truncate">{category}</span>
            </div>
          </div>

          {/* Bulk checkbox */}
          {bulkMode ? (
            <div onClick={handleBulkToggle} className="shrink-0">
              <div
                className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? "bg-[#8b5cf6] border-[#8b5cf6] text-white shadow-md"
                    : "bg-surface border-outline-variant hover:border-[#8b5cf6]"
                }`}
              >
                {isSelected && <CheckSquare className="w-4 h-4" strokeWidth={2.5} />}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 shrink-0">
              {isOnSale && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600">
                  -{discountPercent}%
                </span>
              )}
              {/* Three-dot menu */}
              <div className="relative">
                <button
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-variant transition-colors duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDropdown(!showDropdown);
                  }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                {showDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 bg-surface border-2 border-outline rounded-xl shadow-xl z-20 w-48 overflow-hidden animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {status !== "draft" && (
                      <button
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-lowest"
                        onClick={() => runAction("duplicate", () => handleDuplicateProduct(product))}
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                    )}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-lowest"
                      onClick={() => runAction("print", () => printProductCatalog(product))}
                    >
                      <Printer className="w-4 h-4" />
                      Print Catalog
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container-lowest"
                      onClick={() => runAction("share", () => handleShareProduct(product))}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    <div className="border-t border-outline-variant" />
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50"
                      onClick={() => runAction("delete", () => handleDeleteProduct(product.id))}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Product
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Image + Details */}
        <div className="flex items-start gap-3 mb-3">
          {/* Thumbnail */}
          <div
            className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 shadow-sm ${
              !hasImage
                ? `bg-gradient-to-br ${getCategoryColor(category)}`
                : "bg-surface-variant"
            }`}
          >
            {hasImage ? (
              <img
                src={product.image || product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">
                {getCategoryEmoji(category)}
              </div>
            )}
          </div>

          {/* Price + Stock */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-on-surface">
                {formatCurrency(product.price)}
              </span>
              {isOnSale && (
                <span className="text-sm text-outline line-through font-normal">
                  {formatCurrency(product.salePrice!)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Package className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="text-xs font-semibold" style={{ color: accentColor }}>
                {stock.toLocaleString()} in stock
              </span>
            </div>
            <div className="w-full max-w-[120px] h-1.5 bg-surface-variant rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: stockStyle.width, backgroundColor: stockStyle.color }}
              />
            </div>
          </div>
        </div>

        {/* Metrics + SKU */}
        {(views > 0 || orders > 0 || (rating && rating > 0) || product.sku) && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {views > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-variant text-[10px] font-medium text-on-surface-variant">
                <Eye className="w-3 h-3" />
                <span>{views > 999 ? `${(views / 1000).toFixed(1)}k` : views}</span>
              </div>
            )}
            {orders > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-variant text-[10px] font-medium text-on-surface-variant">
                <ShoppingCart className="w-3 h-3" />
                <span>{orders > 999 ? `${(orders / 1000).toFixed(1)}k` : orders}</span>
              </div>
            )}
            {rating && rating > 0 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-[10px] font-medium text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
            {product.sku && (
              <span className="text-[10px] font-mono text-outline px-2 py-0.5 rounded-lg bg-surface-variant">
                #{product.sku}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-outline-variant">
          {/* Toggle Status */}
          <ActionChipButton
            icon={status === "active" ? Pause : Play}
            label={status === "active" ? "Pause" : "Activate"}
            color={status === "active" ? "bg-amber-50 text-amber-600 border-amber-200/50" : "bg-green-50 text-green-600 border-green-200/50"}
            onClick={(e) => { e.stopPropagation(); runAction("toggle", () => handleToggleStatus(product)); }}
            loading={loadingAction === "toggle"}
          />

          {/* WhatsApp (only if active & in stock) */}
          {status === "active" && stock > 0 && (
            <ActionChipButton
              icon={MessageCircle}
              label="WhatsApp"
              color="bg-[#f0fdf4] text-[#128C7E] border-[#25D366]/20"
              onClick={(e) => { e.stopPropagation(); runAction("whatsapp", () => shareProductWhatsApp(product)); }}
              loading={loadingAction === "whatsapp"}
            />
          )}

          {/* Share (only if active) */}
          {status === "active" && (
            <ActionChipButton
              icon={Share2}
              label="Share"
              color="bg-blue-50 text-blue-600 border-blue-200/50"
              onClick={(e) => { e.stopPropagation(); runAction("share", () => handleShareProduct(product)); }}
              loading={loadingAction === "share"}
            />
          )}
        </div>
      </div>
    </div>
  );
}
