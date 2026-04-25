"use client";

import { useState } from "react";

interface AddTimeSlotModalProps {
  open: boolean;
  onClose: () => void;
  onAddSlots: (slots: Array<{ startTime: string; endTime: string }>) => void;
  dayName: string;
}

export default function AddTimeSlotModal({ open, onClose, onAddSlots, dayName }: AddTimeSlotModalProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [interval, setInterval] = useState("60");
  const [bulkMode, setBulkMode] = useState(true);

  if (!open) return null;

  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const intervalMin = parseInt(interval);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + intervalMin <= endMinutes) {
      const slotStartHour = Math.floor(currentMinutes / 60);
      const slotStartMin = currentMinutes % 60;
      const slotEndMinutes = currentMinutes + intervalMin;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;

      const formatTime = (h: number, m: number) => {
        const period = h >= 12 ? "PM" : "AM";
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${displayHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
      };

      slots.push({
        startTime: formatTime(slotStartHour, slotStartMin),
        endTime: formatTime(slotEndHour, slotEndMin),
      });

      currentMinutes += intervalMin;
    }

    return slots;
  };

  const handleAddSlots = () => {
    if (bulkMode) {
      const slots = generateTimeSlots();
      onAddSlots(slots);
    } else {
      const formatTime = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        const period = h >= 12 ? "PM" : "AM";
        const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${displayHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
      };

      onAddSlots([{
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      }]);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-clock text-[#8b5cf6]"></i>
            Add Time Slots - {dayName}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBulkMode(true)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                bulkMode
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white"
                  : "bg-[#f8fafc] text-[#64748b]"
              }`}
            >
              Bulk Add
            </button>
            <button
              onClick={() => setBulkMode(false)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${
                !bulkMode
                  ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white"
                  : "bg-[#f8fafc] text-[#64748b]"
              }`}
            >
              Single Slot
            </button>
          </div>

          {bulkMode ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#64748b] mb-2">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">Interval (minutes)</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                </select>
              </div>

              <div className="bg-[#f8fafc] rounded-lg p-4">
                <div className="text-xs font-bold text-[#64748b] uppercase mb-2">Preview</div>
                <div className="text-sm text-[#1e293b]">
                  Will generate {generateTimeSlots().length} time slots from {startTime} to {endTime}
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#64748b] mb-2">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSlots}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold hover:opacity-90 transition-all"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Slots
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
