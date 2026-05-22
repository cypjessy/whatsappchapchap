export default function SuccessStep() {
  return (
    <div className="animate-[fadeIn_0.4s_ease] flex flex-col items-center justify-center text-center px-4 py-12">
      {/* M3 Success Icon */}
      <div className="w-24 h-24 rounded-full bg-[#DCF8C6] flex items-center justify-center mb-6 shadow-sm">
        <svg className="w-12 h-12 text-[#25D366]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-[1.75rem] font-normal text-[#1C1B1F] mb-3">
        Welcome to Chap Chap!
      </h1>
      <p className="text-base text-[#49454F] mb-10 leading-relaxed max-w-sm">
        Your account has been created successfully. You&apos;re ready to start selling on WhatsApp.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none">
        {/* M3 Outlined button */}
        <a
          href="/"
          className="flex items-center justify-center gap-2 h-12 px-6 rounded-2xl border-2 border-[#79747E] text-sm font-medium text-[#1C1B1F] hover:bg-[#F5F5F5] active:scale-[0.98] transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          View Guide
        </a>
        {/* M3 Filled button */}
        <a
          href="/dashboard"
          className="flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-[#25D366] text-sm font-medium text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
        >
          Go to Dashboard
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </a>
      </div>
    </div>
  );
}
