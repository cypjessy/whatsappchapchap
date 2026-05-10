"use client";

interface PricingToggleProps {
  isYearly: boolean;
  onToggle: () => void;
  monthlyLabel?: string;
  yearlyLabel?: string;
  discountBadge?: string;
}

export default function PricingToggle({
  isYearly,
  onToggle,
  monthlyLabel = "Monthly",
  yearlyLabel = "Yearly",
  discountBadge = "Save 20%",
}: PricingToggleProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className={`text-sm font-medium ${!isYearly ? "text-[var(--white)]" : "text-[var(--muted)]"}`}>
        {monthlyLabel}
      </span>
      
      <button
        onClick={onToggle}
        className={`relative w-14 h-8 rounded-full transition-colors ${
          isYearly ? "bg-[var(--green)]" : "bg-[var(--elevated)]"
        }`}
      >
        <div
          className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-md ${
            isYearly ? "translate-x-7" : "translate-x-1"
          }`}
        />
      </button>
      
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${isYearly ? "text-[var(--white)]" : "text-[var(--muted)]"}`}>
          {yearlyLabel}
        </span>
        {isYearly && (
          <span className="px-2 py-1 bg-[var(--green-glow)] text-[var(--green)] text-xs font-semibold rounded-full">
            {discountBadge}
          </span>
        )}
      </div>
    </div>
  );
}
