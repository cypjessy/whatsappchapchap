"use client";

import { useEffect, useRef, useState } from "react";
import { Booking } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { useAuth } from "@/context/AuthContext";

interface ViewBookingModalProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus?: (bookingId: string, status: Booking['status']) => void;
  onDelete?: (bookingId: string) => void;
  onEdit?: (booking: Booking) => void; // Add edit handler
  onConfirmPayment?: (bookingId: string, paymentProof: any) => Promise<void>; // Add payment confirmation
  onOpenPaymentModal?: () => void; // Open payment confirmation modal
}

export default function ViewBookingModal({ 
  booking, 
  open, 
  onClose, 
  onUpdateStatus,
  onDelete,
  onEdit,
  onConfirmPayment,
  onOpenPaymentModal
}: ViewBookingModalProps) {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open || !booking) return null;

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-[rgba(37,211,102,0.1)] text-[#10b981]';
      case 'pending': return 'bg-[rgba(245,158,11,0.1)] text-[#f59e0b]';
      case 'completed': return 'bg-[rgba(59,130,246,0.1)] text-[#3b82f6]';
      case 'cancelled': return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444]';
      default: return 'bg-[#f1f5f9] text-[#64748b]';
    }
  };

  const getPaymentStatusClass = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'unpaid': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleSendMessage = async () => {
    if (!booking) return;
    
    setSendingMessage(true);
    
    const message = `Hello ${booking.client},\n\nThis is a reminder for your upcoming booking:\n\nService: ${booking.service}\nDate: ${formatDate(booking.date)}\nTime: ${booking.time}\nLocation: ${booking.location}\nPrice: ${formatCurrency(booking.price)}\n\nThank you!`;
    
    try {
      if (user) {
        await sendEvolutionWhatsAppMessage(booking.phone, message, `tenant_${user.uid}`);
        alert('✅ Message sent successfully!');
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      window.open(`https://wa.me/${booking.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendReminder = async () => {
    if (!booking) return;
    
    setSendingMessage(true);
    
    const message = `Hello ${booking.client},\n\n🔔 REMINDER: Your booking is coming up!\n\n📋 Service: ${booking.service}\n📅 Date: ${formatDate(booking.date)}\n⏰ Time: ${booking.time}\n📍 Location: ${booking.location}\n💰 Price: ${formatCurrency(booking.price)}\n\nPlease arrive 5 minutes early. See you soon! 😊`;
    
    try {
      if (user) {
        await sendEvolutionWhatsAppMessage(booking.phone, message, `tenant_${user.uid}`);
        
        // Update booking with reminder sent tracking
        await import('@/lib/db').then(async ({ bookingService }) => {
          if (user) {
            await bookingService.updateBooking(user, booking.id, {
              reminderSent: true,
              reminderSentAt: new Date()
            });
          }
        });
        
        alert('✅ Reminder sent successfully!');
        // Reload to show updated reminder status
        window.location.reload();
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      window.open(`https://wa.me/${booking.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    } finally {
      setSendingMessage(false);
    }
  };

  // Safe balance calculation with fallbacks
  const balanceDue = Math.max(0, (booking.balance ?? booking.price) - (booking.deposit || 0));

  // Copy booking ID to clipboard
  const copyBookingId = () => {
    navigator.clipboard.writeText(booking.id);
    alert('📋 Booking ID copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slideUp { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>

      <div 
        className="bg-white w-full max-w-[600px] max-h-[92vh] sm:max-h-[85vh] rounded-t-[20px] sm:rounded-[20px] shadow-2xl animate-slideUp flex flex-col overflow-hidden" 
        onClick={(e) => e.stopPropagation()} 
        ref={modalRef}
      >
        
        {/* Drag Handle (Mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden cursor-grab">
          <div className="w-10 h-1 bg-[#e2e8f0] rounded-full"></div>
        </div>

        {/* Modal Header */}
        <div className="px-5 py-4 flex justify-between items-start gap-4 border-b border-[#e2e8f0]">
          <div className="flex-1 min-w-0">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${getStatusClass(booking.status)}`}>
              {booking.status === 'confirmed' && <i className="fas fa-check-circle"></i>}
              {booking.status === 'pending' && <i className="fas fa-clock"></i>}
              {booking.status === 'completed' && <i className="fas fa-check-double"></i>}
              {booking.status === 'cancelled' && <i className="fas fa-times-circle"></i>}
              {booking.status}
            </div>
            
            {/* Title */}
            <h2 className="text-xl font-extrabold text-[#1e293b] mb-1 leading-tight">
              {booking.service}
            </h2>
            <p className="text-sm text-[#64748b] flex items-center gap-2 flex-wrap">
              <i className="fas fa-calendar-alt"></i>
              {formatDate(booking.date)}
              <span className="mx-1">•</span>
              <i className="fas fa-clock"></i>
              {booking.time}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <button 
              onClick={() => onDelete?.(booking.id)}
              className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#64748b] flex items-center justify-center hover:bg-[#ef4444] hover:text-white transition-all"
              title="Delete Booking"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#64748b] flex items-center justify-center hover:bg-[#8b5cf6] hover:text-white transition-all"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          
          {/* Client Card */}
          <div className="bg-gradient-to-br from-[#ede9fe] to-[#f5f3ff] rounded-xl p-5 mb-5 border border-[#8b5cf6]/10">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center font-bold text-xl flex-shrink-0 relative ${booking.verified ? 'verified' : ''}`}>
                {booking.clientInitials}
                {booking.verified && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center text-xs border-2 border-white">
                    <i className="fas fa-check"></i>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-lg text-[#1e293b] mb-0.5 flex items-center gap-2">
                  {booking.client}
                  {booking.verified && (
                    <span className="text-xs text-green-600 font-semibold">Verified</span>
                  )}
                </div>
                <div className="text-sm text-[#64748b] flex items-center gap-1.5">
                  <i className="fab fa-whatsapp text-[#25D366]"></i>
                  {booking.phone}
                </div>
                {booking.email && (
                  <div className="text-sm text-[#64748b] flex items-center gap-1.5 mt-1">
                    <i className="fas fa-envelope text-[#8b5cf6]"></i>
                    {booking.email}
                  </div>
                )}
              </div>
            </div>

            {/* Client Actions */}
            <div className="flex gap-2">
              <button 
                onClick={handleSendMessage}
                className="flex-1 px-4 py-2.5 bg-green-50 text-green-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-500 hover:text-white transition-all"
              >
                <i className="fab fa-whatsapp text-lg"></i>
                WhatsApp
              </button>
              <a 
                href={`tel:${booking.phone}`}
                className="flex-1 px-4 py-2.5 bg-white text-[#1e293b] rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border border-[#e2e8f0] hover:bg-[#8b5cf6] hover:text-white hover:border-[#8b5cf6] transition-all"
              >
                <i className="fas fa-phone"></i>
                Call
              </a>
            </div>
          </div>

          {/* Booking Details Grid */}
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
              <i className="fas fa-info-circle"></i>
              Booking Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Date */}
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#8b5cf6] flex items-center justify-center mb-3">
                  <i className="fas fa-calendar"></i>
                </div>
                <div className="text-xs text-[#64748b] mb-1">Date</div>
                <div className="font-bold text-sm text-[#1e293b]">{formatDate(booking.date)}</div>
              </div>

              {/* Time */}
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all">
                <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
                  <i className="fas fa-clock"></i>
                </div>
                <div className="text-xs text-[#64748b] mb-1">Time</div>
                <div className="font-bold text-sm text-[#1e293b]">{booking.time}</div>
              </div>

              {/* Duration */}
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <i className="fas fa-hourglass-half"></i>
                </div>
                <div className="text-xs text-[#64748b] mb-1">Duration</div>
                <div className="font-bold text-sm text-[#1e293b]">{booking.duration}</div>
              </div>

              {/* Location */}
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all">
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <div className="text-xs text-[#64748b] mb-1">Location</div>
                <div className="font-bold text-sm text-[#1e293b]">{booking.location}</div>
              </div>

              {/* Package Tier */}
              {booking.packageTier && (
                <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-[#8b5cf6] flex items-center justify-center mb-3">
                    <i className="fas fa-layer-group"></i>
                  </div>
                  <div className="text-xs text-[#64748b] mb-1">Package</div>
                  <div className="font-bold text-sm text-[#1e293b] capitalize">{booking.packageTier}</div>
                </div>
              )}

              {/* Booking Source */}
              {booking.source && (
                <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] hover:border-[#8b5cf6] transition-all">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                    booking.source === 'online' ? 'bg-green-50 text-green-600' :
                    booking.source === 'whatsapp' ? 'bg-[rgba(37,211,102,0.1)] text-[#25D366]' :
                    booking.source === 'phone' ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    <i className={`fas ${
                      booking.source === 'online' ? 'fa-globe' :
                      booking.source === 'whatsapp' ? 'fab fa-whatsapp' :
                      booking.source === 'phone' ? 'fa-phone' :
                      'fa-edit'
                    }`}></i>
                  </div>
                  <div className="text-xs text-[#64748b] mb-1">Booked Via</div>
                  <div className="font-bold text-sm text-[#1e293b] capitalize">{booking.source}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-5">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
              <i className="fas fa-credit-card"></i>
              Payment Information
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Total Price</span>
                <span className="font-extrabold text-lg text-[#8b5cf6]">{formatCurrency(booking.price)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748b]">Deposit Paid</span>
                <span className="font-bold text-green-600">{formatCurrency(booking.deposit || 0)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748b]">Balance Due</span>
                <span className="font-bold text-orange-600">{formatCurrency(balanceDue)}</span>
              </div>
              
              {booking.paymentMethod && (
                <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">Payment Method</span>
                  <span className="font-semibold text-sm capitalize flex items-center gap-1.5">
                    <i className={`fas ${
                      booking.paymentMethod === 'mpesa' ? 'fa-mobile-alt' :
                      booking.paymentMethod === 'card' ? 'fa-credit-card' :
                      booking.paymentMethod === 'bank' ? 'fa-university' :
                      'fa-money-bill-wave'
                    }`}></i>
                    {booking.paymentMethod}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Payment Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPaymentStatusClass(booking.paymentStatus || 'unpaid')}`}>
                  {booking.paymentStatus || 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Proof (if confirmed) */}
          {booking.paymentProof && (
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-wide text-green-600 mb-3 flex items-center gap-2">
                <i className="fas fa-check-circle"></i>
                Payment Confirmed
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748b]">Transaction ID</span>
                  <span className="font-mono font-semibold text-[#1e293b]">{booking.paymentProof.transactionId || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748b]">Amount Paid</span>
                  <span className="font-bold text-green-600">{formatCurrency(booking.paymentProof.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#64748b]">Paid At</span>
                  <span className="font-semibold text-[#1e293b]">
                    {booking.paymentProof.paidAt?.toDate ? 
                      booking.paymentProof.paidAt.toDate().toLocaleString() : 
                      'Unknown'
                    }
                  </span>
                </div>
                {booking.paymentProof.confirmedBy && (
                  <div className="flex justify-between items-center pt-2 border-t border-green-200">
                    <span className="text-sm text-[#64748b]">Confirmed By</span>
                    <span className="font-semibold text-[#1e293b]">{booking.paymentProof.confirmedBy}</span>
                  </div>
                )}
                {booking.paymentProof.proofImage && (
                  <div className="pt-2 border-t border-green-200">
                    <div className="text-sm text-[#64748b] mb-2">Payment Proof</div>
                    <img 
                      src={booking.paymentProof.proofImage} 
                      alt="Payment proof" 
                      className="w-full rounded-lg border border-green-300"
                    />
                  </div>
                )}
                {booking.paymentProof.notes && (
                  <div className="pt-2 border-t border-green-200">
                    <div className="text-sm text-[#64748b] mb-1">Notes</div>
                    <p className="text-sm text-[#64748b]">{booking.paymentProof.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.notes && (
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                <i className="fas fa-sticky-note"></i>
                Additional Notes
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
                <p className="text-sm text-[#64748b] leading-relaxed">{booking.notes}</p>
              </div>
            </div>
          )}

          {/* Special Requests */}
          {booking.specialRequests && (
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                <i className="fas fa-star"></i>
                Special Requests
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-[#64748b] leading-relaxed">{booking.specialRequests}</p>
              </div>
            </div>
          )}

          {/* Assigned Staff */}
          {booking.assignedTo && (
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                <i className="fas fa-user-tie"></i>
                Assigned Provider
              </div>
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center font-bold">
                  {booking.assignedTo.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="font-semibold text-[#1e293b]">{booking.assignedTo}</div>
              </div>
            </div>
          )}

          {/* Cancellation Reason */}
          {booking.status === 'cancelled' && booking.cancellationReason && (
            <div className="mb-5">
              <div className="text-xs font-bold uppercase tracking-wide text-[#ef4444] mb-3 flex items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                Cancellation Reason
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <p className="text-sm text-red-700 leading-relaxed">{booking.cancellationReason}</p>
              </div>
            </div>
          )}

          {/* Booking Metadata */}
          <div className="mb-2">
            <div className="text-xs font-bold uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
              <i className="fas fa-fingerprint"></i>
              Booking Reference
            </div>
            <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] space-y-3">
              {/* Booking ID with Copy */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#64748b] mb-1">Booking ID</div>
                  <code className="text-sm font-mono text-[#8b5cf6] font-semibold">{booking.id.slice(0, 12)}...</code>
                </div>
                <button 
                  onClick={copyBookingId}
                  className="px-3 py-1.5 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-lg text-xs font-semibold hover:bg-[#8b5cf6] hover:text-white transition-all"
                >
                  <i className="fas fa-copy mr-1"></i>Copy
                </button>
              </div>

              {/* Created & Updated */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#e2e8f0]">
                <div>
                  <div className="text-xs text-[#64748b] mb-1">Created</div>
                  <div className="text-sm font-semibold text-[#1e293b]">
                    {booking.createdAt?.toDate ? 
                      booking.createdAt.toDate().toLocaleDateString() : 
                      'Recent'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b] mb-1">Last Updated</div>
                  <div className="text-sm font-semibold text-[#1e293b]">
                    {booking.updatedAt?.toDate ? 
                      booking.updatedAt.toDate().toLocaleDateString() : 
                      '—'
                    }
                  </div>
                </div>
              </div>

              {/* Reschedule Info */}
              {booking.rescheduleCount && booking.rescheduleCount > 0 && (
                <div className="pt-2 border-t border-[#e2e8f0]">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#64748b]">Rescheduled</div>
                    <div className="text-sm font-semibold text-orange-600">
                      {booking.rescheduleCount} time{booking.rescheduleCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  {booking.originalDate && (
                    <div className="mt-1 text-xs text-[#64748b]">
                      Original: {formatDate(booking.originalDate)}
                    </div>
                  )}
                </div>
              )}

              {/* Reminder Status */}
              {booking.reminderSent !== undefined && (
                <div className="pt-2 border-t border-[#e2e8f0]">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#64748b]">Reminder Sent</div>
                    <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                      booking.reminderSent 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {booking.reminderSent ? '✓ Yes' : '✗ No'}
                    </div>
                  </div>
                  {booking.reminderSentAt && (
                    <div className="mt-1 text-xs text-[#64748b]">
                      At: {booking.reminderSentAt.toDate ? 
                        booking.reminderSentAt.toDate().toLocaleString() : 
                        'Unknown'
                      }
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#e2e8f0] bg-white sticky bottom-0">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Edit Button */}
            {onEdit && (
              <button 
                onClick={() => onEdit(booking)}
                className="px-4 py-3 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
              >
                <i className="fas fa-edit"></i>
                Edit
              </button>
            )}
            
            {/* Send Reminder Button */}
            <button 
              onClick={handleSendReminder}
              disabled={sendingMessage}
              className={`px-4 py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                sendingMessage ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-600'
              }`}
            >
              {sendingMessage ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-bell"></i>
                  Reminder
                </>
              )}
            </button>
            
            {/* WhatsApp Message */}
            <button 
              onClick={handleSendMessage}
              disabled={sendingMessage}
              className={`px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                sendingMessage ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {sendingMessage ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fab fa-whatsapp"></i>
                  Message
                </>
              )}
            </button>

            {/* Confirm Payment Button (if not paid) */}
            {onOpenPaymentModal && booking.paymentStatus !== 'paid' && (
              <button 
                onClick={onOpenPaymentModal}
                className="px-4 py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
              >
                <i className="fas fa-check-circle"></i>
                Confirm Payment
              </button>
            )}

            {/* Status Actions - Only show if no payment confirmation needed */}
            {!onConfirmPayment && booking.status !== 'completed' && booking.status !== 'cancelled' && (
              <button 
                onClick={() => onUpdateStatus?.(booking.id, 'completed')}
                className="px-4 py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all"
              >
                <i className="fas fa-check"></i>
                Complete
              </button>
            )}
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            {booking.status !== 'cancelled' && (
              <button 
                onClick={() => onUpdateStatus?.(booking.id, 'cancelled')}
                className="px-4 py-3 bg-red-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-600 transition-all"
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
            )}
            {booking.status === 'completed' || booking.status === 'cancelled' ? (
              <button 
                onClick={onClose}
                className="col-span-2 px-4 py-3 bg-[#8b5cf6] text-white rounded-xl font-bold hover:bg-[#7c3aed] transition-all"
              >
                Close
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="px-4 py-3 bg-gray-500 text-white rounded-xl font-bold hover:bg-gray-600 transition-all"
              >
                Close
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
