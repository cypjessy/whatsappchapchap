"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService, bookingService, Booking, Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

interface ManualBookingModalProps {
  open: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

export default function ManualBookingModal({ open, onClose, onBookingCreated }: ManualBookingModalProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<"basic" | "standard" | "premium">("standard");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [deposit, setDeposit] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card" | "bank" | "">("");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [notes, setNotes] = useState("");

  // Load services on open
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

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setServiceId("");
    setSelectedPackage("standard");
    setSelectedDate(null);
    setSelectedTime("");
    setSelectedLocation("");
    setDeposit("");
    setPaymentMethod("");
    setStatus("confirmed");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !serviceId || !clientName || !clientPhone || !selectedDate || !selectedTime) {
      alert("Please fill in all required fields");
      return;
    }

    const selectedService = services.find(s => s.id === serviceId);
    if (!selectedService) {
      alert("Please select a service");
      return;
    }

    setSaving(true);
    try {
      // Calculate price based on package
      const basePrice = selectedService.priceMin || 0;
      const packagePrices = {
        basic: basePrice,
        standard: Math.round(basePrice * 1.5),
        premium: Math.round(basePrice * 2)
      };
      const finalPrice = packagePrices[selectedPackage];

      const bookingData: Omit<Booking, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
        client: clientName,
        clientInitials: clientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
        phone: clientPhone,
        service: selectedService.name,
        serviceId,
        date: selectedDate.toISOString().split('T')[0],
        time: selectedTime,
        duration: selectedService.duration || "60 min",
        location: selectedLocation || "Not specified",
        price: finalPrice,
        status,
        verified: false,
        notes,
        deposit: deposit ? Number(deposit) : 0,
        balance: finalPrice - (deposit ? Number(deposit) : 0),
        paymentMethod: paymentMethod || undefined,
        paymentStatus: deposit && deposit > 0 ? (deposit >= finalPrice ? 'paid' : 'partial') : 'unpaid',
      };

      // Save to bookings collection
      await bookingService.createBooking(user, bookingData);

