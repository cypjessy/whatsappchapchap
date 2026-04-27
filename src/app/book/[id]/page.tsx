"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<"basic" | "standard" | "premium">("standard");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [providerName, setProviderName] = useState("");

  // Load service data
  useEffect(() => {
    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  const loadService = async () => {
    try {
      console.log("Loading service with ID:", serviceId);
      const serviceDoc = await getDoc(doc(db, "services", serviceId));
      if (serviceDoc.exists()) {
        const serviceData = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
        setService(serviceData);
        console.log("Service loaded:", serviceData.name);
        
        // Try to get provider name from business profile or user data
        setProviderName(serviceData.providerName || "Service Provider");
      } else {
        console.error("Service not found:", serviceId);
        alert("Service not found");
        router.push("/");
      }
    } catch (error) {
      console.error("Error loading service:", error);
      alert("Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  // Generate next 7 days for date picker (filtered by availability)
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 14; i++) { // Check 14 days to find enough available days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      
      // Filter by availability if set
      if (!service?.availability?.days || service.availability.days.includes(dayName)) {
        days.push(date);
      }
      
      // Stop when we have 7 available days
      if (days.length >= 7) break;
    }
    return days;
  };

  // Sample time slots (you can customize based on service availability)
  const timeSlots = service?.customTimeSlots || [
    "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service) {
      alert("Service not loaded");
      return;
    }
    
    if (!selectedDate || !selectedTime || !customerName || !customerPhone) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      // Calculate package price
      const packagePrices = {
        basic: service.priceMin || 0,
        standard: Math.round((service.priceMin || 0) * 1.5),
        premium: Math.round((service.priceMin || 0) * 2)
      };
      const finalPrice = packagePrices[selectedPackage];

      // Save booking to database
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          customerName,
          customerPhone,
          selectedDate: selectedDate.toISOString().split('T')[0],
          selectedTime,
          selectedLocation: selectedLocation || "Not specified",
          selectedPackage,
          packagePrice: finalPrice,
          notes: customerNotes
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      console.log('Booking saved successfully:', result.bookingId);

      // Create WhatsApp message with booking details
      const bookingMessage = `📅 *New Booking Request*\n\n` +
        `*Service:* ${service?.name}\n` +
        `*Package:* ${selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1)}\n` +
        `*Price:* ${formatCurrency(finalPrice)}\n` +
        `*Date:* ${selectedDate.toLocaleDateString()}\n` +
        `*Time:* ${selectedTime}\n` +
        `*Location:* ${selectedLocation || "Not specified"}\n\n` +
        `*Customer Details:*\n` +
        `Name: ${customerName}\n` +
        `Phone: ${customerPhone}\n` +
        `Notes: ${customerNotes || "None"}\n\n` +
        `*Booking ID:* ${result.bookingId}\n\n` +
        `Sent via WhatsApp Chap Chap`;

      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(bookingMessage)}`;
      window.open(whatsappUrl, "_blank");
      
      // Show success message
      alert(`✅ Booking request created!\n\nBooking ID: ${result.bookingId}\n\nPlease send the WhatsApp message to confirm your appointment.`);
      
      // Reset form
      setSelectedDate(null);
      setSelectedTime("");
      setSelectedLocation("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerNotes("");
      
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
        <div className="text-center p-6">
          <i className="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-bold text-[#1e293b] mb-2">Service Not Found</h2>
          <p className="text-[#64748b] mb-4">The service you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const packageLabels = {
    basic: "Starter",
    standard: "Standard",
    premium: "Premium"
  };

  // Calculate dynamic prices based on service data
  const basePrice = service.priceMin || 0;
  const packagePrices = {
    basic: basePrice,
    standard: Math.round(basePrice * 1.5),
    premium: Math.round(basePrice * 2)
  };

  // Get location options based on service mode
  const getLocationOptions = () => {
    const options = [];
    if (service.mode === 'in-person' || service.mode === 'both') {
      options.push({ key: "client-place", label: "Client's Place", icon: "fa-home" });
      options.push({ key: "my-place", label: "Provider's Studio/Shop", icon: "fa-store" });
    }
    if (service.mode === 'remote' || service.mode === 'both') {
      options.push({ key: "remote", label: "Online/Remote", icon: "fa-video" });
    }
    return options.length > 0 ? options : [
      { key: "client-place", label: "Client's Place", icon: "fa-home" },
      { key: "my-place", label: "Provider's Studio/Shop", icon: "fa-store" },
      { key: "remote", label: "Online/Remote", icon: "fa-video" }
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] pb-8">
      {/* Provider Header */}
      <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white p-6 pt-8 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-20%] w-[300px] h-[300px] bg-white/10 rounded-full"></div>
        <div className="absolute bottom-[-30%] left-[-10%] w-[200px] h-[200px] bg-white/5 rounded-full"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-3xl shadow-lg">
              {service.emoji || "✨"}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{service.name}</h1>
              <p className="text-sm opacity-90 flex items-center gap-2">
                <i className="fas fa-store"></i>
                {service.businessType || "Professional Service"}
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <i className="fas fa-clock"></i>
              {service.duration}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <i className="fas fa-star text-yellow-300"></i>
              {service.rating || "4.5"}
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <i className="fas fa-calendar-check"></i>
              {service.bookings || 0} bookings
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[600px] mx-auto px-4 -mt-4 relative z-10">
        
        {/* Service Selection */}
        <div className="bg-white rounded-[20px] p-5 mb-4 shadow-md border border-[#e2e8f0] animate-slideUp">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-concierge-bell text-[#8b5cf6]"></i>
            Select Package
          </h2>
          
          {service.description && (
            <p className="text-sm text-[#64748b] mb-4">{service.description}</p>
          )}
          
          <div className="grid gap-3">
            {(["basic", "standard", "premium"] as const).map((pkg) => (
              <div
                key={pkg}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all relative overflow-hidden ${
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
                
                <div className="font-bold text-lg mb-2">{packageLabels[pkg]}</div>
                <ul className="text-sm text-[#64748b] mb-3 space-y-1">
                  {(service.packageFeatures?.[pkg] || [
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
        </div>

        {/* Portfolio Images */}
        {service.portfolioImages && service.portfolioImages.length > 0 && (
          <div className="bg-white rounded-[20px] p-5 mb-4 shadow-md border border-[#e2e8f0]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-images text-[#8b5cf6]"></i>
              Portfolio Photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {service.portfolioImages.map((imageUrl, idx) => (
                <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-[#f8fafc]">
                  <img
                    src={imageUrl}
                    alt={`Portfolio ${idx + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.open(imageUrl, '_blank')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Service Specifications */}
        {service.specifications && Object.keys(service.specifications).length > 0 && (
          <div className="bg-white rounded-[20px] p-5 mb-4 shadow-md border border-[#e2e8f0]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-sliders-h text-[#8b5cf6]"></i>
              Service Details
            </h2>
            <div className="space-y-3">
              {Object.entries(service.specifications).map(([key, values]) => (
                <div key={key} className="border-b border-[#e2e8f0] pb-3 last:border-0">
                  <div className="text-sm font-semibold text-[#64748b] mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(values as string[]).map((val: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-[#ede9fe] text-[#7c3aed] rounded-full text-sm font-medium">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Date Selection */}
        <div className="bg-white rounded-[20px] p-5 mb-4 shadow-md border border-[#e2e8f0]">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-calendar-alt text-[#8b5cf6]"></i>
            Select Date
          </h2>
          
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
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
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="bg-white rounded-[20px] p-5 mb-4 shadow-md border border-[#e2e8f0]">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-clock text-[#8b5cf6]"></i>
              Select Time
            </h2>
            
            <div className="grid grid-cols-3 gap-3">
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
          </div>
        )}

        {/* Location Selection */}
        <div className="bg-white rounded-[20px] p-5 mb-4 shadow-md border border-[#e2e8f0]">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-[#8b5cf6]"></i>
            Service Location
          </h2>
          
          <div className="space-y-3">
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
        </div>

        {/* Customer Information */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[20px] p-5 mb-4 shadow-md border border-[#e2e8f0]">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-user text-[#8b5cf6]"></i>
            Your Information
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g., +254 712 345 678"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Any special requests or requirements..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none resize-none"
              />
            </div>
          </div>
        </form>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedDate || !selectedTime || !customerName || !customerPhone}
          className="w-full py-4 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Processing...
            </>
          ) : (
            <>
              <i className="fab fa-whatsapp mr-2"></i>
              Book via WhatsApp
            </>
          )}
        </button>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-[#64748b]">
          <p>Powered by WhatsApp Chap Chap</p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
