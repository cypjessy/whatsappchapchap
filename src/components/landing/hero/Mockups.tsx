export function MockupDashboard() {
  return (
    <div className="w-[420px] h-[320px] bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
      <div className="h-10 bg-[var(--elevated)] border-b border-[var(--border)] flex items-center px-4 gap-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>
      <div className="p-6">
        <div className="h-4 w-32 bg-[var(--green)] rounded mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 w-full bg-[var(--elevated)] rounded"></div>
          <div className="h-3 w-3/4 bg-[var(--elevated)] rounded"></div>
          <div className="h-3 w-5/6 bg-[var(--elevated)] rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function MockupChat() {
  return (
    <div className="w-[320px] h-[480px] bg-[var(--deep)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden">
      <div className="h-14 bg-[var(--green)] flex items-center px-4">
        <div className="w-10 h-10 rounded-full bg-white/20"></div>
        <div className="ml-3">
          <div className="text-white font-semibold text-sm">Store Bot</div>
          <div className="text-white/70 text-xs">Online</div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="bg-[var(--elevated)] p-3 rounded-lg rounded-tl-none max-w-[85%]">
          <div className="text-sm text-[var(--text)]">Welcome! How can I help you today?</div>
        </div>
        <div className="bg-[var(--green)] p-3 rounded-lg rounded-tr-none max-w-[85%] ml-auto">
          <div className="text-sm text-[#0A2010]">Show me your products</div>
        </div>
      </div>
    </div>
  );
}
