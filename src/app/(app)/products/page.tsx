"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService, Product } from "@/lib/db";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    description: "",
  });
  const [newProductForm, setNewProductForm] = useState({
    name: "",
    category: "",
    price: 0,
    stock: 0,
    description: "",
  });
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadProducts();
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

  const saveNewProduct = async () => {
    if (!user) return;
    if (!newProductForm.name || !newProductForm.category || newProductForm.price <= 0) {
      alert("Please fill in product name, category, and price");
      return;
    }
    setSavingProduct(true);
    try {
      await productService.createProduct(user, {
        name: newProductForm.name,
        category: newProductForm.category,
        price: newProductForm.price,
        stock: newProductForm.stock || 0,
        description: newProductForm.description,
      });
      loadProducts();
      setModalOpen(false);
      setNewProductForm({ name: "", category: "", price: 0, stock: 0, description: "" });
      alert("Product created successfully!");
    } catch (error) {
      console.error("Error creating product:", error);
      alert("Error creating product: " + error);
    } finally {
      setSavingProduct(false);
    }
  };

  const saveEditedProduct = async () => {
    if (!user || !selectedProduct) return;
    try {
      await productService.updateProduct(user, selectedProduct.id, {
        name: editForm.name,
        category: editForm.category,
        price: editForm.price,
        stock: editForm.stock,
        description: editForm.description,
      });
      loadProducts();
      setEditMode(false);
    } catch (error) {
      console.error("Error updating product:", error);
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

  const handleNewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProductForm((prev) => ({ ...prev, [name]: name === "price" || name === "stock" ? Number(value) : value }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: name === "price" || name === "stock" ? Number(value) : value }));
  };

  const categories = [
    { id: "all", label: "All Products", count: products.length, icon: null },
    { id: "fashion", label: "Fashion", count: products.filter(p => p.category === "fashion").length, icon: "fa-tshirt" },
    { id: "electronics", label: "Electronics", count: products.filter(p => p.category === "electronics").length, icon: "fa-laptop" },
    { id: "home", label: "Home & Living", count: products.filter(p => p.category === "home").length, icon: "fa-home" },
    { id: "beauty", label: "Beauty", count: products.filter(p => p.category === "beauty").length, icon: "fa-spa" },
    { id: "sports", label: "Sports", count: products.filter(p => p.category === "sports").length, icon: "fa-running" },
  ];

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = { fashion: "👕", electronics: "📱", home: "🏠", beauty: "💄", sports: "⚽" };
    return emojis[category] || "📦";
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      fashion: "from-[#f1f5f9] to-[#e2e8f0]", electronics: "from-[#e0e7ff] to-[#c7d2fe]",
      home: "from-[#dcfce7] to-[#bbf7d0]", beauty: "from-[#f3e8ff] to-[#e9d5ff]", sports: "from-[#fef3c7] to-[#fde68a]"
    };
    return colors[category] || "from-[#f1f5f9] to-[#e2e8f0]";
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

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
    setEditForm({
      name: product.name,
      category: product.category || "",
      price: product.price,
      stock: product.stock || 0,
      description: product.description || "",
    });
    setProductModalOpen(true);
    setEditMode(false);
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
          <div className="relative">
            <input type="file" accept=".csv" onChange={importProducts} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
              <i className="fas fa-file-import mr-2"></i>Import CSV
            </button>
          </div>
          <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={exportProducts}>
            <i className="fas fa-file-export mr-2"></i>Export
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" onClick={() => setModalOpen(true)}>
            <i className="fas fa-plus mr-2"></i>Add Product
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] rounded-2xl p-6 mb-6 flex items-center justify-between text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(37,211,102,0.15)_0%,transparent_70%)]"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-2xl flex items-center justify-center text-3xl shadow-xl">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">AI Product Optimizer</h3>
            <p className="text-white/80 text-sm">Smart pricing suggestions, auto-descriptions, and stock forecasting</p>
          </div>
        </div>
        <div className="flex gap-3 relative z-10">
          <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg">
            <i className="fas fa-magic mr-2"></i>Optimize Prices
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between border border-[#e2e8f0]">
        <div className="flex gap-4 flex-wrap">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 bg-[#f8fafc] border-2 border-transparent rounded-xl text-sm focus:outline-none focus:border-[#25D366] w-64" />
          </div>
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm">
            <option>All Stock</option>
            <option>In Stock</option>
            <option>Low Stock</option>
          </select>
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm">
            <option>Sort: Newest</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
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
            {cat.icon && <i className={`fas ${cat.icon}`}></i>}
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
                <div className={`h-48 bg-gradient-to-br ${getCategoryColor(product.category || "")} flex items-center justify-center text-6xl relative`}>
                  {getCategoryEmoji(product.category || "")}
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
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(product.category || "")} flex items-center justify-center text-2xl`}>
                  {getCategoryEmoji(product.category || "")}
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

      {modalOpen && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-[16px] w-full max-w-[1000px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                  <i className="fas fa-plus"></i>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold">Add New Product</h2>
                  <p className="text-sm text-[#64748b]">Create a new product listing for your WhatsApp store</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setModalOpen(false)}>
                  <i className="fas fa-minus"></i>
                </button>
                <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-lg" onClick={() => setModalOpen(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                      <i className="fas fa-info-circle text-[#25D366]"></i>Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">
                          Product Name <span>*</span>
                        </label>
                        <input type="text" name="name" value={newProductForm.name} onChange={handleNewInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="Enter product name" maxLength={100} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Description <span>*</span></label>
                        <textarea name="description" value={newProductForm.description} onChange={handleNewInputChange} rows={4} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" placeholder="Describe your product..."></textarea>
                        <div className="bg-gradient-to-r from-[rgba(139,92,246,0.1)] to-[rgba(124,58,237,0.1)] border-2 border-dashed border-[#8b5cf6] rounded-xl p-4 text-center cursor-pointer mt-2" onClick={() => { if(!newProductForm.name) { alert("Please enter product name first"); return; } }}>
                          <i className="fas fa-magic text-purple-500 text-xl mb-2 block"></i>
                          <p className="text-sm font-semibold text-purple-600">✨ Generate with AI</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Media */}
                  <div>
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                      <i className="fas fa-images text-[#25D366]"></i>Product Images
                    </h3>
                    <div className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-8 text-center cursor-pointer hover:border-[#25D366] bg-[#f8fafc]">
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-3xl text-[#25D366] shadow">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      <div className="font-semibold mb-1">Drag & drop images here</div>
                      <div className="text-sm text-[#64748b] mb-3">or click to browse from your device</div>
                      <div className="text-xs text-[#64748b]">Supports: JPG, PNG, WebP (Max 5MB each)</div>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                      <i className="fas fa-tag text-[#25D366]"></i>Category
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {["Electronics", "Fashion", "Home", "Beauty", "Sports", "Food", "Other"].map(cat => (
                        <button 
                          key={cat}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${newProductForm.category === cat.toLowerCase() ? "bg-[#25D366] text-white" : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"}`}
                          onClick={() => setNewProductForm(prev => ({ ...prev, category: cat.toLowerCase() }))}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Pricing */}
                  <div>
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                      <i className="fas fa-tag text-[#25D366]"></i>Pricing
                    </h3>
                    <div className="space-y-4">
                      <div className="form-group">
                        <label className="form-label">Regular Price <span>*</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] font-semibold">$</span>
                          <input type="number" name="price" value={newProductForm.price} onChange={handleNewInputChange} className="w-full pl-8 pr-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="0.00" step="0.01" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Sale Price <span className="text-xs font-normal text-[#64748b]">Optional</span></label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] font-semibold">$</span>
                          <input type="number" className="w-full pl-8 pr-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="0.00" step="0.01" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl">
                        <div>
                          <div className="font-bold text-sm">Wholesale Pricing</div>
                          <div className="text-xs text-[#64748b]">Offer discounts for bulk purchases</div>
                        </div>
                        <div className="w-12 h-6 bg-[#e2e8f0] rounded-full relative cursor-pointer">
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inventory */}
                  <div>
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                      <i className="fas fa-boxes text-[#25D366]"></i>Inventory
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label className="form-label">SKU <span>*</span></label>
                        <input type="text" className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="e.g., PROD-001" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Barcode</label>
                        <input type="text" className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="Scan or enter barcode" />
                      </div>
                    </div>
                    <div className="form-group mt-4">
                      <label className="form-label">Stock Quantity <span>*</span></label>
                      <input type="number" name="stock" value={newProductForm.stock} onChange={handleNewInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="0" min="0" />
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-[rgba(245,158,11,0.1)] rounded-xl mt-3 text-sm text-[#f59e0b]">
                      <i className="fas fa-exclamation-triangle"></i>
                      <span>Low stock alerts will be sent when inventory drops below 5 units</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl mt-3">
                      <div>
                        <div className="font-bold text-sm">Track Inventory</div>
                        <div className="text-xs text-[#64748b]">Automatically update stock when orders are placed</div>
                      </div>
                      <div className="w-12 h-6 bg-[#25D366] rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Variants */}
                  <div className="bg-[#f8fafc] rounded-xl p-4">
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                      <i className="fas fa-layer-group text-[#25D366]"></i>Variants
                    </h3>
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                        <div>
                          <input type="text" className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm" placeholder="Variant (e.g., Size)" />
                        </div>
                        <div>
                          <input type="text" className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm" placeholder="Options (e.g., S,M,L)" />
                        </div>
                        <button className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <button className="w-full py-2 bg-white border-2 border-dashed border-[#e2e8f0] rounded-lg text-[#25D366] font-semibold text-sm hover:border-[#25D366] flex items-center justify-center gap-2">
                      <i className="fas fa-plus"></i>Add Variant
                    </button>
                  </div>

                  {/* Additional Options */}
                  <div>
                    <h3 className="text-sm font-bold text-[#1e293b] mb-4 flex items-center gap-2">
                      <i className="fas fa-cog text-[#25D366]"></i>Additional Options
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl">
                        <div>
                          <div className="font-bold text-sm">Featured Product</div>
                          <div className="text-xs text-[#64748b]">Show on store homepage</div>
                        </div>
                        <div className="w-12 h-6 bg-[#e2e8f0] rounded-full relative cursor-pointer">
                          <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl">
                        <div>
                          <div className="font-bold text-sm">Allow Reviews</div>
                          <div className="text-xs text-[#64748b]">Customers can leave reviews</div>
                        </div>
                        <div className="w-12 h-6 bg-[#25D366] rounded-full relative cursor-pointer">
                          <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] flex items-center gap-2" onClick={() => setModalOpen(false)}>
                  <i className="fas fa-save"></i>Save Draft
                </button>
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                  <i className="fas fa-check text-[#10b981]"></i>
                  <span>Autosave enabled</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366] flex items-center gap-2">
                  <i className="fas fa-eye"></i>Preview
                </button>
                <button className="px-4 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg flex items-center gap-2 disabled:opacity-50" onClick={saveNewProduct} disabled={savingProduct}>
                  {savingProduct ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i>Publishing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check"></i>Publish Product
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {productModalOpen && selectedProduct && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setProductModalOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">{editMode ? "Edit Product" : selectedProduct.name}</h2>
              <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl" onClick={() => setProductModalOpen(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            {!editMode ? (
              <>
                <div className="p-6 space-y-4">
                  <div className={`w-full h-48 bg-gradient-to-br ${getCategoryColor(selectedProduct.category || "")} rounded-2xl flex items-center justify-center text-8xl`}>
                    {getCategoryEmoji(selectedProduct.category || "")}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#25D366] uppercase">{selectedProduct.category || "Uncategorized"}</span>
                  </div>
                  <div className="text-3xl font-extrabold text-[#25D366]">{formatCurrency(selectedProduct.price)}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f8fafc] rounded-xl p-4">
                      <div className="text-xs text-[#64748b]">Stock</div>
                      <div className="font-bold text-xl">{selectedProduct.stock || 0}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-2">Description</div>
                    <div className="bg-[#f8fafc] rounded-xl p-4 text-[#64748b]">{selectedProduct.description || "No description"}</div>
                  </div>
                </div>
                <div className="p-6 border-t border-[#e2e8f0] flex justify-between">
                  <button className="px-4 py-2 bg-[rgba(239,68,68,0.1)] text-[#ef4444] rounded-xl font-semibold text-sm hover:bg-[#ef4444] hover:text-white" onClick={() => { if(confirm("Are you sure you want to delete this product?")) deleteProduct(); }}>
                    <i className="fas fa-trash mr-2"></i>Delete
                  </button>
                  <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm" onClick={() => setEditMode(true)}>
                    <i className="fas fa-edit mr-2"></i>Edit
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block font-semibold text-sm mb-2">Product Name</label>
                    <input type="text" name="name" value={editForm.name} onChange={handleEditInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" />
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-2">Category</label>
                    <select name="category" value={editForm.category} onChange={handleEditInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] bg-white">
                      <option value="">Select category</option>
                      <option value="fashion">Fashion</option>
                      <option value="electronics">Electronics</option>
                      <option value="home">Home & Living</option>
                      <option value="beauty">Beauty</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-sm mb-2">Price</label>
                      <input type="number" name="price" value={editForm.price} onChange={handleEditInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" />
                    </div>
                    <div>
                      <label className="block font-semibold text-sm mb-2">Stock</label>
                      <input type="number" name="stock" value={editForm.stock} onChange={handleEditInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-2">Description</label>
                    <textarea name="description" value={editForm.description} onChange={handleEditInputChange} rows={4} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none"></textarea>
                  </div>
                </div>
                <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
                  <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={() => setEditMode(false)}>Cancel</button>
                  <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={saveEditedProduct}>
                    <i className="fas fa-save mr-2"></i>Save Changes
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
