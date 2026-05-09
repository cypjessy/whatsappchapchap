"use client";

import { Product } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

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
  return (
    <>
      {bulkMode && products.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl animate-fadeIn">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bulkSelected.length === products.length && products.length > 0}
              onChange={selectAllProducts}
              className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
            />
            <span className="text-sm font-semibold text-[#64748b]">
              Select All ({bulkSelected.length}/{products.length})
            </span>
          </label>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 animate-fadeIn">
        {products.map((product, idx) => {
          const stockStyle = getStockStyle(product.stock || 0);
          const badgeInfo = getBadgeStyle(product.stock || 0);
          return (
            <div 
              key={product.id} 
              className={`bg-white rounded-xl md:rounded-2xl border ${
                bulkSelected.includes(product.id) ? 'border-[#25D366] ring-2 ring-[#25D366]/20' : 'border-[#e2e8f0]'
              } overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer relative animate-scaleIn`}
              style={{ animationDelay: `${idx * 0.05}s` }}
              onClick={() => !bulkMode && openProductModal(product)}
            >
              {bulkMode && (
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={bulkSelected.includes(product.id)}
                    onChange={() => toggleBulkSelect(product.id)}
                    className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                  />
                </div>
              )}
              {!bulkMode && badgeInfo.badge !== "new" && (
                <span className={`absolute top-3 left-3 px-2 md:px-3 py-0.5 rounded-full text-xs font-bold z-10 ${
                  badgeInfo.badge === "out" ? "bg-[#64748b] text-white" : "bg-[#f59e0b] text-white"
                }`}>
                  {badgeInfo.label}
                </span>
              )}
              {!bulkMode && product.status && product.status !== 'active' && (
                <span className={`absolute top-3 right-3 px-2 md:px-3 py-0.5 rounded-full text-xs font-bold z-10 ${
                  product.status === 'paused' ? 'bg-[#f59e0b] text-white' : 'bg-[#64748b] text-white'
                }`}>
                  {product.status}
                </span>
              )}
              <div className={`h-32 md:h-48 bg-gradient-to-br ${getCategoryColor(product.category || "")} flex items-center justify-center text-4xl md:text-6xl relative overflow-hidden`}>
                {product.image || product.imageUrl ? (
                  <img src={product.image || product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  getCategoryEmoji(product.category || "")
                )}
              </div>
              <div className="p-3 md:p-5">
                <div className="text-xs font-bold text-[#25D366] uppercase mb-1 truncate">{product.category || "Uncategorized"}</div>
                <h3 className="font-bold text-sm mb-2 line-clamp-2">{product.name}</h3>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="text-lg md:text-xl font-extrabold">{formatCurrency(product.price)}</div>
                </div>
                <div className="pt-2 md:pt-3 border-t border-[#e2e8f0]">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="text-xs text-[#64748b]">{product.stock || 0} in stock</div>
                      <div className="w-16 md:w-20 h-1.5 bg-[#f8fafc] rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: stockStyle.width, backgroundColor: stockStyle.color }}></div>
                      </div>
                    </div>
                    {!bulkMode && (
                      <div className="flex gap-2">
                        {(product.views || 0) > 0 && (
                          <div className="flex items-center gap-1 text-xs text-[#64748b]">
                            <i className="fas fa-eye"></i>
                            <span>{product.views}</span>
                          </div>
                        )}
                        {(product.orders || 0) > 0 && (
                          <div className="flex items-center gap-1 text-xs text-[#64748b]">
                            <i className="fas fa-shopping-cart"></i>
                            <span>{product.orders}</span>
                          </div>
                        )}
                        {product.rating && product.rating > 0 && (
                          <div className="flex items-center gap-1 text-xs text-[#f59e0b]">
                            <i className="fas fa-star"></i>
                            <span>{product.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!bulkMode && (
                    <div className="flex gap-2 pt-2 border-t border-[#e2e8f0]">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(product);
                        }}
                        className="flex-1 py-1.5 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg text-xs font-semibold"
                        title={product.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        <i className={`fas ${product.status === 'active' ? 'fa-pause' : 'fa-play'} mr-1`}></i>
                        {product.status === 'active' ? 'Pause' : 'Activate'}
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateProduct(product);
                        }}
                        className="flex-1 py-1.5 flex items-center justify-center text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded-lg text-xs font-semibold"
                        title="Duplicate"
                      >
                        <i className="fas fa-copy mr-1"></i>
                        Duplicate
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareProduct(product);
                        }}
                        className="flex-1 py-1.5 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg text-xs font-semibold"
                        title="Share"
                      >
                        <i className="fas fa-share-alt mr-1"></i>
                        Share
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          shareProductWhatsApp(product);
                        }}
                        className="flex-1 py-1.5 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg text-xs font-semibold"
                        title="Send via WhatsApp"
                      >
                        <i className="fab fa-whatsapp mr-1"></i>
                        WhatsApp
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          printProductCatalog(product);
                        }}
                        className="flex-1 py-1.5 flex items-center justify-center text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded-lg text-xs font-semibold"
                        title="Print Product"
                      >
                        <i className="fas fa-print mr-1"></i>
                        Print
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
