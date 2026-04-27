"use client";

import { useState } from "react";
import { Booking, Order } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";
import { useAuth } from "@/context/AuthContext";

interface PaymentConfirmationModalProps {
  item: Booking | Order | null;
  itemType: 'booking' | 'order';
  open: boolean;
  onClose: () => void;
  onConfirm?: (itemId: string, paymentProof: any) => Promise<void>;
}

export default function PaymentConfirmationModal({ 
  item, 
  itemType,
  open, 
  onClose,
  onConfirm
}: PaymentConfirmationModalProps) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState(item ? (itemType === 'booking' ? (item as Booking).price : (item as Order).total) : 0);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [proofImage, setProofImage] = useState("");

  if (!open || !item) return null;

  const isBooking = itemType === 'booking';
  const booking = item as Booking;
  const order = item as Order;

  const itemName = isBooking ? booking.service : order.productName || `${order.products?.length || 0} items`;
  const customerName = isBooking ? booking.client : order.customerName;
  const totalAmount = isBooking ? booking.price : order.total;

  const handleConfirm = async () => {
    if (!item || !onConfirm) return;
    
    setConfirming(true);
    
    try {
      const paymentProof = {
        method: isBooking ? booking.paymentMethod || 'unknown' : order.paymentMethod || 'unknown',
        transactionId: transactionId || undefined,
        amount: amount,
        paidAt: new Date(),
        confirmedBy: user?.email || 'Admin',
        confirmedAt: new Date(),
        proofImage: proofImage || undefined,
        notes: paymentNotes || undefined,
      };

      await onConfirm(item.id, paymentProof);
      alert('✅ Payment confirmed successfully!');
      handleClose();
    } catch (error) {
      console.error("Error confirming payment:", error);
      alert('❌ Failed to confirm payment. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setTransactionId("");
    setAmount(totalAmount);
    setPaymentNotes("");
    setProofImage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={handleClose}>
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#e2e8f0] bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl">
              <i className="fas fa-check-circle"></i>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#1e293b]">Confirm Payment</h2>
              <p className="text-sm text-[#64748b]">{isBooking ? 'Booking' : 'Order'} #{item.id.slice(0, 8)}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          
          {/* Item Summary */}
          <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0]">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-[#64748b] mb-1">{isBooking ? 'Service' : 'Product'}</div>
                <div className="font-bold text-[#1e293b]">{itemName}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#64748b] mb-1">Total Amount</div>
                <div className="font-extrabold text-lg text-green-600">{formatCurrency(totalAmount)}</div>
              </div>
            </div>
            <div className="text-sm text-[#64748b]">
              <i className="fas fa-user mr-2"></i>
              {customerName}
            </div>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-2">
              Transaction ID / Reference Number
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              placeholder="e.g., QKH123456789"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
            />
            <p className="text-xs text-[#64748b] mt-1">Optional but recommended for tracking</p>
          </div>

          {/* Amount Paid */}
          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-2">
              Amount Received (KES)
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all font-bold text-lg"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              min="0"
            />
            {amount !== totalAmount && (
              <p className={`text-xs mt-1 ${amount < totalAmount ? 'text-orange-600' : 'text-green-600'}`}>
                {amount < totalAmount 
                  ? `⚠️ Partial payment: ${formatCurrency(totalAmount - amount)} remaining`
                  : amount > totalAmount
                  ? `✓ Overpayment: ${formatCurrency(amount - totalAmount)} extra`
                  : '✓ Full payment received'
                }
              </p>
            )}
          </div>

          {/* Proof Image URL */}
          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-2">
              Payment Proof Image URL (Optional)
            </label>
            <input
              type="url"
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
              placeholder="https://example.com/payment-screenshot.jpg"
              value={proofImage}
              onChange={(e) => setProofImage(e.target.value)}
            />
            <p className="text-xs text-[#64748b] mt-1">Screenshot of M-Pesa message or bank transfer</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-[#64748b] mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-[#e2e8f0] focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all resize-none"
              rows={3}
              placeholder="Any additional details about the payment..."
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] bg-white flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] text-[#64748b] rounded-xl font-bold hover:bg-[#f8fafc] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming || amount <= 0}
            className={`flex-1 px-4 py-3 bg-green-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              confirming || amount <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
            }`}
          >
            {confirming ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Confirming...
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                Confirm Payment
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
