"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";
import categoryData from "@/lib/categoryData"; // Import your hardcoded data
import type { Category, Subcategory, SpecField } from "@/lib/categoryData";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  initialStock: string;
  lowStockAlert: string;
}

interface ProductImage {
  id: number;
  url: string;
  isMain: boolean;
}

interface Variant {
  id: number;
  specs: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Basic Info", icon: "fa-info-circle" },
  { id: 2, label: "Category", icon: "fa-tags" },
  { id: 3, label: "Specs", icon: "fa-cogs" },
  { id: 4, label: "Variants", icon: "fa-cubes" },
  { id: 5, label: "Images", icon: "fa-images" },
];

// ─── Helper to get category icons ───────────────────────────────────────────

const getCategoryIcon = (categoryId: string): string => {
  return categoryData[categoryId]?.icon || "📦";
};

// ─── Sub-Components (same as original) ───────────────────────────────────────

function StepIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  return (
    <div className="hidden md:flex items-center justify-center gap-1 px-8 py-4 bg-[#f8fafc] border-b border-[#e2e8f0]">
      {STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isCompleted = completedSteps.has(step.id);
        const isLast = idx === STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${isActive
                  ? "bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/25"
                  : isCompleted
                    ? "bg-[#10b981] text-white"
                    : "bg-[#e2e8f0] text-[#94a3b8]"
                }
              `}>
                {isCompleted && !isActive ? (
                  <i className="fas fa-check text-[10px]" />
                ) : (
                  <i className={`fas ${step.icon}`} />
                )}
              </div>
              <span className={`
                text-xs font-semibold transition-colors duration-200
                ${isActive ? "text-[#8b5cf6]" : isCompleted ? "text-[#10b981]" : "text-[#94a3b8]"}
              `}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`
                w-8 h-[2px] mx-2 rounded-full transition-colors duration-300
                ${isCompleted ? "bg-[#10b981]" : "bg-[#e2e8f0]"}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function MobileStepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;
  return (
    <div className="md:hidden px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-[#64748b]">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-bold text-[#8b5cf6]">
          {STEPS[currentStep - 1]?.label}
        </span>
      </div>
      <div className="h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function InputField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-semibold text-sm mb-2 text-[#475569]">
        {label}
        {required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-[#ef4444] mt-1.5 flex items-center gap-1 animate-fadeIn">
          <i className="fas fa-exclamation-circle text-[10px]" />
          {error}
        </p>
      )}
    </div>
  );
}

function SelectableCard({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`
        relative p-4 border-2 rounded-xl text-center cursor-pointer transition-all duration-200
        active:scale-95
        ${selected
          ? "border-[#8b5cf6] bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] shadow-md shadow-[#8b5cf6]/10"
          : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:shadow-sm"
        }
        ${isPressed ? "scale-95" : "scale-100"}
        ${className}
      `}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-sm">
          <i className="fas fa-check text-[9px]" />
        </div>
      )}
      {children}
    </button>
  );
}

