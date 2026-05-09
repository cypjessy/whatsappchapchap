"use client";

import { Product } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

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
  return (
    <>
      {/* Mobile List View */}
      <div className="md:hidden bg-white rounded-xl border border-[#e2e8f0] overflow-hidden divide-y divide-[#e2e8f0] animate-fadeIn">
        {products.map((product, idx) => {
          const stockStyle = getStockStyle(product.stock || 0);
          return (
            <div 
              key={product.id} 
              className={`p-3 hover:bg-[#f8fafc] cursor-pointer flex items-center gap-3 ${
                bulkSelected.includes(product.id) ? 'bg-[rgba(37,211,102,0.05)]' : ''
              }`}
              style={{ animationDelay: `${idx * 0.03}s` }}
              onClick={() => !bulkMode && openProductModal(product)}
            >
              {bulkMode && (
                <input
                  type="checkbox"
                  checked={bulkSelected.includes(product.id)}
                  onChange={() => toggleBulkSelect(product.id)}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getCategoryColor(product.category || "")} flex items-center justify-center text-xl overflow-hidden flex-shrink-0`}>
                {product.image || product.imageUrl ? (
                  <img src={product.image || product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  getCategoryEmoji(product.category || "")
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm truncate">{product.name}</h3>
                  <span className="font-bold text-[#25D366] text-sm ml-2">{formatCurrency(product.price)}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-[#64748b] capitalize">{product.category || "Uncategorized"}</span>
                  <span className="text-xs" style={{ color: stockStyle.color }}>{product.stock || 0} in stock</span>
                </div>
                {!bulkMode && ((product.views || 0) > 0 || (product.orders || 0) > 0 || product.rating) && (
                  <div className="flex gap-2 mt-1">
                    {(product.views || 0) > 0 && (
                      <span className="text-xs text-[#64748b]">
                        <i className="fas fa-eye mr-1"></i>{product.views}
                      </span>
                    )}
                    {(product.orders || 0) > 0 && (
                      <span className="text-xs text-[#64748b]">
                        <i className="fas fa-shopping-cart mr-1"></i>{product.orders}
                      </span>
                    )}
                    {product.rating && product.rating > 0 && (
                      <span className="text-xs text-[#f59e0b]">
                        <i className="fas fa-star mr-1"></i>{product.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {!bulkMode && (
                <div className="flex gap-1 flex-shrink-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStatus(product);
                    }}
                    className="w-7 h-7 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg"
                    title={product.status === 'active' ? 'Pause' : 'Activate'}
                  >
                    <i className={`fas ${product.status === 'active' ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareProduct(product);
                    }}
                    className="w-7 h-7 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg"
                    title="Share"
                  >
                    <i className="fas fa-share-alt text-xs"></i>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop List View */}
      <div className="hidden md:block bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden animate-fadeIn">
        {bulkMode && products.length > 0 && (
          <div className="p-4 bg-[#f8fafc] border-b-2 border-[#e2e8f0] flex items-center justify-between">
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
        <div className="grid grid-cols-7 gap-4 p-4 bg-[#f8fafc] border-b-2 border-[#e2e8f0] text-xs font-bold text-[#64748b] uppercase">
          {bulkMode && <div className="w-8"></div>}
          <div>Image</div>
          <div className="col-span-2">Product</div>
          <div>Category</div>
          <div>Price</div>
          <div>Stock</div>
          <div>Actions</div>
        </div>
        {products.map((product, idx) => {
          const stockStyle = getStockStyle(product.stock || 0);
          return (
            <div 
              key={product.id} 
              className={`grid grid-cols-7 gap-4 p-4 border-b border-[#e2e8f0] items-center hover:bg-[rgba(37,211,102,0.02)] ${
                bulkSelected.includes(product.id) ? 'bg-[rgba(37,211,102,0.05)]' : ''
              }`}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              {bulkMode && (
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={bulkSelected.includes(product.id)}
                    onChange={() => toggleBulkSelect(product.id)}
                    className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(product.category || "")} flex items-center justify-center text-2xl overflow-hidden`}>
                {product.image || product.imageUrl ? (
                  <img src={product.image || product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  getCategoryEmoji(product.category || "")
                )}
              </div>
              <div className="col-span-2">
                <div className="font-bold text-sm">{product.name}</div>
                <div className="text-xs text-[#64748b]">SKU: {product.id.substring(0, 8)}</div>
                {!bulkMode && ((product.views || 0) > 0 || (product.orders || 0) > 0 || product.rating) && (
                  <div className="flex gap-2 mt-1">
                    {(product.views || 0) > 0 && (
                      <span className="text-xs text-[#64748b]">
                        <i className="fas fa-eye mr-1"></i>{product.views}
                      </span>
                    )}
                    {(product.orders || 0) > 0 && (
                      <span className="text-xs text-[#64748b]">
                        <i className="fas fa-shopping-cart mr-1"></i>{product.orders}
                      </span>
                    )}
                    {product.rating && product.rating > 0 && (
                      <span className="text-xs text-[#f59e0b]">
                        <i className="fas fa-star mr-1"></i>{product.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="text-sm capitalize">{product.category || "Uncategorized"}</div>
              <div className="font-bold">{formatCurrency(product.price)}</div>
              <div>
                <span style={{ color: stockStyle.color }} className="font-semibold">{product.stock || 0} in stock</span>
                <div className="w-24 h-1.5 bg-[#f8fafc] rounded-full mt-1 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: stockStyle.width, backgroundColor: stockStyle.color }}></div>
                </div>
              </div>
              <div className="flex gap-2">
                {!bulkMode && (
                  <>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(product);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#10b981] hover:text-white hover:bg-[#10b981] bg-[rgba(16,185,129,0.1)] rounded-lg transition-all shadow-sm"
                      title={product.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      <i className={`fas ${product.status === 'active' ? 'fa-pause' : 'fa-play'} text-base`}></i>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateProduct(product);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#8b5cf6] hover:text-white hover:bg-[#8b5cf6] bg-[#f5f3ff] rounded-lg transition-all shadow-sm"
                      title="Duplicate"
                    >
                      <i className="fas fa-copy text-base"></i>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareProduct(product);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#3b82f6] hover:text-white hover:bg-[#3b82f6] bg-[#eff6ff] rounded-lg transition-all shadow-sm"
                      title="Share"
                    >
                      <i className="fas fa-share-alt text-base"></i>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        shareProductWhatsApp(product);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#25D366] hover:text-white hover:bg-[#25D366] bg-[rgba(37,211,102,0.1)] rounded-lg transition-all shadow-sm"
                      title="Send via WhatsApp"
                    >
                      <i className="fab fa-whatsapp text-base"></i>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        printProductCatalog(product);
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#06b6d4] hover:text-white hover:bg-[#06b6d4] bg-[rgba(6,182,212,0.1)] rounded-lg transition-all shadow-sm"
                      title="Print Product"
                    >
                      <i className="fas fa-print text-base"></i>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="w-10 h-10 flex items-center justify-center text-[#ef4444] hover:text-white hover:bg-[#ef4444] bg-[rgba(239,68,68,0.1)] rounded-lg transition-all shadow-sm"
                      title="Delete"
                    >
                      <i className="fas fa-trash text-base"></i>
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
