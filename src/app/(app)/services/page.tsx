"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHaptics, useClipboard, useShare, useToast } from "@/hooks/useNativeAndroid";
import AddServiceButton from "@/app/(app)/services/components/AddServiceButton";
import ViewServiceModal from "@/app/(app)/services/components/ViewServiceModal";
import ServicesHeader from "@/app/(app)/services/components/ServicesHeader";
import ServiceStats from "@/app/(app)/services/components/ServiceStats";
import ServiceFilters from "@/app/(app)/services/components/ServiceFilters";
import ServiceGridView from "@/app/(app)/services/components/ServiceGridView";
import ServiceListView from "@/app/(app)/services/components/ServiceListView";
import { serviceService, Service } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

type ViewLayout = "grid" | "list";
type ServiceStatus = "active" | "paused" | "draft";

// ─── Constants ───────────────────────────────────────────────────────────────

const FILTER_CHIPS = [
  { id: "all", label: "All Services", color: "from-[#8b5cf6] to-[#7c3aed]" },
  { id: "active", label: "Active", color: "from-[#10b981] to-[#059669]" },
  { id: "paused", label: "Paused", color: "from-[#f59e0b] to-[#d97706]" },
  { id: "draft", label: "Drafts", color: "from-[#64748b] to-[#475569]" },
] as const;

