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
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    countryCode: "+254",
    customerType: "individual",
    companyName: "",
    businessReg: "",
    taxId: "",
    industry: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "KE",
    addressType: "home",
    segment: "",
    tags: [] as string[],
    preferences: [] as string[],
    orderUpdates: true,
    promotions: true,
    abandonedCart: false,
    notes: "",
  });
  const [newCustomerTag, setNewCustomerTag] = useState("");
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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

  const handleNewCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    if (name === "togglePreference") {
      const pref = value;
      setNewCustomer(prev => ({
        ...prev,
        preferences: prev.preferences.includes(pref)
          ? prev.preferences.filter(p => p !== pref)
          : [...prev.preferences, pref]
      }));
    } else if (type === "checkbox") {
      setNewCustomer(prev => ({ ...prev, [name]: checked }));
    } else {
      setNewCustomer(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateNewCustomer = () => {
    const errors: Record<string, string> = {};
    if (!newCustomer.firstName.trim()) errors.firstName = "First name is required";
    if (!newCustomer.lastName.trim()) errors.lastName = "Last name is required";
    if (!newCustomer.phone.trim()) {
      errors.phone = "WhatsApp number is required";
    } else {
      const cleanPhone = newCustomer.phone.replace(/[^0-9]/g, "");
      if (cleanPhone.length < 6) errors.phone = "Enter a valid number";
    }
    if (newCustomer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newCustomer.email)) {
      errors.email = "Enter a valid email address";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveNewCustomer = async () => {
    if (!user) return;
    if (!validateNewCustomer()) return;
    setSavingCustomer(true);
    try {
      const fullAddress = newCustomer.address 
        ? `${newCustomer.address}${newCustomer.city ? ', ' + newCustomer.city : ''}${newCustomer.state ? ', ' + newCustomer.state : ''}`
        : "";
      const fullName = `${newCustomer.firstName.trim()} ${newCustomer.lastName.trim()}`.trim();
      const fullPhone = newCustomer.countryCode + newCustomer.phone.replace(/[^0-9]/g, "");
      
      await customerService.createCustomer(user, {
        name: fullName,
        phone: fullPhone,
        email: newCustomer.email.trim() || undefined,
        address: fullAddress || undefined,
        notes: newCustomer.notes.trim() || undefined,
        segment: newCustomer.segment || undefined,
        tags: newCustomer.tags.length > 0 ? newCustomer.tags : undefined,
      });
      loadCustomers();
      setShowAddModal(false);
      setNewCustomer({
        firstName: "", lastName: "", email: "", phone: "", countryCode: "+254",
        customerType: "individual", companyName: "", businessReg: "", taxId: "", industry: "",
        address: "", city: "", state: "", postalCode: "", country: "KE", addressType: "home",
        segment: "", tags: [], preferences: [], orderUpdates: true, promotions: true, abandonedCart: false, notes: ""
      });
      setNewCustomerTag("");
      setFormErrors({});
    } catch (error) {
      console.error("Error creating customer:", error);
    } finally {
      setSavingCustomer(false);
    }
  };

  const addCustomerTag = () => {
    if (!newCustomerTag.trim()) return;
    if (!newCustomer.tags.includes(newCustomerTag.trim())) {
      setNewCustomer(prev => ({ ...prev, tags: [...prev.tags, newCustomerTag.trim()] }));
    }
    setNewCustomerTag("");
  };

  const removeCustomerTag = (tag: string) => {
    setNewCustomer(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      const parts = value.split(" ");
      setNewCustomer((prev) => ({ 
        ...prev, 
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || ""
      }));
    } else {
      setNewCustomer((prev) => ({ ...prev, [name]: value }));
    }
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
      for (const customer of customers) {
        if (customer.phone) {
          sendWhatsAppMessage(customer.phone, broadcastMessage);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      alert(`Broadcast sent to ${customers.length} customers!`);
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

  const getColorFromString = (str: string) => {
    const colors = ["from-[#fbbf24] to-[#f59e0b]", "from-[#3b82f6] to-[#2563eb]", "from-[#ec4899] to-[#db2777]", "from-[#8b5cf6] to-[#7c3aed]", "from-[#10b981] to-[#059669]", "from-[#64748b] to-[#475569]"];
    const hash = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-users text-[#25D366]"></i>Customers
          </h1>
          <p className="text-[#64748b] text-sm hidden md:block">Build relationships and grow your business</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]" onClick={exportToCSV}>
            <i className="fas fa-download mr-2"></i><span className="hidden md:inline">Export</span>
          </button>
          <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-user-plus mr-2"></i><span className="hidden md:inline">Add Customer</span><span className="md:hidden">+</span>
          </button>
        </div>
      </div>

      

      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:gap-4 border border-[#e2e8f0] justify-between">
        <div className="flex gap-2 md:gap-4 flex-1">
          <div className="relative flex-1 min-w-[150px] md:min-w-[280px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" />
          </div>
          
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

      

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="p-8 md:p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-users text-xl md:text-2xl text-[#64748b]"></i>
          </div>
          <h4 className="font-bold text-[#1e293b] mb-2">No customers yet</h4>
          <p className="text-sm text-[#64748b]">Add your first customer to start building your CRM.</p>
        </div>
      ) : (
        <>
          {/* Mobile List View */}
          <div className="md:hidden space-y-2 mb-4">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl p-3 border border-[#e2e8f0] shadow-sm" onClick={() => openCustomerModal(customer)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`}>
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm truncate">{customer.name}</div>
                      <span className="font-bold text-[#25D366] text-sm ml-2">{formatCurrency(customer.totalSpent)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[#64748b]"><i className="fab fa-whatsapp text-[#25D366] mr-1"></i>{customer.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
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
        </>
      )}

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
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-2 md:p-4 overflow-y-auto" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-id-card text-[#25D366]"></i>Basic Information <span className="text-[#ef4444]">*</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">First Name <span className="text-[#ef4444]">*</span></label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"></i>
                      <input type="text" name="firstName" value={newCustomer.firstName} onChange={handleNewCustomerChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.firstName ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="John" />
                    </div>
                    {formErrors.firstName && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">Last Name <span className="text-[#ef4444]">*</span></label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"></i>
                      <input type="text" name="lastName" value={newCustomer.lastName} onChange={handleNewCustomerChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.lastName ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="Kamau" />
                    </div>
                    {formErrors.lastName && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.lastName}</p>}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fab fa-whatsapp text-[#25D366]"></i>Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">WhatsApp Number <span className="text-[#ef4444]">*</span></label>
                    <div className="flex gap-2">
                      <select name="countryCode" value={newCustomer.countryCode} onChange={handleNewCustomerChange} className="px-3 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm bg-white">
                        <option value="+254">🇰🇪 +254</option>
                        <option value="+255">🇹🇿 +255</option>
                        <option value="+256">🇺🇬 +256</option>
                        <option value="+250">🇷🇼 +250</option>
                        <option value="+233">🇬🇭 +233</option>
                        <option value="+234">🇳🇬 +234</option>
                        <option value="+27">🇿🇦 +27</option>
                      </select>
                      <input type="tel" name="phone" value={newCustomer.phone} onChange={handleNewCustomerChange} className={`flex-1 px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.phone ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="712 345 678" />
                    </div>
                    {formErrors.phone && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">Email Address</label>
                    <div className="relative">
                      <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"></i>
                      <input type="email" name="email" value={newCustomer.email} onChange={handleNewCustomerChange} className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${formErrors.email ? "border-[#ef4444] bg-[#fef2f2]" : "border-[#e2e8f0] focus:border-[#25D366]"}`} placeholder="john@example.com" />
                    </div>
                    {formErrors.email && <p className="text-[#ef4444] text-xs mt-1"><i className="fas fa-exclamation-circle mr-1"></i>{formErrors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Customer Type */}
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-users text-[#8b5cf6]"></i>Customer Type
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "individual", label: "Individual", icon: "fa-user", desc: "Regular customer" },
                    { id: "business", label: "Business", icon: "fa-building", desc: "B2B client" },
                    { id: "reseller", label: "Reseller", icon: "fa-exchange-alt", desc: "Bulk buyer" },
                  ].map(type => (
                    <button key={type.id} type="button" onClick={() => setNewCustomer(prev => ({ ...prev, customerType: type.id }))} className={`p-4 rounded-xl border-2 text-center transition-all ${newCustomer.customerType === type.id ? "border-[#25D366] bg-[#DCF8C6]/30" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}`}>
                      <i className={`fas ${type.icon} text-xl mb-2 text-[#64748b]`}></i>
                      <div className="font-bold text-sm">{type.label}</div>
                      <div className="text-xs text-[#64748b]">{type.desc}</div>
                    </button>
                  ))}
                </div>
                {newCustomer.customerType === "business" && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div>
                      <label className="block font-semibold text-sm mb-1.5">Company Name</label>
                      <input type="text" name="companyName" value={newCustomer.companyName} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="ABC Ltd" />
                    </div>
                    <div>
                      <label className="block font-semibold text-sm mb-1.5">Business Reg</label>
                      <input type="text" name="businessReg" value={newCustomer.businessReg} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="BRN-123456" />
                    </div>
                  </div>
                )}
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-map-marker-alt text-[#f59e0b]"></i>Delivery Address
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-semibold text-sm mb-1.5">Street Address</label>
                    <input type="text" name="address" value={newCustomer.address} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="123 Kimathi Street" />
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">City</label>
                    <input type="text" name="city" value={newCustomer.city} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="Nairobi" />
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">State/County</label>
                    <input type="text" name="state" value={newCustomer.state} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="Nairobi County" />
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">Postal Code</label>
                    <input type="text" name="postalCode" value={newCustomer.postalCode} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" placeholder="00100" />
                  </div>
                  <div>
                    <label className="block font-semibold text-sm mb-1.5">Country</label>
                    <select name="country" value={newCustomer.country} onChange={handleNewCustomerChange} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]">
                      <option value="KE">Kenya</option>
                      <option value="TZ">Tanzania</option>
                      <option value="UG">Uganda</option>
                      <option value="RW">Rwanda</option>
                      <option value="GH">Ghana</option>
                      <option value="NG">Nigeria</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Segment & Tags */}
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-tags text-[#ec4899]"></i>Tags
                </h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newCustomer.tags.map((tag, i) => (
                    <span key={i} className="px-3 py-1 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-full text-xs font-semibold flex items-center gap-1.5">
                      {tag}
                      <button type="button" onClick={() => removeCustomerTag(tag)} className="hover:text-red-200">
                        <i className="fas fa-times text-[10px]"></i>
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={newCustomerTag} onChange={(e) => setNewCustomerTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomerTag(); } }} className="flex-1 px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm focus:outline-none focus:border-[#25D366]" placeholder="Add tags (VIP, Bulk Buyer...)" />
                  <button type="button" onClick={addCustomerTag} className="px-3 py-2 bg-[#25D366] text-white rounded-lg text-sm hover:bg-[#128C7E]">
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              </div>

              {/* Communication Preferences */}
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-bell text-[#3b82f6]"></i>Communication Preferences
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-semibold text-sm">Order Updates via WhatsApp</div>
                      <div className="text-xs text-[#64748b]">Send order confirmations and shipping updates</div>
                    </div>
                    <button type="button" onClick={() => setNewCustomer(prev => ({ ...prev, orderUpdates: !prev.orderUpdates }))} className={`w-12 h-6 rounded-full transition-colors relative ${newCustomer.orderUpdates ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newCustomer.orderUpdates ? "left-7" : "left-1"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-semibold text-sm">Promotional Messages</div>
                      <div className="text-xs text-[#64748b]">Send offers, discounts, and new arrivals</div>
                    </div>
                    <button type="button" onClick={() => setNewCustomer(prev => ({ ...prev, promotions: !prev.promotions }))} className={`w-12 h-6 rounded-full transition-colors relative ${newCustomer.promotions ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newCustomer.promotions ? "left-7" : "left-1"}`}></span>
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-xl">
                    <div>
                      <div className="font-semibold text-sm">Abandoned Cart Reminders</div>
                      <div className="text-xs text-[#64748b]">Remind about items left in cart</div>
                    </div>
                    <button type="button" onClick={() => setNewCustomer(prev => ({ ...prev, abandonedCart: !prev.abandonedCart }))} className={`w-12 h-6 rounded-full transition-colors relative ${newCustomer.abandonedCart ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${newCustomer.abandonedCart ? "left-7" : "left-1"}`}></span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-sm font-bold text-[#64748b] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <i className="fas fa-sticky-note text-[#f59e0b]"></i>Additional Notes
                </h3>
                <textarea name="notes" value={newCustomer.notes} onChange={handleNewCustomerChange} rows={3} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" placeholder="Add any notes about this customer..."></textarea>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-[#e2e8f0] flex flex-col md:flex-row justify-between bg-[#f8fafc] rounded-b-2xl gap-3">
              <span className="text-xs text-[#94a3b8] self-center"><span className="text-[#ef4444]">*</span> Required fields</span>
              <div className="flex gap-2 md:gap-3 w-full md:w-auto">
                <button className="flex-1 md:flex-none px-4 md:px-5 py-3 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b] transition-colors min-h-[48px]" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>Cancel</button>
                <button className="flex-1 md:flex-none px-4 md:px-5 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 min-h-[48px]" onClick={saveNewCustomer} disabled={savingCustomer}>
                  {savingCustomer ? <><i className="fas fa-circle-notch fa-spin"></i>Saving...</> : <><i className="fas fa-save"></i><span className="md:hidden">Save</span><span className="hidden md:inline">Save Customer</span></>}
                </button>
              </div>
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
                This will send a WhatsApp message to all {customers.length} customers.
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
