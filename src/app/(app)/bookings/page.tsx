"use client";

import { useState, useEffect } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { serviceService, bookingService, Booking, Service } from "@/lib/db";
import ManualBookingModal from "@/app/(app)/bookings/components/ManualBookingModal";
import ViewBookingModal from "@/app/(app)/bookings/components/ViewBookingModal";
import PaymentConfirmationModal from "@/app/(app)/bookings/components/PaymentConfirmationModal";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";

type ViewMode = "calendar" | "timeline" | "list" | "grid";

export default function BookingsPage() {
  const { mode } = useMode();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "service" && user) {
      loadServices();
      loadBookings();
    }
  }, [mode, user, filterStatus]);

  const loadServices = async () => {
    if (!user) return;
    try {
      const data = await serviceService.getServices(user);
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const bookingsData = filterStatus === "all" 
        ? await bookingService.getBookings(user)
        : await bookingService.getBookings(user, filterStatus);
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingCreated = () => {
    loadBookings(); // Refresh list
  };

  // Status update handlers
  const handleUpdateStatus = async (bookingId: string, newStatus: Booking['status']) => {
    if (!user) return;
    try {
      await bookingService.updateBooking(user, bookingId, { status: newStatus });
      loadBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update booking status");
    }
  };

  // Handle payment confirmation
  const handleConfirmPayment = async (bookingId: string, paymentProof: any) => {
    if (!user) return;
    try {
      await bookingService.updateBooking(user, bookingId, { 
        paymentProof,
        paymentStatus: 'paid',
        status: 'confirmed' // Auto-confirm when payment is received
      });
      loadBookings();
      setPaymentModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error confirming payment:", error);
      throw error;
    }
  };

  // Delete booking handler
  const handleDeleteBooking = async (bookingId: string) => {
    if (!user) return;
    try {
      await bookingService.deleteBooking(user, bookingId);
      loadBookings();
      setShowDeleteConfirm(null);
      setBulkSelected(bulkSelected.filter(id => id !== bookingId));
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Failed to delete booking");
    }
  };

  // WhatsApp message handler
  const handleSendMessage = async (booking: Booking) => {
    const message = `Hello ${booking.client},\n\nThis is a reminder for your upcoming booking:\n\nService: ${booking.service}\nDate: ${formatDate(booking.date)}\nTime: ${booking.time}\nLocation: ${booking.location}\nPrice: KES ${booking.price.toLocaleString()}\n\nThank you!`;
    
    try {
      if (user) {
        await sendEvolutionWhatsAppMessage(booking.phone, message, `tenant_${user.uid}`);
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      // Fallback: open WhatsApp web
      window.open(`https://wa.me/${booking.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  // Edit booking handler
  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setEditModalOpen(true);
  };

  // Bulk selection handlers
  const toggleBulkSelect = (bookingId: string) => {
    if (bulkSelected.includes(bookingId)) {
      setBulkSelected(bulkSelected.filter(id => id !== bookingId));
    } else {
      setBulkSelected([...bulkSelected, bookingId]);
    }
  };

  const selectAllBookings = () => {
    if (bulkSelected.length === filteredBookings.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredBookings.map(b => b.id));
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: Booking['status']) => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => bookingService.updateBooking(user, id, { status: newStatus }))
      );
      loadBookings();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error updating bookings:", error);
      alert("Failed to update some bookings");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => bookingService.deleteBooking(user, id))
      );
      loadBookings();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error deleting bookings:", error);
      alert("Failed to delete some bookings");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Client', 'Phone', 'Service', 'Date', 'Time', 'Duration', 'Location', 'Price', 'Status', 'Payment Status'];
    const rows = filteredBookings.map(b => [
      b.client,
      b.phone,
      b.service,
      b.date,
      b.time,
      b.duration,
      b.location,
      b.price,
      b.status,
      b.paymentStatus || 'unpaid'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate analytics
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
  const completedRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.price || 0), 0);
  const pendingRevenue = bookings.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.price || 0), 0);

  // Filter bookings based on search, service filter, date range, and selected date
  const filteredBookings = bookings.filter(booking => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        booking.client.toLowerCase().includes(query) ||
        booking.phone.toLowerCase().includes(query) ||
        booking.service.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Service filter
    if (selectedServiceFilter && booking.serviceId !== selectedServiceFilter) {
      return false;
    }

    // Payment status filter
    if (filterPaymentStatus !== "all") {
      if (filterPaymentStatus === "unpaid" && booking.paymentStatus !== "unpaid") return false;
      if (filterPaymentStatus === "partial" && booking.paymentStatus !== "partial") return false;
      if (filterPaymentStatus === "paid" && booking.paymentStatus !== "paid") return false;
    }

    // Date range filter
    if (dateRangeStart && booking.date < dateRangeStart) {
      return false;
    }
    if (dateRangeEnd && booking.date > dateRangeEnd) {
      return false;
    }

    // Selected date filter (from calendar)
    if (selectedDate) {
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      if (booking.date !== selectedDateStr) {
        return false;
      }
    }

    return true;
  });

  if (mode !== "service") {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-[#64748b]">Switch to Service Mode to view bookings</p>
      </div>
    );
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-[rgba(37,211,102,0.1)] text-[#10b981]";
      case "pending": return "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]";
      case "completed": return "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]";
      case "cancelled": return "bg-[rgba(239,68,68,0.1)] text-[#ef4444]";
      default: return "bg-[#f1f5f9] text-[#64748b]";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  };

  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const viewTabs = [
    { id: "calendar", label: "Calendar", icon: "fa-calendar" },
    { id: "timeline", label: "Timeline", icon: "fa-stream" },
    { id: "list", label: "List", icon: "fa-list" },
    { id: "grid", label: "Grid", icon: "fa-th-large" },
  ];

  const filterChips = [
    { id: "all", label: "All", icon: "fa-layer-group" },
    { id: "confirmed", label: "Confirmed", icon: "fa-check-circle" },
    { id: "pending", label: "Pending", icon: "fa-clock" },
    { id: "completed", label: "Completed", icon: "fa-check-double" },
    { id: "cancelled", label: "Cancelled", icon: "fa-times-circle" },
  ];

  const stats = [
    { id: "confirmed", label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, status: "confirmed" as const },
    { id: "pending", label: "Pending", value: bookings.filter(b => b.status === "pending").length, status: "pending" as const },
    { id: "completed", label: "Completed", value: bookings.filter(b => b.status === "completed").length, status: "completed" as const },
    { id: "cancelled", label: "Cancelled", value: bookings.filter(b => b.status === "cancelled").length, status: "cancelled" as const },
  ];

  // Analytics stats
  const analyticsStats = [
    { label: "Total Revenue", value: `KES ${totalRevenue.toLocaleString()}`, icon: "fa-dollar-sign", color: "text-[#10b981]" },
    { label: "Avg. Booking", value: `KES ${Math.round(averageBookingValue).toLocaleString()}`, icon: "fa-chart-line", color: "text-[#3b82f6]" },
    { label: "Completed Rev.", value: `KES ${completedRevenue.toLocaleString()}`, icon: "fa-check-circle", color: "text-[#8b5cf6]" },
    { label: "Pending Rev.", value: `KES ${pendingRevenue.toLocaleString()}`, icon: "fa-clock", color: "text-[#f59e0b]" },
  ];

  return (
    <div className="p-3 md:p-6 animate-fadeIn">
      {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
              <i className="fas fa-calendar-alt text-[#8b5cf6]"></i>
              Bookings
            </h1>
            <p className="text-[#64748b] text-sm mt-1">Manage your appointments and schedule</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
              onClick={() => setBulkMode(!bulkMode)}
            >
              <i className="fas fa-check-square mr-2"></i>
              {bulkMode ? "Exit Bulk Mode" : "Bulk Actions"}
            </button>
            <button 
              className="px-4 py-2 border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
              onClick={handleExportCSV}
            >
              <i className="fas fa-download mr-2"></i>
              Export CSV
            </button>
            <button 
              className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-lg"
              onClick={() => setModalOpen(true)}
            >
              <i className="fas fa-plus mr-2"></i>
              Manual Booking
            </button>
          </div>
        </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div 
            key={stat.id} 
            onClick={() => setFilterStatus(filterStatus === stat.id ? "all" : stat.id)}
            className="bg-white p-3 md:p-4 rounded-xl border border-[#e2e8f0] text-center cursor-pointer hover:border-[#8b5cf6] transition-all"
          >
            <div className={`text-xl md:text-2xl font-extrabold ${
              stat.status === "confirmed" ? "text-[#10b981]" :
              stat.status === "pending" ? "text-[#f59e0b]" :
              stat.status === "completed" ? "text-[#3b82f6]" :
              "text-[#ef4444]"
            }`}>{stat.value}</div>
            <div className="text-xs font-semibold text-[#64748b] uppercase">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {analyticsStats.map((stat, idx) => (
          <div key={idx} className="bg-gradient-to-br from-white to-[#f8fafc] p-3 md:p-4 rounded-xl border border-[#e2e8f0]">
            <div className="flex items-center gap-2 mb-1">
              <i className={`fas ${stat.icon} ${stat.color}`}></i>
              <div className="text-xs font-semibold text-[#64748b] uppercase">{stat.label}</div>
            </div>
            <div className={`text-lg md:text-xl font-extrabold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
              <input
                type="text"
                placeholder="Search by client, phone, or service..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              />
            </div>
          </div>

          {/* Service Filter */}
          <select
            value={selectedServiceFilter}
            onChange={(e) => setSelectedServiceFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
          >
            <option value="">All Services</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
          >
            <option value="all">All Payments</option>
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>

          {/* Date Range */}
          <input
            type="date"
            value={dateRangeStart}
            onChange={(e) => setDateRangeStart(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRangeEnd}
            onChange={(e) => setDateRangeEnd(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
            placeholder="End Date"
          />

          {/* Clear Filters */}
          {(searchQuery || selectedServiceFilter || filterPaymentStatus !== "all" || dateRangeStart || dateRangeEnd || selectedDate) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedServiceFilter("");
                setFilterPaymentStatus("all");
                setDateRangeStart("");
                setDateRangeEnd("");
                setSelectedDate(null);
              }}
              className="px-4 py-2.5 rounded-lg border border-[#ef4444] text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-all"
            >
              <i className="fas fa-times"></i> Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {bulkMode && bulkSelected.length > 0 && (
        <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold">{bulkSelected.length} selected</span>
            <button onClick={selectAllBookings} className="text-sm underline hover:no-underline">
              {bulkSelected.length === filteredBookings.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleBulkStatusUpdate('confirmed')}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold"
            >
              Mark Confirmed
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('completed')}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold"
            >
              Mark Completed
            </button>
            <button
              onClick={() => handleBulkStatusUpdate('cancelled')}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold"
            >
              Mark Cancelled
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-[#ef4444] rounded-lg hover:bg-[#dc2626] transition-all text-sm font-semibold"
            >
              Delete
            </button>
            <button
              onClick={() => { setBulkMode(false); setBulkSelected([]); }}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex bg-white rounded-xl p-1 mb-4 border border-[#e2e8f0] overflow-x-auto">
        {viewTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setViewMode(tab.id as ViewMode)}
            className={`flex-1 min-w-[80px] px-3 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              viewMode === tab.id
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow"
                : "text-[#64748b]"
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterStatus(chip.id)}
            className={`px-4 py-2 border-2 rounded-full font-semibold text-sm whitespace-nowrap flex items-center gap-2 transition-all ${
              filterStatus === chip.id
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6]"
                : "border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            }`}
          >
            <i className={`fas ${chip.icon}`}></i>
            {chip.label}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div>
          <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-4 md:p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigateMonth(-1)}
                  className="w-9 h-9 rounded-full border-2 border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className="text-lg font-extrabold">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => navigateMonth(1)}
                  className="w-9 h-9 rounded-full border-2 border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              <button 
                onClick={goToToday}
                className="w-9 h-9 rounded-full border-2 border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
              >
                <i className="fas fa-calendar-day"></i>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="text-center text-xs font-bold text-[#64748b] uppercase py-2">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const daysInMonth = getDaysInMonth(year, month);
                const firstDay = getFirstDayOfMonth(year, month);
                const today = new Date();
                const days = [];

                // Previous month days
                for (let i = 0; i < firstDay; i++) {
                  days.push({ day: null, isOther: true });
                }

                // Current month days
                for (let day = 1; day <= daysInMonth; day++) {
                  const date = new Date(year, month, day);
                  const isToday = date.toDateString() === today.toDateString();
                  const dayBookings = getBookingsForDate(date);
                  days.push({ day, isOther: false, isToday, bookings: dayBookings });
                }

                // Next month days to fill grid
                const remainingCells = 42 - days.length;
                for (let i = 0; i < remainingCells; i++) {
                  days.push({ day: null, isOther: true });
                }

                return days.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (item.day && !item.isOther) {
                        const clickedDate = new Date(year, month, item.day);
                        setSelectedDate(selectedDate?.toDateString() === clickedDate.toDateString() ? null : clickedDate);
                      }
                    }}
                    className={`aspect-square flex flex-col items-center justify-center text-sm font-semibold rounded-lg relative cursor-pointer transition-all ${
                      item.isOther ? "text-[#94a3b4] opacity-50" :
                      item.isToday ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow" :
                      selectedDate && item.day && selectedDate.toDateString() === new Date(year, month, item.day).toDateString() ? "bg-[#ede9fe] text-[#8b5cf6] border-2 border-[#8b5cf6]" :
                      "text-[#64748b] hover:bg-[#ede9fe] hover:text-[#8b5cf6]"
                    }`}
                  >
                    {item.day && <span>{item.day}</span>}
                    {!item.isOther && item.bookings && item.bookings.length > 0 && !item.isToday && (
                      <div className="flex gap-0.5 mt-1">
                        {item.bookings.slice(0, 3).map((_, idx) => (
                          <span key={idx} className="w-1 h-1 bg-[#8b5cf6] rounded-full"></span>
                        ))}
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Selected Day Bookings */}
          <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] overflow-hidden">
            <div className="p-4 md:p-5 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-br from-[#ede9fe] to-[rgba(139,92,246,0.05)]">
              <div className="font-bold flex items-center gap-2">
                <i className="fas fa-calendar-check text-[#8b5cf6]"></i>
                <span>{formatDate(currentDate.toISOString())}</span>
              </div>
              <span className="text-sm text-[#64748b]">
                {bookings.filter(b => b.date === currentDate.toISOString().split('T')[0]).length} bookings
              </span>
            </div>
            
            <div className="p-4 md:p-5 space-y-4">
              {loading ? (
                <div className="text-center py-8 text-[#64748b]">
                  <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.filter(b => b.date === currentDate.toISOString().split('T')[0]).length === 0 ? (
                <div className="text-center py-8 text-[#64748b]">
                  <i className="fas fa-calendar-times text-4xl mb-2 opacity-50"></i>
                  <p>No bookings for this day</p>
                </div>
              ) : (
                bookings.filter(b => b.date === currentDate.toISOString().split('T')[0]).map((booking) => (
                  <div key={booking.id} className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-sm ${
                          booking.verified
                            ? "from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6]"
                            : "from-[#f1f5f9] to-[#e2e8f0] text-[#64748b]"
                        }`}>
                          {booking.clientInitials}
                        </div>
                        <div>
                          <div className="font-bold text-sm">{booking.client}</div>
                          <div className="text-xs text-[#64748b] flex items-center gap-1">
                            <i className="fab fa-whatsapp text-[#25D366]"></i> {booking.phone}
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="text-xs bg-white px-2 py-1 rounded text-[#64748b]"><i className="fas fa-cut text-[#8b5cf6] mr-1"></i>{booking.service}</span>
                      <span className="text-xs bg-white px-2 py-1 rounded text-[#64748b]"><i className="fas fa-clock text-[#8b5cf6] mr-1"></i>{booking.time}</span>
                      <span className="text-xs bg-white px-2 py-1 rounded text-[#64748b]"><i className="fas fa-map-marker-alt text-[#8b5cf6] mr-1"></i>{booking.location}</span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
                      <span className="font-extrabold text-lg text-[#8b5cf6]">KES {booking.price.toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all">
                          <i className="fab fa-whatsapp"></i>
                        </button>
                        <button onClick={() => setSelectedBooking(booking)} className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-all">
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

          {/* Timeline View */}
          {viewMode === "timeline" && (
            <div className="relative pl-12 md:pl-16">
              {loading ? (
                <div className="text-center py-8 text-[#64748b]">
                  <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-[#64748b]">
                  <i className="fas fa-stream text-4xl mb-2 opacity-50"></i>
                  <p>No bookings found</p>
                </div>
              ) : (
                <>
                  <div className="absolute left-5 md:left-7 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#8b5cf6] to-[#ede9fe]"></div>
                  
                  {bookings.map((booking) => (
                    <div key={booking.id} className="relative mb-6">
                      <div className={`absolute -left-10 md:-left-12 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        booking.status === "completed" ? "bg-[#94a3b4]" :
                        booking.status === "pending" ? "bg-[#f59e0b]" :
                        booking.status === "cancelled" ? "bg-[#ef4444]" :
                        "bg-[#8b5cf6]"
                      }`}></div>
                      <div className="text-xs md:text-sm font-bold text-[#64748b] mb-2 absolute -left-14 md:-left-16 w-12 text-right">
                        {booking.time}
                      </div>
                      
                      <div className="bg-white rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold">{booking.client}</div>
                            <div className="text-xs text-[#64748b] flex items-center gap-1 mt-1">
                              <i className="fab fa-whatsapp text-[#25D366]"></i> {booking.phone}
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusClass(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-sm text-[#64748b] mb-2">
                          <i className="fas fa-cut text-[#8b5cf6] mr-1"></i>{booking.service}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-[#64748b]">
                            <i className="fas fa-calendar mr-1"></i>{formatDate(booking.date)} • 
                            <i className="fas fa-clock ml-2 mr-1"></i>{booking.duration} • 
                            <i className="fas fa-map-marker-alt ml-2 mr-1"></i>{booking.location}
                          </div>
                          <div className="font-bold text-[#8b5cf6]">KES {booking.price.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
              {loading ? (
                <div className="text-center py-8 text-[#64748b]">
                  <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-8 text-[#64748b]">
                  <i className="fas fa-list text-4xl mb-2 opacity-50"></i>
                  <p>No bookings found</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 p-4 bg-[#f8fafc] text-xs font-bold text-[#64748b] uppercase">
                    <span>Client & Service</span>
                    <span>Date & Time</span>
                    <span>Location</span>
                    <span>Status</span>
                    <span>Amount</span>
                    <span></span>
                  </div>
                  {bookings.map((booking) => (
                    <div key={booking.id} className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 p-4 border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-all cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6] font-bold text-sm flex items-center justify-center">{booking.clientInitials}</div>
                        <div>
                          <div className="font-bold text-sm">{booking.client}</div>
                          <div className="text-xs text-[#64748b]">{booking.service}</div>
                        </div>
                      </div>
                      <div className="text-sm text-[#64748b]">
                        <div>{formatDate(booking.date)}</div>
                        <div className="text-xs">{booking.time}</div>
                      </div>
                      <div className="text-sm text-[#64748b] flex items-center gap-1">
                        <i className="fas fa-map-marker-alt text-[#8b5cf6]"></i>
                        {booking.location}
                      </div>
                      <div><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusClass(booking.status)}`}>{booking.status}</span></div>
                      <div className="font-bold text-[#8b5cf6]">KES {booking.price.toLocaleString()}</div>
                      <button className="w-8 h-8 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#64748b] hover:bg-[#8b5cf6] hover:text-white">
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-8 text-[#64748b]">
                  <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                  <p>Loading bookings...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="col-span-full text-center py-8 text-[#64748b]">
                  <i className="fas fa-th-large text-4xl mb-2 opacity-50"></i>
                  <p>No bookings found</p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all cursor-pointer" onClick={() => setSelectedBooking(booking)}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          booking.verified ? "bg-gradient-to-br from-[#ede9fe] to-[#e0e7ff] text-[#8b5cf6]" : "bg-[#f1f5f9] text-[#64748b]"
                        }`}>{booking.clientInitials}</div>
                        <div>
                          <div className="font-bold text-sm">{booking.client}</div>
                          <div className="text-xs text-[#64748b] flex items-center gap-1">
                            <i className="fab fa-whatsapp text-[#25D366]"></i> {booking.phone}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusClass(booking.status)}`}>{booking.status}</span>
                    </div>
                    <div className="mb-3">
                      <div className="font-bold text-base mb-1">{booking.service}</div>
                      <div className="text-xs text-[#64748b] space-y-1">
                        <div><i className="fas fa-calendar mr-1"></i>{formatDate(booking.date)}</div>
                        <div><i className="fas fa-clock mr-1"></i>{booking.time} • {booking.duration}</div>
                        <div><i className="fas fa-map-marker-alt mr-1"></i>{booking.location}</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
                      <span className="font-extrabold text-lg text-[#8b5cf6]">KES {booking.price.toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button className="w-8 h-8 rounded-lg bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all">
                          <i className="fab fa-whatsapp"></i>
                        </button>
                        <button className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-all">
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

      {/* Floating Add Button - Mobile */}
      <button className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-xl flex items-center justify-center text-xl md:hidden z-50">
        <i className="fas fa-plus"></i>
      </button>

      {/* Booking Detail Modal */}
      <ViewBookingModal 
        booking={selectedBooking} 
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={(bookingId) => {
          setShowDeleteConfirm(bookingId);
          setSelectedBooking(null);
        }}
        onEdit={(booking) => {
          handleEditBooking(booking);
          setSelectedBooking(null);
        }}
        onConfirmPayment={handleConfirmPayment}
        onOpenPaymentModal={() => setPaymentModalOpen(true)}
      />

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        item={selectedBooking}
        itemType="booking"
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-[#ef4444]"></i>
              </div>
              <h3 className="text-xl font-bold text-[#1e293b] mb-2">Delete Booking?</h3>
              <p className="text-[#64748b]">This action cannot be undone. Are you sure you want to delete this booking?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteBooking(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-[#ef4444] text-white rounded-xl font-bold hover:bg-[#dc2626] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      <ManualBookingModal 
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onBookingCreated={handleBookingCreated}
      />

      {/* Edit Booking Modal */}
      {editModalOpen && editingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fas fa-edit text-[#8b5cf6]"></i>
                Edit Booking
              </h2>
              <button onClick={() => { setEditModalOpen(false); setEditingBooking(null); }} className="w-9 h-9 rounded-full border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9]">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-5">
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!user || !editingBooking) return;
                try {
                  const formData = new FormData(e.currentTarget);
                  const updates: Partial<Booking> = {
                    client: formData.get('client') as string,
                    phone: formData.get('phone') as string,
                    date: formData.get('date') as string,
                    time: formData.get('time') as string,
                    duration: formData.get('duration') as string,
                    location: formData.get('location') as string,
                    price: Number(formData.get('price')),
                    deposit: Number(formData.get('deposit') || 0),
                    paymentMethod: formData.get('paymentMethod') as any,
                    notes: formData.get('notes') as string,
                  };
                  updates.clientInitials = (updates.client || '').split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                  updates.balance = (updates.price || 0) - (updates.deposit || 0);
                  updates.paymentStatus = updates.deposit && updates.deposit > 0 ? (updates.deposit >= (updates.price || 0) ? 'paid' : 'partial') : 'unpaid';
                  
                  await bookingService.updateBooking(user, editingBooking.id, updates);
                  loadBookings();
                  setEditModalOpen(false);
                  setEditingBooking(null);
                } catch (error) {
                  console.error("Error updating booking:", error);
                  alert("Failed to update booking");
                }
              }} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Client Name</label>
                    <input name="client" defaultValue={editingBooking.client} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Phone</label>
                    <input name="phone" defaultValue={editingBooking.phone} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Date</label>
                    <input name="date" type="date" defaultValue={editingBooking.date} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Time</label>
                    <input name="time" type="time" defaultValue={editingBooking.time} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Duration</label>
                    <input name="duration" defaultValue={editingBooking.duration} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Location</label>
                    <input name="location" defaultValue={editingBooking.location} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Price (KES)</label>
                    <input name="price" type="number" defaultValue={editingBooking.price} min="0" className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Deposit (KES)</label>
                    <input name="deposit" type="number" defaultValue={editingBooking.deposit || 0} min="0" className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#64748b] mb-2">Payment Method</label>
                    <select name="paymentMethod" defaultValue={editingBooking.paymentMethod || ''} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none">
                      <option value="">Select method</option>
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Notes</label>
                  <textarea name="notes" defaultValue={editingBooking.notes || ''} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none" placeholder="Any special requests or notes..." />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => { setEditModalOpen(false); setEditingBooking(null); }} className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold hover:opacity-90 transition-all">
                    <i className="fas fa-save mr-2"></i>Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}