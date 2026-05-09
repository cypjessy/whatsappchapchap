"use client";

import { Customer } from "@/lib/db";
import CustomerCard from "./CustomerCard";

interface CustomerGridViewProps {
  customers: Customer[];
  bulkMode: boolean;
  bulkSelected: string[];
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

export default function CustomerGridView({
  customers,
  bulkMode,
  bulkSelected,
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
}: CustomerGridViewProps) {
  return (
    <div className="hidden md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
      {customers.map(customer => (
        <CustomerCard
          key={customer.id}
          customer={customer}
          bulkMode={bulkMode}
          isSelected={bulkSelected.includes(customer.id)}
          onToggleSelection={onToggleSelection}
          onSelectCustomer={onSelectCustomer}
          onSendWhatsApp={onSendWhatsApp}
          onShareWhatsApp={onShareWhatsApp}
          onDuplicate={onDuplicate}
          onPrintProfile={onPrintProfile}
          onBulkActivate={onBulkActivate}
          onBulkSetVIP={onBulkSetVIP}
          onBulkDelete={onBulkDelete}
          getColorFromString={getColorFromString}
          getInitials={getInitials}
          formatCurrency={formatCurrency}
        />
      ))}
    </div>
  );
}
