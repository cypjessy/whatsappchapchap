interface LogoProps {
  className?: string;
}

export default function Logo({ className = '' }: LogoProps) {
  return (
    <a href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 bg-[var(--green)] rounded-lg flex items-center justify-center text-white font-bold">
        W
      </div>
      <span className="text-white font-semibold text-lg hidden sm:inline-block">
        WhatsApp Chap Chap
      </span>
    </a>
  );
}
