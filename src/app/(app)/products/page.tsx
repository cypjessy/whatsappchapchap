"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService, Product, categoryService, defaultProductCategories, ProductCategory } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import CategoriesModal from "@/components/categories/CategoriesModal";
import ViewProductModal from "@/components/products/ViewProductModal";
import AddProductModal from "@/components/products/AddProductModal";
import {
  ProductStats,
  ProductFilters,
  ProductCategoryTabs,
  ProductGridView,
  ProductListView,
  ProductBulkActionsToolbar,
  DeleteConfirmModal,
} from "./components";

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
      {/* Header */}
      <div className="px-3 pt-3 flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3 animate-fadeIn">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-box-open text-[#25D366]"></i>Products
          </h1>
          <p className="text-[#64748b] text-sm hidden md:block">Manage your inventory and listings</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
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

      {/* Stats */}
      <div className="px-3">
      <ProductStats
        totalProducts={products.length}
        inventoryValue={totalInventoryValue}
        lowStockCount={lowStockProducts}
        outOfStockCount={outOfStockProducts}
      />
      </div>

      {/* Filters */}
      <div className="px-3">
        <ProductFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          priceRangeMin={priceRangeMin}
          setPriceRangeMin={setPriceRangeMin}
          priceRangeMax={priceRangeMax}
          setPriceRangeMax={setPriceRangeMax}
          dateRangeStart={dateRangeStart}
          setDateRangeStart={setDateRangeStart}
          dateRangeEnd={dateRangeEnd}
          setDateRangeEnd={setDateRangeEnd}
          sortBy={sortBy}
          setSortBy={setSortBy}
          view={view}
          setView={setView}
        />
      </div>

      {/* Category Tabs */}
      <div className="px-3">
        <ProductCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </div>

      {/* Content Area */}
      <div className="px-3">
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
        ) : (
          <>
            {/* Bulk Actions Toolbar */}
            {bulkMode && filteredProducts.length > 0 && (
              <ProductBulkActionsToolbar
                bulkSelected={bulkSelected}
                filteredProductsCount={filteredProducts.length}
                onBulkStatusUpdate={(status) => handleBulkStatusUpdate(status)}
                onBulkDelete={handleBulkDelete}
                onSelectAll={selectAllProducts}
                onCancel={() => setBulkMode(false)}
              />
            )}

            {/* Grid View */}
            {view === "grid" && (
              <ProductGridView
                products={filteredProducts}
                bulkMode={bulkMode}
                bulkSelected={bulkSelected}
                toggleBulkSelect={toggleBulkSelect}
                selectAllProducts={selectAllProducts}
                openProductModal={openProductModal}
                handleToggleStatus={handleToggleStatus}
                handleDuplicateProduct={handleDuplicateProduct}
                handleShareProduct={handleShareProduct}
                shareProductWhatsApp={shareProductWhatsApp}
                printProductCatalog={printProductCatalog}
                getCategoryEmoji={getCategoryEmoji}
                getCategoryColor={getCategoryColor}
                getStockStyle={getStockStyle}
                getBadgeStyle={getBadgeStyle}
              />
            )}

            {/* List View */}
            {view === "list" && (
              <ProductListView
                products={filteredProducts}
                bulkMode={bulkMode}
                bulkSelected={bulkSelected}
                toggleBulkSelect={toggleBulkSelect}
                selectAllProducts={selectAllProducts}
                openProductModal={openProductModal}
                handleToggleStatus={handleToggleStatus}
                handleDuplicateProduct={handleDuplicateProduct}
                handleShareProduct={handleShareProduct}
                shareProductWhatsApp={shareProductWhatsApp}
                printProductCatalog={printProductCatalog}
                getCategoryEmoji={getCategoryEmoji}
                getCategoryColor={getCategoryColor}
                getStockStyle={getStockStyle}
              />
            )}
          </>
        )}
      </div>
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
      <DeleteConfirmModal
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDeleteProduct(showDeleteConfirm)}
        productName={products.find(p => p.id === showDeleteConfirm)?.name}
      />
    </div>
  );
}
