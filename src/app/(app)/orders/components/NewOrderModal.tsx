"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Product, Customer } from "@/lib/db";
import { formatCurrency } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

interface NewOrderForm {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  paymentMethod: string;
  selectedProducts: OrderItem[];
  notes: string;
  sendWhatsApp: boolean;
  markAsPaid: boolean;
  paymentRef: string;
  expressDelivery: boolean;
  deliveryType: 'delivery' | 'pickup';
  deliveryDate: string;
  discountCode: string;
  discountAmount: number;
  saveCustomer: boolean;
}

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  customers: Customer[];
  onCreateOrder: (orderData: NewOrderForm) => Promise<void>;
  creatingOrder: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  { id: "Cash on Delivery", icon: "fa-money-bill-wave", desc: "Customer pays when receiving" },
  { id: "M-Pesa", icon: "fa-mobile-alt", desc: "Mobile money payment" },
  { id: "Bank Transfer", icon: "fa-university", desc: "Direct bank deposit" },
  { id: "Credit Card", icon: "fa-credit-card", desc: "Card payment" },
] as const;

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  selectedProducts?: string;
  paymentMethod?: string;
}

function validateForm(form: NewOrderForm): FormErrors {
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

  if (!form.customerAddress.trim()) {
    errors.customerAddress = "Delivery address is required";
  } else if (form.customerAddress.trim().length < 10) {
    errors.customerAddress = "Address must be at least 10 characters";
  }

  if (form.selectedProducts.length === 0) {
    errors.selectedProducts = "Please add at least one product";
  }

  if (!form.paymentMethod) {
    errors.paymentMethod = "Please select a payment method";
  }

  return errors;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, required }: { icon: string; title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg bg-[rgba(37,211,102,0.1)] flex items-center justify-center flex-shrink-0">
        <i className={`fas ${icon} text-[#25D366] text-xs`} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {title}
      </span>
      {required && <span className="text-red-500 text-xs font-bold">*</span>}
    </div>
  );
}