const STATUS_CONFIG: Record<string, { bg: string; dot: string; label: string }> = {
  active: { bg: "bg-[#10b981]/10", dot: "bg-[#10b981]", label: "Active" },
  paused: { bg: "bg-[#f59e0b]/10", dot: "bg-[#f59e0b]", label: "Paused" },
  draft: { bg: "bg-[#64748b]/10", dot: "bg-[#64748b]", label: "Draft" },
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function getStatusCount(services: Service[], status: string) {
  if (status === "all") return services.length;
  return services.filter((s) => s.status === status).length;
}

function formatDate(date: any): number {
  if (!date) return 0;
  if (date.toDate) return date.toDate().getTime();
  return new Date(date).getTime();
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-fadeIn">
      {/* Header shimmer */}
      <div className="flex items-center justify-between">
        <div className="h-8 bg-[#e2e8f0] rounded-lg w-48 animate-pulse" />
        <div className="h-10 bg-[#e2e8f0] rounded-xl w-32 animate-pulse" />
      </div>

      {/* Stats shimmer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-[#e2e8f0] animate-pulse">
            <div className="h-3 bg-[#e2e8f0] rounded w-20 mb-3" />
            <div className="h-8 bg-[#f1f5f9] rounded-lg w-16" />
          </div>
        ))}
      </div>

      {/* Filters shimmer */}
      <div className="h-12 bg-[#e2e8f0] rounded-xl w-full animate-pulse" />

      {/* Grid shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-4 animate-pulse">
            <div className="h-32 bg-[#f1f5f9] rounded-lg mb-3" />
            <div className="h-5 bg-[#e2e8f0] rounded w-3/4 mb-2" />
            <div className="h-4 bg-[#f1f5f9] rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  onAddService,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onAddService: () => void;
}) {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-[#e2e8f0] p-8 md:p-16 text-center animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] flex items-center justify-center mx-auto mb-6 shadow-sm">
        <i className="fas fa-concierge-bell text-3xl md:text-4xl text-[#8b5cf6]/40" />
      </div>
      <h3 className="text-xl md:text-2xl font-extrabold text-[#1e293b] mb-2">No Services Found</h3>
      <p className="text-sm md:text-base text-[#64748b] mb-6 max-w-md mx-auto">
        {hasFilters
          ? "Try adjusting your filters or search criteria to find what you're looking for."
          : "Get started by creating your first service and start accepting bookings."}
      </p>
      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-lg shadow-[#8b5cf6]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
        >
          <i className="fas fa-times-circle" />
          Clear Filters
        </button>
      ) : (
        <button
          onClick={onAddService}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-lg shadow-[#8b5cf6]/25 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
        >
          <i className="fas fa-plus mr-2" />
          Add Service
        </button>
      )}
    </div>
  );
}

function DeleteConfirmModal({
  serviceId,
  onConfirm,
  onCancel,
}: {
  serviceId: string | null;
  onConfirm: (id: string) => void;
  onCancel: () => void;
}) {
  if (!serviceId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2500] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 md:p-8 shadow-2xl animate-scaleIn">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#ef4444]/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-[#ef4444]" />
          </div>
          <h3 className="text-xl font-extrabold text-[#1e293b] mb-2">Delete Service?</h3>
          <p className="text-sm text-[#64748b] leading-relaxed">
            This action cannot be undone. The service and all associated bookings data will be permanently removed.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all duration-200 active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(serviceId)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-xl font-bold shadow-md shadow-[#ef4444]/20 hover:shadow-lg active:scale-95 transition-all duration-200"
          >
            <i className="fas fa-trash-alt mr-2" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onStatusUpdate,
  onDelete,
  onExport,
  onClose,
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onStatusUpdate: (status: ServiceStatus) => void;
  onDelete: () => void;
  onExport: () => void;
  onClose: () => void;
}) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="mb-4 bg-white border border-[#e2e8f0] rounded-xl p-3 md:p-4 shadow-sm animate-slideDown">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="w-5 h-5 rounded border-2 border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6] focus:ring-offset-0 cursor-pointer"
            />
          </div>
          <span className="text-sm font-bold text-[#475569]">
            {selectedCount} selected
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onStatusUpdate("active")}
            disabled={selectedCount === 0}
            className="px-3 py-1.5 rounded-lg bg-[#10b981]/10 text-[#10b981] text-xs font-bold hover:bg-[#10b981] hover:text-white transition-all disabled:opacity-40"
          >
            <i className="fas fa-play mr-1" /> Activate
          </button>
          <button
            onClick={() => onStatusUpdate("paused")}
            disabled={selectedCount === 0}
            className="px-3 py-1.5 rounded-lg bg-[#f59e0b]/10 text-[#f59e0b] text-xs font-bold hover:bg-[#f59e0b] hover:text-white transition-all disabled:opacity-40"
          >
            <i className="fas fa-pause mr-1" /> Pause
          </button>
          <button
            onClick={onDelete}
            disabled={selectedCount === 0}
            className="px-3 py-1.5 rounded-lg bg-[#ef4444]/10 text-[#ef4444] text-xs font-bold hover:bg-[#ef4444] hover:text-white transition-all disabled:opacity-40"
          >
            <i className="fas fa-trash mr-1" /> Delete
          </button>
          <button
            onClick={onExport}
            disabled={selectedCount === 0}
            className="px-3 py-1.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-bold hover:bg-[#3b82f6] hover:text-white transition-all disabled:opacity-40"
          >
            <i className="fas fa-file-csv mr-1" /> Export
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:bg-[#e2e8f0] transition-all"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { user } = useAuth();
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const { copy } = useClipboard();
  const { share } = useShare();
  const { show: showToastNative } = useToast();
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
  const addServiceRef = useRef<{ open: () => void }>(null);

  // ─── Data Loading ──────────────────────────────────────────────────────────

  const loadServices = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await serviceService.getServices(user);
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadServices();
  }, [user, loadServices]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleDeleteService = async (serviceId: string) => {
    if (!user) return;
    
    await impactMedium();
    
    try {
      await serviceService.deleteService(user, serviceId);
      await showToastNative({ text: 'Service deleted', duration: 'short' });
      loadServices();
      setShowDeleteConfirm(null);
      setBulkSelected((prev) => prev.filter((id) => id !== serviceId));
    } catch (error) {
      console.error("Error deleting service:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to delete service', position: 'top' });
    }
  };

  const handleToggleStatus = async (service: Service) => {
    if (!user) return;
    
    await impactLight();
    
    const newStatus = service.status === "active" ? "paused" : "active";
    try {
      await serviceService.updateService(user, service.id, { status: newStatus });
      await notificationSuccess();
      await showToastNative({ text: `Service ${newStatus}`, duration: 'short' });
      loadServices();
    } catch (error) {
      console.error("Error updating service:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to update service', position: 'top' });
    }
  };

  const handleShareService = async (service: Service) => {
    await impactLight();
    
    const shareUrl = service.bookingUrl || `${window.location.origin}/book/${service.id}`;
    const shareText = `Book ${service.name} - Professional ${service.businessType} service`;

    const success = await share({
      title: service.name,
      text: shareText,
      url: shareUrl
    });
    
    if (success) {
      await showToastNative({ text: 'Shared successfully', duration: 'short' });
    }
  };

  const handleDuplicateService = async (service: Service) => {
    if (!user) return;
    
    await impactLight();
    
    try {
      const { id, createdAt, updatedAt, ...rest } = service as any;
      const duplicated = {
        ...rest,
        name: `${service.name} (Copy)`,
        status: "draft" as const,
        bookings: 0,
        views: 0,
      };
      await serviceService.createService(user, duplicated);
      await notificationSuccess();
      await showToastNative({ text: 'Service duplicated', duration: 'short' });
      loadServices();
    } catch (error) {
      console.error("Error duplicating service:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to duplicate service', position: 'top' });
    }
  };

  // ─── Bulk Operations ───────────────────────────────────────────────────────

  const toggleBulkSelect = async (serviceId: string) => {
    await impactLight();
    setBulkSelected((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const selectAllServices = () => {
    if (bulkSelected.length === filteredServices.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredServices.map((s) => s.id));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: ServiceStatus) => {
    if (!user || bulkSelected.length === 0) return;
    
    await impactMedium();
    
    try {
      await Promise.all(bulkSelected.map((id) => serviceService.updateService(user, id, { status: newStatus })));
      await notificationSuccess();
      await showToastNative({ text: `${bulkSelected.length} services updated`, duration: 'short' });
      loadServices();
      setBulkSelected([]);
    } catch (error) {
      console.error("Error updating services:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to update services', position: 'top' });
    }
  };

  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    
    await impactMedium();
    
    try {
      await Promise.all(bulkSelected.map((id) => serviceService.deleteService(user, id)));
      await showToastNative({ text: `${bulkSelected.length} services deleted`, duration: 'short' });
      loadServices();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error deleting services:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to delete services', position: 'top' });
    }
  };

  const handleExportCSV = async () => {
    await impactLight();
    
    const headers = ["Name", "Description", "Business Type", "Price Min", "Price Max", "Duration", "Location", "Status", "Bookings", "Views"];
    const rows = filteredServices.map((s) => [
      s.name,
      s.description || "",
      s.businessType || "",
      s.priceMin || 0,
      s.priceMax || 0,
      s.duration || "",
      s.location || "",
      s.status || "active",
      s.bookings || 0,
      s.views || 0,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `services_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    await showToastNative({ text: 'Services exported', duration: 'short' });
  };

  // ─── Filtering & Sorting ────────────────────────────────────────────────────

  const businessTypes = useMemo(
    () => Array.from(new Set(services.map((s) => s.businessType).filter(Boolean))),
    [services]
  );

  const filteredServices = useMemo(() => {
    return services
      .filter((service) => {
        if (filterStatus !== "all" && service.status !== filterStatus) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matches =
            service.name.toLowerCase().includes(q) ||
            service.description?.toLowerCase().includes(q) ||
            service.tags?.some((tag) => tag.toLowerCase().includes(q));
          if (!matches) return false;
        }
        if (selectedBusinessType && service.businessType !== selectedBusinessType) return false;
        if (priceRangeMin !== "" && (service.priceMin || 0) < Number(priceRangeMin)) return false;
        if (priceRangeMax !== "" && (service.priceMin || 0) > Number(priceRangeMax)) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "price-low":
            return (a.priceMin || 0) - (b.priceMin || 0);
          case "price-high":
            return (b.priceMin || 0) - (a.priceMin || 0);
          case "bookings":
            return (b.bookings || 0) - (a.bookings || 0);
          case "rating":
            return (b.rating || 0) - (a.rating || 0);
          case "newest":
          default:
            return formatDate(b.createdAt) - formatDate(a.createdAt);
        }
      });
  }, [services, filterStatus, searchQuery, selectedBusinessType, priceRangeMin, priceRangeMax, sortBy]);

  // ─── Analytics ─────────────────────────────────────────────────────────────

  const totalRevenue = useMemo(
    () => services.reduce((sum, s) => sum + ((s.bookings || 0) * (s.priceMin || 0)), 0),
    [services]
  );
  const averageRating = useMemo(() => {
    if (services.length === 0) return "0.0";
    return (services.reduce((sum, s) => sum + (s.rating || 4.5), 0) / services.length).toFixed(1);
  }, [services]);
  const activeServices = useMemo(() => services.filter((s) => s.status === "active").length, [services]);
  const totalBookingsAll = useMemo(() => services.reduce((sum, s) => sum + (s.bookings || 0), 0), [services]);

  const hasActiveFilters = Boolean(searchQuery || selectedBusinessType || priceRangeMin !== "" || priceRangeMax !== "");

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] animate-fadeIn">
      <div className="px-3 md:px-6 py-3 md:py-4 max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <ServicesHeader
          servicesCount={services.length}
          bulkMode={bulkMode}
          setBulkMode={setBulkMode}
          bulkSelected={bulkSelected}
          filteredServices={filteredServices}
          viewLayout={viewLayout}
          setViewLayout={setViewLayout}
          handleBulkStatusUpdate={handleBulkStatusUpdate}
          handleBulkDelete={handleBulkDelete}
          handleExportCSV={handleExportCSV}
          onAddService={() => addServiceRef.current?.open()}
        />

        {/* Search & Filters */}
        <ServiceFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedBusinessType={selectedBusinessType}
          setSelectedBusinessType={setSelectedBusinessType}
          priceRangeMin={priceRangeMin}
          setPriceRangeMin={setPriceRangeMin}
          priceRangeMax={priceRangeMax}
          setPriceRangeMax={setPriceRangeMax}
          sortBy={sortBy}
          setSortBy={setSortBy}
          businessTypes={businessTypes}
        />

        {/* Stats */}
        <ServiceStats
          totalServices={services.length}
          totalBookings={totalBookingsAll}
          totalRevenue={totalRevenue}
          averageRating={averageRating}
        />

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 md:mx-0 md:px-0 scrollbar-hide">
          {FILTER_CHIPS.map((chip) => {
            const count = getStatusCount(services, chip.id);
            const isActive = filterStatus === chip.id;

            return (
              <button
                key={chip.id}
                onClick={() => setFilterStatus(chip.id)}
                className={`
                  flex-shrink-0 relative px-4 py-2.5 rounded-full font-bold text-sm
                  transition-all duration-200 active:scale-95
                  ${isActive
                    ? `bg-gradient-to-r ${chip.color} text-white shadow-md`
                    : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
                  }
                `}
              >
                <span className="flex items-center gap-2">
                  {chip.label}
                  <span
                    className={`
                      px-1.5 py-0.5 rounded-full text-[10px] font-extrabold min-w-[20px] text-center
                      ${isActive ? "bg-white/25 text-white" : "bg-[#f1f5f9] text-[#64748b]"}
                    `}
                  >
                    {count}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Bulk Action Bar */}
        {bulkMode && filteredServices.length > 0 && (
          <BulkActionBar
            selectedCount={bulkSelected.length}
            totalCount={filteredServices.length}
            onSelectAll={selectAllServices}
            onStatusUpdate={handleBulkStatusUpdate}
            onDelete={handleBulkDelete}
            onExport={handleExportCSV}
            onClose={() => {
              setBulkMode(false);
              setBulkSelected([]);
            }}
          />
        )}

        {/* Services View */}
        {filteredServices.length > 0 ? (
          viewLayout === "grid" ? (
            <ServiceGridView
              services={filteredServices}
              bulkMode={bulkMode}
              bulkSelected={bulkSelected}
              toggleBulkSelect={toggleBulkSelect}
              onSelectService={setSelectedService}
              onShareService={handleShareService}
              onToggleStatus={handleToggleStatus}
              onDuplicateService={handleDuplicateService}
              onDeleteService={(id) => setShowDeleteConfirm(id)}
            />
          ) : (
            <ServiceListView
              services={filteredServices}
              bulkMode={bulkMode}
              bulkSelected={bulkSelected}
              toggleBulkSelect={toggleBulkSelect}
              onSelectService={setSelectedService}
              onShareService={handleShareService}
              onToggleStatus={handleToggleStatus}
              onDuplicateService={handleDuplicateService}
              onDeleteService={(id) => setShowDeleteConfirm(id)}
            />
          )
        ) : (
          <EmptyState
            hasFilters={hasActiveFilters || filterStatus !== "all"}
            onClearFilters={() => {
              setSearchQuery("");
              setSelectedBusinessType("");
              setPriceRangeMin("");
              setPriceRangeMax("");
              setFilterStatus("all");
            }}
            onAddService={() => addServiceRef.current?.open()}
          />
        )}

        {/* Delete Modal */}
        <DeleteConfirmModal
          serviceId={showDeleteConfirm}
          onConfirm={handleDeleteService}
          onCancel={() => setShowDeleteConfirm(null)}
        />

        {/* Detail Modal */}
        <ViewServiceModal
          service={selectedService}
          open={!!selectedService}
          onClose={() => setSelectedService(null)}
        />
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => addServiceRef.current?.open()}
        className="fixed bottom-6 right-4 md:hidden w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-xl shadow-[#8b5cf6]/30 flex items-center justify-center text-xl z-40 hover:scale-110 active:scale-95 transition-all duration-200"
        aria-label="Add new service"
      >
        <i className="fas fa-plus" />
      </button>

      {/* Add Service Modal - rendered at root level */}
      <AddServiceButton ref={addServiceRef} />
    </div>
  );
}