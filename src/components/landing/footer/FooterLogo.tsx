export default function FooterLogo() {
  return (
    <a href="/" className="flex items-center gap-2">
      <div className="w-10 h-10 bg-[var(--green)] rounded-xl flex items-center justify-center text-white font-bold text-xl">
        W
      </div>
      <div>
        <div className="text-white font-semibold text-lg">WhatsApp Chap Chap</div>
        <div className="text-[var(--muted)] text-xs">AI Commerce OS</div>
      </div>
    </a>
  );
}
