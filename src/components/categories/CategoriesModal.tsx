"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService, Product, categoryService, ProductCategory, defaultProductCategories } from "@/lib/db";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  productCount: number;
  views: number;
  status: "active" | "hidden";
  isCustom?: boolean;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onCategorySelect?: (category: string) => void;
  selectMode?: boolean;
}

const defaultCategories: Category[] = [
  { id: "1", name: "Electronics", icon: "💻", color: "#e0e7ff", productCount: 245, views: 12500, status: "active" },
  { id: "2", name: "Fashion", icon: "👗", color: "#fce7f3", productCount: 189, views: 8300, status: "active" },
  { id: "3", name: "Home & Living", icon: "🏠", color: "#fef3c7", productCount: 156, views: 6700, status: "active" },
  { id: "4", name: "Sports & Outdoors", icon: "⚽", color: "#dcfce7", productCount: 98, views: 4200, status: "active" },
  { id: "5", name: "Beauty & Health", icon: "💄", color: "#fce7f3", productCount: 134, views: 5900, status: "active" },
  { id: "6", name: "Books & Stationery", icon: "📚", color: "#f3f4f6", productCount: 67, views: 2100, status: "hidden" },
  { id: "7", name: "Toys & Games", icon: "🎮", color: "#ffedd5", productCount: 89, views: 3800, status: "active" },
  { id: "8", name: "Grocery & Food", icon: "🥬", color: "#ecfdf5", productCount: 234, views: 15200, status: "hidden" },
];

const icons = ["💻", "👗", "🏠", "⚽", "💄", "📚", "🎮", "🥬", "🎵", "🚗", "🐾", "🎁"];
const colors = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#06b6d4", "#f97316"];

