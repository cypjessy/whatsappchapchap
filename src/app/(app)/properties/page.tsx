"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHaptics, useToast } from "@/hooks/useNativeAndroid";
import { useStatusBar } from "@/hooks/useStatusBar";
import {
  Building2,
  DoorOpen,
  MessageCircle,
  Bot,
  Plus,
  MapPin,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  ArrowUp,
} from "lucide-react";
import PropertyModal from "./PropertyModal";
import PropertyDrawer from "./PropertyDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Property {
  id: string;
  name: string;
  location: string;
  type: "apartment" | "house" | "studio" | "bedsitter" | "mansion";
  status: "available" | "partial" | "full";
  units: number;
  occupied: number;
  vacant: number;
  price: number;
  priceLabel: string;
  inquiries: number;
  imageGradient: string;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const SAMPLE_PROPERTIES: Property[] = [
  {
    id: "1",
    name: "Greenview Apartments",
    location: "Kilimani, Nairobi",
    type: "apartment",
    status: "partial",
    units: 24,
    occupied: 18,
    vacant: 6,
    price: 28000,
    priceLabel: "KES 28,000",
    inquiries: 12,
    imageGradient: "from-[#0f2922] via-[#1a5c3a] to-[#2eb870]",
  },
  {
    id: "2",
    name: "Westlands Heights",
    location: "Westlands, Nairobi",
    type: "house",
    status: "available",
    units: 6,
    occupied: 3,
    vacant: 3,
    price: 65000,
    priceLabel: "KES 65,000",
    inquiries: 5,
    imageGradient: "from-[#1a1f2e] via-[#2d3f6e] to-[#5b8cf6]",
  },
  {
    id: "3",
    name: "Langata Gardens",
    location: "Langata, Nairobi",
    type: "studio",
    status: "full",
    units: 8,
    occupied: 8,
    vacant: 0,
    price: 15000,
    priceLabel: "KES 15,000",
    inquiries: 7,
    imageGradient: "from-[#2a1a0f] via-[#6e3d1a] to-[#f59e0b]",
  },
  {
    id: "4",
    name: "Kileleshwa Suites",
    location: "Kileleshwa, Nairobi",
    type: "bedsitter",
    status: "available",
    units: 12,
    occupied: 4,
    vacant: 8,
    price: 22000,
    priceLabel: "KES 22,000",
    inquiries: 9,
    imageGradient: "from-[#1f1a2e] via-[#4a2d6e] to-[#8b5cf6]",
  },
  {
    id: "5",
    name: "Riverside Mansion",
    location: "Riverside, Nairobi",
    type: "mansion",
    status: "partial",
    units: 10,
    occupied: 7,
    vacant: 3,
    price: 120000,
    priceLabel: "KES 120,000",
    inquiries: 4,
    imageGradient: "from-[#0f1a24] via-[#1e3a5a] to-[#3b82f6]",
  },
  {
    id: "6",
    name: "Hurlingham Plaza",
    location: "Hurlingham, Nairobi",
    type: "apartment",
    status: "full",
    units: 16,
    occupied: 16,
    vacant: 0,
    price: 35000,
    priceLabel: "KES 35,000",
    inquiries: 15,
    imageGradient: "from-[#0f2922] via-[#1a5c3a] to-[#2eb870]",
  },
];

// ─── Scroll to Top Button ─────────────────────────────────────────────────────

