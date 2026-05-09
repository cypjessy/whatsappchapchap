"use client";

interface CustomerFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  spendingMin: number | "";
  onSpendingMinChange: (value: number | "") => void;
  spendingMax: number | "";
  onSpendingMaxChange: (value: number | "") => void;
  dateRangeStart: string;
  onDateRangeStartChange: (value: string) => void;
  dateRangeEnd: string;
  onDateRangeEndChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  onBroadcast: () => void;
}

export default function CustomerFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  spendingMin,
  onSpendingMinChange,
  spendingMax,
  onSpendingMaxChange,
  dateRangeStart,
  onDateRangeStartChange,
  dateRangeEnd,
  onDateRangeEndChange,
  sortBy,
  onSortByChange,
  onBroadcast,
}: CustomerFiltersProps) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:gap-4 border border-[#e2e8f0] justify-between">
      <div className="flex gap-2 md:gap-4 flex-1 flex-wrap">
        <div className="relative flex-1 min-w-[150px] md:min-w-[280px]">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
          />
        </div>
        
        <select 
          className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" 
          value={statusFilter} 
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="new">New</option>
          <option value="vip">VIP</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="Min Spent" 
            value={spendingMin} 
            onChange={(e) => onSpendingMinChange(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm w-24"
          />
          <input 
            type="number" 
            placeholder="Max Spent" 
            value={spendingMax} 
            onChange={(e) => onSpendingMaxChange(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm w-24"
          />
        </div>

        <div className="flex gap-2">
          <input 
            type="date" 
            value={dateRangeStart} 
            onChange={(e) => onDateRangeStartChange(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
          />
          <input 
            type="date" 
            value={dateRangeEnd} 
            onChange={(e) => onDateRangeEndChange(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
          />
        </div>

        <select 
          className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" 
          value={sortBy} 
          onChange={(e) => onSortByChange(e.target.value)}
        >
          <option value="recent">Most Recent</option>
          <option value="oldest">Oldest</option>
          <option value="highestLTV">Highest LTV</option>
          <option value="mostOrders">Most Orders</option>
          <option value="name">Name A-Z</option>
          <option value="rating">Rating</option>
          <option value="visits">Visits</option>
        </select>
      </div>
      <button 
        className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" 
        onClick={onBroadcast}
      >
        <i className="fas fa-broadcast-tower mr-2"></i>Broadcast
      </button>
    </div>
  );
}
