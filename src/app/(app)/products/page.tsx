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
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [priceRangeMin, setPriceRangeMin] = useState<number | "">("");
  const [priceRangeMax, setPriceRangeMax] = useState<number | "">("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

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
      const customCats = customCategories.map(cat => ({ 
        id: cat.id, 
        name: cat.name, 
        icon: cat.icon || "📦" 
      }));
      setProductCategories(customCats as {id: string; name: string; icon: string}[]);
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
    const matchesPriceMin = priceRangeMin === "" || p.price >= Number(priceRangeMin);
    const matchesPriceMax = priceRangeMax === "" || p.price <= Number(priceRangeMax);
    
    // Date range filter
    let matchesDate = true;
    if (dateRangeStart || dateRangeEnd) {
      const productDate = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      if (dateRangeStart && productDate < new Date(dateRangeStart)) matchesDate = false;
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        if (productDate > endDate) matchesDate = false;
      }
    }
    
    return matchesCategory && matchesSearch && matchesStock && matchesPriceMin && matchesPriceMax && matchesDate;
  }).sort((a, b) => {
    if (sortBy === "newest") return 0;
    if (sortBy === "oldest") {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      return dateA.getTime() - dateB.getTime();
    }
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "stock-low") return (a.stock || 0) - (b.stock || 0);
    if (sortBy === "stock-high") return (b.stock || 0) - (a.stock || 0);
    if (sortBy === "name-az") return a.name.localeCompare(b.name);
    if (sortBy === "name-za") return b.name.localeCompare(a.name);
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

  // Calculate analytics
  const totalInventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
  const lowStockProducts = products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
  const outOfStockProducts = products.filter(p => (p.stock || 0) === 0).length;
  const activeProducts = products.filter(p => p.status === 'active').length;

  // Toggle status handler
  const handleToggleStatus = async (product: Product) => {
    if (!user) return;
    const newStatus = product.status === 'active' ? 'paused' : 'active';
    try {
      await productService.updateProduct(user, product.id, { status: newStatus });
      loadProducts();
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product status");
    }
  };

  // Share product handler
  const handleShareProduct = async (product: Product) => {
    const shareUrl = `${window.location.origin}/products/${product.id}`;
    const shareText = `Check out ${product.name} - ${formatCurrency(product.price)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Product link copied to clipboard!');
    }
  };

  // Duplicate product handler
  const handleDuplicateProduct = async (product: Product) => {
    if (!user) return;
    try {
      const duplicatedProduct = {
        ...product,
        name: `${product.name} (Copy)`,
        status: 'draft' as const,
        views: 0,
        orders: 0,
      };
      // @ts-ignore - omitting id and timestamps
      delete duplicatedProduct.id;
      delete duplicatedProduct.createdAt;
      delete duplicatedProduct.updatedAt;
      
      await productService.createProduct(user, duplicatedProduct);
      loadProducts();
      alert('Product duplicated successfully!');
    } catch (error) {
      console.error("Error duplicating product:", error);
      alert("Failed to duplicate product");
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (productId: string) => {
    if (!user) return;
    try {
      await productService.deleteProduct(user, productId);
      loadProducts();
      setShowDeleteConfirm(null);
      setBulkSelected(bulkSelected.filter(id => id !== productId));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
  };

  // Bulk selection handlers
  const toggleBulkSelect = (productId: string) => {
    if (bulkSelected.includes(productId)) {
      setBulkSelected(bulkSelected.filter(id => id !== productId));
    } else {
      setBulkSelected([...bulkSelected, productId]);
    }
  };

  const selectAllProducts = () => {
    if (bulkSelected.length === filteredProducts.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredProducts.map(p => p.id));
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'active' | 'paused' | 'draft') => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => productService.updateProduct(user, id, { status: newStatus }))
      );
      loadProducts();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error updating products:", error);
      alert("Failed to update some products");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => productService.deleteProduct(user, id))
      );
      loadProducts();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error deleting products:", error);
      alert("Failed to delete some products");
    }
  };

  // Print product catalog
  const printProductCatalog = (product: Product) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const stockCount = product.stock || 0;
    const stockStatus = stockCount === 0 ? '(Out of Stock)' : stockCount <= 5 ? '(Low Stock)' : '(In Stock)';
    const stockBgColor = stockCount > 5 ? '#dcfce7' : stockCount > 0 ? '#fef3c7' : '#fee2e2';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Product - ${product.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #25D366; }
          .product-image { width: 100%; max-width: 400px; height: 300px; object-fit: cover; border-radius: 12px; margin: 20px auto; display: block; }
          .placeholder { width: 100%; max-width: 400px; height: 300px; background: linear-gradient(135deg, #DCF8C6, #e0e7ff); border-radius: 12px; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-size: 80px; }
          .details { margin: 20px 0; }
          .details div { margin: 10px 0; }
          .price { font-size: 28px; font-weight: bold; color: #25D366; margin: 20px 0; }
          .stock { padding: 10px; background: ${stockBgColor}; border-radius: 8px; display: inline-block; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">PRODUCT CATALOG</div>
          <div>${product.category || 'Uncategorized'}</div>
        </div>
        ${product.image || product.imageUrl ? 
          `<img src="${product.image || product.imageUrl}" alt="${product.name}" class="product-image" />` :
          `<div class="placeholder">📦</div>`
        }
        <h1 style="text-align: center; margin: 20px 0;">${product.name}</h1>
        ${product.description ? `<p style="text-align: center; color: #64748b;">${product.description}</p>` : ''}
        <div class="price" style="text-align: center;">${formatCurrency(product.price)}</div>
        <div class="details">
          <div><strong>Category:</strong> ${product.category || 'Uncategorized'}</div>
          <div class="stock"><strong>Stock:</strong> ${stockCount} units ${stockStatus}</div>
          <div><strong>Status:</strong> ${product.status || 'active'}</div>
          ${product.views ? `<div><strong>Views:</strong> ${product.views}</div>` : ''}
          ${product.orders ? `<div><strong>Orders:</strong> ${product.orders}</div>` : ''}
          ${product.rating ? `<div><strong>Rating:</strong> ${product.rating.toFixed(1)} ⭐</div>` : ''}
        </div>
        <div style="margin-top: 40px; text-align: center; color: #64748b; border-top: 2px solid #e2e8f0; padding-top: 20px;">
          <p>Contact us to order this product!</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Share product via WhatsApp
  const shareProductWhatsApp = async (product: Product) => {
    const productUrl = `${window.location.origin}/products/${product.id}`;
    const message = `🛍️ Check out this product!\n\n*${product.name}*\n💰 Price: ${formatCurrency(product.price)}\n📦 Stock: ${product.stock || 0} available\n\nView details: ${productUrl}\n\nInterested? Reply to order!`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-box-open text-[#25D366]"></i>Products
          </h1>
          <p className="text-[#64748b] text-sm hidden md:block">Manage your inventory and listings</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {bulkMode && bulkSelected.length > 0 && (
            <button onClick={() => handleBulkStatusUpdate('active')} className="px-3 py-2 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600">
              <i className="fas fa-check mr-2"></i><span className="hidden md:inline">Activate</span>
            </button>
          )}
          {bulkMode && bulkSelected.length > 0 && (
            <button onClick={() => handleBulkDelete()} className="px-3 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600">
              <i className="fas fa-trash mr-2"></i><span className="hidden md:inline">Delete</span>
            </button>
          )}
          <button className="px-3 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={() => setCategoriesModalOpen(true)}>
            <i className="fas fa-layer-group mr-2"></i><span className="hidden md:inline">Categories</span>
          </button>
          <button className="px-3 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={exportProducts}>
            <i className="fas fa-file-export mr-2"></i><span className="hidden md:inline">Export</span>
          </button>
          <button onClick={() => setBulkMode(!bulkMode)} className={`px-3 py-2 rounded-xl font-semibold text-sm transition-all ${bulkMode ? 'bg-[#25D366] text-white' : 'bg-white border-2 border-[#e2e8f0] hover:border-[#25D366]'}`}>
            <i className="fas fa-check-square mr-2"></i><span className="hidden md:inline">Bulk</span>
          </button>
          <button className="px-3 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" onClick={() => setAddProductModalOpen(true)}>
            <i className="fas fa-plus mr-2"></i><span className="hidden md:inline">Add Product</span><span className="md:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6 hide-scrollbar">
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center">
            <i className="fas fa-box text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{products.length}</div>
            <div className="text-xs text-[#64748b]">Total Products</div>
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(59,130,246,0.1)] text-[#3b82f6] flex items-center justify-center">
            <i className="fas fa-dollar-sign text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{formatCurrency(totalInventoryValue)}</div>
            <div className="text-xs text-[#64748b]">Inventory Value</div>
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(245,158,11,0.1)] text-[#f59e0b] flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{lowStockProducts}</div>
            <div className="text-xs text-[#64748b]">Low Stock</div>
          </div>
        </div>
        
        <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
          <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.1)] text-[#ef4444] flex items-center justify-center">
            <i className="fas fa-times-circle text-sm"></i>
          </div>
          <div>
            <div className="font-extrabold text-lg">{outOfStockProducts}</div>
            <div className="text-xs text-[#64748b]">Out of Stock</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border border-[#e2e8f0]">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-3 py-2 bg-[#f8fafc] border-2 border-transparent rounded-xl text-sm focus:outline-none focus:border-[#25D366] w-full md:w-48" />
          </div>
          <select className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="all">Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out</option>
          </select>
          <div className="flex gap-2">
            <input 
              type="number" 
              placeholder="Min Price" 
              value={priceRangeMin} 
              onChange={(e) => setPriceRangeMin(e.target.value ? Number(e.target.value) : "")}
              className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm w-24"
            />
            <input 
              type="number" 
              placeholder="Max Price" 
              value={priceRangeMax} 
              onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : "")}
              className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm w-24"
            />
          </div>
          <div className="flex gap-2">
            <input 
              type="date" 
              value={dateRangeStart} 
              onChange={(e) => setDateRangeStart(e.target.value)}
              className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
            />
            <input 
              type="date" 
              value={dateRangeEnd} 
              onChange={(e) => setDateRangeEnd(e.target.value)}
              className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
            />
          </div>
          <select className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="price-low">Price ↑</option>
            <option value="price-high">Price ↓</option>
            <option value="stock-low">Stock ↑</option>
            <option value="stock-high">Stock ↓</option>
            <option value="name-az">Name A-Z</option>
            <option value="name-za">Name Z-A</option>
          </select>
        </div>
        <div className="flex bg-[#f8fafc] rounded-xl p-1 border-2 border-[#e2e8f0] self-end md:self-auto">
          <button onClick={() => setView("grid")} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${view === "grid" ? "bg-white shadow text-[#25D366]" : "text-[#64748b]"}`}>
            <i className="fas fa-th-large"></i>
          </button>
          <button onClick={() => setView("list")} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${view === "list" ? "bg-white shadow text-[#25D366]" : "text-[#64748b]"}`}>
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      <div className="flex gap-2 md:gap-3 mb-4 md:mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 md:px-5 py-2 rounded-full font-semibold text-sm whitespace-nowrap flex items-center gap-1 md:gap-2 transition-all ${activeCategory === cat.id ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg" : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"}`}>
            {cat.icon && <span>{cat.icon}</span>}
            {cat.label}
            <span className="px-1.5 md:px-2 py-0.5 rounded-full text-xs bg-white/20">{cat.count}</span>
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
        <>
          {bulkMode && filteredProducts.length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkSelected.length === filteredProducts.length && filteredProducts.length > 0}
                  onChange={selectAllProducts}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                />
                <span className="text-sm font-semibold text-[#64748b]">
                  Select All ({bulkSelected.length}/{filteredProducts.length})
                </span>
              </label>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {filteredProducts.map(product => {
              const stockStyle = getStockStyle(product.stock || 0);
              const badgeInfo = getBadgeStyle(product.stock || 0);
              return (
                <div key={product.id} className={`bg-white rounded-xl md:rounded-2xl border ${bulkSelected.includes(product.id) ? 'border-[#25D366] ring-2 ring-[#25D366]/20' : 'border-[#e2e8f0]'} overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all cursor-pointer relative`} onClick={() => !bulkMode && openProductModal(product)}>
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
                    <span className={`absolute top-3 left-3 px-2 md:px-3 py-0.5 rounded-full text-xs font-bold z-10 ${badgeInfo.badge === "out" ? "bg-[#64748b] text-white" : "bg-[#f59e0b] text-white"}`}>
                      {badgeInfo.label}
                    </span>
                  )}
                  {!bulkMode && product.status && product.status !== 'active' && (
                    <span className={`absolute top-3 right-3 px-2 md:px-3 py-0.5 rounded-full text-xs font-bold z-10 ${product.status === 'paused' ? 'bg-[#f59e0b] text-white' : 'bg-[#64748b] text-white'}`}>
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
) : (
        <>
          {/* Mobile List View */}
          <div className="md:hidden bg-white rounded-xl border border-[#e2e8f0] overflow-hidden divide-y divide-[#e2e8f0]">
            {filteredProducts.map(product => {
              const stockStyle = getStockStyle(product.stock || 0);
              return (
                <div key={product.id} className={`p-3 hover:bg-[#f8fafc] cursor-pointer flex items-center gap-3 ${bulkSelected.includes(product.id) ? 'bg-[rgba(37,211,102,0.05)]' : ''}`} onClick={() => !bulkMode && openProductModal(product)}>
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
          <div className="hidden md:block bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            {bulkMode && filteredProducts.length > 0 && (
              <div className="p-4 bg-[#f8fafc] border-b-2 border-[#e2e8f0] flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bulkSelected.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={selectAllProducts}
                    className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                  />
                  <span className="text-sm font-semibold text-[#64748b]">
                    Select All ({bulkSelected.length}/{filteredProducts.length})
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
            {filteredProducts.map(product => {
              const stockStyle = getStockStyle(product.stock || 0);
              return (
                <div key={product.id} className={`grid grid-cols-7 gap-4 p-4 border-b border-[#e2e8f0] items-center hover:bg-[rgba(37,211,102,0.02)] ${bulkSelected.includes(product.id) ? 'bg-[rgba(37,211,102,0.05)]' : ''}`}>
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
                          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg"
                          title={product.status === 'active' ? 'Pause' : 'Activate'}
                        >
                          <i className={`fas ${product.status === 'active' ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateProduct(product);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded-lg"
                          title="Duplicate"
                        >
                          <i className="fas fa-copy text-xs"></i>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareProduct(product);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg"
                          title="Share"
                        >
                          <i className="fas fa-share-alt text-xs"></i>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            shareProductWhatsApp(product);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg"
                          title="Send via WhatsApp"
                        >
                          <i className="fab fa-whatsapp text-xs"></i>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            printProductCatalog(product);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded-lg"
                          title="Print Product"
                        >
                          <i className="fas fa-print text-xs"></i>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(product.id);
                          }}
                          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-red-500 hover:bg-[#f1f5f9] rounded-lg"
                          title="Delete"
                        >
                          <i className="fas fa-trash text-xs"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
              </div>
              <h3 className="text-xl font-bold text-[#1e293b] mb-2">Delete Product?</h3>
              <p className="text-[#64748b]">
                This action cannot be undone. The product and all associated data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#25D366] hover:text-[#25D366] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
              >
                <i className="fas fa-trash mr-2"></i>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
