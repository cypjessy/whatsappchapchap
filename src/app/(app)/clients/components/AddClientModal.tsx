"use client";

import { useState, useEffect } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { clientService, Client } from "@/lib/db";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onClientCreated: () => void;
}

export default function AddClientModal({ open, onClose, onClientCreated }: AddClientModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    preferredStyle: "",
    status: "new" as Client["status"],
    notes: "",
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const initials = formData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      // Generate random gradient colors
      const gradients = [
        "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)",
        "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
        "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
        "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)",
        "linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)",
        "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
      ];
      const colors = ["#7c3aed", "#059669", "#be185d", "#15803d", "#c2410c", "#0369a1"];
      const randomIndex = Math.floor(Math.random() * gradients.length);

      await clientService.createClient(user, {
        name: formData.name,
        initials,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        preferredStyle: formData.preferredStyle,
        status: formData.status,
        verified: false,
        visits: 0,
        totalSpent: 0,
        rating: 0,
        services: [],
        notes: formData.notes,
        avatarGradient: gradients[randomIndex],
        avatarText: colors[randomIndex],
      });

      onClientCreated();
      onClose();
      setFormData({
        name: "",
        phone: "",
        email: "",
        location: "",
        preferredStyle: "",
        status: "new",
        notes: "",
      });
    } catch (error) {
      console.error("Error creating client:", error);
      alert("Failed to create client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-user-plus text-[#8b5cf6]"></i>
            Add New Client
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                placeholder="Client name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                placeholder="+254 7XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                placeholder="client@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                placeholder="City, Area"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Preferred Style</label>
              <input
                type="text"
                value={formData.preferredStyle}
                onChange={(e) => setFormData({ ...formData, preferredStyle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                placeholder="e.g., Knotless Braids"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Client["status"] })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              >
                <option value="new">New</option>
                <option value="active">Active</option>
                <option value="vip">VIP</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              placeholder="Any special notes about this client..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>Add Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
