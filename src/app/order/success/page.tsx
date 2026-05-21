"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CURRENCY_SYMBOL } from "@/lib/currency";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const orderNumber = searchParams.get("order") || "";
  const orderId = searchParams.get("id") || "";
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleBackToHome = () => {
    router.push("/");
  };

  const handleViewOrder = () => {
    // You can implement order tracking here
    router.push(`/track?order=${orderNumber}`);
  };

  return (
    <div className={`
      min-h-screen bg-[#f8fafc] flex items-center justify-center px-4
      transition-all duration-500
      ${isVisible ? "opacity-100" : "opacity-0"}
    `}>
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#e2e8f0] text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center mx-auto mb-6 animate-bounce">
            <i className="fas fa-check text-white text-3xl"></i>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1e293b] mb-2">
            Order Placed!
          </h1>
          
          <p className="text-[#64748b] mb-6">
            Your order has been successfully placed
          </p>

          {/* Order Number */}
          <div className="bg-[#f8fafc] rounded-xl p-4 mb-6 border border-[#e2e8f0]">
            <p className="text-xs text-[#64748b] font-medium uppercase tracking-wider mb-1">
              Order Number
            </p>
            <p className="text-xl font-bold text-[#8b5cf6] font-mono">
              {orderNumber}
            </p>
          </div>

          {/* Info Message */}
          <div className="bg-[#eff6ff] rounded-xl p-4 mb-6 border border-[#bfdbfe]">
            <div className="flex items-start gap-3 text-left">
              <i className="fas fa-info-circle text-[#3b82f6] mt-0.5"></i>
              <div>
                <p className="text-sm font-semibold text-[#1e40af] mb-1">
                  What's Next?
                </p>
                <p className="text-xs text-[#1e40af]/80">
                  The seller will review your order and contact you via WhatsApp to confirm payment and delivery details.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleViewOrder}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-lg shadow-[#8b5cf6]/20 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98]"
            >
              <i className="fas fa-search"></i>
              Track Order
            </button>
            
            <button
              onClick={handleBackToHome}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all active:scale-[0.98]"
            >
              <i className="fas fa-home"></i>
              Back to Home
            </button>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[#94a3b8]">
          <div className="flex items-center gap-1.5 text-xs">
            <i className="fas fa-shield-alt"></i>
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <i className="fas fa-check-circle"></i>
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <i className="fas fa-headset"></i>
            <span>Support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
