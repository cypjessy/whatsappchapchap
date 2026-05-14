"use client";

import { useEffect, useState } from "react";

interface AnimatedSplashProps {
  onComplete: () => void;
}

export function AnimatedSplash({ onComplete }: AnimatedSplashProps) {
  const [phase, setPhase] = useState<"icon" | "letters" | "fade" | "done">("icon");

  useEffect(() => {
    // Phase 1: Show icon for 800ms
    const iconTimer = setTimeout(() => {
      setPhase("letters");
    }, 800);

    // Phase 2: Show letters bouncing for 2000ms
    const lettersTimer = setTimeout(() => {
      setPhase("fade");
    }, 2800);

    // Phase 3: Fade out for 500ms, then complete
    const fadeTimer = setTimeout(() => {
      setPhase("done");
      onComplete();
    }, 3300);

    return () => {
      clearTimeout(iconTimer);
      clearTimeout(lettersTimer);
      clearTimeout(fadeTimer);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  const appName = "WhatsApp Chap Chap";

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex flex-col items-center justify-center
        bg-gradient-to-br from-[#25D366] to-[#128C7E]
        transition-opacity duration-500
        ${phase === "fade" ? "opacity-0" : "opacity-100"}
      `}
      style={{ pointerEvents: phase === "fade" ? "none" : "auto" }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* App Icon */}
        <div
          className={`
            transition-all duration-700 ease-out
            ${phase === "icon" ? "scale-100 opacity-100" : ""}
            ${phase === "letters" || phase === "fade" ? "scale-90 opacity-90" : ""}
          `}
        >
          <div className="w-24 h-24 md:w-28 md:h-28 bg-white rounded-3xl shadow-2xl flex items-center justify-center">
            <svg className="w-14 h-14 md:w-16 md:h-16 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </div>
        </div>

        {/* App Name - Letter by Letter Bounce Animation */}
        {(phase === "letters" || phase === "fade") && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1">
            {appName.split("").map((char, index) => (
              <span
                key={index}
                className={`
                  text-white font-extrabold text-2xl md:text-3xl tracking-tight
                  inline-block
                  animate-bounceLetter
                `}
                style={{
                  animationDelay: `${index * 60}ms`,
                  animationDuration: "600ms",
                  animationFillMode: "both",
                  animationIterationCount: 1,
                  color: char === " " ? "transparent" : "white",
                  minWidth: char === " " ? "0.3em" : "auto",
                }}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
        )}

        {/* Subtitle */}
        {phase === "letters" && (
          <p
            className="mt-4 text-white/70 text-sm font-medium animate-fadeIn"
            style={{ animationDelay: "800ms" }}
          >
            Automate your WhatsApp sales
          </p>
        )}
      </div>

      {/* Loading indicator at bottom */}
      {phase === "icon" && (
        <div className="absolute bottom-16">
          <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      <style jsx>{`
        @keyframes bounceLetter {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.5);
          }
          50% {
            opacity: 1;
            transform: translateY(-10px) scale(1.1);
          }
          70% {
            transform: translateY(5px) scale(0.95);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-bounceLetter {
          animation: bounceLetter 600ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-fadeIn {
          animation: fadeIn 400ms ease-out forwards;
        }
      `}</style>
    </div>
  );
}