      alert("Booking created successfully!");
      handleClose();
      onBookingCreated();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  // Generate next 7 days for date picker (filtered by availability)
  const getNextDays = () => {
    if (!selectedService) return [];
    const days = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 14; i++) { // Check 14 days to find enough available days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      
      // Filter by availability if set
      if (!selectedService.availability?.days || selectedService.availability.days.includes(dayName)) {
        days.push(date);
      }
      
      // Stop when we have 7 available days
      if (days.length >= 7) break;
    }
    return days;
  };

  // Get selected service
  const selectedService = services.find(s => s.id === serviceId);

  // Time slots (use custom if available)
  const timeSlots = selectedService?.customTimeSlots || [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  // Calculate package prices
  const basePrice = selectedService?.priceMin || 0;
  const packagePrices = {
    basic: basePrice,
    standard: Math.round(basePrice * 1.5),
    premium: Math.round(basePrice * 2)
  };

  // Location options based on service mode
  const getLocationOptions = () => {
    if (!selectedService) return [];
    const options = [];
    if (selectedService.mode === 'in-person' || selectedService.mode === 'both') {
      options.push({ key: "client-place", label: "Client's Place", icon: "fa-home" });
      options.push({ key: "my-place", label: "Provider's Studio/Shop", icon: "fa-store" });
    }
    if (selectedService.mode === 'remote' || selectedService.mode === 'both') {
      options.push({ key: "remote", label: "Online/Remote", icon: "fa-video" });
    }
    return options.length > 0 ? options : [
      { key: "client-place", label: "Client's Place", icon: "fa-home" },
      { key: "my-place", label: "Provider's Studio/Shop", icon: "fa-store" },
      { key: "remote", label: "Online/Remote", icon: "fa-video" }
    ];
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1000 flex items-center justify-center p-4 overflow-y-auto" onClick={handleClose}>
      <div className="bg-white rounded-[20px] w-full max-w-2xl max-h-[90vh] overflow-y-auto my-8" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e2e8f0] p-5 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-calendar-plus text-[#8b5cf6]"></i>
            Create Manual Booking
          </h2>
          <button onClick={handleClose} className="w-9 h-9 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Client Information */}
            <div className="bg-white rounded-[20px] p-5 border border-[#e2e8f0]">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <i className="fas fa-user text-[#8b5cf6]"></i>
                Client Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Client Name *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Service Selection */}
            <div className="bg-white rounded-[20px] p-5 border border-[#e2e8f0]">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <i className="fas fa-concierge-bell text-[#8b5cf6]"></i>
                Select Service
              </h3>
              <select
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none mb-4"
                required
              >
                <option value="">Choose a service...</option>
                {loadingServices ? (
                  <option>Loading services...</option>
                ) : services.length === 0 ? (
                  <option>No services available - create one first</option>
                ) : (
                  services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.priceMin)}</option>
                  ))
                )}
              </select>

              {selectedService && (
                <>
                  {selectedService.description && (
                    <p className="text-sm text-[#64748b] mb-4">{selectedService.description}</p>
                  )}

                  {/* Package Selection */}
                  <h4 className="font-semibold mb-3">Select Package</h4>
                  <div className="grid gap-3 mb-4">
                    {(["basic", "standard", "premium"] as const).map((pkg) => (
                      <div
                        key={pkg}
                        className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative ${
                          selectedPackage === pkg
                            ? "border-[#8b5cf6] bg-[#ede9fe]"
                            : "border-[#e2e8f0] hover:border-[#8b5cf6]"
                        }`}
                        onClick={() => setSelectedPackage(pkg)}
                      >
                        {selectedPackage === pkg && (
                          <div className="absolute top-2 right-2 bg-[#8b5cf6] text-white px-2 py-1 rounded-full text-xs font-bold uppercase">
                            Selected
                          </div>
                        )}
                        <div className="font-bold text-lg mb-2 capitalize">{pkg}</div>
                        <ul className="text-sm text-[#64748b] mb-3 space-y-1">
                          {(selectedService?.packageFeatures?.[pkg] || [
                            pkg === 'basic' ? 'Core service included' : pkg === 'standard' ? 'Everything in Basic' : 'Everything in Standard',
                            pkg === 'basic' ? 'Professional quality' : pkg === 'standard' ? 'Priority scheduling' : 'VIP treatment'
                          ]).map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <i className="fas fa-check text-green-500 text-xs"></i>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="text-2xl font-extrabold text-[#8b5cf6]">
                          {formatCurrency(packagePrices[pkg])}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Date Selection */}
                  <h4 className="font-semibold mb-3">Select Date</h4>
                  <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                    {getNextDays().map((date, idx) => {
                      const isSelected = selectedDate?.toDateString() === date.toDateString();
                      return (
                        <div
                          key={idx}
                          className={`min-w-[70px] p-3 border-2 rounded-xl text-center cursor-pointer transition-all ${
                            isSelected
                              ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-lg"
                              : "border-[#e2e8f0] hover:border-[#8b5cf6] bg-white"
                          }`}
                          onClick={() => setSelectedDate(date)}
                        >
                          <div className="text-xs font-semibold uppercase mb-1">
                            {date.toLocaleDateString("en-US", { weekday: "short" })}
                          </div>
                          <div className="text-xl font-extrabold">
                            {date.getDate()}
                          </div>
                          <div className="text-xs opacity-80">
                            {date.toLocaleDateString("en-US", { month: "short" })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Time Selection */}
                  {selectedDate && (
                    <>
                      <h4 className="font-semibold mb-3">Select Time</h4>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {timeSlots.map((time) => (
                          <div
                            key={time}
                            className={`p-3 border-2 rounded-xl text-center cursor-pointer transition-all font-semibold ${
                              selectedTime === time
                                ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-lg"
                                : "border-[#e2e8f0] hover:border-[#8b5cf6] bg-white"
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Location Selection */}
                  <h4 className="font-semibold mb-3">Service Location</h4>
                  <div className="space-y-3 mb-4">
                    {getLocationOptions().map((loc) => (
                      <div
                        key={loc.key}
                        className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          selectedLocation === loc.key
                            ? "border-[#8b5cf6] bg-[#ede9fe]"
                            : "border-[#e2e8f0] hover:border-[#8b5cf6]"
                        }`}
                        onClick={() => setSelectedLocation(loc.key)}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedLocation === loc.key ? "bg-[#8b5cf6] text-white" : "bg-[#f8fafc] text-[#64748b]"
                        }`}>
                          <i className={`fas ${loc.icon}`}></i>
                        </div>
                        <span className="font-semibold">{loc.label}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Payment Details */}
            {selectedService && (
              <div className="bg-white rounded-[20px] p-5 border border-[#e2e8f0]">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <i className="fas fa-credit-card text-[#8b5cf6]"></i>
                  Payment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Deposit (KES)</label>
                    <input
                      type="number"
                      value={deposit}
                      onChange={e => setDeposit(e.target.value ? Number(e.target.value) : "")}
                      min="0"
                      placeholder="0"
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={e => setPaymentMethod(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                    >
                      <option value="">Select method</option>
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Status & Notes */}
            <div className="bg-white rounded-[20px] p-5 border border-[#e2e8f0]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Status</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                        status === "confirmed" 
                          ? "bg-[#8b5cf6] text-white" 
                          : "bg-[#f8fafc] text-[#64748b] border-2 border-[#e2e8f0]"
                      }`}
                      onClick={() => setStatus("confirmed")}
                    >
                      <i className="fas fa-check-circle mr-2"></i>Confirmed
                    </button>
                    <button
                      type="button"
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                        status === "pending" 
                          ? "bg-[#f59e0b] text-white" 
                          : "bg-[#f8fafc] text-[#64748b] border-2 border-[#e2e8f0]"
                      }`}
                      onClick={() => setStatus("pending")}
                    >
                      <i className="fas fa-clock mr-2"></i>Pending
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none resize-none"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-[#e2e8f0] p-5">
          <div className="flex gap-3">
            <button 
              type="button"
              className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all" 
              onClick={handleClose} 
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="button"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50" 
              onClick={handleSubmit} 
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Create Booking
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
