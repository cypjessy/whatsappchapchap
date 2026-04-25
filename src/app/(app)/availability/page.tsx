"use client";

import { useState, useEffect } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { availabilityService, bookingService, AvailabilitySettings, DaySchedule, TimeOff, SpecialHours, Booking } from "@/lib/db";
import AddTimeSlotModal from "./components/AddTimeSlotModal";
import TimeOffModal from "./components/TimeOffModal";

const defaultWeeklySchedule: DaySchedule[] = [
  { dayOfWeek: 1, dayName: "Monday", enabled: true, slots: [] },
  { dayOfWeek: 2, dayName: "Tuesday", enabled: true, slots: [] },
  { dayOfWeek: 3, dayName: "Wednesday", enabled: true, slots: [] },
  { dayOfWeek: 4, dayName: "Thursday", enabled: true, slots: [] },
  { dayOfWeek: 5, dayName: "Friday", enabled: true, slots: [] },
  { dayOfWeek: 6, dayName: "Saturday", enabled: true, slots: [] },
  { dayOfWeek: 0, dayName: "Sunday", enabled: false, slots: [] },
];

const templates = [
  { id: "standard", name: "Standard Week", desc: "Mon-Sat, 9AM-6PM", icon: "fa-briefcase" },
  { id: "weekends", name: "Weekends Only", desc: "Sat-Sun, 10AM-4PM", icon: "fa-coffee" },
  { id: "evenings", name: "Evenings", desc: "Mon-Fri, 5PM-9PM", icon: "fa-moon" },
  { id: "custom", name: "Custom", desc: "Build your own", icon: "fa-sliders-h" },
];

const locations = [
  { id: "studio", name: "In-Studio", icon: "fa-store" },
  { id: "home", name: "Home Service", icon: "fa-home" },
  { id: "video", name: "Video Call", icon: "fa-video" },
  { id: "office", name: "Office Visit", icon: "fa-building" },
];

