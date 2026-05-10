interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'green' | 'purple' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export default function Button({ 
  children, 
  variant = 'green',
  size = 'default',
  className = '',
  ...props 
}: ButtonProps) {
  const variants = {
    green: 'bg-[var(--green)] text-[#0A2010] hover:bg-[#2de870]',
    purple: 'bg-[var(--purple)] text-white hover:bg-[#9d72f7]',
    outline: 'bg-transparent border border-[rgba(255,255,255,0.12)] hover:bg-[var(--elevated)]',
    ghost: 'bg-[var(--elevated)] hover:bg-[#232840]'
  };
  
  const sizes = {
    sm: 'px-5 py-[10px] text-[0.85rem]',
    default: 'px-7 py-[14px] text-[0.95rem]',
    lg: 'px-9 py-[17px] text-[1.05rem]'
  };
  
  return (
    <button 
      className={`inline-flex items-center gap-2 rounded-full font-semibold transition-all duration-200 hover:-translate-y-0.5 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
