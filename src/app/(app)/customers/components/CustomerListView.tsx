"use client";

import { Customer } from "@/lib/db";

interface CustomerListViewProps {
  customers: Customer[];
  bulkMode: boolean;
  bulkSelected: string[];
  onToggleSelection: (customerId: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onShareWhatsApp: (customer: Customer) => void;
  onPrintProfile: (customer: Customer) => void;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
  formatCurrency: (amount: number) => string;
}

export default function CustomerListView({
  customers,
  bulkMode,
  bulkSelected,
  onToggleSelection,
  onSelectCustomer,
  onShareWhatsApp,
  onPrintProfile,
  getColorFromString,
  getInitials,
  formatCurrency,
}: CustomerListViewProps) {
  return (
    <div className="md:hidden space-y-2 mb-4">
      {customers.map(customer => (
        <div key={customer.id} className="bg-white rounded-xl p-3 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-3">
            {bulkMode && (
              <input
                type="checkbox"
                checked={bulkSelected.includes(customer.id)}
                onChange={() => onToggleSelection(customer.id)}
                onClick={(e) => e.stopPropagation()}
                className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366] flex-shrink-0"
              />
            )}
            <div 
              className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`} 
              onClick={() => !bulkMode && onSelectCustomer(customer)}
            >
              {getInitials(customer.name)}
            </div>
            <div className="flex-1 min-w-0" onClick={() => !bulkMode && onSelectCustomer(customer)}>
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm truncate">{customer.name}</div>
                <span className="font-bold text-[#25D366] text-sm ml-2">{formatCurrency(customer.totalSpent || 0)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[#64748b]"><i className="fab fa-whatsapp text-[#25D366] mr-1"></i>{customer.phone}</span>
              </div>
            </div>
            {!bulkMode && (
              <div className="flex gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareWhatsApp(customer);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-[#25D366] hover:text-white hover:bg-[#25D366] bg-[rgba(37,211,102,0.1)] rounded-lg transition-all shadow-sm"
                  title="Share via WhatsApp"
                >
                  <i className="fab fa-whatsapp text-base"></i>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrintProfile(customer);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-[#3b82f6] hover:text-white hover:bg-[#3b82f6] bg-[#eff6ff] rounded-lg transition-all shadow-sm"
                  title="Print Profile"
                >
                  <i className="fas fa-print text-base"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
