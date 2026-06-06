"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHaptics, useClipboard, useShare, useToast } from "@/hooks/useNativeAndroid";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";
import { useStatusBar } from "@/hooks/useStatusBar";
import { customerService, Customer, Client } from "@/lib/db";
import {
  CustomersHeader,
  CustomerStats,
  CustomerFilters,
  BulkOperationsBar,
  CustomerListView,
  CustomerGridView,
  EmptyState,
  CustomerModal,
  AddCustomerModal,
  DeleteConfirmModal,
} from "./components";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { normalizePhone, isValidWhatsAppPhone } from "@/utils/phoneUtils";

export default function CustomersPage() {
  const { user } = useAuth();
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const { copy } = useClipboard();
  const { share } = useShare();
  const { show: showToastNative } = useToast();

  // Status bar: green when at top, white when scrolled
  const [headerScrolled, setHeaderScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  useStatusBar({
    color: headerScrolled ? '#ffffff' : '#25D366',
    style: headerScrolled ? 'dark' : 'light'
  });

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(false);
  const customersCursorRef = useRef<any>(null);
  const [activeSegment, setActiveSegment] = useState("all");

  const CUSTOMERS_PAGE_SIZE = 20;
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [spendingMin, setSpendingMin] = useState<number | "">("");
  const [spendingMax, setSpendingMax] = useState<number | "">("");

  // Listen for quick action from bottom nav
  useEffect(() => {
    const handleAddCustomer = () => setShowAddModal(true);
    window.addEventListener('open-modal:add-customer', handleAddCustomer);
    return () => window.removeEventListener('open-modal:add-customer', handleAddCustomer);
  }, []);

  // Register modals for Android back button handling
  useModalBackHandler(showModal, () => setShowModal(false));
  useModalBackHandler(showAddModal, () => { setShowAddModal(false); });

  useModalBackHandler(showDeleteConfirm, () => setShowDeleteConfirm(false));

  // Load customers with pagination
  const loadCustomers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    customersCursorRef.current = null;
    try {
      const result = await customerService.getClientsPaginated(user, CUSTOMERS_PAGE_SIZE);
      setCustomers(result.clients);
      customersCursorRef.current = result.lastVisible;
      setHasMoreCustomers(result.hasMore);
    } catch (error) {
      console.error("Error loading customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadMoreCustomers = useCallback(async () => {
    if (!user || !customersCursorRef.current || loadingMore || !hasMoreCustomers) return;
    setLoadingMore(true);
    try {
      const result = await customerService.getClientsPaginated(user, CUSTOMERS_PAGE_SIZE, customersCursorRef.current);
      setCustomers(prev => [...prev, ...result.clients]);
      customersCursorRef.current = result.lastVisible;
      setHasMoreCustomers(result.hasMore);
    } catch (error) {
      console.error("Error loading more customers:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore, hasMoreCustomers]);

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user, loadCustomers]);

  const saveNewCustomer = async (data: { firstName: string; lastName: string; phone: string; status: string; location: string }) => {
    if (!user) return;
    if (!data.firstName.trim() || !data.lastName.trim() || !data.phone.trim()) return;
    setSavingCustomer(true);
    try {
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
      const rawNormalized = normalizePhone(data.phone);
      const fullPhone = rawNormalized.startsWith("254") ? rawNormalized : "254" + rawNormalized.replace(/^0+/, "");

      await customerService.createClient(user, {
        name: fullName,
        phone: fullPhone,
        location: data.location.trim() || undefined,
        initials: `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase(),
        status: data.status as Client["status"],
        verified: false,
        visits: 0,
        totalSpent: 0,
        rating: 0,
        services: [],
      });

      // Send WhatsApp welcome message to new customer
      try {
        const normalizedPhone = normalizePhone(fullPhone);
        if (isValidWhatsAppPhone(normalizedPhone)) {
          const welcomeMessage = [
            "━━━━━━━━━━━━━━━━━━━━",
            "👋 *WELCOME!* 🇰🇪",
            "━━━━━━━━━━━━━━━━━━━━",
            "",
            `Hello *${fullName}*!`,
            "",
            "Thank you for registering with us! 🎉",
            "You're now part of our community.",
            "",
            " *WHAT'S NEXT?*",
            "📦 Browse our products and services",
            "🛒 Place orders directly via WhatsApp",
            "💬 Get real-time order updates",
            "📞 Reach us anytime for support",
            "",
            "━━━━━━━━━━━━━━━━━━━━",
            "✨ *We're excited to serve you!* ✨",
            "━━━━━━━━━━━━━━━━━━━━",
          ].join("\n");

          await sendEvolutionWhatsAppMessage(normalizedPhone, welcomeMessage, user.uid);
          console.log("✅ Welcome WhatsApp sent to:", normalizedPhone);
        }
      } catch (whatsappError) {
        console.error("Failed to send welcome WhatsApp:", whatsappError);
      }

      await notificationSuccess();
      await showToastNative({ text: 'Customer added successfully', duration: 'short' });
      loadCustomers();
      setShowAddModal(false);
    } catch (error: any) {
      console.error("🚨 Error creating customer:", error);
      console.error("   Message:", error?.message || error?.toString());
      console.error("   Code:", error?.code);
      await notificationError();
      const errorMsg = error?.code === 'permission-denied'
        ? 'Permission denied — check Firestore rules'
        : error?.message?.includes('network')
        ? 'Network error — check your connection'
        : 'Failed to add customer';
      await showToastNative({ text: errorMsg, position: 'top' });
    } finally {
      setSavingCustomer(false);
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

  // Analytics calculations
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const vipCustomers = customers.filter(c => c.status === 'vip').length;
  const newCustomers = customers.filter(c => c.status === 'new').length;
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgOrderValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

  // Previous period stats (for trend comparison in CustomerStats)
  const previousPeriodStats = useMemo(() => {
    const activeCusts = customers.filter(c => c.status === 'active');
    const vipCusts = customers.filter(c => c.status === 'vip');
    return {
      totalCustomers: activeCusts.length + vipCusts.length,
      activeCustomers: activeCusts.length,
      vipCustomers: vipCusts.length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) * 0.8, // Approximate previous period as 80% of current
    };
  }, [customers]);

  // Bulk selection handlers
  const selectAllCustomers = () => {
    if (bulkSelected.length === filteredCustomers.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredCustomers.map(c => c.id));
    }
  };

  const toggleCustomerSelection = async (customerId: string) => {
    await impactLight();
    setBulkSelected(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'active' | 'new' | 'vip' | 'inactive') => {
    if (!user || bulkSelected.length === 0) return;
    
    await impactMedium();
    
    try {
      await Promise.all(
        bulkSelected.map(id => customerService.updateClient(user, id, { status: newStatus }))
      );
      loadCustomers();
      await notificationSuccess();
      await showToastNative({ text: `Updated ${bulkSelected.length} customers`, duration: 'short' });
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error updating customers:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to update customers', position: 'top' });
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    
    await impactMedium();
    
    try {
      await Promise.all(
        bulkSelected.map(id => customerService.deleteClient(user, id))
      );
      loadCustomers();
      await showToastNative({ text: `Deleted ${bulkSelected.length} customers`, duration: 'short' });
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error deleting customers:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to delete customers', position: 'top' });
    }
  };

  // Duplicate customer
  const handleDuplicateCustomer = async (customer: Customer) => {
    if (!user) return;
    
    await impactLight();
    
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
      await notificationSuccess();
      await showToastNative({ text: 'Customer duplicated', duration: 'short' });
    } catch (error) {
      console.error("Error duplicating customer:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to duplicate customer', position: 'top' });
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
            <div class="stat-value">${customer.rating ? customer.rating.toFixed(1) : 'N/A'}</div>
            <div class="stat-label">Rating</div>
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
    <div className="overflow-x-hidden px-3 md:px-6 py-3 md:py-4 pb-2 bg-surface-dim">
      {/* Header - now visible on both mobile and desktop */}
      <div className="mb-3 md:mb-6">
        <CustomersHeader
          bulkMode={bulkMode}
          onToggleBulkMode={() => { setBulkMode(!bulkMode); setBulkSelected([]); }}
          onExportCSV={exportToCSV}
          onAddCustomer={() => setShowAddModal(true)}
        />
      </div>

      {/* Stats Section */}
      <CustomerStats
        customers={customers}
        formatCurrency={formatCurrency}
        previousPeriodStats={previousPeriodStats}
      />

      

      <CustomerFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        spendingMin={spendingMin}
        onSpendingMinChange={setSpendingMin}
        spendingMax={spendingMax}
        onSpendingMaxChange={setSpendingMax}
        dateRangeStart={dateRangeStart}
        onDateRangeStartChange={setDateRangeStart}
        dateRangeEnd={dateRangeEnd}
        onDateRangeEndChange={setDateRangeEnd}
        sortBy={sortBy}
        onSortByChange={setSortBy}

        totalCustomers={customers.length}
        filteredCount={filteredCustomers.length}
      />

      {/* Mobile Add Button - Visible at top of page */}
      <div className="md:hidden mb-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-all"
        >
          <i className="fas fa-plus" />
          <span>Add Customer</span>
        </button>
      </div>

      

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-on-surface-variant">Loading customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          hasFilters={searchTerm !== "" || statusFilter !== "all" || spendingMin !== "" || spendingMax !== "" || dateRangeStart !== "" || dateRangeEnd !== ""}
          onClearFilters={() => {
            setSearchTerm("");
            setStatusFilter("all");
            setSpendingMin("");
            setSpendingMax("");
            setDateRangeStart("");
            setDateRangeEnd("");
          }}
        />
      ) : (
        <>
          {/* Bulk Operations Bar */}
          {bulkMode && filteredCustomers.length > 0 && (
            <BulkOperationsBar
              bulkSelected={bulkSelected}
              filteredCustomersCount={filteredCustomers.length}
              onSelectAll={selectAllCustomers}
              onActivate={() => handleBulkStatusUpdate('active')}
              onSetVIP={() => handleBulkStatusUpdate('vip')}
              onDelete={handleBulkDelete}
            />
          )}

          {/* Mobile List View */}
          <CustomerListView
            customers={filteredCustomers}
            bulkMode={bulkMode}
            bulkSelected={bulkSelected}
            onToggleSelection={toggleCustomerSelection}
            onSelectCustomer={openCustomerModal}
            onShareWhatsApp={shareCustomerWhatsApp}
            onPrintProfile={printCustomerProfile}
            onClearSelection={() => setBulkSelected([])}
            getColorFromString={getColorFromString}
            getInitials={getInitials}
            formatCurrency={formatCurrency}
          />

          {/* Desktop Grid View */}
          <CustomerGridView
            customers={filteredCustomers}
            bulkMode={bulkMode}
            bulkSelected={bulkSelected}
            onToggleSelection={toggleCustomerSelection}
            onSelectCustomer={openCustomerModal}
            onSendWhatsApp={sendWhatsAppMessage}
            onShareWhatsApp={shareCustomerWhatsApp}
            onDuplicate={handleDuplicateCustomer}
            onPrintProfile={printCustomerProfile}
            onBulkActivate={(id) => { handleBulkStatusUpdate('active'); toggleCustomerSelection(id); }}
            onBulkSetVIP={(id) => { handleBulkStatusUpdate('vip'); toggleCustomerSelection(id); }}
            onBulkDelete={(id) => { handleBulkDelete(); toggleCustomerSelection(id); }}
            getColorFromString={getColorFromString}
            getInitials={getInitials}
            formatCurrency={formatCurrency}
          />

          {/* Load More */}
          {hasMoreCustomers && (
            <div className="flex justify-center pt-4 pb-8">
              <button
                onClick={loadMoreCustomers}
                disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-3 bg-surface border-2 border-outline-variant rounded-xl font-bold text-sm text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-95 disabled:opacity-40"
              >
                {loadingMore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-chevron-down text-xs" />
                    Load More Customers
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      {showModal && selectedCustomer && (
        <CustomerModal
          customer={selectedCustomer}
          onClose={() => setShowModal(false)}
          onDelete={() => setShowDeleteConfirm(true)}
          onSendWhatsApp={sendWhatsAppMessage}
          formatCurrency={formatCurrency}
          getColorFromString={getColorFromString}
          getInitials={getInitials}
        />
      )}

      {showAddModal && (
        <AddCustomerModal
          onClose={() => { setShowAddModal(false); }}
          onSave={saveNewCustomer}
          saving={savingCustomer}
        />
      )}


      {showDeleteConfirm && (
        <DeleteConfirmModal
          customer={selectedCustomer}
          onConfirm={deleteCustomer}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
