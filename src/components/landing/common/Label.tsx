interface LabelProps {
  children: React.ReactNode;
  variant?: 'green' | 'purple' | 'gold' | 'red';
  customBg?: string;
  className?: string;
}

export default function Label({ children, variant = 'green', customBg, className = '' }: LabelProps) {
  const variants = {
    green: 'bg-[var(--green-glow)] text-[var(--green)] border-[rgba(37,211,102,0.25)]',
    purple: 'bg-[var(--purple-glow)] text-[var(--purple)] border-[rgba(139,92,246,0.25)]',
    gold: 'bg-[var(--gold-glow)] text-[var(--gold-light)] border-[rgba(201,168,76,0.2)]',
    red: 'bg-[rgba(239,68,68,0.08)] text-[#f87171] border-[rgba(239,68,68,0.2)]'
  };
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.72rem] font-semibold tracking-[0.15em] uppercase border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
