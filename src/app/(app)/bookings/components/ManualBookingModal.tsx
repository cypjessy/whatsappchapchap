"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { serviceService, bookingService, Booking, Service } from "@/lib/db";

interface ManualBookingModalProps {
  open: boolean;
  onClose: () => void;
  onBookingCreated: () => void;
}

export default function ManualBookingModal({ open, onClose, onBookingCreated }: ManualBookingModalProps) {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [deposit, setDeposit] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card" | "bank" | "">("");
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed");
  const [notes, setNotes] = useState("");

  // Load services on open
  useEffect(() => {
    if (open && user) {
      loadServices();
    }
  }, [open, user]);

  const loadServices = async () => {
    if (!user) return;
    setLoadingServices(true);
    try {
      const data = await serviceService.getServices(user);
      setServices(data);
      if (data.length > 0) {
        setServiceId(data[0].id);
        setPrice(data[0].priceMin || 0);
        setDuration(data[0].duration || "");
        setLocation(data[0].location || "");
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setLoadingServices(false);
    }
  };

  // Update price/duration/location when service changes
  useEffect(() => {
    const svc = services.find(s => s.id === serviceId);
    if (svc) {
      setPrice(svc.priceMin || 0);
      setDuration(svc.duration || "");
      setLocation(svc.location || "");
    }
  }, [serviceId, services]);

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setServiceId("");
    setDate("");
    setTime("");
    setDuration("");
    setLocation("");
    setPrice("");
    setDeposit("");
    setPaymentMethod("");
    setStatus("confirmed");
    setNotes("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !serviceId || !clientName || !clientPhone || !date || !time || price === "") return;

    setSaving(true);
    try {
      const selectedService = services.find(s => s.id === serviceId);
      const bookingData: Omit<Booking, "id" | "tenantId" | "createdAt" | "updatedAt"> = {
        client: clientName,
        clientInitials: clientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
        phone: clientPhone,
        service: selectedService?.name || "",
        serviceId,
        date,
        time,
        duration: duration || "1 hr",
        location: location || "TBD",
        price: Number(price),
        status,
        verified: false,
        notes,
        deposit: deposit ? Number(deposit) : 0,
        balance: Number(price) - (deposit ? Number(deposit) : 0),
        paymentMethod: paymentMethod || undefined,
        paymentStatus: deposit && deposit > 0 ? (deposit >= price ? 'paid' : 'partial') : 'unpaid',
      };

      // Save to bookings collection
      await bookingService.createBooking(user, bookingData);

      // Optionally update service bookings count
      if (selectedService) {
        await serviceService.updateServiceStats(user, selectedService.id, { bookings: 1 });
      }

      alert("Booking created successfully!");
      handleClose();
      onBookingCreated();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-1000 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-calendar-plus text-[#8b5cf6]"></i>
            Create Manual Booking
          </h2>
          <button className="modal-close" onClick={handleClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Client Info */}
            <div className="section-title">
              <i className="fas fa-user"></i>
              Client Information
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Client Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-input"
                  value={clientPhone}
                  onChange={e => setClientPhone(e.target.value)}
                  placeholder="+254 700 000 000"
                  required
                />
              </div>
            </div>

            {/* Service Selection */}
            <div className="section-title">
              <i className="fas fa-concierge-bell"></i>
              Service Details
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Service *</label>
                <select
                  className="form-input"
                  value={serviceId}
                  onChange={e => setServiceId(e.target.value)}
                  required
                >
                  {loadingServices ? (
                    <option>Loading services...</option>
                  ) : services.length === 0 ? (
                    <option>No services available</option>
                  ) : (
                    services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Time *</label>
                <input
                  type="time"
                  className="form-input"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input
                  type="text"
                  className="form-input"
                  value={duration}
                  readOnly
                  placeholder="Auto-filled from service"
                />
                <span className="helper-text">Auto-filled from service</span>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={location}
                  readOnly
                  placeholder="Auto-filled from service"
                />
                <span className="helper-text">Auto-filled from service</span>
              </div>
              <div className="form-group">
                <label className="form-label">Price (KES) *</label>
                <input
                  type="number"
                  className="form-input"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  min="0"
                  required
                />
              </div>
            </div>

            {/* Payment Details */}
            <div className="section-title">
              <i className="fas fa-credit-card"></i>
              Payment Details
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Deposit (KES)</label>
                <input
                  type="number"
                  className="form-input"
                  value={deposit}
                  onChange={e => setDeposit(e.target.value ? Number(e.target.value) : "")}
                  min="0"
                  max={price || undefined}
                  placeholder="0"
                />
                <span className="helper-text">Leave empty if no deposit</span>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-input"
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                >
                  <option value="">Select method</option>
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Status & Notes */}
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Status</label>
                <div className="mode-selector" style={{ padding: "0.375rem" }}>
                  <button
                    type="button"
                    className={`mode-btn ${status === "confirmed" ? "active" : ""}`}
                    onClick={() => setStatus("confirmed")}
                  >
                    <i className="fas fa-check-circle"></i>
                    Confirmed
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${status === "pending" ? "active" : ""}`}
                    onClick={() => setStatus("pending")}
                  >
                    <i className="fas fa-clock"></i>
                    Pending
                  </button>
                </div>
              </div>
              <div className="form-group full-width">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows={3}
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i>
                Create Booking
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
