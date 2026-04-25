"use client";

import { Supplier } from "@/lib/db";
import { SupplierCardProps, categoryLogos, getPaymentTermsLabel } from "./types";

export function SupplierCard({ 
  supplier, 
  onView, 
  onEdit, 
  onDelete,
  bulkMode = false,
  isSelected = false,
  onToggleSelect,
  onShare,
  onPrint,
  onDuplicate
}: SupplierCardProps) {
  const statusColor = supplier.status === 'active' ? 'bg-green-100 text-green-700' : 
                      supplier.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-red-100 text-red-700';
  const statusLabel = supplier.status || 'pending';
  
  return (
    <div className={`bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden relative ${bulkMode ? (isSelected ? 'ring-2 ring-[#25D366]' : '') : ''}`}>
      {/* Bulk Mode Checkbox */}
      {bulkMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
          />
        </div>
      )}
      
      <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${statusColor} capitalize`}>
        {statusLabel}
      </span>
      
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
            <div className="font-bold text-base md:text-xl text-[#25D366]">KES {(supplier.totalSpent || 0).toLocaleString()}</div>
            <div className="text-xs text-[#64748b] font-bold uppercase">Spent</div>
          </div>
          <div className="text-center p-2 md:p-3 bg-[#f8fafc] rounded-lg md:rounded-xl">
            <div className="font-bold text-base md:text-xl text-[#1e293b]">{supplier.totalOrders || 0}</div>
            <div className="text-xs text-[#64748b] font-bold uppercase">Orders</div>
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
      <div className="p-3 md:p-4 border-t border-[#e2e8f0] bg-[#f8fafc]/50">
        {!bulkMode ? (
          <>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-1 text-xs md:text-sm">
                <span className="text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <i key={i} className={`fas fa-star${i < (supplier.rating || 0) ? '' : ' opacity-30'}`}></i>
                  ))}
                </span>
                <span className="font-bold">{supplier.rating ? supplier.rating.toFixed(1) : 'New'}</span>
              </div>
              <div className="text-xs md:text-sm text-[#64748b]">
                {supplier.createdAt?.toDate ? supplier.createdAt.toDate().toLocaleDateString() : "Recently added"}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-5 gap-2">
              <button 
                onClick={() => onView(supplier)}
                className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#3b82f6] hover:text-white transition-all"
                title="View Details"
              >
                <i className="fas fa-eye"></i>
                <span className="hidden lg:inline">View</span>
              </button>
              <button 
                onClick={() => onEdit(supplier)}
                className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all"
                title="Edit Supplier"
              >
                <i className="fas fa-edit"></i>
                <span className="hidden lg:inline">Edit</span>
              </button>
              <button 
                onClick={onShare}
                className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all"
                title="Share via WhatsApp"
              >
                <i className="fas fa-share-alt"></i>
                <span className="hidden lg:inline">Share</span>
              </button>
              <button 
                onClick={onPrint}
                className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#3b82f6] hover:text-white transition-all"
                title="Print Profile"
              >
                <i className="fas fa-print"></i>
                <span className="hidden lg:inline">Print</span>
              </button>
              <button 
                onClick={onDuplicate}
                className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#8b5cf6] hover:text-white transition-all"
                title="Duplicate Supplier"
              >
                <i className="fas fa-copy"></i>
                <span className="hidden lg:inline">Copy</span>
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => { if (onToggleSelect) onToggleSelect(); }}
              className="py-2 px-2 bg-[#dcfce7] text-[#10b981] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#10b981] hover:text-white transition-all"
            >
              <i className="fas fa-check"></i>Activate
            </button>
            <button 
              onClick={() => { if (onToggleSelect) onToggleSelect(); }}
              className="py-2 px-2 bg-[#fef3c7] text-[#f59e0b] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#f59e0b] hover:text-white transition-all"
            >
              <i className="fas fa-clock"></i>Pending
            </button>
            <button 
              onClick={() => onDelete(supplier.id)}
              className="py-2 px-2 bg-[#fee2e2] text-[#ef4444] rounded-lg font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#ef4444] hover:text-white transition-all"
            >
              <i className="fas fa-trash"></i>Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}