import Button from '../common/Button';

interface Feature {
  text: string;
  included?: boolean;
}

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  description?: string;
  features?: Feature[];
  isFeatured?: boolean;
  popular?: boolean;
  buttonText?: string;
  buttonVariant?: 'green' | 'purple' | 'outline' | 'ghost';
}

export default function PricingCard({ 
  title, 
  price, 
  period = '/mo', 
  description, 
  features = [], 
  isFeatured = false,
  popular = false,
  buttonText = 'Get Started',
  buttonVariant = 'outline'
}: PricingCardProps) {
  return (
    <div className={`relative bg-[var(--surface)] border rounded-[var(--r-xl)] p-8 transition-all hover:-translate-y-1 ${isFeatured ? 'border-[rgba(37,211,102,0.35)] bg-gradient-to-b from-[var(--surface)] to-[rgba(37,211,102,0.04)]' : 'border-[var(--border)]'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--green)] text-[#0A2010] px-4 py-1 rounded-full text-[0.72rem] font-bold whitespace-nowrap">
          Most Popular
        </div>
      )}
      
      <div className={`text-[0.8rem] font-bold text-[var(--muted)] tracking-[0.1em] uppercase mb-3 ${isFeatured ? 'text-[var(--green)]' : ''}`}>
        {title}
      </div>
      
      <div className="flex items-end gap-1 mb-2">
        <span className={`font-display text-5xl font-black leading-none ${isFeatured ? 'text-[var(--green)]' : ''}`}>
          {price}
        </span>
        {period && <span className="text-[var(--muted)] text-[0.85rem] mb-1.5">{period}</span>}
      </div>
      
      <p className="text-[0.85rem] text-[var(--muted)] mb-6 min-h-[40px]">{description}</p>
      <div className="h-px bg-[var(--border)] mb-5" />
      
      <ul className="flex flex-col gap-2.5 mb-7">
        {features.map(feat => (
          <li key={feat.text} className="flex items-center gap-2.5 text-[0.85rem]">
            <span className={feat.included ? 'text-[var(--green)]' : 'text-[var(--faint)]'}>{feat.included ? '✓' : '✗'}</span>
            <span className={!feat.included ? 'text-[var(--faint)]' : ''}>{feat.text}</span>
          </li>
        ))}
      </ul>
      
      <Button variant={buttonVariant} className="w-full justify-center">
        {buttonText}
      </Button>
    </div>
  );
}
