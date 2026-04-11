"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService, Product, categoryService, defaultProductCategories, ProductCategory } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import CategoriesModal from "@/components/categories/CategoriesModal";
import ViewProductModal from "@/components/products/ViewProductModal";
import AddProductModal from "@/components/products/AddProductModal";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [productCategories, setProductCategories] = useState<{id: string; name: string; icon: string}[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (!user) return;
    loadProducts();
    loadCategories();
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await productService.getProducts(user);
      setProducts(data);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!user) return;
    setLoadingCategories(true);
    try {
      const customCategories = await categoryService.getCategories(user);
      const customCats = customCategories.map(cat => ({ id: cat.id, name: cat.name, icon: cat.icon }));
      setProductCategories(customCats);
    } catch (error) {
      console.error("Error loading categories:", error);
      setProductCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const deleteProduct = async () => {
    if (!user || !selectedProduct) return;
    try {
      await productService.deleteProduct(user, selectedProduct.id);
      loadProducts();
      setProductModalOpen(false);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const categories = [
    { id: "all", label: "All Products", count: products.length, icon: null },
    ...productCategories.map(cat => ({
      id: cat.id,
      label: cat.name,
      count: products.filter(p => p.category === cat.id).length,
      icon: cat.icon,
    })),
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const stock = p.stock || 0;
    const matchesStock = stockFilter === "all" || 
      (stockFilter === "in" && stock > 5) ||
      (stockFilter === "low" && stock > 0 && stock <= 5) ||
      (stockFilter === "out" && stock === 0);
    return matchesCategory && matchesSearch && matchesStock;
  }).sort((a, b) => {
    if (sortBy === "newest") return 0;
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "stock-low") return (a.stock || 0) - (b.stock || 0);
    if (sortBy === "stock-high") return (b.stock || 0) - (a.stock || 0);
    return 0;
  });

  const getCategoryEmoji = (category: string) => {
    const found = productCategories.find(c => c.id === category);
    return found?.icon || "📦";
  };

  const getCategoryColor = (category: string) => {
    const categoryIndex = productCategories.findIndex(c => c.id === category);
    const colors = [
      "from-[#fce7f3] to-[#fbcfe8]",
      "from-[#e0e7ff] to-[#c7d2fe]",
      "from-[#dcfce7] to-[#bbf7d0]",
      "from-[#fef3c7] to-[#fde68a]",
      "from-[#e0f2fe] to-[#bae6fd]",
      "from-[#f3e8ff] to-[#e9d5ff]",
      "from-[#ffedd5] to-[#fed7aa]",
      "from-[#f1f5f9] to-[#e2e8f0]",
    ];
    const colorIndex = categoryIndex >= 0 ? categoryIndex % colors.length : 0;
    return colors[colorIndex];
  };

  const getBadgeStyle = (stock: number) => {
    if (stock === 0) return { badge: "out", label: "Out of Stock" };
    if (stock <= 5) return { badge: "low", label: "Low Stock" };
    return { badge: "new", label: "In Stock" };
  };

  const getStockStyle = (stock: number) => {
    if (stock === 0) return { color: "#ef4444", width: "0%" };
    if (stock <= 5) return { color: "#ef4444", width: "10%" };
    if (stock <= 20) return { color: "#f59e0b", width: "30%" };
    return { color: "#10b981", width: "75%" };
  };

  const exportProducts = () => {
    const headers = ["Name", "Category", "Price", "Stock", "Description"];
    const rows = products.map(p => [p.name, p.category || "", p.price, p.stock || 0, p.description || ""]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    alert("Products exported successfully!");
  };

  const importProducts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(",");
        const productData: any = {};
        headers.forEach((h, idx) => {
          const key = h.trim().toLowerCase();
          if (key === "price" || key === "stock") {
            productData[key] = Number(values[idx]?.trim() || 0);
          } else {
            productData[key] = values[idx]?.trim() || "";
          }
        });
        
        if (productData.name && productData.price) {
          try {
            await productService.createProduct(user!, {
              name: productData.name,
              category: productData.category || "other",
              price: productData.price,
              stock: productData.stock || 0,
              description: productData.description || "",
            });
          } catch (err) {
            console.error("Error importing product:", err);
          }
        }
      }
      
      loadProducts();
      alert("Products imported successfully!");
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-box-open text-[#25D366]"></i>Product Catalog
          </h1>
          <p className="text-[#64748b]">Manage your inventory, pricing, and AI-optimized listings</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={() => setCategoriesModalOpen(true)}>
            <i className="fas fa-layer-group mr-2"></i>Categories
          </button>
          <div className="relative">
            <input type="file" accept=".csv" onChange={importProducts} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
              <i className="fas fa-file-import mr-2"></i>Import CSV
            </button>
          </div>
          <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={exportProducts}>
            <i className="fas fa-file-export mr-2"></i>Export
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" onClick={() => setAddProductModalOpen(true)}>
            <i className="fas fa-plus mr-2"></i>Add Product
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between border border-[#e2e8f0]">
        <div className="flex gap-4 flex-wrap">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-[#f8fafc] border-2 border-transparent rounded-xl text-sm focus:outline-none focus:border-[#25D366] w-64" />
          </div>
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Sort: Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="stock-low">Stock: Low to High</option>
            <option value="stock-high">Stock: High to Low</option>
          </select>
        </div>
        <div className="flex bg-[#f8fafc] rounded-xl p-1 border-2 border-[#e2e8f0]">
          <button onClick={() => setView("grid")} className={`px-4 py-2 rounded-lg ${view === "grid" ? "bg-white shadow text-[#25D366]" : "text-[#64748b]"}`}>
            <i className="fas fa-th-large"></i>
          </button>
          <button onClick={() => setView("list")} className={`px-4 py-2 rounded-lg ${view === "list" ? "bg-white shadow text-[#25D366]" : "text-[#64748b]"}`}>
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-5 py-2 rounded-full font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${activeCategory === cat.id ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg" : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"}`}>
            {cat.icon && <span>{cat.icon}</span>}
            {cat.label}
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">{cat.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-box-open text-2xl text-[#64748b]"></i>
          </div>
          <h4 className="font-bold text-[#1e293b] mb-2">No products yet</h4>
          <p className="text-sm text-[#64748b]">Add your first product to start selling on WhatsApp.</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map(product => {
            const stockStyle = getStockStyle(product.stock || 0);
            const badgeInfo = getBadgeStyle(product.stock || 0);
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer" onClick={() => openProductModal(product)}>
                {badgeInfo.badge !== "new" && (
                  <span className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold z-10 ${badgeInfo.badge === "out" ? "bg-[#64748b] text-white" : "bg-[#f59e0b] text-white"}`}>
                    {badgeInfo.label}
                  </span>
                )}
                <div className={`h-48 bg-gradient-to-br ${getCategoryColor(product.category || "")} flex items-center justify-center text-6xl relative overflow-hidden`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    getCategoryEmoji(product.category || "")
                  )}
                </div>
                <div className="p-5">
                  <div className="text-xs font-bold text-[#25D366] uppercase mb-1">{product.category || "Uncategorized"}</div>
                  <h3 className="font-bold text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xl font-extrabold">{formatCurrency(product.price)}</div>
                  </div>
                  <div className="pt-3 border-t border-[#e2e8f0] flex justify-between items-center">
                    <div>
                      <div className="text-xs text-[#64748b]">{product.stock || 0} in stock</div>
                      <div className="w-20 h-1.5 bg-[#f8fafc] rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: stockStyle.width, backgroundColor: stockStyle.color }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="grid grid-cols-7 gap-4 p-4 bg-[#f8fafc] border-b-2 border-[#e2e8f0] text-xs font-bold text-[#64748b] uppercase">
            <div>Image</div>
            <div className="col-span-2">Product</div>
            <div>Category</div>
            <div>Price</div>
            <div>Stock</div>
            <div>Actions</div>
          </div>
          {filteredProducts.map(product => {
            const stockStyle = getStockStyle(product.stock || 0);
            return (
              <div key={product.id} className="grid grid-cols-7 gap-4 p-4 border-b border-[#e2e8f0] items-center hover:bg-[rgba(37,211,102,0.02)]">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(product.category || "")} flex items-center justify-center text-2xl overflow-hidden`}>
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    getCategoryEmoji(product.category || "")
                  )}
                </div>
                <div className="col-span-2">
                  <div className="font-bold text-sm">{product.name}</div>
                  <div className="text-xs text-[#64748b]">SKU: {product.id.substring(0, 8)}</div>
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
                  <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg" onClick={(e) => { e.stopPropagation(); openProductModal(product); }}><i className="fas fa-edit"></i></button>
                </div>
              </div>
            );
          })}
        </div>
)}
      <CategoriesModal
        isOpen={categoriesModalOpen} 
        onClose={() => setCategoriesModalOpen(false)} 
        products={products}
      />
      <ViewProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={selectedProduct}
        onEdit={() => {
          setAddProductModalOpen(true);
          setProductModalOpen(false);
        }}
      />
      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        onSuccess={() => loadProducts()}
      />
    </div>
  );
}
