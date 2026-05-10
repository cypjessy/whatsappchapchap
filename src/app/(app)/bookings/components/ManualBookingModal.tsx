"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService, bookingService, Booking, Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManualBookingModalProps {
  open: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

type Step = "client" | "service" | "schedule" | "payment" | "review";

interface FormErrors {
  clientName?: string;
  clientPhone?: string;
  serviceId?: string;
  selectedDate?: string;
  selectedTime?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: "client", label: "Client", icon: "fa-user" },
  { id: "service", label: "Service", icon: "fa-concierge-bell" },
  { id: "schedule", label: "Schedule", icon: "fa-calendar-alt" },
  { id: "payment", label: "Payment", icon: "fa-credit-card" },
  { id: "review", label: "Review", icon: "fa-check-circle" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash", icon: "fa-money-bill-wave" },
  { value: "mpesa", label: "M-Pesa", icon: "fa-mobile-alt" },
  { value: "card", label: "Card", icon: "fa-credit-card" },
  { value: "bank", label: "Bank Transfer", icon: "fa-university" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function validatePhone(phone: string): boolean {
  return /^\+?[\d\s-]{10,}$/.test(phone.replace(/\s/g, ""));
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StepIndicator({ currentStep, steps }: { currentStep: Step; steps: typeof STEPS }) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2 px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] overflow-x-auto">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={step.id} className="flex items-center shrink-0">
            <div
              className={`
                flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-lg transition-all duration-300
                ${isActive ? "bg-[#8b5cf6] text-white shadow-md" : ""}
                ${isCompleted ? "text-[#8b5cf6]" : ""}
                ${isPending ? "text-[#94a3b8]" : ""}
              `}
            >
              <div
                className={`
                  w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold
                  transition-all duration-300
                  ${isActive ? "bg-white text-[#8b5cf6]" : ""}
                  ${isCompleted ? "bg-[#8b5cf6] text-white" : ""}
                  ${isPending ? "bg-[#e2e8f0] text-[#94a3b8]" : ""}
                `}
              >
                {isCompleted ? (
                  <i className="fas fa-check text-[8px] md:text-[10px]" />
                ) : (
                  index + 1
                )}
              </div>
              <span className="text-[10px] md:text-xs font-bold whitespace-nowrap">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  w-4 md:w-6 h-[2px] mx-1 rounded-full transition-all duration-300
                  ${isCompleted ? "bg-[#8b5cf6]" : "bg-[#e2e8f0]"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function FormField({
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
    <div className="space-y-1.5">
      <label className="block text-xs md:text-sm font-semibold text-[#475569]">
        {label}
        {required && <span className="text-[#ef4444] ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-[11px] text-[#ef4444] font-medium flex items-center gap-1 animate-fadeIn">
          <i className="fas fa-exclamation-circle text-[10px]" />
          {error}
        </p>
      )}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm
          focus:outline-none
          ${error
            ? "border-[#ef4444] bg-[#ef4444]/5"
            : isFocused
              ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10"
              : "border-[#e2e8f0] hover:border-[#cbd5e1]"
          }
        `}
        {...props}
      />
      {error && (
        <i className="fas fa-exclamation-circle absolute right-3 top-1/2 -translate-y-1/2 text-[#ef4444] text-sm" />
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  children,
  error,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  children: React.ReactNode;
  error?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm appearance-none cursor-pointer
          focus:outline-none pr-10
          ${error
            ? "border-[#ef4444] bg-[#ef4444]/5"
            : isFocused
              ? "border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/10"
              : "border-[#e2e8f0] hover:border-[#cbd5e1]"
          }
          ${value ? "text-[#1e293b]" : "text-[#94a3b8]"}
        `}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-xs pointer-events-none" />
      {error && (
        <i className="fas fa-exclamation-circle absolute right-8 top-1/2 -translate-y-1/2 text-[#ef4444] text-sm" />
      )}
    </div>
  );
}

function PackageCard({
  pkg,
  selected,
  price,
  features,
  onClick,
}: {
  pkg: string;
  selected: boolean;
  price: number;
  features: string[];
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative p-4 md:p-5 border-2 rounded-xl md:rounded-2xl cursor-pointer transition-all duration-300
        ${selected
          ? "border-[#8b5cf6] bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] shadow-md shadow-[#8b5cf6]/10"
          : "border-[#e2e8f0] hover:border-[#8b5cf6]/50 hover:shadow-sm"
        }
        ${isHovered && !selected ? "-translate-y-0.5" : "translate-y-0"}
      `}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-md">
          <i className="fas fa-check text-[10px]" />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm md:text-base capitalize">{pkg}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${selected ? "bg-[#8b5cf6] text-white" : "bg-[#f1f5f9] text-[#64748b]"}`}>
          {pkg === "basic" ? "Essential" : pkg === "standard" ? "Popular" : "Premium"}
        </span>
      </div>

      <ul className="space-y-1.5 mb-4">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-[11px] md:text-xs text-[#64748b]">
            <i className="fas fa-check text-[#10b981] text-[9px] mt-0.5 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className={`text-xl md:text-2xl font-extrabold ${selected ? "text-[#8b5cf6]" : "text-[#475569]"}`}>
        {formatCurrency(price)}
      </div>
    </div>
  );
}

function DateChip({
  date,
  selected,
  onClick,
}: {
  date: Date;
  selected: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        min-w-[68px] md:min-w-[76px] p-2.5 md:p-3 border-2 rounded-xl text-center transition-all duration-200 shrink-0
        ${selected
          ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/20"
          : isHovered
            ? "border-[#8b5cf6] bg-[#f5f3ff]"
            : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"
        }
      `}
    >
      <div className="text-[10px] md:text-xs font-bold uppercase tracking-wide mb-0.5">
        {date.toLocaleDateString("en-US", { weekday: "short" })}
      </div>
      <div className="text-lg md:text-xl font-extrabold leading-tight">
        {date.getDate()}
      </div>
      <div className={`text-[10px] ${selected ? "text-white/70" : "text-[#94a3b8]"}`}>
        {date.toLocaleDateString("en-US", { month: "short" })}
      </div>
    </button>
  );
}

function TimeChip({
  time,
  selected,
  onClick,
}: {
  time: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        py-2.5 md:py-3 px-3 md:px-4 border-2 rounded-xl text-center transition-all duration-200 text-xs md:text-sm font-semibold
        ${selected
          ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-lg shadow-[#8b5cf6]/20"
          : "border-[#e2e8f0] bg-white hover:border-[#8b5cf6] text-[#475569]"
        }
      `}
    >
      {time}
    </button>
  );
}

function LocationCard({
  option,
  selected,
  onClick,
}: {
  option: { key: string; label: string; icon: string };
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3.5 md:p-4 border-2 rounded-xl transition-all duration-200 w-full text-left
        ${selected
          ? "border-[#8b5cf6] bg-[#ede9fe] shadow-sm"
          : "border-[#e2e8f0] hover:border-[#8b5cf6]/50"
        }
      `}
    >
      <div
        className={`
          w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-colors duration-200 shrink-0
          ${selected ? "bg-[#8b5cf6] text-white" : "bg-[#f8fafc] text-[#64748b]"}
        `}
      >
        <i className={`fas ${option.icon} text-sm`} />
      </div>
      <span className={`font-semibold text-sm ${selected ? "text-[#8b5cf6]" : "text-[#475569]"}`}>
        {option.label}
      </span>
      {selected && <i className="fas fa-check text-[#8b5cf6] ml-auto text-sm" />}
    </button>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-5 border border-[#e2e8f0] shadow-sm">
      <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-[#1e293b]">
        <div className="w-8 h-8 rounded-lg bg-[#ede9fe] flex items-center justify-center">
          <i className={`fas ${icon} text-[#8b5cf6] text-xs`} />
        </div>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ManualBookingModal({
  open,
  onClose,
  onBookingCreated,
}: ManualBookingModalProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("client");
  const [errors, setErrors] = useState<FormErrors>({});
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("right");

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<"basic" | "standard" | "premium">("standard");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [deposit, setDeposit] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<Booking['paymentMethod']>(undefined);
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [notes, setNotes] = useState("");

  // Load draft from localStorage
  useEffect(() => {
    if (open) {
      const draft = localStorage.getItem("booking_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setClientName(parsed.clientName || "");
          setClientPhone(parsed.clientPhone || "");
          setServiceId(parsed.serviceId || "");
          setSelectedPackage(parsed.selectedPackage || "standard");
          setSelectedDate(parsed.selectedDate ? new Date(parsed.selectedDate) : null);
          setSelectedTime(parsed.selectedTime || "");
          setSelectedLocation(parsed.selectedLocation || "");
          setDeposit(parsed.deposit ?? "");
          setPaymentMethod(parsed.paymentMethod || "");
          setStatus(parsed.status || "confirmed");
          setNotes(parsed.notes || "");
        } catch {
          // ignore parse error
        }
      }
    }
  }, [open]);

  // Auto-save draft
  useEffect(() => {
    if (!open) return;
    const draft = {
      clientName,
      clientPhone,
      serviceId,
      selectedPackage,
      selectedDate: selectedDate?.toISOString(),
      selectedTime,
      selectedLocation,
      deposit,
      paymentMethod,
      status,
      notes,
    };
    localStorage.setItem("booking_draft", JSON.stringify(draft));
  }, [open, clientName, clientPhone, serviceId, selectedPackage, selectedDate, selectedTime, selectedLocation, deposit, paymentMethod, status, notes]);

  useEffect(() => {
    if (open && user) {
      loadServices();
    }
  }, [open, user]);

  const loadServices = async () => {
    if (!user) return;
    setLoadingServices(true);
    try {
      const data = await serviceService.getServices(user);
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  const resetForm = useCallback(() => {
    setClientName("");
    setClientPhone("");
    setServiceId("");
    setSelectedPackage("standard");
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedLocation("");
    setDeposit("");
    setPaymentMethod(undefined);
    setStatus("confirmed");
    setNotes("");
    setCurrentStep("client");
    setErrors({});
    localStorage.removeItem("booking_draft");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const validateStep = (step: Step): boolean => {
    const newErrors: FormErrors = {};

    if (step === "client") {
      if (!clientName.trim()) newErrors.clientName = "Client name is required";
      if (!clientPhone.trim()) newErrors.clientPhone = "Phone number is required";
      else if (!validatePhone(clientPhone)) newErrors.clientPhone = "Enter a valid phone number";
    }

    if (step === "service") {
      if (!serviceId) newErrors.serviceId = "Please select a service";
    }

    if (step === "schedule") {
      if (!selectedDate) newErrors.selectedDate = "Please select a date";
      if (!selectedTime) newErrors.selectedTime = "Please select a time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (direction: "next" | "prev") => {
    if (direction === "next" && !validateStep(currentStep)) return;

    const currentIndex = STEPS.findIndex((s) => s.id === currentStep);
    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < STEPS.length) {
      setSlideDirection(direction === "next" ? "right" : "left");
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const selectedService = services.find((s) => s.id === serviceId);

  const basePrice = selectedService?.priceMin || 0;
  const packagePrices = {
    basic: basePrice,
    standard: Math.round(basePrice * 1.5),
    premium: Math.round(basePrice * 2),
  };
  const finalPrice = packagePrices[selectedPackage];

  const getNextDays = useCallback(() => {
    if (!selectedService) return [];
    const days: Date[] = [];
    const today = new Date();
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 21; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];

      if (!selectedService.availability?.days || selectedService.availability.days.includes(dayName)) {
        days.push(date);
      }
      if (days.length >= 10) break;
    }
    return days;
  }, [selectedService]);

  const timeSlots = selectedService?.customTimeSlots || [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  ];

  const getLocationOptions = useCallback(() => {
    if (!selectedService) return [];
    const options: { key: string; label: string; icon: string }[] = [];
    if (selectedService.mode === "in-person" || selectedService.mode === "both") {
      options.push({ key: "client-place", label: "Client's Place", icon: "fa-home" });
      options.push({ key: "my-place", label: "Provider's Studio", icon: "fa-store" });
    }
    if (selectedService.mode === "remote" || selectedService.mode === "both") {
      options.push({ key: "remote", label: "Online/Remote", icon: "fa-video" });
    }
    return options.length > 0 ? options : [
      { key: "client-place", label: "Client's Place", icon: "fa-home" },
      { key: "my-place", label: "Provider's Studio", icon: "fa-store" },
      { key: "remote", label: "Online/Remote", icon: "fa-video" },
    ];
  }, [selectedService]);

  const handleSubmit = async () => {
    if (!user || !serviceId || !clientName || !clientPhone || !selectedDate || !selectedTime) {
      setErrors({
        clientName: !clientName ? "Required" : undefined,
        clientPhone: !clientPhone ? "Required" : undefined,
        serviceId: !serviceId ? "Required" : undefined,
        selectedDate: !selectedDate ? "Required" : undefined,
        selectedTime: !selectedTime ? "Required" : undefined,
      });
      return;
    }

    setSaving(true);
    try {
      const bookingData: Omit<Booking, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
        client: clientName,
        clientInitials: getInitials(clientName),
        phone: clientPhone,
        service: selectedService!.name,
        serviceId,
        date: selectedDate.toISOString().split("T")[0],
        time: selectedTime,
        duration: selectedService?.duration || "60 min",
        location: selectedLocation || "Not specified",
        price: finalPrice,
        status,
        verified: false,
        notes,
        deposit: deposit ? Number(deposit) : 0,
        balance: finalPrice - (deposit ? Number(deposit) : 0),
        paymentMethod: paymentMethod || undefined,
        paymentStatus: deposit && deposit > 0
          ? (deposit >= finalPrice ? "paid" : "partial")
          : "unpaid",
      };

      await bookingService.createBooking(user, bookingData);
      localStorage.removeItem("booking_draft");
      handleClose();
      onBookingCreated();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard: Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, handleClose]);

  if (!open) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case "client":
        return (
          <div className="space-y-4 animate-fadeIn">
            <SectionCard icon="fa-user" title="Client Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Full Name" required error={errors.clientName}>
                  <Input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="John Doe"
                    error={errors.clientName}
                  />
                </FormField>
                <FormField label="Phone Number" required error={errors.clientPhone}>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    error={errors.clientPhone}
                  />
                </FormField>
              </div>
            </SectionCard>
          </div>
        );

      case "service":
        return (
          <div className="space-y-4 animate-fadeIn">
            <SectionCard icon="fa-concierge-bell" title="Select Service">
              <FormField label="Service" required error={errors.serviceId}>
                <Select
                  value={serviceId}
                  onChange={setServiceId}
                  placeholder="Choose a service..."
                  error={errors.serviceId}
                >
                  {loadingServices ? (
                    <option>Loading...</option>
                  ) : services.length === 0 ? (
                    <option>No services available</option>
                  ) : (
                    services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {formatCurrency(s.priceMin)}
                      </option>
                    ))
                  )}
                </Select>
              </FormField>

              {selectedService && (
                <>
                  {selectedService.description && (
                    <p className="text-sm text-[#64748b] mt-3">{selectedService.description}</p>
                  )}

                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-[#475569] mb-3">Choose Package</h4>
                    <div className="grid gap-3">
                      {(["basic", "standard", "premium"] as const).map((pkg) => (
                        <PackageCard
                          key={pkg}
                          pkg={pkg}
                          selected={selectedPackage === pkg}
                          price={packagePrices[pkg]}
                          features={selectedService.packageFeatures?.[pkg] || [
                            pkg === "basic" ? "Core service included" : pkg === "standard" ? "Everything in Basic" : "Everything in Standard",
                            pkg === "basic" ? "Professional quality" : pkg === "standard" ? "Priority scheduling" : "VIP treatment",
                          ]}
                          onClick={() => setSelectedPackage(pkg)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </SectionCard>
          </div>
        );

      case "schedule":
        return (
          <div className="space-y-4 animate-fadeIn">
            <SectionCard icon="fa-calendar-alt" title="Schedule">
              {selectedService && (
                <>
                  <FormField label="Select Date" required error={errors.selectedDate}>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                      {getNextDays().map((date, idx) => (
                        <DateChip
                          key={idx}
                          date={date}
                          selected={selectedDate?.toDateString() === date.toDateString()}
                          onClick={() => setSelectedDate(date)}
                        />
                      ))}
                    </div>
                  </FormField>

                  {selectedDate && (
                    <FormField label="Select Time" required error={errors.selectedTime}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {timeSlots.map((time) => (
                          <TimeChip
                            key={time}
                            time={time}
                            selected={selectedTime === time}
                            onClick={() => setSelectedTime(time)}
                          />
                        ))}
                      </div>
                    </FormField>
                  )}

                  <div className="mt-4">
                    <h4 className="text-sm font-bold text-[#475569] mb-3">Location</h4>
                    <div className="space-y-2">
                      {getLocationOptions().map((loc) => (
                        <LocationCard
                          key={loc.key}
                          option={loc}
                          selected={selectedLocation === loc.key}
                          onClick={() => setSelectedLocation(loc.key)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </SectionCard>
          </div>
        );

      case "payment":
        return (
          <div className="space-y-4 animate-fadeIn">
            <SectionCard icon="fa-credit-card" title="Payment Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Deposit Amount (KES)">
                  <Input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : "")}
                    placeholder="0"
                    min={0}
                  />
                </FormField>
                <FormField label="Payment Method">
                  <Select
                    value={paymentMethod ?? ""}
                    onChange={(val) => setPaymentMethod(val ? (val as Booking['paymentMethod']) : undefined)}
                    placeholder="Select method"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </Select>
                </FormField>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-bold text-[#475569] mb-3">Booking Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStatus("confirmed")}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all
                      ${status === "confirmed"
                        ? "bg-[#8b5cf6] text-white shadow-md shadow-[#8b5cf6]/20"
                        : "bg-[#f8fafc] text-[#64748b] border-2 border-[#e2e8f0] hover:border-[#8b5cf6]"
                      }
                    `}
                  >
                    <i className="fas fa-check-circle" />
                    Confirmed
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("pending")}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all
                      ${status === "pending"
                        ? "bg-[#f59e0b] text-white shadow-md shadow-[#f59e0b]/20"
                        : "bg-[#f8fafc] text-[#64748b] border-2 border-[#e2e8f0] hover:border-[#f59e0b]"
                      }
                    `}
                  >
                    <i className="fas fa-clock" />
                    Pending
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <FormField label="Notes">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm resize-none transition-all focus:shadow-md focus:shadow-[#8b5cf6]/10"
                  />
                </FormField>
              </div>
            </SectionCard>
          </div>
        );

      case "review":
        return (
          <div className="space-y-4 animate-fadeIn">
            <SectionCard icon="fa-check-circle" title="Review Booking">
              <div className="space-y-4">
                {/* Client summary */}
                <div className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6] font-bold flex items-center justify-center text-sm">
                    {getInitials(clientName)}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{clientName}</div>
                    <div className="text-xs text-[#64748b]">{clientPhone}</div>
                  </div>
                </div>

                {/* Service summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#f8fafc] rounded-xl">
                    <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mb-1">Service</div>
                    <div className="text-sm font-bold text-[#1e293b]">{selectedService?.name}</div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-xl">
                    <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mb-1">Package</div>
                    <div className="text-sm font-bold text-[#1e293b] capitalize">{selectedPackage}</div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-xl">
                    <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mb-1">Date & Time</div>
                    <div className="text-sm font-bold text-[#1e293b]">
                      {selectedDate?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {selectedTime}
                    </div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-xl">
                    <div className="text-[10px] text-[#94a3b8] font-bold uppercase tracking-wider mb-1">Location</div>
                    <div className="text-sm font-bold text-[#1e293b] truncate">
                      {getLocationOptions().find((l) => l.key === selectedLocation)?.label || "Not specified"}
                    </div>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="p-4 bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] rounded-xl border border-[#8b5cf6]/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-[#64748b]">Service Price</span>
                    <span className="font-bold text-[#1e293b]">{formatCurrency(finalPrice)}</span>
                  </div>
                  {deposit !== "" && Number(deposit) > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[#64748b]">Deposit Paid</span>
                      <span className="font-bold text-[#10b981]">-{formatCurrency(Number(deposit))}</span>
                    </div>
                  )}
                  <div className="border-t border-[#8b5cf6]/10 pt-2 mt-2 flex justify-between items-center">
                    <span className="text-sm font-bold text-[#1e293b]">Balance Due</span>
                    <span className="text-xl font-extrabold text-[#8b5cf6]">
                      {formatCurrency(finalPrice - (deposit ? Number(deposit) : 0))}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748b]">Status:</span>
                  <span className={`
                    inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase
                    ${status === "confirmed"
                      ? "bg-[rgba(37,211,102,0.12)] text-[#10b981] border border-[#10b981]/20"
                      : "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border border-[#f59e0b]/20"
                    }
                  `}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status === "confirmed" ? "bg-[#10b981]" : "bg-[#f59e0b]"}`} />
                    {status}
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>
        );
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 md:p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className={`
          relative bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl
          flex flex-col animate-scaleIn
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-[#e2e8f0]">
          <div className="p-4 md:p-5 flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold flex items-center gap-2.5 text-[#1e293b]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-md shadow-[#8b5cf6]/20">
                <i className="fas fa-calendar-plus text-white text-sm" />
              </div>
              Create Booking
            </h2>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full border-2 border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:bg-[#f5f3ff] transition-all active:scale-95"
              aria-label="Close"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>

          {/* Step indicator */}
          <StepIndicator currentStep={currentStep} steps={STEPS} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          <div
            className={`
              transition-all duration-300 ease-out
              ${slideDirection === "right" ? "animate-slideInRight" : slideDirection === "left" ? "animate-slideInLeft" : ""}
            `}
          >
            {renderStepContent()}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-[#e2e8f0] p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goToStep("prev")}
              disabled={isFirstStep}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all
                ${isFirstStep
                  ? "opacity-0 pointer-events-none"
                  : "border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] active:scale-95"
                }
              `}
            >
              <i className="fas fa-arrow-left text-xs" />
              Back
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <span className="hidden sm:inline text-xs text-[#94a3b8] font-medium">
                  Step {currentStepIndex + 1} of {STEPS.length}
                </span>
              )}
            </div>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white
                  bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]
                  hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#8b5cf6]/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check text-xs" />
                    Create Booking
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep("next")}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white
                  bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]
                  hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-[#8b5cf6]/20
                `}
              >
                Next
                <i className="fas fa-arrow-right text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}