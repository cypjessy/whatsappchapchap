"use client";

import { useState, useEffect } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import AddServiceButton from "@/app/(app)/services/components/AddServiceButton";
import ViewServiceModal from "@/app/(app)/services/components/ViewServiceModal";
import { serviceService, Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

type ViewLayout = "grid" | "list";

export default function ServicesPage() {
  const { mode } = useMode();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBusinessType, setSelectedBusinessType] = useState("");
  const [priceRangeMin, setPriceRangeMin] = useState<number | "">("");
  const [priceRangeMax, setPriceRangeMax] = useState<number | "">("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewLayout, setViewLayout] = useState<ViewLayout>("grid");
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);

  useEffect(() => {
    if (mode === "service" && user) {
      loadServices();
    }
  }, [mode, user]);

  const loadServices = async () => {
    if (!user) return;
    setLoading(true);
    try {
      console.log("Loading services for user:", user.uid);
      const data = await serviceService.getServices(user);
      console.log("Loaded services count:", data.length);
      console.log("Services data:", data);
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete service handler
  const handleDeleteService = async (serviceId: string) => {
    if (!user) return;
    try {
      await serviceService.deleteService(user, serviceId);
      loadServices();
      setShowDeleteConfirm(null);
      setBulkSelected(bulkSelected.filter(id => id !== serviceId));
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service");
    }
  };

  // Toggle status handler
  const handleToggleStatus = async (service: Service) => {
    if (!user) return;
    const newStatus = service.status === 'active' ? 'paused' : 'active';
    try {
      await serviceService.updateService(user, service.id, { status: newStatus });
      loadServices();
    } catch (error) {
      console.error("Error updating service:", error);
      alert("Failed to update service status");
    }
  };

  // Share service handler
  const handleShareService = async (service: Service) => {
    const shareUrl = service.bookingUrl || `${window.location.origin}/book/${service.id}`;
    const shareText = `Book ${service.name} - Professional ${service.businessType} service`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: service.name,
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert('Booking link copied to clipboard!');
    }
  };

  // Duplicate service handler
  const handleDuplicateService = async (service: Service) => {
    if (!user) return;
    try {
      const duplicatedService = {
        ...service,
        name: `${service.name} (Copy)`,
        status: 'draft' as const,
        bookings: 0,
        views: 0,
      };
      // @ts-ignore - omitting id and timestamps
      delete duplicatedService.id;
      delete duplicatedService.createdAt;
      delete duplicatedService.updatedAt;
      
      await serviceService.createService(user, duplicatedService);
      loadServices();
      alert('Service duplicated successfully!');
    } catch (error) {
      console.error("Error duplicating service:", error);
      alert("Failed to duplicate service");
    }
  };

  // Bulk selection handlers
  const toggleBulkSelect = (serviceId: string) => {
    if (bulkSelected.includes(serviceId)) {
      setBulkSelected(bulkSelected.filter(id => id !== serviceId));
    } else {
      setBulkSelected([...bulkSelected, serviceId]);
    }
  };

  const selectAllServices = () => {
    if (bulkSelected.length === filteredServices.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredServices.map(s => s.id));
    }
  };

  // Bulk status update
  const handleBulkStatusUpdate = async (newStatus: 'active' | 'paused' | 'draft') => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => serviceService.updateService(user, id, { status: newStatus }))
      );
      loadServices();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error updating services:", error);
      alert("Failed to update some services");
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(
        bulkSelected.map(id => serviceService.deleteService(user, id))
      );
      loadServices();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error deleting services:", error);
      alert("Failed to delete some services");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'Description', 'Business Type', 'Price Min', 'Price Max', 'Duration', 'Location', 'Status', 'Bookings', 'Views'];
    const rows = filteredServices.map(s => [
      s.name,
      s.description,
      s.businessType,
      s.priceMin,
      s.priceMax,
      s.duration,
      s.location,
      s.status || 'active',
      s.bookings || 0,
      s.views || 0,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `services_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Calculate analytics
  const totalRevenue = services.reduce((sum, s) => sum + ((s.bookings || 0) * (s.priceMin || 0)), 0);
  const averageRating = services.length > 0 
    ? (services.reduce((sum, s) => sum + (s.rating || 4.5), 0) / services.length).toFixed(1)
    : "0.0";
  const activeServices = services.filter(s => s.status === 'active').length;
  const totalBookingsAll = services.reduce((sum, s) => sum + (s.bookings || 0), 0);

  // Get unique business types for filter
  const businessTypes = Array.from(new Set(services.map(s => s.businessType).filter(Boolean)));

  // Filter and sort services
  const filteredServices = services.filter(service => {
    // Status filter
    if (filterStatus !== "all" && service.status !== filterStatus) {
      return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        service.name.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.tags?.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Business type filter
    if (selectedBusinessType && service.businessType !== selectedBusinessType) {
      return false;
    }

    // Price range filter
    if (priceRangeMin !== "" && service.priceMin < Number(priceRangeMin)) {
      return false;
    }
    if (priceRangeMax !== "" && service.priceMin > Number(priceRangeMax)) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price-low':
        return (a.priceMin || 0) - (b.priceMin || 0);
      case 'price-high':
        return (b.priceMin || 0) - (a.priceMin || 0);
      case 'bookings':
        return (b.bookings || 0) - (a.bookings || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
      default:
        return new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime();
    }
  });

  if (mode !== "service") {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-[#64748b]">Switch to Service Mode to view services</p>
      </div>
    );
  }

  const stats = [
    { label: "Services", value: services.length, icon: "fa-concierge-bell", color: "bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]" },
    { label: "Bookings", value: totalBookingsAll, icon: "fa-calendar-check", color: "bg-[rgba(37,211,102,0.1)] text-[#25D366]" },
    { label: "Revenue", value: formatCurrency(totalRevenue), icon: "fa-dollar-sign", color: "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]" },
    { label: "Rating", value: averageRating, icon: "fa-star", color: "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]" },
  ];

  const filterChips = [
    { id: "all", label: "All Services" },
    { id: "active", label: "Active" },
    { id: "paused", label: "Paused" },
    { id: "draft", label: "Drafts" },
  ];

  const getStatusClass = (status: string = "active") => {
    switch (status) {
      case "active": return "bg-[rgba(37,211,102,0.9)] text-white";
      case "paused": return "bg-[rgba(245,158,11,0.9)] text-white";
      case "draft": return "bg-[rgba(100,116,139,0.9)] text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getLocationIcon = (location: string) => {
    if (!location) return "fa-map-marker-alt";
    if (location.toLowerCase().includes("video") || location.toLowerCase().includes("remote")) return "fa-video";
    if (location.toLowerCase().includes("home")) return "fa-home";
    return "fa-map-marker-alt";
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-[#64748b]">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-list text-[#8b5cf6]"></i>
            My Services
          </h1>
          <p className="text-[#64748b] text-sm mt-1">Manage your offerings and packages</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {bulkMode && bulkSelected.length > 0 && (
            <button onClick={() => handleBulkStatusUpdate('active')} className="px-4 py-2.5 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600">
              <i className="fas fa-check mr-2"></i>Activate
            </button>
          )}
          {bulkMode && bulkSelected.length > 0 && (
            <button onClick={() => handleBulkDelete()} className="px-4 py-2.5 bg-red-500 text-white rounded-xl font-semibold text-sm hover:bg-red-600">
              <i className="fas fa-trash mr-2"></i>Delete
            </button>
          )}
          <button onClick={handleExportCSV} className="px-4 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#8b5cf6]">
            <i className="fas fa-download mr-2"></i>Export
          </button>
          <button onClick={() => setBulkMode(!bulkMode)} className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${bulkMode ? 'bg-[#8b5cf6] text-white' : 'bg-white border-2 border-[#e2e8f0] hover:border-[#8b5cf6]'}`}>
            <i className="fas fa-check-square mr-2"></i>Bulk
          </button>
          <button onClick={() => setViewLayout(viewLayout === 'grid' ? 'list' : 'grid')} className="px-4 py-2.5 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#8b5cf6]">
            <i className={`fas ${viewLayout === 'grid' ? 'fa-list' : 'fa-th-large'}`}></i>
          </button>
        <AddServiceButton />
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-[#64748b]"></i>
          <input
            type="text"
            placeholder="Search services by name, description, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[#64748b] hover:text-[#8b5cf6]">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#e2e8f0] mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#64748b] mb-1">Business Type</label>
            <select
              value={selectedBusinessType}
              onChange={(e) => setSelectedBusinessType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm"
            >
              <option value="">All Types</option>
              {businessTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#64748b] mb-1">Min Price (KES)</label>
            <input
              type="number"
              value={priceRangeMin}
              onChange={(e) => setPriceRangeMin(e.target.value ? Number(e.target.value) : "")}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#64748b] mb-1">Max Price (KES)</label>
            <input
              type="number"
              value={priceRangeMax}
              onChange={(e) => setPriceRangeMax(e.target.value ? Number(e.target.value) : "")}
              placeholder="Any"
              className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#64748b] mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="name">Name A-Z</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="bookings">Most Booked</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
        {(searchQuery || selectedBusinessType || priceRangeMin !== "" || priceRangeMax !== "") && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedBusinessType("");
              setPriceRangeMin("");
              setPriceRangeMax("");
            }}
            className="mt-3 text-sm text-[#8b5cf6] hover:text-[#7c3aed] font-semibold"
          >
            <i className="fas fa-times-circle mr-1"></i>Clear All Filters
          </button>
        )}
      </div>

      {/* Stats Row - Horizontal Scroll */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-6">
        {stats.map((stat) => (
          <div 
            key={stat.label} 
            onClick={() => setFilterStatus(stat.label.toLowerCase())}
            className="flex-shrink-0 bg-white px-4 py-3 rounded-xl border border-[#e2e8f0] flex items-center gap-3 cursor-pointer hover:border-[#8b5cf6] transition-all"
          >
            <div className={`w-8 h-8 rounded-full ${stat.color} flex items-center justify-center`}>
              <i className={`fas ${stat.icon} text-sm`}></i>
            </div>
            <div>
              <div className="font-extrabold text-lg">{stat.value}</div>
              <div className="text-xs text-[#64748b]">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {filterChips.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterStatus(chip.id)}
            className={`flex-shrink-0 px-4 py-2 border-2 rounded-full font-semibold text-sm transition-all ${
              filterStatus === chip.id
                ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6]"
                : "border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {bulkMode && filteredServices.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-[#f8fafc] p-3 rounded-xl">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bulkSelected.length === filteredServices.length && filteredServices.length > 0}
              onChange={selectAllServices}
              className="w-5 h-5 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
            />
            <span className="text-sm font-semibold text-[#64748b]">
              Select All ({bulkSelected.length}/{filteredServices.length})
            </span>
          </label>
        </div>
      )}

      {viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl border ${bulkSelected.includes(service.id) ? 'border-[#8b5cf6] ring-2 ring-[#8b5cf6]/20' : 'border-[#e2e8f0]'} overflow-hidden hover:shadow-lg transition-all cursor-pointer relative`}
            >
              {bulkMode && (
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={bulkSelected.includes(service.id)}
                    onChange={() => toggleBulkSelect(service.id)}
                    className="w-5 h-5 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                  />
                </div>
              )}
              <div 
                className={`h-40 md:h-44 bg-gradient-to-br ${service.bgGradient || 'from-gray-100 to-gray-200'} flex items-center justify-center relative overflow-hidden`}
                onClick={() => !bulkMode && setSelectedService(service)}
              >
                {!bulkMode && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      // Could add dropdown menu here
                    }}
                    className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-[#64748b] hover:bg-white z-10"
                  >
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                )}
                {service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0) ? (
                  <img 
                    src={service.imageUrl || service.portfolioImages![0]} 
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-5xl">{service.emoji || '✨'}</span>
                )}
                <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusClass(service.status || 'active')}`}>
                  {service.status || 'active'}
                </span>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-base mb-2 line-clamp-2 flex items-center gap-2">
                  {service.name}
                  {service.bookings && service.bookings > 10 && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold rounded-full">
                      🔥 Popular
                    </span>
                  )}
                </h3>
                <div className="flex gap-3 text-xs text-[#64748b] mb-3">
                  <span><i className="fas fa-clock mr-1"></i>{service.duration || 'TBD'}</span>
                  <span><i className={`fas ${getLocationIcon(service.location || '')} mr-1`}></i>{service.location || 'TBD'}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {service.tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-[#f8fafc] rounded text-xs text-[#64748b]">{tag}</span>
                  ))}
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-xs text-[#64748b]">From</span>
                  <span className="text-xl font-extrabold text-[#8b5cf6]">{formatCurrency(service.priceMin ?? 0)}</span>
                  {service.priceMax != null && service.priceMin != null && service.priceMax > service.priceMin && (
                    <span className="text-sm text-[#64748b] line-through">{formatCurrency(service.priceMax)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#e2e8f0]">
                  <div className="flex gap-3 text-xs text-[#64748b]">
                    <span><i className="fas fa-calendar-check mr-1"></i>{service.bookings || 0}</span>
                    <span><i className="fas fa-eye mr-1"></i>{service.views || 0}</span>
                    {service.rating && (
                      <span><i className="fas fa-star text-yellow-500 mr-1"></i>{service.rating.toFixed(1)}</span>
                    )}
                  </div>
                  {!bulkMode && (
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareService(service);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                        title="Copy Booking Link"
                      >
                        <i className="fas fa-link text-xs"></i>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleStatus(service);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-all"
                        title={service.status === 'active' ? 'Pause' : 'Activate'}
                      >
                        <i className={`fas ${service.status === 'active' ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateService(service);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#3b82f6] hover:text-white transition-all"
                        title="Duplicate"
                      >
                        <i className="fas fa-copy text-xs"></i>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareService(service);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all"
                        title="Share"
                      >
                        <i className="fas fa-share-alt text-xs"></i>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(service.id);
                        }}
                        className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                        title="Delete"
                      >
                        <i className="fas fa-trash text-xs"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl border ${bulkSelected.includes(service.id) ? 'border-[#8b5cf6] ring-2 ring-[#8b5cf6]/20' : 'border-[#e2e8f0]'} p-4 hover:shadow-lg transition-all flex items-center gap-4`}
            >
              {bulkMode && (
                <input
                  type="checkbox"
                  checked={bulkSelected.includes(service.id)}
                  onChange={() => toggleBulkSelect(service.id)}
                  className="w-5 h-5 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${service.bgGradient || 'from-gray-100 to-gray-200'} flex items-center justify-center flex-shrink-0 overflow-hidden`}>
                {service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0) ? (
                  <img 
                    src={service.imageUrl || service.portfolioImages![0]} 
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl">{service.emoji || '✨'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-base truncate flex items-center gap-2">
                    {service.name}
                    {service.bookings && service.bookings > 10 && (
                      <span className="px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold rounded-full flex-shrink-0">
                        🔥 Popular
                      </span>
                    )}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusClass(service.status || 'active')}`}>
                    {service.status || 'active'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#64748b]">
                  <span><i className="fas fa-clock mr-1"></i>{service.duration}</span>
                  <span><i className="fas fa-map-marker-alt mr-1"></i>{service.location}</span>
                  <span><i className="fas fa-calendar-check mr-1"></i>{service.bookings || 0} bookings</span>
                  <span className="font-extrabold text-[#8b5cf6]">{formatCurrency(service.priceMin)}</span>
                </div>
              </div>
              {!bulkMode && (
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleShareService(service)} className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all" title="Copy Booking Link">
                    <i className="fas fa-link text-xs"></i>
                  </button>
                  <button onClick={() => handleToggleStatus(service)} className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-all">
                    <i className={`fas ${service.status === 'active' ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                  </button>
                  <button onClick={() => handleDuplicateService(service)} className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#3b82f6] hover:text-white transition-all">
                    <i className="fas fa-copy text-xs"></i>
                  </button>
                  <button onClick={() => handleShareService(service)} className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-all">
                    <i className="fas fa-share-alt text-xs"></i>
                  </button>
                  <button onClick={() => setShowDeleteConfirm(service.id)} className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredServices.length === 0 && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-8 md:p-12 text-center">
          <i className="fas fa-concierge-bell text-5xl text-[#8b5cf6] mb-4 opacity-30"></i>
          <h3 className="text-xl font-bold text-[#1e293b] mb-2">No Services Found</h3>
          <p className="text-[#64748b] mb-4">
            {searchQuery || selectedBusinessType || priceRangeMin !== "" || priceRangeMax !== ""
              ? "Try adjusting your filters"
              : `No services match the "${filterStatus}" filter`}
          </p>
          {(searchQuery || selectedBusinessType || priceRangeMin !== "" || priceRangeMax !== "") ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedBusinessType("");
                setPriceRangeMin("");
                setPriceRangeMax("");
                setFilterStatus("all");
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition-all"
            >
              <i className="fas fa-times-circle mr-2"></i>Clear Filters
            </button>
          ) : (
            <AddServiceButton />
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
              </div>
              <h3 className="text-xl font-bold text-[#1e293b] mb-2">Delete Service?</h3>
              <p className="text-[#64748b]">
                This action cannot be undone. The service and all associated data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteService(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all"
              >
                <i className="fas fa-trash mr-2"></i>Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      <ViewServiceModal 
        service={selectedService} 
        open={!!selectedService} 
        onClose={() => setSelectedService(null)} 
      />

      {/* Mobile FAB */}
      <button className="fixed bottom-20 md:hidden right-4 w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-xl flex items-center justify-center text-xl z-40">
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
}