function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggle = () => setIsVisible(window.scrollY > 400);
    window.addEventListener("scroll", toggle, { passive: true });
    return () => window.removeEventListener("scroll", toggle);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-4 left-4 z-40 w-11 h-11 rounded-full bg-surface shadow-md3-level3 border border-outline-variant flex items-center justify-center text-[#25D366] hover:bg-[#f0fdf4] hover:border-[#25D366] hover:shadow-md3-level4 transition-all active:scale-90"
      aria-label="Scroll to top"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 bg-surface rounded-xl md:rounded-2xl border border-outline-variant shadow-md3-level1 animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-5 shadow-inner">
        <Building2 className="w-8 h-8 md:w-10 md:h-10 text-[#cbd5e1]" />
      </div>
      <h3 className="text-lg md:text-xl font-bold text-on-surface mb-2 text-center">
        No properties yet
      </h3>
      <p className="text-sm text-on-surface-variant text-center max-w-sm mb-6 px-4">
        Add your first property to start managing listings and let the WhatsApp bot handle inquiries automatically
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 hover:-translate-y-0.5 transition-all active:scale-95"
      >
        <Plus className="w-4 h-4" />
        Add Your First Property
      </button>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  iconBg,
  iconColor,
  label,
  value,
  sub,
  subColor = "text-[#25D366]",
  delay = 0,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string | number;
  sub: React.ReactNode;
  subColor?: string;
  delay?: number;
}) {
  return (
    <div
      className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-md3-level1 hover:shadow-md3-level2 hover:-translate-y-0.5 transition-all animate-fadeIn"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />
      </div>
      <div>
        <div className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {label}
        </div>
        <div className="text-xl md:text-2xl font-bold text-on-surface">
          {value}
        </div>
        <div className={`text-[10px] md:text-xs mt-0.5 ${subColor}`}>{sub}</div>
      </div>
    </div>
  );
}

// ─── Property Card ─────────────────────────────────────────────────────────────

