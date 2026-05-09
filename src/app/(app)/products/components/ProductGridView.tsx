"use client";

import { useState, useCallback } from "react";
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
  ArrowUpRight,
  TrendingUp,
  Package,
  Loader2,
} from "lucide-react";

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
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());

  const isAllSelected = bulkSelected.length === products.length && products.length > 0;
  const isPartialSelected = bulkSelected.length > 0 && !isAllSelected;

  const handleImageLoad = useCallback((productId: string) => {
    setImageLoading((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const handleImageStart = useCallback((productId: string) => {
    setImageLoading((prev) => new Set(prev).add(productId));
  }, []);

  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

  if (products.length === 0) return null;

  return (
    <div className="animate-fadeIn">
      {/* Bulk selection header */}
      {bulkMode && (
        <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0] animate-fadeIn">
          <button
            onClick={selectAllProducts}
            className="flex items-center gap-2.5 group transition-all"
          >
            <CheckboxIcon
              className={`w-5 h-5 transition-all duration-200 ${
                bulkSelected.length > 0 ? "text-[#25D366]" : "text-[#cbd5e1] group-hover:text-[#94a3b8]"
              }`}
              strokeWidth={bulkSelected.length > 0 ? 2.5 : 2}
            />
            <span className="text-sm font-semibold text-[#64748b]">
              {bulkSelected.length > 0 ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] px-1.5 py-0.5 rounded-full bg-[#25D366] text-white text-[10px] font-bold">
                    {bulkSelected.length}
                  </span>
                  <span>selected of {products.length}</span>
                </span>
              ) : (
                <span>Select all ({products.length})</span>
              )}
            </span>
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-5">
        {products.map((product, idx) => {
          const stockStyle = getStockStyle(product.stock || 0);
          const badgeInfo = getBadgeStyle(product.stock || 0);
          const isSelected = bulkSelected.includes(product.id);
          const isExpanded = expandedActions === product.id;
          const hasImage = product.image || product.imageUrl;
          const isImageLoading = imageLoading.has(product.id);

          return (
            <div
              key={product.id}
              className={`
                group relative bg-white rounded-xl md:rounded-2xl border overflow-hidden 
                transition-all duration-300 ease-out cursor-pointer
                ${isSelected
                  ? "border-[#25D366] ring-2 ring-[#25D366]/20 shadow-lg shadow-[#25D366]/10"
                  : "border-[#e2e8f0] hover:border-[#25D366]/30 hover:shadow-xl hover:-translate-y-1"
                }
              `}
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => !bulkMode && openProductModal(product)}
            >
              {/* Image section */}
              <div
                className={`
                  relative h-36 sm:h-40 md:h-48 overflow-hidden
                  ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(product.category || "")}` : ""}
                `}
              >
                {/* Bulk checkbox overlay */}
                {bulkMode && (
                  <div
                    className="absolute top-3 left-3 z-20"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBulkSelect(product.id);
                    }}
                  >
                    <div
                      className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                        ${isSelected
                          ? "bg-[#25D366] border-[#25D366] text-white shadow-lg"
                          : "bg-white/90 backdrop-blur-sm border-[#e2e8f0] hover:border-[#25D366]"
                        }
                      `}
                    >
                      {isSelected && <CheckSquare className="w-4 h-4" />}
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
                    {isImageLoading && (
                      <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#25D366] animate-spin" />
                      </div>
                    )}
                    <img
                      src={product.image || product.imageUrl}
                      alt={product.name}
                      className={`
                        w-full h-full object-cover transition-transform duration-500 group-hover:scale-110
                        ${isImageLoading ? "opacity-0" : "opacity-100"}
                      `}
                      onLoad={() => handleImageLoad(product.id)}
                      onError={() => handleImageLoad(product.id)}
                      loading="lazy"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform duration-300">
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
                </div>

                {/* Name */}
                <h3 className="font-bold text-sm md:text-base text-[#1e293b] mb-2 line-clamp-2 leading-snug group-hover:text-[#128C7E] transition-colors">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2 md:mb-3">
                  <span className="text-lg md:text-xl font-extrabold text-[#1e293b]">
                    {formatCurrency(product.price)}
                  </span>
                  {product.salePrice && product.salePrice > product.price && (
                    <span className="text-xs text-[#94a3b8] line-through">
                      {formatCurrency(product.salePrice)}
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
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: stockStyle.width,
                            backgroundColor: stockStyle.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Metrics */}
                    {!bulkMode && (
                      <div className="flex items-center gap-2.5 shrink-0 ml-2">
                        {(product.views || 0) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] md:text-xs text-[#64748b]" title="Views">
                            <Eye className="w-3 h-3" />
                            <span className="font-medium">{product.views}</span>
                          </div>
                        )}
                        {(product.orders || 0) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] md:text-xs text-[#64748b]" title="Orders">
                            <ShoppingCart className="w-3 h-3" />
                            <span className="font-medium">{product.orders}</span>
                          </div>
                        )}
                        {product.rating && product.rating > 0 && (
                          <div className="flex items-center gap-1 text-[10px] md:text-xs text-[#f59e0b]" title="Rating">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="font-medium">{product.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  {!bulkMode && (
                    <div className="relative pt-2 border-t border-[#e2e8f0]">
                      {/* Desktop: Full actions */}
                      <div className="hidden sm:grid grid-cols-5 gap-1">
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(product);
                          }}
                          icon={product.status === "active" ? Pause : Play}
                          label={product.status === "active" ? "Pause" : "Activate"}
                          color={product.status === "active" ? "amber" : "green"}
                        />
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateProduct(product);
                          }}
                          icon={Copy}
                          label="Copy"
                          color="blue"
                        />
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareProduct(product);
                          }}
                          icon={Share2}
                          label="Share"
                          color="green"
                        />
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            shareProductWhatsApp(product);
                          }}
                          icon={MessageCircle}
                          label="WhatsApp"
                          color="green"
                        />
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            printProductCatalog(product);
                          }}
                          icon={Printer}
                          label="Print"
                          color="blue"
                        />
                      </div>

                      {/* Mobile: Expandable actions */}
                      <div className="sm:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedActions(isExpanded ? null : product.id);
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-[#64748b] hover:text-[#128C7E] hover:bg-[#f8fafc] rounded-lg transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                          <span>{isExpanded ? "Less" : "Actions"}</span>
                        </button>

                        {isExpanded && (
                          <div className="grid grid-cols-2 gap-1.5 mt-1.5 animate-fadeIn">
                            <MobileActionButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(product);
                              }}
                              icon={product.status === "active" ? Pause : Play}
                              label={product.status === "active" ? "Pause" : "Activate"}
                              color={product.status === "active" ? "amber" : "green"}
                            />
                            <MobileActionButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicateProduct(product);
                              }}
                              icon={Copy}
                              label="Duplicate"
                              color="blue"
                            />
                            <MobileActionButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShareProduct(product);
                              }}
                              icon={Share2}
                              label="Share"
                              color="green"
                            />
                            <MobileActionButton
                              onClick={(e) => {
                                e.stopPropagation();
                                shareProductWhatsApp(product);
                              }}
                              icon={MessageCircle}
                              label="WhatsApp"
                              color="green"
                            />
                            <MobileActionButton
                              onClick={(e) => {
                                e.stopPropagation();
                                printProductCatalog(product);
                              }}
                              icon={Printer}
                              label="Print"
                              color="blue"
                              fullWidth
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Desktop action button
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
        transition-all duration-200 active:scale-95 ${colorMap[color]}
      `}
      title={label}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-semibold truncate w-full text-center">{label}</span>
    </button>
  );
}

// Mobile action button
function MobileActionButton({
  onClick,
  icon: Icon,
  label,
  color,
  fullWidth,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: "green" | "blue" | "amber";
  fullWidth?: boolean;
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
        border transition-all active:scale-95 ${colorMap[color]} ${fullWidth ? "col-span-2" : ""}
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}