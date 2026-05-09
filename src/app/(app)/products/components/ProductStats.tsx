"use client";

import { formatCurrency } from "@/lib/currency";

interface ProductStatsProps {
  totalProducts: number;
  inventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export default function ProductStats({ 
  totalProducts, 
  inventoryValue, 
  lowStockCount, 
  outOfStockCount 
}: ProductStatsProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 mb-6 hide-scrollbar animate-fadeIn">
      <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-full bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center">
          <i className="fas fa-box text-sm"></i>
        </div>
        <div>
          <div className="font-extrabold text-lg">{totalProducts}</div>
          <div className="text-xs text-[#64748b]">Total Products</div>
        </div>
      </div>
      
      <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-full bg-[rgba(59,130,246,0.1)] text-[#3b82f6] flex items-center justify-center">
          <i className="fas fa-dollar-sign text-sm"></i>
        </div>
        <div>
          <div className="font-extrabold text-lg">{formatCurrency(inventoryValue)}</div>
          <div className="text-xs text-[#64748b]">Inventory Value</div>
        </div>
      </div>
      
      <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-full bg-[rgba(245,158,11,0.1)] text-[#f59e0b] flex items-center justify-center">
          <i className="fas fa-exclamation-triangle text-sm"></i>
        </div>
        <div>
          <div className="font-extrabold text-lg">{lowStockCount}</div>
          <div className="text-xs text-[#64748b]">Low Stock</div>
        </div>
      </div>
      
      <div className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 min-w-[140px]">
        <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.1)] text-[#ef4444] flex items-center justify-center">
          <i className="fas fa-times-circle text-sm"></i>
        </div>
        <div>
          <div className="font-extrabold text-lg">{outOfStockCount}</div>
          <div className="text-xs text-[#64748b]">Out of Stock</div>
        </div>
      </div>
    </div>
  );
}
