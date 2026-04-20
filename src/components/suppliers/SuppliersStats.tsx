"use client";

import { SupplierStatsProps } from "./types";

export function SuppliersStats({ total, active, pending, rating }: SupplierStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-green-100 flex items-center justify-center text-lg md:text-xl text-[#25D366] mb-2">
          <i className="fas fa-users"></i>
        </div>
        <div className="text-xl md:text-2xl font-extrabold text-[#1e293b]">{total}</div>
        <div className="text-xs text-[#64748b] font-semibold">Total</div>
      </div>
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-100 flex items-center justify-center text-lg md:text-xl text-[#3b82f6] mb-2">
          <i className="fas fa-check-circle"></i>
        </div>
        <div className="text-xl md:text-2xl font-extrabold text-[#1e293b]">{active}</div>
        <div className="text-xs text-[#64748b] font-semibold">Active</div>
      </div>
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-yellow-100 flex items-center justify-center text-lg md:text-xl text-[#f59e0b] mb-2">
          <i className="fas fa-clock"></i>
        </div>
        <div className="text-xl md:text-2xl font-extrabold text-[#1e293b]">{pending}</div>
        <div className="text-xs text-[#64748b] font-semibold">Pending</div>
      </div>
      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 border border-[#e2e8f0] shadow-sm flex flex-col items-center text-center">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-100 flex items-center justify-center text-lg md:text-xl text-[#8b5cf6] mb-2">
          <i className="fas fa-star"></i>
        </div>
        <div className="text-xl md:text-2xl font-extrabold text-[#1e293b]">{rating}</div>
        <div className="text-xs text-[#64748b] font-semibold">Rating</div>
      </div>
    </div>
  );
}
