"use client";

import { useState } from 'react';

interface VariantChipsProps {
  options: string[];
  variant?: 'primary' | 'purple';
  onChange?: (option: string) => void;
}

export default function VariantChips({ options, variant = 'primary', onChange }: VariantChipsProps) {
  const [selected, setSelected] = useState(options[0]);
  
  const handleSelect = (option: string) => {
    setSelected(option);
    onChange?.(option);
  };
  
  const getActiveClasses = () => {
    if (variant === 'purple') {
      return 'bg-[rgba(139,92,246,0.12)] border-[rgba(139,92,246,0.3)] text-[var(--purple)]';
    }
    // primary (green)
    return 'bg-[rgba(37,211,102,0.12)] border-[rgba(37,211,102,0.3)] text-[var(--green)]';
  };
  
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => handleSelect(opt)}
          className={`px-3 py-1 rounded-full text-[0.72rem] font-semibold border border-[var(--border)] bg-[var(--elevated)] transition-all ${selected === opt ? getActiveClasses() : ''}`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
