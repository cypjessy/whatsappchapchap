"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { expenseService, orderService, Expense } from "@/lib/db";

export default function ReportsPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [newExpense, setNewExpense] = useState({
    category: "supplies" as Expense["category"],
    amount: 0,
    description: "",
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expensesData, ordersData] = await Promise.all([
        expenseService.getExpenses(user),
        orderService.getOrders(user),
      ]);
      setExpenses(expensesData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading financial data:", error);
      setExpenses([]);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async () => {
    if (!user) return;
    if (!newExpense.description || newExpense.amount <= 0) {
      alert("Please fill in description and valid amount");
      return;
    }

    try {
      await expenseService.createExpense(user, {
        ...newExpense,
        date: new Date(newExpense.date),
      });
      loadData();
      setShowExpenseModal(false);
      setNewExpense({
        category: "supplies",
        amount: 0,
        description: "",
        date: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Error creating expense");
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await expenseService.deleteExpense(user, expenseId);
      loadData();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Error deleting expense");
    }
  };

  const getFilteredData = (period: string) => {
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    const filteredExpenses = expenses.filter(expense => 
      new Date(expense.date) >= startDate
    );

    const filteredOrders = orders.filter(order => 
      new Date(order.createdAt) >= startDate && order.status === 'completed'
    );

    return { expenses: filteredExpenses, orders: filteredOrders };
  };

  const calculateFinancials = (period: string) => {
    const { expenses: periodExpenses, orders: periodOrders } = getFilteredData(period);

    const totalRevenue = periodOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalExpenses = periodExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const expensesByCategory = periodExpenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const revenueByMonth = periodOrders.reduce((acc, order) => {
      const month = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + (order.total || 0);
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      expensesByCategory,
      revenueByMonth,
      orderCount: periodOrders.length,
      expenseCount: periodExpenses.length,
    };
  };

  const getCategoryBadge = (category: Expense["category"]) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      supplies: { bg: "bg-blue-100", color: "text-blue-600", label: "Supplies" },
      utilities: { bg: "bg-green-100", color: "text-green-600", label: "Utilities" },
      rent: { bg: "bg-purple-100", color: "text-purple-600", label: "Rent" },
      marketing: { bg: "bg-orange-100", color: "text-orange-600", label: "Marketing" },
      salaries: { bg: "bg-red-100", color: "text-red-600", label: "Salaries" },
      equipment: { bg: "bg-indigo-100", color: "text-indigo-600", label: "Equipment" },
      other: { bg: "bg-gray-100", color: "text-gray-600", label: "Other" },
    };
    return styles[category] || styles.other;
  };

  const financials = calculateFinancials(selectedPeriod);

  const tabs = [
    { id: "overview", label: "Overview", icon: "fas fa-chart-line" },
    { id: "expenses", label: "Expenses", icon: "fas fa-receipt" },
    { id: "revenue", label: "Revenue", icon: "fas fa-dollar-sign" },
  ];

  const periodOptions = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "quarter", label: "This Quarter" },
    { value: "year", label: "This Year" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-chart-bar text-[#25D366]"></i>Financial Reports
          </h1>
          <p className="text-[#64748b]">Track revenue, expenses, and profitability</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
          >
            {periodOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button 
            className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg"
            onClick={() => setShowExpenseModal(true)}
          >
            <i className="fas fa-plus mr-2"></i>Add Expense
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" 
                : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"
            }`}
          >
            <i className={tab.icon}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading financial data...</p>
        </div>
      ) : activeTab === "overview" ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748b] mb-1">Total Revenue</p>
                  <p className="text-2xl font-extrabold text-[#1e293b]">${financials.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-green-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748b] mb-1">Total Expenses</p>
                  <p className="text-2xl font-extrabold text-[#1e293b]">${financials.totalExpenses.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-receipt text-red-600"></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748b] mb-1">Net Profit</p>
                  <p className={`text-2xl font-extrabold ${financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${financials.netProfit.toFixed(2)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  financials.netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <i className={`fas ${financials.netProfit >= 0 ? 'fa-arrow-up' : 'fa-arrow-down'} ${
                    financials.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}></i>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#64748b] mb-1">Profit Margin</p>
                  <p className={`text-2xl font-extrabold ${financials.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {financials.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  financials.profitMargin >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <i className={`fas ${financials.profitMargin >= 0 ? 'fa-chart-line' : 'fa-chart-line-down'} ${
                    financials.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}></i>
                </div>
              </div>
            </div>
          </div>

          {/* Charts and Breakdowns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <h3 className="text-lg font-bold text-[#1e293b] mb-4">Expenses by Category</h3>
              {Object.keys(financials.expensesByCategory).length === 0 ? (
                <p className="text-[#64748b] text-center py-8">No expenses recorded for this period</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(financials.expensesByCategory).map(([category, amount]) => {
                    const categoryStyle = getCategoryBadge(category as Expense["category"]);
                    const percentage = (amount / financials.totalExpenses) * 100;
                    
                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${categoryStyle.bg} ${categoryStyle.color}`}>
                            {categoryStyle.label}
                          </span>
                          <span className="text-sm text-[#64748b]">{percentage.toFixed(1)}%</span>
                        </div>
                        <span className="font-semibold">${amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6">
              <h3 className="text-lg font-bold text-[#1e293b] mb-4">Revenue Trend</h3>
              {Object.keys(financials.revenueByMonth).length === 0 ? (
                <p className="text-[#64748b] text-center py-8">No revenue recorded for this period</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(financials.revenueByMonth).map(([month, amount]) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#1e293b]">{month}</span>
                      <span className="font-bold text-[#25D366]">${(amount as number).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "expenses" ? (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="p-6 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-bold text-[#1e293b]">Expense History</h3>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {expenses.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#64748b]">No expenses recorded yet</p>
                </div>
              ) : (
                expenses.map(expense => {
                  const categoryStyle = getCategoryBadge(expense.category);
                  
                  return (
                    <div key={expense.id} className="p-6 flex items-center justify-between hover:bg-[#f8fafc]">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${categoryStyle.bg}`}>
                          <i className="fas fa-receipt text-sm"></i>
                        </div>
                        <div>
                          <h4 className="font-semibold text-[#1e293b]">{expense.description}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${categoryStyle.bg} ${categoryStyle.color}`}>
                              {categoryStyle.label}
                            </span>
                            <span className="text-sm text-[#64748b]">{new Date(expense.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-red-600">-${expense.amount.toFixed(2)}</span>
                        <button 
                          className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="p-6 border-b border-[#e2e8f0]">
              <h3 className="text-lg font-bold text-[#1e293b]">Revenue History</h3>
            </div>
            <div className="divide-y divide-[#e2e8f0]">
              {orders.filter(order => order.status === 'completed').length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-[#64748b]">No completed orders yet</p>
                </div>
              ) : (
                orders.filter(order => order.status === 'completed').map(order => (
                  <div key={order.id} className="p-6 flex items-center justify-between hover:bg-[#f8fafc]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <i className="fas fa-shopping-cart text-green-600"></i>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#1e293b]">Order #{order.id.slice(-6)}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-[#64748b]">{order.customerName}</span>
                          <span className="text-sm text-[#64748b]">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg text-green-600">+${(order.total || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[500px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">Add Expense</h2>
              <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setShowExpenseModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Category *</label>
                  <select 
                    value={newExpense.category} 
                    onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value as Expense["category"] }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                  >
                    <option value="supplies">Supplies</option>
                    <option value="utilities">Utilities</option>
                    <option value="rent">Rent</option>
                    <option value="marketing">Marketing</option>
                    <option value="salaries">Salaries</option>
                    <option value="equipment">Equipment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Amount ($)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={newExpense.amount} 
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Description *</label>
                  <input 
                    type="text" 
                    value={newExpense.description} 
                    onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                    placeholder="e.g., Office supplies for March"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Date *</label>
                  <input 
                    type="date" 
                    value={newExpense.date} 
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button 
                className="px-6 py-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-sm hover:bg-[#e2e8f0]" 
                onClick={() => setShowExpenseModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" 
                onClick={createExpense}
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}