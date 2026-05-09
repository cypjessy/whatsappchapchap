"use client";

interface ProductFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  stockFilter: string;
  setStockFilter: (value: string) => void;
  priceRangeMin: number | "";
  setPriceRangeMin: (value: number | "") => void;
  priceRangeMax: number | "";
  setPriceRangeMax: (value: number | "") => void;
  dateRangeStart: string;
  setDateRangeStart: (value: string) => void;
  dateRangeEnd: string;
  setDateRangeEnd: (value: string) => void;
  sortBy: string;
  setSortBy: (value: string) => void;
  view: "grid" | "list";
  setView: (view: "grid" | "list") => void;
}

export default function ProductFilters({
  searchTerm,
  setSearchTerm,
  stockFilter,
  setStockFilter,
  priceRangeMin,
  setPriceRangeMin,
  priceRangeMax,
  setPriceRangeMax,
  dateRangeStart,
  setDateRangeStart,
  dateRangeEnd,
  setDateRangeEnd,
  sortBy,
  setSortBy,
  view,
  setView,
}: ProductFiltersProps) {
  return (
    <div className="bg-white rounded-2xl p-3 md:p-4 mb-4 md:mb-6 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between border border-[#e2e8f0] animate-fadeIn">
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:flex-none">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-9 pr-3 py-2 bg-[#f8fafc] border-2 border-transparent rounded-xl text-sm focus:outline-none focus:border-[#25D366] w-full md:w-48" 
          />
        </div>
        <select 
          className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" 
          value={stockFilter} 
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">Stock</option>
          <option value="in">In Stock</option>
          <option value="low">Low Stock</option>
          <option value="out">Out</option>
        </select>
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="Min Price" 
            value={priceRangeMin} 
            onChange={(e) => setPriceRangeMin(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm w-24"
          />
          <input 
            type="number" 
            placeholder="Max Price" 
            value={priceRangeMax} 
            onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : "")}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm w-24"
          />
        </div>
        <div className="flex gap-2">
          <input 
            type="date" 
            value={dateRangeStart} 
            onChange={(e) => setDateRangeStart(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
          />
          <input 
            type="date" 
            value={dateRangeEnd} 
            onChange={(e) => setDateRangeEnd(e.target.value)}
            className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm"
          />
        </div>
        <select 
          className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-low">Price ↑</option>
          <option value="price-high">Price ↓</option>
          <option value="stock-low">Stock ↑</option>
          <option value="stock-high">Stock ↓</option>
          <option value="name-az">Name A-Z</option>
          <option value="name-za">Name Z-A</option>
        </select>
      </div>
      <div className="flex bg-[#f8fafc] rounded-xl p-1 border-2 border-[#e2e8f0] self-end md:self-auto">
        <button 
          onClick={() => setView("grid")} 
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${view === "grid" ? "bg-white shadow text-[#25D366]" : "text-[#64748b]"}`}
        >
          <i className="fas fa-th-large"></i>
        </button>
        <button 
          onClick={() => setView("list")} 
          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${view === "list" ? "bg-white shadow text-[#25D366]" : "text-[#64748b]"}`}
        >
          <i className="fas fa-list"></i>
        </button>
      </div>
    </div>
  );
}
