"use client";

import { useState, useEffect, useRef, useCallback, forwardRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { productService } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";
import categoryData from "@/lib/categoryData";
import type { Category, Subcategory, SpecField } from "@/lib/categoryData";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getShippingMethodsForUser, getPaymentMethodsForUser } from "@/lib/business-settings";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ProductImage {
  id: number;
  url: string;
  file?: File;
  isMain: boolean;
}

interface Variant {
  id: number;
  specs: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  details: string;
}

interface FormData {
  name: string;
  description: string;
  price: string;
  salePrice: string;
  costPrice: string;
  stock: string;
  lowStockAlert: string;
  sku: string;
  barcode: string;
  condition: string;
  taxEnabled: boolean;
  taxRate: string;
  warranty: string;
  weight: string;
  weightUnit: string;
  dimLength: string;
  dimWidth: string;
  dimHeight: string;
}

// ─── Gradient pool ────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  "from-[#667eea] to-[#764ba2]",
  "from-[#f093fb] to-[#f5576c]",
  "from-[#4facfe] to-[#00f2fe]",
  "from-[#43e97b] to-[#38f9d7]",
  "from-[#fa709a] to-[#fee140]",
  "from-[#a18cd1] to-[#fbc2eb]",
  "from-[#fccb90] to-[#d57eeb]",
  "from-[#e0c3fc] to-[#8ec5fc]",
];

function getGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, icon, children, accent = false }: { label: string; icon?: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border-2 transition-all duration-200 ${accent ? "border-indigo-200/60 bg-indigo-50 dark:bg-indigo-900/40" : "border-transparent bg-[var(--md-sys-color-surface)]"}`}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <i className={`fas ${icon} text-[10px] text-indigo-400`} />}
        <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--md-sys-color-on-surface-variant)]">{label}</label>
      </div>
      {children}
    </div>
  );
}

const PillInput = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  min?: string;
  step?: string;
}>(({ value, onChange, placeholder, type = "text", disabled, min, step }, ref) => (
  <input
    ref={ref}
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    min={min}
    step={step}
    className="w-full px-3 py-2 bg-[var(--md-sys-color-surface)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)] border border-[var(--md-sys-color-outline-variant)] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 transition-all duration-200 disabled:opacity-50"
  />
));
PillInput.displayName = "PillInput";

function SelectableCard({
  selected, onClick, children, className = "",
}: {
  selected: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <button onClick={onClick} className={`relative p-3 border-2 rounded-xl text-center cursor-pointer transition-all duration-200 active:scale-95 ${
      selected ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50 shadow-md shadow-indigo-500/10" : "border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)] hover:border-indigo-300 hover:shadow-sm"
    } ${className}`}>
      {selected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-sm">
          <i className="fas fa-check text-[9px]" />
        </div>
      )}
      {children}
    </button>
  );
}

function SpecButton({ label, selected, onClick, isCustom, multiple }: {
  label: string; selected: boolean; onClick: () => void; isCustom?: boolean; multiple?: boolean;
}) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border-2 text-xs md:text-sm font-semibold transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
      selected ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-500 shadow-md" : isCustom ? "border-dashed border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:border-indigo-400 hover:text-indigo-500" : "border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface-variant)] hover:border-indigo-400 hover:text-indigo-500 bg-[var(--md-sys-color-surface)]"
    }`}>
      {selected && <i className={`fas ${multiple ? "fa-check" : "fa-dot-circle"} text-[9px]`} />}
      {label}
    </button>
  );
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200/50">
      {label}
      <button onClick={onRemove} className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-indigo-200/60 transition-colors">
        <i className="fas fa-times text-[7px]" />
      </button>
    </span>
  );
}