export default function AvailabilityPage() {
  const { mode } = useMode();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultWeeklySchedule);
  const [acceptingBookings, setAcceptingBookings] = useState(true);
  const [duration, setDuration] = useState("60");
  const [buffer, setBuffer] = useState("15");
  const [advance, setAdvance] = useState("30");
  const [cancelPolicy, setCancelPolicy] = useState("24");
  const [activeLocations, setActiveLocations] = useState<string[]>(["studio", "home"]);
  const [timezone, setTimezone] = useState("UTC");
  
  // Modals
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [timeOffList, setTimeOffList] = useState<TimeOff[]>([]);
  const [specialHoursList, setSpecialHoursList] = useState<SpecialHours[]>([]);
  
  // Calendar
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "info" | "warning">("info");

  useEffect(() => {
    if (mode === "service" && user) {
      loadAvailabilitySettings();
      loadTimeOff();
      loadBookings();
    }
  }, [mode, user]);

  const loadAvailabilitySettings = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await availabilityService.getAvailabilitySettings(user);
      if (data) {
        setSettings(data);
        setAcceptingBookings(data.acceptingBookings);
        setDuration(data.appointmentDuration.toString());
        setBuffer(data.bufferTime.toString());
        setAdvance(data.advanceBookingDays.toString());
        setCancelPolicy(data.cancellationPolicyHours.toString());
        setActiveLocations(data.activeLocations);
        setTimezone(data.timezone);
        if (data.weeklySchedule && data.weeklySchedule.length > 0) {
          setSchedule(data.weeklySchedule);
        }
      }
    } catch (error) {
      console.error("Error loading availability settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeOff = async () => {
    if (!user) return;
    try {
      const data = await availabilityService.getTimeOff(user);
      setTimeOffList(data);
    } catch (error) {
      console.error("Error loading time off:", error);
    }
  };

  const loadBookings = async () => {
    if (!user) return;
    try {
      const data = await bookingService.getBookings(user);
      setBookings(data);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const displayToast = (type: "success" | "info" | "warning", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const saveAvailability = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await availabilityService.saveAvailabilitySettings(user, {
        acceptingBookings,
        appointmentDuration: parseInt(duration),
        bufferTime: parseInt(buffer),
        advanceBookingDays: parseInt(advance),
        cancellationPolicyHours: parseInt(cancelPolicy),
        activeLocations,
        timezone,
        weeklySchedule: schedule,
      });
      displayToast("success", "Availability saved successfully!");
    } catch (error) {
      console.error("Error saving availability:", error);
      alert("Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  const toggleBookings = () => {
    setAcceptingBookings(!acceptingBookings);
    displayToast(acceptingBookings ? "warning" : "success", acceptingBookings ? "Bookings paused" : "You're now accepting bookings");
  };

  const toggleDay = (index: number) => {
    const newSchedule = [...schedule];
    newSchedule[index].enabled = !newSchedule[index].enabled;
    setSchedule(newSchedule);
  };

  const removeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    const slots = [...newSchedule[dayIndex].slots];
    slots.splice(slotIndex, 1);
    newSchedule[dayIndex].slots = slots;
    setSchedule(newSchedule);
    displayToast("info", "Time slot removed");
  };

  const addSlots = (dayIndex: number, slots: Array<{ startTime: string; endTime: string }>) => {
    const newSchedule = [...schedule];
    const timeSlots = slots.map((slot, idx) => ({
      id: `slot-${Date.now()}-${idx}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
    }));
    newSchedule[dayIndex].slots = [...newSchedule[dayIndex].slots, ...timeSlots];
    setSchedule(newSchedule);
    displayToast("success", `${slots.length} time slot(s) added`);
  };

  const applyTemplate = (templateId: string) => {
    let newSchedule: DaySchedule[] = [];
    
    switch (templateId) {
      case "standard":
        newSchedule = defaultWeeklySchedule.map(day => ({
          ...day,
          enabled: day.dayOfWeek !== 0,
          slots: day.dayOfWeek === 0 ? [] : [
            { id: "1", startTime: "09:00 AM", endTime: "10:00 AM" },
            { id: "2", startTime: "10:30 AM", endTime: "11:30 AM" },
            { id: "3", startTime: "12:00 PM", endTime: "01:00 PM" },
            { id: "4", startTime: "02:00 PM", endTime: "03:00 PM" },
            { id: "5", startTime: "03:30 PM", endTime: "04:30 PM" },
            { id: "6", startTime: "05:00 PM", endTime: "06:00 PM" },
          ],
        }));
        break;
      case "weekends":
        newSchedule = defaultWeeklySchedule.map(day => ({
          ...day,
          enabled: day.dayOfWeek === 0 || day.dayOfWeek === 6,
          slots: (day.dayOfWeek === 0 || day.dayOfWeek === 6) ? [
            { id: "1", startTime: "10:00 AM", endTime: "11:00 AM" },
            { id: "2", startTime: "11:30 AM", endTime: "12:30 PM" },
            { id: "3", startTime: "01:00 PM", endTime: "02:00 PM" },
            { id: "4", startTime: "02:30 PM", endTime: "03:30 PM" },
            { id: "5", startTime: "04:00 PM", endTime: "05:00 PM" },
          ] : [],
        }));
        break;
      case "evenings":
        newSchedule = defaultWeeklySchedule.map(day => ({
          ...day,
          enabled: day.dayOfWeek >= 1 && day.dayOfWeek <= 5,
          slots: (day.dayOfWeek >= 1 && day.dayOfWeek <= 5) ? [
            { id: "1", startTime: "05:00 PM", endTime: "06:00 PM" },
            { id: "2", startTime: "06:30 PM", endTime: "07:30 PM" },
            { id: "3", startTime: "07:30 PM", endTime: "08:30 PM" },
            { id: "4", startTime: "08:30 PM", endTime: "09:30 PM" },
          ] : [],
        }));
        break;
      default:
        return;
    }
    
    setSchedule(newSchedule);
    displayToast("success", `${templateId} template applied`);
  };

  const toggleLocation = (locationId: string) => {
    if (activeLocations.includes(locationId)) {
      setActiveLocations(activeLocations.filter((l) => l !== locationId));
    } else {
      setActiveLocations([...activeLocations, locationId]);
    }
  };

  const copyToAll = () => {
    if (schedule.length === 0) return;
    const firstDay = schedule[0];
    const newSchedule = schedule.map(day => ({
      ...day,
      slots: firstDay.slots,
      enabled: firstDay.enabled,
    }));
    setSchedule(newSchedule);
    displayToast("success", "Schedule copied to all days");
  };

  const clearAll = () => {
    const newSchedule = schedule.map(day => ({ ...day, slots: [] }));
    setSchedule(newSchedule);
    displayToast("info", "All time slots cleared");
  };

  const enableAll = () => {
    const newSchedule = schedule.map(day => ({ ...day, enabled: true }));
    setSchedule(newSchedule);
    displayToast("success", "All days enabled");
  };

  const disableAll = () => {
    const newSchedule = schedule.map(day => ({ ...day, enabled: false }));
    setSchedule(newSchedule);
    displayToast("info", "All days disabled");
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.filter(b => b.date === dateStr);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  if (mode !== "service") {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-[#64748b]">Switch to Service Mode to manage availability</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
              <i className="fas fa-clock text-[#8b5cf6]"></i>
              Availability & Schedule
            </h1>
            <p className="text-[#64748b] text-sm mt-1">Set your working hours and manage time off</p>
          </div>
          <button
            onClick={saveAvailability}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-[#8b5cf6] mb-4"></i>
          <p className="text-[#64748b]">Loading availability...</p>
        </div>
      ) : (
        <>
          {/* Accept Bookings Toggle */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-6 flex items-center gap-4 shadow-sm">
            <div
              onClick={toggleBookings}
              className={`w-14 h-8 rounded-full cursor-pointer transition-colors ${
                acceptingBookings ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed]" : "bg-[#e2e8f0]"
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform mt-1 ${
                  acceptingBookings ? "translate-x-7" : "translate-x-1"
                }`}
              ></div>
            </div>
            <div className="flex-1">
              <div className="font-bold text-[#1e293b]">Accept New Bookings</div>
              <div className={`text-sm ${acceptingBookings ? "text-[#10b981]" : "text-[#ef4444]"}`}>
                {acceptingBookings ? "You're open for business" : "Bookings paused"}
              </div>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
              <i className="fas fa-magic"></i>
              Quick Templates
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => applyTemplate(template.id)}
                  className="bg-white rounded-xl border-2 border-[#e2e8f0] p-4 cursor-pointer hover:border-[#8b5cf6] transition-all text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-[#f8fafc] flex items-center justify-center mx-auto mb-3 text-[#8b5cf6]">
                    <i className={`fas ${template.icon}`}></i>
                  </div>
                  <div className="font-bold text-sm text-[#1e293b]">{template.name}</div>
                  <div className="text-xs text-[#64748b]">{template.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden mb-6">
            <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-lg text-[#1e293b] flex items-center gap-2">
                <i className="fas fa-calendar-week text-[#8b5cf6]"></i>
                Weekly Schedule
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={disableAll}
                  className="px-3 py-1.5 bg-[#f8fafc] text-[#64748b] rounded-lg text-sm font-bold hover:bg-[#ef4444] hover:text-white transition-colors"
                >
                  Disable All
                </button>
                <button
                  onClick={enableAll}
                  className="px-3 py-1.5 bg-[#f8fafc] text-[#64748b] rounded-lg text-sm font-bold hover:bg-[#10b981] hover:text-white transition-colors"
                >
                  Enable All
                </button>
                <button
                  onClick={clearAll}
                  className="px-3 py-1.5 bg-[#f8fafc] text-[#64748b] rounded-lg text-sm font-bold hover:bg-[#ef4444] hover:text-white transition-colors"
                >
                  <i className="fas fa-trash mr-1"></i>
                  Clear All
                </button>
                <button
                  onClick={copyToAll}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-lg text-sm font-bold"
                >
                  <i className="fas fa-copy mr-1"></i>
                  Copy to All
                </button>
              </div>
            </div>

            {schedule.map((day, dayIndex) => (
              <div
                key={day.dayName}
                className={`p-4 border-b border-[#e2e8f0] last:border-b-0 ${!day.enabled ? "opacity-50" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 min-w-[120px]">
                    <div
                      onClick={() => toggleDay(dayIndex)}
                      className={`w-6 h-6 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all ${
                        day.enabled ? "bg-[#8b5cf6] border-[#8b5cf6]" : "bg-white border-[#e2e8f0]"
                      }`}
                    >
                      {day.enabled && <i className="fas fa-check text-white text-xs"></i>}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#1e293b]">{day.dayName}</div>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-2">
                    {day.enabled ? (
                      day.slots.length > 0 ? (
                        day.slots.map((slot, slotIndex) => (
                          <button
                            key={slot.id}
                            onClick={() => removeSlot(dayIndex, slotIndex)}
                            className="px-4 py-2 rounded-full border-2 border-[#e2e8f0] bg-white font-semibold text-sm text-[#1e293b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        ))
                      ) : (
                        <span className="text-[#64748b] text-sm py-2">Click + to add time slots</span>
                      )
                    ) : (
                      <span className="text-[#64748b] text-sm py-2">Day off</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedDayIndex(dayIndex);
                        setShowAddSlotModal(true);
                      }}
                      className="w-9 h-9 rounded-lg bg-[#f8fafc] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-colors"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Schedule Settings */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-4 flex items-center gap-2">
              <i className="fas fa-cog"></i>
              Schedule Settings
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">Appointment Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                  <option value="240">4 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">Buffer Between</label>
                <select
                  value={buffer}
                  onChange={(e) => setBuffer(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="0">No buffer</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">Advance Booking</label>
                <select
                  value={advance}
                  onChange={(e) => setAdvance(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="7">1 week</option>
                  <option value="14">2 weeks</option>
                  <option value="30">1 month</option>
                  <option value="60">2 months</option>
                  <option value="90">3 months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1e293b] mb-2">Cancellation Policy</label>
                <select
                  value={cancelPolicy}
                  onChange={(e) => setCancelPolicy(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] focus:outline-none focus:border-[#8b5cf6]"
                >
                  <option value="0">Same day</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Settings */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
              <i className="fas fa-map-marker-alt"></i>
              Service Locations
            </h2>
            <p className="text-sm text-[#64748b] mb-4">Select where you're available to provide services</p>
            <div className="flex flex-wrap gap-3">
              {locations.map((location) => (
                <button
                  key={location.id}
                  onClick={() => toggleLocation(location.id)}
                  className={`px-5 py-3 rounded-full border-2 font-bold text-sm transition-all flex items-center gap-2 ${
                    activeLocations.includes(location.id)
                      ? "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white border-[#8b5cf6]"
                      : "bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#8b5cf6]"
                  }`}
                >
                  <i className={`fas ${location.icon}`}></i>
                  {location.name}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Preview */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateMonth(-1)}
                  className="w-9 h-9 rounded-full bg-[#f8fafc] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-colors"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className="font-bold text-lg text-[#1e293b]">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className="w-9 h-9 rounded-full bg-[#f8fafc] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-colors"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-4 py-2 bg-[#f8fafc] text-[#64748b] rounded-lg text-sm font-bold hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
              >
                Today
              </button>
            </div>
            <div className="grid grid-cols-7">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-3 text-center font-bold text-xs uppercase text-[#64748b] bg-[#f8fafc]">
                  {day}
                </div>
              ))}
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
                    className={`p-2 min-h-[80px] ${
                      item.isOther ? "bg-[#f8fafc] text-[#64748b]" : item.isToday ? "bg-[rgba(139,92,246,0.05)]" : "bg-white"
                    }`}
                  >
                    {item.day && (
                      <>
                        <div className={`font-bold text-sm mb-1 ${item.isToday ? "text-[#8b5cf6]" : ""}`}>{item.day}</div>
                        {item.bookings && item.bookings.length > 0 && (
                          <div className="flex flex-col gap-1">
                            <div className="text-xs px-2 py-0.5 rounded font-semibold bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]">
                              {item.bookings.length} booking{item.bookings.length > 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Mobile FAB */}
          <button
            onClick={() => setShowTimeOffModal(true)}
            className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center text-2xl shadow-lg z-50"
          >
            <i className="fas fa-umbrella-beach"></i>
          </button>
        </>
      )}

      {/* Add Time Slot Modal */}
      <AddTimeSlotModal
        open={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        onAddSlots={(slots) => addSlots(selectedDayIndex, slots)}
        dayName={schedule[selectedDayIndex]?.dayName || ""}
      />

      {/* Time Off Modal */}
      <TimeOffModal
        open={showTimeOffModal}
        onClose={() => setShowTimeOffModal(false)}
        onTimeOffCreated={() => {
          loadTimeOff();
          displayToast("success", "Time off added successfully!");
        }}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[3000] bg-[#0f172a] text-white px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 min-w-[280px] animate-fadeIn">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              toastType === "success"
                ? "bg-[#10b981]/20 text-[#10b981]"
                : toastType === "warning"
                ? "bg-[#f59e0b]/20 text-[#f59e0b]"
                : "bg-[#3b82f6]/20 text-[#3b82f6]"
            }`}
          >
            <i
              className={`fas fa-${
                toastType === "success"
                  ? "check-circle"
                  : toastType === "warning"
                  ? "exclamation-triangle"
                  : "info-circle"
              }`}
            ></i>
          </div>
          <div className="flex-1 text-sm">{toastMessage}</div>
          <button onClick={() => setShowToast(false)} className="text-white/70 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
}
