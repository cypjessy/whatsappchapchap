"use client";

import Link from 'next/link';

export default function Offline() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
        <div className="w-24 h-24 bg-[#8b5cf6]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-wifi text-4xl text-[#8b5cf6]" />
        </div>
        
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#1e293b] mb-3">
          You're Offline
        </h1>
        
        <p className="text-[#64748b] mb-8 leading-relaxed">
          It looks like you've lost your internet connection. 
          Some features may not be available until you're back online.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-lg shadow-[#8b5cf6]/25 hover:shadow-xl hover:shadow-[#8b5cf6]/30 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
          >
            <i className="fas fa-redo-alt mr-2" />
            Try Again
          </button>
          
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-xl font-bold hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all duration-200"
          >
            <i className="fas fa-home mr-2" />
            Go to Dashboard
          </Link>
        </div>
        
        <div className="mt-8 pt-6 border-t border-[#e2e8f0]">
          <p className="text-xs text-[#94a3b8]">
            💡 Tip: Cached pages and data are still available offline
          </p>
        </div>
      </div>
    </div>
  );
}
