"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService, Product, categoryService, categorySubcategories, universalFilters } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";
import CategoriesModal from "@/components/categories/CategoriesModal";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice: number;
  costPrice: number;
  stock: number;
  lowStockAlert: number;
  weight: number;
  weightUnit: string;
  sku: string;
  brand: string;
  condition: string;
  color: string;
  size: string;
  material: string;
  gender: string;
  taxRate: string;
  status: string;
  image: string;
}

interface CategoryOption {
  id: string;
  name: string;
  icon: string;
  desc: string;
}

const sizesByCategory: Record<string, string[]> = {
  footwear: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
  clothing: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  electronics: ["64GB", "128GB", "256GB", "512GB", "1TB"],
  furniture: [],
  beauty: [],
  other: [],
};

const materialsByCategory: Record<string, string[]> = {
  footwear: ["Leather", "Canvas", "Rubber", "Synthetic", "Mesh", "Suede"],
  clothing: ["Cotton", "Polyester", "Wool", "Silk", "Linen", "Denim", "Blend"],
  electronics: [],
  furniture: ["Wood", "Metal", "Plastic", "Fabric", "Leather", "Glass", "Rattan"],
  beauty: [],
  other: [],
};

const steps = [
  { id: 1, label: "Category" },
  { id: 2, label: "Basic Info" },
  { id: 3, label: "Details" },
  { id: 4, label: "Review" },
];

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [productFilters, setProductFilters] = useState<Record<string, string>>({});
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [selectedGender, setSelectedGender] = useState("");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "",
    price: 0,
    salePrice: 0,
    costPrice: 0,
    stock: 0,
    lowStockAlert: 5,
    weight: 0,
    weightUnit: "kg",
    sku: "",
    brand: "",
    condition: "new",
    color: "",
    size: "",
    material: "",
    gender: "",
    taxRate: "no",
    status: "active",
    image: "",
  });
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [publishOption, setPublishOption] = useState<"now" | "draft" | "schedule">("now");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories from database + defaults
  useEffect(() => {
    if (!user || !isOpen) return;
    loadCategories();
  }, [user, isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setSelectedCategory("");
      setSelectedSubcategory("");
      setProductFilters({});
      setSelectedSizes([]);
      setSelectedColors([]);
      setSelectedMaterial("");
      setSelectedGender("");
      setFormData({
        name: "",
        description: "",
        category: "",
        price: 0,
        salePrice: 0,
        costPrice: 0,
        stock: 0,
        lowStockAlert: 5,
        weight: 0,
        weightUnit: "kg",
        sku: "",
        brand: "",
        condition: "new",
        color: "",
        size: "",
        material: "",
        gender: "",
        taxRate: "no",
        status: "active",
        image: "",
      });
      setSelectedImage(null);
      setImagePreview("");
      setPublishOption("now");
    }
  }, [isOpen]);

  const loadCategories = async () => {
    if (!user) return;
    setLoadingCategories(true);
    try {
      // Get custom categories from database
      const customCategories = await categoryService.getCategories(user);
      
      // Map custom categories
      const customCats: CategoryOption[] = customCategories.map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        desc: cat.description || "",
      }));

      setCategories(customCats);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleCategoryCreated = () => {
    // Reload categories after a new one is created
    loadCategories();
  };

  if (!isOpen) return null;

  const showToast = (type: string, message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" || name === "salePrice" || name === "costPrice" || name === "stock" || name === "lowStockAlert" || name === "weight" ? Number(value) : value
    }));
  };

  const selectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setFormData(prev => ({ ...prev, category: catId }));
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showToast("error", "Image must be less than 5MB");
      return;
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showToast("error", "Please upload a valid image (JPEG, PNG, WebP, GIF)");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;
    
    setUploadingImage(true);
    try {
      const result = await bunnyStorage.uploadFile(user, selectedImage, "products");
      if (result.success && result.url) {
        return result.url;
      }
      showToast("error", result.error || "Failed to upload image");
      return null;
    } catch (error) {
      console.error("Upload error:", error);
      showToast("error", "Failed to upload image");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  const validateStep = (step: number): boolean => {
    if (step === 1 && !selectedCategory) {
      showToast("error", "Please select a category first");
      return false;
    }
    if (step === 2 && !formData.name) {
      showToast("error", "Product name is required");
      return false;
    }
    if (step === 3 && (!formData.price || !formData.stock)) {
      showToast("error", "Price and stock quantity are required");
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const publishProduct = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl = formData.image;
      if (selectedImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      // Build filters object - convert comma strings to arrays
      const filters: Record<string, string[]> = {};
      Object.entries(productFilters).forEach(([key, value]) => {
        if (value) {
          const arr = value.split(",").map(v => v.trim()).filter(v => v);
          if (arr.length > 0) {
            filters[key] = arr;
          }
        }
      });
      
      // Add sizes and colors to filters
      if (selectedSizes.length > 0) {
        filters.sizes = selectedSizes;
      }
      if (selectedColors.length > 0) {
        filters.colors = selectedColors;
      }
      
      const newProduct = await productService.createProduct(user, {
        name: formData.name,
        description: formData.description,
        category: selectedSubcategory || selectedCategory || "",
        categoryId: selectedCategory || undefined,
        subcategory: selectedSubcategory || undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        price: formData.price,
        stock: formData.stock,
        image: imageUrl || undefined,
        salePrice: formData.salePrice || undefined,
        costPrice: formData.costPrice || undefined,
        sku: formData.sku || undefined,
        brand: formData.brand || undefined,
        condition: formData.condition || undefined,
        taxEnabled: formData.taxRate !== "no" && formData.taxRate ? true : false,
        taxRate: formData.taxRate !== "no" ? parseFloat(formData.taxRate) || 0 : 0,
        weight: formData.weight || undefined,
        weightUnit: formData.weightUnit || undefined,
        lowStockAlert: formData.lowStockAlert || undefined,
        status: publishOption === "draft" ? "draft" : "active",
      });
      
      // Update product with order link (phone will be added when AI sends link)
      const baseUrl = window.location.origin;
      await productService.updateProduct(user, newProduct.id, {
        orderLink: `${baseUrl}/order?tenant=${user.uid}&product=${newProduct.id}&phone=`
      });
      showToast("success", "Product published successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error creating product:", error);
      showToast("error", "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const saveDraft = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let imageUrl = formData.image;
      if (selectedImage) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      await productService.createProduct(user, {
        name: formData.name,
        description: formData.description,
        category: selectedCategory || "other",
        price: formData.price || 0,
        stock: formData.stock || 0,
        image: imageUrl || undefined,
        salePrice: formData.salePrice || undefined,
        costPrice: formData.costPrice || undefined,
        sku: formData.sku || undefined,
        brand: formData.brand || undefined,
        condition: formData.condition || undefined,
        taxEnabled: formData.taxRate !== "no" && formData.taxRate ? true : false,
        taxRate: formData.taxRate !== "no" ? parseFloat(formData.taxRate) || 0 : 0,
        weight: formData.weight || undefined,
        weightUnit: formData.weightUnit || undefined,
        lowStockAlert: formData.lowStockAlert || undefined,
        status: "draft",
      });
      showToast("success", "Draft saved successfully!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast("error", "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const colors = ["Black", "White", "Red", "Blue", "Green", "Yellow", "Pink", "Purple"];
  const genders = selectedCategory === "footwear" || selectedCategory === "clothing" ? ["Men", "Women", "Unisex", "Kids"] : selectedCategory === "beauty" ? ["Unisex", "Women", "Men"] : [];

  return (
    <>
      <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-[24px] w-full max-w-[1000px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-[slideUp_0.4s_cubic-bezier(0.16,1,0.3,1)]" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-[16px] flex items-center justify-center text-white text-2xl shadow-lg">
                <i className="fas fa-plus"></i>
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-[#1e293b]">Add New Product</h2>
                <p className="text-sm text-[#64748b]">Create a new product listing with smart categorization</p>
              </div>
            </div>
            <button className="w-11 h-11 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-full transition-all" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex p-6 pb-0 gap-0 border-b border-[#e2e8f0]">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`flex-1 flex flex-col items-center gap-2 pb-4 cursor-pointer relative ${currentStep === step.id ? "" : index + 1 < currentStep ? "completed" : ""}`}
                onClick={() => validateStep(currentStep) && setCurrentStep(step.id)}
              >
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm ${currentStep === step.id ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : index + 1 < currentStep ? "bg-[#10b981] text-white" : "bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#64748b]"}`}
                >
                  {index + 1 < currentStep ? <i className="fas fa-check"></i> : step.id}
                </div>
                <span className={`text-xs font-semibold ${currentStep === step.id ? "text-[#25D366]" : index + 1 < currentStep ? "text-[#10b981]" : "text-[#64748b]"}`}>{step.label}</span>
                {index + 1 < 4 && (
                  <div className={`absolute top-4.5 left-1/2 w-full h-0.5 ${index + 1 < currentStep ? "bg-[#10b981]" : "bg-[#e2e8f0]"}`} style={{ transform: 'translateY(-50%)' }}></div>
                )}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8">
            
            {/* Step 1: Category */}
            {currentStep === 1 && (
              <div className="animate-[fadeIn_0.4s_ease]">
                <h3 className="text-lg font-bold mb-2">Select Product Category</h3>
                <p className="text-[#64748b] mb-6">Choose a category to see relevant product filters</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {loadingCategories ? (
                    <div className="col-span-3 text-center py-8">
                      <div className="w-8 h-8 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
                      <p className="mt-4 text-[#64748b]">Loading categories...</p>
                    </div>
                  ) : categories.map(cat => (
                    <button
                      key={cat.id}
                      className={`p-6 border-2 border-[#e2e8f0] rounded-[16px] cursor-pointer text-center transition-all hover:border-[#25D366] hover:-translate-y-1 hover:shadow-lg ${selectedCategory === cat.id ? "border-[#25D366] bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)] shadow-md" : "bg-white"}`}
                      onClick={() => selectCategory(cat.id)}
                    >
                      <div className={`w-16 h-16 rounded-full bg-[#f8fafc] flex items-center justify-center text-4xl mb-4 transition-all ${selectedCategory === cat.id ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] scale-110" : ""}`}>
                        {cat.icon}
                      </div>
                      <div className="font-bold text-[#1e293b] mb-1">{cat.name}</div>
                      <div className="text-sm text-[#64748b]">{cat.desc}</div>
                    </button>
                  ))}
                </div>

                {/* Add New Category Button */}
                <button 
                  className="w-full py-4 border-2 border-dashed border-[#e2e8f0] rounded-[16px] text-[#64748b] font-semibold hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center justify-center gap-2"
                  onClick={() => setCategoriesModalOpen(true)}
                >
                  <i className="fas fa-plus"></i>
                  Add New Category
                </button>

                {/* Universal Filters */}
                {selectedCategory && (
                  <div className="bg-[#f8fafc] rounded-[16px] p-6 border-2 border-[#e2e8f0] mt-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#e2e8f0]">
                      <div className="w-10 h-10 rounded-[12px] bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white text-xl">
                        <i className="fas fa-globe"></i>
                      </div>
                      <div>
                        <div className="font-bold text-lg">Universal Product Details</div>
                        <div className="text-sm text-[#64748b]">These apply to all products</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block font-bold text-sm mb-2 text-[#1e293b]">Brand <span className="text-[#ef4444]">*</span></label>
                        <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="e.g., Nike, Apple" />
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-2 text-[#1e293b]">Condition</label>
                        <select name="condition" value={formData.condition} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366] bg-white">
                          <option value="new">New</option>
                          <option value="used">Used</option>
                          <option value="refurbished">Refurbished</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-sm mb-2 text-[#1e293b]">Color</label>
                        <div className="flex flex-wrap gap-2">
                          {colors.map(color => (
                            <button
                              key={color}
                              className={`px-5 py-2.5 rounded-[12px] font-semibold text-sm cursor-pointer transition-all hover:border-[#25D366] ${selectedColors.includes(color) ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white border-[#25D366]" : "bg-white border-2 border-[#e2e8f0] text-[#1e293b] hover:text-[#25D366] hover:border-[#25D366]"}`}
                              onClick={() => toggleColor(color)}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Basic Info */}
            {currentStep === 2 && (
              <div className="animate-[fadeIn_0.4s_ease]">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Product Name <span className="text-[#ef4444]">*</span></label>
                    <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3.5 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="Enter product name" />
                    <span className="text-xs text-[#64748b] mt-1 block">Make it catchy and descriptive for WhatsApp sharing</span>
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366] resize-none" placeholder="Describe your product..."></textarea>
                  </div>

                  {/* Subcategory Selection */}
                  <div className="col-span-2">
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Product Type (Subcategory)</label>
                    <select 
                      value={selectedSubcategory}
                      onChange={(e) => { setSelectedSubcategory(e.target.value); setProductFilters({}); }}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366] bg-white"
                    >
                      <option value="">Select product type (optional)</option>
                      {Object.entries(categorySubcategories).map(([catKey, subs]) => (
                        <optgroup key={catKey} label={catKey.charAt(0).toUpperCase() + catKey.slice(1)}>
                          {subs.map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <span className="text-xs text-[#64748b] mt-1 block">Selecting a type will show relevant filter fields below</span>
                  </div>

                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">SKU (Stock Keeping Unit)</label>
                    <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="e.g., PRD-001" />
                  </div>

                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Barcode (ISBN, UPC, etc.)</label>
                    <input type="text" className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="Scan or enter barcode" />
                  </div>
                </div>

                {/* Dynamic Filters based on Subcategory */}
                {selectedSubcategory && (
                  <div className="bg-[#f8fafc] rounded-[16px] p-6 border-2 border-[#e2e8f0] mt-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-[12px] bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white text-xl">
                        <i className="fas fa-sliders-h"></i>
                      </div>
                      <div>
                        <div className="font-bold text-lg">Product Specifications</div>
                        <div className="text-sm text-[#64748b]">Fill in details for {selectedSubcategory.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(categorySubcategories).flatMap(([catKey, subs]) => 
                        subs.filter(s => s.id === selectedSubcategory).map(sub => 
                          sub.filters.map(filter => (
                            <div key={filter}>
                              <label className="block font-bold text-sm mb-2 text-[#1e293b] capitalize">
                                {filter.replace(/_/g, ' ')} {["brand", "condition"].includes(filter) && "(Optional)"}
                              </label>
                              <input 
                                type="text" 
                                value={productFilters[filter] || ""}
                                onChange={(e) => setProductFilters({...productFilters, [filter]: e.target.value})}
                                className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]"
                                placeholder={`Enter ${filter.replace(/_/g, ' ')}`}
                              />
                            </div>
                          ))
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Pricing & Inventory */}
            {currentStep === 3 && (
              <div className="animate-[fadeIn_0.4s_ease]">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Regular Price <span className="text-[#ef4444]">*</span></label>
                    <input type="number" name="price" value={formData.price} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="0.00" />
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Sale Price (Optional)</label>
                    <input type="number" name="salePrice" value={formData.salePrice} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="0.00" />
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Cost Price (Your Cost)</label>
                    <input type="number" name="costPrice" value={formData.costPrice} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="0.00" />
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Tax Rate</label>
                    <select name="taxRate" value={formData.taxRate} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366] bg-white">
                      <option value="no">No Tax</option>
                      <option value="5">5%</option>
                      <option value="10">10%</option>
                      <option value="15">15%</option>
                      <option value="20">20%</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Stock Quantity <span className="text-[#ef4444]">*</span></label>
                    <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="0" />
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Low Stock Alert</label>
                    <input type="number" name="lowStockAlert" value={formData.lowStockAlert} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="5" />
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">Weight (for shipping)</label>
                    <div className="flex gap-2">
                      <input type="number" name="weight" value={formData.weight} onChange={handleInputChange} className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366]" placeholder="0" />
                      <select name="weightUnit" value={formData.weightUnit} onChange={handleInputChange} className="w-24 px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366] bg-white">
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block font-bold text-sm mb-2 text-[#1e293b]">SKU Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-[12px] text-sm focus:outline-none focus:border-[#25D366] bg-white">
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="mt-6">
                  <label className="block font-bold text-sm mb-3 text-[#1e293b]">Product Image</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="Preview" className="w-48 h-48 object-cover rounded-[16px] border-2 border-[#e2e8f0]" />
                      <button
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-[#ef4444] text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black/50 rounded-[16px] flex items-center justify-center">
                          <i className="fas fa-spinner fa-spin text-white text-2xl"></i>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#e2e8f0] rounded-[16px] p-8 text-center cursor-pointer hover:border-[#25D366] bg-[#f8fafc] transition-all"
                    >
                      <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-[#25D366] shadow">
                        <i className="fas fa-cloud-upload-alt"></i>
                      </div>
                      <div className="font-bold mb-1">Click to upload image</div>
                      <div className="text-sm text-[#64748b]">Max 5MB, JPEG PNG WebP GIF</div>
                    </div>
                  )}
                </div>

                {/* AI Assistant */}
                <div className="bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)] border-2 border-[rgba(139,92,246,0.2)] rounded-[16px] p-5 mt-6 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#ec4899] flex items-center justify-center text-white text-2xl flex-shrink-0">
                    <i className="fas fa-robot"></i>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">AI Auto-Description</h4>
                    <p className="text-sm text-[#64748b]">Based on your inputs, I can generate an optimized product description for WhatsApp sharing. Would you like me to create one?</p>
                    <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-[8px] font-semibold text-sm mt-3 hover:border-[#8b5cf6]">
                      <i className="fas fa-magic mr-2"></i>
                      Generate Description
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="animate-[fadeIn_0.4s_ease]">
                <div className="bg-[#f8fafc] rounded-[16px] p-6">
                  <h3 className="text-lg font-bold mb-4">Product Summary</h3>
                  
                  <div className="space-y-4 border-b border-[#e2e8f0] pb-4">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Product Name</span>
                      <span className="font-bold text-[#1e293b]">{formData.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Category</span>
                      <span className="font-bold text-[#1e293b] capitalize">{selectedCategory || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Price</span>
                      <span className="font-bold text-[#1e293b]">{CURRENCY_SYMBOL}{formData.price || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Stock</span>
                      <span className="font-bold text-[#1e293b]">{formData.stock || 0} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Status</span>
                      <span className="font-bold text-[#10b981]">Ready to Publish</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-[rgba(139,92,246,0.05)] to-[rgba(236,72,153,0.05)] border-2 border-[rgba(139,92,246,0.2)] rounded-[16px] p-5 mt-4 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#10b981] flex items-center justify-center text-white text-2xl flex-shrink-0">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Pre-Publish Check</h4>
                    <p className="text-sm text-[#64748b]">✓ All required fields completed<br/>✓ Inventory tracked<br/>✓ WhatsApp sharing optimized</p>
                  </div>
                </div>

                <div className="mt-6 p-5 bg-[#f8fafc] rounded-[16px]">
                  <label className="block font-bold text-sm mb-3 text-[#1e293b]">Publishing Options</label>
                  <div className="flex gap-6">
                    {[
                      { id: "now", label: "Publish Now" },
                      { id: "draft", label: "Save as Draft" },
                      { id: "schedule", label: "Schedule for Later" },
                    ].map(opt => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="publish" 
                          checked={publishOption === opt.id}
                          onChange={() => setPublishOption(opt.id as any)}
                          className="w-5 h-5 accent-[#25D366]"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]">
            <button 
              className="px-4 py-3 bg-white border-2 border-[#e2e8f0] rounded-[12px] font-semibold text-sm hover:border-[#25D366] flex items-center gap-2 transition-all" 
              onClick={prevStep}
              style={{ visibility: currentStep === 1 ? "hidden" : "visible" }}
            >
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <div className="flex gap-3">
              <button className="px-4 py-3 bg-white border-2 border-[#e2e8f0] rounded-[12px] font-semibold text-sm hover:border-[#25D366] flex items-center gap-2 transition-all" onClick={saveDraft}>
                <i className="fas fa-save"></i>
                Save Draft
              </button>
              {currentStep < 4 ? (
                <button className="px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-[12px] font-semibold text-sm shadow-lg flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all" onClick={nextStep}>
                  Continue
                  <i className="fas fa-arrow-right"></i>
                </button>
              ) : (
                <button className="px-4 py-3 bg-[#10b981] text-white rounded-[12px] font-semibold text-sm shadow-lg flex items-center gap-2 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50" onClick={publishProduct} disabled={saving}>
                  {saving ? <><i className="fas fa-circle-notch fa-spin"></i> Publishing...</> : <><i className="fas fa-check"></i> Publish Product</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <div className="fixed top-8 right-8 z-[70] flex flex-col gap-3">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className="bg-[#0f172a] text-white px-6 py-4 rounded-[8px] shadow-lg flex items-center gap-4 min-w-[300px] animate-[slideInRight_0.3s_ease]"
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

      {/* Categories Modal for adding new categories */}
      <CategoriesModal
        isOpen={categoriesModalOpen}
        onClose={() => setCategoriesModalOpen(false)}
        products={[]}
        selectMode={false}
      />
    </>
  );
}
