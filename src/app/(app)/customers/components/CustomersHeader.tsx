"use client";

import { useState } from "react";
import { Customer } from "@/lib/db";

interface CustomersHeaderProps {
  bulkMode: boolean;
  onToggleBulkMode: () => void;
  onExportCSV: () => void;
  onAddCustomer: () => void;
}

export default function CustomersHeader({
  bulkMode,
  onToggleBulkMode,
  onExportCSV,
  onAddCustomer,
}: CustomersHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
          <i className="fas fa-users text-[#25D366]"></i>Customers
        </h1>
        <p className="text-[#64748b] text-sm hidden md:block">Build relationships and grow your business</p>
      </div>
      
      <div className="flex gap-2 w-full md:w-auto">
        <button 
          className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" 
          onClick={onExportCSV}
        >
          <i className="fas fa-download mr-2"></i><span className="hidden md:inline">Export</span>
        </button>
        <button 
          className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl font-semibold text-sm shadow-lg transition-all ${bulkMode ? 'bg-[#ef4444] text-white' : 'bg-white border-2 border-[#e2e8f0] text-[#64748b]'}`}
          onClick={onToggleBulkMode}
        >
          <i className={`fas ${bulkMode ? 'fa-times' : 'fa-check-square'} mr-2`}></i>
          <span className="hidden md:inline">{bulkMode ? 'Cancel' : 'Select'}</span>
        </button>
        <button 
          className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" 
          onClick={onAddCustomer}
        >
          <i className="fas fa-user-plus mr-2"></i><span className="hidden md:inline">Add Customer</span><span className="md:hidden">+</span>
        </button>
      </div>
    </div>
  );
}
