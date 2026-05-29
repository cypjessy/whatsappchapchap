"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { buildApiUrl } from "@/lib/api-config";

export default function BookingPageContent() {
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
  
  // Payment method state
  const [paymentMethods, setPaymentMethods] = useState<Array<{ id: string; name: string; details: string; icon: string; color: string }>>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  // Load service data and payment methods
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
        
        // Fetch payment methods from business profile
        if (serviceData.tenantId) {
          await loadPaymentMethods(serviceData.tenantId);
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
  
  const loadPaymentMethods = async (tenantId: string) => {
    try {
      setLoadingPaymentMethods(true);
      
      // Fetch business profile for payment methods
      const profileQuery = query(collection(db, "businessProfiles"), where("tenantId", "==", tenantId));
      const profileSnap = await getDocs(profileQuery);
      const profileData = !profileSnap.empty ? profileSnap.docs[0].data() : null;
      
      console.log('🔍 Booking - Profile data found:', !!profileData);
      console.log('💳 Booking - Payment methods from profile:', profileData?.paymentMethods);
      
      // Build payment methods array from business profile
      const paymentMethodsArray: Array<{ id: string; name: string; details: string; icon: string; color: string }> = [];
      const pm = profileData?.paymentMethods;
      
      if (pm?.mpesa?.enabled) {
        if (pm.mpesa.buyGoods?.tillNumber) {
          paymentMethodsArray.push({
            id: "mpesa-buygoods",
            name: "M-Pesa Buy Goods",
            details: `Till Number: ${pm.mpesa.buyGoods.tillNumber}${pm.mpesa.buyGoods.businessName ? ` (${pm.mpesa.buyGoods.businessName})` : ''}`,
            icon: "fa-store",
            color: "#00A650"
          });
        }
        
        if (pm.mpesa.paybill?.paybillNumber) {
          paymentMethodsArray.push({
            id: "mpesa-paybill",
            name: "M-Pesa Paybill",
            details: `Paybill: ${pm.mpesa.paybill.paybillNumber}${pm.mpesa.paybill.accountNumber ? ` (Acc: ${pm.mpesa.paybill.accountNumber})` : ''}${pm.mpesa.paybill.businessName ? ` (${pm.mpesa.paybill.businessName})` : ''}`,
            icon: "fa-building",
            color: "#059669"
          });
        }
        
        if (pm.mpesa.personal?.phoneNumber) {
          paymentMethodsArray.push({
            id: "mpesa-personal",
            name: "M-Pesa Send Money",
            details: `Phone: ${pm.mpesa.personal.phoneNumber}${pm.mpesa.personal.accountName ? ` (${pm.mpesa.personal.accountName})` : ''}`,
            icon: "fa-user",
            color: "#10b981"
          });
        }
      }
      
      if (pm?.bank?.enabled) {
        paymentMethodsArray.push({
          id: "bank",
          name: "Bank Transfer",
          details: `${pm.bank.bankName || ''}\nAccount: ${pm.bank.accountNumber || ''}${pm.bank.branch ? `\nBranch: ${pm.bank.branch}` : ''}`,
          icon: "fa-university",
          color: "#64748b"
        });
      }
      
      if (pm?.card?.enabled) {
        paymentMethodsArray.push({
          id: "card",
          name: "Card Payment",
          details: pm.card.description || "Pay with credit/debit card",
          icon: "fa-credit-card",
          color: "#3b82f6"
        });
      }
      
      if (pm?.cash?.enabled) {
        paymentMethodsArray.push({
          id: "cash",
          name: "Cash on Delivery",
          details: pm.cash.description || "Pay with cash upon delivery",
          icon: "fa-money-bill-wave",
          color: "#10b981"
        });
      }
      
      console.log('✅ Booking - Payment methods loaded:', paymentMethodsArray.length);
      setPaymentMethods(paymentMethodsArray);
      
      // Auto-select first payment method if available
      if (paymentMethodsArray.length > 0) {
        setSelectedPaymentMethod(paymentMethodsArray[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Generate next 7 days for date picker (filtered by availability)
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayName = dayNames[date.getDay()];
      
      if (!service?.availability?.days || service.availability.days.includes(dayName)) {
        days.push(date);
      }
      
      if (days.length >= 7) break;
    }
    return days;
  };

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
      const packagePrices = service.packagePrices || {};
      const finalPrice = packagePrices[selectedPackage] || service.priceMin || 0;
      const packageName = selectedPackage.charAt(0).toUpperCase() + selectedPackage.slice(1);

      const response = await fetch(buildApiUrl('/api/create-booking'), {
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
          notes: customerNotes,
          paymentMethod: selectedPaymentMethod || "cash",
          paymentDetails: paymentDetails || undefined,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      console.log('Booking saved successfully:', result.bookingId);
      
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
        <div className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-check text-4xl"></i>
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Booking Confirmed!</h1>
          <p className="text-lg opacity-90">Thank you for your booking</p>
        </div>

        <div className="max-w-2xl mx-auto px-4 -mt-4 relative z-10">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8 bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
              <div className="text-sm opacity-90 mb-2">Booking Number</div>
              <div className="text-3xl font-extrabold tracking-wide">{bookingNumber}</div>
            </div>
            
            <div className="p-8">
              <h3 className="text-xl font-bold text-on-surface mb-6">What&apos;s Next?</h3>
              <ul className="space-y-4">
                <li className="flex gap-4 pb-4 border-b border-outline-variant">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-envelope text-blue-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-on-surface mb-1">Confirmation Sent</div>
                    <div className="text-sm text-on-surface-variant">Check your WhatsApp for booking details</div>
                  </div>
                </li>
                <li className="flex gap-4 pb-4 border-b border-outline-variant">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-calendar-check text-purple-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-on-surface mb-1">Preparing Your Appointment</div>
                    <div className="text-sm text-on-surface-variant">We&apos;re getting everything ready for you</div>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-phone text-green-600"></i>
                  </div>
                  <div>
                    <div className="font-semibold text-on-surface mb-1">Reminder Coming</div>
                    <div className="text-sm text-on-surface-variant">You&apos;ll receive updates via WhatsApp</div>
                  </div>
                </li>
              </ul>
            </div>
            
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
          <p className="text-on-surface-variant">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
        <div className="text-center p-6">
          <i className="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-bold text-on-surface mb-2">Service Not Found</h2>
          <p className="text-on-surface-variant mb-4">The service you&apos;re looking for doesn&apos;t exist.</p>
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

  const packagePrices = service.packagePrices || {};
  const packageNames = Object.keys(packagePrices);

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
        <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant animate-slideUp">
          <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-concierge-bell text-[#8b5cf6]"></i>
            Select Package
          </h2>
          
          {service.description && (
            <p className="text-sm text-on-surface-variant mb-4">{service.description}</p>
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
                      : "border-outline-variant hover:border-[#8b5cf6]"
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {selectedPackage === pkg && (
                    <div className="absolute top-2 right-2 bg-[#8b5cf6] text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase">
                      Selected
                    </div>
                  )}
                  
                  <div className="font-bold text-base md:text-lg mb-2">{displayName}</div>
                  <ul className="text-xs md:text-sm text-on-surface-variant mb-3 space-y-1">
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
          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant">
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
          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant">
            <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
              <i className="fas fa-sliders-h text-[#8b5cf6]"></i>
              Service Details
            </h2>
            <div className="space-y-3">
              {Object.entries(service.specifications).map(([key, values]) => (
                <div key={key} className="border-b border-outline-variant pb-3 last:border-0">
                  <div className="text-xs md:text-sm font-semibold text-on-surface-variant mb-2 capitalize">
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
        <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant">
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
                      : "border-outline-variant hover:border-[#8b5cf6] bg-white"
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
          <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant">
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
                      : "border-outline-variant hover:border-[#8b5cf6] bg-white"
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
        <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant">
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
                    : "border-outline-variant hover:border-[#8b5cf6]"
                }`}
                onClick={() => setSelectedLocation(loc.key)}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                  selectedLocation === loc.key ? "bg-[#8b5cf6] text-white" : "bg-white text-on-surface-variant"
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
        <form onSubmit={handleSubmit} className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant">
          <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-user text-[#8b5cf6]"></i>
            Your Information
          </h2>
          
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="block text-xs md:text-sm font-semibold text-on-surface-variant mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-outline-variant focus:border-[#8b5cf6] focus:outline-none text-sm md:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm font-semibold text-on-surface-variant mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g., +254 712 345 678"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-outline-variant focus:border-[#8b5cf6] focus:outline-none text-sm md:text-base"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs md:text-sm font-semibold text-on-surface-variant mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Any special requests or requirements..."
                rows={3}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-xl border-2 border-outline-variant focus:border-[#8b5cf6] focus:outline-none resize-none text-sm md:text-base"
              />
            </div>
          </div>
        </form>

        {/* Payment Methods */}
        <div className="bg-white rounded-[16px] md:rounded-[20px] p-4 md:p-5 shadow-md border border-outline-variant">
          <h2 className="text-base md:text-lg font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-credit-card text-[#8b5cf6]"></i>
            Payment Method
          </h2>
          
          {loadingPaymentMethods ? (
            <div className="text-center py-6">
              <i className="fas fa-circle-notch fa-spin text-2xl text-[#8b5cf6] mb-2"></i>
              <p className="text-sm text-on-surface-variant">Loading payment methods...</p>
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-6">
              <i className="fas fa-info-circle text-2xl text-yellow-500 mb-2"></i>
              <p className="text-sm text-on-surface-variant">No payment methods configured</p>
              <p className="text-xs text-outline mt-1">Cash payment will be used</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((option) => (
                <div
                  key={option.id}
                  onClick={() => setSelectedPaymentMethod(option.id)}
                  className={`flex items-center gap-3 p-3 md:p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedPaymentMethod === option.id
                      ? "border-[#8b5cf6] bg-[#ede9fe]"
                      : "border-outline-variant hover:border-[#8b5cf6]"
                  }`}
                >
                  {/* Radio Button */}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedPaymentMethod === option.id ? "border-[#8b5cf6] bg-[#8b5cf6]" : "border-outline-variant bg-white"
                  }`}>
                    {selectedPaymentMethod === option.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Icon */}
                  <div 
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: option.color }}
                  >
                    <i className={`fas ${option.icon} text-white text-lg`}></i>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm md:text-base text-on-surface">{option.name}</div>
                    <div className="text-xs md:text-sm text-on-surface-variant whitespace-pre-wrap">{option.details}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Payment Details Input for non-cash methods */}
          {selectedPaymentMethod && selectedPaymentMethod !== "cash" && paymentMethods.length > 0 && (
            <div className="mt-4 p-3 md:p-4 bg-surface-container-lowest rounded-xl border-2 border-outline-variant">
              <div className="text-sm font-semibold text-on-surface mb-2">
                Enter Payment Details
              </div>
              <input
                type="text"
                placeholder={
                  selectedPaymentMethod.includes("mpesa") 
                    ? "Enter M-Pesa transaction ID" 
                    : selectedPaymentMethod === "bank" 
                    ? "Enter transaction/reference number" 
                    : "Enter payment reference"
                }
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-2 border-outline-variant focus:border-[#8b5cf6] focus:outline-none text-sm"
              />
              <p className="text-xs text-on-surface-variant mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                Please provide your payment confirmation details
              </p>
            </div>
          )}
        </div>

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
        <div className="text-center mt-6 md:mt-8 text-xs md:text-sm text-on-surface-variant">
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
        
        @media (max-width: 768px) {
          .min-h-screen.bg-gradient-to-b {
            background: var(--md-sys-color-background, #f8fafc) !important;
          }
          .bg-white.rounded-\\[16px\\] {
            border-radius: 16px !important;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
            background: var(--md-sys-color-surface, white) !important;
            border: none !important;
          }
          input[type="text"],
          input[type="tel"],
          textarea {
            padding: 16px !important;
            border-radius: 4px !important;
            font-size: 16px !important;
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
            padding: 15px !important;
          }
          button.bg-gradient-to-r.from-\\[\\#8b5cf6\\] {
            background: var(--md-sys-color-primary, #8b5cf6) !important;
            color: var(--md-sys-color-on-primary, white) !important;
            border-radius: 20px !important;
            text-transform: uppercase !important;
            letter-spacing: 0.5px !important;
            font-weight: 500 !important;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          button.bg-gradient-to-r.from-\\[\\#8b5cf6\\]:active:not(:disabled) {
            transform: scale(0.98) !important;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
          }
          .rounded-xl.border-2 {
            border-radius: 12px !important;
          }
          .font-bold.text-base,
          .font-bold.text-lg {
            font-weight: 500 !important;
            color: var(--md-sys-color-on-surface, #1e293b) !important;
          }
          label.text-xs,
          label.text-sm {
            color: var(--md-sys-color-on-surface-variant, #64748b) !important;
            font-weight: 500 !important;
          }
          .bg-gradient-to-br.from-\\[\\#8b5cf6\\] {
            background: linear-gradient(135deg, var(--md-sys-color-primary, #8b5cf6) 0%, var(--md-sys-color-primary-container, #7c3aed) 100%) !important;
            border-radius: 0 0 24px 24px !important;
          }
          .space-y-4 > * + *,
          .space-y-3 > * + * {
            margin-top: 16px !important;
          }
          .w-12.h-12.md\\:w-16.md\\:h-16 {
            border-radius: 16px !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          .text-xs.md\\:text-sm.opacity-90 {
            color: var(--md-sys-color-on-primary, rgba(255,255,255,0.9)) !important;
          }
        }
      `}</style>
    </div>
  );
}
