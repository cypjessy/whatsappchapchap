"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHaptics, useClipboard, useShare, useToast } from "@/hooks/useNativeAndroid";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";
import { useStatusBar } from "@/hooks/useStatusBar";
import {
  productService,
  Product,
  categoryService,
} from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import {
  Loader2,
  SearchX,
  Plus,
  SlidersHorizontal,
  X,
  PackageOpen,
  ArrowUp,
} from "lucide-react";
import ViewProductModal from "@/components/products/ViewProductModal";
import ViewProductModalDesktop from "@/components/products/ViewProductModalDesktop";
import AddProductModal from "@/components/products/AddProductModal";
import {
  ProductStats,
  ProductFilters,
  ProductCategoryTabs,
  ProductGridView,
  ProductListView,
  ProductBulkActionsToolbar,
  DeleteConfirmModal,
  ProductsHeader,
} from "./components";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Constants ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "from-[#fce7f3] to-[#fbcfe8]",
  "from-[#e0e7ff] to-[#c7d2fe]",
  "from-[#dcfce7] to-[#bbf7d0]",
  "from-[#fef3c7] to-[#fde68a]",
  "from-[#e0f2fe] to-[#bae6fd]",
  "from-[#f3e8ff] to-[#e9d5ff]",
  "from-[#ffedd5] to-[#fed7aa]",
  "from-[#f1f5f9] to-[#e2e8f0]",
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold
            animate-slideUp transition-all duration-300
            ${toast.type === "success" ? "bg-[#10b981] text-white" : ""}
            ${toast.type === "error" ? "bg-[#ef4444] text-white" : ""}
            ${toast.type === "info" ? "bg-[#3b82f6] text-white" : ""}
          `}
        >
          <span>{toast.message}</span>
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", toggle);
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 left-4 z-40 w-10 h-10 rounded-full bg-white shadow-lg border border-[#e2e8f0] flex items-center justify-center text-[#25D366] hover:bg-[#f0fdf4] hover:border-[#25D366] transition-all active:scale-90"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

function EmptyState({
  hasProducts,
  onAddProduct,
  onClearFilters,
}: {
  hasProducts: boolean;
  onAddProduct: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] shadow-sm animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-5 shadow-inner">
        <SearchX className="w-8 h-8 md:w-10 md:h-10 text-[#cbd5e1]" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-[#1e293b] mb-2 text-center">
        {hasProducts ? "No matching products" : "No products yet"}
      </h3>
      <p className="text-sm text-[#64748b] text-center max-w-sm mb-6 px-4">
        {hasProducts
          ? "Try adjusting your filters or search terms to find what you're looking for."
          : "Add your first product to start selling on WhatsApp."}
      </p>
      {hasProducts ? (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] transition-all active:scale-95"
        >
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      ) : (
        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add First Product
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 md:py-28 animate-fadeIn">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] flex items-center justify-center shadow-lg">
          <Loader2 className="w-7 h-7 text-[#25D366] animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-[#25D366]/20 animate-ping" />
      </div>
      <p className="mt-5 text-sm font-medium text-[#64748b]">Loading products...</p>
      <p className="mt-1 text-xs text-[#94a3b8]">This may take a moment</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user } = useAuth();
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const { copy } = useClipboard();
  const { share } = useShare();
  const { show: showToastNative } = useToast();

  // Status bar: green when at top, white when scrolled
  const [headerScrolled, setHeaderScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  useStatusBar({
    color: headerScrolled ? '#ffffff' : '#25D366',
    style: headerScrolled ? 'dark' : 'light'
  });

  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Pagination state
  const ITEMS_PER_PAGE = 20;
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // UI state
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRangeMin, setPriceRangeMin] = useState<number | "">("");
  const [priceRangeMax, setPriceRangeMax] = useState<number | "">("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  // Modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);

  // Bulk state
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Register modals for Android back button handling
  useModalBackHandler(productModalOpen, () => setProductModalOpen(false));
  useModalBackHandler(addProductModalOpen, () => setAddProductModalOpen(false));
  useModalBackHandler(showDeleteConfirm !== null, () => setShowDeleteConfirm(null));

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  // Scroll position restore
  const scrollPosRef = useRef(0);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = `toast-${++toastIdRef.current}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load data
  useEffect(() => {
    if (!user) return;
    loadProducts();
    loadCategories();
  }, [user]);

  const loadProducts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await productService.getProducts(user);
      setProducts(data);
      // Initialize displayed products with first page
      setDisplayedProducts(data.slice(0, ITEMS_PER_PAGE));
      setCurrentPage(1);
      setHasMore(data.length > ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error loading products:", error);
      addToast("Failed to load products", "error");
      setProducts([]);
      setDisplayedProducts([]);
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  const loadCategories = useCallback(async () => {
    if (!user) return;
    setLoadingCategories(true);
    try {
      const customCategories = await categoryService.getCategories(user);
      setProductCategories(
        customCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || "📦",
        }))
      );
    } catch (error) {
      console.error("Error loading categories:", error);
      setProductCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  }, [user]);

  // Derived data
  const categories = useMemo(
    () => [
      { id: "all", label: "All Products", count: products.length, icon: null },
      ...productCategories.map((cat) => ({
        id: cat.id,
        label: cat.name,
        count: products.filter((p) => p.category === cat.id).length,
        icon: cat.icon,
      })),
    ],
    [products, productCategories]
  );

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = activeCategory === "all" || p.category === activeCategory;
        const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const stock = p.stock || 0;
        const matchesStock =
          stockFilter === "all" ||
          (stockFilter === "in" && stock > 5) ||
          (stockFilter === "low" && stock > 0 && stock <= 5) ||
          (stockFilter === "out" && stock === 0);
        const matchesPriceMin = priceRangeMin === "" || p.price >= Number(priceRangeMin);
        const matchesPriceMax = priceRangeMax === "" || p.price <= Number(priceRangeMax);

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
      })
      .sort((a, b) => {
        const getDate = (p: Product) => (p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt)).getTime();
        switch (sortBy) {
          case "newest": return getDate(b) - getDate(a);
          case "oldest": return getDate(a) - getDate(b);
          case "price-low": return a.price - b.price;
          case "price-high": return b.price - a.price;
          case "stock-low": return (a.stock || 0) - (b.stock || 0);
          case "stock-high": return (b.stock || 0) - (a.stock || 0);
          case "name-az": return a.name.localeCompare(b.name);
          case "name-za": return b.name.localeCompare(a.name);
          default: return 0;
        }
      });
  }, [products, activeCategory, searchTerm, stockFilter, sortBy, priceRangeMin, priceRangeMax, dateRangeStart, dateRangeEnd]);

  // Update displayed products when filters change
  useEffect(() => {
    const filtered = filteredProducts;
    setDisplayedProducts(filtered.slice(0, ITEMS_PER_PAGE));
    setCurrentPage(1);
    setHasMore(filtered.length > ITEMS_PER_PAGE);
  }, [filteredProducts]);

  // Load more products for infinite scroll
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = 0;
    const endIndex = nextPage * ITEMS_PER_PAGE;
    
    setTimeout(() => {
      setDisplayedProducts(filteredProducts.slice(startIndex, endIndex));
      setCurrentPage(nextPage);
      setHasMore(endIndex < filteredProducts.length);
      setIsLoadingMore(false);
    }, 100);
  }, [currentPage, hasMore, isLoadingMore, filteredProducts]);

  // Analytics
  const stats = useMemo(() => {
    const totalInventoryValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 0), 0);
    const lowStockProducts = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) <= 5).length;
    const outOfStockProducts = products.filter((p) => (p.stock || 0) === 0).length;
    return { totalInventoryValue, lowStockProducts, outOfStockProducts };
  }, [products]);

  // Handlers
  const handleToggleStatus = useCallback(
    async (product: Product) => {
      if (!user) return;
      
      await impactLight();
      
      const newStatus = product.status === "active" ? "paused" : "active";
      try {
        await productService.updateProduct(user, product.id, { status: newStatus });
        await notificationSuccess();
        await showToastNative({ text: `Product ${newStatus === "active" ? "activated" : "paused"}`, duration: 'short' });
        loadProducts();
      } catch (error) {
        console.error("Error updating product:", error);
        await notificationError();
        await showToastNative({ text: 'Failed to update product', position: 'top' });
      }
    },
    [user, loadProducts, impactLight, notificationSuccess, notificationError, showToastNative]
  );

  const handleShareProduct = useCallback(async (product: Product) => {
    await impactLight();
    
    const shareUrl = `${window.location.origin}/products/${product.id}`;
    const shareText = `Check out ${product.name} - ${formatCurrency(product.price)}`;

    const success = await share({
      title: product.name,
      text: shareText,
      url: shareUrl
    });
    
    if (success) {
      await showToastNative({ text: 'Shared successfully', duration: 'short' });
    }
  }, [impactLight, share, showToastNative]);

  const handleDuplicateProduct = useCallback(
    async (product: Product) => {
      if (!user) return;
      
      await impactLight();
      
      try {
        const { id, createdAt, updatedAt, ...duplicated } = product;
        await productService.createProduct(user, {
          ...duplicated,
          name: `${product.name} (Copy)`,
          status: "draft",
          views: 0,
          orders: 0,
        });
        await notificationSuccess();
        await showToastNative({ text: 'Product duplicated', duration: 'short' });
        loadProducts();
      } catch (error) {
        console.error("Error duplicating product:", error);
        await notificationError();
        await showToastNative({ text: 'Failed to duplicate product', position: 'top' });
      }
    },
    [user, loadProducts, impactLight, notificationSuccess, notificationError, showToastNative]
  );

  const handleDeleteProduct = useCallback(
    async (productId: string) => {
      if (!user) return;
      
      await impactMedium();
      setDeleteLoading(true);
      
      try {
        await productService.deleteProduct(user, productId);
        await showToastNative({ text: 'Product deleted', duration: 'short' });
        loadProducts();
        setShowDeleteConfirm(null);
        setBulkSelected((prev) => prev.filter((id) => id !== productId));
      } catch (error) {
        console.error("Error deleting product:", error);
        await notificationError();
        await showToastNative({ text: 'Failed to delete product', position: 'top' });
      } finally {
        setDeleteLoading(false);
      }
    },
    [user, loadProducts, impactMedium, notificationError, showToastNative]
  );

  // Bulk handlers
  const toggleBulkSelect = useCallback(async (productId: string) => {
    await impactLight();
    setBulkSelected((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  }, [impactLight]);

  const selectAllProducts = useCallback(() => {
    setBulkSelected((prev) => (prev.length === filteredProducts.length ? [] : filteredProducts.map((p) => p.id)));
  }, [filteredProducts]);

  const handleBulkStatusUpdate = useCallback(
    async (newStatus: "active" | "paused" | "draft") => {
      if (!user || bulkSelected.length === 0) return;
      
      await impactMedium();
      setBulkLoading(true);
      
      try {
        await Promise.all(bulkSelected.map((id) => productService.updateProduct(user, id, { status: newStatus })));
        await notificationSuccess();
        await showToastNative({ text: `${bulkSelected.length} products updated`, duration: 'short' });
        loadProducts();
        setBulkSelected([]);
        setBulkMode(false);
      } catch (error) {
        console.error("Error bulk updating:", error);
        await notificationError();
        await showToastNative({ text: 'Failed to update products', position: 'top' });
      } finally {
        setBulkLoading(false);
      }
    },
    [user, bulkSelected, loadProducts, impactMedium, notificationSuccess, notificationError, showToastNative]
  );

  const handleBulkDelete = useCallback(async () => {
    if (!user || bulkSelected.length === 0) return;
    
    await impactMedium();
    setBulkLoading(true);
    
    try {
      await Promise.all(bulkSelected.map((id) => productService.deleteProduct(user, id)));
      await showToastNative({ text: `${bulkSelected.length} products deleted`, duration: 'short' });
      loadProducts();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error bulk deleting:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to delete products', position: 'top' });
    } finally {
      setBulkLoading(false);
    }
  }, [user, bulkSelected, loadProducts, impactMedium, notificationError, showToastNative]);

  // Export/Import
  const exportProducts = useCallback(() => {
    const headers = ["Name", "Category", "Price", "Stock", "Description"];
    const rows = products.map((p) => [p.name, p.category || "", p.price, p.stock || 0, p.description || ""]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `products_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    addToast("Products exported", "success");
  }, [products, addToast]);

  const importProducts = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user) return;

      try {
        const text = await file.text();
        const lines = text.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          addToast("CSV file is empty", "error");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        let imported = 0;

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const data: Record<string, unknown> = {};
          headers.forEach((h, idx) => {
            const val = values[idx] || "";
            data[h] = h === "price" || h === "stock" ? Number(val) || 0 : val;
          });

          if (data.name && data.price) {
            await productService.createProduct(user, {
              name: String(data.name),
              category: String(data.category || "other"),
              price: Number(data.price),
              stock: Number(data.stock || 0),
              description: String(data.description || ""),
            });
            imported++;
          }
        }

        loadProducts();
        addToast(`${imported} products imported`, "success");
      } catch (err) {
        console.error("Import error:", err);
        addToast("Failed to import products", "error");
      } finally {
        event.target.value = "";
      }
    },
    [user, loadProducts, addToast]
  );

  // Print & WhatsApp
  const printProductCatalog = useCallback((product: Product) => {
    const stock = product.stock || 0;
    const stockStatus = stock === 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock";
    const stockColor = stock > 5 ? "#10b981" : stock > 0 ? "#f59e0b" : "#ef4444";

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${product.name}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; }
          .brand { font-size: 14px; font-weight: 800; color: #25D366; letter-spacing: 0.1em; text-transform: uppercase; }
          .image { width: 100%; height: 300px; object-fit: cover; border-radius: 16px; margin: 20px 0; }
          .placeholder { width: 100%; height: 300px; background: linear-gradient(135deg, #f0fdf4, #e0e7ff); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 80px; }
          h1 { font-size: 28px; font-weight: 800; margin: 20px 0 10px; color: #1e293b; }
          .price { font-size: 32px; font-weight: 800; color: #25D366; margin: 20px 0; }
          .stock { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 600; font-size: 14px; background: ${stockColor}15; color: ${stockColor}; border: 2px solid ${stockColor}30; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 12px; }
          .meta-item { font-size: 13px; color: #64748b; }
          .meta-item strong { color: #1e293b; display: block; margin-bottom: 4px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 13px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Product Catalog</div>
          <div style="color: #94a3b8; font-size: 12px; margin-top: 4px;">${product.category || "Uncategorized"}</div>
        </div>
        ${product.image || product.imageUrl
          ? `<img src="${product.image || product.imageUrl}" alt="${product.name}" class="image" />`
          : `<div class="placeholder">📦</div>`
        }
        <h1>${product.name}</h1>
        ${product.description ? `<p style="color: #64748b; line-height: 1.6;">${product.description}</p>` : ""}
        <div class="price">${formatCurrency(product.price)}</div>
        <div class="stock">${stock} units — ${stockStatus}</div>
        <div class="meta">
          <div class="meta-item"><strong>Category</strong>${product.category || "Uncategorized"}</div>
          <div class="meta-item"><strong>Status</strong>${product.status || "active"}</div>
          ${product.views ? `<div class="meta-item"><strong>Views</strong>${product.views}</div>` : ""}
          ${product.orders ? `<div class="meta-item"><strong>Orders</strong>${product.orders}</div>` : ""}
          ${product.rating ? `<div class="meta-item"><strong>Rating</strong>${product.rating.toFixed(1)} ★</div>` : ""}
        </div>
        <div class="footer">
          <p>Scan QR or visit our store to order</p>
        </div>
      </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.print();
  }, []);

  const shareProductWhatsApp = useCallback((product: Product) => {
    const url = `${window.location.origin}/products/${product.id}`;
    const msg = `🛍️ *${product.name}*\n💰 ${formatCurrency(product.price)}\n📦 ${product.stock || 0} available\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  }, []);

  // Helpers
  const getCategoryEmoji = useCallback(
    (category: string) => productCategories.find((c) => c.id === category)?.icon || "📦",
    [productCategories]
  );

  const getCategoryColor = useCallback(
    (category: string) => {
      const idx = productCategories.findIndex((c) => c.id === category);
      return CATEGORY_COLORS[idx >= 0 ? idx % CATEGORY_COLORS.length : 0];
    },
    [productCategories]
  );

  const getBadgeStyle = useCallback((stock: number) => {
    if (stock === 0) return { badge: "out", label: "Out of Stock" };
    if (stock <= 5) return { badge: "low", label: "Low Stock" };
    return { badge: "new", label: "In Stock" };
  }, []);

  const getStockStyle = useCallback((stock: number) => {
    if (stock === 0) return { color: "#ef4444", width: "0%" };
    if (stock <= 5) return { color: "#ef4444", width: "10%" };
    if (stock <= 20) return { color: "#f59e0b", width: "30%" };
    return { color: "#10b981", width: "75%" };
  }, []);

  const openProductModal = useCallback((product: Product) => {
    scrollPosRef.current = window.scrollY;
    setSelectedProduct(product);
    setProductModalOpen(true);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setStockFilter("all");
    setPriceRangeMin("");
    setPriceRangeMax("");
    setDateRangeStart("");
    setDateRangeEnd("");
    setActiveCategory("all");
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (stockFilter !== "all") count++;
    if (priceRangeMin !== "") count++;
    if (priceRangeMax !== "") count++;
    if (dateRangeStart) count++;
    if (dateRangeEnd) count++;
    if (activeCategory !== "all") count++;
    return count;
  }, [searchTerm, stockFilter, priceRangeMin, priceRangeMax, dateRangeStart, dateRangeEnd, activeCategory]);

  // Exit bulk mode when filters change
  useEffect(() => {
    if (bulkMode) setBulkSelected([]);
  }, [searchTerm, stockFilter, activeCategory, sortBy, priceRangeMin, priceRangeMax, dateRangeStart, dateRangeEnd]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer.observe(sentinel);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMoreProducts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (productModalOpen) setProductModalOpen(false);
        if (addProductModalOpen) setAddProductModalOpen(false);
        if (showDeleteConfirm) setShowDeleteConfirm(null);
        if (bulkMode) {
          setBulkMode(false);
          setBulkSelected([]);
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "a" && bulkMode) {
        e.preventDefault();
        selectAllProducts();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [productModalOpen, addProductModalOpen, showDeleteConfirm, bulkMode, selectAllProducts]);

  // Restore scroll after modal close
  useEffect(() => {
    if (!productModalOpen && scrollPosRef.current > 0) {
      window.scrollTo({ top: scrollPosRef.current, behavior: "instant" });
      scrollPosRef.current = 0;
    }
  }, [productModalOpen]);

  return (
    <div className="overflow-x-hidden px-3 md:px-6 py-0 md:py-4 pb-2 bg-white">
      {/* Products Header - Desktop only (TopBar handles mobile) */}
      <div className="hidden md:block">
        <ProductsHeader
          productsCount={products.length}
          totalInventoryValue={stats.totalInventoryValue}
          lowStockCount={stats.lowStockProducts}
          outOfStockCount={stats.outOfStockProducts}
          bulkMode={bulkMode}
          setBulkMode={(mode) => {
            setBulkMode(mode);
            if (mode) setBulkSelected([]);
          }}
          setAddProductModalOpen={setAddProductModalOpen}
          exportProducts={exportProducts}
          importProducts={importProducts}
        />
      </div>

      {/* Mobile Add Button - Visible at top of page with spacing from top bar */}
      <div className="md:hidden px-3 mt-3 mb-3">
        <button
          onClick={() => setAddProductModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      <main className="px-0 md:pt-4 space-y-2 md:space-y-6">
        <ProductStats
          totalProducts={products.length}
          inventoryValue={stats.totalInventoryValue}
          lowStockCount={stats.lowStockProducts}
          outOfStockCount={stats.outOfStockProducts}
          isLoading={loading}
          onCardClick={(type) => {
            if (type === "low") setStockFilter("low");
            if (type === "out") setStockFilter("out");
            if (type === "all") setStockFilter("all");
          }}
        />

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
          isLoading={loading}
          totalResults={filteredProducts.length}
          onClearAll={clearAllFilters}
        />

        <ProductCategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        {activeFiltersCount > 0 && !bulkMode && (
          <div className="flex items-center gap-2 text-xs text-[#64748b] animate-fadeIn">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              Showing <span className="font-bold text-[#1e293b]">{filteredProducts.length}</span> of {products.length} products
            </span>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 ml-2 px-2 py-1 rounded-lg bg-[#f1f5f9] hover:bg-red-50 hover:text-red-500 transition-colors text-[10px] font-bold"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            hasProducts={products.length > 0}
            onAddProduct={() => setAddProductModalOpen(true)}
            onClearFilters={clearAllFilters}
          />
        ) : (
          <>
            {bulkMode && (
              <ProductBulkActionsToolbar
                bulkSelected={bulkSelected}
                filteredProductsCount={filteredProducts.length}
                onBulkStatusUpdate={handleBulkStatusUpdate}
                onBulkDelete={handleBulkDelete}
                onSelectAll={selectAllProducts}
                onCancel={() => {
                  setBulkMode(false);
                  setBulkSelected([]);
                }}
                isLoading={bulkLoading}
              />
            )}

            {view === "grid" ? (
              <ProductGridView
                products={displayedProducts}
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
            ) : (
              <ProductListView
                products={displayedProducts}
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

            {/* Infinite Scroll Sentinel */}
            {!loading && hasMore && (
              <div id="scroll-sentinel" className="py-8 flex items-center justify-center">
                {isLoadingMore ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-[#25D366] animate-spin" />
                    <span className="text-sm text-[#64748b]">Loading more products...</span>
                  </div>
                ) : (
                  <div className="h-1" />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {/* Mobile ViewProductModal */}
      <div className="md:hidden">
        <ViewProductModal
          isOpen={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          product={selectedProduct}
          onEdit={async () => {
            await impactLight();
            setAddProductModalOpen(true);
            setProductModalOpen(false);
          }}
        />
      </div>
      
      {/* Desktop ViewProductModal */}
      <div className="hidden md:block">
        <ViewProductModalDesktop
          isOpen={productModalOpen}
          onClose={() => setProductModalOpen(false)}
          product={selectedProduct}
          onEdit={async () => {
            await impactLight();
            setAddProductModalOpen(true);
            setProductModalOpen(false);
          }}
        />
      </div>
      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        onSuccess={async () => {
          await notificationSuccess();
          await showToastNative({ text: 'Product added successfully', duration: 'short' });
          loadProducts();
        }}
      />
      <DeleteConfirmModal
        isOpen={showDeleteConfirm !== null}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDeleteProduct(showDeleteConfirm)}
        productName={products.find((p) => p.id === showDeleteConfirm)?.name}
        isLoading={deleteLoading}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ScrollToTop />
    </div>
  );
}