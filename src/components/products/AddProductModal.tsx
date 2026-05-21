"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";
import categoryData from "@/lib/categoryData"; // Updated with all 15 categories
import type { Category, Subcategory, SpecField } from "@/lib/categoryData";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

// Helper to get category display name
const getCategoryName = (categoryId: string): string => {
  return categoryData[categoryId]?.name || categoryId;
};

// ─── Sub-Components ───────────────────────────────────────────────────────

function StepIndicator({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  return (
    <div className="hidden md:flex items-center justify-center gap-1 px-8 py-4 bg-white border-b border-outline-variant">
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
                  ? "bg-[#8b5cf6] text-white shadow-md3-level2 shadow-[#8b5cf6]/25"
                  : isCompleted
                    ? "bg-[#10b981] text-white"
                    : "bg-surface-variant text-outline"
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
                ${isActive ? "text-[#8b5cf6]" : isCompleted ? "text-[#10b981]" : "text-outline"}
              `}>
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div className={`
                w-8 h-[2px] mx-2 rounded-full transition-colors duration-300
                ${isCompleted ? "bg-[#10b981]" : "bg-surface-variant"}
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
    <div className="md:hidden px-4 py-3 bg-white border-b border-outline-variant">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-on-surface-variant">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-xs font-bold text-[#8b5cf6]">
          {STEPS[currentStep - 1]?.label}
        </span>
      </div>
      <div className="h-1.5 bg-surface-variant rounded-full overflow-hidden">
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
      <label className="md3-label-large block mb-2 text-on-surface-variant">
        {label}
        {required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="md3-label-small text-[#ef4444] mt-1.5 flex items-center gap-1 animate-fadeIn">
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
          ? "border-[#8b5cf6] bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] shadow-md3-level2 shadow-[#8b5cf6]/10"
          : "border-outline-variant bg-white hover:border-outline-variant hover:shadow-md3-level1"
        }
        ${isPressed ? "scale-95" : "scale-100"}
        ${className}
      `}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-md3-level1">
          <i className="fas fa-check text-[9px]" />
        </div>
      )}
      {children}
    </button>
  );
}

// UPDATED: Enhanced SpecButton with support for multiple selection visual feedback
function SpecButton({
  label,
  selected,
  onClick,
  isCustom,
  multiple,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  isCustom?: boolean;
  multiple?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        px-3 py-1.5 md:px-4 md:py-2 rounded-full border-2 text-xs md:text-sm font-semibold transition-all duration-200
        active:scale-95 flex items-center gap-1.5
        ${selected
          ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-md3-level2"
          : isCustom
            ? "border-dashed border-outline-variant text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            : "border-outline-variant text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] bg-white"
        }
      `}
    >
      {selected && multiple && <i className="fas fa-check text-[9px]" />}
      {selected && !multiple && <i className="fas fa-dot-circle text-[8px]" />}
      {label}
    </button>
  );
}

