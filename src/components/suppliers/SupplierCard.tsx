"use client";

import { Supplier } from "@/lib/db";
import { SupplierCardProps, categoryLogos, getPaymentTermsLabel } from "./types";

export function SupplierCard({ supplier, onView, onEdit, onDelete }: SupplierCardProps) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden relative">
      <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Active</span>
      
      {/* Header */}
      <div className="p-3 md:p-5 border-b border-[#e2e8f0]">
        <div className="flex gap-3">
          <div className="w-12 h-12 md:w-[70px] md:h-[70px] rounded-lg md:rounded-xl bg-[#f8fafc] flex items-center justify-center text-2xl md:text-3xl border-2 border-[#e2e8f0]">
            {categoryLogos.general}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-base md:text-xl flex items-center gap-1">
              <span className="truncate">{supplier.name}</span>
              <span className="w-5 h-5 bg-[#25D366] text-white rounded-full flex items-center justify-center text-xs">
                <i className="fas fa-check"></i>
              </span>
            </div>
            <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase mb-1">
              General
            </span>
            <div className="text-xs text-[#64748b] truncate">
              <i className="fas fa-map-marker-alt mr-1"></i>
              {supplier.address || "No address"}
            </div>
          </div>
          <div className="flex gap-1 md:gap-2">
            <button className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg" onClick={() => onView(supplier)}>
              <i className="fas fa-eye"></i>
            </button>
            <button className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg" onClick={() => onEdit(supplier)}>
              <i className="fas fa-edit"></i>
            </button>
            <button className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center text-[#ef4444] hover:bg-red-50 rounded-lg" onClick={() => onDelete(supplier.id)}>
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-3 md:p-5">
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-5">
          <div className="text-center p-2 md:p-3 bg-[#f8fafc] rounded-lg md:rounded-xl">
            <div className="font-bold text-base md:text-xl text-[#1e293b]">{supplier.products?.length || 0}</div>
            <div className="text-xs text-[#64748b] font-bold uppercase">Products</div>
          </div>
          <div className="text-center p-2 md:p-3 bg-[#f8fafc] rounded-lg md:rounded-xl">
            <div className="font-bold text-base md:text-xl text-[#1e293b]">$0</div>
            <div className="text-xs text-[#64748b] font-bold uppercase">Monthly</div>
          </div>
          <div className="text-center p-2 md:p-3 bg-[#f8fafc] rounded-lg md:rounded-xl">
            <div className="font-bold text-base md:text-xl text-[#1e293b]">-</div>
            <div className="text-xs text-[#64748b] font-bold uppercase">On Time</div>
          </div>
        </div>
        
        {/* Contact Info */}
        <div>
          <div className="text-xs font-bold uppercase text-[#64748b] mb-2">Contact</div>
          <div className="flex flex-wrap gap-1 md:gap-2">
            <span className="px-2 md:px-3 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-xs md:text-sm font-semibold text-[#64748b] truncate max-w-[120px]">
              {supplier.contactPerson || "No contact"}
            </span>
            <span className="px-2 md:px-3 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-xs md:text-sm font-semibold text-[#64748b]">
              {supplier.phone || "No phone"}
            </span>
            <span className="px-2 md:px-3 py-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-full text-xs md:text-sm font-semibold text-[#64748b]">
              {getPaymentTermsLabel(supplier.paymentTerms)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-3 md:p-4 border-t border-[#e2e8f0] flex justify-between items-center bg-[#f8fafc]/50">
        <div className="flex items-center gap-1 text-xs md:text-sm">
          <span className="text-yellow-500">
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
            <i className="fas fa-star"></i>
          </span>
          <span className="font-bold">New</span>
        </div>
        <div className="text-xs md:text-sm text-[#64748b]">
          {supplier.createdAt?.toDate ? supplier.createdAt.toDate().toLocaleDateString() : "Recently added"}
        </div>
      </div>
    </div>
  );
}