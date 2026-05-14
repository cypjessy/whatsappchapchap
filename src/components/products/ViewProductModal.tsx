"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Product, defaultProductCategories } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

type TabId = "overview" | "details" | "inventory" | "specs" | "ai";

// ─── Constants ─────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "fa-eye" },
  { id: "details", label: "Details", icon: "fa-list" },
  { id: "inventory", label: "Inventory", icon: "fa-boxes" },
  { id: "specs", label: "Specs", icon: "fa-cogs" },
  { id: "ai", label: "AI Insights", icon: "fa-robot" },
];

const STOCK_CONFIG = {
  out: { text: "Out of Stock", color: "#ef4444", bg: "bg-[#ef4444]/10", dot: "bg-[#ef4444]", bar: "0%" },
  low: { text: "Low Stock", color: "#f59e0b", bg: "bg-[#f59e0b]/10", dot: "bg-[#f59e0b]", bar: "15%" },
  medium: { text: "In Stock", color: "#3b82f6", bg: "bg-[#3b82f6]/10", dot: "bg-[#3b82f6]", bar: "45%" },
  good: { text: "In Stock", color: "#10b981", bg: "bg-[#10b981]/10", dot: "bg-[#10b981]", bar: "85%" },
};

// ─── Helper Functions ──────────────────────────────────────────────────────

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

// ─── Sub-Components ────────────────────────────────────────────────────────

