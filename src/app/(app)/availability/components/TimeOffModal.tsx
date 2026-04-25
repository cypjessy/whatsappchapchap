"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { availabilityService } from "@/lib/db";

interface TimeOffModalProps {
  open: boolean;
  onClose: () => void;
  onTimeOffCreated: () => void;
}

export default function TimeOffModal({ open, onClose, onTimeOffCreated }: TimeOffModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reason: "",
    type: "vacation" as "vacation" | "sick" | "holiday" | "personal",
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.startDate || !formData.endDate) {
      alert("Please select start and end dates");
      return;
    }

    setLoading(true);
    try {
      await availabilityService.createTimeOff(user, {
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        type: formData.type,
      });

      onTimeOffCreated();
      onClose();
      setFormData({
        startDate: "",
        endDate: "",
        reason: "",
        type: "vacation",
      });
    } catch (error) {
      console.error("Error creating time off:", error);
      alert("Failed to create time off");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-umbrella-beach text-[#8b5cf6]"></i>
            Add Time Off
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-2">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
            >
              <option value="vacation">Vacation</option>
              <option value="sick">Sick Leave</option>
              <option value="holiday">Holiday</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">Start Date *</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#64748b] mb-2">End Date *</label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-2">Reason (Optional)</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              placeholder="Why are you taking time off?"
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
                  <i className="fas fa-check mr-2"></i>Add Time Off
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
