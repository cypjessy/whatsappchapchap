"use client";

import { useState } from "react";
import {
  X,
  MapPin,
  CheckCircle,
  Clock,
  Users,
  MessageCircle,
  Send,
  Edit3,
  Share2,
  ChevronRight,
  Plus,
  Building,
  BedDouble,
  Bath,
  DollarSign,
} from "lucide-react";
import { useToast } from "@/hooks/useNativeAndroid";

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

interface Unit {
  id: string;
  name: string;
  status: "available" | "occupied";
  tenant?: string;
  rent: number;
}

const SAMPLE_UNITS: Unit[] = [
  { id: "1", name: "Unit 101", status: "occupied", tenant: "James Mwangi", rent: 28000 },
  { id: "2", name: "Unit 102", status: "occupied", tenant: "Sarah Ochieng", rent: 28000 },
  { id: "3", name: "Unit 103", status: "available", rent: 28000 },
  { id: "4", name: "Unit 104", status: "occupied", tenant: "John Kamau", rent: 28000 },
  { id: "5", name: "Unit 105", status: "available", rent: 28000 },
  { id: "6", name: "Unit 201", status: "occupied", tenant: "Mary Wanjiku", rent: 32000 },
  { id: "7", name: "Unit 202", status: "occupied", tenant: "Peter Otieno", rent: 32000 },
  { id: "8", name: "Unit 203", status: "available", rent: 32000 },
];

const SAMPLE_INQUIRIES = [
  { id: "1", name: "David Kimani", avatar: "DK", message: "Is unit 103 still available?", time: "2 min ago" },
  { id: "2", name: "Grace Atieno", avatar: "GA", message: "What's the deposit amount?", time: "15 min ago" },
  { id: "3", name: "Michael Ochieng", avatar: "MO", message: "Can I schedule a viewing tomorrow?", time: "1 hour ago" },
];

