"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Order } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditOrderModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: OrderFormData) => Promise<void>;
}

export interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  paymentMethod: string;
  status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { value: "Cash on Delivery", label: "Cash on Delivery", icon: "fa-money-bill-wave" },
  { value: "M-Pesa", label: "M-Pesa", icon: "fa-mobile-alt" },
  { value: "Bank Transfer", label: "Bank Transfer", icon: "fa-university" },
  { value: "Credit Card", label: "Credit Card", icon: "fa-credit-card" },
  { value: "PayPal", label: "PayPal", icon: "fa-paypal" },
] as const;

const ORDER_STATUSES = [
  { value: "pending", label: "Pending", color: "bg-yellow-500", icon: "fa-clock" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-500", icon: "fa-check" },
  { value: "processing", label: "Processing", color: "bg-purple-500", icon: "fa-cog" },
  { value: "shipped", label: "Shipped", color: "bg-indigo-500", icon: "fa-shipping-fast" },
  { value: "delivered", label: "Delivered", color: "bg-green-500", icon: "fa-check-double" },
  { value: "cancelled", label: "Cancelled", color: "bg-red-500", icon: "fa-times" },
  { value: "refunded", label: "Refunded", color: "bg-gray-500", icon: "fa-undo" },
] as const;

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  paymentMethod?: string;
}

function validateForm(form: OrderFormData): FormErrors {
  const errors: FormErrors = {};

  if (!form.customerName.trim()) {
    errors.customerName = "Customer name is required";
  } else if (form.customerName.trim().length < 2) {
    errors.customerName = "Name must be at least 2 characters";
  }

  if (!form.customerPhone.trim()) {
    errors.customerPhone = "Phone number is required";
  } else if (!/^[\d\s\-\+\(\)]{7,}$/.test(form.customerPhone.trim())) {
    errors.customerPhone = "Please enter a valid phone number";
  }

  if (form.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail.trim())) {
    errors.customerEmail = "Please enter a valid email address";
  }

  if (!form.customerAddress.trim()) {
    errors.customerAddress = "Delivery address is required";
  } else if (form.customerAddress.trim().length < 10) {
    errors.customerAddress = "Address must be at least 10 characters";
  }

  if (!form.paymentMethod) {
    errors.paymentMethod = "Please select a payment method";
  }

  return errors;
}

// ─── Input Component ──────────────────────────────────────────────────────────

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: string;
}

function FormInput({ label, error, icon, className = "", ...props }: FormInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#64748b]">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <i className={`fas ${icon} text-sm`} />
          </div>
        )}
        <input
          className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30"
              : "border-[#e2e8f0] hover:border-gray-300"
          } ${icon ? "pl-10" : ""} ${className}`}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
            <i className="fas fa-exclamation-circle" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium animate-fadeIn">{error}</p>}
    </div>
  );
}

// ─── Textarea Component ───────────────────────────────────────────────────────

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  icon?: string;
}

function FormTextarea({ label, error, icon, className = "", ...props }: FormTextareaProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#64748b]">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-3.5 text-gray-400">
            <i className={`fas ${icon} text-sm`} />
          </div>
        )}
        <textarea
          className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 resize-none ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30"
              : "border-[#e2e8f0] hover:border-gray-300"
          } ${icon ? "pl-10" : ""} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium animate-fadeIn">{error}</p>}
    </div>
  );
}

// ─── Select Component ─────────────────────────────────────────────────────────

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  icon?: string;
  options: readonly { value: string; label: string; icon?: string; color?: string }[];
}

function FormSelect({ label, error, icon, options, className = "", ...props }: FormSelectProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-[#64748b]">
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <i className={`fas ${icon} text-sm`} />
          </div>
        )}
        <select
          className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 appearance-none cursor-pointer bg-white ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30"
              : "border-[#e2e8f0] hover:border-gray-300"
          } ${icon ? "pl-10" : ""} ${className}`}
          {...props}
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <i className="fas fa-chevron-down text-xs" />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 font-medium animate-fadeIn">{error}</p>}
    </div>
  );
}

