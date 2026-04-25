"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { clientService, Client } from "@/lib/db";

interface EditClientModalProps {
  open: boolean;
  onClose: () => void;
  client: Client | null;
  onClientUpdated: () => void;
}

export default function EditClientModal({ open, onClose, client, onClientUpdated }: EditClientModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    location: "",
    preferredStyle: "",
    status: "active" as Client["status"],
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        phone: client.phone,
        email: client.email || "",
        location: client.location || "",
        preferredStyle: client.preferredStyle || "",
        status: client.status,
        notes: client.notes || "",
      });
    }
  }, [client]);

  if (!open || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !client) return;

    setLoading(true);
    try {
      const initials = formData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      await clientService.updateClient(user, client.id, {
        ...formData,
        initials,
      });

      onClientUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating client:", error);
      alert("Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-edit text-[#8b5cf6]"></i>
            Edit Client
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
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Preferred Style</label>
              <input
                type="text"
                value={formData.preferredStyle}
                onChange={(e) => setFormData({ ...formData, preferredStyle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
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
                  <i className="fas fa-spinner fa-spin mr-2"></i>Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save mr-2"></i>Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
