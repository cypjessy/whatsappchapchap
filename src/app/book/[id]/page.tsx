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
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingNumber, setBookingNumber] = useState("");

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
              
        // Auto-select first available package
        if (serviceData.packagePrices && Object.keys(serviceData.packagePrices).length > 0) {
          const firstPackage = Object.keys(serviceData.packagePrices)[0];
          setSelectedPackage(firstPackage);
        }
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
      // Calculate package price from service data
      const packagePrices = service.packagePrices || {};
      const finalPrice = packagePrices[selectedPackage] || service.priceMin || 0;
      const packageName = selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1);

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
      
      // Show success screen with booking number
      setBookingNumber(result.bookingNumber || result.bookingId);
      setBookingSuccess(true);
      
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Failed to submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] pb-8">
        {/* Success Header */}
        <div className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-4xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Booking Confirmed!</h1>
          <p className="text-lg opacity-90">Thank you for your booking</p>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 -mt-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Booking Number Card */}
            <div className="p-8 bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
              <div className="text-sm opacity-90 mb-2">Booking Number</div>
              <div className="text-3xl font-extrabold tracking-wide">{bookingNumber}</div>
            </div>
            
            {/* What's Next Section */}
            <div className="p-8">
              <h3 className="text-xl font-bold text-[#1e293b] mb-6">What's Next?</h3>
              <ul className="space-y-4">
                <li className="flex gap-4 pb-4 border-b border-[#e2e8f0]">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-envelope text-blue-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1e293b] mb-1">Confirmation Sent</div>
                    <div className="text-sm text-[#64748b]">Check your WhatsApp for booking details</div>
                  </div>
                </li>
                <li className="flex gap-4 pb-4 border-b border-[#e2e8f0]">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-calendar-check text-purple-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1e293b] mb-1">Preparing Your Appointment</div>
                    <div className="text-sm text-[#64748b]">We're getting everything ready for you</div>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-phone text-green-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-[#1e293b] mb-1">Reminder Coming</div>
                    <div className="text-sm text-[#64748b]">You'll receive updates via WhatsApp</div>
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Info Box */}
            <div className="px-8 pb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <p className="text-sm text-blue-800 m-0">
                  <i className="fas fa-info-circle mr-2"></i>
                  You can book more services anytime. Save this booking number for reference.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  // Get dynamic packages from Firestore
  const packagePrices = service.packagePrices || {};
  const packageNames = Object.keys(packagePrices);

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
      <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white p-4 md:p-6 lg:p-8 pt-6 md:pt-8 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-20%] w-[200px] h-[200px] md:w-[300px] md:h-[300px] bg-white/10 rounded-full"></div>
        <div className="absolute bottom-[-30%] left-[-10%] w-[150px] h-[150px] md:w-[200px] md:h-[200px] bg-white/5 rounded-full"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center text-2xl md:text-3xl shadow-lg flex-shrink-0">
              {service.emoji || "✨"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold truncate">{service.name}</h1>
              <p className="text-xs md:text-sm opacity-90 flex items-center gap-2">
                <i className="fas fa-store"></i>
                <span className="truncate">{service.businessType || "Professional Service"}</span>
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 md:gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
              <i className="fas fa-clock"></i>
              {service.duration}
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
              <i className="fas fa-star text-yellow-300"></i>
              {service.rating || "4.5"}
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold">
              <i className="fas fa-calendar-check"></i>
              {service.bookings || 0} bookings
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 lg:px-6 -mt-3 md:-mt-4 relative z-10">
        
        {/* Two Column Layout for Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          
          {/* Left Column - Package & Details */}
          <div className="lg:col-span-2 space-y-4">
        
        {/* Service Selection */}
        <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-[#e2e8f0] animate-slideUp">
          <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-concierge-bell text-[#8b5cf6]"></i>
            Select Package
          </h2>
          
          {service.description && (
            <p className="text-sm text-[#64748b] mb-4">{service.description}</p>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packageNames.map((pkg) => {
              const price = packagePrices[pkg] || 0;
              const features = service.packageFeatures?.[pkg] || [
                `${pkg} package selected`,
                "Quality service guaranteed"
              ];
              const displayName = pkg.charAt(0).toUpperCase() + pkg.slice(1);
              
              return (
                <div
                  key={pkg}
                  className={`p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all relative overflow-hidden ${
                    selectedPackage === pkg
                      ? "border-[#8b5cf6] bg-[#ede9fe]"
                      : "border-[#e2e8f0] hover:border-[#8b5cf6]"
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {selectedPackage === pkg && (
                    <div className="absolute top-2 right-2 bg-[#8b5cf6] text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase">
                      Selected
                    </div>
                  )}
                  
                  <div className="font-bold text-base md:text-lg mb-2">{displayName}</div>
                  <ul className="text-xs md:text-sm text-[#64748b] mb-3 space-y-1">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <i className="fas fa-check text-green-500 text-[10px] md:text-xs mt-0.5 flex-shrink-0"></i>
                        <span className="text-xs md:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="text-xl md:text-2xl font-extrabold text-[#8b5cf6]">
                    {formatCurrency(price)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio Images */}
        {service.portfolioImages && service.portfolioImages.length > 0 && (
          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-[#e2e8f0]">
            <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-images text-[#8b5cf6]"></i>
              Portfolio Photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
              {service.portfolioImages.map((imageUrl, idx) => (
                <div key={idx} className="aspect-square rounded-lg md:rounded-xl overflow-hidden bg-white">
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
          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-[#e2e8f0]">
            <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-sliders-h text-[#8b5cf6]"></i>
              Service Details
            </h2>
            <div className="space-y-3">
              {Object.entries(service.specifications).map(([key, values]) => (
                <div key={key} className="border-b border-[#e2e8f0] pb-3 last:border-0">
                  <div className="text-xs md:text-sm font-semibold text-[#64748b] mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {(values as string[]).map((val: string, idx: number) => (
                      <span key={idx} className="px-2 md:px-3 py-1 bg-[#ede9fe] text-[#7c3aed] rounded-full text-xs md:text-sm font-medium">
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
        <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-[#e2e8f0]">
          <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-calendar-alt text-[#8b5cf6]"></i>
            Select Date
          </h2>
          
          <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {getNextDays().map((date, idx) => {
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              return (
                <div
                  key={idx}
                  className={`min-w-[60px] md:min-w-[70px] p-2 md:p-3 border-2 rounded-xl text-center cursor-pointer transition-all ${
                    isSelected
                      ? "bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6] shadow-lg"
                      : "border-[#e2e8f0] hover:border-[#8b5cf6] bg-white"
                  }`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="text-[10px] md:text-xs font-semibold uppercase mb-1">
                    {date.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div className="text-lg md:text-xl font-extrabold">
                    {date.getDate()}
                  </div>
                  <div className="text-[10px] md:text-xs opacity-80">
                    {date.toLocaleDateString("en-US", { month: "short" })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-[#e2e8f0]">
            <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-clock text-[#8b5cf6]"></i>
              Select Time
            </h2>
            
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className={`p-2 md:p-3 border-2 rounded-xl text-center cursor-pointer transition-all font-semibold text-xs md:text-sm ${
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
        <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-[#e2e8f0]">
          <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-map-marker-alt text-[#8b5cf6]"></i>
            Service Location
          </h2>
          
          <div className="space-y-2 md:space-y-3">
            {getLocationOptions().map((loc) => (
              <div
                key={loc.key}
                className={`flex items-center gap-2 md:gap-3 p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedLocation === loc.key
                    ? "border-[#8b5cf6] bg-[#ede9fe]"
                    : "border-[#e2e8f0] hover:border-[#8b5cf6]"
                }`}
                onClick={() => setSelectedLocation(loc.key)}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                  selectedLocation === loc.key ? "bg-[#8b5cf6] text-white" : "bg-white text-[#64748b]"
                }`}>
                  <i className={`fas ${loc.icon} text-sm md:text-base`}></i>
                </div>
                <span className="font-semibold text-sm md:text-base">{loc.label}</span>
              </div>
            ))}
          </div>
        </div>

        </div>{/* End Left Column */}

        {/* Right Column - Customer Form (Sticky on Desktop) */}
        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-4 space-y-4">
        
        {/* Customer Information */}
        <form onSubmit={handleSubmit} className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-[#e2e8f0]">
          <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-user text-[#8b5cf6]"></i>
            Your Information
          </h2>
          
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#64748b] mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm md:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#64748b] mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g., +254 712 345 678"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm md:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm font-semibold text-[#64748b] mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Any special requests or requirements..."
                rows={3}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none resize-none text-sm md:text-base"
              />
            </div>
          </div>
        </form>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={submitting || !selectedDate || !selectedTime || !customerName || !customerPhone}
          className="w-full py-3 md:py-4 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold text-base md:text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Processing...
            </>
          ) : (
            <>
              <i className="fas fa-calendar-check mr-2"></i>
              Confirm Booking
            </>
          )}
        </button>

        </div>{/* End Sticky Container */}
        </div>{/* End Right Column */}
        
        </div>{/* End Grid */}

        {/* Footer */}
        <div className="text-center mt-6 md:mt-8 text-xs md:text-sm text-[#64748b]">
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
        
        /* ============================================
           MATERIAL DESIGN 3 - MOBILE/CAPACITOR ANDROID
           ============================================ */
        @media (max-width: 768px) {
          /* MD3 Background */
          .min-h-screen.bg-gradient-to-b {
            background: var(--md-sys-color-background, #f8fafc) !important;
          }
          
          /* MD3 Cards */
          .bg-white.rounded-\[16px\] {
            border-radius: 16px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            background: var(--md-sys-color-surface, white) !important;
            border: none !important;
          }
          
          /* MD3 Input Fields */
          input[type="text"],
          input[type="tel"],
          textarea {
            padding: 16px !important;
            border-radius: 4px !important;
            font-size: 16px !important; /* Prevents zoom on iOS */
            border: 1px solid var(--md-sys-color-outline, #e2e8f0) !important;
            background: transparent !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          input[type="text"]:focus,
          input[type="tel"]:focus,
          textarea:focus {
            border-color: var(--md-sys-color-primary, #8b5cf6) !important;
            border-width: 2px !important;
            outline: none !important;
            padding: 15px !important; /* Adjust for thicker border */
          }
          
          /* MD3 Buttons */
          button.bg-gradient-to-r.from-\[\#8b5cf6\] {
            background: var(--md-sys-color-primary, #8b5cf6) !important;
            color: var(--md-sys-color-on-primary, white) !important;
            border-radius: 20px !important; /* MD3 pill shape */
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            font-weight: 500 !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          button.bg-gradient-to-r.from-\[\#8b5cf6\]:active:not(:disabled) {
            transform: scale(0.98) !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
          }
          
          /* MD3 Package Selection Cards */
          div[style*="cursor.*pointer"][style*="border"] {
            border-radius: 12px !important;
            transition: all 0.2s ease !important;
          }
          
          /* MD3 Date/Time Chips */
          button.border-2 {
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
          }
          
          /* MD3 Location Selection */
          .rounded-xl.border-2 {
            border-radius: 12px !important;
          }
          
          /* MD3 Typography */
          h1, h2, h3 {
            color: var(--md-sys-color-on-surface, #1e293b) !important;
            font-weight: 500 !important;
          }
          
          /* MD3 Section Headers */
          .font-bold.text-base,
          .font-bold.text-lg {
            font-weight: 500 !important;
            color: var(--md-sys-color-on-surface, #1e293b) !important;
          }
          
          /* MD3 Labels */
          label.text-xs,
          label.text-sm {
            color: var(--md-sys-color-on-surface-variant, #64748b) !important;
            font-weight: 500 !important;
          }
          
          /* MD3 Header Gradient */
          .bg-gradient-to-br.from-\[\#8b5cf6\] {
            background: linear-gradient(135deg, var(--md-sys-color-primary, #8b5cf6) 0%, var(--md-sys-color-primary-container, #7c3aed) 100%) !important;
            border-radius: 0 0 24px 24px !important;
          }
          
          /* MD3 Spacing */
          .space-y-4 > * + *,
          .space-y-3 > * + * {
            margin-top: 16px !important;
          }
          
          /* MD3 Service Image Container */
          .w-12.h-12.md\:w-16.md\:h-16 {
            border-radius: 16px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          
          /* MD3 Provider Info */
          .text-xs.md\:text-sm.opacity-90 {
            color: var(--md-sys-color-on-primary, rgba(255,255,255,0.9)) !important;
          }
        }
      `}</style>
    </div>
  );
}