function ToastContainer({ toasts }: { toasts: { id: number; type: string; message: string }[] }) {
  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 min-w-[300px]
            ${toast.type === "success" ? "bg-[#10b981] text-white" : "bg-[#ef4444] text-white"}
          `}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  color = "default",
  delay = 0,
}: {
  label: string;
  value: string | number | React.ReactNode;
  subtext?: string;
  color?: "default" | "success" | "warning" | "danger";
  delay?: number;
}) {
  const colorClasses = {
    default: "from-[#f8fafc] to-[#f1f5f9] border-[#e2e8f0]",
    success: "from-[#10b981]/10 to-[#10b981]/5 border-[#10b981]/20",
    warning: "from-[#f59e0b]/10 to-[#f59e0b]/5 border-[#f59e0b]/20",
    danger: "from-[#ef4444]/10 to-[#ef4444]/5 border-[#ef4444]/20",
  };

  return (
    <div
      className={`
        bg-gradient-to-br ${colorClasses[color]} rounded-xl md:rounded-2xl p-3 md:p-5 border
      `}
    >
      <div className="text-[10px] md:text-xs font-bold text-[#64748b] uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl md:text-2xl font-extrabold text-[#1e293b]">{value}</div>
      {subtext && <div className="text-[10px] md:text-xs text-[#94a3b8] mt-1">{subtext}</div>}
    </div>
  );
}

function InfoRow({ label, value, isMono = false }: { label: string; value: React.ReactNode; isMono?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 border-b border-[#f1f5f9] last:border-0 gap-1">
      <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold text-[#1e293b] ${isMono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}

function SectionCard({
  title,
  icon,
  children,
  className = "",
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-4 md:p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4 md:mb-5">
        <div className="w-7 h-7 rounded-lg bg-[#f5f3ff] flex items-center justify-center">
          <i className={`fas ${icon} text-[#8b5cf6] text-xs`} />
        </div>
        <h3 className="font-bold text-sm md:text-base text-[#1e293b]">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative px-3 md:px-5 py-3 md:py-4 font-semibold text-xs md:text-sm
        flex items-center gap-1.5 md:gap-2 whitespace-nowrap transition-all duration-200
        ${isActive ? "text-[#8b5cf6]" : "text-[#64748b] hover:text-[#475569]"}
      `}
    >
      <i className={`fas ${tab.icon} text-[10px] md:text-xs`} />
      <span className="hidden sm:inline">{tab.label}</span>
      {isActive && (
        <div className="absolute bottom-0 left-2 right-2 h-[2px] md:h-[3px] bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-full" />
      )}
    </button>
  );
}

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
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        <i className="fas fa-times" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[85vh] object-contain rounded-lg animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ViewProductModal({ isOpen, onClose, product, onEdit }: ViewProductModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("overview");
      setSelectedImage(0);
    }
  }, [isOpen, product?.id]);

  const showToast = useCallback((type: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

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

  if (!isOpen || !product) return null;

  const stockConfig = getStockConfig(product.stock || 0, product.lowStockAlert);
  const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const discountPercent = hasDiscount ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0;

  const allImages = [product.image, ...(product.images || [])].filter(Boolean) as string[];
  const currentImage = allImages[selectedImage] || null;

  const profit = product.costPrice ? product.price - product.costPrice : 0;
  const profitMargin = product.costPrice && product.costPrice > 0 ? Math.round((profit / product.price) * 100) : 0;

  // ─── Tab Content Renderers ────────────────────────────────────────────────

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-4 md:gap-8">
      {/* Left: Image Gallery */}
      <div className="flex flex-col gap-3">
        {/* Main Image */}
        <div
          className="aspect-square bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-xl md:rounded-2xl border-2 border-[#e2e8f0] overflow-hidden relative cursor-zoom-in group shadow-sm"
          onClick={() => currentImage && setLightboxOpen(true)}
        >
          {currentImage ? (
            <>
              <img
                src={currentImage}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <i className="fas fa-expand text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl md:text-8xl opacity-30 select-none">{getCategoryEmoji(product.category || "other")}</span>
            </div>
          )}

          {hasDiscount && (
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-[#ef4444] text-white rounded-full text-xs font-bold shadow-lg">
              -{discountPercent}% OFF
            </div>
          )}

          {allImages.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white rounded-full text-[10px] font-bold">
              {selectedImage + 1} / {allImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {allImages.length > 1 && (
          <div className="grid grid-cols-5 gap-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(idx)}
                className={`
                  aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200
                  ${selectedImage === idx
                    ? "border-[#8b5cf6] ring-2 ring-[#8b5cf6]/20 shadow-md"
                    : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                  }
                `}
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Details */}
      <div className="flex flex-col gap-4 md:gap-6">
        {/* Price Section */}
        <div className="pb-4 md:pb-5 border-b border-[#e2e8f0]">
          <div className="flex items-baseline gap-3 flex-wrap mb-2">
            <span className="text-3xl md:text-4xl font-extrabold text-[#1e293b] tracking-tight">
              {formatCurrency(product.price)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-[#94a3b8] line-through font-medium">
                  {formatCurrency(product.price)}
                </span>
                <span className="px-2.5 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded-full text-xs font-bold">
                  SAVE {discountPercent}%
                </span>
              </>
            )}
          </div>

          {product.salePrice && product.salePrice > 0 && (
            <div className="text-sm font-semibold text-[#10b981] mb-1">
              Sale: {formatCurrency(product.salePrice)}
            </div>
          )}

          {product.costPrice && product.costPrice > 0 && (
            <div className="text-xs text-[#64748b]">
              Cost: {formatCurrency(product.costPrice)} • Profit: {formatCurrency(profit)} ({profitMargin}%)
            </div>
          )}

          <div className="flex items-center gap-2 mt-3">
            <span className={`w-2 h-2 rounded-full ${stockConfig.dot}`} />
            <span className="text-xs font-semibold" style={{ color: stockConfig.color }}>
              {stockConfig.text} • {product.stock || 0} units
            </span>
          </div>
        </div>

        {/* Stock Bar */}
        <div className="pb-4 md:pb-5 border-b border-[#e2e8f0]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider">Stock Level</span>
            <span className="text-xs font-bold text-[#1e293b]">{product.stock || 0}</span>
          </div>
          <div className="h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${stockConfig.dot}`}
              style={{ width: stockConfig.bar, opacity: 0.7 }}
            />
          </div>
          {product.lowStockAlert && product.lowStockAlert > 0 && (
            <p className="text-[10px] text-[#94a3b8] mt-1.5">
              Alert at {product.lowStockAlert} units
            </p>
          )}
        </div>

        {/* Description */}
        <div className="pb-4 md:pb-5 border-b border-[#e2e8f0]">
          <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-2">Description</div>
          <p className="text-sm text-[#64748b] leading-relaxed whitespace-pre-wrap">
            {product.description || "No description provided. Add a compelling description to boost sales."}
          </p>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3 md:p-4 border border-[#e2e8f0]">
            <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">Category</div>
            <div className="font-bold text-sm text-[#1e293b] capitalize">{product.category || "Uncategorized"}</div>
          </div>
          {product.brand && (
            <div className="bg-white rounded-xl p-3 md:p-4 border border-[#e2e8f0]">
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">Brand</div>
              <div className="font-bold text-sm text-[#1e293b]">{product.brand}</div>
            </div>
          )}
          {product.condition && product.condition !== "new" && (
            <div className="bg-white rounded-xl p-3 md:p-4 border border-[#e2e8f0]">
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">Condition</div>
              <div className="font-bold text-sm text-[#1e293b] capitalize">{product.condition}</div>
            </div>
          )}
          {product.weight && (
            <div className="bg-white rounded-xl p-3 md:p-4 border border-[#e2e8f0]">
              <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">Weight</div>
              <div className="font-bold text-sm text-[#1e293b]">{product.weight} {product.weightUnit || "kg"}</div>
            </div>
          )}
        </div>

        {/* Colors & Sizes */}
        {(product.filters?.colors?.length || product.filters?.sizes?.length) ? (
          <div className="space-y-3">
            {product.filters?.colors && product.filters.colors.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-2">Colors</div>
                <div className="flex flex-wrap gap-1.5">
                  {product.filters.colors.map((color, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#f1f5f9] rounded-full text-xs font-semibold text-[#475569] border border-[#e2e8f0]">
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {product.filters?.sizes && product.filters.sizes.length > 0 && (
              <div>
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-2">Sizes</div>
                <div className="flex flex-wrap gap-1.5">
                  {product.filters.sizes.map((size, i) => (
                    <span key={i} className="px-2.5 py-1 bg-[#f1f5f9] rounded-full text-xs font-semibold text-[#475569] border border-[#e2e8f0]">
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Basic Info" icon="fa-info-circle">
          <InfoRow label="Product Name" value={product.name} />
          <InfoRow label="Category" value={<span className="capitalize">{product.category || "Uncategorized"}</span>} />
          <InfoRow label="Status" value={<span className="capitalize">{product.status || "active"}</span>} />
          <InfoRow label="SKU" value={product.sku || "Not set"} isMono />
        </SectionCard>

        <SectionCard title="Pricing" icon="fa-dollar-sign">
          <InfoRow label="Regular Price" value={formatCurrency(product.price)} />
          {product.salePrice && product.salePrice > 0 && (
            <InfoRow label="Sale Price" value={<span className="text-[#10b981]">{formatCurrency(product.salePrice)}</span>} />
          )}
          {product.costPrice && product.costPrice > 0 && (
            <>
              <InfoRow label="Cost Price" value={formatCurrency(product.costPrice)} />
              <InfoRow label="Profit" value={`${formatCurrency(profit)} (${profitMargin}%)`} />
            </>
          )}
          {product.taxEnabled && product.taxRate && (
            <InfoRow label="Tax Rate" value={`${product.taxRate}%`} />
          )}
        </SectionCard>

        <SectionCard title="Inventory" icon="fa-boxes">
          <InfoRow label="Current Stock" value={`${product.stock || 0} units`} />
          <InfoRow label="Low Alert" value={`${product.lowStockAlert || 5} units`} />
          <InfoRow label="SKU" value={product.sku || "N/A"} isMono />
          {product.barcode && <InfoRow label="Barcode" value={product.barcode} isMono />}
        </SectionCard>
      </div>

      {/* Filters/Specs */}
      {product.filters && Object.keys(product.filters).length > 0 && (
        <SectionCard title="Specifications" icon="fa-cogs" className="bg-gradient-to-br from-[#ede9fe]/30 to-[#f5f3ff]/30">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(product.filters).map(([key, value]) => (
              <div key={key} className="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase mb-1">{key.replace(/_/g, " ")}</div>
                <div className="font-bold text-sm text-[#1e293b]">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Record Info */}
      <SectionCard title="Record Information" icon="fa-clock">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <InfoRow label="Product ID" value={product.id} isMono />
          <InfoRow
            label="Created"
            value={product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : "Unknown"}
          />
          <InfoRow
            label="Updated"
            value={product.updatedAt?.toDate ? product.updatedAt.toDate().toLocaleDateString() : "Unknown"}
          />
        </div>
      </SectionCard>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Stock" value={product.stock || 0} subtext="units available" color={stockConfig.color === "#ef4444" ? "danger" : stockConfig.color === "#f59e0b" ? "warning" : "success"} delay={0} />
        <StatCard label="Low Alert" value={product.lowStockAlert || 5} subtext="threshold" delay={100} />
        <StatCard label="SKU" value={product.sku || "N/A"} delay={200} />
        <StatCard label="Status" value={<span className="capitalize">{product.status || "active"}</span>} delay={300} />
      </div>

      <SectionCard title="Stock History" icon="fa-chart-line">
        <div className="flex items-center justify-center py-12 text-[#94a3b8]">
          <div className="text-center">
            <i className="fas fa-chart-area text-4xl mb-3 opacity-30" />
            <p className="text-sm font-medium">Stock history chart coming soon</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Pricing Breakdown" icon="fa-calculator">
          <InfoRow label="Regular Price" value={formatCurrency(product.price)} />
          {product.salePrice && product.salePrice > 0 && (
            <InfoRow label="Sale Price" value={formatCurrency(product.salePrice)} />
          )}
          {product.costPrice && product.costPrice > 0 && (
            <>
              <InfoRow label="Cost Price" value={formatCurrency(product.costPrice)} />
              <div className="mt-3 p-3 bg-white rounded-lg border border-[#e2e8f0]">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#64748b]">Profit Margin</span>
                  <span className="text-lg font-extrabold text-[#10b981]">{profitMargin}%</span>
                </div>
                <div className="h-1.5 bg-[#e2e8f0] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${Math.min(profitMargin, 100)}%` }} />
                </div>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="Tax Settings" icon="fa-receipt">
          <InfoRow label="Tax Enabled" value={product.taxEnabled ? "Yes" : "No"} />
          {product.taxEnabled && product.taxRate && (
            <InfoRow label="Tax Rate" value={`${product.taxRate}%`} />
          )}
        </SectionCard>
      </div>
    </div>
  );

  const renderSpecs = () => (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {product.brand && (
          <StatCard label="Brand" value={product.brand} delay={0} />
        )}
        {product.condition && (
          <StatCard label="Condition" value={<span className="capitalize">{product.condition}</span>} delay={100} />
        )}
        {product.weight && (
          <StatCard label="Weight" value={`${product.weight} ${product.weightUnit || "kg"}`} delay={200} />
        )}
      </div>

      {product.filters && Object.keys(product.filters).length > 0 && (
        <SectionCard title="All Specifications" icon="fa-clipboard-list" className="bg-gradient-to-br from-[#ede9fe]/20 to-[#f5f3ff]/20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {Object.entries(product.filters).map(([key, value], idx) => (
              <div
                key={key}
                className="bg-white rounded-xl p-3 md:p-4 border border-[#e2e8f0] hover:shadow-sm hover:border-[#cbd5e1]"
              >
                <div className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wider mb-1">{key.replace(/_/g, " ")}</div>
                <div className="font-bold text-sm text-[#1e293b]">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Record Information" icon="fa-database">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Product ID" value={product.id} isMono />
          <InfoRow label="Created" value={product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : "Unknown"} />
          <InfoRow label="Updated" value={product.updatedAt?.toDate ? product.updatedAt.toDate().toLocaleDateString() : "Unknown"} />
        </div>
      </SectionCard>
    </div>
  );

  const renderAI = () => {
    const completenessScore = (() => {
      let score = 0;
      const checks = [
        product.name,
        product.description,
        product.price,
        product.category,
        product.brand,
        product.sku,
        product.stock !== undefined,
        product.image,
      ];
      return checks.filter(Boolean).length;
    })();

    return (
      <div className="space-y-4 md:space-y-6">
        {/* AI Header */}
        <div className="bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] rounded-xl md:rounded-2xl p-4 md:p-6 border border-[#8b5cf6]/20">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white text-xl shadow-lg shadow-[#8b5cf6]/20">
              <i className="fas fa-robot" />
            </div>
            <div>
              <h3 className="font-bold text-[#1e293b] text-base md:text-lg">AI Product Analysis</h3>
              <p className="text-xs md:text-sm text-[#64748b]">Insights based on your product data</p>
            </div>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {/* Stock Insight */}
          <div className="bg-white rounded-xl p-4 md:p-5 border border-[#e2e8f0] flex items-start gap-3 transition-all hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stockConfig.bg}`}>
              <i className={`fas fa-boxes ${stockConfig.dot.replace("bg-", "text-")}`} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#1e293b]">
                {stockConfig.text === "Out of Stock" ? "⚠️ Restock Needed" : stockConfig.text === "Low Stock" ? "📦 Consider Restocking" : "✅ Stock Levels Good"}
              </div>
              <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                {stockConfig.text === "Out of Stock"
                  ? `This product is currently out of stock.`
                  : stockConfig.text === "Low Stock"
                    ? `Only ${product.stock || 0} units left. Consider restocking soon.`
                    : `Stock levels are healthy with ${product.stock || 0} units available.`}
              </p>
            </div>
          </div>

          {/* Pricing Insight */}
          {product.costPrice && product.costPrice > 0 && (
            <div className="bg-white rounded-xl p-4 md:p-5 border border-[#e2e8f0] flex items-start gap-3 transition-all hover:shadow-md">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center shrink-0">
                <i className="fas fa-dollar-sign text-[#3b82f6]" />
              </div>
              <div>
                <div className="font-bold text-sm text-[#1e293b]">Pricing Analysis</div>
                <p className="text-xs text-[#64748b] mt-1">
                  Profit margin: {formatCurrency(profit)} ({profitMargin}% markup)
                </p>
              </div>
            </div>
          )}

          {/* Description Insight */}
          <div className="bg-white rounded-xl p-4 md:p-5 border border-[#e2e8f0] flex items-start gap-3 transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center shrink-0">
              <i className="fas fa-align-left text-[#8b5cf6]" />
            </div>
            <div>
              <div className="font-bold text-sm text-[#1e293b]">Description Status</div>
              <p className="text-xs text-[#64748b] mt-1">
                {product.description && product.description.length > 50
                  ? `✓ Good description (${product.description.length} chars)`
                  : "⚠️ Consider adding a more detailed description"}
              </p>
            </div>
          </div>

          {/* Completeness */}
          <div className="bg-white rounded-xl p-4 md:p-5 border border-[#e2e8f0] flex items-start gap-3 transition-all hover:shadow-md">
            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 flex items-center justify-center shrink-0">
              <i className="fas fa-check-circle text-[#f59e0b]" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm text-[#1e293b]">Product Completeness</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f59e0b] to-[#10b981] rounded-full transition-all duration-1000"
                    style={{ width: `${(completenessScore / 8) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-[#1e293b]">{completenessScore}/8</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Link */}
        <SectionCard title="Order Page Link" icon="fa-link">
          <p className="text-xs text-[#64748b] mb-3">Share this link with customers on WhatsApp.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              readOnly
              value={product.orderLink || ""}
              className="flex-1 px-4 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm bg-white text-[#64748b]"
              placeholder="Link will appear after saving"
            />
            <div className="flex gap-2">
              <button
                onClick={() => product.orderLink && copyToClipboard(product.orderLink, "Link copied!")}
                disabled={!product.orderLink}
                className="px-4 py-3 bg-[#8b5cf6] text-white rounded-xl font-semibold text-sm hover:bg-[#7c3aed] transition-all disabled:opacity-50 active:scale-95 flex items-center gap-2"
              >
                <i className="fas fa-copy text-xs" />
                Copy
              </button>
              {product.orderLink && (
                <a
                  href={product.orderLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-[#1e293b] text-white rounded-xl font-semibold text-sm hover:bg-[#0f172a] transition-all active:scale-95 flex items-center gap-2"
                >
                  <i className="fas fa-external-link-alt text-xs" />
                  Open
                </a>
              )}
            </div>
          </div>
        </SectionCard>
      </div>
    );
  };

  const tabContent: Record<TabId, () => React.ReactNode> = {
    overview: renderOverview,
    details: renderDetails,
    inventory: renderInventory,
    specs: renderSpecs,
    ai: renderAI,
  };

  return (
    <>
      <div
        className={`
          fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-y-auto
        `}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-sm" onClick={handleClose} />

        {/* Modal */}
        <div
          className={`
            relative bg-white w-full max-w-sm md:max-w-2xl lg:max-w-[1100px] max-h-[90vh] md:max-h-[90vh]
            rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div className="md:hidden w-10 h-1 bg-[#e2e8f0] rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-[#e2e8f0] bg-gradient-to-r from-[#f8fafc] to-[#f5f3ff] shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Breadcrumb */}
                <div className="hidden md:flex items-center gap-1.5 text-xs text-[#94a3b8] mb-1">
                  <span className="font-medium">Products</span>
                  <i className="fas fa-chevron-right text-[8px]" />
                  <span className="font-medium capitalize">{product.category || "Uncategorized"}</span>
                  <i className="fas fa-chevron-right text-[8px]" />
                  <span className="truncate">{product.name}</span>
                </div>
                <h1 className="text-base md:text-xl font-extrabold text-[#1e293b] flex items-center gap-2 flex-wrap">
                  <span className="truncate">{product.name}</span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border shrink-0
                    ${stockConfig.bg} border-current/20
                  `} style={{ color: stockConfig.color }}>
                    {stockConfig.text}
                  </span>
                  {product.status === "draft" && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#f1f5f9] text-[#64748b] border border-[#e2e8f0] shrink-0">
                      Draft
                    </span>
                  )}
                </h1>
              </div>

              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <button
                  onClick={() => copyToClipboard(window.location.href, "Share link copied!")}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#8b5cf6] transition-all"
                  title="Share"
                >
                  <i className="fas fa-share-alt text-sm" />
                </button>
                <button
                  onClick={() => showToast("success", "Product duplicated")}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#8b5cf6] transition-all"
                  title="Duplicate"
                >
                  <i className="fas fa-copy text-sm" />
                </button>
                <button
                  onClick={() => onEdit(product)}
                  className="px-3 md:px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-95"
                >
                  <i className="fas fa-edit text-xs" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-all"
                >
                  <i className="fas fa-times text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#e2e8f0] px-2 md:px-6 overflow-x-auto scrollbar-hide shrink-0 bg-white">
            {TABS.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-white/50">
            {tabContent[activeTab]()}
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
      <ToastContainer toasts={toasts} />
    </>
  );
}