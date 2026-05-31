"use client";

import { useEffect, useState, useCallback } from "react";
import { Product } from "@/lib/db";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ViewProductModalProps {
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
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3.5 text-left">
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
    <div className="fixed inset-0 z-[3000] bg-black/90 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 hover:rotate-90 transition-all">
        <i className="fas fa-times" />
      </button>
      {imgErr ? (
        <div className="text-white text-center"><i className="fas fa-image text-6xl opacity-50 mb-3" /><p>Image not available</p></div>
      ) : (
        <img src={src} alt={alt} className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()} onError={() => setImgErr(true)} />
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ViewProductModal({ isOpen, onClose, product, onEdit }: ViewProductModalProps) {
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

  // Keyboard + outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { if (lightboxOpen) setLightboxOpen(false); else handleClose(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, lightboxOpen, handleClose]);

  if (!isOpen || !product) return null;

  // Computed
  const gradient = getGradient(product.name);
  const allImages = [product.image, product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];
  const currentImage = allImages[selectedImage] || null;
  const hasDiscount = !!(product.salePrice && product.salePrice > 0 && product.salePrice < product.price);
  const discountPercent = hasDiscount ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0;
  const profit = product.costPrice ? product.price - product.costPrice : 0;
  const profitMargin = product.costPrice && product.costPrice > 0 ? Math.round((profit / product.price) * 100) : 0;
  const stockStatus = (product.stock || 0) === 0 ? "danger" : (product.stock || 0) <= (product.lowStockAlert || 5) ? "warning" : "success";
  const stockLabel = (product.stock || 0) === 0 ? "Out of Stock" : (product.stock || 0) <= (product.lowStockAlert || 5) ? "Low Stock" : "In Stock";

  const renderSection = (sectionTitle: string, sectionIcon: string, children: React.ReactNode, defaultOpen?: boolean, accent?: boolean) => (
    <CollapsibleSection title={sectionTitle} icon={sectionIcon} defaultOpen={defaultOpen} accent={accent}>
      {children}
    </CollapsibleSection>
  );

  return (
    <>
      {lightboxOpen && currentImage && <ImageLightbox src={currentImage} alt={product.name} onClose={() => setLightboxOpen(false)} />}

      <div className={`fixed inset-0 z-[2000] flex items-start md:items-center justify-center p-0 md:p-4 overflow-y-auto transition-all duration-200 ${isVisible && !isClosing ? "opacity-100" : "opacity-0"}`} onClick={handleClose}>
        <div className="absolute inset-0 bg-black/60" />

        <div className={`relative w-full max-w-lg bg-[var(--md-sys-color-surface-container)] rounded-t-3xl md:rounded-3xl shadow-2xl border border-white/10 flex flex-col max-h-[92vh] overflow-hidden transition-all duration-300 ${isVisible && !isClosing ? "translate-y-0 md:scale-100" : "translate-y-12 md:scale-[0.97]"}`}
          onClick={(e) => e.stopPropagation()}>

          {/* ─── Hero Header ────────────────────────────────────────────── */}
          <div className="relative shrink-0 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-6 -right-6 text-7xl text-white/20">✦</div>
              <div className="absolute bottom-2 left-2 text-3xl text-white/20">✦</div>
              <div className="absolute top-4 right-16 text-2xl text-white/20">✦</div>
            </div>

            <div className="relative px-5 pt-5 pb-4">
              {/* Close button */}
              <button onClick={handleClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/30 hover:rotate-90 transition-all z-10">
                <i className="fas fa-times text-xs" />
              </button>

              {/* Avatar + Name */}
              <div className="flex items-center gap-4">
                <div className="relative group shrink-0">
                  <div className="absolute -inset-1.5 rounded-full bg-white/20 blur-md opacity-50" />
                  <div className={`relative w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xl font-bold text-white shadow-lg`}>
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-white truncate">{product.name}</h2>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-bold text-white/90">KES {product.price.toLocaleString()}</span>
                    {hasDiscount && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/80 text-white">
                        -{discountPercent}% OFF
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${
                      stockStatus === "danger" ? "bg-rose-500/60" : stockStatus === "warning" ? "bg-amber-500/60" : "bg-emerald-500/60"
                    }`}>
                      <i className="fas fa-box mr-1 text-[8px]" />{stockLabel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Scrollable Body ────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard icon="fa-tag" label="Price" value={`KES ${product.price.toLocaleString()}`} color="indigo" />
              <StatCard icon="fa-cubes" label="Stock" value={`${product.stock || 0} units`} color={stockStatus === "danger" ? "rose" : stockStatus === "warning" ? "amber" : "emerald"} />
              <StatCard icon="fa-eye" label="Views" value={`${product.views || 0}`} color="blue" />
              <StatCard icon="fa-shopping-cart" label="Orders" value={`${product.orders || 0}`} color="violet" />
            </div>

            {/* Images Gallery */}
            {allImages.length > 0 && renderSection("Images", "fa-image", (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden group cursor-pointer bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/30" onClick={() => setLightboxOpen(true)}>
                  {currentImage && !imgErrors.has(selectedImage) ? (
                    <img src={currentImage} alt={product.name} className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                      onError={() => setImgErrors((prev) => new Set(prev).add(selectedImage))} />
                  ) : (
                    <div className="w-full h-48 flex items-center justify-center">
                      <span className="text-5xl opacity-20">📦</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <i className="fas fa-expand text-white text-sm" />
                    </div>
                  </div>
                  {allImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/60 text-white text-[10px] font-bold rounded-full">
                      {selectedImage + 1} / {allImages.length}
                    </div>
                  )}
                </div>
                {allImages.length > 1 && (
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                      <button key={idx} onClick={() => { setSelectedImage(idx); setImgErrors((prev) => { const n = new Set(prev); n.delete(idx); return n; }); }}
                        className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? "border-indigo-500 shadow-md" : "border-transparent opacity-60 hover:opacity-100"}`}>
                        <img src={img} alt="" className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ), true, false)}

            {/* Description */}
            {product.description && renderSection("Description", "fa-align-left", (
              <p className="text-sm text-[var(--md-sys-color-on-surface)] leading-relaxed whitespace-pre-wrap">{product.description}</p>
            ), true, false)}

            {/* Pricing */}
            {renderSection("Pricing", "fa-tag", (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30">
                  <span className="text-xs font-bold text-[var(--md-sys-color-outline)] uppercase tracking-wider">Selling Price</span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">KES {product.price.toLocaleString()}</span>
                </div>
                {product.salePrice && product.salePrice > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                    <span className="text-xs font-bold text-[var(--md-sys-color-outline)] uppercase tracking-wider">Sale Price</span>
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
                      <span className="text-xs font-bold text-[var(--md-sys-color-outline)] uppercase tracking-wider">Profit</span>
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
            ), true, true)}

            {/* Inventory */}
            {renderSection("Inventory", "fa-cubes", (
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
            ), false, false)}

            {/* Variants */}
            {product.variants && product.variants.length > 0 && renderSection("Variants", "fa-layer-group", (
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
            ), false, false)}

            {/* Details */}
            {renderSection("Details", "fa-list", (
              <div className="space-y-2">
                <InfoRow label="Category" value={product.categoryName || product.category} icon="fa-folder" color="indigo" />
                <InfoRow label="SKU" value={product.sku} icon="fa-barcode" color="amber" />
                <InfoRow label="Barcode" value={product.barcode} icon="fa-qrcode" color="blue" />
                <InfoRow label="Brand" value={product.brand} icon="fa-copyright" color="violet" />
                <InfoRow label="Condition" value={product.condition} icon="fa-star" color="emerald" />
                <InfoRow label="Status" value={product.status || "active"} icon="fa-toggle-on" color={product.status === "active" ? "emerald" : "amber"} />
                <InfoRow label="Created" value={product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : product.createdAt ? new Date(product.createdAt).toLocaleDateString() : "N/A"} icon="fa-calendar-alt" color="blue" />
              </div>
            ), false, false)}

            {/* Dimensions & Weight */}
            {(product.weight || product.dimensions) && renderSection("Dimensions & Weight", "fa-ruler", (
              <div className="space-y-2">
                {product.weight && (
                  <InfoRow label="Weight" value={`${product.weight} ${product.weightUnit || "kg"}`} icon="fa-weight" color="amber" />
                )}
                {product.dimensions && (
                  <div className="grid grid-cols-3 gap-2">
                    {product.dimensions.length ? <InfoRow label="Length" value={`${product.dimensions.length} cm`} color="blue" /> : null}
                    {product.dimensions.width ? <InfoRow label="Width" value={`${product.dimensions.width} cm`} color="blue" /> : null}
                    {product.dimensions.height ? <InfoRow label="Height" value={`${product.dimensions.height} cm`} color="blue" /> : null}
                  </div>
                )}
              </div>
            ), false, false)}

            {/* Warranty */}
            {product.warranty && renderSection("Warranty", "fa-shield-alt", (
              <p className="text-sm text-[var(--md-sys-color-on-surface)]">{product.warranty}</p>
            ), false, false)}

            {/* Shipping Methods */}
            {product.shippingMethods && product.shippingMethods.length > 0 && renderSection("Shipping", "fa-truck", (
              <div className="space-y-1.5">
                {product.shippingMethods.map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                    <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">{s.name}</span>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">KES {(s.price || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ), false, false)}

            {/* Payment Methods */}
            {product.paymentMethods && product.paymentMethods.length > 0 && renderSection("Payment", "fa-credit-card", (
              <div className="space-y-1.5">
                {product.paymentMethods.map((p, i) => (
                  <div key={p.id || i} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                    <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">{p.name}</span>
                    {p.details && <span className="text-[10px] text-[var(--md-sys-color-outline)]">{p.details}</span>}
                  </div>
                ))}
              </div>
            ), false, false)}

            {/* Filters / Specs */}
            {product.filters && Object.keys(product.filters).length > 0 && renderSection("Specifications", "fa-cogs", (
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
            ), false, false)}
          </div>

          {/* ─── Floating Action Bar ─────────────────────────────────────── */}
          <div className="shrink-0 px-5 py-3 border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] rounded-b-3xl">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onEdit(product)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25 transition-all active:scale-95">
                <i className="fas fa-edit text-xs" />
                Edit
              </button>
              <button onClick={handleClose}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-[var(--md-sys-color-on-surface-variant)] bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)]/80 transition-all active:scale-95">
                <i className="fas fa-times text-xs" />
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