// ─── Status Badge Component ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const statusConfig = ORDER_STATUSES.find((s) => s.value === status);
  if (!statusConfig) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-white ${statusConfig.color}`}>
      <i className={`fas ${statusConfig.icon} text-[10px]`} />
      {statusConfig.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function EditOrderModal({ order, isOpen, onClose, onSave }: EditOrderModalProps) {
  const [editForm, setEditForm] = useState<OrderFormData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    paymentMethod: "",
    status: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const originalFormRef = useRef<OrderFormData | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Initialize form when order changes
  useEffect(() => {
    if (order) {
      const initialData: OrderFormData = {
        customerName: order.customerName || "",
        customerPhone: order.customerPhone || "",
        customerEmail: order.customerEmail || "",
        customerAddress: order.customerAddress || "",
        paymentMethod: order.paymentMethod || "",
        status: order.status || "",
      };
      setEditForm(initialData);
      originalFormRef.current = { ...initialData };
      setErrors({});
      setHasChanges(false);
      setShowUnsavedWarning(false);
    }
  }, [order]);

  // Track changes
  useEffect(() => {
    if (originalFormRef.current) {
      const changed = Object.keys(editForm).some(
        (key) => editForm[key as keyof OrderFormData] !== originalFormRef.current?.[key as keyof OrderFormData]
      );
      setHasChanges(changed);
    }
  }, [editForm]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (hasChanges) {
          setShowUnsavedWarning(true);
        } else {
          onClose();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasChanges, onClose, editForm]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setEditForm((prev) => ({ ...prev, [name]: value }));
      // Clear error when user starts typing
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const handleSave = async () => {
    const validationErrors = validateForm(editForm);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editForm);
      onClose();
    } catch (error) {
      console.error("Failed to save order:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAttempt = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  if (!isOpen || !order) return null;

  const orderNumber = order.orderNumber || order.id.substring(0, 8);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[2500] animate-fadeIn"
        onClick={handleCloseAttempt}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          ref={modalRef}
          className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl pointer-events-auto animate-slideUp max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)] animate-fadeIn">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 animate-slideUp">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-lg shadow-lg flex-shrink-0">
                  <i className="fas fa-edit" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#1e293b] truncate">
                    Edit Order
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-[#64748b]">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                      #{orderNumber}
                    </span>
                    <StatusBadge status={editForm.status} />
                  </div>
                </div>
              </div>
              <button
                className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-95 flex-shrink-0"
                onClick={handleCloseAttempt}
                title="Close (Esc)"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
            {/* Customer Name */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.05s' }}>
            <FormInput
              label="Customer Name"
              name="customerName"
              value={editForm.customerName}
              onChange={handleInputChange}
              placeholder="Enter customer name"
              error={errors.customerName}
              icon="fa-user"
              required
            />
            </div>

            {/* Phone & Email Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <FormInput
                label="Phone Number"
                name="customerPhone"
                type="tel"
                value={editForm.customerPhone}
                onChange={handleInputChange}
                placeholder="+1 234 567 890"
                error={errors.customerPhone}
                icon="fa-phone-alt"
                required
              />
              <FormInput
                label="Email"
                name="customerEmail"
                type="email"
                value={editForm.customerEmail}
                onChange={handleInputChange}
                placeholder="customer@example.com"
                error={errors.customerEmail}
                icon="fa-envelope"
              />
            </div>

            {/* Address */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.15s' }}>
            <FormTextarea
              label="Delivery Address"
              name="customerAddress"
              value={editForm.customerAddress}
              onChange={handleInputChange}
              placeholder="Enter full delivery address"
              error={errors.customerAddress}
              icon="fa-map-marker-alt"
              rows={3}
              required
            />
            </div>

            {/* Payment Method */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <FormSelect
              label="Payment Method"
              name="paymentMethod"
              value={editForm.paymentMethod}
              onChange={handleInputChange}
              error={errors.paymentMethod}
              icon="fa-credit-card"
              options={PAYMENT_METHODS}
              required
            />
            </div>

            {/* Status */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.25s' }}>
            <FormSelect
              label="Order Status"
              name="status"
              value={editForm.status}
              onChange={handleInputChange}
              icon="fa-tasks"
              options={ORDER_STATUSES}
              required
            />
            </div>

            {/* Change Summary */}
            {hasChanges && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 animate-slideUp">
                <div className="flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Unsaved Changes</p>
                    <p className="text-blue-600/80 text-xs mt-0.5">
                      Press <kbd className="px-1.5 py-0.5 bg-white rounded text-xs font-mono border border-blue-200">Ctrl+S</kbd> to save
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex gap-3 animate-fadeIn" style={{ animationDelay: '0.3s' }}>
            <button
              className="flex-1 px-4 py-3 bg-white border-2 border-[#e2e8f0] text-[#64748b] rounded-xl font-semibold text-sm hover:border-gray-400 hover:text-gray-700 transition-all active:scale-95 touch-manipulation"
              onClick={handleCloseAttempt}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:from-[#22c55e] hover:to-[#0d9488] transition-all active:scale-95 touch-manipulation disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUnsavedWarning(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-slideUp">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-amber-500" />
            </div>
            <h3 className="text-xl font-bold text-[#1e293b] text-center mb-2">
              Unsaved Changes
            </h3>
            <p className="text-[#64748b] text-center mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all active:scale-95"
                onClick={() => setShowUnsavedWarning(false)}
              >
                Keep Editing
              </button>
              <button
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all active:scale-95 shadow-lg"
                onClick={() => {
                  setShowUnsavedWarning(false);
                  onClose();
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}