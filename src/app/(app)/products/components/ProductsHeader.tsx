"use client";

import {
  Box,
  Layers,
  Download,
  Upload,
  CheckSquare,
  Plus,
} from "lucide-react";

interface ProductsHeaderProps {
  productsCount: number;
  totalInventoryValue: number;
  bulkMode: boolean;
  setBulkMode: (mode: boolean) => void;
  setAddProductModalOpen: (open: boolean) => void;
  exportProducts: () => void;
  importProducts: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ProductsHeader({
  productsCount,
  totalInventoryValue,
  bulkMode,
  setBulkMode,
  setAddProductModalOpen,
  exportProducts,
  importProducts,
}: ProductsHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-[#e2e8f0]">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center shadow-lg shadow-[#25D366]/20">
              <Box className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-[#1e293b] tracking-tight">
                Products
              </h1>
              <p className="text-xs text-[#94a3b8] hidden md:block">
                {productsCount} items · KES {totalInventoryValue.toLocaleString()} value
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto hide-scrollbar pb-1 md:pb-0">
            {/* Export */}
            <button
              onClick={exportProducts}
              className="flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] transition-all active:scale-95 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* Import */}
            <label className="flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm text-[#64748b] hover:border-[#25D366] hover:text-[#128C7E] transition-all active:scale-95 shrink-0 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".csv"
                onChange={importProducts}
                className="hidden"
              />
            </label>

            {/* Bulk toggle */}
            <button
              onClick={() => {
                setBulkMode(!bulkMode);
              }}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 shrink-0
                ${bulkMode
                  ? "bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25"
                  : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"
                }
              `}
            >
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{bulkMode ? "Done" : "Bulk"}</span>
            </button>

            {/* Add product */}
            <button
              onClick={() => setAddProductModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 transition-all active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
