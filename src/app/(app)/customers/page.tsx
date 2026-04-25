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
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [spendingMin, setSpendingMin] = useState<number | "">("");
  const [spendingMax, setSpendingMax] = useState<number | "">("");

  useEffect(() => {
    if (!user) return;
    loadCustomers();
  }, [user]);

  const loadCustomers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await customerService.getClients(user);
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
      
      await customerService.createClient(user, {
        name: fullName,
        phone: fullPhone,
        email: newCustomer.email.trim() || undefined,
        location: fullAddress || undefined,
        notes: newCustomer.notes.trim() || undefined,
        initials: `${newCustomer.firstName.charAt(0)}${newCustomer.lastName.charAt(0)}`.toUpperCase(),
        status: 'new',
        verified: false,
        visits: 0,
        totalSpent: 0,
        rating: 0,
        services: [],
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
      await customerService.deleteClient(user, selectedCustomer.id);
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
      const orders = await orderService.getOrders(user);
      const customerOrders = orders.filter(o => o.customerId === customerId);
      setCustomerOrders(customerOrders);
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
    const headers = ["Name", "Phone", "Email", "Location", "Total Spent", "Visits", "Status", "Created"];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.phone,
      c.email || '',
      c.location || '',
      c.totalSpent || 0,
      c.visits || 0,
      c.status,
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
      await customerService.updateClient(user, selectedCustomer.id, { notes: customerNotes });
      loadCustomers();
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const updateCustomerTags = async () => {
    if (!user || !selectedCustomer) return;
    try {
      // Tags not supported in Client interface, skip for now
      alert('Tags feature coming soon!');
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

  // Analytics calculations
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const newCustomers = customers.filter(c => c.status === 'new').length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Bulk selection handlers
  const selectAllCustomers = () => {
    if (bulkSelected.length === filteredCustomers.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredCustomers.map(c => c.id));
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setBulkSelected(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'active' | 'new' | 'vip' | 'inactive') => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => customerService.updateClient(user, id, { status: newStatus }))
      );
      loadCustomers();
      setBulkSelected([]);
      setBulkMode(false);
      alert(`Updated ${bulkSelected.length} customers to ${newStatus}`);
    } catch (error) {
      console.error("Error updating customers:", error);
      alert("Failed to update some customers");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => customerService.deleteClient(user, id))
      );
      loadCustomers();
      setBulkSelected([]);
      setBulkMode(false);
      alert(`Deleted ${bulkSelected.length} customers`);
    } catch (error) {
      console.error("Error deleting customers:", error);
      alert("Failed to delete some customers");
    }
  };

  // Duplicate customer
  const handleDuplicateCustomer = async (customer: Customer) => {
    if (!user) return;
    try {
      const initials = customer.initials || customer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      await customerService.createClient(user, {
        name: `${customer.name} (Copy)`,
        phone: customer.phone,
        email: customer.email,
        location: customer.location,
        notes: customer.notes,
        initials: initials,
        status: customer.status,
        verified: customer.verified,
        visits: customer.visits,
        totalSpent: customer.totalSpent,
        rating: customer.rating,
        services: customer.services,
      });
      loadCustomers();
      alert('Customer duplicated successfully!');
    } catch (error) {
      console.error("Error duplicating customer:", error);
      alert("Failed to duplicate customer");
    }
  };

  // Print customer profile
  const printCustomerProfile = (customer: Customer) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Profile - ${customer.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #25D366; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #25D366; }
          .avatar { width: 100px; height: 100px; border-radius: 50%; margin: 20px auto; display: flex; align-items: center; justify-content: center; font-size: 40px; color: white; font-weight: bold; }
          .name { font-size: 28px; font-weight: bold; margin: 10px 0; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
          .section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          .info-label { font-weight: 600; color: #64748b; }
          .info-value { font-weight: 500; color: #1e293b; }
          .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .stat-card { background: #f8fafc; padding: 15px; border-radius: 12px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #25D366; }
          .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">CUSTOMER PROFILE</div>
          <div class="avatar" style="background: linear-gradient(135deg, #25D366, #128C7E);">
            ${customer.initials || customer.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
          </div>
          <div class="name">${customer.name}</div>
          <div class="status" style="background: ${customer.status === 'vip' ? '#fef3c7; color: #f59e0b' : customer.status === 'active' ? '#dcfce7; color: #10b981' : customer.status === 'new' ? '#dbeafe; color: #3b82f6' : '#fee2e2; color: #ef4444'}; text-transform: capitalize;">
            ${customer.status}
          </div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${formatCurrency(customer.totalSpent || 0)}</div>
            <div class="stat-label">Total Spent</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${customer.visits || 0}</div>
            <div class="stat-label">Visits</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${customer.visits || 0}</div>
            <div class="stat-label">Visits</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contact Information</div>
          <div class="info-row">
            <span class="info-label">Phone</span>
            <span class="info-value">${customer.phone}</span>
          </div>
          ${customer.email ? `
          <div class="info-row">
            <span class="info-label">Email</span>
            <span class="info-value">${customer.email}</span>
          </div>` : ''}
          ${customer.location ? `
          <div class="info-row">
            <span class="info-label">Address</span>
            <span class="info-value">${customer.location}</span>
          </div>` : ''}
        </div>

        ${customer.rating ? `
        <div class="section">
          <div class="section-title">Rating</div>
          <div class="info-row">
            <span class="info-label">Customer Rating</span>
            <span class="info-value">${customer.rating.toFixed(1)} ⭐</span>
          </div>
        </div>` : ''}

        ${customer.notes ? `
        <div class="section">
          <div class="section-title">Notes</div>
          <p style="color: #64748b; line-height: 1.6;">${customer.notes}</p>
        </div>` : ''}

        <div style="margin-top: 40px; text-align: center; color: #64748b; border-top: 2px solid #e2e8f0; padding-top: 20px;">
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Share customer via WhatsApp
  const shareCustomerWhatsApp = (customer: Customer) => {
    const message = `👤 *Customer Contact*\n\n*Name:* ${customer.name}\n📱 *Phone:* ${customer.phone}${customer.email ? `\n📧 *Email:* ${customer.email}` : ''}${customer.location ? `\n📍 *Location:* ${customer.location}` : ''}\n\n💰 *Total Spent:* ${formatCurrency(customer.totalSpent || 0)}\n⭐ *Rating:* ${customer.rating ? customer.rating.toFixed(1) : 'N/A'}\n\nSave this contact!`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const openCustomerModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerNotes(customer.notes || "");
    setCustomerTags([]);
    setShowModal(true);
  };

  const filteredCustomers = customers.filter(c => {
    // Search filter
    if (searchTerm && !c.name.toLowerCase().includes(searchTerm.toLowerCase()) && !c.phone.includes(searchTerm)) return false;
    
    // Status filter
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    
    // Date range filter
    if (dateRangeStart || dateRangeEnd) {
      const customerDate = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
      if (dateRangeStart && customerDate < new Date(dateRangeStart)) return false;
      if (dateRangeEnd) {
        const endDate = new Date(dateRangeEnd);
        endDate.setHours(23, 59, 59, 999);
        if (customerDate > endDate) return false;
      }
    }
    
    // Spending range filter
    if (spendingMin !== "" && (c.totalSpent || 0) < Number(spendingMin)) return false;
    if (spendingMax !== "" && (c.totalSpent || 0) > Number(spendingMax)) return false;
    
    return true;
  }).sort((a, b) => {
    switch(sortBy) {
      case "highestLTV":
        return (b.totalSpent || 0) - (a.totalSpent || 0);
      case "mostOrders":
        return (b.visits || 0) - (a.visits || 0);
      case "name":
        return a.name.localeCompare(b.name);
      case "oldest":
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "visits":
        return (b.visits || 0) - (a.visits || 0);
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
          <button 
            className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-xl font-semibold text-sm shadow-lg transition-all ${bulkMode ? 'bg-[#ef4444] text-white' : 'bg-white border-2 border-[#e2e8f0] text-[#64748b]'}`}
            onClick={() => { setBulkMode(!bulkMode); setBulkSelected([]); }}
          >
            <i className={`fas ${bulkMode ? 'fa-times' : 'fa-check-square'} mr-2`}></i>
            <span className="hidden md:inline">{bulkMode ? 'Cancel' : 'Select'}</span>
          </button>
          <button className="flex-1 md:flex-none px-3 md:px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" onClick={() => setShowAddModal(true)}>
            <i className="fas fa-user-plus mr-2"></i><span className="hidden md:inline">Add Customer</span><span className="md:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#DCF8C6] rounded-xl flex items-center justify-center">
              <i className="fas fa-users text-[#25D366] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">Total</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{totalCustomers}</div>
          <div className="text-xs text-[#64748b] mt-1">All Customers</div>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#dcfce7] rounded-xl flex items-center justify-center">
              <i className="fas fa-check-circle text-[#10b981] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">Active</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{activeCustomers}</div>
          <div className="text-xs text-[#64748b] mt-1">Active Status</div>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#fef3c7] rounded-xl flex items-center justify-center">
              <i className="fas fa-crown text-[#f59e0b] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">VIP</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{vipCustomers}</div>
          <div className="text-xs text-[#64748b] mt-1">VIP Customers</div>
        </div>
        <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-[#dbeafe] rounded-xl flex items-center justify-center">
              <i className="fas fa-coins text-[#3b82f6] text-lg md:text-xl"></i>
            </div>
            <span className="text-xs text-[#64748b] font-semibold">Revenue</span>
          </div>
          <div className="font-extrabold text-xl md:text-2xl text-[#1e293b]">{formatCurrency(totalRevenue)}</div>
          <div className="text-xs text-[#64748b] mt-1">Total Revenue</div>
        </div>
      </div>

      

      <div className="bg-white rounded-xl md:rounded-2xl p-3 md:p-4 mb-4 flex flex-col md:flex-row gap-3 md:gap-4 border border-[#e2e8f0] justify-between">
        <div className="flex gap-2 md:gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[150px] md:min-w-[280px]">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
            <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" />
          </div>
          
          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
              onChange={(e) => setSpendingMin(e.target.value ? Number(e.target.value) : "")}
              className="px-3 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm w-24"
            />
            <input 
              type="number" 
              placeholder="Max Spent" 
              value={spendingMax} 
              onChange={(e) => setSpendingMax(e.target.value ? Number(e.target.value) : "")}
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

          <select className="px-4 py-2 bg-[#f8fafc] border-2 border-[#e2e8f0] rounded-xl text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest</option>
            <option value="highestLTV">Highest LTV</option>
            <option value="mostOrders">Most Orders</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Rating</option>
            <option value="visits">Visits</option>
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
          {/* Bulk Operations Bar */}
          {bulkMode && filteredCustomers.length > 0 && (
            <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={bulkSelected.length === filteredCustomers.length && filteredCustomers.length > 0}
                  onChange={selectAllCustomers}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366]"
                />
                <span className="text-sm font-semibold text-[#1e293b]">Select All ({filteredCustomers.length})</span>
              </label>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkStatusUpdate('active')}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#dcfce7] text-[#10b981] rounded-lg text-xs font-semibold hover:bg-[#10b981] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-check mr-1"></i>Activate
                </button>
                <button 
                  onClick={() => handleBulkStatusUpdate('vip')}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#fef3c7] text-[#f59e0b] rounded-lg text-xs font-semibold hover:bg-[#f59e0b] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-crown mr-1"></i>VIP
                </button>
                <button 
                  onClick={() => handleBulkDelete()}
                  disabled={bulkSelected.length === 0}
                  className="px-3 py-1.5 bg-[#fee2e2] text-[#ef4444] rounded-lg text-xs font-semibold hover:bg-[#ef4444] hover:text-white disabled:opacity-50"
                >
                  <i className="fas fa-trash mr-1"></i>Delete
                </button>
              </div>
            </div>
          )}

          {/* Mobile List View */}
          <div className="md:hidden space-y-2 mb-4">
            {filteredCustomers.map(customer => (
              <div key={customer.id} className="bg-white rounded-xl p-3 border border-[#e2e8f0] shadow-sm">
                <div className="flex items-center gap-3">
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={bulkSelected.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366] flex-shrink-0"
                    />
                  )}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center font-bold text-sm text-white flex-shrink-0`} onClick={() => !bulkMode && openCustomerModal(customer)}>
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => !bulkMode && openCustomerModal(customer)}>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm truncate">{customer.name}</div>
                      <span className="font-bold text-[#25D366] text-sm ml-2">{formatCurrency(customer.totalSpent)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-[#64748b]"><i className="fab fa-whatsapp text-[#25D366] mr-1"></i>{customer.phone}</span>
                    </div>
                  </div>
                  {!bulkMode && (
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          shareCustomerWhatsApp(customer);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#25D366] hover:bg-[#f1f5f9] rounded-lg"
                        title="Share via WhatsApp"
                      >
                        <i className="fab fa-whatsapp text-sm"></i>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          printCustomerProfile(customer);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#3b82f6] hover:bg-[#f1f5f9] rounded-lg"
                        title="Print Profile"
                      >
                        <i className="fas fa-print text-sm"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          {filteredCustomers.map(customer => (
            <div key={customer.id} className={`bg-white rounded-2xl p-5 border border-[#e2e8f0] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all ${bulkMode ? 'cursor-default' : 'cursor-pointer'}`} onClick={() => !bulkMode && openCustomerModal(customer)}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {bulkMode && (
                    <input
                      type="checkbox"
                      checked={bulkSelected.includes(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 rounded border-[#e2e8f0] text-[#25D366] focus:ring-[#25D366] flex-shrink-0"
                    />
                  )}
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center font-bold text-lg text-white relative`}>
                    {getInitials(customer.name)}
                    <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${customer.status === 'vip' ? 'bg-[#f59e0b]' : customer.status === 'active' ? 'bg-[#10b981]' : customer.status === 'new' ? 'bg-[#3b82f6]' : 'bg-[#64748b]'}`}></span>
                  </div>
                  <div>
                    <div className="font-bold text-[#1e293b]">{customer.name}</div>
                    <div className="text-xs text-[#64748b] capitalize">{customer.status}</div>
                  </div>
                </div>
                {!bulkMode && (
                  <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-[#f8fafc] rounded-xl">
                <div className="text-center">
                  <div className="font-extrabold text-[#25D366] text-lg">{formatCurrency(customer.totalSpent)}</div>
                  <div className="text-xs text-[#64748b] uppercase font-semibold">Spent</div>
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-[#1e293b] text-lg">{customer.visits || 0}</div>
                  <div className="text-xs text-[#64748b] uppercase font-semibold">Visits</div>
                </div>
                <div className="text-center">
                  <div className="font-extrabold text-[#1e293b] text-lg">{customer.rating ? customer.rating.toFixed(1) : '-'}</div>
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
                {customer.location && (
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <i className="fas fa-map-marker-alt w-8 h-8 bg-[#f8fafc] rounded-lg flex items-center justify-center text-[#25D366]"></i>
                    {customer.location}
                  </div>
                )}
              </div>

              {!bulkMode && (
                <div className="grid grid-cols-4 gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); sendWhatsAppMessage(customer.phone); }} 
                    className="py-2 px-2 bg-[#DCF8C6] text-[#128C7E] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all"
                    title="Send WhatsApp"
                  >
                    <i className="fab fa-whatsapp"></i>
                    <span className="hidden lg:inline">Message</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); shareCustomerWhatsApp(customer); }} 
                    className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#25D366] hover:text-white transition-all"
                    title="Share via WhatsApp"
                  >
                    <i className="fas fa-share-alt"></i>
                    <span className="hidden lg:inline">Share</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDuplicateCustomer(customer); }} 
                    className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#3b82f6] hover:text-white transition-all"
                    title="Duplicate Customer"
                  >
                    <i className="fas fa-copy"></i>
                    <span className="hidden lg:inline">Copy</span>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); printCustomerProfile(customer); }} 
                    className="py-2 px-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#3b82f6] hover:text-white transition-all"
                    title="Print Profile"
                  >
                    <i className="fas fa-print"></i>
                    <span className="hidden lg:inline">Print</span>
                  </button>
                </div>
              )}
              {bulkMode && (
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleBulkStatusUpdate('active'); toggleCustomerSelection(customer.id); }}
                    className="py-2 px-2 bg-[#dcfce7] text-[#10b981] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#10b981] hover:text-white transition-all"
                  >
                    <i className="fas fa-check"></i>Activate
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleBulkStatusUpdate('vip'); toggleCustomerSelection(customer.id); }}
                    className="py-2 px-2 bg-[#fef3c7] text-[#f59e0b] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#f59e0b] hover:text-white transition-all"
                  >
                    <i className="fas fa-crown"></i>VIP
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleBulkDelete(); toggleCustomerSelection(customer.id); }}
                    className="py-2 px-2 bg-[#fee2e2] text-[#ef4444] rounded-xl font-semibold text-xs flex items-center justify-center gap-1 hover:bg-[#ef4444] hover:text-white transition-all"
                  >
                    <i className="fas fa-trash"></i>Delete
                  </button>
                </div>
              )}
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
                      <div><div className="text-xs text-[#64748b]">Location</div><div className="font-bold">{selectedCustomer.location || "N/A"}</div></div>
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
                        <h3 className="font-bold">{selectedCustomer.visits || 0} Visits • {formatCurrency(selectedCustomer.totalSpent)} Total</h3>
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