interface PropertyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export default function PropertyDrawer({
  isOpen,
  onClose,
  property,
}: PropertyDrawerProps) {
  const { show } = useToast();
  const [units] = useState<Unit[]>(SAMPLE_UNITS);
  const [inquiries] = useState(SAMPLE_INQUIRIES);
  const [activeTab, setActiveTab] = useState<"overview" | "units" | "inquiries">("overview");

  if (!isOpen || !property) return null;

  const availableUnits = units.filter((u) => u.status === "available");
  const occupiedUnits = units.filter((u) => u.status === "occupied");
  const occupancyRate = Math.round((occupiedUnits.length / units.length) * 100);
  const monthlyRevenue = occupiedUnits.reduce((sum, u) => sum + u.rent, 0);
  const potentialRevenue = units.reduce((sum, u) => sum + u.rent, 0);

  const statusBadge = {
    available: { bg: "bg-[#25D366]", text: "text-white", label: "Available" },
    partial: { bg: "bg-[#f59e0b]", text: "text-white", label: "Partial" },
    full: { bg: "bg-[#ef4444]", text: "text-white", label: "Full" },
  }[property.status];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-surface shadow-2xl flex flex-col overflow-hidden animate-slideInRight">
        {/* Header */}
        <div className="bg-surface border-b border-outline-variant px-6 py-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusBadge.bg} ${statusBadge.text}`}>
                <CheckCircle className="w-3 h-3" />
                {statusBadge.label}
              </span>
              <h2 className="text-xl font-bold text-on-surface font-display mt-2">
                {property.name}
              </h2>
              <div className="flex items-center gap-1.5 text-sm text-on-surface-variant mt-1">
                <MapPin className="w-4 h-4" />
                {property.location}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-surface-container-lowest hover:bg-[#fee2e2] hover:text-[#ef4444] flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-surface-container-lowest rounded-xl p-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "units", label: `Units (${units.length})` },
              { id: "inquiries", label: `Inquiries (${inquiries.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-surface shadow-sm text-on-surface"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6 animate-fadeIn">
              {/* Quick Stats */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  Property Overview
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-lowest rounded-xl p-4">
                    <div className="text-[10px] text-on-surface-variant mb-1">Total Units</div>
                    <div className="text-2xl font-bold text-on-surface font-display">{property.units}</div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl p-4">
                    <div className="text-[10px] text-on-surface-variant mb-1">Occupancy</div>
                    <div className={`text-2xl font-bold font-display ${occupancyRate >= 80 ? "text-[#25D366]" : occupancyRate >= 50 ? "text-[#f59e0b]" : "text-[#ef4444]"}`}>
                      {occupancyRate}%
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl p-4">
                    <div className="text-[10px] text-on-surface-variant mb-1">Monthly Revenue</div>
                    <div className="text-xl font-bold text-[#25D366] font-display">
                      KES {monthlyRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl p-4">
                    <div className="text-[10px] text-on-surface-variant mb-1">Potential</div>
                    <div className="text-xl font-bold text-on-surface font-display">
                      KES {potentialRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Unit Breakdown */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  Unit Breakdown
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-[#f0fdf4] rounded-xl p-4 text-center">
                    <CheckCircle className="w-5 h-5 text-[#25D366] mx-auto mb-1" />
                    <div className="text-xl font-bold text-[#25D366] font-display">{availableUnits.length}</div>
                    <div className="text-[10px] text-[#128C7E] font-semibold">Available</div>
                  </div>
                  <div className="flex-1 bg-[#fee2e2] rounded-xl p-4 text-center">
                    <Users className="w-5 h-5 text-[#ef4444] mx-auto mb-1" />
                    <div className="text-xl font-bold text-[#ef4444] font-display">{occupiedUnits.length}</div>
                    <div className="text-[10px] text-[#dc2626] font-semibold">Occupied</div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Script */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
                  WhatsApp Bot Script
                  <div className="flex-1 h-px bg-outline-variant" />
                </div>
                <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
                  <div className="bg-white rounded-xl p-3 text-sm text-on-surface shadow-sm">
                    <p className="font-bold text-[#128C7E] mb-2">🏠 {property.name}</p>
                    <p>📍 {property.location}</p>
                    <p>💰 From KES {property.price.toLocaleString()}/month</p>
                    <p className="mt-2 pt-2 border-t border-outline-variant">
                      Currently <span className="text-[#25D366] font-bold">{availableUnits.length} units available</span>
                    </p>
                    <p className="mt-2 text-on-surface-variant">
                      Reply with UNIT NUMBER to schedule a viewing!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "units" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                  All Units
                </div>
                <button
                  onClick={() => show({ text: "Add unit coming soon" })}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#f0fdf4] text-[#25D366] text-xs font-semibold hover:bg-[#25D366] hover:text-white transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Unit
                </button>
              </div>

              <div className="space-y-2">
                {units.map((unit) => (
                  <div
                    key={unit.id}
                    className="bg-surface border-2 border-outline-variant rounded-xl p-4 flex items-center justify-between hover:border-[#25D366] transition-colors"
                  >
                    <div>
                      <div className="font-bold text-on-surface font-display">{unit.name}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">
                        {unit.status === "occupied" ? (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {unit.tenant}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Ready for occupancy
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        unit.status === "available"
                          ? "bg-[#f0fdf4] text-[#25D366]"
                          : "bg-[#fee2e2] text-[#ef4444]"
                      }`}>
                        {unit.status === "available" ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Users className="w-3 h-3" />
                        )}
                        {unit.status === "available" ? "Available" : "Occupied"}
                      </div>
                      <div className="text-sm font-bold text-on-surface mt-1">
                        KES {unit.rent.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "inquiries" && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Recent WhatsApp Inquiries
              </div>

              <div className="space-y-2">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="bg-surface border border-outline-variant rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold text-sm">
                      {inquiry.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-on-surface text-sm">{inquiry.name}</div>
                      <div className="text-xs text-on-surface-variant truncate">{inquiry.message}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-on-surface-variant">{inquiry.time}</div>
                      <button
                        onClick={() => show({ text: "Reply coming soon" })}
                        className="mt-1 px-2 py-1 rounded-lg bg-[#f0fdf4] text-[#25D366] text-[10px] font-bold hover:bg-[#25D366] hover:text-white transition-all"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => show({ text: "Open WhatsApp" })}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg shadow-[#25D366]/25"
              >
                <MessageCircle className="w-4 h-4" />
                View All in WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-surface border-t border-outline-variant px-6 py-4 flex gap-2">
          <button
            onClick={() => {
              show({ text: "Edit coming soon" });
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={() => show({ text: "Share coming soon" })}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-[#25D366] hover:text-[#25D366] transition-all"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
          <button
            onClick={() => show({ text: "Opening WhatsApp..." })}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-sm font-semibold shadow-lg shadow-[#25D366]/25"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
