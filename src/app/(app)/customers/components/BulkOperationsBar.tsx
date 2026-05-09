"use client";

interface BulkOperationsBarProps {
  bulkSelected: string[];
  filteredCustomersCount: number;
  onSelectAll: () => void;
  onActivate: () => void;
  onSetVIP: () => void;
  onDelete: () => void;
}

export default function BulkOperationsBar({
  bulkSelected,
  filteredCustomersCount,
  onSelectAll,
  onActivate,
  onSetVIP,
  onDelete,
}: BulkOperationsBarProps) {
  return (
    <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={bulkSelected.length === filteredCustomersCount && filteredCustomersCount > 0}
          onChange={onSelectAll}
          className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
        />
        <span className="text-sm font-semibold text-[#1e293b]">Select All ({filteredCustomersCount})</span>
      </label>
      <div className="flex gap-2">
        <button 
          onClick={onActivate}
          disabled={bulkSelected.length === 0}
          className="px-3 py-1.5 bg-[#dcfce7] text-[#10b981] rounded-lg text-xs font-semibold hover:bg-[#10b981] hover:text-white disabled:opacity-50"
        >
          <i className="fas fa-check mr-1"></i>Activate
        </button>
        <button 
          onClick={onSetVIP}
          disabled={bulkSelected.length === 0}
          className="px-3 py-1.5 bg-[#fef3c7] text-[#f59e0b] rounded-lg text-xs font-semibold hover:bg-[#f59e0b] hover:text-white disabled:opacity-50"
        >
          <i className="fas fa-crown mr-1"></i>VIP
        </button>
        <button 
          onClick={onDelete}
          disabled={bulkSelected.length === 0}
          className="px-3 py-1.5 bg-[#fee2e2] text-[#ef4444] rounded-lg text-xs font-semibold hover:bg-[#ef4444] hover:text-white disabled:opacity-50"
        >
          <i className="fas fa-trash mr-1"></i>Delete
        </button>
      </div>
    </div>
  );
}
