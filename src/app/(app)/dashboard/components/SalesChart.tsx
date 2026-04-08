export function SalesChart() {
  return (
    <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
      <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <i className="fas fa-chart-bar text-[#25D366]"></i>
          Sales Analytics
        </h3>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all">
            <i className="fas fa-download"></i>
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg transition-all">
            <i className="fas fa-ellipsis-v"></i>
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="h-[300px] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] rounded-xl flex items-center justify-center">
          <div className="text-center text-[#64748b]">
            <i className="fas fa-chart-area text-4xl mb-4 opacity-50"></i>
            <p>Sales Chart Integration Placeholder</p>
            <small className="text-xs">Connect Chart.js or Recharts here</small>
          </div>
        </div>
      </div>
    </div>
  );
}