function FormInput({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  icon,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  error?: string;
  icon?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-on-surface-variant">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <i className={`fas ${icon} text-sm`} />
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border-2 rounded-xl text-sm transition-all duration-200 focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/30"
              : "border-outline-variant hover:border-outline"
          } ${icon ? "pl-10" : ""}`}
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

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
  activeColor = "bg-[#25D366]",
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  activeColor?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface border border-outline-variant rounded-xl transition-all hover:border-outline">
      <div>
        <div className="font-semibold text-sm text-on-surface">{label}</div>
        <div className="text-xs text-on-surface-variant mt-0.5">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full relative transition-all duration-300 ${
          checked ? activeColor : "bg-surface-variant"
        }`}
      >
        <div
          className={`absolute top-0.5 w-6 h-6 bg-surface rounded-full shadow-md3-level2 transition-all duration-300 ${
            checked ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-8 text-center animate-fadeIn">
      <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-3">
        <i className={`fas ${icon} text-2xl text-gray-300`} />
      </div>
      <h4 className="text-sm font-semibold text-on-surface mb-1">{title}</h4>
      <p className="text-xs text-on-surface-variant">{description}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NewOrderModal({
  isOpen,
  onClose,
  products,
  customers,
  onCreateOrder,
  creatingOrder,
}: NewOrderModalProps) {
  const [form, setForm] = useState<NewOrderForm>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    paymentMethod: "Cash on Delivery",
    selectedProducts: [],
    notes: "",
    sendWhatsApp: true,
    markAsPaid: false,
    paymentRef: "",
    expressDelivery: false,
    deliveryType: 'delivery',
    deliveryDate: "",
    discountCode: "",
    discountAmount: 0,
    saveCustomer: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        paymentMethod: "Cash on Delivery",
        selectedProducts: [],
        notes: "",
        sendWhatsApp: true,
        markAsPaid: false,
        paymentRef: "",
        expressDelivery: false,
        deliveryType: 'delivery',
        deliveryDate: "",
        discountCode: "",
        discountAmount: 0,
        saveCustomer: true,
      });
      setErrors({});
      setCustomerSearch("");
      setProductSearch("");
      setShowCustomerDropdown(false);
      setIsNewCustomer(false);
      setShowConfirm(false);
    }
  }, [isOpen]);

  // Body scroll lock
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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target as Node)) {
        setShowCustomerDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirm) {
          setShowConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showConfirm, onClose]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ).slice(0, 5);
  }, [customers, customerSearch]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 6);
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, productSearch]);

  // Totals
  const totals = useMemo(() => {
    const subtotal = form.selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const shipping = form.expressDelivery ? 5 : 0;
    const tax = subtotal * 0.16;
    const discount = form.discountAmount;
    return { subtotal, shipping, tax, discount, total: Math.max(0, subtotal + shipping + tax - discount) };
  }, [form.selectedProducts, form.expressDelivery, form.discountAmount]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    [errors]
  );

  const selectCustomer = useCallback((customer: Customer) => {
    setForm((prev) => ({
      ...prev,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email || "",
      customerAddress: customer.location || "",
    }));
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setIsNewCustomer(false);
    setErrors((prev) => ({ ...prev, customerName: undefined, customerPhone: undefined }));
  }, []);

  const addProduct = useCallback((product: Product) => {
    setForm((prev) => {
      const existing = prev.selectedProducts.find((p) => p.productId === product.id);
      if (existing) {
        return {
          ...prev,
          selectedProducts: prev.selectedProducts.map((p) =>
            p.productId === product.id ? { ...p, quantity: p.quantity + 1 } : p
          ),
        };
      }
      return {
        ...prev,
        selectedProducts: [
          ...prev.selectedProducts,
          { productId: product.id, name: product.name, quantity: 1, price: product.price, imageUrl: product.imageUrl || product.image || "" },
        ],
      };
    });
    setErrors((prev) => ({ ...prev, selectedProducts: undefined }));
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((p) => p.productId !== productId),
    }));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeProduct(productId);
      return;
    }
    setForm((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map((p) =>
        p.productId === productId ? { ...p, quantity } : p
      ),
    }));
  }, [removeProduct]);

  const applyDiscount = useCallback(() => {
    if (!form.discountCode.trim()) return;
    // Simple mock discount logic - replace with your actual logic
    const code = form.discountCode.toUpperCase();
    if (code === "SAVE10") {
      setForm((prev) => ({ ...prev, discountAmount: prev.selectedProducts.reduce((s, p) => s + p.price * p.quantity, 0) * 0.1 }));
    } else if (code === "SAVE20") {
      setForm((prev) => ({ ...prev, discountAmount: prev.selectedProducts.reduce((s, p) => s + p.price * p.quantity, 0) * 0.2 }));
    } else {
      // Invalid code - could show error
    }
  }, [form.discountCode]);

  const handleSubmit = useCallback(async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setShowConfirm(true);
  }, [form]);

  const confirmCreate = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await onCreateOrder(form);
      onClose();
    } catch (error) {
      console.error("Failed to create order:", error);
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }, [form, onCreateOrder, onClose]);

  if (!isOpen) return null;

  const isFormValid = form.customerName && form.customerPhone && form.selectedProducts.length > 0 && form.paymentMethod;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[2500] animate-fadeIn" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 pointer-events-none overflow-y-auto">
        <div
          ref={modalRef}
          className="bg-surface rounded-2xl w-full max-w-sm md:max-w-2xl lg:max-w-[900px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col pointer-events-auto animate-slideUp my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-4 sm:p-5 border-b border-outline-variant bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)] animate-fadeIn">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 animate-slideUp">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-lg shadow-md3-level3 flex-shrink-0">
                  <i className="fas fa-plus" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-extrabold text-on-surface">New Order</h2>
                  <p className="text-xs sm:text-sm text-on-surface-variant hidden sm:block">Create a new order for your customer</p>
                </div>
              </div>
              <button
                className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-95 flex-shrink-0"
                onClick={onClose}
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ── Left Column ─── */}
              <div className="space-y-6">
                {/* Customer Selection */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.05s' }}>
                  <SectionHeader icon="fa-user" title="Customer" required />

                  {/* Search */}
                  <div className="relative mb-3" ref={customerDropdownRef}>
                    <div className="relative">
                      <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                        placeholder="Search by name or phone..."
                        value={customerSearch}
                        onChange={(e) => {
                          setCustomerSearch(e.target.value);
                          setShowCustomerDropdown(true);
                        }}
                        onFocus={() => setShowCustomerDropdown(true)}
                      />
                    </div>

                    {/* Dropdown */}
                    {showCustomerDropdown && filteredCustomers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-outline-variant rounded-xl shadow-md3-level4 z-20 max-h-56 overflow-y-auto animate-fadeIn">
                        {filteredCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            className="w-full flex items-center gap-3 p-3 hover:bg-surface transition-colors text-left"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {customer.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate">{customer.name}</div>
                              <div className="text-xs text-on-surface-variant">{customer.phone}</div>
                            </div>
                            <i className="fas fa-chevron-right text-xs text-gray-300 ml-auto" />
                          </button>
                        ))}
                      </div>
                    )}

                    {showCustomerDropdown && customerSearch && filteredCustomers.length === 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-outline-variant rounded-xl shadow-md3-level4 z-20 p-4 text-center animate-fadeIn">
                        <p className="text-sm text-on-surface-variant">No customers found</p>
                      </div>
                    )}
                  </div>

                  {/* Selected Customer */}
                  {form.customerName && (
                    <div className="flex items-center gap-3 p-3 bg-[rgba(37,211,102,0.05)] border border-[#25D366]/30 rounded-xl animate-fadeIn">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {form.customerName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{form.customerName}</div>
                        <div className="text-xs text-on-surface-variant">{form.customerPhone}</div>
                      </div>
                      <button
                        className="w-7 h-7 rounded-full bg-surface text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors shadow-md3-level1"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            customerName: "",
                            customerPhone: "",
                            customerEmail: "",
                            customerAddress: "",
                          }))
                        }
                      >
                        <i className="fas fa-times text-xs" />
                      </button>
                    </div>
                  )}

                  {errors.customerName && <p className="text-xs text-red-500 font-medium mt-2 animate-fadeIn">{errors.customerName}</p>}

                  {/* Manual Entry Toggle */}
                  {!form.customerName && !isNewCustomer && (
                    <button
                      className="w-full py-2.5 mt-2 bg-surface border-2 border-dashed border-outline-variant rounded-xl text-[#25D366] font-semibold text-sm flex items-center justify-center gap-2 hover:border-[#25D366] transition-all"
                      onClick={() => setIsNewCustomer(true)}
                    >
                      <i className="fas fa-user-plus" />
                      Create New Customer
                    </button>
                  )}

                  {/* Manual Fields */}
                  {isNewCustomer && (
                    <div className="space-y-3 mt-3 animate-fadeIn">
                      <FormInput
                        label="Full Name"
                        name="customerName"
                        value={form.customerName}
                        onChange={handleInputChange}
                        placeholder="Enter customer name"
                        error={errors.customerName}
                        icon="fa-user"
                        required
                      />
                      <FormInput
                        label="Phone Number"
                        name="customerPhone"
                        value={form.customerPhone}
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
                        value={form.customerEmail}
                        onChange={handleInputChange}
                        placeholder="customer@example.com"
                        icon="fa-envelope"
                      />
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.1s' }}>
                  <SectionHeader icon="fa-box" title="Products" required />

                  <div className="border-2 border-outline-variant rounded-xl overflow-hidden">
                    <div className="p-3 bg-surface border-b border-outline-variant">
                      <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-[#25D366] transition-all"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="max-h-52 overflow-y-auto scrollbar-thin">
                      {filteredProducts.length === 0 ? (
                        <EmptyState
                          icon="fa-box-open"
                          title="No Products Found"
                          description="Try a different search term"
                        />
                      ) : (
                        filteredProducts.map((product) => {
                          const prodImg = product.image || product.images?.[0];
                          const stock = product.stock;
                          const lowStockAlert = product.lowStockAlert || 5;
                          const isOutOfStock = stock !== undefined && stock <= 0;
                          const isLowStock = stock !== undefined && stock > 0 && stock <= lowStockAlert;
                          return (
                            <div
                              key={product.id}
                              className={`flex items-center gap-3 p-3 border-b border-outline-variant last:border-b-0 transition-colors group ${
                                isOutOfStock ? 'opacity-50 bg-red-50/30' : 'hover:bg-surface'
                              }`}
                            >
                              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant shadow-md3-level1">
                                {prodImg ? (
                                  <img src={prodImg} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-xl">📦</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm truncate">{product.name}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-on-surface-variant">{formatCurrency(product.price)} each</span>
                                  {stock !== undefined && (
                                    <span
                                      className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                        isOutOfStock
                                          ? 'bg-red-100 text-red-600'
                                          : isLowStock
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-green-100 text-green-700'
                                      }`}
                                    >
                                      <i className={`fas ${isOutOfStock ? 'fa-times-circle' : isLowStock ? 'fa-exclamation-triangle' : 'fa-check-circle'} text-[8px]`} />
                                      {isOutOfStock ? 'Out of Stock' : `${stock} in stock`}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => addProduct(product)}
                                disabled={isOutOfStock}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-md3-level1 ${
                                  isOutOfStock
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-[#25D366] text-white hover:bg-[#22c55e] opacity-0 group-hover:opacity-100 sm:opacity-100'
                                }`}
                              >
                                <i className="fas fa-plus text-xs" />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {errors.selectedProducts && (
                    <p className="text-xs text-red-500 font-medium mt-2 animate-fadeIn">{errors.selectedProducts}</p>
                  )}
                </div>

                {/* Selected Products */}
                {form.selectedProducts.length > 0 && (
                  <div className="animate-fadeIn" style={{ animationDelay: '0.15s' }}>
                    <SectionHeader
                      icon="fa-shopping-cart"
                      title={`Order Items (${form.selectedProducts.reduce((s, p) => s + p.quantity, 0)})`}
                    />
                    <div className="space-y-2">
                      {form.selectedProducts.map((item) => {
                        // Look up product image from the products array
                        const product = products.find(p => p.id === item.productId);
                        const prodImg = product?.image || product?.images?.[0];
                        return (
                          <div
                            key={item.productId}
                            className="flex items-center gap-3 p-3 bg-surface rounded-xl border border-outline-variant hover:border-[#25D366]/30 transition-all group"
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant shadow-md3-level1">
                              {prodImg ? (
                                <img src={prodImg} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-lg">📦</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{item.name}</div>
                              <div className="text-xs text-on-surface-variant">{formatCurrency(item.price)} each</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg border-2 border-outline-variant flex items-center justify-center hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-90 text-sm font-bold"
                              >
                                -
                              </button>
                              <span className="font-bold w-7 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg border-2 border-outline-variant flex items-center justify-center hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-90 text-sm font-bold"
                              >
                                +
                              </button>
                            </div>
                            <div className="font-bold text-[#25D366] min-w-[60px] text-right text-sm">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                            <button
                              onClick={() => removeProduct(item.productId)}
                              className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100 sm:opacity-100"
                            >
                              <i className="fas fa-trash text-xs" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                {form.selectedProducts.length > 0 && (
                  <div className="animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <SectionHeader icon="fa-calculator" title="Order Summary" />
                    <div className="bg-surface rounded-xl p-4 space-y-2 border border-outline-variant">
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">
                          Subtotal ({form.selectedProducts.reduce((s, p) => s + p.quantity, 0)} items)
                        </span>
                        <span className="font-semibold text-on-surface">{formatCurrency(totals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">Shipping</span>
                        <span className="font-semibold text-on-surface">
                          {totals.shipping > 0 ? formatCurrency(totals.shipping) : "Free"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-on-surface-variant">Tax (16%)</span>
                        <span className="font-semibold text-on-surface">{formatCurrency(totals.tax)}</span>
                      </div>
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <i className="fas fa-tag text-xs" />
                            Discount
                          </span>
                          <span className="font-semibold">-{formatCurrency(totals.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 mt-1 border-t-2 border-outline-variant">
                        <span className="text-base font-extrabold text-on-surface">Total</span>
                        <span className="text-xl font-extrabold text-[#25D366]">{formatCurrency(totals.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ─── Right Column ─── */}
              <div className="space-y-6 animate-fadeIn" style={{ animationDelay: '0.25s' }}>
                {/* Payment Method */}
                <div>
                  <SectionHeader icon="fa-credit-card" title="Payment Method" required />
                  <div className="space-y-2">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({ ...prev, paymentMethod: method.id }));
                          setErrors((prev) => ({ ...prev, paymentMethod: undefined }));
                        }}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                          form.paymentMethod === method.id
                            ? "border-[#25D366] bg-[rgba(37,211,102,0.05)] shadow-md3-level1"
                            : "border-outline-variant hover:border-[#25D366]/50 hover:bg-surface"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                            form.paymentMethod === method.id
                              ? "bg-[#25D366] text-white shadow-md3-level2"
                              : "bg-surface text-on-surface-variant"
                          }`}
                        >
                          <i className={`fas ${method.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm">{method.id}</div>
                          <div className="text-xs text-on-surface-variant">{method.desc}</div>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            form.paymentMethod === method.id
                              ? "bg-[#25D366] border-[#25D366]"
                              : "border-outline-variant"
                          }`}
                        >
                          {form.paymentMethod === method.id && <i className="fas fa-check text-white text-xs" />}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-xs text-red-500 font-medium mt-2 animate-fadeIn">{errors.paymentMethod}</p>
                  )}
                </div>

                {/* Delivery/Pickup Toggle */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.3s' }}>
                  <SectionHeader icon="fa-truck" title="Fulfillment" />
                  
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, deliveryType: 'delivery' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                        form.deliveryType === 'delivery'
                          ? 'border-[#25D366] bg-[rgba(37,211,102,0.05)] text-[#25D366] shadow-md3-level1'
                          : 'border-outline-variant text-on-surface-variant hover:border-[#25D366]/50'
                      }`}
                    >
                      <i className="fas fa-truck" />
                      Delivery
                    </button>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, deliveryType: 'pickup' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                        form.deliveryType === 'pickup'
                          ? 'border-[#25D366] bg-[rgba(37,211,102,0.05)] text-[#25D366] shadow-md3-level1'
                          : 'border-outline-variant text-on-surface-variant hover:border-[#25D366]/50'
                      }`}
                    >
                      <i className="fas fa-store" />
                      Pickup
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.deliveryType === 'delivery' && (
                      <FormInput
                        label="Delivery Address"
                        name="customerAddress"
                        value={form.customerAddress}
                        onChange={handleInputChange}
                        placeholder="Enter full delivery address"
                        error={errors.customerAddress}
                        icon="fa-map-marker-alt"
                        required={form.deliveryType === 'delivery'}
                      />
                    )}

                    {form.deliveryType === 'pickup' && (
                      <div className="p-3 bg-[rgba(37,211,102,0.05)] border border-[#25D366]/30 rounded-xl">
                        <div className="flex items-center gap-2 text-sm">
                          <i className="fas fa-store text-[#25D366]" />
                          <span className="text-on-surface-variant">Customer will pick up at store location</span>
                        </div>
                      </div>
                    )}

                    {/* Delivery Date */}
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-on-surface-variant">
                        {form.deliveryType === 'pickup' ? 'Pickup Date (Optional)' : 'Delivery Date (Optional)'}
                      </label>
                      <div className="relative">
                        <i className="fas fa-calendar-alt absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="date"
                          value={form.deliveryDate}
                          onChange={(e) => setForm((prev) => ({ ...prev, deliveryDate: e.target.value }))}
                          className="w-full pl-9 pr-4 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                        />
                      </div>
                    </div>

                    <ToggleSwitch
                      label="Express Delivery"
                      description="Same-day delivery (+$5)"
                      checked={form.expressDelivery}
                      onChange={(checked) => setForm((prev) => ({ ...prev, expressDelivery: checked }))}
                    />
                  </div>
                </div>

                {/* Order Options */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.35s' }}>
                  <SectionHeader icon="fa-cog" title="Order Options" />
                  <div className="space-y-2">
                    <ToggleSwitch
                      label="Send WhatsApp Confirmation"
                      description="Notify customer immediately"
                      checked={form.sendWhatsApp}
                      onChange={(checked) => setForm((prev) => ({ ...prev, sendWhatsApp: checked }))}
                    />
                    <ToggleSwitch
                      label="Mark as Paid"
                      description="Payment already received"
                      checked={form.markAsPaid}
                      onChange={(checked) => {
                        setForm((prev) => ({ ...prev, markAsPaid: checked }));
                        if (!checked) setForm((prev) => ({ ...prev, paymentRef: '' }));
                      }}
                      activeColor="bg-green-500"
                    />
                  </div>
                  
                  {form.markAsPaid && (
                    <div className="animate-fadeIn mt-3">
                      <FormInput
                        label="Payment Reference / Transaction ID"
                        name="paymentRef"
                        value={form.paymentRef}
                        onChange={handleInputChange}
                        placeholder="e.g., M-Pesa transaction ID"
                        icon="fa-receipt"
                      />
                    </div>
                  )}
                </div>

                {/* Save Customer */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.37s' }}>
                  <ToggleSwitch
                    label="Save Customer to Database"
                    description="Create a customer profile for future orders"
                    checked={form.saveCustomer}
                    onChange={(checked) => setForm((prev) => ({ ...prev, saveCustomer: checked }))}
                    activeColor="bg-[#25D366]"
                  />
                </div>

                {/* Discount */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
                  <SectionHeader icon="fa-tag" title="Discount" />
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <i className="fas fa-percent absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        value={form.discountCode}
                        onChange={(e) => setForm((prev) => ({ ...prev, discountCode: e.target.value }))}
                        className="w-full pl-9 pr-4 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                        placeholder="Discount code"
                      />
                    </div>
                    <button
                      onClick={applyDiscount}
                      disabled={!form.discountCode.trim()}
                      className="px-4 py-3 bg-surface border-2 border-outline-variant rounded-xl text-on-surface-variant font-semibold text-sm hover:border-[#25D366] hover:text-[#25D366] transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="animate-fadeIn" style={{ animationDelay: '0.45s' }}>
                  <SectionHeader icon="fa-sticky-note" title="Notes" />
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all resize-none"
                    rows={3}
                    placeholder="Add any special instructions..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-3 sm:p-4 border-t border-outline-variant bg-surface animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant order-2 sm:order-1">
                <i className="fas fa-shield-alt text-[#10b981]" />
                <span>
                  <strong>Secure</strong> • {form.selectedProducts.length} items • {formatCurrency(totals.total)}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                <button
                  className="flex-1 sm:flex-none px-4 py-3 bg-surface border-2 border-outline-variant text-on-surface-variant rounded-xl font-semibold text-sm hover:border-gray-400 hover:text-on-surface transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2"
                  onClick={onClose}
                  disabled={creatingOrder || isSubmitting}
                >
                  <i className="fas fa-times" />
                  Cancel
                </button>
                <button
                  className={`flex-1 sm:flex-none px-6 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-w-[140px] ${
                    isFormValid
                      ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white hover:shadow-md3-level3 hover:from-[#22c55e] hover:to-[#0d9488]"
                      : "bg-surface-container-high text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleSubmit}
                  disabled={!isFormValid || creatingOrder || isSubmitting}
                >
                  {creatingOrder || isSubmitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check" />
                      <span>Create Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slideUp">
            <div className="w-14 h-14 rounded-full bg-[rgba(37,211,102,0.1)] flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-check text-2xl text-[#25D366]" />
            </div>
            <h3 className="text-xl font-bold text-on-surface text-center mb-2">Confirm Order</h3>
            <p className="text-on-surface-variant text-center mb-6">
              Create order for <strong>{form.customerName}</strong> with{" "}
              <strong>{form.selectedProducts.reduce((s, p) => s + p.quantity, 0)} items</strong> totaling{" "}
              <strong className="text-[#25D366]">{formatCurrency(totals.total)}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 bg-surface-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-all active:scale-95"
                onClick={() => setShowConfirm(false)}
              >
                Review
              </button>
              <button
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold hover:shadow-md3-level3 transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={confirmCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <i className="fas fa-circle-notch fa-spin" />
                ) : (
                  <i className="fas fa-check" />
                )}
                {isSubmitting ? "Creating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}