function SpecButton({
  label,
  selected,
  onClick,
  isCustom,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  isCustom?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 md:px-4 md:py-2 rounded-full border-2 text-xs md:text-sm font-semibold transition-all duration-200
        active:scale-95 flex items-center gap-1.5
        ${selected
          ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-md"
          : isCustom
            ? "border-dashed border-[#cbd5e1] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            : "border-[#e2e8f0] text-[#475569] hover:border-[#8b5cf6] hover:text-[#8b5cf6] bg-white"
        }
      `}
    >
      {selected && <i className="fas fa-check text-[9px]" />}
      {label}
    </button>
  );
}

function ImageCard({
  image,
  index,
  onSetMain,
  onRemove,
  onReorder,
  totalImages,
}: {
  image: ProductImage;
  index: number;
  onSetMain: () => void;
  onRemove: () => void;
  onReorder: (from: number, to: number) => void;
  totalImages: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`
        relative rounded-xl overflow-hidden border-2 transition-all duration-200 group
        ${image.isMain ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10" : "border-[#e2e8f0]"}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={(e) => e.dataTransfer.setData("imageIndex", String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const fromIndex = Number(e.dataTransfer.getData("imageIndex"));
        if (fromIndex !== index) onReorder(fromIndex, index);
      }}
    >
      <img src={image.url} alt="Product" className="w-full h-24 md:h-28 object-cover" />
      
      <div className={`
        absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent
        transition-opacity duration-200
        ${isHovered ? "opacity-100" : "opacity-0"}
      `}>
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
          <button
            onClick={onSetMain}
            className={`
              text-[10px] px-2 py-1 rounded-md font-bold transition-all
              ${image.isMain ? "bg-[#8b5cf6] text-white" : "bg-white/90 text-[#475569] hover:bg-white"}
            `}
          >
            {image.isMain ? "✓ Main" : "Set Main"}
          </button>
          <button
            onClick={onRemove}
            className="w-6 h-6 rounded-md bg-white/90 text-[#ef4444] flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all"
          >
            <i className="fas fa-trash text-[9px]" />
          </button>
        </div>
      </div>

      {image.isMain && (
        <div className="absolute top-2 left-2 bg-[#8b5cf6] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
          Main
        </div>
      )}

      <div className={`
        absolute top-2 right-2 w-6 h-6 rounded-md bg-black/40 text-white flex items-center justify-center
        transition-opacity duration-200 cursor-move
        ${isHovered ? "opacity-100" : "opacity-0"}
      `}>
        <i className="fas fa-grip-vertical text-[9px]" />
      </div>
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: { id: number; type: string; message: string }[] }) {
  return (
    <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5
            animate-[slideInRight_0.3s_ease] min-w-[280px]
            ${toast.type === "error" ? "bg-[#ef4444] text-white" : "bg-[#10b981] text-white"}
          `}
        >
          <i className={`fas ${toast.type === "error" ? "fa-exclamation-circle" : "fa-check-circle"} text-sm`} />
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    price: "",
    initialStock: "",
    lowStockAlert: "",
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryKey, setSelectedSubcategoryKey] = useState<string | null>(null);
  
  // Get current category and subcategory objects
  const currentCategory = selectedCategoryId ? categoryData[selectedCategoryId] : null;
  const currentSubcategory = currentCategory && selectedSubcategoryKey 
    ? currentCategory.subcategories[selectedSubcategoryKey] 
    : null;

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, Set<string>>>({});
  const [customSpecOptions, setCustomSpecOptions] = useState<Record<string, string[]>>({});
  const [customInputKey, setCustomInputKey] = useState<string | null>(null);
  const [customInputValue, setCustomInputValue] = useState("");

  const [variants, setVariants] = useState<Variant[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Reset specs when category or subcategory changes
  useEffect(() => {
    setSelectedSpecs({});
    setVariants([]);
  }, [selectedCategoryId, selectedSubcategoryKey]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showToast = useCallback((type: string, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const resetForm = () => {
    setCurrentStep(1);
    setCompletedSteps(new Set());
    setFormData({ name: "", description: "", price: "", initialStock: "", lowStockAlert: "" });
    setSelectedCategoryId(null);
    setSelectedSubcategoryKey(null);
    setSelectedSpecs({});
    setCustomSpecOptions({});
    setVariants([]);
    setProductImages([]);
    setErrors({});
    setCustomInputKey(null);
    setCustomInputValue("");
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Product name is required";
      if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = "Valid price is required";
      if (!formData.initialStock || parseInt(formData.initialStock) <= 0) newErrors.initialStock = "Valid stock quantity is required";
    }

    if (step === 2) {
      if (!selectedCategoryId) newErrors.category = "Please select a category";
      if (!selectedSubcategoryKey) newErrors.subcategory = "Please select a subcategory";
    }

    if (step === 3) {
      const hasSpecs = Object.values(selectedSpecs).some((set) => set.size > 0);
      if (!hasSpecs) newErrors.specs = "Please select at least one specification";
    }

    if (step === 4) {
      const hasValidVariant = variants.some((v) => v.price && parseFloat(v.price) > 0 && v.stock && parseInt(v.stock) > 0);
      if (!hasValidVariant && variants.length > 0) newErrors.variants = "Please add price and stock for at least one variant";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateStep(currentStep)) return;
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setDirection("next");
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => {
    setDirection("prev");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const selectCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryKey(null);
  };

  const selectSubcategory = (subcategoryKey: string) => {
    setSelectedSubcategoryKey(subcategoryKey);
    if (errors.subcategory) setErrors((prev) => { const n = { ...prev }; delete n.subcategory; return n; });
  };

  const toggleSpec = (specKey: string, option: string) => {
    setSelectedSpecs((prev) => {
      const newSpecs = { ...prev };
      if (!newSpecs[specKey]) newSpecs[specKey] = new Set();
      if (newSpecs[specKey].has(option)) {
        newSpecs[specKey].delete(option);
        if (newSpecs[specKey].size === 0) delete newSpecs[specKey];
      } else {
        newSpecs[specKey].add(option);
      }
      return newSpecs;
    });
  };

  const addCustomOption = () => {
    if (!customInputKey || !customInputValue.trim()) return;
    const value = customInputValue.trim();
    setCustomSpecOptions((prev) => ({
      ...prev,
      [customInputKey]: [...(prev[customInputKey] || []), value],
    }));
    toggleSpec(customInputKey, value);
    setCustomInputKey(null);
    setCustomInputValue("");
  };

  const generateVariants = useCallback(() => {
    const specEntries = Object.entries(selectedSpecs).filter(([_, set]) => set.size > 0);
    if (specEntries.length === 0) {
      setVariants([]);
      return;
    }

    const combinations = specEntries.reduce<string[][]>(
      (acc, [_, set]) => acc.flatMap((a) => Array.from(set).map((c) => [...a, c])),
      [[]]
    );

    if (combinations.length > 50) {
      showToast("error", `Too many combinations (${combinations.length}). Max 50 allowed.`);
      return;
    }

    const newVariants: Variant[] = combinations.map((combo, index) => {
      const variantSpecs: Record<string, string> = {};
      specEntries.forEach(([key, _], idx) => { variantSpecs[key] = combo[idx]; });
      return {
        id: index + 1,
        specs: variantSpecs,
        sku: `${formData.name?.toUpperCase().replace(/\s+/g, "-").slice(0, 10) || "PRODUCT"}-${Object.values(variantSpecs).join("-").replace(/\s+/g, "").toUpperCase().slice(0, 20)}`,
        price: "",
        stock: "",
      };
    });

    setVariants(newVariants);
  }, [selectedSpecs, formData.name, showToast]);

  useEffect(() => {
    generateVariants();
  }, [generateVariants]);

  const updateVariant = (index: number, field: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast("error", "Image must be less than 5MB");
        return;
      }
      const id = Date.now() + Math.random();
      const reader = new FileReader();
      reader.onload = () => {
        setProductImages((prev) => [...prev, { id, url: reader.result as string, isMain: prev.length === 0 }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id: number) => {
    setProductImages((prev) => {
      const filtered = prev.filter((img) => img.id !== id);
      if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
        filtered[0].isMain = true;
      }
      return [...filtered];
    });
  };

  const setMainImage = (id: number) => {
    setProductImages((prev) => prev.map((img) => ({ ...img, isMain: img.id === id })));
  };

  const reorderImages = (from: number, to: number) => {
    setProductImages((prev) => {
      const newImages = [...prev];
      const [moved] = newImages.splice(from, 1);
      newImages.splice(to, 0, moved);
      return newImages;
    });
  };

  const uploadAllImages = async (): Promise<string[]> => {
    if (productImages.length === 0 || !user) return [];
    const uploadedUrls: string[] = [];
    for (const img of productImages) {
      if (img.url.startsWith("data:")) {
        const base64Response = await fetch(img.url);
        const blob = await base64Response.blob();
        const file = new File([blob], `image_${img.id}.jpg`, { type: "image/jpeg" });
        const result = await bunnyStorage.uploadFile(user, file, "products");
        if (result.success && result.url) uploadedUrls.push(result.url);
      } else {
        uploadedUrls.push(img.url);
      }
    }
    return uploadedUrls;
  };

  const saveProduct = async () => {
    if (!user) return;
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      const images = await uploadAllImages();
      const imageUrl = images[0];

      const variantsWithPrice = variants.map((v) => ({
        ...v,
        price: parseFloat(v.price) || 0,
        stock: parseInt(v.stock) || 0,
      }));

      const totalStock = variantsWithPrice.reduce((sum, v) => sum + v.stock, 0);
      const minPrice = variantsWithPrice.some((v) => v.price > 0)
        ? Math.min(...variantsWithPrice.filter((v) => v.price > 0).map((v) => v.price))
        : parseFloat(formData.price) || 0;

      // Extract brand from specs for top-level field (bot compatibility)
      const brandValue = selectedSpecs.brand ? Array.from(selectedSpecs.brand)[0] : undefined;
      const extractedBrand = brandValue && brandValue !== "Generic" ? brandValue : undefined;

      // Build filters from selected specs (excluding brand since it's top-level)
      const filters: Record<string, string[]> = {};
      Object.entries(selectedSpecs).forEach(([key, set]) => {
        if (key !== 'brand' && set.size > 0) {
          filters[key] = Array.from(set);
        }
      });

      const productToSave = await productService.createProduct(user, {
        name: formData.name,
        description: formData.description || undefined,
        // Backward compatibility fields (bot uses these)
        category: selectedCategoryId!,
        categoryName: currentCategory?.name || selectedCategoryId!,
        subcategory: selectedSubcategoryKey!, // Bot queries this field
        brand: extractedBrand, // Top-level brand for bot extraction
        // Hybrid structure fields
        categoryId: selectedCategoryId!,
        subcategoryId: selectedSubcategoryKey!,
        price: minPrice,
        stock: totalStock || parseInt(formData.initialStock) || 0,
        image: imageUrl,
        images: images.length > 0 ? images : undefined,
        status: "active",
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        variants: variants.length > 0 ? variants.map((v, idx) => ({
          id: `variant_${idx + 1}`,
          specs: v.specs,
          sku: v.sku || "",
          price: parseFloat(v.price) || 0,
          stock: parseInt(v.stock) || 0,
        })) : undefined,
      });

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const orderLink = `${baseUrl}/order?tenant=tenant_${user.uid}&product=${productToSave.id}`;
      await productService.updateProduct(user, productToSave.id, { orderLink });

      showToast("success", `Product "${formData.name}" saved!`);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("error", "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  // ── Render Steps ───────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      <InputField label="Product Name" required error={errors.name}>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="e.g., iPhone 15 Pro Max"
          className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm focus:outline-none focus:border-[#8b5cf6] bg-[#f8fafc] transition-colors"
        />
      </InputField>

      <InputField label="Description">
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={3}
          placeholder="Describe your product..."
          className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm focus:outline-none focus:border-[#8b5cf6] bg-[#f8fafc] resize-none transition-colors"
        />
      </InputField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <InputField label="Price (KES)" required error={errors.price}>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm focus:outline-none focus:border-[#8b5cf6] bg-[#f8fafc] transition-colors"
          />
        </InputField>

        <InputField label="Initial Stock" required error={errors.initialStock}>
          <input
            type="number"
            name="initialStock"
            value={formData.initialStock}
            onChange={handleInputChange}
            placeholder="e.g., 100"
            min="0"
            className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm focus:outline-none focus:border-[#8b5cf6] bg-[#f8fafc] transition-colors"
          />
        </InputField>
      </div>

      <InputField label="Low Stock Alert">
        <input
          type="number"
          name="lowStockAlert"
          value={formData.lowStockAlert}
          onChange={handleInputChange}
          placeholder="5"
          min="0"
          className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] text-sm focus:outline-none focus:border-[#8b5cf6] bg-[#f8fafc] transition-colors"
        />
      </InputField>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fadeIn">
      <InputField label="Category" required error={errors.category}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(categoryData).map(([catId, cat]) => {
            const category = cat as Category;
            return (
              <SelectableCard
                key={catId}
                selected={selectedCategoryId === catId}
                onClick={() => selectCategory(catId)}
              >
                <div className="text-2xl md:text-3xl mb-1 transition-transform duration-200">
                  {category.icon}
                </div>
                <div className="font-bold text-xs md:text-sm text-[#475569]">{category.name}</div>
              </SelectableCard>
            );
          })}
        </div>
      </InputField>

      {selectedCategoryId && currentCategory && (
        <InputField label="Subcategory" required error={errors.subcategory}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(currentCategory.subcategories).map(([subKey, sub]) => {
              const subcategory = sub as Subcategory;
              return (
                <SpecButton
                  key={subKey}
                  label={subcategory.name}
                  selected={selectedSubcategoryKey === subKey}
                  onClick={() => selectSubcategory(subKey)}
                />
              );
            })}
          </div>
        </InputField>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (!currentSubcategory) {
      return (
        <div className="text-center py-12 text-[#64748b]">
          <i className="fas fa-tag text-4xl mb-3 opacity-50" />
          <p>Please select a category and subcategory first</p>
        </div>
      );
    }

    const specs = currentSubcategory.specs;

    return (
      <div className="space-y-6 animate-fadeIn">
        {errors.specs && (
          <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-exclamation-circle" />
            {errors.specs}
          </div>
        )}

        {Object.entries(specs).map(([specKey, spec]) => {
          const specField = spec as SpecField;
          const specOptions = specField.options;
          const customOptions = customSpecOptions[specKey] || [];
          const allOptions = [...specOptions, ...customOptions];

          return (
            <div key={specKey} className="bg-[#f8fafc] rounded-xl p-4 md:p-5 border border-[#e2e8f0]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white text-xs">
                  <i className={`fas ${specField.icon || "fa-tag"}`} />
                </div>
                <span className="font-bold text-sm text-[#475569]">{specField.label}</span>
                {specField.multiple && (
                  <span className="text-[10px] bg-[#e2e8f0] px-2 py-0.5 rounded-full text-[#64748b]">
                    Multi-select
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allOptions.map((option) => (
                  <SpecButton
                    key={option}
                    label={option}
                    selected={selectedSpecs[specKey]?.has(option) || false}
                    onClick={() => toggleSpec(specKey, option)}
                  />
                ))}
                <SpecButton
                  label="Add Custom"
                  selected={false}
                  onClick={() => { setCustomInputKey(specKey); setCustomInputValue(""); }}
                  isCustom
                />
              </div>

              {customInputKey === specKey && (
                <div className="flex gap-2 mt-3 animate-fadeIn">
                  <input
                    type="text"
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomOption()}
                    placeholder="Enter custom value..."
                    className="flex-1 px-3 py-2 rounded-lg border-2 border-[#8b5cf6] text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={addCustomOption}
                    className="px-3 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
                  >
                    <i className="fas fa-check" />
                  </button>
                  <button
                    onClick={() => setCustomInputKey(null)}
                    className="px-3 py-2 bg-[#e2e8f0] text-[#64748b] rounded-lg hover:bg-[#cbd5e1] transition-colors"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {Object.keys(specs).length === 0 && (
          <div className="text-center py-12 text-[#64748b]">
            <i className="fas fa-cogs text-4xl mb-3 opacity-50" />
            <p>No specifications available for this subcategory</p>
            <p className="text-xs mt-1">You can still add variants directly in the next step</p>
          </div>
        )}
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[#64748b]">
          {variants.length} variant{variants.length !== 1 ? "s" : ""} generated
        </span>
        {errors.variants && (
          <span className="text-xs text-[#ef4444] font-semibold">{errors.variants}</span>
        )}
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-12 text-[#64748b] bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
          <i className="fas fa-cubes text-4xl mb-3 opacity-50" />
          <p>No variants generated</p>
          <p className="text-xs mt-1">Select specifications in the previous step to generate variants</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {variants.map((variant, idx) => (
            <div
              key={variant.id}
              className="bg-white border border-[#e2e8f0] rounded-xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-start animate-fadeIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div>
                <div className="font-bold text-xs text-[#64748b] mb-1">Variant #{variant.id}</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(variant.specs).map(([key, value]) => (
                    <span key={key} className="text-[10px] px-2 py-0.5 bg-[#f1f5f9] rounded-full text-[#64748b] font-medium">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-[#94a3b8] font-semibold uppercase block mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#e2e8f0] text-sm focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#94a3b8] font-semibold uppercase block mb-1">Price (KES)</label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => updateVariant(idx, "price", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#e2e8f0] text-sm focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#94a3b8] font-semibold uppercase block mb-1">Stock</label>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border-2 border-[#e2e8f0] text-sm focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {productImages.map((img, idx) => (
          <ImageCard
            key={img.id}
            image={img}
            index={idx}
            onSetMain={() => setMainImage(img.id)}
            onRemove={() => removeImage(img.id)}
            onReorder={reorderImages}
            totalImages={productImages.length}
          />
        ))}

        <label className="border-2 border-dashed border-[#e2e8f0] rounded-xl p-4 text-center cursor-pointer hover:border-[#8b5cf6] hover:bg-[#f5f3ff] transition-all flex flex-col items-center justify-center h-24 md:h-28 group">
          <i className="fas fa-plus text-[#94a3b8] text-xl mb-1 group-hover:text-[#8b5cf6] transition-colors" />
          <span className="text-[10px] text-[#94a3b8] group-hover:text-[#8b5cf6] transition-colors">Add Image</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>
      </div>

      <p className="text-xs text-[#94a3b8]">
        Drag images to reorder. Click "Set Main" to choose the primary image. First image is auto-set as main.
      </p>
    </div>
  );

  // ── Main Render ────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-3 md:p-4 animate-fadeIn">
        <div
          className={`
            bg-white rounded-2xl w-full max-w-sm md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col
            transition-all duration-300
            ${direction === "next" ? "animate-slideInRightFull" : "animate-slideInLeftFull"}
          `}
        >
          {/* Header */}
          <div className="px-4 md:px-8 py-4 md:py-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[#ede9fe] to-[#f5f3ff] shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-extrabold flex items-center gap-2 text-[#1e293b]">
                <i className="fas fa-plus-circle text-[#8b5cf6]" />
                Add New Product
              </h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/80 hover:bg-[#ef4444] hover:text-white transition-all flex items-center justify-center text-[#64748b] shadow-sm"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>
          </div>

          {/* Step Indicators */}
          <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
          <MobileStepIndicator currentStep={currentStep} totalSteps={STEPS.length} />

          {/* Body */}
          <div className="overflow-y-auto p-4 md:p-8 flex-1">
            {stepContent[currentStep - 1]()}
          </div>

          {/* Footer */}
          <div className="px-4 md:px-8 py-4 md:py-5 border-t border-[#e2e8f0] bg-[#f8fafc] shrink-0">
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`
                  px-4 md:px-6 py-2.5 rounded-xl font-bold text-sm transition-all
                  ${currentStep === 1
                    ? "opacity-0 pointer-events-none"
                    : "bg-white text-[#64748b] border-2 border-[#e2e8f0] hover:border-[#8b5cf6] hover:text-[#8b5cf6] active:scale-95"
                  }
                `}
              >
                <i className="fas fa-arrow-left mr-2 text-xs" />
                Back
              </button>

              <div className="flex gap-2 md:gap-3">
                {currentStep < STEPS.length ? (
                  <button
                    onClick={nextStep}
                    className="px-4 md:px-6 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:shadow-[#8b5cf6]/20 transition-all active:scale-95 flex items-center gap-2"
                  >
                    Next
                    <i className="fas fa-arrow-right text-xs" />
                  </button>
                ) : (
                  <button
                    onClick={saveProduct}
                    disabled={saving}
                    className="px-4 md:px-6 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:shadow-[#8b5cf6]/20 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2 min-w-[120px] justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save text-xs" />
                        Save Product
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}