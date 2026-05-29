"use client";

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, getDocs, updateDoc, serverTimestamp, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
// IMPORT THE EXPANDED SERVICE DATA
import { serviceData, SERVICE_CATEGORIES, getServiceSubcategories, getServiceSpecs, ServiceSpec } from "@/lib/serviceCategoryData";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AddServiceButtonRef {
  open: () => void;
}

type ServiceCategoryId = keyof typeof serviceData;
type Tier = "basic" | "standard" | "premium";
type Mode = "in-person" | "remote" | "both";
type Location = "client-place" | "my-place" | "both-places" | "remote";

interface ServiceFormData {
  providerName: string;
  serviceName: string;
  description: string;
  businessType: ServiceCategoryId | null;
  subcategoryKey: string | null;  // NEW: Selected subcategory
  mode: Mode;
  location: Location;
  duration: string;
  customDuration: string;
  tier: Tier;
  specs: Record<string, Set<string>>;
  days: Set<string>;
  times: Set<string>;
  prices: Record<Tier, string>;
  deposit: boolean;
  rescheduling: boolean;
  cancellationNotice: boolean;
  serviceRadius: string;
  portfolioImages: File[];
}

const DEFAULT_TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info", icon: "fa-info-circle" },
  { id: 2, label: "Category", icon: "fa-store" },
  { id: 3, label: "Subcategory", icon: "fa-layer-group" },  // NEW STEP
  { id: 4, label: "Specifications", icon: "fa-sliders-h" },
  { id: 5, label: "Pricing", icon: "fa-tags" },
  { id: 6, label: "Availability", icon: "fa-calendar-alt" },
  { id: 7, label: "Details", icon: "fa-map-pin" },
  { id: 8, label: "Portfolio", icon: "fa-images" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function generateTimeSlots(durationMinutes: number): string[] {
  const slots: string[] = [];
  const startHour = 9;
  const endHour = 17;
  let interval = 60;
  if (durationMinutes <= 30) interval = 30;
  else if (durationMinutes <= 45) interval = 45;
  else if (durationMinutes <= 60) interval = 60;
  else if (durationMinutes <= 90) interval = 90;
  else interval = 120;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += interval) {
      if (hour + minute / 60 >= endHour) break;
      const h = hour % 12 || 12;
      const ampm = hour < 12 ? "AM" : "PM";
      const m = minute === 0 ? "00" : minute.toString();
      slots.push(`${h}:${m} ${ampm}`);
    }
  }
  return slots.length > 0 ? slots : DEFAULT_TIME_SLOTS;
}

