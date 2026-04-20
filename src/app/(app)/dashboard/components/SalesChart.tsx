"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { dashboardService } from "@/lib/dashboard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface SalesData {
  date: string;
  sales: number;
}

export function SalesChart() {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSalesData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data: SalesData[] = [
          { date: 'Jan', sales: 4000 },
          { date: 'Feb', sales: 3000 },
          { date: 'Mar', sales: 5000 },
          { date: 'Apr', sales: 4500 },
          { date: 'May', sales: 6000 },
          { date: 'Jun', sales: 5500 },
        ];
        setSalesData(data);
      } catch (error) {
        console.error("Error loading sales data:", error);
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    };
    loadSalesData();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
        <div className="p-4 md:p-6 border-b border-[#e2e8f0] flex items-center justify-between">
          <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
            <i className="fas fa-chart-bar text-[#25D366]"></i>
            Sales Analytics
          </h3>
        </div>
        <div className="p-4 md:p-6">
          <div className="h-[220px] md:h-[300px] w-full bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] rounded-xl flex items-center justify-center">
            <div className="animate-pulse text-[#64748b]">Loading chart...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
      <div className="p-4 md:p-6 border-b border-[#e2e8f0] flex items-center justify-between">
        <h3 className="font-bold text-base md:text-lg flex items-center gap-2">
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
      <div className="p-2 md:p-4">
        {salesData.length === 0 ? (
          <div className="h-[200px] md:h-[280px] flex items-center justify-center text-[#64748b]">
            No sales data
          </div>
        ) : (
          <LineChart width={400} height={200} data={salesData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: any) => [`$${value}`, 'Sales']}
            />
            <Line 
              type="monotone" 
              dataKey="sales" 
              stroke="#25D366" 
              strokeWidth={2}
              dot={{ fill: '#25D366', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#25D366', strokeWidth: 2 }}
            />
          </LineChart>
        )}
      </div>
    </div>
  );
}
