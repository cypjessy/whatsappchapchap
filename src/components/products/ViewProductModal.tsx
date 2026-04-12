"use client";

import { useState } from "react";
import { Product, defaultProductCategories } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onEdit: (product: Product) => void;
}

export default function ViewProductModal({ isOpen, onClose, product, onEdit }: ViewProductModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "details" | "inventory" | "specs" | "ai">("overview");
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);

  if (!isOpen || !product) return null;

  const showToast = (type: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: "Out of Stock", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
    if (stock <= 5) return { text: "Low Stock", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
    return { text: "In Stock", color: "#10b981", bg: "rgba(37, 211, 102, 0.1)" };
  };

  const getStockBar = (stock: number) => {
    if (stock === 0) return "0%";
    if (stock <= 5) return "15%";
    if (stock <= 20) return "45%";
    return "85%";
  };

  const getCategoryEmoji = (category: string) => {
    const found = defaultProductCategories.find(c => c.id === category);
    return found?.icon || "📦";
  };

  const stockStatus = getStockStatus(product.stock || 0);
  const hasDiscount = product.salePrice && product.salePrice > 0 && product.salePrice < product.price;
  const discount = hasDiscount ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0;

  return (
    <>
      <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-[24px] w-full max-w-[1100px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)]">
            <div>
              <div className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
                <span className="text-[#25D366] font-semibold">Products</span>
                <i className="fas fa-chevron-right text-xs"></i>
                <span className="text-[#25D366] font-semibold capitalize">{product.category || "Uncategorized"}</span>
                <i className="fas fa-chevron-right text-xs"></i>
                <span>{product.name}</span>
              </div>
              <h1 className="text-xl font-extrabold text-[#1e293b] flex items-center gap-3 flex-wrap">
                {product.name}
                <span className="px-3 py-1.5 rounded-[20px] text-xs font-bold uppercase" style={{ background: stockStatus.bg, color: stockStatus.color }}>
                  {stockStatus.text}
                </span>
                {product.status === "draft" && (
                  <span className="px-3 py-1.5 rounded-[20px] text-xs font-bold uppercase bg-[#f8fafc] text-[#64748b]">
                    Draft
                  </span>
                )}
              </h1>
            </div>
            <div className="flex gap-3">
              <button className="w-11 h-11 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-full" onClick={() => showToast("success", "Share link copied!")} title="Share">
                <i className="fas fa-share-alt"></i>
              </button>
              <button className="w-11 h-11 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-full" onClick={() => showToast("success", "Product duplicated")} title="Duplicate">
                <i className="fas fa-copy"></i>
              </button>
              <button className="px-4 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-[12px] font-semibold text-sm shadow-lg flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={() => onEdit(product)}>
                <i className="fas fa-edit"></i>
                Edit Product
              </button>
              <button className="w-11 h-11 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-full transition-all" onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#e2e8f0] px-6">
            {[
              { id: "overview", label: "Overview", icon: "fa-eye" },
              { id: "details", label: "Details", icon: "fa-list" },
              { id: "inventory", label: "Inventory", icon: "fa-boxes" },
              { id: "specs", label: "Specifications", icon: "fa-cogs" },
              { id: "ai", label: "AI Insights", icon: "fa-robot" },
            ].map(tab => (
              <button
                key={tab.id}
                className={`px-5 py-4 font-semibold text-sm border-b-3 transition-all flex items-center gap-2 ${activeTab === tab.id ? "text-[#25D366] border-[#25D366]" : "text-[#64748b] border-transparent hover:text-[#1e293b]"}`}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-[1fr_1.2fr] gap-8">
                {/* Left: Image */}
                <div className="flex flex-col gap-4">
                  <div className="aspect-square bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-[16px] flex items-center justify-center text-[8rem] relative border-2 border-[#e2e8f0] overflow-hidden">
                    {(product.images && product.images.length > 0) || product.image ? (
                      <img 
                        src={(product.images && product.images[selectedImage]) || product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      getCategoryEmoji(product.category || "other")
                    )}
                    {hasDiscount && (
                      <span className="absolute top-4 left-4 px-4 py-2 bg-[#ef4444] text-white rounded-[20px] text-sm font-bold">-{discount}% OFF</span>
                    )}
                  </div>
                  {(product.images && product.images.length > 1) || product.image ? (
                    <div className="flex gap-3">
                      {product.image && (
                        <button 
                          className={`w-20 h-20 rounded-[12px] border-2 flex items-center justify-center bg-[#f8fafc] overflow-hidden ${selectedImage === -1 ? "border-[#25D366]" : "border-[#e2e8f0]"}`}
                          onClick={() => setSelectedImage(-1)}
                        >
                          <img src={product.image} alt="Main" className="w-full h-full object-cover rounded-[10px]" />
                        </button>
                      )}
                      {product.images?.map((img, idx) => (
                        <button 
                          key={idx}
                          className={`w-20 h-20 rounded-[12px] border-2 flex items-center justify-center bg-[#f8fafc] overflow-hidden ${selectedImage === idx ? "border-[#25D366]" : "border-[#e2e8f0]"}`}
                          onClick={() => setSelectedImage(idx)}
                        >
                          <img src={img} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover rounded-[10px]" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <button 
                          key={i}
                          className={`w-20 h-20 rounded-[12px] border-2 cursor-pointer flex items-center justify-center text-3xl bg-[#f8fafc] transition-all hover:border-[#25D366] hover:scale-105 ${selectedImage === i ? "border-[#25D366]" : "border-[#e2e8f0]"}`}
                          onClick={() => setSelectedImage(i)}
                        >
                          {i === 3 ? <i className="fas fa-plus text-[#64748b] text-xl"></i> : getCategoryEmoji(product.category || "other")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Details */}
                <div className="flex flex-col gap-5">
                  {/* Price Section */}
                  <div className="pb-5 border-b border-[#e2e8f0]">
                    <div className="flex items-baseline gap-4 mb-2 flex-wrap">
                      <span className="text-5xl font-extrabold text-[#1e293b]">{formatCurrency(product.price)}</span>
                      {hasDiscount && (
                        <>
                          <span className="text-xl text-[#64748b] line-through">{formatCurrency(product.price)}</span>
                          <span className="px-3 py-1.5 bg-[#ef4444] text-white rounded-[20px] text-sm font-bold">SAVE {discount}%</span>
                        </>
                      )}
                    </div>
                    {product.salePrice && product.salePrice > 0 && (
                      <div className="text-lg font-semibold text-[#10b981] mb-2">
                        Sale Price: {formatCurrency(product.salePrice)}
                      </div>
                    )}
                    {product.costPrice && product.costPrice > 0 && (
                      <div className="text-sm text-[#64748b]">
                        Cost: {formatCurrency(product.costPrice)} • Profit: {formatCurrency(product.price - product.costPrice)}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-3" style={{ color: stockStatus.color }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stockStatus.color }}></span>
                      <span className="font-semibold">{stockStatus.text} • {product.stock || 0} units available</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="pb-5 border-b border-[#e2e8f0]">
                    <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-4">Stock Level</div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-3 bg-[#e2e8f0] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: getStockBar(product.stock || 0), backgroundColor: stockStatus.color }}></div>
                      </div>
                      <span className="font-bold text-[#1e293b]">{product.stock || 0}</span>
                    </div>
                    {product.lowStockAlert && product.lowStockAlert > 0 && (
                      <div className="text-sm text-[#64748b] mt-2">
                        Low stock alert at {product.lowStockAlert} units
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="pb-5 border-b border-[#e2e8f0]">
                    <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-4">Description</div>
                    <p className="text-[#64748b] leading-relaxed whitespace-pre-wrap">
                      {product.description || "No description provided. Add a compelling description to boost sales on WhatsApp."}
                    </p>
                  </div>

                  {/* Colors & Sizes */}
                  {(product.filters?.colors && product.filters.colors.length > 0) || (product.filters?.sizes && product.filters.sizes.length > 0) ? (
                    <div className="pb-5 border-b border-[#e2e8f0]">
                      {product.filters?.colors && product.filters.colors.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-bold text-[#64748b] uppercase mb-2">Colors</div>
                          <div className="flex flex-wrap gap-2">
                            {product.filters.colors.map((color, i) => (
                              <span key={i} className="px-3 py-1.5 bg-[#f0f2f5] rounded-full text-sm font-semibold capitalize">{color}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.filters?.sizes && product.filters.sizes.length > 0 && (
                        <div className="mb-4">
                          <div className="text-xs font-bold text-[#64748b] uppercase mb-2">Sizes</div>
                          <div className="flex flex-wrap gap-2">
                            {product.filters.sizes.map((size, i) => (
                              <span key={i} className="px-3 py-1.5 bg-[#f0f2f5] rounded-full text-sm font-semibold">{size}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f8fafc] rounded-[12px] p-4">
                      <div className="text-xs text-[#64748b] font-semibold">Category</div>
                      <div className="font-bold text-[#1e293b] capitalize">{product.category || "Uncategorized"}</div>
                    </div>
                    {product.brand && (
                      <div className="bg-[#f8fafc] rounded-[12px] p-4">
                        <div className="text-xs text-[#64748b] font-semibold">Brand</div>
                        <div className="font-bold text-[#1e293b]">{product.brand}</div>
                      </div>
                    )}
                    {product.condition && product.condition !== "new" && (
                      <div className="bg-[#f8fafc] rounded-[12px] p-4">
                        <div className="text-xs text-[#64748b] font-semibold">Condition</div>
                        <div className="font-bold text-[#1e293b] capitalize">{product.condition}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)] rounded-[20px] p-6 border border-[rgba(37,211,102,0.15)]">
                  <h3 className="font-bold text-[#1e293b] text-lg mb-5 flex items-center gap-2">
                    <i className="fas fa-info-circle text-[#25D366]"></i>
                    All Product Details
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Basic Info */}
                    <div className="bg-white rounded-[12px] p-4 border border-[#e2e8f0]">
                      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Basic Info</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-[#94a3b8]">Product Name</div>
                          <div className="font-semibold text-[#1e293b]">{product.name}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#94a3b8]">Description</div>
                          <div className="text-sm text-[#64748b]">{product.description || "No description"}</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#94a3b8]">Category</div>
                          <div className="font-semibold text-[#1e293b] capitalize">{product.category || "Uncategorized"}</div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="bg-white rounded-[12px] p-4 border border-[#e2e8f0]">
                      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Pricing</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-[#94a3b8]">Regular Price</div>
                          <div className="font-bold text-lg text-[#1e293b]">{formatCurrency(product.price)}</div>
                        </div>
                        {product.salePrice && product.salePrice > 0 && (
                          <div>
                            <div className="text-xs text-[#94a3b8]">Sale Price</div>
                            <div className="font-bold text-lg text-[#10b981]">{formatCurrency(product.salePrice)}</div>
                          </div>
                        )}
                        {product.costPrice && product.costPrice > 0 && (
                          <div>
                            <div className="text-xs text-[#94a3b8]">Cost Price</div>
                            <div className="font-semibold text-[#64748b]">{formatCurrency(product.costPrice)}</div>
                            <div className="text-xs text-[#10b981]">
                              Profit: {formatCurrency(product.price - product.costPrice)} ({Math.round(((product.price - product.costPrice) / product.price) * 100)}%)
                            </div>
                          </div>
                        )}
                        {product.taxEnabled && product.taxRate && product.taxRate > 0 && (
                          <div>
                            <div className="text-xs text-[#94a3b8]">Tax Rate</div>
                            <div className="font-semibold text-[#1e293b]">{product.taxRate}%</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inventory */}
                    <div className="bg-white rounded-[12px] p-4 border border-[#e2e8f0]">
                      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Inventory</div>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-[#94a3b8]">Current Stock</div>
                          <div className="font-bold text-lg text-[#1e293b]">{product.stock || 0} units</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#94a3b8]">Low Stock Alert</div>
                          <div className="font-semibold text-[#1e293b]">{product.lowStockAlert || 5} units</div>
                        </div>
                        <div>
                          <div className="text-xs text-[#94a3b8]">SKU</div>
                          <div className="font-mono text-sm text-[#1e293b]">{product.sku || "Not set"}</div>
                        </div>
                        {product.barcode && (
                          <div>
                            <div className="text-xs text-[#94a3b8]">Barcode</div>
                            <div className="font-mono text-sm text-[#1e293b]">{product.barcode}</div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs text-[#94a3b8]">Status</div>
                          <div className="font-semibold text-[#1e293b] capitalize">{product.status || "active"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-4">
                    {/* Brand & Condition */}
                    {product.brand && (
                      <div className="bg-white rounded-[12px] p-4 border border-[#e2e8f0]">
                        <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-2">Brand</div>
                        <div className="font-semibold text-[#1e293b]">{product.brand}</div>
                      </div>
                    )}
                    {product.condition && (
                      <div className="bg-white rounded-[12px] p-4 border border-[#e2e8f0]">
                        <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-2">Condition</div>
                        <div className="font-semibold text-[#1e293b] capitalize">{product.condition}</div>
                      </div>
                    )}
                  </div>

                  {/* Colors & Sizes */}
                  {(product.filters?.colors && product.filters.colors.length > 0) && (
                    <div className="bg-[#f8fafc] rounded-[12px] p-4 border border-[#e2e8f0]">
                      <div className="text-xs font-bold text-[#64748b] uppercase mb-2">Available Colors</div>
                      <div className="flex flex-wrap gap-2">
                        {product.filters.colors.map((color, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white border border-[#e2e8f0] rounded-full text-sm font-semibold capitalize">{color}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(product.filters?.sizes && product.filters.sizes.length > 0) && (
                    <div className="bg-white rounded-[12px] p-4 border border-[#e2e8f0] mt-4">
                      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Available Sizes</div>
                      <div className="flex flex-wrap gap-2">
                        {product.filters.sizes.map((size, i) => (
                          <span key={i} className="px-4 py-2 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg text-sm font-semibold">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Weight */}
                  {product.weight && product.weight > 0 && (
                    <div className="bg-white rounded-[12px] p-4 border border-[#e2e8f0] mt-4">
                      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-2">Weight</div>
                      <div className="font-semibold text-[#1e293b]">{product.weight} {product.weightUnit || "kg"}</div>
                    </div>
                  )}

                  {/* Product Specs (Filters) */}
                  {product.filters && Object.keys(product.filters).length > 0 && (
                    <div className="bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)] rounded-[12px] p-4 border border-[rgba(139,92,246,0.2)] mt-4">
                      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Product Specifications</div>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(product.filters).map(([key, value]) => (
                          <div key={key} className="bg-white rounded-[8px] p-3">
                            <div className="text-xs text-[#64748b] font-semibold uppercase mb-1">{key.replace(/_/g, ' ')}</div>
                            <div className="font-bold text-[#1e293b]">
                              {Array.isArray(value) ? value.join(", ") : String(value)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes & Colors */}
                  {((product.filters?.sizes?.length ?? 0) > 0 || (product.filters?.colors?.length ?? 0) > 0) && (
                    <div className="bg-[#f8fafc] rounded-[12px] p-4 border border-[#e2e8f0]">
                      <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Available Options</div>
                      {product.filters?.sizes && product.filters.sizes.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-[#64748b] mb-2">Sizes</div>
                          <div className="flex flex-wrap gap-2">
                            {product.filters.sizes.map(size => (
                              <span key={size} className="px-3 py-1 bg-white border border-[#e2e8f0] rounded-full text-sm font-semibold">{size}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.filters?.colors && product.filters.colors.length > 0 && (
                        <div>
                          <div className="text-xs text-[#64748b] mb-2">Colors</div>
                          <div className="flex flex-wrap gap-2">
                            {product.filters.colors.map(color => (
                              <span key={color} className="px-3 py-1 bg-white border border-[#e2e8f0] rounded-full text-sm font-semibold">{color}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="bg-[#f8fafc] rounded-[12px] p-4 border border-[#e2e8f0] mt-4">
                    <div className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-3">Record Information</div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[#64748b]">Product ID: </span>
                        <span className="font-mono font-semibold text-xs">{product.id}</span>
                      </div>
                      <div>
                        <span className="text-[#64748b]">Created: </span>
                        <span className="font-semibold">
                          {product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : "Unknown"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#64748b]">Updated: </span>
                        <span className="font-semibold">
                          {product.updatedAt?.toDate ? product.updatedAt.toDate().toLocaleDateString() : "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inventory Tab */}
            {activeTab === "inventory" && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 rounded-[16px] p-5 border border-[#25D366]/20">
                    <div className="text-sm text-[#64748b] font-semibold">Current Stock</div>
                    <div className="text-3xl font-extrabold text-[#1e293b] mt-1">{product.stock || 0}</div>
                    <div className="text-xs text-[#64748b] mt-1">units</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[16px] p-5 border border-[#e2e8f0]">
                    <div className="text-sm text-[#64748b] font-semibold">Low Stock Alert</div>
                    <div className="text-3xl font-extrabold text-[#1e293b] mt-1">{product.lowStockAlert || 5}</div>
                    <div className="text-xs text-[#64748b] mt-1">units threshold</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[16px] p-5 border border-[#e2e8f0]">
                    <div className="text-sm text-[#64748b] font-semibold">SKU</div>
                    <div className="text-xl font-extrabold text-[#1e293b] mt-1 truncate">{product.sku || "Not set"}</div>
                  </div>
                  <div className="bg-[#f8fafc] rounded-[16px] p-5 border border-[#e2e8f0]">
                    <div className="text-sm text-[#64748b] font-semibold">Status</div>
                    <div className="text-xl font-extrabold text-[#1e293b] mt-1 capitalize">{product.status || "active"}</div>
                  </div>
                </div>

                <div className="bg-[#f8fafc] rounded-[16px] p-6 border border-[#e2e8f0]">
                  <h3 className="font-bold text-[#1e293b] mb-4">Pricing Information</h3>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-[#64748b] mb-1">Regular Price</div>
                      <div className="text-2xl font-extrabold text-[#1e293b]">{formatCurrency(product.price)}</div>
                    </div>
                    {product.salePrice && product.salePrice > 0 && (
                      <div>
                        <div className="text-sm text-[#64748b] mb-1">Sale Price</div>
                        <div className="text-2xl font-extrabold text-[#10b981]">{formatCurrency(product.salePrice)}</div>
                      </div>
                    )}
                    {product.costPrice && product.costPrice > 0 && (
                      <div>
                        <div className="text-sm text-[#64748b] mb-1">Cost Price</div>
                        <div className="text-2xl font-extrabold text-[#64748b]">{formatCurrency(product.costPrice)}</div>
                      </div>
                    )}
                  </div>
                  {product.taxEnabled && product.taxRate && product.taxRate > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#e2e8f0]">
                      <span className="text-sm text-[#64748b]">Tax Rate: </span>
                      <span className="font-semibold">{product.taxRate}%</span>
                    </div>
                  )}
                </div>

                {product.barcode && (
                  <div className="bg-[#f8fafc] rounded-[16px] p-5 border border-[#e2e8f0]">
                    <div className="text-sm text-[#64748b] mb-1">Barcode</div>
                    <div className="text-lg font-mono font-bold text-[#1e293b]">{product.barcode}</div>
                  </div>
                )}
              </div>
            )}

            {/* Specifications Tab */}
            {activeTab === "specs" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {product.brand && (
                    <div className="bg-[#f8fafc] rounded-[12px] p-4">
                      <div className="text-xs text-[#64748b] font-semibold uppercase mb-1">Brand</div>
                      <div className="font-bold text-[#1e293b]">{product.brand}</div>
                    </div>
                  )}
                  {product.condition && (
                    <div className="bg-[#f8fafc] rounded-[12px] p-4">
                      <div className="text-xs text-[#64748b] font-semibold uppercase mb-1">Condition</div>
                      <div className="font-bold text-[#1e293b] capitalize">{product.condition}</div>
                    </div>
                  )}
                  {product.weight && (
                    <div className="bg-[#f8fafc] rounded-[12px] p-4">
                      <div className="text-xs text-[#64748b] font-semibold uppercase mb-1">Weight</div>
                      <div className="font-bold text-[#1e293b]">{product.weight} {product.weightUnit || "kg"}</div>
                    </div>
                  )}
                </div>

                {/* Product Specs (Filters) */}
                {product.filters && Object.keys(product.filters).length > 0 && (
                  <div className="bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)] rounded-[16px] p-6 border border-[rgba(139,92,246,0.2)]">
                    <h3 className="font-bold text-[#1e293b] mb-4">Product Specifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(product.filters).map(([key, value]) => (
                        <div key={key} className="bg-white rounded-[8px] p-3">
                          <div className="text-xs text-[#64748b] font-semibold uppercase mb-1">{key.replace(/_/g, ' ')}</div>
                          <div className="font-bold text-[#1e293b]">
                            {Array.isArray(value) ? value.join(", ") : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="bg-[#f8fafc] rounded-[16px] p-5 border border-[#e2e8f0]">
                  <h3 className="font-bold text-[#1e293b] mb-4">Record Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#64748b]">Product ID: </span>
                      <span className="font-mono font-semibold">{product.id}</span>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Created: </span>
                      <span className="font-semibold">
                        {product.createdAt?.toDate ? product.createdAt.toDate().toLocaleDateString() : "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748b]">Updated: </span>
                      <span className="font-semibold">
                        {product.updatedAt?.toDate ? product.updatedAt.toDate().toLocaleDateString() : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights Tab */}
            {activeTab === "ai" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)] border-2 border-[rgba(139,92,246,0.2)] rounded-[16px] p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white text-xl">
                      <i className="fas fa-robot"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1e293b]">AI Product Analysis</h3>
                      <p className="text-sm text-[#64748b]">Insights based on product data</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Stock Analysis */}
                    <div className="flex items-start gap-3 p-4 bg-white rounded-[12px]">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${stockStatus.color === "#ef4444" ? "bg-red-100 text-red-600" : stockStatus.color === "#f59e0b" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"}`}>
                        <i className="fas fa-boxes"></i>
                      </div>
                      <div>
                        <div className="font-bold text-[#1e293b]">
                          {stockStatus.text === "Out of Stock" ? "⚠️ Restock Needed" : stockStatus.text === "Low Stock" ? "📦 Consider Restocking" : "✅ Stock Levels Good"}
                        </div>
                        <div className="text-sm text-[#64748b] mt-1">
                          {stockStatus.text === "Out of Stock" 
                            ? `This product is currently out of stock. ${product.stock || 0} units available.`
                            : stockStatus.text === "Low Stock"
                            ? `Only ${product.stock || 0} units left. Consider restocking soon.`
                            : `Stock levels are healthy with ${product.stock || 0} units available.`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Pricing Analysis */}
                    {product.costPrice && product.costPrice > 0 && (
                      <div className="flex items-start gap-3 p-4 bg-white rounded-[12px]">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-dollar-sign"></i>
                        </div>
                        <div>
                          <div className="font-bold text-[#1e293b]">Pricing Analysis</div>
                          <div className="text-sm text-[#64748b] mt-1">
                            Profit margin: {formatCurrency(product.price - product.costPrice)} ({Math.round(((product.price - product.costPrice) / product.price) * 100)}% markup)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Description Analysis */}
                    <div className="flex items-start gap-3 p-4 bg-white rounded-[12px]">
                      <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-align-left"></i>
                      </div>
                      <div>
                        <div className="font-bold text-[#1e293b]">Description Status</div>
                        <div className="text-sm text-[#64748b] mt-1">
                          {product.description && product.description.length > 50 
                            ? `✓ Good description (${product.description.length} characters)`
                            : "⚠️ Consider adding a more detailed description for better sales"
                          }
                        </div>
                      </div>
                    </div>

                    {/* Category Completeness */}
                    <div className="flex items-start gap-3 p-4 bg-white rounded-[12px]">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                        <i className="fas fa-check-circle"></i>
                      </div>
                      <div>
                        <div className="font-bold text-[#1e293b]">Product Completeness</div>
                        <div className="text-sm text-[#64748b] mt-1">
                          {(() => {
                            let score = 0;
                            const total = 8;
                            if (product.name) score++;
                            if (product.description) score++;
                            if (product.price) score++;
                            if (product.category) score++;
                            if (product.brand) score++;
                            if (product.sku) score++;
                            if (product.stock !== undefined) score++;
                            if (product.image) score++;
                            return `${score}/${total} fields completed`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Description Generation */}
                <div className="bg-[#f8fafc] rounded-[16px] p-6 border border-[#e2e8f0]">
                  <h3 className="font-bold text-[#1e293b] mb-4">Generate AI Description</h3>
                  <p className="text-sm text-[#64748b] mb-4">
                    Let AI generate an optimized product description for WhatsApp sharing based on your product details.
                  </p>
                  <button className="px-5 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-[12px] font-semibold text-sm flex items-center gap-2">
                    <i className="fas fa-magic"></i>
                    Generate Description
                  </button>
                </div>

                {/* Order Link */}
                <div className="bg-gradient-to-br from-[rgba(37,211,102,0.08)] to-[rgba(18,140,126,0.08)] rounded-[16px] p-6 border border-[rgba(37,211,102,0.2)]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                      <i className="fas fa-link"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-[#1e293b]">Order Page Link</h3>
                      <p className="text-sm text-[#64748b]">Direct link for customers to order this product</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={product.orderLink || ""} 
                      className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm bg-white"
                      placeholder="Link will be generated after saving"
                    />
                    <button 
                      onClick={() => {
                        if (product.orderLink) {
                          navigator.clipboard.writeText(product.orderLink);
                          showToast("success", "Link copied to clipboard!");
                        }
                      }}
                      className="px-4 py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#128C7E]"
                    >
                      <i className="fas fa-copy"></i>
                      Copy
                    </button>
                    {product.orderLink && (
                      <a 
                        href={product.orderLink} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-3 bg-[#1e293b] text-white rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#0f172a]"
                      >
                        <i className="fas fa-external-link-alt"></i>
                        Open
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#64748b] mt-3">
                    Share this link with customers on WhatsApp. They'll see this product pre-added in their cart.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed top-8 right-8 z-[70] flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="bg-[#0f172a] text-white px-6 py-4 rounded-[8px] shadow-lg flex items-center gap-4 min-w-[300px]"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${toast.type === "success" ? "bg-[#10b981]/20 text-[#10b981]" : "bg-[#ef4444]/20 text-[#ef4444]"}`}>
              <i className={`fas fa-${toast.type === "success" ? "check-circle" : "exclamation-circle"}`}></i>
            </div>
            <div className="flex-1">
              <div className="font-bold mb-0.5">{toast.type.charAt(0).toUpperCase() + toast.type.slice(1)}</div>
              <div className="text-sm opacity-90">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
