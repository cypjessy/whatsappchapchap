"use client";

import { useEffect, useState, useCallback } from "react";
import { Product } from "@/lib/db";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ViewProductModalDesktopProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

// ─── Gradient pool ───────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-[#667eea] to-[#764ba2]",
  "from-[#f093fb] to-[#f5576c]",
  "from-[#4facfe] to-[#00f2fe]",
  "from-[#43e97b] to-[#38f9d7]",
  "from-[#fa709a] to-[#fee140]",
  "from-[#a18cd1] to-[#fbc2eb]",
  "from-[#fccb90] to-[#d57eeb]",
  "from-[#e0c3fc] to-[#8ec5fc]",
];

function getGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ─── Collapsible Section ─────────────────────────────────────────────────────

function CollapsibleSection({ title, icon, defaultOpen = false, accent = false, children }: {
  title: string; icon: string; defaultOpen?: boolean; accent?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${accent ? "border-indigo-200/60 bg-indigo-50 dark:bg-indigo-900/20" : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]"}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
            <i className={`fas ${icon} text-[10px] text-indigo-500`} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--md-sys-color-on-surface-variant)]">{title}</span>
        </div>
        <i className={`fas fa-chevron-down text-[10px] text-[var(--md-sys-color-outline)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color = "indigo" }: {
  icon: string; label: string; value: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500",
    emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500",
    amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-500",
    rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-500",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-500",
    violet: "bg-violet-50 dark:bg-violet-900/30 text-violet-500",
  };
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${colorMap[color] || colorMap.indigo} flex items-center justify-center`}>
        <i className={`fas ${icon} text-sm`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">{label}</p>
        <p className="text-sm font-bold text-[var(--md-sys-color-on-surface)] truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────────────────

function InfoRow({ label, value, icon, color = "indigo" }: {
  label: string; value: string | number | undefined | null; icon?: string; color?: string;
}) {
  if (!value && value !== 0) return null;
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30",
    emerald: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
    amber: "text-amber-500 bg-amber-50 dark:bg-amber-900/30",
    blue: "text-blue-500 bg-blue-50 dark:bg-blue-900/30",
    rose: "text-rose-500 bg-rose-50 dark:bg-rose-900/30",
    violet: "text-violet-500 bg-violet-50 dark:bg-violet-900/30",
  };
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
      <div className="flex items-center gap-2 min-w-0">
        {icon && <div className={`w-6 h-6 rounded-lg ${colorMap[color] || colorMap.indigo} flex items-center justify-center`}>
          <i className={`fas ${icon} text-[9px]`} />
        </div>}
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)] whitespace-nowrap">{label}</span>
      </div>
      <span className="text-xs font-bold text-[var(--md-sys-color-on-surface)] text-right ml-2">{String(value)}</span>
    </div>
  );
}

// ─── Pill Badge ──────────────────────────────────────────────────────────────

