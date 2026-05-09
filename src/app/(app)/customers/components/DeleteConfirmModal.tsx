"use client";

import { Customer } from "@/lib/db";

interface DeleteConfirmModalProps {
  customer: Customer | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({ customer, onConfirm, onCancel }: DeleteConfirmModalProps) {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-3xl text-[#ef4444]"></i>
          </div>
          <h2 className="text-xl font-extrabold mb-2">Delete Customer?</h2>
          <p className="text-[#64748b] mb-4">Are you sure you want to delete {customer.name}? This action cannot be undone.</p>
        </div>
        <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
          <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={onCancel}>Cancel</button>
          <button className="px-4 py-2 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={onConfirm}>
            <i className="fas fa-trash mr-2"></i>Delete
          </button>
        </div>
      </div>
    </div>
  );
}
