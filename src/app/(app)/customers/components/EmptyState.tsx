"use client";

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters: () => void;
}

export default function EmptyState({ hasFilters, onClearFilters }: EmptyStateProps) {
  return (
    <div className="p-8 md:p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
      <div className="w-14 h-14 md:w-16 md:h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-users text-xl md:text-2xl text-[#64748b]"></i>
      </div>
      <h4 className="font-bold text-[#1e293b] mb-2">No customers yet</h4>
      <p className="text-sm text-[#64748b]">Add your first customer to start building your CRM.</p>
    </div>
  );
}
