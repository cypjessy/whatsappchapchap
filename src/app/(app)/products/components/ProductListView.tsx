"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";

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
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());

  const isAllSelected = bulkSelected.length === products.length && products.length > 0;
  const isPartialSelected = bulkSelected.length > 0 && !isAllSelected;
  const CheckboxIcon = isAllSelected ? CheckSquare : isPartialSelected ? MinusSquare : Square;

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

  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#f8fafc] border-b-2 border-[#e2e8f0]">
        <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center">
          {/* Bulk checkbox */}
          {bulkMode && (
            <button
              onClick={selectAllProducts}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[#e2e8f0] transition-colors"
              aria-label={isAllSelected ? "Deselect all" : "Select all"}
            >
              <CheckboxIcon
                className={`w-5 h-5 transition-all ${bulkSelected.length > 0 ? "text-[#25D366]" : "text-[#cbd5e1]"}`}
                strokeWidth={bulkSelected.length > 0 ? 2.5 : 2}
              />
            </button>
          )}

          {/* Column headers (desktop only) */}
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

          {/* Mobile header info */}
          {!bulkMode && (
            <div className="md:hidden flex items-center justify-between flex-1">
              <span className="text-xs font-semibold text-[#64748b]">
                {products.length} {products.length === 1 ? "product" : "products"}
              </span>
            </div>
          )}
          {bulkMode && (
            <div className="md:hidden flex items-center gap-2">
              <span className="text-xs font-semibold text-[#64748b]">
                {bulkSelected.length} selected
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#e2e8f0]">
        {products.map((product, idx) => {
          const stockStyle = getStockStyle(product.stock || 0);
          const isSelected = bulkSelected.includes(product.id);
          const isExpanded = expandedRow === product.id;
          const hasImage = product.image || product.imageUrl;
          const isImageLoading = imageLoading.has(product.id);

          return (
            <div
              key={product.id}
              className={`
                group transition-all duration-200
                ${isSelected ? "bg-[#f0fdf4]" : "hover:bg-[#f8fafc]"}
              `}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              {/* Main row */}
              <div
                className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_60px_2fr_1fr_1fr_1fr_1fr] gap-3 md:gap-4 p-3 md:p-4 items-center cursor-pointer"
                onClick={() => !bulkMode && openProductModal(product)}
              >
                {/* Checkbox */}
                {bulkMode && (
                  <div
                    className="flex items-center justify-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBulkSelect(product.id);
                    }}
                  >
                    <div
                      className={`
                        w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer
                        ${isSelected
                          ? "bg-[#25D366] border-[#25D366] text-white shadow-sm"
                          : "border-[#e2e8f0] hover:border-[#25D366] bg-white"
                        }
                      `}
                    >
                      {isSelected && <CheckSquare className="w-4 h-4" />}
                    </div>
                  </div>
                )}

                {/* Image */}
                <div
                  className={`
                    relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0
                    ${!hasImage ? `bg-gradient-to-br ${getCategoryColor(product.category || "")}` : ""}
                  `}
                >
                  {hasImage ? (
                    <>
                      {isImageLoading && (
                        <div className="absolute inset-0 bg-[#f8fafc] flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-[#25D366] animate-spin" />
                        </div>
                      )}
                      <img
                        src={product.image || product.imageUrl}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-opacity ${isImageLoading ? "opacity-0" : "opacity-100"}`}
                        onLoad={() => handleImageLoad(product.id)}
                        onError={() => handleImageLoad(product.id)}
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
                    <h3 className="font-bold text-sm text-[#1e293b] truncate group-hover:text-[#128C7E] transition-colors">
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
                    <span className="text-[10px] text-[#94a3b8] font-mono">SKU: {product.id.slice(0, 8)}</span>
                    {/* Mobile metrics */}
                    <div className="flex md:hidden items-center gap-2">
                      {(product.views || 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#64748b]">
                          <Eye className="w-3 h-3" />
                          {product.views}
                        </span>
                      )}
                      {(product.orders || 0) > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#64748b]">
                          <ShoppingCart className="w-3 h-3" />
                          {product.orders}
                        </span>
                      )}
                      {product.rating && product.rating > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-[#f59e0b]">
                          <Star className="w-3 h-3 fill-current" />
                          {product.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Desktop metrics */}
                  <div className="hidden md:flex items-center gap-3 mt-1.5">
                    {(product.views || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-[#64748b]" title="Views">
                        <Eye className="w-3 h-3" />
                        {product.views}
                      </span>
                    )}
                    {(product.orders || 0) > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-[#64748b]" title="Orders">
                        <ShoppingCart className="w-3 h-3" />
                        {product.orders}
                      </span>
                    )}
                    {product.rating && product.rating > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-[#f59e0b]" title="Rating">
                        <Star className="w-3 h-3 fill-current" />
                        {product.rating.toFixed(1)}
                      </span>
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
                  {product.salePrice && product.salePrice > product.price && (
                    <div className="text-[10px] text-[#94a3b8] line-through">
                      {formatCurrency(product.salePrice)}
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
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: stockStyle.width, backgroundColor: stockStyle.color }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 md:gap-2 justify-end">
                  {!bulkMode && (
                    <>
                      {/* Desktop actions */}
                      <div className="hidden md:flex items-center gap-1.5">
                        <ActionIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStatus(product);
                          }}
                          icon={product.status === "active" ? Pause : Play}
                          color={product.status === "active" ? "amber" : "green"}
                          label={product.status === "active" ? "Pause" : "Activate"}
                        />
                        <ActionIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateProduct(product);
                          }}
                          icon={Copy}
                          color="blue"
                          label="Duplicate"
                        />
                        <ActionIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareProduct(product);
                          }}
                          icon={Share2}
                          color="green"
                          label="Share"
                        />
                        <ActionIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            shareProductWhatsApp(product);
                          }}
                          icon={MessageCircle}
                          color="green"
                          label="WhatsApp"
                        />
                        <ActionIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            printProductCatalog(product);
                          }}
                          icon={Printer}
                          color="cyan"
                          label="Print"
                        />
                        <ActionIconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            // handleDeleteProduct(product);
                          }}
                          icon={Trash2}
                          color="red"
                          label="Delete"
                        />
                      </div>

                      {/* Mobile: Expand actions */}
                      <div className="md:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedRow(isExpanded ? null : product.id);
                          }}
                          className={`
                            w-8 h-8 flex items-center justify-center rounded-lg transition-all
                            ${isExpanded ? "bg-[#25D366] text-white" : "text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#64748b]"}
                          `}
                        >
                          {isExpanded ? <ChevronRight className="w-4 h-4 rotate-90" /> : <MoreHorizontal className="w-4 h-4" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Mobile expanded actions */}
              {isExpanded && !bulkMode && (
                <div className="md:hidden px-3 pb-3 animate-fadeIn">
                  <div className="grid grid-cols-3 gap-2 p-2 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                    <MobileActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(product);
                        setExpandedRow(null);
                      }}
                      icon={product.status === "active" ? Pause : Play}
                      label={product.status === "active" ? "Pause" : "Activate"}
                      color={product.status === "active" ? "amber" : "green"}
                    />
                    <MobileActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProduct(product);
                        setExpandedRow(null);
                      }}
                      icon={Copy}
                      label="Duplicate"
                      color="blue"
                    />
                    <MobileActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareProduct(product);
                        setExpandedRow(null);
                      }}
                      icon={Share2}
                      label="Share"
                      color="green"
                    />
                    <MobileActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        shareProductWhatsApp(product);
                        setExpandedRow(null);
                      }}
                      icon={MessageCircle}
                      label="WhatsApp"
                      color="green"
                    />
                    <MobileActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        printProductCatalog(product);
                        setExpandedRow(null);
                      }}
                      icon={Printer}
                      label="Print"
                      color="cyan"
                    />
                    <MobileActionButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRow(null);
                      }}
                      icon={Trash2}
                      label="Delete"
                      color="red"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Desktop action icon button
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
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

// Mobile action button
function MobileActionButton({
  onClick,
  icon: Icon,
  label,
  color,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ElementType;
  label: string;
  color: "green" | "blue" | "amber" | "cyan" | "red";
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
    >
      <Icon className="w-4 h-4" />
      <span className="text-[10px]">{label}</span>
    </button>
  );
}