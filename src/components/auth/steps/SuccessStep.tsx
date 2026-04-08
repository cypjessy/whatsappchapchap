export default function SuccessStep() {
  return (
    <div className="animate-[fadeIn_0.4s_ease] text-center py-12">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] flex items-center justify-center mx-auto mb-8 text-white text-6xl shadow-2xl animate-[scaleIn_0.5s_ease]">
        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-3xl font-extrabold mb-4">Welcome to Chap Chap!</h3>
      <p className="text-[#64748b] mb-8 text-lg">
        Your account has been created successfully. You&apos;re ready to start selling on WhatsApp.
      </p>
      <div className="flex justify-center gap-4">
        <button className="py-3 px-6 bg-[#f8fafc] text-[#1a1a2e] border-2 border-[#e2e8f0] rounded-xl font-semibold hover:border-[#25D366] hover:text-[#25D366] transition-all flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          View Guide
        </button>
        <a
          href="/dashboard"
          className="py-3 px-6 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold transition-all hover:translate-y-[-2px] hover:shadow-lg flex items-center gap-2"
        >
          Go to Dashboard <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
        </a>
      </div>
    </div>
  );
}
