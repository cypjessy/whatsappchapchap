export default function TrustBadges() {
  return (
    <div className="flex flex-wrap items-center gap-6 text-[var(--muted)] text-sm">
      <div className="flex items-center gap-2">
        <span className="text-[var(--green)]">✓</span>
        <span>No credit card required</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[var(--green)]">✓</span>
        <span>Free forever plan</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[var(--green)]">✓</span>
        <span>Setup in 5 minutes</span>
      </div>
    </div>
  );
}