function getStepValidation(step: number, form: ServiceFormData): boolean {
  switch (step) {
    case 1:
      return form.providerName.trim().length > 0 && form.serviceName.trim().length > 0 && form.description.trim().length > 10;
    case 2:
      return form.businessType !== null;
    case 3:
      return form.subcategoryKey !== null;
    case 4:
      return Object.keys(form.specs).length > 0;
    case 5:
      return Object.values(form.prices).some((p) => p && Number(p) > 0);
    case 6:
      return form.days.size > 0;
    case 7:
      return true;
    case 8:
      return true;
    default:
      return true;
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-between px-2 md:px-6 py-4 border-b border-outline-variant bg-surface overflow-x-auto">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const isLast = idx === WIZARD_STEPS.length - 1;

        return (
          <div key={step.id} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-1.5 min-w-[60px] md:min-w-[80px]">
              <div
                className={`
                  w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center
                  text-xs md:text-sm font-bold transition-all duration-300
                  ${isActive
                    ? "bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/25 scale-110"
                    : isCompleted
                      ? "bg-[#10b981] text-white"
                      : "bg-surface-variant text-outline"
                  }
                `}
              >
                {isCompleted ? (
                  <i className="fas fa-check text-xs" />
                ) : (
                  <i className={`fas ${step.icon}`} />
                )}
              </div>
              <span
                className={`
                  text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors
                  ${isActive ? "text-[#8b5cf6]" : isCompleted ? "text-[#10b981]" : "text-outline"}
                `}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`
                  w-4 md:w-8 h-[2px] mx-1 md:mx-2 rounded-full transition-colors duration-300 shrink-0
                  ${isCompleted ? "bg-[#10b981]" : "bg-surface-variant"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FormSection({ title, icon, children, isValid = true }: {
  title: string;
  icon: string;
  children: React.ReactNode;
  isValid?: boolean;
}) {
  return (
    <div className="form-section">
      <div className="section-title flex items-center gap-2">
        <div className={`
          w-6 h-6 rounded-md flex items-center justify-center text-xs
          ${isValid ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" : "bg-[#ef4444]/10 text-[#ef4444]"}
        `}>
          <i className={`fas ${icon}`} />
        </div>
        <span>{title}</span>
        {!isValid && (
          <span className="ml-auto text-[10px] font-bold text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded-full">
            Required
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative w-14 h-8 rounded-full transition-colors duration-200
          ${checked ? "bg-[var(--md-sys-color-primary)]" : "bg-[var(--md-sys-color-outline)]"}
        `}
        aria-checked={checked}
        role="switch"
      >
        <div
          className={`
            absolute top-1 w-6 h-6 bg-surface rounded-full shadow-md
            transition-transform duration-200
            ${checked ? "translate-x-7" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}

// NEW: SpecButton component for service specifications
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
          ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-md"
          : isCustom
            ? "border-dashed border-outline-variant text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            : "border-outline-variant text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] bg-surface"
        }
      `}
    >
      {selected && multiple && <i className="fas fa-check text-[9px]" />}
      {selected && !multiple && <i className="fas fa-dot-circle text-[8px]" />}
      {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AddServiceButton = forwardRef<AddServiceButtonRef, {}>((_props, ref) => {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeCustomSpec, setActiveCustomSpec] = useState<string | null>(null);
  const [tempCustomValue, setTempCustomValue] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  
  // Camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTargetIndex, setCameraTargetIndex] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [form, setForm] = useState<ServiceFormData>({
    providerName: "",
    serviceName: "",
    description: "",
    businessType: null,
    subcategoryKey: null,
    mode: "in-person",
    location: "client-place",
    duration: "60",
    customDuration: "",
    tier: "standard",
    specs: {},
    days: new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]),
    times: new Set(),
    prices: { basic: "", standard: "", premium: "" },
    deposit: false,
    rescheduling: true,
    cancellationNotice: true,
    serviceRadius: "",
    portfolioImages: [],
  });

  // Expose open method to parent
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
      setCurrentStep(1);
    },
  }));

  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!isCameraOpen && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, [isCameraOpen]);

  // Reset specs when category or subcategory changes
  useEffect(() => {
    setForm(prev => ({ ...prev, specs: {} }));
  }, [form.businessType, form.subcategoryKey]);

  // ─── Form Helpers ──────────────────────────────────────────────────────────

  const updateForm = useCallback(<K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSpec = (specKey: string, option: string, multiple: boolean = true) => {
    setForm((prev) => {
      const currentSet = new Set(prev.specs[specKey] || []);
      
      if (multiple) {
        if (currentSet.has(option)) currentSet.delete(option);
        else currentSet.add(option);
      } else {
        // Single select - replace with new option
        return {
          ...prev,
          specs: { ...prev.specs, [specKey]: new Set([option]) }
        };
      }
      
      return {
        ...prev,
        specs: { ...prev.specs, [specKey]: currentSet.size > 0 ? currentSet : new Set<string>() }
      };
    });
  };

  const toggleDay = (day: string) => {
    setForm((prev) => {
      const newDays = new Set(prev.days);
      if (newDays.has(day)) newDays.delete(day);
      else newDays.add(day);
      return { ...prev, days: newDays };
    });
  };

  const toggleTime = (time: string) => {
    setForm((prev) => {
      const newTimes = new Set(prev.times);
      if (newTimes.has(time)) newTimes.delete(time);
      else newTimes.add(time);
      return { ...prev, times: newTimes };
    });
  };

  const addCustomOption = (specKey: string, value: string) => {
    toggleSpec(specKey, value, true);
    setActiveCustomSpec(null);
    setTempCustomValue("");
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setForm((prev) => {
        const newImages = [...prev.portfolioImages];
        newImages[index] = files[0];
        return { ...prev, portfolioImages: newImages.filter(Boolean) as File[] };
      });
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
    }));
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      setForm((prev) => {
        const newImages = [...prev.portfolioImages];
        newImages[index] = files[0];
        return { ...prev, portfolioImages: newImages.filter(Boolean) as File[] };
      });
    }
  };

  // ─── Camera Functions ──────────────────────────────────────────────────────
  
  const openCamera = async (index: number) => {
    setCameraTargetIndex(index);
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
      alert("Unable to access camera. Please check permissions or use file upload instead.");
      setIsCameraOpen(false);
      setCameraTargetIndex(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || cameraTargetIndex === null) return;
    
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
        setForm((prev) => {
          const newImages = [...prev.portfolioImages];
          newImages[cameraTargetIndex] = file;
          return { ...prev, portfolioImages: newImages.filter(Boolean) as File[] };
        });
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCameraOpen(false);
      setCameraTargetIndex(null);
    }, "image/jpeg", 0.9);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCameraTargetIndex(null);
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const canProceed = getStepValidation(currentStep, form);

  const nextStep = () => {
    if (canProceed && currentStep < WIZARD_STEPS.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  const closeModal = () => {
    if (isSaving || isUploading) return;
    setShowCloseConfirm(true);
  };

  const confirmClose = () => {
    setIsOpen(false);
    setShowCloseConfirm(false);
    setCurrentStep(1);
    setForm({
      providerName: "",
      serviceName: "",
      description: "",
      businessType: null,
      subcategoryKey: null,
      mode: "in-person",
      location: "client-place",
      duration: "60",
      customDuration: "",
      tier: "standard",
      specs: {},
      days: new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]),
      times: new Set(),
      prices: { basic: "", standard: "", premium: "" },
      deposit: false,
      rescheduling: true,
      cancellationNotice: true,
      serviceRadius: "",
      portfolioImages: [],
    });
  };

  const cancelClose = () => {
    setShowCloseConfirm(false);
  };

  /**
   * Auto-populate service category names collection for WhatsApp bot
   */
  const ensureServiceCategoriesPopulated = async (userId: string) => {
    const tenantId = `tenant_${userId}`;
    
    try {
      console.log(`[AddService] ensureServiceCategoriesPopulated called for tenant: ${tenantId}`);
      
      // Get ALL serviceCategoryNames documents for this tenant
      const snapshot = await getDocs(
        query(
          collection(db, "serviceCategoryNames"),
          where("tenantId", "==", tenantId)
        )
      );
      
      console.log(`[AddService] Found ${snapshot.size} existing serviceCategoryNames documents`);
      
      const categories = SERVICE_CATEGORIES;
      const updates: Promise<void>[] = [];
      let created = 0;
      let updated = 0;
      
      // Check each category and create/update as needed
      for (const category of categories) {
        const docId = `${tenantId}_${category.id}`;
        const existingDoc = snapshot.docs.find(d => d.id === docId);
        const subcategoriesList = getServiceSubcategories(category.id);
        
        // Store both display names (for UI) and key-to-name mapping (for bot)
        const subcategories = subcategoriesList.map(sub => sub.name);
        const subcategoryMap = subcategoriesList.reduce((acc, sub) => {
          acc[sub.key] = sub.name;
          return acc;
        }, {} as Record<string, string>);
        
        if (!existingDoc || !existingDoc.exists()) {
          // Create new document
          console.log(`[AddService] Creating NEW service category: ${category.id}`);
          updates.push(setDoc(doc(db, "serviceCategoryNames", docId), {
            id: category.id,
            tenantId: tenantId,
            mainCategory: category.id,
            mainCategoryName: category.name,
            icon: category.icon,
            description: category.description,
            subcategories: subcategories,
            subcategoryMap: subcategoryMap,
            serviceCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }));
          created++;
        } else {
          // Update existing document if missing required fields
          const data = existingDoc.data();
          const missingFields = [];
          if (!data.mainCategory) missingFields.push('mainCategory');
          if (!data.mainCategoryName) missingFields.push('mainCategoryName');
          if (!data.subcategoryMap) missingFields.push('subcategoryMap');
          if (data.serviceCount === undefined) missingFields.push('serviceCount');
          
          if (missingFields.length > 0) {
            console.log(`[AddService] Updating service category: ${category.id} - Missing fields: ${missingFields.join(', ')}`);
            updates.push(updateDoc(doc(db, "serviceCategoryNames", docId), {
              mainCategory: category.id,
              mainCategoryName: category.name,
              subcategoryMap: subcategoryMap,
              serviceCount: data.serviceCount || 0,
              updatedAt: serverTimestamp(),
            }));
            updated++;
          } else {
            console.log(`[AddService] Service category ${category.id} is complete - no update needed`);
          }
        }
      }
      
      if (updates.length > 0) {
        await Promise.all(updates);
        console.log(`[AddService] ✅ Successfully processed service categories: ${created} created, ${updated} updated`);
      } else {
        console.log(`[AddService] All service categories are already up to date`);
      }
    } catch (error) {
      console.error('[AddService] ❌ Failed to populate service categories:', error);
      // Don't throw - let service save continue even if categories fail
    }
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const saveService = async () => {
    if (!user) {
      alert("You must be logged in to create a service");
      return;
    }

    setIsSaving(true);
    try {
      // Auto-create service categories on first service
      await ensureServiceCategoriesPopulated(user.uid);
      
      const selectedCategory = serviceData[form.businessType!];
      const selectedSubcategory = selectedCategory?.subcategories[form.subcategoryKey!];
      
      const specs: Record<string, string[]> = {};
      Object.entries(form.specs).forEach(([key, set]) => {
        specs[key] = Array.from(set);
      });

      const packagePrices: { basic?: number; standard?: number; premium?: number } = {};
      if (form.prices.basic && Number(form.prices.basic) > 0) packagePrices.basic = Number(form.prices.basic);
      if (form.prices.standard && Number(form.prices.standard) > 0) packagePrices.standard = Number(form.prices.standard);
      if (form.prices.premium && Number(form.prices.premium) > 0) packagePrices.premium = Number(form.prices.premium);

      if (Object.keys(packagePrices).length === 0) {
        alert("Please enter at least one price");
        setIsSaving(false);
        return;
      }

      let portfolioImageUrls: string[] = [];
      const validImages = form.portfolioImages;
      if (validImages.length > 0) {
        setIsUploading(true);
        try {
          const uploadPromises = validImages.map((img) => bunnyStorage.uploadFile(user, img, "services"));
          const uploadResults = await Promise.all(uploadPromises);
          portfolioImageUrls = uploadResults
            .filter((result) => result.success && result.url)
            .map((result) => result.url!);
        } catch (error) {
          console.error("Upload error:", error);
          alert("Failed to upload images");
          setIsSaving(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      const validPrices = Object.values(packagePrices).filter((p): p is number => p !== undefined);
      const priceMin = validPrices.length > 0 ? Math.min(...validPrices) : 0;
      const priceMax = validPrices.length > 0 ? Math.max(...validPrices) : priceMin;

      const durationValue = form.duration === "custom" ? form.customDuration || "Custom" : `${form.duration} min`;

      const timeSlots = form.times.size > 0 ? Array.from(form.times).sort() : DEFAULT_TIME_SLOTS;

      const serviceDataToSave = {
        name: form.serviceName,
        description: form.description,
        providerName: form.providerName,
        emoji: selectedCategory?.icon || "✨",
        bgGradient: selectedCategory?.gradient || "from-gray-100 to-gray-200",
        duration: durationValue,
        location: form.location,
        tags: [form.businessType!, form.subcategoryKey!, ...(specs.service_type || [])].slice(0, 5),
        priceMin,
        priceMax,
        packagePrices,
        businessType: form.businessType!,
        businessCategory: selectedCategory?.name || form.businessType!,
        serviceName: specs.service_type?.[0] || selectedSubcategory?.name || form.serviceName,
        categoryName: selectedCategory?.name || form.businessType!,
        subcategory: form.subcategoryKey!,  // NEW: Save subcategory for browsing
        subcategoryName: selectedSubcategory?.name,
        specifications: specs,
        tier: form.tier,
        mode: form.mode,
        selectedDuration: Number(form.duration),
        status: "active" as const,
        portfolioImages: portfolioImageUrls,
        imageUrl: portfolioImageUrls.length > 0 ? portfolioImageUrls[0] : undefined,
        packageFeatures: {
          basic: packagePrices.basic ? ["Core service included", "Professional quality"] : [],
          standard: packagePrices.standard ? ["Everything in Basic", "Priority scheduling", "Enhanced support"] : [],
          premium: packagePrices.premium ? ["Everything in Standard", "VIP treatment", "24/7 support"] : [],
        },
        availability: {
          days: Array.from(form.days).sort(),
          timeSlots,
        },
        customTimeSlots: generateTimeSlots(Number(form.duration)),
        // Booking Policy Fields
        depositRequired: form.deposit,
        reschedulingAllowed: form.rescheduling,
        cancellationNoticeHours: form.cancellationNotice ? 24 : 0,
        serviceRadiusKm: form.serviceRadius ? Number(form.serviceRadius) : undefined,
      };

      const createdService = await serviceService.createService(user, serviceDataToSave);
      const bookingUrl = `${window.location.origin}/book/${createdService.id}`;
      await serviceService.updateService(user, createdService.id, { bookingUrl });

      closeModal();
      window.location.reload();
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service. Please try again.");
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  // ─── Render Steps ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Service Information" icon="fa-info-circle" isValid={canProceed}>
        <div className="space-y-5">
          <div className="md3-input-outlined">
            <input
              type="text"
              id="providerName"
              placeholder=" "
              value={form.providerName}
              onChange={(e) => updateForm("providerName", e.target.value)}
            />
            <label htmlFor="providerName">Business / Provider Name *</label>
          </div>
          <div className="md3-input-outlined">
            <input
              type="text"
              id="serviceName"
              placeholder=" "
              value={form.serviceName}
              onChange={(e) => updateForm("serviceName", e.target.value)}
            />
            <label htmlFor="serviceName">Service Name *</label>
          </div>
          <div className="md3-input-outlined">
            <textarea
              id="description"
              rows={4}
              placeholder=" "
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
            <label htmlFor="description">Description *</label>
            <div className="md3-input-helper text-right">
              {form.description.length} chars {form.description.length < 10 && "(min 10)"}
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );

  // NEW: Step 2 - Category Selection (using expanded 18 categories)
  const renderStep2 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Select Service Category" icon="fa-store" isValid={canProceed}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-3 max-h-[60vh] overflow-y-auto p-1">
          {SERVICE_CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                updateForm("businessType", category.id as ServiceCategoryId);
                updateForm("subcategoryKey", null);
              }}
              className={`
                relative p-3 md:p-4 rounded-xl border-2 transition-all duration-200 text-center
                ${form.businessType === category.id
                  ? "border-[#8b5cf6] bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] shadow-md shadow-[#8b5cf6]/10"
                  : "border-outline-variant bg-surface hover:border-outline-variant hover:shadow-sm"
                }
              `}
            >
              <div className="text-2xl md:text-3xl mb-1.5">{category.icon}</div>
              <div className="text-xs md:text-sm font-bold text-on-surface-variant line-clamp-2">{category.name}</div>
              {form.businessType === category.id && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#8b5cf6] rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-white text-[9px]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </FormSection>
    </div>
  );

  // NEW: Step 3 - Subcategory Selection
  const renderStep3 = () => {
    if (!form.businessType) return null;
    
    const subcategories = getServiceSubcategories(form.businessType);
    
    if (subcategories.length === 0) {
      return (
        <div className="text-center py-12 text-on-surface-variant">
          <i className="fas fa-layer-group text-4xl mb-3 opacity-50" />
          <p>No subcategories available for this service type</p>
          <p className="text-xs mt-1">You can proceed to specifications</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 animate-fadeIn">
        <FormSection title="Select Subcategory" icon="fa-layer-group" isValid={canProceed}>
          <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto p-1">
            {subcategories.map((sub) => (
              <SpecButton
                key={sub.key}
                label={sub.name}
                selected={form.subcategoryKey === sub.key}
                onClick={() => updateForm("subcategoryKey", sub.key)}
                multiple={false}
              />
            ))}
          </div>
        </FormSection>
      </div>
    );
  };

  // UPDATED: Step 4 - Specifications (using expanded service specs)
  const renderStep4 = () => {
    if (!form.businessType || !form.subcategoryKey) {
      return (
        <div className="text-center py-12 text-on-surface-variant">
          <i className="fas fa-sliders-h text-4xl mb-3 opacity-50" />
          <p>Please select a category and subcategory first</p>
        </div>
      );
    }
    
    const specs = getServiceSpecs(form.businessType, form.subcategoryKey);
    
    if (!specs || Object.keys(specs).length === 0) {
      return (
        <div className="text-center py-12 text-on-surface-variant">
          <i className="fas fa-cogs text-4xl mb-3 opacity-50" />
          <p>No specifications available for this service</p>
          <p className="text-xs mt-1">You can still proceed to pricing</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4 animate-fadeIn">
        <FormSection title="Service Specifications" icon="fa-sliders-h" isValid={canProceed}>
          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {Object.entries(specs).map(([specKey, spec]) => {
              const selectedValues = form.specs[specKey] || new Set<string>();
              const isMultiple = spec.multiple !== false; // Default to true
              
              return (
                <div key={specKey} className="bg-surface rounded-xl p-4 border border-outline-variant">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white text-xs">
                      <i className={`fas ${spec.icon}`} />
                    </div>
                    <span className="font-bold text-sm text-on-surface-variant">{spec.label}</span>
                    {isMultiple && (
                      <span className="text-[10px] bg-surface-variant px-2 py-0.5 rounded-full text-on-surface-variant">
                        Multi-select
                      </span>
                    )}
                    {spec.allowCustom && (
                      <span className="text-[10px] bg-[#8b5cf6]/10 px-2 py-0.5 rounded-full text-[#8b5cf6]">
                        Custom allowed
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {spec.options.map((option) => (
                      <SpecButton
                        key={option}
                        label={option}
                        selected={selectedValues.has(option)}
                        onClick={() => toggleSpec(specKey, option, isMultiple)}
                        multiple={isMultiple}
                      />
                    ))}
                    {spec.allowCustom && activeCustomSpec !== specKey && (
                      <SpecButton
                        label="+ Add Custom"
                        selected={false}
                        onClick={() => setActiveCustomSpec(specKey)}
                        isCustom
                      />
                    )}
                  </div>
                  
                  {activeCustomSpec === specKey && (
                    <div className="flex gap-2 mt-3 animate-fadeIn">
                      <input
                        type="text"
                        value={tempCustomValue}
                        onChange={(e) => setTempCustomValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && tempCustomValue.trim()) {
                            addCustomOption(specKey, tempCustomValue.trim());
                          }
                          if (e.key === "Escape") {
                            setActiveCustomSpec(null);
                            setTempCustomValue("");
                          }
                        }}
                        placeholder={`Enter custom ${spec.label.toLowerCase()}...`}
                        className="flex-1 px-3 py-2 rounded-lg border-2 border-[#8b5cf6] text-sm focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          if (tempCustomValue.trim()) addCustomOption(specKey, tempCustomValue.trim());
                        }}
                        className="px-3 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
                      >
                        <i className="fas fa-check" />
                      </button>
                      <button
                        onClick={() => {
                          setActiveCustomSpec(null);
                          setTempCustomValue("");
                        }}
                        className="px-3 py-2 bg-surface-variant text-on-surface-variant rounded-lg hover:bg-[#cbd5e1] transition-colors"
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </FormSection>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Pricing Packages" icon="fa-tags" isValid={canProceed}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {([
            { key: "basic" as const, label: "Basic", badge: "Basic", color: "from-[#94a3b8] to-[#64748b]" },
            { key: "standard" as const, label: "Standard", badge: "Popular", color: "from-[#8b5cf6] to-[#7c3aed]" },
            { key: "premium" as const, label: "Premium", badge: "Best", color: "from-[#f59e0b] to-[#d97706]" },
          ]).map((tier) => (
            <div
              key={tier.key}
              onClick={() => updateForm("tier", tier.key)}
              className={`
                relative p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${form.tier === tier.key
                  ? "border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/10"
                  : "border-outline-variant hover:border-outline-variant"
                }
              `}
            >
              <div className={`
                absolute -top-2 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white
                bg-gradient-to-r ${tier.color}
              `}>
                {tier.badge}
              </div>
              <div className="text-sm font-bold text-on-surface-variant mb-3 mt-1">{tier.label} Package</div>
              <div className="relative md3-input-outlined mt-2">
                <span className="absolute left-4 top-0 text-[var(--md-sys-color-on-surface-variant)] text-sm font-medium pointer-events-none bg-[var(--md-sys-color-surface)] px-1 z-10">KES</span>
                <input
                  type="number"
                  id={`price-${tier.key}`}
                  placeholder=" "
                  value={form.prices[tier.key]}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    prices: { ...prev.prices, [tier.key]: e.target.value },
                  }))}
                  onClick={(e) => e.stopPropagation()}
                />
                <label htmlFor={`price-${tier.key}`} className="left-10">Price</label>
              </div>
              <div className="mt-3 space-y-1.5">
                {tier.key === "basic" && (
                  <>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Core service included</div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Professional quality</div>
                  </>
                )}
                {tier.key === "standard" && (
                  <>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Everything in Basic</div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Priority scheduling</div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Enhanced support</div>
                  </>
                )}
                {tier.key === "premium" && (
                  <>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Everything in Standard</div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> VIP treatment</div>
                    <div className="text-[11px] text-on-surface-variant flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> 24/7 support</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );

  const renderStep6 = () => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const times = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

    return (
      <div className="space-y-4 animate-fadeIn">
        <FormSection title="Availability" icon="fa-calendar-alt" isValid={canProceed}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Working Days</label>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`
                      w-12 h-12 md:w-14 md:h-14 rounded-xl border-2 flex flex-col items-center justify-center
                      transition-all duration-200 text-xs font-bold
                      ${form.days.has(day)
                        ? "border-[#8b5cf6] bg-[#ede9fe] text-[#8b5cf6] shadow-sm"
                        : "border-outline-variant bg-surface text-outline hover:border-outline-variant"
                      }
                    `}
                  >
                    <span className="text-[10px] md:text-xs">{day}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Time Slots</label>
              <div className="flex flex-wrap gap-2 max-h-[30vh] overflow-y-auto p-1">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`
                      px-3 py-2 rounded-lg border-2 text-xs font-semibold
                      transition-all duration-200
                      ${form.times.has(time)
                        ? "border-[#8b5cf6] bg-[#ede9fe] text-[#8b5cf6]"
                        : "border-outline-variant bg-surface text-on-surface-variant hover:border-outline-variant"
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {form.times.size === 0 && (
                <p className="text-[11px] text-outline mt-2">Default slots will be used if none selected</p>
              )}
            </div>
          </div>
        </FormSection>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Delivery Mode" icon="fa-briefcase">
        <div className="flex flex-wrap gap-2">
          {([
            { key: "in-person", label: "In-Person", icon: "fa-map-marker-alt" },
            { key: "remote", label: "Remote/Video", icon: "fa-video" },
            { key: "both", label: "Both", icon: "fa-random" },
          ] as const).map((mode) => (
            <button
              key={mode.key}
              onClick={() => updateForm("mode", mode.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold
                transition-all duration-200
                ${form.mode === mode.key
                  ? "border-[#8b5cf6] bg-[#ede9fe] text-[#8b5cf6]"
                  : "border-outline-variant bg-surface text-on-surface-variant hover:border-outline-variant"
                }
              `}
            >
              <i className={`fas ${mode.icon}`} />
              {mode.label}
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Service Location" icon="fa-map-pin">
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {([
            { key: "client-place" as const, label: "Client's Place", icon: "fa-home" },
            { key: "my-place" as const, label: "My Studio", icon: "fa-store" },
            { key: "both-places" as const, label: "Both", icon: "fa-exchange-alt" },
            { key: "remote" as const, label: "Online", icon: "fa-laptop" },
          ]).map((loc) => (
            <button
              key={loc.key}
              onClick={() => updateForm("location", loc.key)}
              className={`
                flex items-center gap-2.5 p-3 md:p-4 rounded-xl border-2 transition-all duration-200
                ${form.location === loc.key
                  ? "border-[#8b5cf6] bg-[#ede9fe] text-[#8b5cf6]"
                  : "border-outline-variant bg-surface text-on-surface-variant hover:border-outline-variant"
                }
              `}
            >
              <i className={`fas ${loc.icon} text-sm`} />
              <span className="text-xs md:text-sm font-bold">{loc.label}</span>
            </button>
          ))}
        </div>
      </FormSection>

      <FormSection title="Service Duration" icon="fa-clock">
        <div className="flex flex-wrap gap-2">
          {(["15", "30", "60", "90", "120", "180", "240", "custom"] as const).map((val, idx) => {
            const labels = ["15 min", "30 min", "1 hour", "1.5 hrs", "2 hrs", "3 hrs", "4+ hrs", "Custom"];
            return (
              <button
                key={val}
                onClick={() => updateForm("duration", val)}
                className={`
                  px-3 py-2 rounded-lg border-2 text-xs font-semibold
                  transition-all duration-200
                  ${form.duration === val
                    ? "border-[#8b5cf6] bg-[#ede9fe] text-[#8b5cf6]"
                    : "border-outline-variant bg-surface text-on-surface-variant hover:border-outline-variant"
                  }
                `}
              >
                {labels[idx]}
              </button>
            );
          })}
        </div>
        {form.duration === "custom" && (
          <div className="md3-input-outlined mt-3">
            <input
              type="text"
              id="customDuration"
              placeholder=" "
              value={form.customDuration}
              onChange={(e) => updateForm("customDuration", e.target.value)}
            />
            <label htmlFor="customDuration">Custom Duration</label>
          </div>
        )}
      </FormSection>

      <FormSection title="Booking Policy" icon="fa-shield-alt">
        <div className="bg-surface rounded-xl p-3 md:p-4 space-y-1">
          <ToggleSwitch label="Require Deposit" checked={form.deposit} onChange={(v) => updateForm("deposit", v)} />
          <ToggleSwitch label="Allow Rescheduling" checked={form.rescheduling} onChange={(v) => updateForm("rescheduling", v)} />
          <ToggleSwitch label="24h Cancellation Notice" checked={form.cancellationNotice} onChange={(v) => updateForm("cancellationNotice", v)} />
        </div>
      </FormSection>

      <FormSection title="Service Radius" icon="fa-ruler">
        <div className="md3-input-outlined">
          <input
            type="number"
            id="serviceRadius"
            placeholder=" "
            value={form.serviceRadius}
            onChange={(e) => updateForm("serviceRadius", e.target.value)}
          />
          <label htmlFor="serviceRadius">Service Radius (km)</label>
        </div>
      </FormSection>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Portfolio Photos" icon="fa-images">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`
                relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200
                ${dragOverIndex === i ? "border-[#8b5cf6] bg-[#ede9fe] scale-105" : "border-outline-variant"}
              `}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverIndex(i);
              }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, i)}
            >
              {form.portfolioImages[i] ? (
                <div className="relative w-full h-full group">
                  <img
                    src={URL.createObjectURL(form.portfolioImages[i])}
                    alt={`Portfolio ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#ef4444] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <i className="fas fa-times text-xs" />
                  </button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                  <label
                    className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-outline hover:text-[#8b5cf6] hover:bg-surface transition-all cursor-pointer"
                  >
                    <i className="fas fa-plus text-lg" />
                    <span className="text-[10px] font-semibold">Upload</span>
                    <span className="text-[9px] text-[#cbd5e1]">or drop here</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageSelect(e, i)}
                    />
                  </label>
                  <button
                    onClick={() => openCamera(i)}
                    className="mt-1 w-full flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] text-[10px] font-semibold hover:bg-[#8b5cf6]/20 transition-colors"
                  >
                    <i className="fas fa-camera text-xs" />
                    Camera
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex-1 md:flex-none px-4 py-2.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#8b5cf6]/25 hover:shadow-xl hover:shadow-[#8b5cf6]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
      >
        <i className="fas fa-plus mr-2" />
        Add Service
      </button>

      {isOpen && (
        <div className="fixed inset-0 md3-dialog-backdrop z-50 flex items-center justify-center p-2 md:p-4">
          <div
            className="md3-dialog w-full max-w-3xl my-2 md:my-8 bg-surface rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-surface rounded-t-2xl border-b border-outline-variant">
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white shadow-lg">
                    <i className="fas fa-plus text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal text-on-surface leading-tight">Add New Service</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">Step {currentStep} of {WIZARD_STEPS.length}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  disabled={isSaving || isUploading}
                  className="w-10 h-10 rounded-full bg-transparent text-on-surface-variant flex items-center justify-center hover:bg-surface-variant transition-all duration-200 active:scale-95"
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              <StepIndicator currentStep={currentStep} totalSteps={WIZARD_STEPS.length} />
            </div>

            {/* Body - Scrollable */}
            <div className="md3-dialog-content overflow-y-auto flex-1 px-6 py-4">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
              {currentStep === 6 && renderStep6()}
              {currentStep === 7 && renderStep7()}
              {currentStep === 8 && renderStep8()}
            </div>

            {/* Footer - Always Visible */}
            <div className="md3-dialog-actions sticky bottom-0 bg-surface border-t border-outline-variant px-6 py-4 rounded-b-2xl">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || isSaving || isUploading}
                className={`md3-btn-text ${currentStep === 1 ? 'invisible' : ''}`}
              >
                Back
              </button>

              {currentStep < WIZARD_STEPS.length ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed || isSaving || isUploading}
                  className={`md3-btn-filled ${!canProceed ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={saveService}
                  disabled={isSaving || isUploading}
                  className={`md3-btn-filled ${(isSaving || isUploading) ? 'opacity-50 cursor-wait' : ''} flex items-center gap-2`}
                >
                  <i className={`fas ${isUploading ? "fa-spinner fa-spin text-sm" : isSaving ? "fa-spinner fa-spin text-sm" : "fa-save text-sm"}`} />
                  {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Service"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center animate-fadeIn">
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
                  onClick={capturePhoto}
                  className="w-16 h-16 rounded-full bg-surface shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                >
                  <div className="w-14 h-14 rounded-full border-4 border-[#8b5cf6]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#f59e0b]/10 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-[#f59e0b]" />
              </div>
              <h3 className="text-xl font-extrabold text-on-surface mb-2">Discard Changes?</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                Close without saving? All progress will be lost.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelClose}
                className="flex-1 px-4 py-3 border-2 border-outline-variant rounded-xl font-bold text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all duration-200 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmClose}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-xl font-bold shadow-md shadow-[#ef4444]/20 hover:shadow-lg active:scale-95 transition-all duration-200"
              >
                <i className="fas fa-times mr-2" />
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

AddServiceButton.displayName = "AddServiceButton";

export default AddServiceButton;