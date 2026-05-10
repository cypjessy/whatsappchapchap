interface HamburgerMenuProps {
  className?: string;
}

export default function HamburgerMenu({ className = '' }: HamburgerMenuProps) {
  return (
    <button 
      className={`md:hidden p-2 text-white hover:bg-[var(--elevated)] rounded-lg transition-colors ${className}`}
      aria-label="Toggle menu"
    >
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>
  );
}
