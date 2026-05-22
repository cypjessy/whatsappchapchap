"use client";

import { useState, useEffect } from "react";
import {
  X,
  Building2,
  Home,
  Castle,
  BedDouble,
  MapPin,
  DollarSign,
  Grid3X3,
  Image,
  Send,
  ChevronRight,
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

const PROPERTY_TYPES = [
  { id: "apartment", label: "Apartment", icon: Building2 },
  { id: "house", label: "House", icon: Home },
  { id: "studio", label: "Studio", icon: Home },
  { id: "bedsitter", label: "Bedsitter", icon: BedDouble },
  { id: "mansion", label: "Mansion", icon: Castle },
];

const AMENITIES = [
  { id: "parking", label: "Parking", icon: "🅿️" },
  { id: "wifi", label: "WiFi", icon: "📶" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "water", label: "Water", icon: "💧" },
  { id: "balcony", label: "Balcony", icon: "🏞️" },
  { id: "furnished", label: "Furnished", icon: "🛋️" },
  { id: "garden", label: "Garden", icon: "🌳" },
  { id: "gym", label: "Gym", icon: "🏋️" },
];

interface PropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  onSave: (data: Partial<Property>) => void;
}

export default function PropertyModal({
  isOpen,
  onClose,
  property,
  onSave,
}: PropertyModalProps) {
  const { show } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    type: "apartment" as Property["type"],
    units: 1,
    price: 0,
    bedrooms: 1,
    bathrooms: 1,
    amenities: [] as string[],
    description: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name,
        location: property.location,
        type: property.type,
        units: property.units,
        price: property.price,
        bedrooms: 2,
        bathrooms: 1,
        amenities: [],
        description: "",
      });
    } else {
      setFormData({
        name: "",
        location: "",
        type: "apartment",
        units: 1,
        price: 0,
        bedrooms: 1,
        bathrooms: 1,
        amenities: [],
        description: "",
      });
    }
  }, [property, isOpen]);

  const toggleAmenity = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter((a) => a !== id)
        : [...prev.amenities, id],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      show({ text: "Please enter a property name" });
      return;
    }
    if (!formData.location.trim()) {
      show({ text: "Please enter a location" });
      return;
    }
    if (formData.price <= 0) {
      show({ text: "Please enter a valid price" });
      return;
    }

    setSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSave(formData);
    setSaving(false);
  };

  if (!isOpen) return null;

  const whatsappPreview = `🏠 *${formData.name || "Property Name"}*
📍 ${formData.location || "Location"}
💰 From KES ${formData.price?.toLocaleString() || "0"}/month

${formData.units} units available • ${formData.bedrooms}BR/${formData.bathrooms}BA

Reply with *UNIT NUMBER* to schedule a viewing!`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface border-b border-outline-variant px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <div>
            <h2 className="text-xl font-bold text-on-surface font-display">
              {property ? "Edit Property" : "Add New Property"}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {property ? "Update property details" : "Create a new property listing"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-surface-container-lowest hover:bg-[#fee2e2] hover:text-[#ef4444] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(92vh-180px)] p-6 space-y-6">
          {/* Property Type */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
              Property Type
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setFormData((prev) => ({ ...prev, type: type.id as Property["type"] }))}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      formData.type === type.id
                        ? "border-[#25D366] bg-[#f0fdf4] text-[#25D366]"
                        : "border-outline-variant text-on-surface-variant hover:border-[#25D366]/50"
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-1" />
                    <span className="text-xs font-semibold">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
              Basic Information
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface mb-1 block">
                  Property Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Greenview Apartments"
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-[#25D366] focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface mb-1 block">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g. Kilimani, Nairobi"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-outline-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-[#25D366] focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Total Units
                  </label>
                  <input
                    type="number"
                    value={formData.units}
                    onChange={(e) => setFormData((prev) => ({ ...prev, units: parseInt(e.target.value) || 1 }))}
                    min={1}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-surface text-sm text-on-surface focus:border-[#25D366] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Price (KES/month)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      placeholder="25000"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-outline-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-[#25D366] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Bedrooms per unit
                  </label>
                  <input
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bedrooms: parseInt(e.target.value) || 1 }))}
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-surface text-sm text-on-surface focus:border-[#25D366] focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface mb-1 block">
                    Bathrooms per unit
                  </label>
                  <input
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bathrooms: parseInt(e.target.value) || 1 }))}
                    min={0}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-outline-variant bg-surface text-sm text-on-surface focus:border-[#25D366] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
              Amenities
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity.id}
                  onClick={() => toggleAmenity(amenity.id)}
                  className={`p-2.5 rounded-xl border-2 text-center transition-all ${
                    formData.amenities.includes(amenity.id)
                      ? "border-[#25D366] bg-[#f0fdf4] text-[#25D366] font-bold"
                      : "border-outline-variant text-on-surface-variant hover:border-[#25D366]/50"
                  }`}
                >
                  <span className="text-xl block mb-1">{amenity.icon}</span>
                  <span className="text-[10px] font-semibold">{amenity.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
              Description
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Add a description for your property..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-outline-variant bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-[#25D366] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* WhatsApp Preview */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-3 flex items-center gap-2">
              WhatsApp Message Preview
              <div className="flex-1 h-px bg-outline-variant" />
            </div>
            <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
              <div className="text-xs font-bold text-[#128C7E] flex items-center gap-1.5 mb-3">
                <Send className="w-3.5 h-3.5" />
                Auto-generated message
              </div>
              <div className="bg-white rounded-xl p-3 text-sm text-on-surface shadow-sm whitespace-pre-line">
                {whatsappPreview}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-outline-variant px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border-2 border-outline-variant text-sm font-semibold text-on-surface-variant hover:border-[#ef4444] hover:text-[#ef4444] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white text-sm font-semibold shadow-lg shadow-[#25D366]/25 hover:shadow-[#25D366]/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <span>{property ? "Update Property" : "Add Property"}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
