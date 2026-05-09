"use client";

import { Customer } from "@/lib/db";

interface CustomerCardProps {
  customer: Customer;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelection: (customerId: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onSendWhatsApp: (phone: string) => void;
  onShareWhatsApp: (customer: Customer) => void;
  onDuplicate: (customer: Customer) => void;
  onPrintProfile: (customer: Customer) => void;
  onBulkActivate: (customerId: string) => void;
  onBulkSetVIP: (customerId: string) => void;
  onBulkDelete: (customerId: string) => void;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
  formatCurrency: (amount: number) => string;
}

export default function CustomerCard({
  customer,
  bulkMode,
  isSelected,
  onToggleSelection,
  onSelectCustomer,
  onSendWhatsApp,
  onShareWhatsApp,
  onDuplicate,
  onPrintProfile,
  onBulkActivate,
  onBulkSetVIP,
  onBulkDelete,
  getColorFromString,
  getInitials,
  formatCurrency,
}: CustomerCardProps) {
  return (
    <div 
      key={customer.id} 
      className={`bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all ${bulkMode ? 'cursor-default' : 'cursor-pointer'}`} 
      onClick={() => !bulkMode && onSelectCustomer(customer)}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelection(customer.id)}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366] flex-shrink-0"
            />
          )}
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center font-bold text-lg text-white relative`}>
            {getInitials(customer.name)}
            <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${customer.status === 'vip' ? 'bg-[#f59e0b]' : customer.status === 'active' ? 'bg-[#10b981]' : customer.status === 'new' ? 'bg-[#3b82f6]' : 'bg-[#64748b]'}`}></span>
          </div>
          <div>
            <div className="font-bold text-[#1e293b]">{customer.name}</div>
            <div className="text-xs text-[#64748b] capitalize">{customer.status}</div>
          </div>
        </div>
        {!bulkMode && (
          <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#f8fafc] rounded-xl">
        <div className="text-center">
          <div className="font-extrabold text-[#25D366] text-lg">{formatCurrency(customer.totalSpent || 0)}</div>
          <div className="text-xs text-[#64748b] uppercase font-semibold">Spent</div>
        </div>
        <div className="text-center">
          <div className="font-extrabold text-[#1e293b] text-lg">{customer.visits || 0}</div>
          <div className="text-xs text-[#64748b] uppercase font-semibold">Visits</div>
        </div>
        <div className="text-center">
          <div className="font-extrabold text-[#1e293b] text-lg">{customer.rating ? customer.rating.toFixed(1) : '-'}</div>
          <div className="text-xs text-[#64748b] uppercase font-semibold">Rating</div>
        </div>
      </div>

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-[#64748b]">
          <i className="fab fa-whatsapp w-8 h-8 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#25D366]"></i>
          {customer.phone}
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <i className="fas fa-envelope w-8 h-8 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#25D366]"></i>
            {customer.email}
          </div>
        )}
        {customer.location && (
          <div className="flex items-center gap-2 text-sm text-[#64748b]">
            <i className="fas fa-map-marker-alt w-8 h-8 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#25D366]"></i>
            {customer.location}
          </div>
        )}
      </div>

      {!bulkMode ? (
        <div className="grid grid-cols-4 gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onSendWhatsApp(customer.phone); }} 
            className="py-2 px-2 bg-[#DCF8C6] text-[#128C7E] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all"
            title="Send WhatsApp"
          >
            <i className="fab fa-whatsapp"></i>
            <span className="hidden lg:inline">Message</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onShareWhatsApp(customer); }} 
            className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all"
            title="Share via WhatsApp"
          >
            <i className="fas fa-share-alt"></i>
            <span className="hidden lg:inline">Share</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDuplicate(customer); }} 
            className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#3b82f6] hover:text-white transition-all"
            title="Duplicate Customer"
          >
            <i className="fas fa-copy"></i>
            <span className="hidden lg:inline">Copy</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onPrintProfile(customer); }} 
            className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#3b82f6] hover:text-white transition-all"
            title="Print Profile"
          >
            <i className="fas fa-print"></i>
            <span className="hidden lg:inline">Print</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onBulkActivate(customer.id); }}
            className="py-2 px-2 bg-[#dcfce7] text-[#10b981] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#10b981] hover:text-white transition-all"
          >
            <i className="fas fa-check"></i>Activate
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onBulkSetVIP(customer.id); }}
            className="py-2 px-2 bg-[#fef3c7] text-[#f59e0b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#f59e0b] hover:text-white transition-all"
          >
            <i className="fas fa-crown"></i>VIP
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onBulkDelete(customer.id); }}
            className="py-2 px-2 bg-[#fee2e2] text-[#ef4444] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#ef4444] hover:text-white transition-all"
          >
            <i className="fas fa-trash"></i>Delete
          </button>
        </div>
      )}
    </div>
  );
}
