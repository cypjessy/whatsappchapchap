"use client";

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService } from "@/lib/db";
import { bunnyStorage } from "@/lib/storage";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AddServiceButtonRef {
  open: () => void;
}

type BusinessKey = keyof typeof businessSpecs;
type Tier = "basic" | "standard" | "premium";
type Mode = "in-person" | "remote" | "both";
type Location = "client-place" | "my-place" | "both-places" | "remote";

interface ServiceFormData {
  providerName: string;
  serviceName: string;
  description: string;
  businessType: BusinessKey | null;
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

// ─── Business Type Specifications Database ────────────────────────────────────

const businessSpecs = {
  beauty: {
    name: "Beauty & Hair",
    specs: {
      service_type: { label: "Service Type", icon: "fa-cut", options: ["Hair Braiding", "Haircut", "Coloring", "Treatment", "Styling", "Makeup", "Nails", "Massage", "Facial", "Waxing"] },
      hair_length: { label: "Hair Length", icon: "fa-ruler", options: ["Short", "Medium", "Long", "Extra Long"] },
      hair_texture: { label: "Hair Texture", icon: "fa-wind", options: ["Straight", "Wavy", "Curly", "Coily", "All Types"] },
      style: { label: "Style/Pattern", icon: "fa-paint-brush", options: ["Box Braids", "Knotless", "Cornrows", "Twists", "Locs", "Weave", "Wig Install", "Custom"] },
      products: { label: "Products Used", icon: "fa-pump-soap", options: ["Organic", "Synthetic", "Human Hair", "X-Pression", "Kanekalon", "Client Choice"] },
    },
  },
  home: {
    name: "Home Services",
    specs: {
      service_type: { label: "Service Type", icon: "fa-tools", options: ["Plumbing", "Electrical", "Carpentry", "Painting", "HVAC", "Appliance Repair", "Roofing", "Tiling"] },
      urgency: { label: "Urgency Level", icon: "fa-exclamation-circle", options: ["Emergency (Same Day)", "Standard (1-3 Days)", "Scheduled (1+ Week)"] },
      property_type: { label: "Property Type", icon: "fa-home", options: ["Apartment", "House", "Commercial", "Industrial"] },
      tools_needed: { label: "Tools/Materials", icon: "fa-toolbox", options: ["I Bring Everything", "Client Provides Materials", "Consultation Required"] },
    },
  },
  health: {
    name: "Health & Wellness",
    specs: {
      service_type: { label: "Service Type", icon: "fa-heartbeat", options: ["Personal Training", "Yoga", "Nutrition Coaching", "Therapy", "Massage", "Meditation", "Physical Therapy"] },
      session_type: { label: "Session Type", icon: "fa-users", options: ["One-on-One", "Couples", "Group (3-5)", "Group (6-10)", "Workshop (10+)"] },
      fitness_level: { label: "Client Level", icon: "fa-chart-line", options: ["Beginner", "Intermediate", "Advanced", "All Levels"] },
      equipment: { label: "Equipment", icon: "fa-dumbbell", options: ["Gym Required", "Home Equipment", "No Equipment", "I Bring Equipment"] },
    },
  },
  education: {
    name: "Education",
    specs: {
      subject: { label: "Subject", icon: "fa-book", options: ["Math", "Science", "English", "Languages", "Music", "Coding", "Test Prep", "Art"] },
      grade_level: { label: "Grade/Level", icon: "fa-graduation-cap", options: ["Elementary", "Middle School", "High School", "College", "Adult Learning", "Professional"] },
      session_format: { label: "Format", icon: "fa-chalkboard-teacher", options: ["One-on-One", "Small Group", "Classroom", "Workshop", "Crash Course"] },
      delivery: { label: "Delivery", icon: "fa-laptop", options: ["In-Person", "Online Live", "Recorded", "Hybrid"] },
    },
  },
  automotive: {
    name: "Automotive",
    specs: {
      service_type: { label: "Service Type", icon: "fa-car", options: ["Oil Change", "Brake Service", "Detailing", "Tire Service", "Engine Repair", "AC Service", "Diagnostics"] },
      vehicle_type: { label: "Vehicle", icon: "fa-truck", options: ["Sedan", "SUV", "Truck", "Motorcycle", "Van", "All Types"] },
      location: { label: "Service Location", icon: "fa-map-marker-alt", options: ["My Garage", "Client Location", "Both"] },
      parts: { label: "Parts", icon: "fa-cogs", options: ["OEM Parts", "Aftermarket", "Client Provides", "Consultation Needed"] },
    },
  },
  events: {
    name: "Events",
    specs: {
      event_type: { label: "Event Type", icon: "fa-calendar-star", options: ["Wedding", "Birthday", "Corporate", "Concert", "Festival", "Private Party", "Conference"] },
      role: { label: "Your Role", icon: "fa-user-tie", options: ["Planner", "Decorator", "DJ", "Caterer", "Photographer", "Videographer", "MC/Host", "Security"] },
      guest_count: { label: "Guest Count", icon: "fa-users", options: ["Under 50", "50-100", "100-250", "250-500", "500-1000", "1000+"] },
      setup_time: { label: "Setup Required", icon: "fa-clock", options: ["Same Day", "1 Day Before", "2-3 Days", "1 Week+"] },
    },
  },
  tech: {
    name: "Tech Support",
    specs: {
      service_type: { label: "Service Type", icon: "fa-laptop-code", options: ["Phone Repair", "Computer Fix", "Web Design", "App Development", "IT Support", "Data Recovery", "Network Setup"] },
      device: { label: "Device Type", icon: "fa-mobile-alt", options: ["iPhone", "Android", "Laptop", "Desktop", "Tablet", "Server", "Smart Home"] },
      issue_type: { label: "Common Issues", icon: "fa-bug", options: ["Screen/Broken", "Software", "Virus/Malware", "Data Loss", "Upgrade", "Custom Build"] },
      warranty: { label: "Warranty", icon: "fa-shield-alt", options: ["30 Days", "90 Days", "6 Months", "1 Year", "No Warranty"] },
    },
  },
  fitness: {
    name: "Fitness",
    specs: {
      service_type: { label: "Service Type", icon: "fa-running", options: ["Personal Training", "Group Classes", "Nutrition Plan", "Sports Coaching", "Rehabilitation", "Online Coaching"] },
      specialty: { label: "Specialty", icon: "fa-star", options: ["Weight Loss", "Muscle Gain", "Endurance", "Flexibility", "Sports Specific", "Senior Fitness", "Pre/Post Natal"] },
      location: { label: "Location", icon: "fa-map-marker-alt", options: ["Gym", "Home Visit", "Outdoor", "Online", "My Studio"] },
      equipment: { label: "Equipment", icon: "fa-dumbbell", options: ["Full Gym", "Minimal", "Bodyweight Only", "I Bring Equipment"] },
    },
  },
  cleaning: {
    name: "Cleaning",
    specs: {
      service_type: { label: "Service Type", icon: "fa-broom", options: ["Regular Cleaning", "Deep Cleaning", "Move In/Out", "Office Cleaning", "Post-Construction", "Urgent/Same Day"] },
      property_size: { label: "Property Size", icon: "fa-ruler-combined", options: ["Studio", "1-2 Bedroom", "3-4 Bedroom", "5+ Bedroom", "Office Space", "Commercial"] },
      frequency: { label: "Frequency", icon: "fa-redo", options: ["One-Time", "Weekly", "Bi-Weekly", "Monthly", "On Demand"] },
      supplies: { label: "Supplies", icon: "fa-spray-can", options: ["I Bring Everything", "Client Provides", "Eco-Friendly Only"] },
    },
  },
  photography: {
    name: "Photography",
    specs: {
      shoot_type: { label: "Shoot Type", icon: "fa-camera", options: ["Portrait", "Wedding", "Event", "Product", "Real Estate", "Fashion", "Family", "Headshots"] },
      duration: { label: "Duration", icon: "fa-clock", options: ["1 Hour", "2-3 Hours", "Half Day", "Full Day", "Multi-Day"] },
      deliverables: { label: "Deliverables", icon: "fa-images", options: ["Digital Only", "Prints", "Album", "Edited Photos", "Raw Files", "All"] },
      locations: { label: "Locations", icon: "fa-map-marked-alt", options: ["1 Location", "2 Locations", "3+ Locations", "Client Choice"] },
    },
  },
  catering: {
    name: "Catering",
    specs: {
      cuisine: { label: "Cuisine Type", icon: "fa-utensils", options: ["Local/Kenyan", "Continental", "Italian", "Asian", "Indian", "BBQ/Grill", "Fusion", "Custom Menu"] },
      event_type: { label: "Event Type", icon: "fa-glass-cheers", options: ["Wedding", "Corporate", "Birthday", "Funeral", "Religious", "Casual Gathering"] },
      service_style: { label: "Service Style", icon: "fa-concierge-bell", options: ["Buffet", "Plated", "Family Style", "Food Stations", "Drop Off", "Full Service"] },
      dietary: { label: "Dietary Options", icon: "fa-leaf", options: ["Vegetarian", "Vegan", "Halal", "Gluten-Free", "Dairy-Free", "Nut-Free", "All"] },
    },
  },
  medical: {
    name: "Hospital & Medical",
    specs: {
      facility_type: { label: "Facility Type", icon: "fa-hospital", options: ["Private Hospital", "Public Hospital", "Clinic", "Specialist Center", "Diagnostic Center", "Maternity", "Dental Clinic", "Eye Clinic"] },
      department: { label: "Department/Specialty", icon: "fa-user-md", options: ["General Practice", "Pediatrics", "Gynecology", "Cardiology", "Orthopedics", "Dermatology", "ENT", "Ophthalmology", "Dental", "Laboratory", "Radiology", "Physiotherapy", "Mental Health", "Emergency"] },
      consultation_type: { label: "Consultation Type", icon: "fa-stethoscope", options: ["In-Person Visit", "Telemedicine", "Home Visit", "Second Opinion", "Follow-up", "Emergency Consultation"] },
      insurance: { label: "Insurance Accepted", icon: "fa-id-card", options: ["NHIF", "AAR Insurance", "Jubilee Health", "APA Insurance", "Madison Insurance", "Britam", "Cash Only", "All Major Insurers"] },
      services_offered: { label: "Services Offered", icon: "fa-procedures", options: ["General Consultation", "Laboratory Tests", "X-Ray/Ultrasound", "Minor Surgery", "Vaccination", "Health Screening", "Maternity Care", "Pharmacy", "Ambulance Service", "ICU/NCCU"] },
      operating_hours: { label: "Operating Hours", icon: "fa-clock", options: ["24/7 Emergency", "Mon-Fri 8AM-6PM", "Mon-Sat 8AM-8PM", "Weekends Only", "By Appointment", "On-Call Service"] },
    },
  },
  other: {
    name: "Other Services",
    specs: {
      category: { label: "Custom Category", icon: "fa-tag", options: ["Consulting", "Repair", "Installation", "Maintenance", "Design", "Translation", "Legal", "Financial"] },
      experience: { label: "Experience Level", icon: "fa-award", options: ["Entry Level", "Intermediate", "Expert", "Master"] },
      certification: { label: "Certification", icon: "fa-certificate", options: ["Certified", "Licensed", "Insured", "Bonded", "None Required"] },
    },
  },
} as const;

const DEFAULT_TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

const BUSINESS_ICONS: Record<string, string> = {
  beauty: "💇‍♀️", home: "🔧", health: "🏥", education: "📚",
  automotive: "🚗", events: "🎉", tech: "💻", fitness: "🏋️",
  cleaning: "🧹", photography: "📸", catering: "🍽️", medical: "🏥", other: "✨",
};

const BUSINESS_GRADIENTS: Record<string, string> = {
  beauty: "from-[#f3e8ff] to-[#e9d5ff]",
  home: "from-[#fef3c7] to-[#fde68a]",
  health: "from-[#dcfce7] to-[#bbf7d0]",
  education: "from-[#e0e7ff] to-[#c7d2fe]",
  automotive: "from-[#fecaca] to-[#fecaca]",
  events: "from-[#fce7f3] to-[#fbcfe8]",
  tech: "from-[#dbeafe] to-[#bfdbfe]",
  fitness: "from-[#fef3c7] to-[#fde68a]",
  cleaning: "from-[#f0fdf4] to-[#dcfce7]",
  photography: "from-[#fff7ed] to-[#ffedd5]",
  catering: "from-[#fff1f2] to-[#ffe4e6]",
  medical: "from-[#fee2e2] to-[#fecaca]",
  other: "from-[#f8fafc] to-[#f1f5f9]",
};

const WIZARD_STEPS = [
  { id: 1, label: "Basic Info", icon: "fa-info-circle" },
  { id: 2, label: "Business Type", icon: "fa-store" },
  { id: 3, label: "Specifications", icon: "fa-sliders-h" },
  { id: 4, label: "Pricing", icon: "fa-tags" },
  { id: 5, label: "Availability", icon: "fa-calendar-alt" },
  { id: 6, label: "Details", icon: "fa-map-pin" },
  { id: 7, label: "Portfolio", icon: "fa-images" },
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
      return Object.keys(form.specs).length > 0;
    case 4:
      return Object.values(form.prices).some((p) => p && Number(p) > 0);
    case 5:
      return form.days.size > 0;
    case 6:
      return true;
    case 7:
      return true;
    default:
      return true;
  }
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-between px-2 md:px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] overflow-x-auto">
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
                      : "bg-[#e2e8f0] text-[#94a3b8]"
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
                  ${isActive ? "text-[#8b5cf6]" : isCompleted ? "text-[#10b981]" : "text-[#94a3b8]"}
                `}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`
                  w-4 md:w-8 h-[2px] mx-1 md:mx-2 rounded-full transition-colors duration-300 shrink-0
                  ${isCompleted ? "bg-[#10b981]" : "bg-[#e2e8f0]"}
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
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-[#475569]">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-full transition-colors duration-200
          ${checked ? "bg-[#8b5cf6]" : "bg-[#e2e8f0]"}
        `}
        aria-checked={checked}
        role="switch"
      >
        <div
          className={`
            absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
            transition-transform duration-200
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
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

  const [form, setForm] = useState<ServiceFormData>({
    providerName: "",
    serviceName: "",
    description: "",
    businessType: null,
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

  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Expose open method to parent
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
      setCurrentStep(1);
    },
  }));

  // ─── Form Helpers ──────────────────────────────────────────────────────────

  const updateForm = useCallback(<K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleSpec = (specKey: string, option: string) => {
    setForm((prev) => {
      const currentSet = new Set(prev.specs[specKey] || []);
      if (currentSet.has(option)) currentSet.delete(option);
      else currentSet.add(option);
      return { ...prev, specs: { ...prev.specs, [specKey]: currentSet } };
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

  // ─── Save ──────────────────────────────────────────────────────────────────

  const saveService = async () => {
    if (!user) {
      alert("You must be logged in to create a service");
      return;
    }

    setIsSaving(true);
    try {
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

      const serviceData = {
        name: form.serviceName,
        description: form.description,
        providerName: form.providerName,
        emoji: BUSINESS_ICONS[form.businessType!] || "✨",
        bgGradient: BUSINESS_GRADIENTS[form.businessType!] || "from-gray-100 to-gray-200",
        duration: durationValue,
        location: form.location,
        tags: [form.businessType!, ...(specs.service_type || [])].slice(0, 5),
        priceMin,
        priceMax,
        packagePrices,
        businessType: form.businessType!,
        businessCategory: businessSpecs[form.businessType!]?.name || form.businessType!,
        serviceName: specs.service_type?.[0] || form.serviceName,
        categoryName: businessSpecs[form.businessType!]?.name || form.businessType!,
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
      };

      const createdService = await serviceService.createService(user, serviceData);
      const bookingUrl = `${window.location.origin}/book/${createdService.id}`;
      await serviceService.updateService(user, createdService.id, { bookingUrl });

      closeModal();
      window.location.reload();
    } catch (error) {
      console.error("Error saving service:", error);
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  // ─── Render Steps ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Service Information" icon="fa-info-circle" isValid={canProceed}>
        <div className="space-y-3">
          <div>
            <label className="form-label">Business / Provider Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Sarah's Beauty Salon"
              value={form.providerName}
              onChange={(e) => updateForm("providerName", e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Service Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Professional Box Braids"
              value={form.serviceName}
              onChange={(e) => updateForm("serviceName", e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Description *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describe what clients can expect..."
              value={form.description}
              onChange={(e) => updateForm("description", e.target.value)}
            />
            <div className="text-right text-[10px] text-[#94a3b8] mt-1">
              {form.description.length} chars {form.description.length < 10 && "(min 10)"}
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Select Business Type" icon="fa-store" isValid={canProceed}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 md:gap-3">
          {Object.entries(businessSpecs).map(([key, spec]) => (
            <button
              key={key}
              onClick={() => updateForm("businessType", key as BusinessKey)}
              className={`
                relative p-3 md:p-4 rounded-xl border-2 transition-all duration-200 text-center
                ${form.businessType === key
                  ? "border-[#8b5cf6] bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] shadow-md shadow-[#8b5cf6]/10"
                  : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:shadow-sm"
                }
              `}
            >
              <div className="text-2xl md:text-3xl mb-1.5">{BUSINESS_ICONS[key]}</div>
              <div className="text-xs md:text-sm font-bold text-[#475569]">{spec.name}</div>
              {form.businessType === key && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#8b5cf6] rounded-full flex items-center justify-center">
                  <i className="fas fa-check text-white text-[9px]" />
                </div>
              )}
            </button>
          ))}
        </div>
      </FormSection>

      {form.businessType && (
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
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                  }
                `}
              >
                <i className={`fas ${mode.icon}`} />
                {mode.label}
              </button>
            ))}
          </div>
        </FormSection>
      )}
    </div>
  );

  const renderStep3 = () => {
    if (!form.businessType) return null;
    const business = businessSpecs[form.businessType];
    if (!business) return null;

    return (
      <div className="space-y-4 animate-fadeIn">
        <FormSection title="Service Specifications" icon="fa-sliders-h" isValid={canProceed}>
          <div className="space-y-4">
            {Object.entries(business.specs).map(([key, spec]: [string, any]) => (
              <div key={key} className="spec-group">
                <div className="spec-header">
                  <i className={`fas ${spec.icon} text-[#8b5cf6]`} />
                  <span>{spec.label}</span>
                  <span className="ml-auto text-[10px] text-[#94a3b8] font-medium">
                    {form.specs[key]?.size || 0} selected
                  </span>
                </div>
                <div className="spec-options">
                  {spec.options.map((opt: string) => (
                    <button
                      key={opt}
                      onClick={() => toggleSpec(key, opt)}
                      className={`
                        spec-option
                        ${form.specs[key]?.has(opt) ? "active" : ""}
                      `}
                    >
                      <i className="fas fa-check check-icon" />
                      {opt}
                    </button>
                  ))}
                  {activeCustomSpec !== key ? (
                    <button
                      className="add-custom-btn"
                      onClick={() => {
                        setActiveCustomSpec(key);
                        setTempCustomValue("");
                      }}
                    >
                      <i className="fas fa-plus" />
                      Add Custom
                    </button>
                  ) : (
                    <div className="custom-input-row">
                      <input
                        type="text"
                        className="custom-input"
                        placeholder="Enter custom..."
                        value={tempCustomValue}
                        onChange={(e) => setTempCustomValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            if (tempCustomValue.trim()) toggleSpec(key, tempCustomValue.trim());
                            setActiveCustomSpec(null);
                            setTempCustomValue("");
                          }
                          if (e.key === "Escape") {
                            setActiveCustomSpec(null);
                            setTempCustomValue("");
                          }
                        }}
                      />
                      <button
                        className="spec-option"
                        onClick={() => {
                          if (tempCustomValue.trim()) toggleSpec(key, tempCustomValue.trim());
                          setActiveCustomSpec(null);
                          setTempCustomValue("");
                        }}
                        style={{ background: "#8b5cf6", color: "white" }}
                      >
                        <i className="fas fa-check" />
                      </button>
                      <button
                        className="spec-option"
                        onClick={() => {
                          setActiveCustomSpec(null);
                          setTempCustomValue("");
                        }}
                        style={{ background: "#ef4444", color: "white" }}
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      </div>
    );
  };

  const renderStep4 = () => (
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
                  : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                }
              `}
            >
              <div className={`
                absolute -top-2 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white
                bg-gradient-to-r ${tier.color}
              `}>
                {tier.badge}
              </div>
              <div className="text-sm font-bold text-[#475569] mb-3 mt-1">{tier.label} Package</div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] text-sm font-bold">KES</span>
                <input
                  type="number"
                  className="w-full pl-12 pr-3 py-2.5 rounded-lg border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm font-bold"
                  placeholder="0.00"
                  value={form.prices[tier.key]}
                  onChange={(e) => setForm((prev) => ({
                    ...prev,
                    prices: { ...prev.prices, [tier.key]: e.target.value },
                  }))}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="mt-3 space-y-1.5">
                {tier.key === "basic" && (
                  <>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Core service included</div>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Professional quality</div>
                  </>
                )}
                {tier.key === "standard" && (
                  <>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Everything in Basic</div>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Priority scheduling</div>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Enhanced support</div>
                  </>
                )}
                {tier.key === "premium" && (
                  <>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> Everything in Standard</div>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> VIP treatment</div>
                    <div className="text-[11px] text-[#64748b] flex items-center gap-1"><i className="fas fa-check text-[#10b981] text-[9px]" /> 24/7 support</div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );

  const renderStep5 = () => {
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
                        : "border-[#e2e8f0] bg-white text-[#94a3b8] hover:border-[#cbd5e1]"
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
              <div className="flex flex-wrap gap-2">
                {times.map((time) => (
                  <button
                    key={time}
                    onClick={() => toggleTime(time)}
                    className={`
                      px-3 py-2 rounded-lg border-2 text-xs font-semibold
                      transition-all duration-200
                      ${form.times.has(time)
                        ? "border-[#8b5cf6] bg-[#ede9fe] text-[#8b5cf6]"
                        : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {form.times.size === 0 && (
                <p className="text-[11px] text-[#94a3b8] mt-2">Default slots will be used if none selected</p>
              )}
            </div>
          </div>
        </FormSection>
      </div>
    );
  };

  const renderStep6 = () => (
    <div className="space-y-4 animate-fadeIn">
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
                  : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
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
                    : "border-[#e2e8f0] bg-white text-[#64748b] hover:border-[#cbd5e1]"
                  }
                `}
              >
                {labels[idx]}
              </button>
            );
          })}
        </div>
        {form.duration === "custom" && (
          <input
            type="text"
            className="form-input mt-3"
            placeholder="e.g., 2-3 hours, Half day"
            value={form.customDuration}
            onChange={(e) => updateForm("customDuration", e.target.value)}
          />
        )}
      </FormSection>

      <FormSection title="Booking Policy" icon="fa-shield-alt">
        <div className="bg-[#f8fafc] rounded-xl p-3 md:p-4 space-y-1">
          <ToggleSwitch label="Require Deposit" checked={form.deposit} onChange={(v) => updateForm("deposit", v)} />
          <ToggleSwitch label="Allow Rescheduling" checked={form.rescheduling} onChange={(v) => updateForm("rescheduling", v)} />
          <ToggleSwitch label="24h Cancellation Notice" checked={form.cancellationNotice} onChange={(v) => updateForm("cancellationNotice", v)} />
        </div>
      </FormSection>

      <FormSection title="Service Radius" icon="fa-ruler">
        <input
          type="number"
          className="form-input"
          placeholder="e.g., 10 (km)"
          value={form.serviceRadius}
          onChange={(e) => updateForm("serviceRadius", e.target.value)}
        />
      </FormSection>
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-4 animate-fadeIn">
      <FormSection title="Portfolio Photos" icon="fa-images">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`
                relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200
                ${dragOverIndex === i ? "border-[#8b5cf6] bg-[#ede9fe] scale-105" : "border-[#e2e8f0]"}
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
                <button
                  onClick={() => fileInputRefs.current[i]?.click()}
                  className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#94a3b8] hover:text-[#8b5cf6] hover:bg-[#f8fafc] transition-all"
                >
                  <i className="fas fa-plus text-lg" />
                  <span className="text-[10px] font-semibold">Add Photo</span>
                  <span className="text-[9px] text-[#cbd5e1]">or drop here</span>
                </button>
              )}
              <input
                type="file"
                ref={(el) => { fileInputRefs.current[i] = el; }}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageSelect(e, i)}
              />
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
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4 overflow-y-auto animate-fadeIn">
          <div
            className="relative w-full max-w-3xl bg-white rounded-xl md:rounded-2xl shadow-2xl overflow-hidden my-2 md:my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white">
              <div className="flex items-center justify-between p-4 md:p-6 border-b border-[#e2e8f0]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center text-white shadow-md">
                    <i className="fas fa-plus" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold text-[#1e293b]">Add New Service</h2>
                    <p className="text-xs text-[#94a3b8]">Step {currentStep} of {WIZARD_STEPS.length}</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  disabled={isSaving || isUploading}
                  className="w-9 h-9 rounded-full bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all duration-200 active:scale-90"
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              <StepIndicator currentStep={currentStep} totalSteps={WIZARD_STEPS.length} />
            </div>

            {/* Body */}
            <div className="p-4 md:p-6 max-h-[60vh] md:max-h-[50vh] overflow-y-auto">
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}
              {currentStep === 6 && renderStep6()}
              {currentStep === 7 && renderStep7()}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 bg-white border-t border-[#e2e8f0] p-4 md:p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1 || isSaving || isUploading}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                    transition-all duration-200
                    ${currentStep === 1
                      ? "opacity-0 pointer-events-none"
                      : "bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0] active:scale-95"
                    }
                  `}
                >
                  <i className="fas fa-chevron-left text-xs" />
                  Back
                </button>

                {currentStep < WIZARD_STEPS.length ? (
                  <button
                    onClick={nextStep}
                    disabled={!canProceed || isSaving || isUploading}
                    className={`
                      flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                      transition-all duration-200 active:scale-95
                      ${canProceed
                        ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md shadow-[#8b5cf6]/25 hover:shadow-lg"
                        : "bg-[#e2e8f0] text-[#94a3b8] cursor-not-allowed"
                      }
                    `}
                  >
                    Next
                    <i className="fas fa-chevron-right text-xs" />
                  </button>
                ) : (
                  <button
                    onClick={saveService}
                    disabled={isSaving || isUploading}
                    className={`
                      flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold
                      transition-all duration-200 active:scale-95
                      ${isSaving || isUploading
                        ? "bg-[#e2e8f0] text-[#94a3b8] cursor-wait"
                        : "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-md shadow-[#10b981]/25 hover:shadow-lg"
                      }
                    `}
                  >
                    <i className={`fas ${isUploading ? "fa-spinner fa-spin" : isSaving ? "fa-spinner fa-spin" : "fa-save"}`} />
                    {isUploading ? "Uploading..." : isSaving ? "Saving..." : "Save Service"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl animate-scaleIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#f59e0b]/10 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl text-[#f59e0b]" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1e293b] mb-2">Discard Changes?</h3>
              <p className="text-sm text-[#64748b] leading-relaxed">
                Close without saving? All progress will be lost.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelClose}
                className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all duration-200 active:scale-95"
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