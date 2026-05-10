import Label from '../common/Label';

interface SectionHeaderProps {
  label?: string;
  labelVariant?: 'green' | 'purple' | 'gold' | 'red';
  labelBg?: string;
  title: React.ReactNode;
  subtitle?: string;
  centered?: boolean;
}

export default function SectionHeader({ 
  label, 
  labelVariant, 
  labelBg, 
  title, 
  subtitle, 
  centered = false 
}: SectionHeaderProps) {
  return (
    <div className={centered ? 'text-center' : ''}>
      {label && (
        <Label variant={labelVariant} customBg={labelBg} className="mb-4 inline-block">
          {label}
        </Label>
      )}
      <h2 className="font-display text-[clamp(2.4rem,5vw,5rem)] font-bold leading-[1.0] tracking-[-0.02em]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[clamp(0.95rem,1.8vw,1.15rem)] text-[var(--muted)] max-w-[560px] mx-auto mt-4 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
