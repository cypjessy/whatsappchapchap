"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService, bookingService, customerService, Booking, Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getBookingStatusMessage } from "@/utils/bookingMessages";
import { normalizePhone } from "@/utils/phoneUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ManualBookingModalProps {
  open: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

interface FormErrors {
  clientName?: string;
  clientPhone?: string;
  clientEmail?: string;
  serviceId?: string;
  selectedDate?: string;
  selectedTime?: string;
}

interface CustomerResult {
  id: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
}

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

function formatDateInput(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FormField({
  label,
  required,
  error,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs md:text-sm font-semibold text-on-surface-variant flex items-center gap-1.5">
        {icon && <i className={`fas ${icon} text-[10px] text-outline`} />}
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
              : "border-outline hover:border-outline"
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
              : "border-outline hover:border-outline"
          }
          ${value ? "text-on-surface" : "text-outline"}
        `}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-outline text-xs pointer-events-none" />
      {error && (
        <i className="fas fa-exclamation-circle absolute right-8 top-1/2 -translate-y-1/2 text-[#ef4444] text-sm" />
      )}
    </div>
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
    <div className="bg-surface rounded-xl md:rounded-2xl p-4 md:p-5 border border-outline shadow-md">
      <h3 className="text-sm md:text-base font-bold mb-4 flex items-center gap-2 text-on-surface">
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
  const [customers, setCustomers] = useState<CustomerResult[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveCustomer, setSaveCustomer] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Phone prefix constant
  const PHONE_PREFIX = "254";
  const customerRef = useRef<HTMLDivElement>(null);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState(PHONE_PREFIX);
  const [clientEmail, setClientEmail] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [location, setLocation] = useState("");
  const [customPrice, setCustomPrice] = useState<number>(0);
  const [customDuration, setCustomDuration] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");

  // Load customers and services on open
  useEffect(() => {
    if (open && user) {
      loadCustomers();
      loadServices();
    }
  }, [open, user]);

  // Close customer dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadCustomers = async () => {
    if (!user) return;
    setLoadingCustomers(true);
    try {
      const data = await customerService.getClients(user);
      setCustomers(data.map((c) => ({ id: c.id, name: c.name, phone: c.phone, email: c.email, location: c.location })));
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const selectCustomer = useCallback((customer: CustomerResult) => {
    setClientName(customer.name);
    setClientPhone(normalizePhone(customer.phone));
    setClientEmail(customer.email || "");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setErrors((prev) => ({ ...prev, clientName: undefined, clientPhone: undefined }));
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 5);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 10);
  }, [customers, customerSearch]);

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
    setClientPhone(PHONE_PREFIX);
    setClientEmail("");
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setSaveCustomer(true);
    setSendWhatsApp(true);
    setServiceId("");
    setSelectedDate("");
    setSelectedTime("");
    setLocation("");
    setCustomPrice(0);
    setCustomDuration("");
    setSpecialRequests("");
    setPaymentMethod("");
    setPaymentRef("");
    setNotes("");
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!clientName.trim()) newErrors.clientName = "Client name is required";
    if (!clientPhone.trim()) newErrors.clientPhone = "Phone number is required";
    else if (!validatePhone(clientPhone)) newErrors.clientPhone = "Enter a valid phone number";
    if (!serviceId) newErrors.serviceId = "Please select a service";
    if (!selectedDate) newErrors.selectedDate = "Please select a date";
    if (!selectedTime) newErrors.selectedTime = "Please select a time";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const selectedService = services.find((s) => s.id === serviceId);

  // Generate next 10 available days
  const availableDates = useMemo(() => {
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

  const handleSubmit = async () => {
    if (!user || !selectedService) return;

    if (!validateForm()) return;

    setSaving(true);
    try {
      const price = customPrice > 0 ? customPrice : selectedService.priceMin;
      const actualDuration = customDuration || selectedService.duration || "60 min";

      const bookingData: Omit<Booking, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
        client: clientName,
        clientInitials: getInitials(clientName),
        phone: clientPhone,
        email: clientEmail || undefined,
        service: selectedService.name,
        serviceId,
        date: selectedDate,
        time: selectedTime,
        duration: actualDuration,
        location: location || "Not specified",
        specialRequests: specialRequests || undefined,
        price,
        status: "confirmed",
        verified: false,
        notes: notes || undefined,
        deposit: 0,
        balance: 0,
        paymentMethod: (paymentMethod as Booking['paymentMethod']) || undefined,
        paymentStatus: "paid",
        source: "manual",
      };

      const createdBooking = await bookingService.createBooking(user, bookingData);

      // Always send WhatsApp notification
      try {
        const message = getBookingStatusMessage(
          "manual_booking",
          clientName,
          createdBooking.bookingNumber || createdBooking.id,
          selectedService.name,
          selectedDate,
          selectedTime,
          location || "Not specified",
          formatCurrency(price)
        );

        await sendEvolutionWhatsAppMessage(clientPhone, message, `tenant_${user.uid}`);
      } catch (err) {
        console.error("Error sending WhatsApp notification:", err);
        // Non-blocking — booking already created
      }

      // Save customer to database if toggled
      if (saveCustomer) {
        try {
          const existingCustomer = customers.find(
            (c) => c.phone.replace(/\D/g, "") === clientPhone.replace(/\D/g, "")
          );
          if (!existingCustomer) {
            await customerService.createClient(user, {
              name: clientName,
              initials: getInitials(clientName),
              phone: clientPhone,
              email: clientEmail || undefined,
              location: undefined,
              status: "active",
              verified: false,
              visits: 1,
              totalSpent: price,
              rating: 0,
              services: [selectedService.name],
            });
          }
        } catch (err) {
          console.error("Error saving customer:", err);
          // Non-blocking — booking already created
        }
      }

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

  return (
    <div
      className="fixed inset-0 z-[2500] flex items-center justify-center p-3 md:p-4 animate-fadeIn"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60" />

      <div
        className="relative bg-surface rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 bg-surface border-b border-outline-variant p-4 md:p-5 flex justify-between items-center">
          <h2 className="text-lg md:text-xl font-bold flex items-center gap-2.5 text-on-surface">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] flex items-center justify-center shadow-md shadow-[#8b5cf6]/20">
              <i className="fas fa-calendar-plus text-white text-sm" />
            </div>
            <div>
              Manual Booking
              <div className="text-[10px] md:text-xs font-medium text-outline mt-0.5">
                Customer already paid — confirm &amp; create
              </div>
            </div>
          </h2>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full border-2 border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] hover:bg-[#f5f3ff] transition-all active:scale-95"
            aria-label="Close"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {/* Client Section */}
          <SectionCard icon="fa-user" title="Client Information">
            {/* Customer Search */}
            <div className="mb-4" ref={customerRef}>
              <FormField label="Search Existing Customer" icon="fa-search">
                <div className="relative">
                  <input
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    placeholder="Search by name or phone..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-outline focus:border-[#8b5cf6] focus:outline-none text-sm transition-all pl-10"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" />
                </div>
                {showCustomerDropdown && (
                  <div className="mt-1.5 bg-surface border border-outline rounded-xl shadow-md max-h-48 overflow-y-auto z-50">
                    {loadingCustomers ? (
                      <div className="p-3 text-sm text-on-surface-variant flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-outline-variant border-t-[#8b5cf6] rounded-full animate-spin" />
                        Loading customers...
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="p-3 text-sm text-outline">No customers found. Enter details manually below.</div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => selectCustomer(c)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#F3E8FF] transition-colors text-sm border-b border-outline-variant/50 last:border-b-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {c.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-on-surface truncate">{c.name}</div>
                            <div className="text-[11px] text-on-surface-variant">{c.phone}</div>
                          </div>
                          <i className="fas fa-chevron-right text-[10px] text-outline" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </FormField>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-outline-variant to-transparent mb-4" />

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
                <div className="relative">
                  <div className="flex items-stretch">
                    <div className="flex items-center px-3.5 bg-[#f1f5f9] border-2 border-r-0 border-outline rounded-l-xl text-sm font-bold text-on-surface-variant shrink-0">
                      <i className="fas fa-phone-alt text-[10px] mr-1.5 text-outline" />
                      +{PHONE_PREFIX}
                    </div>
                    <input
                      type="tel"
                      value={clientPhone.startsWith(PHONE_PREFIX) ? clientPhone.slice(PHONE_PREFIX.length) : clientPhone}
                      onChange={(e) => {
                        // Only allow digits
                        const digits = e.target.value.replace(/\D/g, "");
                        setClientPhone(PHONE_PREFIX + digits);
                      }}
                      placeholder="700 000 000"
                      className={`
                        flex-1 px-3 py-3 rounded-r-xl border-2 transition-all duration-200 text-sm
                        focus:outline-none min-w-0
                        ${errors.clientPhone
                          ? "border-[#ef4444] bg-[#ef4444]/5"
                          : "border-outline focus:border-[#8b5cf6] focus:shadow-md focus:shadow-[#8b5cf6]/10"
                        }
                      `}
                    />
                  </div>
                  {errors.clientPhone && (
                    <p className="text-[11px] text-[#ef4444] font-medium flex items-center gap-1 mt-1.5 animate-fadeIn">
                      <i className="fas fa-exclamation-circle text-[10px]" />
                      {errors.clientPhone}
                    </p>
                  )}
                </div>
              </FormField>
              <FormField label="Email Address">
                <Input
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="john@example.com"
                  type="email"
                />
              </FormField>
            </div>

            {/* Save Customer Toggle */}
            <div className="mt-4 flex items-center justify-between p-3 bg-[#F8FAFC] rounded-xl border border-outline-variant">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center">
                  <i className="fas fa-database text-[#8b5cf6] text-xs" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-on-surface">Save to Customers</div>
                  <div className="text-[11px] text-on-surface-variant">Add this client to your customer database</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSaveCustomer(!saveCustomer)}
                className={`
                  relative w-12 h-6 rounded-full transition-all duration-200
                  ${saveCustomer ? "bg-[#8b5cf6]" : "bg-outline-variant"}
                `}
              >
                <div
                  className={`
                    absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200
                    ${saveCustomer ? "left-[26px]" : "left-0.5"}
                  `}
                />
              </button>
            </div>
          </SectionCard>

          {/* Service Section */}
          <SectionCard icon="fa-concierge-bell" title="Service & Schedule">
            <FormField label="Service" required error={errors.serviceId}>
              <Select
                value={serviceId}
                onChange={(val) => {
                  setServiceId(val);
                  setSelectedDate("");
                  setSelectedTime("");
                }}
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
              <div className="space-y-4 mt-4">
                {/* Date & Time row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Date */}
                  <FormField label="Date" required error={errors.selectedDate}>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                      {availableDates.map((date, idx) => {
                        const dateStr = date.toISOString().split("T")[0];
                        const isSelected = selectedDate === dateStr;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedDate(dateStr)}
                            className={`
                              min-w-[68px] md:min-w-[76px] p-2.5 md:p-3 border-2 rounded-xl text-center transition-all duration-200 shrink-0
                              ${isSelected
                                ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/20"
                                : "border-outline-variant bg-surface hover:border-[#8b5cf6]"
                              }
                            `}
                          >
                            <div className="text-[10px] md:text-xs font-bold uppercase tracking-wide mb-0.5">
                              {date.toLocaleDateString("en-US", { weekday: "short" })}
                            </div>
                            <div className="text-lg md:text-xl font-extrabold leading-tight">
                              {date.getDate()}
                            </div>
                            <div className={`text-[10px] ${isSelected ? "text-white/70" : "text-outline"}`}>
                              {date.toLocaleDateString("en-US", { month: "short" })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </FormField>

                  {/* Time */}
                  <FormField label="Time" required error={errors.selectedTime}>
                    <div className="flex flex-wrap gap-2">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`
                            py-2.5 md:py-3 px-3 md:px-4 border-2 rounded-xl text-center transition-all duration-200 text-xs md:text-sm font-semibold
                            ${selectedTime === time
                              ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-md shadow-[#8b5cf6]/20"
                              : "border-outline-variant bg-surface hover:border-[#8b5cf6] text-on-surface-variant"
                            }
                          `}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </FormField>
                </div>

                {/* Location & Duration row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Location" icon="fa-map-marker-alt">
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Your business address or client location"
                    />
                  </FormField>
                  <FormField label="Duration" icon="fa-clock">
                    <Input
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      placeholder={selectedService.duration || "60 min"}
                    />
                  </FormField>
                </div>
              </div>
            )}
          </SectionCard>

          {/* Payment Section */}
          <SectionCard icon="fa-credit-card" title="Payment (Collected by Merchant)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Payment Method" icon="fa-money-bill-wave">
                <Select
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  placeholder="Select method"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="other">Other</option>
                </Select>
              </FormField>
              <FormField label="Transaction Reference" icon="fa-receipt">
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. M-Pesa ref, receipt #"
                />
              </FormField>
            </div>

            {/* Price badge with override */}
            {selectedService && (
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] rounded-xl border border-[#8b5cf6]/10 flex items-center justify-between">
                  <span className="text-sm font-semibold text-on-surface-variant">Service Price</span>
                  <span className="text-lg font-extrabold text-[#8b5cf6]">{formatCurrency(selectedService.priceMin)}</span>
                </div>
                <div className="relative">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                    Custom Price <span className="text-outline font-normal">(leave 0 to use service price)</span>
                  </label>
                  <div className="relative">
                    <i className="fas fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm" />
                    <input
                      type="number"
                      value={customPrice || ""}
                      onChange={(e) => setCustomPrice(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0 = use service price"
                      min="0"
                      className="w-full pl-9 pr-4 py-3 border-2 border-outline rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6] transition-all"
                    />
                  </div>
                  {customPrice > 0 && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[#f59e0b] font-medium">
                      <i className="fas fa-exclamation-circle" />
                      Charging {formatCurrency(customPrice)} instead of {formatCurrency(selectedService.priceMin)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </SectionCard>

          {/* Notes & Options Section */}
          <SectionCard icon="fa-sticky-note" title="Notes & Options">
            {/* Special Requests - separate from notes */}
            <div className="mb-4">
              <FormField label="Special Requests (optional)" icon="fa-star">
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="E.g. specific stylist, preferred products, allergies..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border-2 border-outline focus:border-[#8b5cf6] focus:outline-none text-sm resize-none transition-all focus:shadow-md focus:shadow-[#8b5cf6]/10"
                />
              </FormField>
            </div>

            <FormField label="Internal Notes (optional)" icon="fa-sticky-note">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes for staff..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border-2 border-outline focus:border-[#8b5cf6] focus:outline-none text-sm resize-none transition-all focus:shadow-md focus:shadow-[#8b5cf6]/10"
              />
            </FormField>

            {/* WhatsApp notification — always sent */}
            <div className="mt-4 p-3 bg-[#F0FDF4] rounded-xl border border-[#10b981]/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#DCFCE7] flex items-center justify-center shrink-0">
                  <i className="fab fa-whatsapp text-[#10b981] text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                    WhatsApp Notification
                    <span className="px-1.5 py-0.5 rounded-full bg-[#10b981] text-white text-[8px] font-bold uppercase tracking-wider">Always on</span>
                  </div>
                  <div className="text-[11px] text-on-surface-variant">
                    Client will be notified when booking is confirmed
                  </div>
                </div>
                <i className="fas fa-check-circle text-[#10b981] text-sm" />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="shrink-0 bg-surface border-t border-outline-variant p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border-2 border-outline-variant text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] active:scale-95 transition-all"
            >
              <i className="fas fa-times text-xs" />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white
                bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]
                hover:opacity-90 active:scale-95 transition-all shadow-md shadow-[#8b5cf6]/20
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
                  Confirm &amp; Create Booking
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
