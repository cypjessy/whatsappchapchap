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
  { value: "refunded", label: "Refunded", color: "bg-white0", icon: "fa-undo" },
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
      {/* Backdrop - MD3 Dialog */}
      <div
        className="fixed inset-0 md3-dialog-backdrop z-[2500]"
        onClick={handleCloseAttempt}
      />

      {/* Modal - MD3 Dialog */}
      <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          ref={modalRef}
          className="md3-dialog w-full max-w-lg pointer-events-auto max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - MD3 Dialog Header */}
          <div className="flex-shrink-0 px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-lg shadow-lg flex-shrink-0">
                  <i className="fas fa-edit" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-normal text-[var(--md-sys-color-on-surface)] leading-tight truncate">
                    Edit Order
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                    <span className="font-mono bg-[var(--md-sys-color-surface-variant)] px-1.5 py-0.5 rounded">#{orderNumber}</span>
                    <StatusBadge status={editForm.status} />
                  </div>
                </div>
              </div>
              <button
                className="w-10 h-10 flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-variant)] rounded-full transition-all active:scale-95 flex-shrink-0"
                onClick={handleCloseAttempt}
                title="Close (Esc)"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {/* Body - MD3 Dialog Content */}
          <div className="md3-dialog-content space-y-4">
            {/* Customer Name */}
            <div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
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
            <div>
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
            <div>
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
              <div className="p-4 bg-[var(--md-sys-color-primary-container)] border border-[var(--md-sys-color-primary)]/20 rounded-lg text-sm text-[var(--md-sys-color-on-primary-container)]">
                <div className="flex items-start gap-2">
                  <i className="fas fa-info-circle mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Unsaved Changes</p>
                    <p className="text-xs mt-0.5 opacity-80">
                      Press <kbd className="px-1.5 py-0.5 bg-[var(--md-sys-color-surface)] rounded text-xs font-mono border border-[var(--md-sys-color-outline)]">Ctrl+S</kbd> to save
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - MD3 Dialog Actions */}
          <div className="md3-dialog-actions">
            <button
              className="md3-btn-text"
              onClick={handleCloseAttempt}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              className="md3-btn-filled disabled:opacity-50 flex items-center justify-center gap-2"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <i className="fas fa-circle-notch fa-spin text-sm" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-save text-sm" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal - MD3 Dialog */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 md3-dialog-backdrop"
            onClick={() => setShowUnsavedWarning(false)}
          />
          <div className="relative md3-dialog w-full max-w-sm p-6">
            <div className="w-14 h-14 rounded-full bg-[var(--md-sys-color-warning-container)] flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-2xl text-[var(--md-sys-color-warning)]" />
            </div>
            <h3 className="text-xl font-normal text-[var(--md-sys-color-on-surface)] text-center mb-2">
              Unsaved Changes
            </h3>
            <p className="text-[var(--md-sys-color-on-surface-variant)] text-center mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex gap-2">
              <button
                className="md3-btn-tonal flex-1"
                onClick={() => setShowUnsavedWarning(false)}
              >
                Keep Editing
              </button>
              <button
                className="md3-btn-filled flex-1 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] hover:bg-[var(--md-sys-color-error-dark)]"
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