export default function CategoriesModal({ isOpen, onClose, products, onCategorySelect, selectMode }: CategoriesModalProps) {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", icon: "💻", color: "#8b5cf6" });
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories from database + defaults
  useEffect(() => {
    if (!user || !isOpen) return;
    loadCategories();
  }, [user, isOpen]);

  const loadCategories = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get custom categories from database
      const customCategories = await categoryService.getCategories(user);
      
      // Calculate product counts for each category
      const productCounts: Record<string, number> = {};
      products.forEach(p => {
        const cat = p.category || "other";
        productCounts[cat] = (productCounts[cat] || 0) + 1;
      });

      // Map custom categories with product counts
      const customCats: Category[] = customCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        productCount: productCounts[cat.id] || 0,
        views: 0,
        status: "active" as const,
        isCustom: true,
      }));

      setCategories(customCats);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = products.length;
  const activeCount = categories.filter(c => c.status === "active").length;
  const hiddenCount = categories.filter(c => c.status === "hidden").length;

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (type: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleCategoryClick = (category: Category) => {
    if (selectMode && onCategorySelect) {
      onCategorySelect(category.id);
      onClose();
    } else {
      setSelectedCategory(category);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", icon: "💻", color: "#8b5cf6" });
    setFormModalOpen(true);
  };

  const editCategory = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setFormData({ name: category.name, description: "", icon: category.icon, color: category.color });
    setFormModalOpen(true);
  };

  const deleteCategory = async (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!category.isCustom) {
      showToast("error", "Cannot delete default categories");
      return;
    }
    if (confirm(`Are you sure you want to delete "${category.name}"? This will move all products to "Uncategorized".`)) {
      try {
        await categoryService.deleteCategory(user!, category.id);
        setCategories(prev => prev.filter(c => c.id !== category.id));
        showToast("success", `Category "${category.name}" deleted`);
      } catch (error) {
        console.error("Error deleting category:", error);
        showToast("error", "Failed to delete category");
      }
    }
  };

  const saveCategory = async () => {
    if (!formData.name) {
      showToast("error", "Please enter a category name");
      return;
    }

    if (editingCategory) {
      // Update existing custom category
      if (editingCategory.isCustom) {
        try {
          await categoryService.updateCategory(user!, editingCategory.id, {
            name: formData.name,
            icon: formData.icon,
            color: formData.color,
          });
        } catch (error) {
          console.error("Error updating category:", error);
        }
      }
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id 
          ? { ...c, name: formData.name, icon: formData.icon, color: formData.color }
          : c
      ));
      showToast("success", `Category "${formData.name}" updated`);
    } else {
      // Create new custom category
      try {
        const newCat = await categoryService.createCategory(user!, {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
          description: formData.description,
          isDefault: false,
        });
        const newCategory: Category = {
          id: newCat.id,
          name: newCat.name,
          icon: newCat.icon,
          color: newCat.color,
          productCount: 0,
          views: 0,
          status: "active",
          isCustom: true,
        };
        setCategories(prev => [...prev, newCategory]);
        showToast("success", `Category "${formData.name}" created`);
      } catch (error) {
        console.error("Error creating category:", error);
        showToast("error", "Failed to create category");
      }
    }
    setFormModalOpen(false);
  };

  const saveChanges = () => {
    showToast("success", "All changes saved successfully");
    onClose();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return num.toString();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-[20px] w-full max-w-[900px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="p-7 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] rounded-[12px] flex items-center justify-center text-white text-2xl shadow-lg">
                <i className="fas fa-layer-group"></i>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1e293b]">Categories</h2>
                <p className="text-sm text-[#64748b]">Organize your products into categories</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="w-11 h-11 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-[8px]">
                <i className="fas fa-question-circle"></i>
              </button>
              <button className="w-11 h-11 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-[8px] transition-all" onClick={onClose}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center gap-4 flex-wrap">
            <div className="flex gap-4 items-center flex-1">
              <div className="relative w-[280px]">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
                <input 
                  type="text" 
                  placeholder="Search categories..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[8px] text-sm focus:outline-none focus:border-[#8b5cf6] focus:bg-white transition-all"
                />
              </div>
              <div className="flex bg-[#f8fafc] rounded-[8px] p-1 border-2 border-[#e2e8f0]">
                <button 
                  onClick={() => setViewMode("grid")} 
                  className={`px-4 py-2 rounded-[6px] text-sm transition-all ${viewMode === "grid" ? "bg-white shadow text-[#8b5cf6] font-semibold" : "text-[#64748b]"}`}
                >
                  <i className="fas fa-th-large"></i>
                </button>
                <button 
                  onClick={() => setViewMode("list")} 
                  className={`px-4 py-2 rounded-[6px] text-sm transition-all ${viewMode === "list" ? "bg-white shadow text-[#8b5cf6] font-semibold" : "text-[#64748b]"}`}
                >
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-[8px] font-semibold text-sm hover:border-[#8b5cf6] flex items-center gap-2 transition-all">
                <i className="fas fa-expand-alt"></i>
                Expand
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-[8px] font-semibold text-sm shadow-lg flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={openAddModal}>
                <i className="fas fa-plus"></i>
                Add Category
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-[#f8fafc] rounded-[12px] p-5 text-center border-2 border-[#e2e8f0] hover:border-[#8b5cf6] hover:-translate-y-0.5 transition-all">
                <div className="text-4xl font-extrabold text-[#8b5cf6] mb-1">{categories.length}</div>
                <div className="text-sm font-semibold text-[#64748b]">Total Categories</div>
              </div>
              <div className="bg-[#f8fafc] rounded-[12px] p-5 text-center border-2 border-[#e2e8f0] hover:border-[#8b5cf6] hover:-translate-y-0.5 transition-all">
                <div className="text-4xl font-extrabold text-[#8b5cf6] mb-1">{totalProducts}</div>
                <div className="text-sm font-semibold text-[#64748b]">Total Products</div>
              </div>
              <div className="bg-[#f8fafc] rounded-[12px] p-5 text-center border-2 border-[#e2e8f0] hover:border-[#8b5cf6] hover:-translate-y-0.5 transition-all">
                <div className="text-4xl font-extrabold text-[#10b981] mb-1">{activeCount}</div>
                <div className="text-sm font-semibold text-[#64748b]">Active</div>
              </div>
              <div className="bg-[#f8fafc] rounded-[12px] p-5 text-center border-2 border-[#e2e8f0] hover:border-[#8b5cf6] hover:-translate-y-0.5 transition-all">
                <div className="text-4xl font-extrabold text-[#64748b] mb-1">{hiddenCount}</div>
                <div className="text-sm font-semibold text-[#64748b]">Hidden</div>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredCategories.map(category => (
                  <div 
                    key={category.id} 
                    className={`bg-white border-2 border-[#e2e8f0] rounded-[12px] p-6 cursor-pointer transition-all hover:border-[#8b5cf6] hover:-translate-y-1 hover:shadow-lg relative overflow-hidden ${selectedCategory?.id === category.id ? "border-[#8b5cf6] bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)] shadow-md" : ""}`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] opacity-0 transition-opacity"></div>
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        className="w-14 h-14 rounded-[8px] flex items-center justify-center text-3xl"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.icon}
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="w-8 h-8 rounded-[8px] border-none bg-[#f8fafc] text-[#64748b] cursor-pointer flex items-center justify-center text-sm hover:bg-[#8b5cf6] hover:text-white transition-all"
                          onClick={(e) => editCategory(category, e)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="w-8 h-8 rounded-[8px] border-none bg-[#f8fafc] text-[#64748b] cursor-pointer flex items-center justify-center text-sm hover:bg-[#ef4444] hover:text-white transition-all"
                          onClick={(e) => deleteCategory(category, e)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-2 text-[#1e293b]">{category.name}</h3>
                      <div className="flex gap-4 text-sm text-[#64748b]">
                        <span className="flex items-center gap-1">
                          <i className="fas fa-box"></i> {category.productCount} products
                        </span>
                        <span className="flex items-center gap-1">
                          <i className="fas fa-eye"></i> {formatNumber(category.views)} views
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[20px] text-xs font-bold uppercase mt-4 ${category.status === "active" ? "bg-[rgba(37,211,102,0.1)] text-[#10b981]" : "bg-[rgba(100,116,139,0.1)] text-[#64748b]"}`}>
                      {category.status === "active" ? <><i className="fas fa-check-circle"></i> Active</> : <><i className="fas fa-eye-slash"></i> Hidden</>}
                    </span>
                  </div>
                ))}
                
                {/* Add New Card */}
                <button 
                  className="border-2 border-dashed border-[#e2e8f0] bg-transparent rounded-[12px] p-6 cursor-pointer flex flex-col items-center justify-center min-h-[180px] hover:border-[#8b5cf6] hover:bg-[rgba(139,92,246,0.02)] transition-all"
                  onClick={openAddModal}
                >
                  <div className="w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center text-2xl text-[#8b5cf6] mb-4 transition-all hover:bg-[#8b5cf6] hover:text-white hover:scale-110">
                    <i className="fas fa-plus"></i>
                  </div>
                  <div className="font-bold text-[#1e293b]">Add New Category</div>
                  <div className="text-sm text-[#64748b] mt-1">Create a new product category</div>
                </button>
              </div>
            ) : (
              /* List View */
              <div className="border-2 border-[#e2e8f0] rounded-[12px] overflow-hidden">
                {filteredCategories.map(category => (
                  <div key={category.id} className="flex items-center gap-4 p-5 border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-all last:border-b-0">
                    <div 
                      className="w-12 h-12 rounded-[8px] flex items-center justify-center text-xl bg-[#f8fafc]"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-1">{category.name}</h4>
                      <span className="text-sm text-[#64748b]">{category.productCount} products • {formatNumber(category.views)} views • {category.status}</span>
                    </div>
                    <div className="text-center px-4">
                      <div className="text-xl font-extrabold text-[#8b5cf6]">{category.productCount}</div>
                      <div className="text-xs text-[#64748b] uppercase">Products</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="w-8 h-8 rounded-[8px] border-none bg-[#f8fafc] text-[#64748b] cursor-pointer flex items-center justify-center text-sm hover:bg-[#8b5cf6] hover:text-white transition-all"
                        onClick={(e) => editCategory(category, e)}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className="w-8 h-8 rounded-[8px] border-none bg-[#f8fafc] text-[#64748b] cursor-pointer flex items-center justify-center text-sm hover:bg-[#ef4444] hover:text-white transition-all"
                        onClick={(e) => deleteCategory(category, e)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
            <div className="flex items-center gap-3 text-sm text-[#64748b]">
              <i className="fas fa-info-circle text-[#8b5cf6]"></i>
              <span>Drag and drop to reorder categories</span>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-[8px] font-semibold text-sm hover:border-[#8b5cf6] transition-all" onClick={onClose}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-[8px] font-semibold text-sm shadow-lg flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={saveChanges}>
                <i className="fas fa-save"></i>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setFormModalOpen(false)}>
          <div className="bg-white rounded-[20px] w-full max-w-[480px] p-8 shadow-2xl animate-[slideUp_0.3s_ease]" onClick={e => e.stopPropagation()}>
            <div className="mb-6">
              <h3 className="text-lg font-extrabold mb-2">{editingCategory ? "Edit Category" : "Add New Category"}</h3>
              <p className="text-sm text-[#64748b]">{editingCategory ? "Update category details" : "Create a new category for your products"}</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block font-bold text-sm mb-2 text-[#1e293b]">Category Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3.5 border-2 border-[#e2e8f0] rounded-[8px] text-sm focus:outline-none focus:border-[#8b5cf6] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all"
                  placeholder="e.g., Electronics"
                />
              </div>

              <div>
                <label className="block font-bold text-sm mb-2 text-[#1e293b]">Description (Optional)</label>
                <input 
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3.5 border-2 border-[#e2e8f0] rounded-[8px] text-sm focus:outline-none focus:border-[#8b5cf6] focus:shadow-[0_0_0_4px_rgba(139,92,246,0.1)] transition-all"
                  placeholder="Brief description of this category"
                />
              </div>

              <div>
                <label className="block font-bold text-sm mb-2 text-[#1e293b]">Choose Icon</label>
                <div className="grid grid-cols-6 gap-3">
                  {icons.map(icon => (
                    <button
                      key={icon}
                      className={`aspect-square border-2 border-[#e2e8f0] rounded-[8px] flex items-center justify-center text-2xl cursor-pointer transition-all hover:border-[#8b5cf6] hover:scale-110 ${formData.icon === icon ? "border-[#8b5cf6] bg-gradient-to-br from-[#8b5cf6] to-[#ec4899] text-white" : "bg-[#f8fafc]"}`}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-sm mb-2 text-[#1e293b]">Category Color</label>
                <div className="flex gap-3 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-full cursor-pointer border-3 border-transparent transition-all hover:scale-110 ${formData.color === color ? "border-[#1e293b] shadow-[0_0_0_3px_white,0_0_0_5px_#1e293b]" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button className="flex-1 px-4 py-3 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-[8px] font-semibold text-sm hover:border-[#8b5cf6] transition-all" onClick={() => setFormModalOpen(false)}>
                Cancel
              </button>
              <button className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] text-white rounded-[8px] font-semibold text-sm shadow-lg flex items-center justify-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={saveCategory}>
                <i className="fas fa-save"></i>
                {editingCategory ? "Update Category" : "Save Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-8 right-8 z-[70] flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="bg-[#0f172a] text-white px-6 py-4 rounded-[8px] shadow-lg flex items-center gap-4 min-w-[300px] animate-[slideInRight_0.3s_ease]"
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${toast.type === "success" ? "bg-[#10b981]/20 text-[#10b981]" : toast.type === "error" ? "bg-[#ef4444]/20 text-[#ef4444]" : "bg-[#3b82f6]/20 text-[#3b82f6]"}`}>
              <i className={`fas fa-${toast.type === "success" ? "check-circle" : toast.type === "error" ? "exclamation-circle" : "info-circle"}`}></i>
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