function PropertyCard({
  property,
  onView,
  onEdit,
  delay = 0,
}: {
  property: Property;
  onView: () => void;
  onEdit: () => void;
  delay?: number;
}) {
  const { show } = useToast();

  const typeLabels: Record<string, string> = {
    apartment: "Apartment",
    house: "House",
    studio: "Studio",
    bedsitter: "Bedsitter",
    mansion: "Mansion",
  };

  const statusBadges: Record<string, { bg: string; text: string; label: string }> = {
    available: { bg: "bg-[#25D366]", text: "text-white", label: "Available" },
    partial: { bg: "bg-[#f59e0b]", text: "text-white", label: "Partial" },
    full: { bg: "bg-[#ef4444]", text: "text-white", label: "Full" },
  };

  const status = statusBadges[property.status];

  return (
    <div
      className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant overflow-hidden shadow-md3-level1 hover:shadow-md3-level3 hover:-translate-y-1 transition-all animate-fadeIn cursor-pointer"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onView}
    >
      {/* Image Area */}
      <div className={`relative h-40 md:h-48 bg-gradient-to-br ${property.imageGradient} flex items-center justify-center overflow-hidden`}>
        <span className="text-4xl md:text-5xl">🏢</span>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start">
          <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${status.bg} ${status.text}`}>
            {status.label}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              show({ text: "Options coming soon" });
            }}
            className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5 md:p-4">
        <h3 className="font-bold text-on-surface text-sm md:text-base mb-1">
          {property.name}
        </h3>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-3 md:mb-4">
          <MapPin className="w-3 h-3" />
          {property.location}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-3 md:mb-4">
          <div className="bg-surface-container-lowest rounded-lg md:rounded-xl p-2 md:p-2.5 text-center">
            <div className="font-bold text-on-surface text-sm md:text-base">{property.units}</div>
            <div className="text-[10px] md:text-xs text-on-surface-variant">Units</div>
          </div>
          <div className="bg-surface-container-lowest rounded-lg md:rounded-xl p-2 md:p-2.5 text-center">
            <div className="font-bold text-[#25D366] text-sm md:text-base">{property.occupied}</div>
            <div className="text-[10px] md:text-xs text-on-surface-variant">Occupied</div>
          </div>
          <div className="bg-surface-container-lowest rounded-lg md:rounded-xl p-2 md:p-2.5 text-center">
            <div className="font-bold text-[#f59e0b] text-sm md:text-base">{property.vacant}</div>
            <div className="text-[10px] md:text-xs text-on-surface-variant">Vacant</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-outline-variant my-3 md:my-4" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-on-surface-variant">From</div>
            <div className="font-bold text-[#25D366]">{property.priceLabel}</div>
            <div className="text-[10px] text-on-surface-variant">/mo</div>
          </div>
          <div className="flex gap-1.5 md:gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onView();
              }}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-[#f0fdf4] text-[#25D366] text-xs font-bold hover:bg-[#25D366] hover:text-white transition-all"
            >
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-surface border-2 border-outline-variant text-xs font-bold text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Bar */}
      <div className="bg-[#f0fdf4] border-t border-[#bbf7d0] px-3.5 md:px-4 py-2 md:py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#25D366] animate-pulse" />
          <span className="text-[10px] md:text-xs font-semibold text-[#128C7E]">WhatsApp bot active</span>
        </div>
        <span className="text-[10px] md:text-xs text-on-surface-variant">{property.inquiries} inquiries</span>
      </div>
    </div>
  );
}

// ─── Add Property Card ────────────────────────────────────────────────────────

function AddPropertyCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-surface border-2 border-dashed border-outline-variant rounded-xl md:rounded-2xl min-h-[320px] md:min-h-[380px] flex flex-col items-center justify-center gap-3 hover:border-[#25D366] hover:bg-[#f0fdf4] transition-all animate-fadeIn"
    >
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-surface border-2 border-outline-variant flex items-center justify-center text-2xl md:text-3xl transition-all group-hover:bg-[#25D366] group-hover:border-[#25D366] group-hover:text-white">
        <Plus className="w-6 h-6 md:w-7 md:h-7" />
      </div>
      <h3 className="font-bold text-on-surface text-base md:text-lg">Add Property</h3>
      <p className="text-sm text-on-surface-variant text-center max-w-[200px] px-4">
        List your first property and let the WhatsApp bot handle inquiries
      </p>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropertiesPage() {
  const { user } = useAuth();
  const { impactLight, impactMedium, notificationSuccess } = useHaptics();
  const { show: showToast } = useToast();

  // Status bar
  const [headerScrolled, setHeaderScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setHeaderScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  useStatusBar({ color: headerScrolled ? "#ffffff" : "#25D366", style: headerScrolled ? "dark" : "light" });

  // Data state
  const [properties] = useState<Property[]>(SAMPLE_PROPERTIES);
  const [loading] = useState(false);

  // UI state
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter logic
  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalProperties = properties.length;
  const totalUnits = properties.reduce((sum, p) => sum + p.units, 0);
  const totalOccupied = properties.reduce((sum, p) => sum + p.occupied, 0);
  const totalVacant = properties.reduce((sum, p) => sum + p.vacant, 0);
  const totalInquiries = properties.reduce((sum, p) => sum + p.inquiries, 0);

  // Handlers
  const handleView = (property: Property) => {
    setSelectedProperty(property);
    setDrawerOpen(true);
    impactLight();
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setModalOpen(true);
    impactMedium();
  };

  const handleAddNew = () => {
    setSelectedProperty(null);
    setModalOpen(true);
    impactMedium();
  };

  const handleSave = (data: Partial<Property>) => {
    if (selectedProperty) {
      showToast({ text: "Property updated successfully" });
      notificationSuccess();
    } else {
      showToast({ text: "Property added successfully" });
      notificationSuccess();
    }
    setModalOpen(false);
  };

  const filterCounts = {
    all: properties.length,
    available: properties.filter((p) => p.status === "available").length,
    partial: properties.filter((p) => p.status === "partial").length,
    full: properties.filter((p) => p.status === "full").length,
  };

  return (
    <div className="overflow-x-hidden px-3 md:px-6 py-0 md:py-4 pb-2 bg-surface min-h-screen">
      {/* Scroll to top */}
      <ScrollToTop />

      {/* Page Header */}
      <div className="hidden md:flex items-end justify-between py-4 mb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">
            My <span className="text-[#25D366]">Properties</span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage your listings — WhatsApp bot handles inquiries automatically
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => showToast({ text: "Map view coming soon" })}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all"
          >
            <MapPin className="w-4 h-4" />
            View on Map
          </button>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-sm font-semibold shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 hover:-translate-y-0.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Property
          </button>
        </div>
      </div>

      {/* Mobile Add Button */}
      <div className="md:hidden px-3 mt-3 mb-3">
        <button
          onClick={handleAddNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold text-sm shadow-md3-level3 shadow-[#25D366]/25 hover:shadow-md3-level4 hover:-translate-y-0.5 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </div>

      <main className="px-0 md:pt-4 space-y-3 md:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
          <StatCard
            icon={Building2}
            iconBg="bg-[#f0fdf4]"
            iconColor="text-[#25D366]"
            label="Total Properties"
            value={totalProperties}
            sub={
              <>
                <span className="text-[#25D366] font-bold">+2</span> added this month
              </>
            }
            delay={50}
          />
          <StatCard
            icon={DoorOpen}
            iconBg="bg-[#eff6ff]"
            iconColor="text-[#3b82f6]"
            label="Total Units"
            value={totalUnits}
            sub={
              <>
                <span className="text-[#25D366] font-bold">{totalOccupied}</span> occupied ·{" "}
                <span className="text-[#f59e0b] font-bold">{totalVacant}</span> vacant
              </>
            }
            subColor="text-on-surface-variant"
            delay={100}
          />
          <StatCard
            icon={MessageCircle}
            iconBg="bg-[#fffbeb]"
            iconColor="text-[#f59e0b]"
            label="WhatsApp Inquiries"
            value={totalInquiries}
            sub={
              <>
                <span className="text-[#25D366] font-bold">+32</span> this week
              </>
            }
            delay={150}
          />
          <StatCard
            icon={Bot}
            iconBg="bg-[#f5f3ff]"
            iconColor="text-[#8b5cf6]"
            label="Bot Response Rate"
            value="98%"
            sub={
              <>
                <span className="text-[#25D366] font-bold">Excellent</span> — avg 4s reply
              </>
            }
            delay={200}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-surface rounded-xl md:rounded-2xl border border-outline-variant p-3 md:p-4 shadow-md3-level1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            <input
              type="text"
              placeholder="Search properties, locations…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-outline-variant bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-[#25D366] focus:outline-none transition-colors"
            />
          </div>

          {/* Filters & View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                statusFilter === "all"
                  ? "bg-[#25D366] text-white border-[#25D366]"
                  : "bg-surface text-on-surface-variant border-outline-variant hover:border-[#25D366] hover:text-[#25D366]"
              }`}
            >
              All ({filterCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter("available")}
              className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                statusFilter === "available"
                  ? "bg-[#25D366] text-white border-[#25D366]"
                  : "bg-surface text-on-surface-variant border-outline-variant hover:border-[#25D366] hover:text-[#25D366]"
              }`}
            >
              Available ({filterCounts.available})
            </button>
            <button
              onClick={() => setStatusFilter("partial")}
              className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                statusFilter === "partial"
                  ? "bg-[#f59e0b] text-white border-[#f59e0b]"
                  : "bg-surface text-on-surface-variant border-outline-variant hover:border-[#f59e0b]"
              }`}
            >
              Partial ({filterCounts.partial})
            </button>
            <button
              onClick={() => setStatusFilter("full")}
              className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${
                statusFilter === "full"
                  ? "bg-[#ef4444] text-white border-[#ef4444]"
                  : "bg-surface text-on-surface-variant border-outline-variant hover:border-[#ef4444]"
              }`}
            >
              Full ({filterCounts.full})
            </button>

            {/* View Toggle */}
            <div className="flex gap-1 bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-1 ml-2">
              <button
                onClick={() => setView("grid")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  view === "grid"
                    ? "bg-[#25D366] text-white"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  view === "list"
                    ? "bg-[#25D366] text-white"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
            <p className="mt-4 text-sm text-on-surface-variant">Loading properties...</p>
          </div>
        ) : filteredProperties.length === 0 && statusFilter === "all" && !searchTerm ? (
          <EmptyState onAdd={handleAddNew} />
        ) : filteredProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Search className="w-12 h-12 text-on-surface-variant/30 mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">
              No matching properties
            </h3>
            <p className="text-sm text-on-surface-variant text-center mb-4">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="px-4 py-2 rounded-xl border-2 border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={`grid gap-3 md:gap-4 ${
            view === "grid"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-1"
          }`}>
            {filteredProperties.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                onView={() => handleView(property)}
                onEdit={() => handleEdit(property)}
                delay={index * 50}
              />
            ))}
            {statusFilter === "all" && !searchTerm && (
              <AddPropertyCard onClick={handleAddNew} />
            )}
          </div>
        )}
      </main>

      {/* Modal */}
      <PropertyModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        property={selectedProperty}
        onSave={handleSave}
      />

      {/* Drawer */}
      <PropertyDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        property={selectedProperty}
      />
    </div>
  );
}
