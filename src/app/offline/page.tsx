"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Redirect back when connection returns
    const handleOnline = () => {
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 1200);
    };
    window.addEventListener("online", handleOnline);

    // If somehow we land here but have connection, go back
    if (navigator.onLine) {
      router.replace("/");
    }

    return () => window.removeEventListener("online", handleOnline);
  }, [router]);

  const retryConnection = () => {
    setChecking(true);
    setShowSuccess(false);

    fetch("/")
      .then(() => {
        setChecking(false);
        setShowSuccess(true);
        setTimeout(() => router.push("/"), 1200);
      })
      .catch(() => {
        // Still offline, try with navigator.onLine
        let attempts = 0;
        const maxAttempts = 5;
        const check = () => {
          attempts++;
          if (navigator.onLine) {
            setChecking(false);
            setShowSuccess(true);
            setTimeout(() => router.push("/"), 1200);
            return;
          }
          if (attempts < maxAttempts) {
            setTimeout(check, 800);
          } else {
            setChecking(false);
          }
        };
        setTimeout(check, 500);
      });
  };

  return (
    <div className="fixed inset-0 bg-[#0A0B0F] flex flex-col items-center justify-center p-6 z-[9999]" style={{ paddingTop: "env(safe-area-inset-top, 20px)", paddingBottom: "env(safe-area-inset-bottom, 20px)" }}>
      {/* Animated Mesh Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% -20%, rgba(37, 211, 102, 0.12) 0%, transparent 70%),
              radial-gradient(ellipse 60% 50% at 80% 90%, rgba(37, 211, 102, 0.06) 0%, transparent 60%),
              radial-gradient(ellipse 50% 40% at 20% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 60%)
            `,
          }}
        />
        {/* Floating Orbs */}
        <div
          className="absolute rounded-full pointer-events-none opacity-40"
          style={{
            width: 200,
            height: 200,
            background: "#25D366",
            top: "10%",
            left: "-10%",
            filter: "blur(60px)",
            animation: "orbFloat1 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full pointer-events-none opacity-40"
          style={{
            width: 150,
            height: 150,
            background: "#8B5CF6",
            bottom: "15%",
            right: "-5%",
            filter: "blur(60px)",
            animation: "orbFloat2 15s ease-in-out infinite",
            animationDelay: "3s",
          }}
        />
      </div>

      {/* Scanner Animation */}
      <div
        className="relative mb-10"
        style={{
          width: 140,
          height: 140,
          animation: "scannerEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both",
        }}
      >
        {/* Pulse rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: "rgba(37, 211, 102, 0.15)",
              animation: `ringPulse 3s ease-out infinite`,
              animationDelay: `${i}s`,
            }}
          />
        ))}
        {/* Scanning arc */}
        <div
          className="absolute rounded-full"
          style={{
            inset: -6,
            border: "2px solid transparent",
            borderTopColor: "#25D366",
            animation: "scanRotate 2s linear infinite",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            inset: -2,
            border: "2px solid transparent",
            borderBottomColor: "rgba(37, 211, 102, 0.6)",
            animation: "scanRotateReverse 2.5s linear infinite",
            mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
            WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2px))",
          }}
        />
        {/* Inner circle */}
        <div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            inset: 18,
            background: "linear-gradient(135deg, rgba(37, 211, 102, 0.12) 0%, rgba(37, 211, 102, 0.04) 100%)",
            border: "1.5px solid rgba(37, 211, 102, 0.2)",
          }}
        >
          {/* WiFi icon */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 18.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
            <path d="M12 14a5 5 0 0 1 3.5 1.5" opacity="0.7" />
            <path d="M12 9.5a8.5 8.5 0 0 1 6 2.7" opacity="0.5" />
            <path d="M12 5a12 12 0 0 1 8.5 3.8" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <h1
        className="text-white text-[28px] font-extrabold text-center mb-3 tracking-tight"
        style={{ animation: "textEnter 0.6s 0.4s both" }}
      >
        You&apos;re Offline
      </h1>
      <p
        className="text-center text-[15px] leading-relaxed mb-2"
        style={{ color: "rgba(255,255,255,0.5)", animation: "textEnter 0.6s 0.5s both" }}
      >
        No internet connection found. We&apos;ll keep trying to reconnect.
      </p>
      <p
        className="text-center text-[13px] leading-relaxed mb-10"
        style={{ color: "rgba(255,255,255,0.2)", animation: "textEnter 0.6s 0.6s both" }}
      >
        Make sure Wi-Fi or mobile data is enabled
      </p>

      {/* Retry Button */}
      <button
        onClick={retryConnection}
        disabled={checking || showSuccess}
        className="relative overflow-hidden flex items-center justify-center gap-2.5 w-full max-w-[280px] min-h-[56px] px-12 py-4 rounded-[50px] text-white text-base font-bold border-none cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #25D366 0%, #1DAF59 100%)",
          boxShadow: "0 4px 20px rgba(37, 211, 102, 0.35)",
          animation: "btnEnter 0.6s 0.7s both",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          e.currentTarget.style.setProperty("--x", `${x}%`);
          e.currentTarget.style.setProperty("--y", `${y}%`);
        }}
      >
        {/* Shimmer */}
        <div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            animation: "shimmer 3s ease-in-out infinite",
          }}
        />
        <svg
          className={`w-5 h-5 ${checking ? "animate-spin" : ""}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        {checking ? "Checking..." : showSuccess ? "Connected!" : "Try Again"}
      </button>

      {/* Checking Indicator */}
      {checking && (
        <div
          className="flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            animation: "statusIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
          }}
        >
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#25D366]"
                style={{
                  animation: "dotBounce 1.2s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
            Checking connection...
          </span>
        </div>
      )}

      {/* Success Indicator */}
      {showSuccess && (
        <div
          className="flex flex-col items-center gap-3 mt-6"
          style={{ animation: "successIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(37, 211, 102, 0.15)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#25D366" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span style={{ fontSize: 14, color: "#25D366", fontWeight: 600 }}>
            Connected! Reloading...
          </span>
        </div>
      )}

      {/* Footer */}
      <p
        className="fixed text-center text-xs z-10"
        style={{
          bottom: "calc(24px + env(safe-area-inset-bottom, 20px))",
          left: 0,
          right: 0,
          color: "rgba(255,255,255,0.2)",
          animation: "footerEnter 0.6s 0.9s both",
        }}
      >
        WhatsApp <span style={{ color: "#25D366", fontWeight: 600 }}>Chap Chap</span>
      </p>

      {/* Keyframes injected once */}
      <style jsx>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30%, 20%) scale(1.2); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-20%, -25%) scale(1.3); }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.85); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes scanRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scanRotateReverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes scannerEnter {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes textEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes btnEnter {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        @keyframes statusIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes successIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes footerEnter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
