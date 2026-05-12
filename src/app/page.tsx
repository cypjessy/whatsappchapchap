"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  // Immediately redirect for all users - no flash
  useEffect(() => {
    // Check if running in Capacitor (mobile app)
    const isCapacitor = typeof window !== 'undefined' && 
      ((window as any).Capacitor?.isNativePlatform?.() || 
       (window as any).Capacitor?.getPlatform?.() === 'android');
    
    if (isCapacitor) {
      // Redirect to login page for mobile app - use replace to prevent back button
      router.replace('/login');
    } else {
      // For web users, also redirect to login (or keep landing page if you prefer)
      // Uncomment the next line if you want web users to see landing page
      // return; 
      
      // Currently redirecting everyone to login
      router.replace('/login');
    }
  }, [router]);

  // Show minimal loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    </div>
  );
}
