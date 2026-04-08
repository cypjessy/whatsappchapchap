"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { customerService, Customer, orderService, Order } from "@/lib/db";

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSegment, setActiveSegment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [sortBy, setSortBy] = useState("recent");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [customerNotes, setCustomerNotes] = useState("");
  const [customerTags, setCustomerTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (!user) return;
    loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await customerService.getCustomers(user);
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const saveNewCustomer = async () => {
    if (!user) return;
    try {
      await customerService.createCustomer(user, {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        address: newCustomer.address,
        notes: newCustomer.notes,
      });
      loadCustomers();
      setShowAddModal(false);
      setNewCustomer({ name: "", email: "", phone: "", address: "", notes: "" });
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const deleteCustomer = async () => {
    if (!user || !selectedCustomer) return;
    try {
      await customerService.deleteCustomer(user, selectedCustomer.id);
      loadCustomers();
      setShowModal(false);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const loadCustomerOrders = async (customerId: string) => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const orders = await orderService.getOrdersByCustomerId(user, customerId);
      setCustomerOrders(orders);
    } catch (error) {
      console.error("Error loading customer orders:", error);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const sendWhatsAppMessage = (phone: string, message: string = "") => {
    if (!phone) {
      alert("No phone number available for this customer");
      return;
    }
    const defaultMsg = encodeURIComponent("Hi! Just checking in. How can we help you?");
    const msg = message ? encodeURIComponent(message) : defaultMsg;
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, "_blank");
  };

  const exportToCSV = () => {
    const headers = ["Name", "Phone", "Email", "Address", "Total Spent", "Orders", "Segment", "Created"];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.phone,
      c.email,
      c.address,
      c.totalSpent || 0,
      c.orderCount || 0,
      c.segment || "regular",
      c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : "N/A"
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      alert("Please enter a message");
      return;
    }
    setSendingBroadcast(true);
    try {
      const customersToMessage = activeSegment === "all" 
        ? customers 
        : customers.filter(c => c.segment === activeSegment);
      
      for (const customer of customersToMessage) {
        if (customer.phone) {
          sendWhatsAppMessage(customer.phone, broadcastMessage);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      alert(`Broadcast sent to ${customersToMessage.length} customers!`);
      setShowBroadcastModal(false);
      setBroadcastMessage("");
    } catch (error) {
      console.error("Error sending broadcast:", error);
    } finally {
      setSendingBroadcast(false);
    }
  };

  const updateCustomerNotes = async () => {
    if (!user || !selectedCustomer) return;
    try {
      await customerService.updateCustomer(user, selectedCustomer.id, { notes: customerNotes });
      loadCustomers();
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const updateCustomerTags = async () => {
    if (!user || !selectedCustomer) return;
    try {
      await customerService.updateCustomer(user, selectedCustomer.id, { tags: customerTags });
      loadCustomers();
    } catch (error) {
      console.error("Error updating tags:", error);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (!customerTags.includes(newTag.trim())) {
      setCustomerTags([...customerTags, newTag.trim()]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setCustomerTags(customerTags.filter(t => t !== tag));
  };

  const openCustomerModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerNotes(customer.notes || "");
    setCustomerTags(customer.tags || []);
    setShowModal(true);
  };

  const filteredCustomers = customers.filter(c => {
    if (activeSegment !== "all") {
      const segmentMap: Record<string, string> = {
        vip: "vip",
        frequent: "frequent",
        new: "new",
        "at-risk": "at-risk",
        inactive: "inactive"
      };
      if (segmentMap[activeSegment] !== c.segment) return false;
    }
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.phone.includes(searchTerm)) return false;
    return true;
  }).sort((a, b) => {
    switch(sortBy) {
      case "highestLTV":
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      case "mostOrders":
        return (b.orderCount || 0) - (a.orderCount || 0);
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const segments = [
    { id: "all", label: "All Customers", count: customers.length },
    { id: "vip", label: "VIP", icon: "fa-crown", iconColor: "text-[#fbbf24]", count: customers.filter(c => c.segment === "vip").length },
    { id: "frequent", label: "Frequent Buyers", icon: "fa-shopping-bag", iconColor: "text-[#25D366]", count: customers.filter(c => c.segment === "frequent").length },
    { id: "new", label: "New (30 days)", icon: "fa-star", iconColor: "text-[#3b82f6]", count: customers.filter(c => c.segment === "new").length },
    { id: "at-risk", label: "At Risk", icon: "fa-exclamation-triangle", iconColor: "text-[#f59e0b]", count: customers.filter(c => c.segment === "at-risk").length },
    { id: "inactive", label: "Inactive", icon: "fa-moon", iconColor: "text-[#64748b]", count: customers.filter(c => c.segment === "inactive").length },
  ];

  const getStatusClass = (status: string) => {
    switch(status) {
      case "online": return "bg-[#10b981]";
      case "recent": return "bg-[#f59e0b]";
      default: return "bg-[#64748b]";
    }
  };

  const getTierClass = (tier: string) => {
    switch(tier) {
      case "VIP": return "bg-gradient-to-r from-[#fbbf24] to-[#f59e0b] text-white";
      case "New": return "bg-[#DCF8C6] text-[#128C7E]";
      default: return "bg-[#f1f5f9] text-[#64748b]";
    }
  };

  const getColorFromString = (str: string) => {
    const colors = ["from-[#fbbf24] to-[#f59e0b]", "from-[#3b82f6] to-[#2563eb]", "from-[#ec4899] to-[#db2777]", "from-[#8b5cf6] to-[#7c3aed]", "from-[#10b981] to-[#059669]", "from-[#64748b] to-[#475569]"];
    const hash = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-users text-[#25D366]"></i>Customer Management
          </h1>
          <p className="text-[#64748b]">Build relationships and grow your business with smart CRM tools</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2">
            <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] text-center min-w-[100px]">
              <div className="text-2xl font-extrabold text-[#8b5cf6]">{customers.length}</div>
              <div className="text-xs text-[#64748b]">Total</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] text-center min-w-[100px]">
              <div className="text-2xl font-extrabold text-[#10b981]">{customers.filter(c => c.segment === "new").length}</div>
              <div className="text-xs text-[#64748b]">New</div>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] text-center min-w-[100px]">
              <div className="text-2xl font-extrabold text-[#f59e0b]">{customers.filter(c => c.segment === "frequent").length}</div>
              <div className="text-xs text-[#64748b]">Active</div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={exportToCSV}>
            <i className="fas fa-download mr-2"></i>Export
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-user-plus mr-2"></i>Add Customer
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-radial-gradient from-white/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex justify-between items-center relative z-10 flex-wrap gap-4">
          <div className="flex gap-8 flex-wrap">
            <div className="text-center">
              <div className="text-3xl font-extrabold">{formatCurrency(customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / (customers.length || 1))}</div>
              <div className="text-sm opacity-80">Avg. LTV</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">4.8</div>
              <div className="text-sm opacity-80">Avg. Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">68%</div>
              <div className="text-sm opacity-80">Retention</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold">{Number(customers.reduce((sum, c) => sum + (c.orderCount || 0), 0) / (customers.length || 1)).toFixed(0)}</div>
              <div className="text-sm opacity-80">Avg. Orders</div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white text-[#8b5cf6] rounded-xl font-semibold text-sm">
              <i className="fas fa-chart-pie mr-2"></i>Segments
            </button>
            <button className="px-4 py-2 bg-white/10 text-white rounded-xl font-semibold text-sm border border-white/20">
              <i className="fas fa-robot mr-2"></i>AI Insights
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-4 flex gap-4 border border-[#e2e8f0] flex-wrap justify-between">
        <div className="flex gap-4 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[280px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
            <input type="text" placeholder="Search by name, phone, or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" />
          </div>
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm">
            <option>All Tiers</option>
            <option>VIP</option>
            <option>Regular</option>
            <option>New</option>
          </select>
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="highestLTV">Highest LTV</option>
            <option value="mostOrders">Most Orders</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
        <button className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={() => setShowBroadcastModal(true)}>
          <i className="fas fa-broadcast-tower mr-2"></i>Broadcast
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        {segments.map(seg => (
          <button key={seg.id} onClick={() => setActiveSegment(seg.id)} className={`px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-all ${activeSegment === seg.id ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"}`}>
            {seg.icon && <i className={`fas ${seg.icon} ${activeSegment === seg.id ? '' : seg.iconColor}`}></i>}
            {seg.label}
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">{seg.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-2xl text-[#64748b]"></i>
          </div>
          <h4 className="font-bold text-[#1e293b] mb-2">No customers yet</h4>
          <p className="text-sm text-[#64748b]">Add your first customer to start building your CRM.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer" onClick={() => openCustomerModal(customer)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center font-bold text-lg text-white relative`}>
                    {getInitials(customer.name)}
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white bg-[#64748b]`}></span>
                  </div>
                  <div>
                    <div className="font-bold text-[#1e293b]">{customer.name}</div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${getTierClass(customer.segment === "vip" ? "VIP" : customer.segment === "new" ? "New" : "Regular")}`}>
                      {customer.segment === "vip" && <i className="fas fa-crown text-xs"></i>}
                      {customer.segment || "Regular"}
                    </span>
                  </div>
                </div>
                <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#f8fafc] rounded-xl">
                <div className="text-center">
                  <div className="font-extrabold text-[#25D366] text-lg">{formatCurrency(customer.totalSpent)}</div>
                  <div className="text-xs text-[#64748b] uppercase font-semibold">Spent</div>
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-[#1e293b] text-lg">{customer.orderCount || 0}</div>
                  <div className="text-xs text-[#64748b] uppercase font-semibold">Orders</div>
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-[#1e293b] text-lg">-</div>
                  <div className="text-xs text-[#64748b] uppercase font-semibold">Rating</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-[#64748b]">
                  <i className="fab fa-whatsapp w-8 h-8 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#25D366]"></i>
                  {customer.phone}
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <i className="fas fa-envelope w-8 h-8 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#25D366]"></i>
                    {customer.email}
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <i className="fas fa-map-marker-alt w-8 h-8 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#25D366]"></i>
                    {customer.address}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {customer.tags?.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-[#f1f5f9] rounded-full text-xs font-semibold text-[#64748b]">{tag}</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={(e) => { e.stopPropagation(); sendWhatsAppMessage(customer.phone); }} className="py-2 px-3 bg-[#DCF8C6] text-[#128C7E] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#25D366] hover:text-white transition-all">
                  <i className="fab fa-whatsapp"></i>
                  Message
                </button>
                <button onClick={(e) => { e.stopPropagation(); openCustomerModal(customer); }} className="py-2 px-3 bg-[#f1f5f9] text-[#1e293b] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#1e293b] hover:text-white transition-all">
                  <i className="fas fa-eye"></i>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#e2e8f0]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <i className="fas fa-clock text-[#3b82f6]"></i>Recent Activity
            </h3>
            <button className="px-3 py-1.5 border-2 border-[#e2e8f0] rounded-lg text-sm font-semibold hover:border-[#25D366]">View All</button>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc]">
              <div className="w-10 h-10 rounded-full bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center"><i className="fas fa-user-plus"></i></div>
              <div>
                <div className="font-semibold">New customer added</div>
                <div className="text-xs text-[#64748b]">Just now</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <i className="fas fa-chart-line text-[#10b981]"></i>Growth Stats
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-sm">New Customers</span>
                <span className="text-[#10b981] font-bold">+{customers.filter(c => c.segment === "new").length}</span>
              </div>
              <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-[#10b981] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-sm">Retention Rate</span>
                <span className="text-[#25D366] font-bold">68%</span>
              </div>
              <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className="h-full w-[68%] bg-[#25D366] rounded-full"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-sm">Satisfaction</span>
                <span className="text-[#f59e0b] font-bold">4.8/5</span>
              </div>
              <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div className="h-full w-[96%] bg-[#f59e0b] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-8 overflow-y-auto flex items-start justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[#f8fafc] to-white">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getColorFromString(selectedCustomer.name)} flex items-center justify-center text-3xl font-bold text-white`}>
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold mb-1">{selectedCustomer.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getTierClass(selectedCustomer.segment === "vip" ? "VIP" : selectedCustomer.segment === "new" ? "New" : "Regular")}`}>
                      <i className="fas fa-crown mr-1"></i>{selectedCustomer.segment || "Regular"} Customer
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
                <div className="flex flex-col gap-4">
                  <div className="bg-[#f8fafc] rounded-2xl p-5">
                    <button onClick={() => sendWhatsAppMessage(selectedCustomer.phone)} className="w-full py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 mb-3">
                      <i className="fab fa-whatsapp"></i>Send WhatsApp
                    </button>
                    <button onClick={() => selectedCustomer.email && window.open(`mailto:${selectedCustomer.email}`)} className="w-full py-3 bg-[#f1f5f9] text-[#1e293b] rounded-xl font-bold border-2 border-[#e2e8f0] flex items-center justify-center gap-2">
                      <i className="fas fa-envelope"></i>Send Email
                    </button>
                    <button onClick={() => setShowDeleteConfirm(true)} className="w-full py-3 bg-[rgba(239,68,68,0.1)] text-[#ef4444] rounded-xl font-bold border-2 border-[#ef4444] flex items-center justify-center gap-2 mt-2">
                      <i className="fas fa-trash"></i>Delete
                    </button>
                    <div className="mt-4 pt-4 border-t border-[#e2e8f0] space-y-3">
                      <div><div className="text-xs text-[#64748b]">Phone</div><div className="font-bold">{selectedCustomer.phone}</div></div>
                      <div><div className="text-xs text-[#64748b]">Email</div><div className="font-bold">{selectedCustomer.email || "N/A"}</div></div>
                      <div><div className="text-xs text-[#64748b]">Address</div><div className="font-bold">{selectedCustomer.address || "N/A"}</div></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
                    <h4 className="font-bold mb-3">Customer Notes</h4>
                    <textarea 
                      className="w-full bg-[#f8fafc] p-3 rounded-xl text-sm text-[#64748b] mb-3 resize-none min-h-[80px] focus:outline-none focus:border-[#25D366] border border-[#e2e8f0]"
                      placeholder="Add notes about this customer..."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                    ></textarea>
                    <button onClick={updateCustomerNotes} className="w-full py-2 border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
                      <i className="fas fa-save mr-2"></i>Save Note
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex gap-2 border-b-2 border-[#e2e8f0] mb-4">
                    {["orders", "messages", "activity", "preferences"].map(tab => (
                      <button key={tab} onClick={() => { setActiveTab(tab); if (tab === "orders") loadCustomerOrders(selectedCustomer.id); }} className={`px-4 py-3 font-bold capitalize ${activeTab === tab ? "text-[#25D366] border-b-2 border-[#25D366]" : "text-[#64748b]"}`}>{tab}</button>
                    ))}
                  </div>

                  {activeTab === "orders" && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">{selectedCustomer.orderCount || 0} Orders • {formatCurrency(selectedCustomer.totalSpent)} Total</h3>
                      </div>
                      {loadingOrders ? (
                        <div className="text-center py-8">
                          <div className="w-8 h-8 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
                        </div>
                      ) : customerOrders.length === 0 ? (
                        <p className="text-[#64748b]">No orders found for this customer</p>
                      ) : (
                        <div className="space-y-2">
                          {customerOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-xl">
                              <div>
                                <div className="font-semibold text-sm">Order #{order.id.substring(0, 8)}</div>
                                <div className="text-xs text-[#64748b]">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "N/A"}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(order.total)}</div>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${order.status === "pending" ? "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]" : order.status === "processing" ? "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]" : order.status === "delivered" ? "bg-[rgba(37,211,102,0.1)] text-[#10b981]" : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"}`}>{order.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "messages" && (
                    <div className="bg-[#f8fafc] rounded-2xl p-8 text-center">
                      <i className="fab fa-whatsapp text-5xl text-[#25D366] mb-4"></i>
                      <h3 className="font-bold mb-2">WhatsApp Chat History</h3>
                      <p className="text-[#64748b] mb-4">View all WhatsApp conversations with this customer</p>
                      <button onClick={() => sendWhatsAppMessage(selectedCustomer.phone)} className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold"><i className="fab fa-whatsapp mr-2"></i>Open Chat</button>
                    </div>
                  )}

                  {activeTab === "activity" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc]">
                        <div className="w-10 h-10 rounded-full bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center"><i className="fas fa-user-plus"></i></div>
                        <div><div className="font-semibold">Customer created</div><div className="text-xs text-[#64748b]">Customer added to system</div></div>
                      </div>
                    </div>
                  )}

                  {activeTab === "preferences" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-[#f8fafc] p-4 rounded-xl">
                        <h4 className="font-bold mb-3"><i className="fas fa-tags text-[#ef4444] mr-2"></i>Tags</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {customerTags.map((tag, i) => (
                            <span key={i} className="px-3 py-1 bg-[#f1f5f9] rounded-full text-xs font-semibold text-[#64748b] flex items-center gap-1">
                              {tag}
                              <button onClick={() => removeTag(tag)} className="ml-1 hover:text-[#ef4444]"><i className="fas fa-times"></i></button>
                            </span>
                          ))}
                          {customerTags.length === 0 && <span className="text-sm text-[#64748b]">No tags</span>}
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && addTag()}
                            className="flex-1 px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                            placeholder="Add tag..."
                          />
                          <button onClick={addTag} className="px-3 py-2 bg-[#25D366] text-white rounded-lg text-sm">
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <button onClick={updateCustomerTags} className="w-full mt-3 py-2 border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
                          <i className="fas fa-save mr-2"></i>Save Tags
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <i className="fas fa-user-plus text-[#25D366]"></i>Add New Customer
              </h2>
              <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl" onClick={() => setShowAddModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-sm mb-2">Full Name <span className="text-red-500">*</span></label>
                <input type="text" name="name" value={newCustomer.name} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="Enter full name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-sm mb-2">Phone Number <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={newCustomer.phone} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="+254 712 345 678" />
                </div>
                <div>
                  <label className="block font-semibold text-sm mb-2">Email</label>
                  <input type="email" name="email" value={newCustomer.email} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Address</label>
                <input type="text" name="address" value={newCustomer.address} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="City, Country" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Notes</label>
                <textarea name="notes" value={newCustomer.notes} onChange={handleInputChange} rows={3} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" placeholder="Add any notes about this customer..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={saveNewCustomer}>
                <i className="fas fa-check mr-2"></i>Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {showBroadcastModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBroadcastModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <i className="fas fa-broadcast-tower text-[#25D366]"></i>Broadcast Message
              </h2>
              <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl" onClick={() => setShowBroadcastModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#64748b]">
                This will send a WhatsApp message to all {activeSegment === "all" ? customers.length : customers.filter(c => c.segment === activeSegment).length} customers in the "{segments.find(s => s.id === activeSegment)?.label}" segment.
              </p>
              <div>
                <label className="block font-semibold text-sm mb-2">Message</label>
                <textarea 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none"
                  placeholder="Enter your message..."
                ></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={() => setShowBroadcastModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={sendBroadcast} disabled={sendingBroadcast}>
                {sendingBroadcast ? (
                  <><i className="fas fa-circle-notch fa-spin mr-2"></i>Sending...</>
                ) : (
                  <><i className="fas fa-paper-plane mr-2"></i>Send Broadcast</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-[#ef4444]"></i>
              </div>
              <h2 className="text-xl font-extrabold mb-2">Delete Customer?</h2>
              <p className="text-[#64748b] mb-4">Are you sure you want to delete {selectedCustomer?.name}? This action cannot be undone.</p>
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="px-4 py-2 bg-[#ef4444] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={deleteCustomer}>
                <i className="fas fa-trash mr-2"></i>Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
