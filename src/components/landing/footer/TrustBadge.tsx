interface TrustBadgeProps {
  icon: string;
  text: string;
}

export default function TrustBadge({ icon, text }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--elevated)] border border-[var(--border)] rounded-full text-[0.72rem] text-[var(--muted)]">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
