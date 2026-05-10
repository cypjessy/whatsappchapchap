interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  gradient: string;
  highlighted?: boolean;
  metric?: string;
  metricLabel?: string;
}

interface TestimonialsProps {
  testimonials?: Testimonial[];
}

export default function Testimonials({ testimonials = [] }: TestimonialsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
      {testimonials.map((t, i) => (
        <div key={i} className={`relative bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-xl)] p-7 transition-all hover:-translate-y-1 hover:border-[var(--border-light)] ${t.highlighted ? 'border-[rgba(139,92,246,0.3)] bg-gradient-to-br from-[var(--surface)] to-[rgba(139,92,246,0.03)]' : ''}`}>
          <div className="text-5xl leading-none text-[var(--green)] opacity-30 font-serif absolute top-5 right-6">"</div>
          <div className="flex gap-1 mb-4 text-[var(--gold-light)] text-[0.85rem]">★★★★★</div>
          <div className="font-display text-[1.05rem] font-light italic leading-relaxed mb-5">
            {t.quote}
          </div>
          <div className="h-px bg-[var(--border)] mb-4" />
          <div className="flex items-center gap-3">
            <div className={`w-[42px] h-[42px] rounded-full flex items-center justify-center text-[1rem] font-bold text-white flex-shrink-0 bg-gradient-to-r ${t.gradient}`}>
              {t.initials}
            </div>
            <div>
              <div className="font-bold text-[0.9rem]">{t.name}</div>
              <div className="text-[0.77rem] text-[var(--muted)]">{t.role}</div>
            </div>
          </div>
          {t.metric && (
            <div className="mt-4 p-2 bg-[var(--elevated)] rounded text-[0.8rem] flex items-center gap-1.5">
              <span className="text-[var(--green)] font-bold">{t.metric}</span> {t.metricLabel}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
