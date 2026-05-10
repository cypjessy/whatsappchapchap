interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  padding?: 'default' | 'sm' | 'none';
  background?: 'transparent' | 'deep' | 'surface';
}

export default function Section({ 
  children, 
  className = '', 
  id,
  padding = 'default', 
  background = 'transparent' 
}: SectionProps) {
  const paddingClass = {
    default: 'py-[clamp(80px,10vw,140px)]',
    sm: 'py-[clamp(50px,7vw,90px)]',
    none: 'py-0'
  }[padding];
  
  const bgClass = {
    transparent: 'bg-transparent',
    deep: 'bg-[var(--deep)]',
    surface: 'bg-[var(--surface)]'
  }[background];
  
  return <section id={id} className={`${paddingClass} ${bgClass} ${className}`}>{children}</section>;
}