function PillBadge({ label, variant = "default" }: { label: string; variant?: "default" | "success" | "warning" | "danger" | "info" }) {
  const variants = {
    default: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]",
    success: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
    danger: "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300",
    info: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${variants[variant]}`}>{label}</span>;
}

// ─── Image Lightbox ──────────────────────────────────────────────────────────

function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-8 animate-fadeIn" onClick={onClose}>
      <button onClick={onClose} className="absolute top-6 right-6 w-14 h-14 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:rotate-90 transition-all">
        <i className="fas fa-times text-2xl" />
      </button>
      {imgErr ? (
        <div className="text-white text-center"><i className="fas fa-image text-6xl opacity-50 mb-3" /><p>Image not available</p></div>
      ) : (
        <img src={src} alt={alt} className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} onError={() => setImgErr(true)} />
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ViewProductModalDesktop({ isOpen, onClose, product, onEdit }: ViewProductModalDesktopProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imgErrors, setImgErrors] = useState<Set<number>>(new Set());

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedImage(0);
      setImgErrors(new Set());
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen, product?.id]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setIsClosing(false); onClose(); }, 200);
  }, [onClose]);

  // Computed (moved before early return so allImages is available to hooks)
  const allImages = (product?.image || product?.imageUrl || product?.images?.length)
    ? [product!.image, product!.imageUrl, ...(product!.images || [])].filter(Boolean) as string[]
    : [];

  // Keyboard shortcuts — BEFORE early return so hook order is consistent
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (lightboxOpen) setLightboxOpen(false); else handleClose(); }
      if (e.key === "ArrowLeft" && selectedImage > 0) { setSelectedImage((p) => p - 1); }
      if (e.key === "ArrowRight" && selectedImage < allImages.length - 1) { setSelectedImage((p) => p + 1); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, lightboxOpen, handleClose, selectedImage, allImages.length]);

  if (!isOpen || !product) return null;

  // Computed
  const gradient = getGradient(product.name);
  const currentImage = allImages[selectedImage] || null;
  const hasDiscount = !!(product.salePrice && product.salePrice > 0 && product.salePrice < product.price);
  const discountPercent = hasDiscount ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0;
  const profit = product.costPrice ? product.price - product.costPrice : 0;
  const profitMargin = product.costPrice && product.costPrice > 0 ? Math.round((profit / product.price) * 100) : 0;
  const stockStatus = (product.stock || 0) === 0 ? "danger" : (product.stock || 0) <= (product.lowStockAlert || 5) ? "warning" : "success";
  const stockLabel = (product.stock || 0) === 0 ? "Out of Stock" : (product.stock || 0) <= (product.lowStockAlert || 5) ? "Low Stock" : "In Stock";

  // ─── Left Column: Image Gallery ───────────────────────────────────────────
  const renderLeftColumn = () => (
    <div className="p-6 space-y-5 sticky top-0">
      {/* Main Image */}
      <div className="relative group">
        <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30 shadow-lg cursor-pointer"
          onClick={() => setLightboxOpen(true)}>
          {currentImage && !imgErrors.has(selectedImage) ? (
            <img src={currentImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgErrors((prev) => new Set(prev).add(selectedImage))} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl font-bold text-white shadow-2xl`}>
                {product.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <i className="fas fa-expand text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
        {allImages.length > 1 && (
          <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-xs font-bold rounded-full">
            {selectedImage + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-2.5">
          {allImages.map((img, idx) => (
            <button key={idx} onClick={() => { setSelectedImage(idx); setImgErrors((prev) => { const n = new Set(prev); n.delete(idx); return n; }); }}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                selectedImage === idx ? "border-indigo-500 shadow-lg scale-105" : "border-[var(--md-sys-color-outline-variant)]"
              }`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-3 pt-2">
        <button onClick={() => onEdit(product)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25 transition-all active:scale-95">
          <i className="fas fa-edit text-xs" />
          Edit Product
        </button>
      </div>
    </div>
  );

  // ─── Right Column: Product Details ─────────────────────────────────────────
  const renderRightColumn = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)]">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-bold text-white shadow-md`}>
                {product.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex items-center gap-1.5">
                <PillBadge label={stockLabel} variant={stockStatus} />
                {hasDiscount && <PillBadge label={`-${discountPercent}% OFF`} variant="warning" />}
              </div>
            </div>
            <h2 className="text-xl font-bold text-[var(--md-sys-color-on-surface)] truncate">{product.name}</h2>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            <div className="hidden lg:flex items-center gap-2 text-[10px] text-[var(--md-sys-color-outline)]">
              <kbd className="px-2 py-1 bg-[var(--md-sys-color-surface-variant)] rounded border border-[var(--md-sys-color-outline)] font-mono text-[10px] font-bold">Esc</kbd>
              <span>Close</span>
            </div>
            <button onClick={handleClose} className="w-9 h-9 rounded-full hover:bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center transition-all hover:rotate-90">
              <i className="fas fa-times text-sm text-[var(--md-sys-color-on-surface-variant)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <StatCard icon="fa-tag" label="Price" value={`KES ${product.price.toLocaleString()}`} color="indigo" />
          <StatCard icon="fa-cubes" label="Stock" value={`${product.stock || 0}`} color={stockStatus === "danger" ? "rose" : stockStatus === "warning" ? "amber" : "emerald"} />
          <StatCard icon="fa-eye" label="Views" value={`${product.views || 0}`} color="blue" />
          <StatCard icon="fa-shopping-cart" label="Orders" value={`${product.orders || 0}`} color="violet" />
        </div>

        {/* Description */}
        {product.description && (
          <CollapsibleSection title="Description" icon="fa-align-left" defaultOpen>
            <p className="text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </CollapsibleSection>
        )}

        {/* Pricing */}
        <CollapsibleSection title="Pricing" icon="fa-tag" defaultOpen accent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">Selling Price</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">KES {product.price.toLocaleString()}</span>
            </div>
            {product.salePrice && product.salePrice > 0 && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">Sale Price</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400 line-through">KES {product.salePrice.toLocaleString()}</span>
                  <PillBadge label={`-${discountPercent}%`} variant="warning" />
                </div>
              </div>
            )}
            {product.costPrice && (
              <>
                <InfoRow label="Cost Price" value={`KES ${product.costPrice.toLocaleString()}`} icon="fa-coins" color="amber" />
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">Profit</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">KES {profit.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-500 ml-1">({profitMargin}% margin)</span>
                  </div>
                </div>
              </>
            )}
            {product.taxEnabled && (
              <InfoRow label="Tax Rate" value={`${product.taxRate || 0}%`} icon="fa-receipt" color="violet" />
            )}
          </div>
        </CollapsibleSection>

        {/* Inventory */}
        <CollapsibleSection title="Inventory" icon="fa-cubes">
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  stockStatus === "danger" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-500" :
                  stockStatus === "warning" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-500" :
                  "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500"
                }`}>
                  <i className="fas fa-boxes text-xs" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)]">Current Stock</p>
                  <p className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">{product.stock || 0} units</p>
                </div>
              </div>
              <PillBadge label={stockLabel} variant={stockStatus} />
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--md-sys-color-surface-variant)] overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${
                stockStatus === "danger" ? "bg-rose-500" :
                stockStatus === "warning" ? "bg-amber-500" : "bg-emerald-500"
              }`} style={{ width: (product.stock || 0) === 0 ? "0%" : (product.stock || 0) <= (product.lowStockAlert || 5) ? "25%" : (product.stock || 0) <= 20 ? "50%" : "100%" }} />
            </div>
            {product.lowStockAlert && (
              <InfoRow label="Low Stock Alert" value={`${product.lowStockAlert} units`} icon="fa-exclamation-triangle" color="amber" />
            )}
            <InfoRow label="Total Value" value={`KES ${((product.price || 0) * (product.stock || 0)).toLocaleString()}`} icon="fa-coins" color="emerald" />
          </div>
        </CollapsibleSection>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <CollapsibleSection title="Variants" icon="fa-layer-group">
            <div className="space-y-1.5">
              {product.variants.map((v, i) => (
                <div key={v.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400">{i + 1}</span>
                    </div>
                    <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)] truncate">{Object.values(v.specs).join(" / ")}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">KES {(v.price || 0).toLocaleString()}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${(v.stock || 0) > 0 ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300"}`}>
                      {(v.stock || 0) > 0 ? `${v.stock}` : "0"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Details */}
        <CollapsibleSection title="Details" icon="fa-list">
          <div className="space-y-2">
            <InfoRow label="Category" value={product.categoryName || product.category} icon="fa-folder" color="indigo" />
            <InfoRow label="SKU" value={product.sku} icon="fa-barcode" color="amber" />
            <InfoRow label="Barcode" value={product.barcode} icon="fa-qrcode" color="blue" />
            <InfoRow label="Brand" value={product.brand} icon="fa-copyright" color="violet" />
            <InfoRow label="Condition" value={product.condition} icon="fa-star" color="emerald" />
            <InfoRow label="Status" value={product.status || "active"} icon="fa-toggle-on" color={product.status === "active" ? "emerald" : "amber"} />
            <InfoRow label="Created" value={product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"} icon="fa-calendar-alt" color="blue" />
          </div>
        </CollapsibleSection>

        {/* Dimensions & Weight */}
        {(product.weight || product.dimensions) && (
          <CollapsibleSection title="Dimensions & Weight" icon="fa-ruler">
            <div className="space-y-2">
              {product.weight && <InfoRow label="Weight" value={`${product.weight} ${product.weightUnit || "kg"}`} icon="fa-weight" color="amber" />}
              {product.dimensions && (
                <div className="grid grid-cols-3 gap-2">
                  {product.dimensions.length != null && <InfoRow label="Length" value={`${product.dimensions.length} cm`} color="blue" />}
                  {product.dimensions.width != null && <InfoRow label="Width" value={`${product.dimensions.width} cm`} color="blue" />}
                  {product.dimensions.height != null && <InfoRow label="Height" value={`${product.dimensions.height} cm`} color="blue" />}
                </div>
              )}
            </div>
          </CollapsibleSection>
        )}

        {/* Warranty */}
        {product.warranty && (
          <CollapsibleSection title="Warranty" icon="fa-shield-alt">
            <p className="text-sm text-[var(--md-sys-color-on-surface)]">{product.warranty}</p>
          </CollapsibleSection>
        )}

        {/* Shipping */}
        {product.shippingMethods && product.shippingMethods.length > 0 && (
          <CollapsibleSection title="Shipping" icon="fa-truck">
            <div className="space-y-1.5">
              {product.shippingMethods.map((s, i) => (
                <div key={s.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">{s.name}</span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">KES {(s.price || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Payment */}
        {product.paymentMethods && product.paymentMethods.length > 0 && (
          <CollapsibleSection title="Payment" icon="fa-credit-card">
            <div className="space-y-1.5">
              {product.paymentMethods.map((p, i) => (
                <div key={p.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">{p.name}</span>
                  {p.details && <span className="text-[10px] text-[var(--md-sys-color-outline)]">{p.details}</span>}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Filters / Specs */}
        {product.filters && Object.keys(product.filters).length > 0 && (
          <CollapsibleSection title="Specifications" icon="fa-cogs">
            <div className="space-y-2">
              {Object.entries(product.filters).map(([key, values]) => (
                <div key={key}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-outline)] mb-1.5">{key}</p>
                  <div className="flex flex-wrap gap-1">
                    {values.map((v: string) => (
                      <PillBadge key={v} label={v} variant="default" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </div>
    </div>
  );

  return (
    <>
      {lightboxOpen && currentImage && <ImageLightbox src={currentImage} alt={product.name} onClose={() => setLightboxOpen(false)} />}

      {/* Backdrop */}
      <div className={`fixed inset-0 z-[2000] transition-all duration-300 ${isClosing ? "opacity-0" : "opacity-100"}`} onClick={handleClose}>
        <div className={`absolute inset-0 transition-all duration-300 ${isClosing ? "bg-black/0" : "bg-black/60"}`} />
      </div>

      {/* Desktop Two-Column Modal */}
      <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 pointer-events-none">
        <div className={`w-full max-w-6xl max-h-[85vh] bg-[var(--md-sys-color-surface-container)] rounded-3xl shadow-2xl flex pointer-events-auto border border-white/10 overflow-hidden transition-all duration-300 ${
          isVisible && !isClosing ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
        }`}>
          {/* Left Column */}
          <div className="w-2/5 border-r border-[var(--md-sys-color-outline-variant)] overflow-y-auto bg-gradient-to-b from-[var(--md-sys-color-surface)] to-[var(--md-sys-color-surface-container)]">
            {renderLeftColumn()}
          </div>

          {/* Right Column */}
          <div className="flex-1 min-w-0 flex flex-col">
            {renderRightColumn()}
          </div>
        </div>
      </div>
    </>
  );
}
