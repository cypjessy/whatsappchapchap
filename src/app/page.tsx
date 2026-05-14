"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useStatusBar } from "@/hooks/useStatusBar";
import { useAppLifecycle } from "@/hooks/useAppLifecycle";
import { Hero, Features, HowItWorks, CTA, Footer, Navbar } from "@/components/landing";

export default function LandingPage() {
  // Initialize Capacitor lifecycle management to prevent idle freeze
  useAppLifecycle();
  
  // Set status bar to match purple gradient background with white icons
  useStatusBar({ color: '#667eea', style: 'light' });

  const router = useRouter();
  const [isCapacitor, setIsCapacitor] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [typedText, setTypedText] = useState("");
  const [scrolled, setScrolled] = useState(false);

  // Check if running in Capacitor (mobile app)
  useEffect(() => {
    const checkPlatform = () => {
      const capacitor = (window as any).Capacitor;
      const isCap = capacitor?.isNativePlatform?.() || capacitor?.getPlatform?.() === 'android';
      setIsCapacitor(isCap);
      setIsChecking(false);

      if (isCap) {
        // Hide splash screen immediately on mobile app
        try {
          const { SplashScreen } = capacitor.Plugins;
          SplashScreen.hide();
        } catch (e) {
          // Fallback: auto-hide after 3 seconds if plugin fails
          setTimeout(() => {
            if ((window as any).Capacitor?.Plugins?.SplashScreen) {
              (window as any).Capacitor.Plugins.SplashScreen.hide();
            }
          }, 3000);
        }
        // Redirect to login page for mobile app
        window.location.href = '/login';
      }
    };

    // Check immediately and also after a short delay as backup
    checkPlatform();
    const backupCheck = setTimeout(checkPlatform, 500);
    return () => clearTimeout(backupCheck);
  }, [router]);

  // Typing animation for hero
  useEffect(() => {
    const phrases = [
      "Automate Your Sales with AI",
      "Manage Products & Orders",
      "Track Shipments in Real-Time",
      "Grow Your Business 24/7"
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const type = () => {
      const currentPhrase = phrases[phraseIndex];
      
      if (isDeleting) {
        setTypedText(currentPhrase.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setTypedText(currentPhrase.substring(0, charIndex + 1));
        charIndex++;
      }

      let typeSpeed = isDeleting ? 50 : 100;

      if (!isDeleting && charIndex === currentPhrase.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
      }

      timeout = setTimeout(type, typeSpeed);
    };

    type();
    return () => clearTimeout(timeout);
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation handler
  const handleNavigate = useCallback((path: string) => {
    router.push(path);
  }, [router]);

  // Scroll to section handler
  const handleScrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Generate particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    animationDelay: Math.random() * 15,
    animationDuration: 10 + Math.random() * 10,
    size: 4 + Math.random() * 8
  }));

  // Show loading state while checking platform
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If Capacitor, we're redirecting - show loading
  if (isCapacitor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-white text-lg font-medium">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Show landing page for web browsers
  return (
    <div className="landing-page-wrapper">
      <Navbar scrolled={scrolled} onNavigate={handleNavigate} onScroll={handleScrollTo} />
      <Hero typedText={typedText} particles={particles} onNavigate={handleNavigate} />
      <Features />
      <HowItWorks />
      <CTA onNavigate={handleNavigate} />
      <Footer />
    </div>
  );
}
