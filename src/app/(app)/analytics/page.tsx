"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { analyticsService, AnalyticsData } from "@/lib/db";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activePeriod, setActivePeriod] = useState("week");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAnalytics();
  }, [user, activePeriod]);

  const loadAnalytics = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await analyticsService.getAnalyticsData(user, activePeriod);
      setAnalyticsData(data);
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const periods = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "year", label: "Year" },
  ];

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  };

  const exportReport = () => {
    if (!analyticsData) return;
    const headers = ["Metric", "Value"];
    const rows = [
      ["Total Revenue", formatCurrency(analyticsData.totalRevenue)],
      ["Total Orders", analyticsData.totalOrders.toString()],
      ["Total Customers", analyticsData.totalCustomers.toString()],
      ["Avg Order Value", formatCurrency(analyticsData.avgOrderValue)],
      ["Conversion Rate", `${analyticsData.conversionRate.toFixed(1)}%`],
      ["AI Response Rate", `${analyticsData.aiResponseRate}%`],
    ];
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `analytics_${activePeriod}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const defaultKPIs = [
    { label: "Total Revenue", value: "$48,294", change: "+12.5% vs last week", positive: true, icon: "fa-dollar-sign", color: "green" },
    { label: "Total Orders", value: "1,847", change: "+8.2% vs last week", positive: true, icon: "fa-shopping-bag", color: "warning" },
    { label: "Avg Order Value", value: "$26.15", change: "+4.3% vs last week", positive: true, icon: "fa-receipt", color: "blue" },
    { label: "Conversion Rate", value: "24.8%", change: "+2.1% vs last week", positive: true, icon: "fa-percentage", color: "emerald" },
    { label: "AI Response Rate", value: "94.2%", change: "Excellent performance", positive: true, icon: "fa-robot", color: "purple" },
  ];

  const kpis = analyticsData ? [
    { label: "Total Revenue", value: formatCurrency(analyticsData.totalRevenue), change: "+12.5% vs last week", positive: true, icon: "fa-dollar-sign", color: "green" },
    { label: "Total Orders", value: analyticsData.totalOrders.toLocaleString(), change: "+8.2% vs last week", positive: true, icon: "fa-shopping-bag", color: "warning" },
    { label: "Avg Order Value", value: formatCurrency(analyticsData.avgOrderValue), change: "+4.3% vs last week", positive: true, icon: "fa-receipt", color: "blue" },
    { label: "Conversion Rate", value: `${analyticsData.conversionRate.toFixed(1)}%`, change: "+2.1% vs last week", positive: true, icon: "fa-percentage", color: "emerald" },
    { label: "AI Response Rate", value: `${analyticsData.aiResponseRate}%`, change: "Excellent performance", positive: true, icon: "fa-robot", color: "purple" },
  ] : defaultKPIs;

  const defaultTopProducts = [
    { rank: 1, name: "Nike Air Max 2024", sold: 342, revenue: "$64,638", price: "$189" },
    { rank: 2, name: "Premium Leather Handbag", sold: 198, revenue: "$33,660", price: "$170" },
    { rank: 3, name: "Smart Watch Pro", sold: 156, revenue: "$46,644", price: "$299" },
    { rank: 4, name: "Wireless Headphones", sold: 445, revenue: "$66,305", price: "$149" },
    { rank: 5, name: "iPhone 15 Pro Case", sold: 892, revenue: "$35,680", price: "$40" },
  ];

  const topProducts = analyticsData?.topProducts.length 
    ? analyticsData.topProducts.map((p, idx) => ({ rank: idx + 1, name: p.name, sold: p.sold, revenue: formatCurrency(p.revenue), price: formatCurrency(p.price) }))
    : defaultTopProducts;

  const defaultDailyData = [
    { date: "Apr 7, 2026", orders: 156, revenue: "$4,089", customers: 142, conversion: "26.4%", ai: "94%", trend: "+12%" },
    { date: "Apr 6, 2026", orders: 142, revenue: "$3,721", customers: 128, conversion: "24.8%", ai: "92%", trend: "+8%" },
    { date: "Apr 5, 2026", orders: 138, revenue: "$3,612", customers: 125, conversion: "25.1%", ai: "95%", trend: "-3%" },
    { date: "Apr 4, 2026", orders: 145, revenue: "$3,795", customers: 132, conversion: "24.2%", ai: "93%", trend: "+5%" },
    { date: "Apr 3, 2026", orders: 132, revenue: "$3,455", customers: 118, conversion: "23.8%", ai: "91%", trend: "+2%" },
  ];

  const dailyData = analyticsData?.dailyStats.length
    ? analyticsData.dailyStats.map((d, idx) => ({
        date: d.date,
        orders: d.orders,
        revenue: formatCurrency(d.revenue),
        customers: d.customers,
        conversion: `${d.conversion}%`,
        ai: `${d.ai}%`,
        trend: idx > 0 && d.orders > analyticsData.dailyStats[idx - 1].orders ? "+5%" : idx > 0 ? "-3%" : "+12%",
      }))
    : defaultDailyData;

  const defaultCategories = [
    { name: "Footwear", value: 35, color: "#25D366" },
    { name: "Electronics", value: 28, color: "#3b82f6" },
    { name: "Fashion", value: 20, color: "#f59e0b" },
    { name: "Accessories", value: 12, color: "#8b5cf6" },
    { name: "Home", value: 5, color: "#ec4899" },
  ];

  const categories = analyticsData?.categoryBreakdown.length
    ? analyticsData.categoryBreakdown.map((c, idx) => ({
        name: c.category,
        value: c.value,
        color: defaultCategories[idx]?.color || "#64748b",
      }))
    : defaultCategories;

  const getColorClass = (color: string) => {
    switch(color) {
      case "green": return "bg-[#25D366]";
      case "warning": return "bg-[#f59e0b]";
      case "blue": return "bg-[#3b82f6]";
      case "emerald": return "bg-[#10b981]";
      case "purple": return "bg-[#8b5cf6]";
      default: return "bg-[#25D366]";
    }
  };

  const hoursData = [
    { time: "6AM", orders: 12 },
    { time: "9AM", orders: 45 },
    { time: "12PM", orders: 89 },
    { time: "3PM", orders: 67 },
    { time: "6PM", orders: 156 },
    { time: "9PM", orders: 198 },
    { time: "12AM", orders: 34 },
  ];
  const maxOrders = Math.max(...hoursData.map(h => h.orders));

  const insights = [
    { type: "opportunity", label: "Opportunity", icon: "fa-arrow-trend-up", text: "Your conversion rate peaks between 6-9 PM. Consider scheduling AI responses during these hours to maximize sales.", action: "Enable Auto-Scheduling" },
    { type: "warning", label: "Alert", icon: "fa-exclamation-triangle", text: "3 products are trending downward in sales. Nike Air Max inventory should be restocked within 5 days.", action: "View Inventory" },
    { type: "info", label: "Recommendation", icon: "fa-lightbulb", text: "Customers who receive AI responses within 2 minutes are 3x more likely to complete purchases.", action: "Optimize Response Time" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-chart-line text-[#25D366]"></i>Analytics Dashboard
          </h1>
          <p className="text-[#64748b]">Deep insights into your WhatsApp business performance</p>
        </div>
        <div className="flex gap-3 items-center">
          <div className="flex bg-white rounded-xl border border-[#e2e8f0] p-1">
            {periods.map(p => (
              <button key={p.id} onClick={() => setActivePeriod(p.id)} className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${activePeriod === p.id ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={exportReport} className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
            <i className="fas fa-download mr-2"></i>Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-[#e2e8f0] animate-pulse">
              <div className="h-4 bg-[#e2e8f0] rounded w-20 mb-3"></div>
              <div className="h-8 bg-[#e2e8f0] rounded w-24 mb-2"></div>
              <div className="h-4 bg-[#e2e8f0] rounded w-32"></div>
            </div>
          ))
        ) : (
          kpis.map((kpi, idx) => (
            <div key={idx} className={`bg-white p-5 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-lg -translate-y-1 transition-all relative overflow-hidden`}>
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${kpi.color === "green" ? "from-[#25D366] to-[#128C7E]" : kpi.color === "warning" ? "from-[#f59e0b] to-[#d97706]" : kpi.color === "blue" ? "from-[#3b82f6] to-[#2563eb]" : kpi.color === "emerald" ? "from-[#10b981] to-[#059669]" : "from-[#8b5cf6] to-[#7c3aed]"}`}></div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-semibold uppercase text-[#64748b]">{kpi.label}</span>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${getColorClass(kpi.color).split(" ")[0]}/10 ${kpi.color === "green" ? "text-[#25D366]" : kpi.color === "warning" ? "text-[#f59e0b]" : kpi.color === "blue" ? "text-[#3b82f6]" : kpi.color === "emerald" ? "text-[#10b981]" : "text-[#8b5cf6]"}`}>
                  <i className={`fas ${kpi.icon}`}></i>
                </div>
              </div>
              <div className="text-4xl font-extrabold mb-2">{kpi.value}</div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${kpi.positive ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[#ef4444]/10 text-[#ef4444]"}`}>
                <i className={`fas fa-arrow-${kpi.positive ? "up" : "down"}`}></i>
                {kpi.change}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-chart-area text-[#25D366]"></i>Revenue Overview
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border-2 border-[#25D366] text-[#25D366] rounded-lg text-sm font-semibold bg-[#DCF8C6]">Line</button>
              <button className="px-3 py-1.5 border-2 border-[#e2e8f0] text-[#64748b] rounded-lg text-sm font-semibold hover:border-[#25D366]">Bar</button>
            </div>
          </div>
          <div className="p-5 h-[350px]">
            <div className="flex items-end justify-between h-full gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, idx) => {
                const values = [3350, 3455, 3795, 3612, 3721, 4089, 3890];
                const height = (values[idx] / 4500) * 100;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gradient-to-t from-[#25D366] to-[#DCF8C6] rounded-t-lg relative group" style={{ height: `${height}%` }}>
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0f172a] text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">${values[idx].toLocaleString()}</div>
                    </div>
                    <span className="text-xs text-[#64748b]">{day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="p-5 border-b border-[#e2e8f0]">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-trophy text-[#f59e0b]"></i>Top Products
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {topProducts.map((product, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-[#f8fafc] rounded-xl hover:bg-[#f1f5f9] transition-all">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${idx < 3 ? "bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white" : "bg-[#e2e8f0] text-[#64748b]"}`}>
                  {product.rank}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-sm">{product.name}</div>
                  <div className="text-xs text-[#64748b]">{product.sold} sold • {product.revenue}</div>
                </div>
                <div className="font-extrabold text-[#1e293b]">{product.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">Customer Acquisition</span>
            <span className="px-2 py-1 bg-[#10b981]/10 text-[#10b981] text-xs font-bold rounded-full">+24%</span>
          </div>
          <div className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] bg-clip-text text-transparent">{analyticsData?.totalCustomers || 892}</div>
          <div className="h-16 bg-[#f8fafc] rounded-lg relative overflow-hidden">
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0,40 Q15,35 30,30 T60,20 T100,5 L100,40 Z" fill="url(#grad1)" />
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#25D366" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#25D366" stopOpacity="0"/>
                </linearGradient>
              </defs>
            </svg>
            <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0,40 Q15,35 30,30 T60,20 T100,5" fill="none" stroke="#25D366" strokeWidth="2"/>
            </svg>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">Response Time</span>
            <span className="px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-bold rounded-full">-18%</span>
          </div>
          <div className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] bg-clip-text text-transparent">1.2m</div>
          <div className="h-16 bg-[#f8fafc] rounded-lg relative overflow-hidden flex items-end gap-1 p-2">
            {[30, 45, 35, 28, 40, 25, 20].map((h, i) => (
              <div key={i} className="flex-1 bg-[#3b82f6] rounded" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold">Customer Satisfaction</span>
            <span className="px-2 py-1 bg-[#8b5cf6]/10 text-[#8b5cf6] text-xs font-bold rounded-full">+5%</span>
          </div>
          <div className="text-4xl font-extrabold mb-4 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] bg-clip-text text-transparent">4.8</div>
          <div className="flex items-end gap-2 h-16">
            {[80, 90, 85, 95, 100, 92, 88].map((h, i) => (
              <div key={i} className="flex-1 bg-[#8b5cf6] rounded opacity-30" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#0f172a] to-[#020617] rounded-2xl p-6 mb-6 text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-brain text-[#25D366]"></i>AI-Powered Insights
          </h2>
          <button className="px-4 py-2 bg-white/10 text-white rounded-xl font-semibold text-sm border border-white/20">
            <i className="fas fa-magic mr-2"></i>Generate Report
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {insights.map((insight, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all">
              <span className={`inline-flex items-center gap-2 text-sm font-semibold mb-3 px-3 py-1 rounded-full ${insight.type === "warning" ? "bg-[#f59e0b]/20 text-[#f59e0b]" : insight.type === "info" ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-[#25D366]/20 text-[#25D366]"}`}>
                <i className={`fas ${insight.icon}`}></i>
                {insight.label}
              </span>
              <p className="text-sm mb-3 opacity-90">{insight.text}</p>
              <span className="text-[#25D366] font-semibold text-sm cursor-pointer hover:underline">
                {insight.action} <i className="fas fa-arrow-right ml-1"></i>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="p-5 border-b border-[#e2e8f0]">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-chart-pie text-[#8b5cf6]"></i>Sales by Category
            </h3>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-center mb-4">
              <div className="w-40 h-40 rounded-full border-[16px] border-[#e2e8f0] relative" style={{ borderColor: `${categories[0].color} transparent transparent transparent`, transform: "rotate(45deg)" }}>
                <div className="absolute inset-0 rounded-full border-[16px] border-transparent" style={{ borderColor: `transparent ${categories[1].color} transparent transparent`, transform: "rotate(45deg)", inset: -16 }}></div>
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                  <span className="text-sm">{cat.name} {cat.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
          <div className="p-5 border-b border-[#e2e8f0]">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-clock text-[#3b82f6]"></i>Peak Hours Analysis
            </h3>
          </div>
          <div className="p-5 h-[250px] flex items-end gap-2">
            {hoursData.map((h, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-gradient-to-t from-[#25D366] to-[#DCF8C6] rounded-t-lg" style={{ height: `${(h.orders / maxOrders) * 180}px` }}></div>
                <span className="text-xs text-[#64748b]">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
        <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <i className="fas fa-table text-[#25D366]"></i>Daily Performance Breakdown
          </h3>
          <button onClick={exportReport} className="px-4 py-2 border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
            <i className="fas fa-file-csv mr-2"></i>Download CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f8fafc]">
                <th className="text-left p-4 text-xs font-bold uppercase text-[#64748b]">Date</th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#64748b]">Orders</th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#64748b]">Revenue</th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#64748b]">Customers</th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#64748b]">Conversion</th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#64748b]">AI Handled</th>
                <th className="text-left p-4 text-xs font-bold uppercase text-[#64748b]">Trend</th>
              </tr>
            </thead>
            <tbody>
              {dailyData.map((row, idx) => (
                <tr key={idx} className="border-t border-[#e2e8f0] hover:bg-[rgba(37,211,102,0.02)]">
                  <td className="p-4 font-bold">{row.date}</td>
                  <td className="p-4">{row.orders}</td>
                  <td className="p-4 font-bold">{row.revenue}</td>
                  <td className="p-4">{row.customers}</td>
                  <td className="p-4">{row.conversion}</td>
                  <td className="p-4">{row.ai}</td>
                  <td className="p-4">
                    <span className={`font-bold ${row.trend.startsWith("+") ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                      <i className={`fas fa-arrow-${row.trend.startsWith("+") ? "up" : "down"} mr-1`}></i>
                      {row.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