function ImageCard({ image, index, onSetMain, onRemove, onReorder, totalImages }: {
  image: ProductImage; index: number; onSetMain: () => void; onRemove: () => void; onReorder: (from: number, to: number) => void; totalImages: number;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className={`relative rounded-xl overflow-hidden border-2 transition-all group ${image.isMain ? "border-indigo-500 shadow-md" : "border-[var(--md-sys-color-outline-variant)]"}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      draggable onDragStart={(e) => e.dataTransfer.setData("imageIndex", String(index))}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData("imageIndex")); if (from !== index) onReorder(from, index); }}>
      <img src={image.url} alt="" className="w-full h-24 md:h-28 object-cover" />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`}>
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
          <button onClick={onSetMain} className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${image.isMain ? "bg-indigo-500 text-white" : "bg-white/90 text-gray-700 hover:bg-white"}`}>
            {image.isMain ? "✓ Main" : "Set Main"}
          </button>
          <button onClick={onRemove} className="w-6 h-6 rounded-md bg-white/90 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
            <i className="fas fa-trash text-[9px]" />
          </button>
        </div>
      </div>
      {image.isMain && <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Main</div>}
      <div className={`absolute top-2 right-2 w-6 h-6 rounded-md bg-black/40 text-white flex items-center justify-center cursor-move transition-opacity ${hovered ? "opacity-100" : "opacity-0"}`}>
        <i className="fas fa-grip-vertical text-[9px]" />
      </div>
    </div>
  );
}

function ToastContainer({ toasts }: { toasts: { id: number; type: string; message: string }[] }) {
  return (
    <div className="fixed top-4 right-4 z-[2600] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-[slideInRight_0.3s_ease] min-w-[280px] ${t.type === "error" ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"}`}>
          <i className={`fas ${t.type === "error" ? "fa-exclamation-circle" : "fa-check-circle"} text-sm`} />
          <span className="text-sm font-semibold">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AddProductModal({ isOpen, onClose, onSuccess }: AddProductModalProps) {
  const { user } = useAuth();

  // ── Form State ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormData>({
    name: "", description: "", price: "", salePrice: "", costPrice: "",
    stock: "", lowStockAlert: "", sku: "", barcode: "", condition: "new",
    taxEnabled: false, taxRate: "16", warranty: "",
    weight: "", weightUnit: "kg", dimLength: "", dimWidth: "", dimHeight: "",
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryKey, setSelectedSubcategoryKey] = useState<string | null>(null);
  const currentCategory = selectedCategoryId ? categoryData[selectedCategoryId] : null;
  const currentSubcategory = currentCategory && selectedSubcategoryKey ? currentCategory.subcategories[selectedSubcategoryKey] : null;

  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, Set<string>>>({});
  const [customSpecOptions, setCustomSpecOptions] = useState<Record<string, string[]>>({});
  const [customInputState, setCustomInputState] = useState<{ specKey: string | null; fieldLabel: string }>({ specKey: null, fieldLabel: "" });
  const [customInputValue, setCustomInputValue] = useState("");

  const [variants, setVariants] = useState<Variant[]>([]);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [newShipping, setNewShipping] = useState({ name: "", price: "" });
  const [newPayment, setNewPayment] = useState({ name: "", details: "" });

  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; type: string; message: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const showToast = useCallback((type: string, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  useEffect(() => { if (isOpen) resetForm(); }, [isOpen]);
  useEffect(() => { if (!isCameraOpen && streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } }, [isCameraOpen]);
  useEffect(() => { setSelectedSpecs({}); setCustomSpecOptions({}); setVariants([]); }, [selectedCategoryId, selectedSubcategoryKey]);

  // ── Load shipping & payment methods from DB ────────────────────────────
  useEffect(() => {
    if (!isOpen || !user) return;
    const loadSettings = async () => {
      try {
        const [shippingMethodsData, paymentMethodsData] = await Promise.all([
          getShippingMethodsForUser(user),
          getPaymentMethodsForUser(user),
        ]);

        // Convert shipping methods (id, name, price: number) to modal format (id, name, price: string)
        if (shippingMethodsData && shippingMethodsData.length > 0) {
          setShippingMethods(shippingMethodsData.map(s => ({
            id: s.id,
            name: s.name,
            price: String(s.price),
          })));
        }

        // Convert payment methods from business profile object to array format
        if (paymentMethodsData) {
          const payments: PaymentMethod[] = [];
          if (paymentMethodsData.mpesa?.enabled) {
            payments.push({
              id: 'mpesa',
              name: 'M-Pesa',
              details: paymentMethodsData.mpesa.paybill?.businessName || paymentMethodsData.mpesa.buyGoods?.businessName || paymentMethodsData.mpesa.paybill?.paybillNumber || paymentMethodsData.mpesa.buyGoods?.tillNumber || 'Mobile Money',
            });
          }
          if (paymentMethodsData.bank?.enabled) {
            payments.push({
              id: 'bank',
              name: paymentMethodsData.bank.bankName || 'Bank Transfer',
              details: paymentMethodsData.bank.accountNumber || '',
            });
          }
          if (paymentMethodsData.card?.enabled) {
            payments.push({
              id: 'card',
              name: 'Card Payment',
              details: paymentMethodsData.card.instructions || paymentMethodsData.card.provider || '',
            });
          }
          if (paymentMethodsData.cash?.enabled) {
            payments.push({
              id: 'cash',
              name: 'Cash',
              details: paymentMethodsData.cash.instructions || 'Pay on delivery',
            });
          }
          if (payments.length > 0) {
            setPaymentMethods(payments);
          }
        }
      } catch (error) {
        console.error("Error loading business settings:", error);
      }
    };
    loadSettings();
  }, [isOpen, user]);

  const resetForm = () => {
    setForm({
      name: "", description: "", price: "", salePrice: "", costPrice: "",
      stock: "", lowStockAlert: "", sku: "", barcode: "", condition: "new",
      taxEnabled: false, taxRate: "16", warranty: "",
      weight: "", weightUnit: "kg", dimLength: "", dimWidth: "", dimHeight: "",
    });
    setSelectedCategoryId(null);
    setSelectedSubcategoryKey(null);
    setSelectedSpecs({});
    setCustomSpecOptions({});
    setVariants([]);
    setProductImages([]);
    setShippingMethods([]);
    setPaymentMethods([]);
    setNewShipping({ name: "", price: "" });
    setNewPayment({ name: "", details: "" });
    setErrors({});
    setCustomInputState({ specKey: null, fieldLabel: "" });
    setCustomInputValue("");
  };

  const update = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Required";
    if (!form.price || parseFloat(form.price) <= 0) errs.price = "Valid price required";
    if (!form.stock || parseInt(form.stock) < 0) errs.stock = "Valid stock required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Spec handlers ─────────────────────────────────────────────────────────
  const toggleSpec = (specKey: string, option: string, multiple: boolean = false) => {
    setSelectedSpecs((prev) => {
      const n = { ...prev };
      if (!n[specKey]) n[specKey] = new Set();
      if (n[specKey].has(option)) { n[specKey].delete(option); if (n[specKey].size === 0) delete n[specKey]; }
      else n[specKey].add(option);
      return n;
    });
  };

  const addCustomOption = (specKey: string, value: string) => {
    setCustomSpecOptions((prev) => ({ ...prev, [specKey]: [...(prev[specKey] || []), value] }));
    toggleSpec(specKey, value, false);
    setCustomInputState({ specKey: null, fieldLabel: "" });
    setCustomInputValue("");
  };

  // ── Variant generation ─────────────────────────────────────────────────────
  const generateVariants = useCallback(() => {
    const specEntries = Object.entries(selectedSpecs).filter(([_, s]) => s.size > 0);
    if (specEntries.length === 0) { setVariants([]); return; }
    const combinations = specEntries.reduce<string[][]>((acc, [_, s]) => acc.flatMap((a) => Array.from(s).map((c) => [...a, c])), [[]]);
    if (combinations.length > 100) { showToast("error", `Too many combinations (${combinations.length})`); return; }
    const baseSku = form.name?.toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9-]/g, "").slice(0, 15) || "PRODUCT";
    setVariants(combinations.map((combo, index) => {
      const vs: Record<string, string> = {};
      specEntries.forEach(([k, _], i) => { vs[k] = combo[i]; });
      return { id: index + 1, specs: vs, sku: `${baseSku}-${Object.values(vs).join("-").replace(/\s+/g, "").toUpperCase().slice(0, 30)}`, price: "", stock: "" };
    }));
  }, [selectedSpecs, form.name, showToast]);

  useEffect(() => { generateVariants(); }, [generateVariants]);

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) { showToast("error", "Image must be less than 5MB"); return; }
      const id = Date.now() + Math.random();
      const reader = new FileReader();
      reader.onload = () => setProductImages((prev) => [...prev, { id, url: reader.result as string, file, isMain: prev.length === 0 }]);
      reader.readAsDataURL(file);
    });
  };

  const addImageFromCamera = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { showToast("error", "Image must be less than 5MB"); return; }
    const id = Date.now() + Math.random();
    const reader = new FileReader();
    reader.onload = () => setProductImages((prev) => [...prev, { id, url: reader.result as string, file, isMain: prev.length === 0 }]);
    reader.readAsDataURL(file);
  };

  const removeImage = (id: number) => setProductImages((prev) => {
    const f = prev.filter((img) => img.id !== id);
    if (f.length > 0 && !f.some((img) => img.isMain)) f[0].isMain = true;
    return [...f];
  });

  const setMainImage = (id: number) => setProductImages((prev) => prev.map((img) => ({ ...img, isMain: img.id === id })));
  const reorderImages = (from: number, to: number) => setProductImages((prev) => {
    const n = [...prev]; const [m] = n.splice(from, 1); n.splice(to, 0, m); return n;
  });

  // ── Camera ────────────────────────────────────────────────────────────────
  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { showToast("error", "Unable to access camera"); setIsCameraOpen(false); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) addImageFromCamera(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setIsCameraOpen(false);
    }, "image/jpeg", 0.9);
  };

  // ── Upload & Save ──────────────────────────────────────────────────────────
  const uploadAllImages = async (): Promise<string[]> => {
    if (productImages.length === 0 || !user) return [];
    const uniqueImages = productImages.filter((img, i, self) => i === self.findIndex((t) => t.url === img.url));
    const urls: string[] = [];
    for (const img of uniqueImages) {
      if (img.file) {
        // Use stored File object directly — avoids data URL re-fetch issues on Android
        const result = await bunnyStorage.uploadFile(user, img.file, "products");
        if (result.success && result.url) urls.push(result.url);
      } else if (img.url.startsWith("data:")) {
        const blob = await (await fetch(img.url)).blob();
        const file = new File([blob], `image_${img.id}.webp`, { type: "image/webp" });
        const result = await bunnyStorage.uploadFile(user, file, "products");
        if (result.success && result.url) urls.push(result.url);
      } else urls.push(img.url);
    }
    return urls;
  };

  const ensureCategoriesPopulated = async (userId: string) => {
    const tenantId = `tenant_${userId}`;
    try {
      const sampleDoc = await getDoc(doc(db, "categoryNames", `${tenantId}_electronics`));
      if (sampleDoc.exists()) return;
      const categories = Object.values(categoryData);
      await Promise.all(categories.map(async (cat) => {
        const subcategories = Object.values(cat.subcategories).map(s => s.name);
        await setDoc(doc(db, "categoryNames", `${tenantId}_${cat.id}`), {
          id: cat.id, tenantId, mainCategory: cat.id, mainCategoryName: cat.name,
          icon: cat.icon, description: cat.description, subcategories,
          productCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
      }));
    } catch (err) { console.error("[AddProduct] Failed to create categories:", err); }
  };

  const saveProduct = async () => {
    if (!user) return;
    if (!validate()) return;
    setSaving(true);
    try {
      await ensureCategoriesPopulated(user.uid);
      const images = await uploadAllImages();
      const imageUrl = images[0];

      const vs = variants.map((v) => ({ ...v, price: parseFloat(v.price) || 0, stock: parseInt(v.stock) || 0 }));
      const totalStock = vs.reduce((s, v) => s + v.stock, 0);
      const minPrice = vs.some((v) => v.price > 0) ? Math.min(...vs.filter((v) => v.price > 0).map((v) => v.price)) : parseFloat(form.price) || 0;

      const brandValue = selectedSpecs.brand ? Array.from(selectedSpecs.brand)[0] : undefined;
      const typeValue = selectedSpecs.type ? Array.from(selectedSpecs.type)[0] : undefined;

      const filters: Record<string, string[]> = {};
      Object.entries(selectedSpecs).forEach(([k, set]) => { if (k !== "brand" && k !== "type" && set.size > 0) filters[k] = Array.from(set); });

      const shippingMethodsToSave = shippingMethods.filter(s => s.name.trim()).map(s => ({ id: s.id, name: s.name, price: parseFloat(s.price) || 0 }));
      const paymentMethodsToSave = paymentMethods.filter(p => p.name.trim()).map(p => ({ id: p.id, name: p.name, details: p.details }));

      const productToSave = await productService.createProduct(user, {
        name: form.name,
        description: form.description || undefined,
        price: minPrice,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        category: currentCategory?.name || selectedCategoryId!,
        categoryName: currentCategory?.name || selectedCategoryId!,
        subcategory: currentSubcategory?.name || selectedSubcategoryKey!,
        type: typeValue,
        brand: brandValue,
        categoryId: selectedCategoryId!,
        subcategoryId: selectedSubcategoryKey!,
        stock: totalStock || parseInt(form.stock) || 0,
        lowStockAlert: form.lowStockAlert ? parseInt(form.lowStockAlert) : undefined,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        condition: form.condition !== "new" ? form.condition : undefined,
        taxEnabled: form.taxEnabled || undefined,
        taxRate: form.taxEnabled && form.taxRate ? parseFloat(form.taxRate) : undefined,
        warranty: form.warranty || undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        weightUnit: form.weight ? form.weightUnit : undefined,
        dimensions: form.dimLength || form.dimWidth || form.dimHeight ? {
          length: form.dimLength ? parseFloat(form.dimLength) : undefined,
          width: form.dimWidth ? parseFloat(form.dimWidth) : undefined,
          height: form.dimHeight ? parseFloat(form.dimHeight) : undefined,
        } : undefined,
        image: imageUrl,
        images: images.length > 0 ? images : undefined,
        status: "active",
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        variants: vs.length > 0 ? vs.map((v, idx) => ({ id: `variant_${idx + 1}`, specs: v.specs, sku: v.sku || "", price: v.price, stock: v.stock })) : undefined,
        shippingMethods: shippingMethodsToSave.length > 0 ? shippingMethodsToSave : undefined,
        paymentMethods: paymentMethodsToSave.length > 0 ? paymentMethodsToSave : undefined,
      });

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const orderLink = `${baseUrl}/order?tenant=tenant_${user.uid}&product=${productToSave.id}`;
      await productService.updateProduct(user, productToSave.id, { orderLink });

      showToast("success", `"${form.name}" saved!`);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch (error) {
      console.error("Error saving product:", error);
      showToast("error", "Failed to save product");
    } finally { setSaving(false); }
  };

  // ── Camera UI ──────────────────────────────────────────────────────────────
  const renderCamera = () => isCameraOpen && (
    <div className="fixed inset-0 z-[2600] bg-black flex flex-col items-center justify-center animate-fadeIn">
      <div className="relative w-full max-w-lg bg-black rounded-2xl overflow-hidden">
        <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-[70vh] object-cover" />
        <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setIsCameraOpen(false); }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">
          <i className="fas fa-times text-lg" />
        </button>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <button onClick={capturePhoto} className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-500" />
          </button>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  // ── Derived values for preview ──────────────────────────────────────────────
  const productSeed = form.name || "New Product";
  const gradient = getGradient(productSeed);
  const previewPrice = form.price ? parseFloat(form.price) : null;
  const previewSalePrice = form.salePrice ? parseFloat(form.salePrice) : null;
  const hasDiscount = previewSalePrice && previewPrice && previewSalePrice > 0 && previewSalePrice < previewPrice;
  const discountPercent = hasDiscount ? Math.round(((previewPrice! - previewSalePrice!) / previewPrice!) * 100) : 0;

  // ── Condition options ──────────────────────────────────────────────────────
  const CONDITION_OPTIONS = ["new", "used", "refurbished", "open box"];

  return (
    <>
      <div className="modal-dialog-overlay" onClick={onClose}>
        <div 
          className="modal-dialog modal-dialog-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ─── Header ──────────────────────────────────────────────────── */}
          <div className="modal-dialog-header">
            <h2 className="modal-dialog-title">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md">
                <i className="fas fa-plus text-xs" />
              </div>
              <span>Add Product</span>
            </h2>
            <button 
              onClick={onClose} 
              disabled={saving} 
              className="modal-dialog-close"
              aria-label="Close"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>

          {/* ─── Body (Scrollable) ────────────────────────────────────────── */}
          <div className="modal-dialog-body space-y-4">
            {/* Live Preview Banner */}
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="relative group">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-indigo-400/20 to-violet-400/20 blur-xl animate-pulse" />
                <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xl font-bold text-white shadow-lg transition-all duration-300 group-hover:scale-105`}>
                  {(form.name || "P").charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] tracking-tight truncate max-w-[280px]">
                  {form.name || "New Product"}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 justify-center">
                  {previewPrice && (
                    <span className="text-sm font-bold text-indigo-500">
                      KES {previewPrice.toLocaleString()}
                      {hasDiscount && <span className="line-through text-xs text-rose-400 ml-1">KES {previewSalePrice!.toLocaleString()}</span>}
                    </span>
                  )}
                  {hasDiscount && discountPercent > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">-{discountPercent}%</span>
                  )}
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <FieldGroup label="Basic Info" icon="fa-info-circle" accent>
              <div className="space-y-3">
                <div>
                  <PillInput value={form.name} onChange={(v) => update("name", v)} placeholder="Product name" />
                  {errors.name && <p className="text-[10px] text-rose-500 font-semibold mt-1"><i className="fas fa-circle text-[4px] mr-1" />{errors.name}</p>}
                </div>
                <textarea value={form.description} onChange={(e) => update("description", e.target.value)}
                  placeholder="Description" rows={2}
                  className="w-full px-3 py-2 bg-[var(--md-sys-color-surface)] rounded-xl text-sm font-medium text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-outline)] border border-[var(--md-sys-color-outline-variant)] focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all" />
              </div>
            </FieldGroup>
            
            {/* ... rest of the form sections ... */}
            {/* (I'm keeping the internal form logic as is, just wrapping it in the new modal structure) */}
            
            {/* Pricing */}
            <FieldGroup label="Pricing" icon="fa-tag" accent>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <PillInput value={form.price} onChange={(v) => update("price", v)} placeholder="Price" type="number" min="0" />
                  {errors.price && <p className="text-[10px] text-rose-500 font-semibold mt-1"><i className="fas fa-circle text-[4px] mr-1" />{errors.price}</p>}
                </div>
                <PillInput value={form.salePrice} onChange={(v) => update("salePrice", v)} placeholder="Sale price" type="number" min="0" />
                <PillInput value={form.costPrice} onChange={(v) => update("costPrice", v)} placeholder="Cost price" type="number" min="0" />
              </div>
              {form.price && form.costPrice && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-emerald-600 font-semibold">
                  <i className="fas fa-chart-line" />
                  Profit: KES {(parseFloat(form.price) - parseFloat(form.costPrice)).toLocaleString()}
                  <span className="text-[10px] text-emerald-500">({Math.round(((parseFloat(form.price) - parseFloat(form.costPrice)) / parseFloat(form.price)) * 100)}% margin)</span>
                </div>
              )}
            </FieldGroup>

            {/* Inventory */}
            <FieldGroup label="Inventory" icon="fa-box" accent>
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <div>
                  <PillInput value={form.stock} onChange={(v) => update("stock", v)} placeholder="Stock" type="number" min="0" />
                  {errors.stock && <p className="text-[10px] text-rose-500 font-semibold mt-1"><i className="fas fa-circle text-[4px] mr-1" />{errors.stock}</p>}
                </div>
                <PillInput value={form.lowStockAlert} onChange={(v) => update("lowStockAlert", v)} placeholder="Low stock alert" type="number" min="0" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <PillInput value={form.sku} onChange={(v) => update("sku", v)} placeholder="SKU" />
                <PillInput value={form.barcode} onChange={(v) => update("barcode", v)} placeholder="Barcode" />
              </div>
            </FieldGroup>

            {/* Category */}
            <FieldGroup label="Category" icon="fa-tag">
              <div className="space-y-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[150px] overflow-y-auto p-0.5">
                  {Object.entries(categoryData).map(([catId, cat]) => (
                    <SelectableCard key={catId} selected={selectedCategoryId === catId} onClick={() => { setSelectedCategoryId(catId); setSelectedSubcategoryKey(null); }}>
                      <div className="text-xl mb-0.5">{(cat as Category).icon}</div>
                      <div className="font-bold text-[9px] text-[var(--md-sys-color-on-surface-variant)] line-clamp-2">{(cat as Category).name}</div>
                    </SelectableCard>
                  ))}
                </div>
                {selectedCategoryId && currentCategory && (
                  <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto">
                    {Object.entries(currentCategory.subcategories).map(([subKey, sub]) => (
                      <SpecButton key={subKey} label={(sub as Subcategory).name} selected={selectedSubcategoryKey === subKey} onClick={() => setSelectedSubcategoryKey(subKey)} />
                    ))}
                  </div>
                )}
              </div>
            </FieldGroup>

            {/* Specifications */}
            {currentSubcategory && (
              <FieldGroup label="Specifications" icon="fa-cogs">
                {Object.entries(currentSubcategory.specs).length === 0 ? (
                  <p className="text-xs text-[var(--md-sys-color-outline)] italic">No specs available</p>
                ) : (
                  <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                    {Object.entries(currentSubcategory.specs).map(([specKey, spec]) => {
                      const sf = spec as SpecField;
                      const options = [...sf.options, ...(customSpecOptions[specKey] || [])];
                      const selectedValues = selectedSpecs[specKey] || new Set();
                      const isMultiple = sf.multiple === true;
                      return (
                        <div key={specKey}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <i className={`fas ${sf.icon || "fa-tag"} text-[10px] text-indigo-400`} />
                            <span className="text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">{sf.label}</span>
                            {isMultiple && <span className="text-[8px] bg-indigo-100 px-1.5 py-0.5 rounded-full text-indigo-600 font-bold">Multi</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {options.map((opt) => (
                              <SpecButton key={opt} label={opt} selected={selectedValues.has(opt)}
                                onClick={() => toggleSpec(specKey, opt, isMultiple)} multiple={isMultiple} />
                            ))}
                            {sf.allowCustom && (
                              <SpecButton label="+ Add" selected={false} onClick={() => setCustomInputState({ specKey, fieldLabel: sf.label })} isCustom />
                            )}
                          </div>
                          {customInputState.specKey === specKey && (
                            <div className="flex gap-1.5 mt-1.5 animate-fadeIn">
                              <input type="text" value={customInputValue} onChange={(e) => setCustomInputValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && customInputValue.trim()) { addCustomOption(specKey, customInputValue.trim()); } }}
                                placeholder={`Custom ${sf.label.toLowerCase()}...`}
                                className="flex-1 px-2 py-1 rounded-lg border-2 border-indigo-400 text-xs focus:outline-none bg-white" autoFocus />
                              <button onClick={() => { if (customInputValue.trim()) addCustomOption(specKey, customInputValue.trim()); }}
                                className="px-2 py-1 bg-indigo-500 text-white rounded-lg text-xs hover:bg-indigo-600"><i className="fas fa-check" /></button>
                              <button onClick={() => setCustomInputState({ specKey: null, fieldLabel: "" })}
                                className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200"><i className="fas fa-times" /></button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </FieldGroup>
            )}

            {/* Variants */}
            <FieldGroup label="Variants" icon="fa-cubes">
              {variants.length === 0 ? (
                <p className="text-xs text-[var(--md-sys-color-outline)] italic">Select specs above to generate variants</p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  <p className="text-[10px] font-semibold text-[var(--md-sys-color-on-surface-variant)]">{variants.length} variant{variants.length > 1 ? "s" : ""}</p>
                  {variants.map((v, i) => (
                    <div key={v.id} className="grid grid-cols-[1fr_60px_60px] gap-2 items-center p-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                      <div className="flex flex-wrap gap-0.5">
                        {Object.values(v.specs).map((s, j) => (
                          <span key={j} className="text-[9px] px-1.5 py-0.5 bg-indigo-100 rounded-full text-indigo-700 font-medium">{s}</span>
                        ))}
                      </div>
                      <input type="number" value={v.price} onChange={(e) => setVariants((prev) => prev.map((x, idx) => idx === i ? { ...x, price: e.target.value } : x))}
                        placeholder="Price" className="w-full px-1.5 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] text-xs text-center font-bold focus:border-indigo-400 focus:outline-none bg-white" min="0" />
                      <input type="number" value={v.stock} onChange={(e) => setVariants((prev) => prev.map((x, idx) => idx === i ? { ...x, stock: e.target.value } : x))}
                        placeholder="Stock" className="w-full px-1.5 py-1 rounded-lg border border-[var(--md-sys-color-outline-variant)] text-xs text-center font-bold focus:border-indigo-400 focus:outline-none bg-white" min="0" />
                    </div>
                  ))}
                </div>
              )}
            </FieldGroup>

            {/* Details */}
            <FieldGroup label="Details" icon="fa-cog">
              <div className="space-y-2.5">
                {/* Condition */}
                <div className="flex gap-1.5">
                  {CONDITION_OPTIONS.map((c) => (
                    <button key={c} onClick={() => update("condition", c)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold border-2 transition-all active:scale-95 capitalize ${
                        form.condition === c ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-transparent bg-[var(--md-sys-color-surface-variant)]/40 text-[var(--md-sys-color-on-surface-variant)]"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* Weight */}
                <div className="grid grid-cols-[1fr_80px] gap-2">
                  <PillInput value={form.weight} onChange={(v) => update("weight", v)} placeholder="Weight" type="number" min="0" step="0.01" />
                  <select value={form.weightUnit} onChange={(e) => update("weightUnit", e.target.value)}
                    className="px-2 py-2 rounded-xl text-xs font-bold bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] focus:border-indigo-400 focus:outline-none transition-all">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lbs">lbs</option>
                    <option value="oz">oz</option>
                  </select>
                </div>

                {/* Dimensions */}
                <div className="grid grid-cols-3 gap-2">
                  <PillInput value={form.dimLength} onChange={(v) => update("dimLength", v)} placeholder="Length" type="number" min="0" step="0.1" />
                  <PillInput value={form.dimWidth} onChange={(v) => update("dimWidth", v)} placeholder="Width" type="number" min="0" step="0.1" />
                  <PillInput value={form.dimHeight} onChange={(v) => update("dimHeight", v)} placeholder="Height" type="number" min="0" step="0.1" />
                </div>
              </div>
            </FieldGroup>

            {/* Tax & Warranty */}
            <FieldGroup label="Tax & Warranty" icon="fa-file-invoice">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex items-center gap-2">
                    <i className={`fas fa-receipt text-sm ${form.taxEnabled ? "text-indigo-500" : "text-[var(--md-sys-color-outline)]"}`} />
                    <span className="text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">Enable Tax</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="number" value={form.taxRate} onChange={(e) => update("taxRate", e.target.value)}
                      disabled={!form.taxEnabled} placeholder="16" min="0" max="100"
                      className="w-16 px-2 py-1 rounded-lg text-xs font-bold text-center border border-[var(--md-sys-color-outline-variant)] focus:border-indigo-400 focus:outline-none disabled:opacity-40 bg-white" />
                    <span className="text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)]">%</span>
                    <button onClick={() => update("taxEnabled", !form.taxEnabled)}
                      className={`relative w-10 h-5 rounded-full transition-all ${form.taxEnabled ? "bg-indigo-500" : "bg-gray-300"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.taxEnabled ? "left-5" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
                <PillInput value={form.warranty} onChange={(v) => update("warranty", v)} placeholder="Warranty info (e.g. 1 year manufacturer)" />
              </div>
            </FieldGroup>

            {/* Shipping Methods */}
            <FieldGroup label="Shipping" icon="fa-truck">
              {shippingMethods.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                  <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)] flex-1">{s.name}</span>
                  <span className="text-xs font-bold text-indigo-500">KES {s.price}</span>
                  <button onClick={() => setShippingMethods((prev) => prev.filter((_, idx) => idx !== i))}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all">
                    <i className="fas fa-times text-[8px]" />
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5">
                <PillInput value={newShipping.name} onChange={(v) => setNewShipping((p) => ({ ...p, name: v }))} placeholder="Method name" />
                <PillInput value={newShipping.price} onChange={(v) => setNewShipping((p) => ({ ...p, price: v }))} placeholder="Price" type="number" min="0" />
                <button onClick={() => { if (!newShipping.name.trim()) return; setShippingMethods((prev) => [...prev, { id: `ship_${Date.now()}`, name: newShipping.name, price: newShipping.price }]); setNewShipping({ name: "", price: "" }); }}
                  className="shrink-0 w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 hover:bg-indigo-200 flex items-center justify-center transition-all active:scale-90">
                  <i className="fas fa-plus text-xs" />
                </button>
              </div>
            </FieldGroup>

            {/* Payment Methods */}
            <FieldGroup label="Payment" icon="fa-credit-card">
              {paymentMethods.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]">
                  <div className="flex-1">
                    <span className="text-xs font-medium text-[var(--md-sys-color-on-surface)]">{p.name}</span>
                    {p.details && <span className="text-[10px] text-[var(--md-sys-color-outline)] ml-2">{p.details}</span>}
                  </div>
                  <button onClick={() => setPaymentMethods((prev) => prev.filter((_, idx) => idx !== i))}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 transition-all">
                    <i className="fas fa-times text-[8px]" />
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5">
                <PillInput value={newPayment.name} onChange={(v) => setNewPayment((p) => ({ ...p, name: v }))} placeholder="Payment method" />
                <PillInput value={newPayment.details} onChange={(v) => setNewPayment((p) => ({ ...p, details: v }))} placeholder="Details" />
                <button onClick={() => { if (!newPayment.name.trim()) return; setPaymentMethods((prev) => [...prev, { id: `pay_${Date.now()}`, name: newPayment.name, details: newPayment.details }]); setNewPayment({ name: "", details: "" }); }}
                  className="shrink-0 w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 hover:bg-indigo-200 flex items-center justify-center transition-all active:scale-90">
                  <i className="fas fa-plus text-xs" />
                </button>
              </div>
            </FieldGroup>

            {/* Images */}
            <FieldGroup label="Images" icon="fa-image">
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {productImages.map((img, idx) => (
                  <ImageCard key={img.id} image={img} index={idx} onSetMain={() => setMainImage(img.id)} onRemove={() => removeImage(img.id)} onReorder={reorderImages} totalImages={productImages.length} />
                ))}
                <div className="flex flex-col gap-1.5">
                  <label className="border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-xl p-2 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center h-24 group">
                    <i className="fas fa-plus text-[var(--md-sys-color-outline)] text-lg mb-0.5 group-hover:text-indigo-500" />
                    <span className="text-[9px] text-[var(--md-sys-color-outline)] group-hover:text-indigo-500">Upload</span>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />
                  </label>
                  <button onClick={openCamera} className="border-2 border-dashed border-[var(--md-sys-color-outline-variant)] rounded-xl p-1 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center group">
                    <i className="fas fa-camera text-[var(--md-sys-color-outline)] text-lg mb-0.5 group-hover:text-indigo-500" />
                    <span className="text-[9px] text-[var(--md-sys-color-outline)] group-hover:text-indigo-500">Camera</span>
                  </button>
                </div>
              </div>
            </FieldGroup>
          </div>

          {/* ─── Footer ──────────────────────────────────────────────────── */}
          <div className="modal-dialog-footer">
            <button 
              onClick={onClose} 
              disabled={saving} 
              className="px-4 py-2.5 rounded-xl font-semibold text-sm text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] transition-all active:scale-95"
            >
              Cancel
            </button>
            <button 
              onClick={saveProduct} 
              disabled={saving}
              className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <><i className="fas fa-circle-notch fa-spin text-sm" />Saving...</>
              ) : (
                <><i className="fas fa-sparkles text-sm" />Save Product</>
              )}
            </button>
          </div>
        </div>
      </div>

      {renderCamera()}
      <ToastContainer toasts={toasts} />
    </>
  );
}
