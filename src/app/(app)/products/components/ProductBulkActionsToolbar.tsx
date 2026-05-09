"use client";

interface ProductBulkActionsToolbarProps {
  bulkSelected: string[];
  filteredProductsCount: number;
  onBulkStatusUpdate: (status: 'active' | 'paused' | 'draft') => void;
  onBulkDelete: () => void;
  onSelectAll: () => void;
  onCancel: () => void;
}

export default function ProductBulkActionsToolbar({
  bulkSelected,
  filteredProductsCount,
  onBulkStatusUpdate,
  onBulkDelete,
  onSelectAll,
  onCancel,
}: ProductBulkActionsToolbarProps) {
  return (
    <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl animate-fadeIn">
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={bulkSelected.length === filteredProductsCount && filteredProductsCount > 0}
            onChange={onSelectAll}
            className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
          />
          <span className="text-sm font-semibold text-[#64748b]">
            Select All ({bulkSelected.length}/{filteredProductsCount})
          </span>
        </label>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onBulkStatusUpdate('active')} 
          className="px-3 py-2 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 transition-all active:scale-95"
        >
          <i className="fas fa-check mr-2"></i>Activate
        </button>
        <button 
          onClick={onBulkDelete} 
          className="px-3 py-2 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600 transition-all active:scale-95"
        >
          <i className="fas fa-trash mr-2"></i>Delete
        </button>
        <button 
          onClick={onCancel} 
          className="px-3 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm text-[#64748b] hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
