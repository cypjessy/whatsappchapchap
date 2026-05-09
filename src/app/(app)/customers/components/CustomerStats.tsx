"use client";

import { Customer } from "@/lib/db";

interface CustomerStatsProps {
  customers: Customer[];
  formatCurrency: (amount: number) => string;
}

export default function CustomerStats({ customers, formatCurrency }: CustomerStatsProps) {
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
      <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
            <i className="fas fa-users text-[#25D366] text-lg md:text-xl"></i>
          </div>
          <span className="text-xs text-[#64748b] font-semibold">Total</span>
        </div>
        <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{totalCustomers}</div>
        <div className="text-xs text-[#64748b] mt-1">All Customers</div>
      </div>
      <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#dcfce7] rounded-xl flex items-center justify-center">
            <i className="fas fa-check-circle text-[#10b981] text-lg md:text-xl"></i>
          </div>
          <span className="text-xs text-[#64748b] font-semibold">Active</span>
        </div>
        <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{activeCustomers}</div>
        <div className="text-xs text-[#64748b] mt-1">Active Status</div>
      </div>
      <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#fef3c7] rounded-xl flex items-center justify-center">
            <i className="fas fa-crown text-[#f59e0b] text-lg md:text-xl"></i>
          </div>
          <span className="text-xs text-[#64748b] font-semibold">VIP</span>
        </div>
        <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{vipCustomers}</div>
        <div className="text-xs text-[#64748b] mt-1">VIP Customers</div>
      </div>
      <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#dbeafe] rounded-xl flex items-center justify-center">
            <i className="fas fa-coins text-[#3b82f6] text-lg md:text-xl"></i>
          </div>
          <span className="text-xs text-[#64748b] font-semibold">Revenue</span>
        </div>
        <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{formatCurrency(totalRevenue)}</div>
        <div className="text-xs text-[#64748b] mt-1">Total Revenue</div>
      </div>
    </div>
  );
}