// NEW: Multi-select dropdown component for specs with many options
function MultiSelectDropdown({
  options,
  selectedValues,
  onToggle,
  label,
}: {
  options: string[];
  selectedValues: Set<string>;
  onToggle: (value: string) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant text-left text-sm flex justify-between items-center hover:border-[#8b5cf6] transition-colors"
      >
        <span className="text-on-surface-variant">
          {selectedValues.size === 0 
            ? "Select options..." 
            : `${selectedValues.size} selected`}
        </span>
        <i className={`fas fa-chevron-down text-outline transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-outline-variant rounded-lg shadow-md3-level3 max-h-64 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-outline-variant">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border rounded-md focus:outline-none focus:border-[#8b5cf6]"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.map(opt => (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-2 hover:bg-surface-variant cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.has(opt)}
                  onChange={() => onToggle(opt)}
                  className="rounded border-outline-variant text-[#8b5cf6] focus:ring-[#8b5cf6]"
                />
                <span className="text-on-surface-variant">{opt}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-sm text-outline text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// NEW: Text input for custom specs with allowCustom flag
function CustomSpecInput({
  onAdd,
  onCancel,
  placeholder = "Enter custom value...",
}: {
  onAdd: (value: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (value.trim()) {
      onAdd(value.trim());
      setValue("");
    }
  };

  return (
    <div className="flex gap-2 mt-3 animate-fadeIn">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-lg border-2 border-[#8b5cf6] text-sm focus:outline-none"
      />
      <button
        onClick={handleSubmit}
        className="px-3 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
      >
        <i className="fas fa-check" />
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-2 bg-surface-variant text-on-surface-variant rounded-lg hover:bg-[#cbd5e1] transition-colors"
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
}

// UPDATED: ImageCard remains the same
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
        ${image.isMain ? "border-[#8b5cf6] shadow-md3-level2 shadow-[#8b5cf6]/10" : "border-outline-variant"}
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
              ${image.isMain ? "bg-[#8b5cf6] text-white" : "bg-white/90 text-on-surface-variant hover:bg-white"}
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
        <div className="absolute top-2 left-2 bg-[#8b5cf6] text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md3-level1">
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
            pointer-events-auto px-4 py-3 rounded-xl shadow-md3-level4 flex items-center gap-2.5
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
  const [customInputState, setCustomInputState] = useState<{ specKey: string | null; fieldLabel: string }>({ specKey: null, fieldLabel: "" });
  const [customInputValue, setCustomInputValue] = useState("");

  // NEW: Track if specs are being loaded
  const [isLoadingSpecs, setIsLoadingSpecs] = useState(false);

  const [variants, setVariants] = useState<Variant[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Cleanup camera stream when modal closes or camera closes
  useEffect(() => {
    if (!isCameraOpen && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isCameraOpen]);

  // Reset specs when category or subcategory changes
  useEffect(() => {
    setSelectedSpecs({});
    setCustomSpecOptions({});
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
    setCustomInputState({ specKey: null, fieldLabel: "" });
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
      // Optional: Allow no specs - seller can proceed without any
      // If you want to require at least one spec, uncomment:
      // const hasSpecs = Object.values(selectedSpecs).some((set) => set.size > 0);
      // if (!hasSpecs) newErrors.specs = "Please select at least one specification";
    }

    if (step === 4) {
      const hasValidVariant = variants.some((v) => v.price && parseFloat(v.price) > 0 && v.stock && parseInt(v.stock) > 0);
      if (variants.length > 0 && !hasValidVariant) {
        newErrors.variants = "Please add price and stock for at least one variant";
      }
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
    if (errors.category) setErrors((prev) => { const n = { ...prev }; delete n.category; return n; });
  };

  const selectSubcategory = (subcategoryKey: string) => {
    setSelectedSubcategoryKey(subcategoryKey);
    if (errors.subcategory) setErrors((prev) => { const n = { ...prev }; delete n.subcategory; return n; });
  };

  // UPDATED: Handle spec selection (supports both single and multi-select)
  const toggleSpec = (specKey: string, option: string, multiple: boolean = false) => {
    setSelectedSpecs((prev) => {
      const newSpecs = { ...prev };
      if (!newSpecs[specKey]) newSpecs[specKey] = new Set();
      
      if (multiple) {
        // Multi-select: toggle the option
        if (newSpecs[specKey].has(option)) {
          newSpecs[specKey].delete(option);
          if (newSpecs[specKey].size === 0) delete newSpecs[specKey];
        } else {
          newSpecs[specKey].add(option);
        }
      } else {
        // Single-select: replace with new option
        newSpecs[specKey] = new Set([option]);
      }
      
      return newSpecs;
    });
  };

  const addCustomOption = (specKey: string, value: string) => {
    setCustomSpecOptions((prev) => ({
      ...prev,
      [specKey]: [...(prev[specKey] || []), value],
    }));
    toggleSpec(specKey, value, false);
    setCustomInputState({ specKey: null, fieldLabel: "" });
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

    if (combinations.length > 100) {
      showToast("error", `Too many combinations (${combinations.length}). Max 100 allowed.`);
      return;
    }

    const newVariants: Variant[] = combinations.map((combo, index) => {
      const variantSpecs: Record<string, string> = {};
      specEntries.forEach(([key, _], idx) => { variantSpecs[key] = combo[idx]; });
      const baseSku = formData.name?.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "").slice(0, 15) || "PRODUCT";
      return {
        id: index + 1,
        specs: variantSpecs,
        sku: `${baseSku}-${Object.values(variantSpecs).join("-").replace(/\s+/g, "").toUpperCase().slice(0, 30)}`,
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

  const addImageFromCamera = (file: File) => {
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

  // ── Camera Functions ──────────────────────────────────────────────────────
  
  const openCamera = async () => {
    setIsCameraOpen(true);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      showToast("error", "Unable to access camera. Please check permissions.");
      setIsCameraOpen(false);
    }
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
        addImageFromCamera(file);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraOpen(false);
    }, "image/jpeg", 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const uploadAllImages = async (): Promise<string[]> => {
    if (productImages.length === 0 || !user) return [];
    
    console.log(`📤 Uploading ${productImages.length} image(s)...`);
    
    const uniqueImages = productImages.filter((img, index, self) =>
      index === self.findIndex((t) => t.url === img.url)
    );
    
    if (uniqueImages.length < productImages.length) {
      console.warn(`⚠️ Removed ${productImages.length - uniqueImages.length} duplicate image(s)`);
    }
    
    const uploadedUrls: string[] = [];
    for (const img of uniqueImages) {
      if (img.url.startsWith("data:")) {
        console.log(`📸 Uploading image ${uploadedUrls.length + 1}/${uniqueImages.length}...`);
        const base64Response = await fetch(img.url);
        const blob = await base64Response.blob();
        const file = new File([blob], `image_${img.id}.webp`, { type: "image/webp" });
        const result = await bunnyStorage.uploadFile(user, file, "products");
        if (result.success && result.url) {
          uploadedUrls.push(result.url);
          console.log(`✅ Uploaded: ${result.url}`);
        }
      } else {
        uploadedUrls.push(img.url);
      }
    }
    
    console.log(`✅ Upload complete: ${uploadedUrls.length} URL(s)`);
    return uploadedUrls;
  };

  /**
   * Auto-populate categoryNames collection when user adds their first product
   * This ensures WhatsApp bot can browse categories even with zero products
   */
  const ensureCategoriesPopulated = async (userId: string) => {
    const tenantId = `tenant_${userId}`;
    
    try {
      // Check if at least one category exists for this tenant
      const sampleDocId = `${tenantId}_electronics`;
      const sampleDoc = await getDoc(doc(db, "categoryNames", sampleDocId));
      
      if (sampleDoc.exists()) {
        // Categories already exist, skip
        return;
      }
      
      console.log('[AddProduct] First product detected - auto-creating categories...');
      
      // Create all 15 categories
      const categories = Object.values(categoryData);
      const batchPromises = categories.map(async (category) => {
        const docId = `${tenantId}_${category.id}`;
        const subcategories = Object.values(category.subcategories).map(sub => sub.name);
        
        await setDoc(doc(db, "categoryNames", docId), {
          id: category.id,
          tenantId: tenantId,
          mainCategory: category.id,
          mainCategoryName: category.name,
          icon: category.icon,
          description: category.description,
          subcategories: subcategories,
          productCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });
      
      await Promise.all(batchPromises);
      console.log(`[AddProduct] Created ${categories.length} categories successfully`);
    } catch (error) {
      console.error('[AddProduct] Failed to auto-create categories:', error);
      // Don't fail the product save if category creation fails
      // Categories can be created manually later
    }
  };

  const saveProduct = async () => {
    if (!user) return;
    if (!validateStep(currentStep)) return;

    setSaving(true);
    try {
      // Auto-create categories on first product (idempotent - safe to call every time)
      await ensureCategoriesPopulated(user.uid);
      
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

      // Extract brand from specs for top-level field
      const brandValue = selectedSpecs.brand ? Array.from(selectedSpecs.brand)[0] : undefined;
      const extractedBrand = brandValue && brandValue !== "Generic" && brandValue !== "Other" ? brandValue : undefined;

      // Extract type from specs for top-level field (for bot navigation)
      const typeValue = selectedSpecs.type ? Array.from(selectedSpecs.type)[0] : undefined;

      // Build filters from selected specs (excluding brand and type since they're top-level)
      const filters: Record<string, string[]> = {};
      Object.entries(selectedSpecs).forEach(([key, set]) => {
        if (key !== 'brand' && key !== 'type' && set.size > 0) {
          filters[key] = Array.from(set);
        }
      });

      const productToSave = await productService.createProduct(user, {
        name: formData.name,
        description: formData.description || undefined,
        category: currentCategory?.name || selectedCategoryId!,  // Save full display name for bot compatibility
        categoryName: currentCategory?.name || selectedCategoryId!,
        subcategory: currentSubcategory?.name || selectedSubcategoryKey!,  // Save display name for bot compatibility
        type: typeValue,  // Save type for bot navigation
        brand: extractedBrand,
        categoryId: selectedCategoryId!,  // Keep slug for reference
        subcategoryId: selectedSubcategoryKey!,  // Keep slug for reference
        price: minPrice,
        stock: totalStock || parseInt(formData.initialStock) || 0,
        image: imageUrl,
        images: images.length > 0 ? images : undefined,
        status: "active",
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        variants: variants.length > 0 ? variantsWithPrice.map((v, idx) => ({
          id: `variant_${idx + 1}`,
          specs: v.specs,
          sku: v.sku || "",
          price: v.price,
          stock: v.stock,
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

  // ── Render Step 1: Basic Info ─────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4 md:space-y-6 animate-fadeIn">
      <InputField label="Product Name" required error={errors.name}>
        <div className="md3-input-outlined">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter product name"
            className="w-full px-4 py-3 text-sm bg-transparent outline-none"
          />
        </div>
      </InputField>

      <InputField label="Description" error={errors.description}>
        <div className="md3-input-outlined">
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe your product"
            rows={3}
            className="w-full px-4 py-3 text-sm bg-transparent outline-none resize-none"
          />
        </div>
      </InputField>

      <div className="grid grid-cols-2 gap-4">
        <InputField label="Price (KES)" required error={errors.price}>
          <div className="md3-input-outlined">
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 text-sm bg-transparent outline-none"
            />
          </div>
        </InputField>

        <InputField label="Initial Stock" required error={errors.initialStock}>
          <div className="md3-input-outlined">
            <input
              type="number"
              value={formData.initialStock}
              onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
              placeholder="0"
              min="0"
              className="w-full px-4 py-3 text-sm bg-transparent outline-none"
            />
          </div>
        </InputField>
      </div>

      <InputField label="Low Stock Alert Threshold">
        <div className="md3-input-outlined">
          <input
            type="number"
            value={formData.lowStockAlert}
            onChange={(e) => setFormData({ ...formData, lowStockAlert: e.target.value })}
            placeholder="5"
            min="0"
            className="w-full px-4 py-3 text-sm bg-transparent outline-none"
          />
        </div>
        <p className="text-xs text-on-surface-variant mt-1.5 ml-1">You'll be notified when stock falls below this number</p>
      </InputField>
    </div>
  );

  // ── UPDATED: Render Step 2 with improved category grid (now handles 15 categories) ──

  const renderStep2 = () => {
    // Group categories into rows for better display
    const categoryEntries = Object.entries(categoryData);
    
    return (
      <div className="space-y-6 animate-fadeIn">
        <InputField label="Category" required error={errors.category}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[50vh] overflow-y-auto p-1">
            {categoryEntries.map(([catId, cat]) => {
              const category = cat as Category;
              return (
                <SelectableCard
                  key={catId}
                  selected={selectedCategoryId === catId}
                  onClick={() => selectCategory(catId)}
                  className="p-3"
                >
                  <div className="text-2xl md:text-3xl mb-1 transition-transform duration-200">
                    {category.icon}
                  </div>
                  <div className="font-bold text-xs text-on-surface-variant line-clamp-2">
                    {category.name}
                  </div>
                </SelectableCard>
              );
            })}
          </div>
        </InputField>

        {selectedCategoryId && currentCategory && (
          <InputField label="Subcategory" required error={errors.subcategory}>
            <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto p-1">
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
  };

  // ── UPDATED: Render Step 3 with improved spec rendering (supports large option lists) ──

  const renderStep3 = () => {
    if (!currentSubcategory) {
      return (
        <div className="text-center py-12 text-on-surface-variant">
          <i className="fas fa-tag text-4xl mb-3 opacity-50" />
          <p>Please select a category and subcategory first</p>
        </div>
      );
    }

    const specs = currentSubcategory.specs;
    const specEntries = Object.entries(specs);

    // Check if there are too many options for any spec (use dropdown for > 15 options)
    const shouldUseDropdown = (options: string[]) => options.length > 15;

    return (
      <div className="space-y-6 animate-fadeIn max-h-[55vh] overflow-y-auto pr-2">
        {errors.specs && (
          <div className="p-3 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-exclamation-circle" />
            {errors.specs}
          </div>
        )}

        {specEntries.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <i className="fas fa-cogs text-4xl mb-3 opacity-50" />
            <p>No specifications available for this subcategory</p>
            <p className="text-xs mt-1">You can still add variants directly in the next step</p>
          </div>
        )}

        {specEntries.map(([specKey, spec]) => {
          const specField = spec as SpecField;
          const specOptions = specField.options || [];
          const customOptions = customSpecOptions[specKey] || [];
          const allOptions = [...specOptions, ...customOptions];
          const isMultiple = specField.multiple === true;
          const useDropdown = shouldUseDropdown(allOptions);
          const selectedValues = selectedSpecs[specKey] || new Set<string>();

          return (
            <div key={specKey} className="bg-white rounded-xl p-4 md:p-5 border border-outline-variant">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white text-xs">
                  <i className={`fas ${specField.icon || "fa-tag"}`} />
                </div>
                <span className="font-bold text-sm text-on-surface-variant">{specField.label}</span>
                {isMultiple && (
                  <span className="text-[10px] bg-surface-variant px-2 py-0.5 rounded-full text-on-surface-variant">
                    Multi-select
                  </span>
                )}
                {specField.allowCustom && (
                  <span className="text-[10px] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-full text-[#8b5cf6]">
                    Custom allowed
                  </span>
                )}
              </div>

              {useDropdown ? (
                // Use dropdown for specs with many options
                <MultiSelectDropdown
                  options={allOptions}
                  selectedValues={selectedValues}
                  onToggle={(option) => toggleSpec(specKey, option, isMultiple)}
                  label={specField.label}
                />
              ) : (
                // Use buttons for specs with few options
                <div className="flex flex-wrap gap-2">
                  {allOptions.map((option) => (
                    <SpecButton
                      key={option}
                      label={option}
                      selected={selectedValues.has(option)}
                      onClick={() => toggleSpec(specKey, option, isMultiple)}
                      multiple={isMultiple}
                    />
                  ))}
                  {specField.allowCustom && (
                    <SpecButton
                      label="+ Add Custom"
                      selected={false}
                      onClick={() => setCustomInputState({ specKey, fieldLabel: specField.label })}
                      isCustom
                    />
                  )}
                </div>
              )}

              {/* Custom input for this spec */}
              {customInputState.specKey === specKey && (
                <CustomSpecInput
                  onAdd={(value) => addCustomOption(specKey, value)}
                  onCancel={() => setCustomInputState({ specKey: null, fieldLabel: "" })}
                  placeholder={`Enter custom ${specField.label.toLowerCase()}...`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Step 4 and 5 remain largely the same, with minor improvements
  const renderStep4 = () => (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-on-surface-variant">
          {variants.length} variant{variants.length !== 1 ? "s" : ""} generated
        </span>
        {errors.variants && (
          <span className="text-xs text-[#ef4444] font-semibold">{errors.variants}</span>
        )}
      </div>

      {variants.length === 0 ? (
        <div className="text-center py-12 text-on-surface-variant bg-white rounded-xl border border-outline-variant">
          <i className="fas fa-cubes text-4xl mb-3 opacity-50" />
          <p>No variants generated</p>
          <p className="text-xs mt-1">Select specifications in the previous step to generate variants</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {variants.map((variant, idx) => (
            <div
              key={variant.id}
              className="bg-white border border-outline-variant rounded-xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-start animate-fadeIn"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div>
                <div className="font-bold text-xs text-on-surface-variant mb-1">Variant #{variant.id}</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(variant.specs).map(([key, value]) => (
                    <span key={key} className="text-[10px] px-2 py-0.5 bg-surface-variant rounded-full text-on-surface-variant font-medium">
                      {value}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-outline font-semibold uppercase block mb-1">SKU</label>
                <input
                  type="text"
                  value={variant.sku}
                  onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant text-sm focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-outline font-semibold uppercase block mb-1">Price (KES)</label>
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => updateVariant(idx, "price", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant text-sm focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-outline font-semibold uppercase block mb-1">Stock</label>
                <input
                  type="number"
                  value={variant.stock}
                  onChange={(e) => updateVariant(idx, "stock", e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border-2 border-outline-variant text-sm focus:border-[#8b5cf6] focus:outline-none"
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
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[55vh] overflow-y-auto p-1">
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

        <div className="flex flex-col gap-2">
          <label className="border-2 border-dashed border-outline-variant rounded-xl p-4 text-center cursor-pointer hover:border-[#8b5cf6] hover:bg-[#f5f3ff] transition-all flex flex-col items-center justify-center h-24 md:h-28 group">
            <i className="fas fa-plus text-outline text-xl mb-1 group-hover:text-[#8b5cf6] transition-colors" />
            <span className="text-[10px] text-outline group-hover:text-[#8b5cf6] transition-colors">Upload</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
          <button
            onClick={openCamera}
            className="border-2 border-dashed border-outline-variant rounded-xl p-2 text-center cursor-pointer hover:border-[#8b5cf6] hover:bg-[#f5f3ff] transition-all flex flex-col items-center justify-center h-auto group"
          >
            <i className="fas fa-camera text-outline text-xl mb-1 group-hover:text-[#8b5cf6] transition-colors" />
            <span className="text-[10px] text-outline group-hover:text-[#8b5cf6] transition-colors">Camera</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-outline">
        Drag images to reorder. Click "Set Main" to choose the primary image. First image is auto-set as main.
      </p>
    </div>
  );

  // ── Main Render ────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  const stepContent = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  return (
    <>
      <div className="fixed inset-0 md3-dialog-backdrop z-[2500] flex items-center justify-center p-3 md:p-4 animate-fadeIn">
        <div
          className={`
            md3-dialog w-full max-w-sm md:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col
            transition-all duration-300
            ${direction === "next" ? "animate-slideInRightFull" : "animate-slideInLeftFull"}
          `}
        >
          {/* Header */}
          <div className="md3-dialog-header flex items-center justify-between">
            <h2 className="md3-headline-small flex items-center gap-2 text-on-surface">
              <i className="fas fa-plus-circle text-[#8b5cf6]" />
              Add New Product
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-[#ef4444]/10 hover:text-[#ef4444] transition-all flex items-center justify-center text-on-surface-variant"
            >
              <i className="fas fa-times text-lg" />
            </button>
          </div>

          {/* Step Indicators */}
          <StepIndicator currentStep={currentStep} completedSteps={completedSteps} />
          <MobileStepIndicator currentStep={currentStep} totalSteps={STEPS.length} />

          {/* Body */}
          <div className="md3-dialog-content">
            {stepContent[currentStep - 1]()}
          </div>

          {/* Footer */}
          <div className="md3-dialog-actions">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`
                md3-btn-text
                ${currentStep === 1
                  ? "opacity-0 pointer-events-none"
                  : ""
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
                  className="md3-btn-filled"
                >
                  Next
                  <i className="fas fa-arrow-right text-xs" />
                </button>
              ) : (
                <button
                  onClick={saveProduct}
                  disabled={saving}
                  className="md3-btn-filled disabled:opacity-60 min-w-[140px]"
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

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[2600] bg-black flex flex-col items-center justify-center animate-fadeIn">
          <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden">
            <div className="relative bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-auto max-h-[70vh] object-cover"
              />
              <button
                onClick={closeCamera}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <i className="fas fa-times text-lg" />
              </button>
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <button
                  onClick={capturePhotoFromCamera}
                  className="w-16 h-16 rounded-full bg-white shadow-md3-level3 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-14 h-14 rounded-full border-4 border-[#8b5cf6]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />
    </>
  );
}