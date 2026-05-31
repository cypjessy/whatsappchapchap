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
  deliveryMethod: "pickup" | "delivery";
  deliveryAddress: string;
  expectedDate: string;
  paymentMethod: string;
  paymentRef: string;
  selectedProducts: OrderItem[];
  discount: number;
  notes: string;
  sendWhatsApp: boolean;
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

// ─── Validation ───────────────────────────────────────────────────────────────

interface FormErrors {
  customerName?: string;
  customerPhone?: string;
  selectedProducts?: string;
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

  if (form.selectedProducts.length === 0) {
    errors.selectedProducts = "Please add at least one product";
  }

  return errors;
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, required }: { icon: string; title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-[rgba(37,211,102,0.1)] flex items-center justify-center flex-shrink-0">
        <i className={`fas ${icon} text-[#25D366] text-xs`} />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
        {title}
      </span>
      {required && <span className="text-red-500 text-xs font-bold">*</span>}
    </div>
  );
}

function ToggleSwitch({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface border border-outline-variant rounded-xl transition-all hover:border-outline">
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-on-surface">{label}</div>
        <div className="text-xs text-on-surface-variant mt-0.5 truncate">{description}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition-all duration-300 flex-shrink-0 ml-3 ${
          checked ? "bg-[#25D366]" : "bg-surface-variant"
        }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 bg-surface rounded-full shadow-md transition-all duration-300 ${
            checked ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
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
    deliveryMethod: "pickup",
    deliveryAddress: "",
    expectedDate: "",
    paymentMethod: "Cash",
    paymentRef: "",
    selectedProducts: [],
    discount: 0,
    notes: "",
    sendWhatsApp: true,
    saveCustomer: true,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const customerDropdownRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // ─── Payment method options ───────────────────────────────────────────
  const PAYMENT_METHODS = useMemo(() => [
    { id: "Cash", icon: "fa-money-bill-wave" },
    { id: "M-Pesa", icon: "fa-mobile-alt" },
    { id: "Bank Transfer", icon: "fa-university" },
    { id: "Card", icon: "fa-credit-card" },
    { id: "Other", icon: "fa-ellipsis-h" },
  ], []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
        deliveryMethod: "pickup",
        deliveryAddress: "",
        expectedDate: "",
        paymentMethod: "Cash",
        paymentRef: "",
        selectedProducts: [],
        discount: 0,
        notes: "",
        sendWhatsApp: true,
        saveCustomer: true,
      });
      setErrors({});
      setCustomerSearch("");
      setProductSearch("");
      setShowCustomerDropdown(false);
      setShowNewCustomerForm(false);
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
    return () => { document.body.style.overflow = ""; };
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

  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showConfirm) setShowConfirm(false);
        else onClose();
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
    if (!productSearch.trim()) return products.slice(0, 8);
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 10);
  }, [products, productSearch]);

  // Totals with discount
  const totals = useMemo(() => {
    const subtotal = form.selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const discount = Math.min(form.discount || 0, subtotal);
    return { subtotal, discount, total: subtotal - discount };
  }, [form.selectedProducts, form.discount]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (name === "customerName" || name === "customerPhone") {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    },
    []
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
    setShowNewCustomerForm(false);
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
          {
            productId: product.id,
            name: product.name,
            quantity: 1,
            price: product.price,
            imageUrl: product.imageUrl || product.image || "",
          },
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

  const isFormValid = form.customerName && form.customerPhone && form.selectedProducts.length > 0;
  const selectedCount = form.selectedProducts.reduce((s, p) => s + p.quantity, 0);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[2500] animate-fadeIn" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 pointer-events-none overflow-y-auto">
        <div
          ref={modalRef}
          className="bg-surface rounded-2xl w-full max-w-sm md:max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col pointer-events-auto animate-slideUp my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <div className="flex-shrink-0 p-4 border-b border-outline-variant bg-gradient-to-r from-[rgba(37,211,102,0.05)] to-[rgba(18,140,126,0.05)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-lg shadow-lg flex-shrink-0">
                  <i className="fas fa-plus" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-extrabold text-on-surface">Manual Order</h2>
                  <p className="text-xs text-on-surface-variant">Customer already paid — confirm & process</p>
                </div>
              </div>
              <button
                className="w-9 h-9 flex items-center justify-center text-on-surface-variant hover:bg-red-50 hover:text-red-500 rounded-xl transition-all active:scale-95 flex-shrink-0"
                onClick={onClose}
                aria-label="Close"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-5">
            {/* ═══ Customer ═══ */}
            <div>
              <SectionHeader icon="fa-user" title="Customer" required />

              {/* Search existing */}
              <div className="relative" ref={customerDropdownRef}>
                <div className="relative">
                  <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    className="w-full pl-9 pr-4 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); setShowCustomerDropdown(true); }}
                    onFocus={() => setShowCustomerDropdown(true)}
                  />
                </div>

                {showCustomerDropdown && customerSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-outline-variant rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto animate-fadeIn">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          className="w-full flex items-center gap-3 p-3 hover:bg-surface transition-colors text-left"
                          onClick={() => selectCustomer(customer)}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {customer.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate">{customer.name}</div>
                            <div className="text-xs text-on-surface-variant">{customer.phone}</div>
                          </div>
                          <i className="fas fa-chevron-right text-xs text-gray-300" />
                        </button>
                      ))
                    ) : (
                      <div
                        className="p-3 text-center cursor-pointer hover:bg-surface transition-colors"
                        onClick={() => { setShowCustomerDropdown(false); setShowNewCustomerForm(true); }}
                      >
                        <div className="flex items-center justify-center gap-2 text-sm text-[#25D366] font-semibold">
                          <i className="fas fa-user-plus" />
                          <span>Create new customer</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected customer card */}
              {form.customerName && !showNewCustomerForm ? (
                <div className="flex items-center gap-3 p-3 mt-2 bg-[rgba(37,211,102,0.05)] border border-[#25D366]/30 rounded-xl animate-fadeIn">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
                    {form.customerName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{form.customerName}</div>
                    <div className="text-xs text-on-surface-variant">{form.customerPhone}</div>
                  </div>
                  <button
                    className="w-7 h-7 rounded-full bg-surface text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors"
                    onClick={() => setForm((prev) => ({ ...prev, customerName: "", customerPhone: "", customerEmail: "", customerAddress: "" }))}
                    aria-label="Clear customer"
                  >
                    <i className="fas fa-times text-xs" />
                  </button>
                </div>
              ) : null}

              {/* New customer form */}
              {showNewCustomerForm && (
                <div className="space-y-2.5 mt-2 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface-variant">Full Name *</label>
                    <div className="relative">
                      <i className="fas fa-user absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        name="customerName"
                        value={form.customerName}
                        onChange={handleInputChange}
                        placeholder="Customer name"
                        className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all ${
                          errors.customerName ? "border-red-300" : "border-outline-variant"
                        }`}
                      />
                    </div>
                    {errors.customerName && <p className="text-xs text-red-500 font-medium">{errors.customerName}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface-variant">Phone *</label>
                    <div className="relative">
                      <i className="fas fa-phone-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        name="customerPhone"
                        value={form.customerPhone}
                        onChange={handleInputChange}
                        placeholder="+254 712 345 678"
                        className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all ${
                          errors.customerPhone ? "border-red-300" : "border-outline-variant"
                        }`}
                      />
                    </div>
                    {errors.customerPhone && <p className="text-xs text-red-500 font-medium">{errors.customerPhone}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-on-surface-variant">Email (optional)</label>
                      <div className="relative">
                        <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="email"
                          name="customerEmail"
                          value={form.customerEmail}
                          onChange={handleInputChange}
                          placeholder="Email"
                          className="w-full pl-9 pr-4 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-on-surface-variant">Address (optional)</label>
                      <div className="relative">
                        <i className="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                          type="text"
                          name="customerAddress"
                          value={form.customerAddress}
                          onChange={handleInputChange}
                          placeholder="Address"
                          className="w-full pl-9 pr-4 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle existing vs new customer */}
              {!form.customerName && !showNewCustomerForm && (
                <p className="text-xs text-on-surface-variant mt-1.5 text-center">
                  Start typing to search existing customers or click <strong className="text-[#25D366]">Create new customer</strong> from results
                </p>
              )}
              {showNewCustomerForm && (
                <button
                  className="mt-2 text-xs text-on-surface-variant hover:text-[#25D366] transition-colors flex items-center gap-1"
                  onClick={() => { setShowNewCustomerForm(false); setForm((prev) => ({ ...prev, customerName: "", customerPhone: "", customerEmail: "", customerAddress: "" })); }}
                >
                  <i className="fas fa-arrow-left" />
                  Search existing customers
                </button>
              )}
            </div>

            {/* ═══ Products ═══ */}
            <div>
              <SectionHeader icon="fa-box" title="Products" required />

              <div className="border-2 border-outline-variant rounded-xl overflow-hidden">
                <div className="p-2.5 bg-surface border-b border-outline-variant">
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

                <div className="max-h-48 overflow-y-auto scrollbar-thin">
                  {filteredProducts.length === 0 ? (
                    <div className="p-6 text-center">
                      <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-2">
                        <i className="fas fa-box-open text-xl text-gray-300" />
                      </div>
                      <p className="text-sm text-on-surface-variant">No products found</p>
                    </div>
                  ) : (
                    filteredProducts.map((product) => {
                      const prodImg = product.image || product.images?.[0];
                      const stock = product.stock;
                      const isOutOfStock = stock !== undefined && stock <= 0;
                      return (
                        <div
                          key={product.id}
                          className={`flex items-center gap-2.5 p-2.5 border-b border-outline-variant last:border-b-0 transition-colors ${
                            isOutOfStock ? 'opacity-40' : 'hover:bg-surface'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant shadow-sm">
                            {prodImg ? (
                              <img src={prodImg} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] flex items-center justify-center text-lg">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{product.name}</div>
                            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                              <span>{formatCurrency(product.price)}</span>
                              {stock !== undefined && (
                                <span className={`font-semibold ${
                                  stock <= (product.lowStockAlert || 5) && stock > 0 ? 'text-amber-600' : stock <= 0 ? 'text-red-500' : 'text-green-600'
                                }`}>
                                  {stock <= 0 ? 'Sold out' : `${stock} left`}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => addProduct(product)}
                            disabled={isOutOfStock}
                            className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center transition-all active:scale-90 hover:bg-[#22c55e] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm"
                            aria-label={`Add ${product.name}`}
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
                <p className="text-xs text-red-500 font-medium mt-1.5 animate-fadeIn">{errors.selectedProducts}</p>
              )}
            </div>

            {/* ═══ Selected Products ═══ */}
            {form.selectedProducts.length > 0 && (
              <div>
                <SectionHeader icon="fa-shopping-cart" title={`Cart (${selectedCount} items)`} />
                <div className="space-y-1.5">
                  {form.selectedProducts.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2.5 p-2.5 bg-surface rounded-xl border border-outline-variant transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{item.name}</div>
                        <div className="text-xs text-on-surface-variant">{formatCurrency(item.price)} each</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg border-2 border-outline-variant flex items-center justify-center hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-90 text-sm font-bold"
                          aria-label={`Decrease quantity for ${item.name}`}
                        >-</button>
                        <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg border-2 border-outline-variant flex items-center justify-center hover:border-[#25D366] hover:text-[#25D366] transition-all active:scale-90 text-sm font-bold"
                          aria-label={`Increase quantity for ${item.name}`}
                        >+</button>
                      </div>
                      <div className="font-bold text-[#25D366] min-w-[56px] text-right text-sm">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                      <button
                        onClick={() => removeProduct(item.productId)}
                        className="w-7 h-7 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all"
                        aria-label={`Remove ${item.name}`}
                      >
                        <i className="fas fa-trash text-xs" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-2 p-3 bg-surface rounded-xl border border-outline-variant">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-on-surface-variant">Subtotal ({selectedCount} items)</span>
                    <span className="font-semibold text-on-surface">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  {totals.discount > 0 && (
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-on-surface-variant">Discount</span>
                      <span className="font-semibold text-green-600">-{formatCurrency(totals.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 mt-1.5 border-t border-outline-variant">
                    <span className="text-base font-extrabold text-on-surface">Total</span>
                    <span className="text-xl font-extrabold text-[#25D366]">{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ Delivery ═══ */}
            <div>
              <SectionHeader icon="fa-truck" title="Delivery" />
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, deliveryMethod: "pickup", deliveryAddress: prev.customerAddress || "" }))}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    form.deliveryMethod === "pickup"
                      ? "border-[#25D366] bg-[rgba(37,211,102,0.05)] text-[#25D366]"
                      : "border-outline-variant text-on-surface-variant hover:border-gray-400"
                  }`}
                >
                  <i className="fas fa-store" />
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, deliveryMethod: "delivery" }))}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                    form.deliveryMethod === "delivery"
                      ? "border-[#25D366] bg-[rgba(37,211,102,0.05)] text-[#25D366]"
                      : "border-outline-variant text-on-surface-variant hover:border-gray-400"
                  }`}
                >
                  <i className="fas fa-shipping-fast" />
                  Delivery
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {form.deliveryMethod === "delivery" && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface-variant">Delivery Address *</label>
                    <div className="relative">
                      <i className="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                      <input
                        type="text"
                        name="deliveryAddress"
                        value={form.deliveryAddress}
                        onChange={handleInputChange}
                        placeholder="Full delivery address"
                        className="w-full pl-9 pr-4 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface-variant">
                    {form.deliveryMethod === "pickup" ? "Expected Pickup Date" : "Expected Delivery Date"}
                  </label>
                  <div className="relative">
                    <i className="fas fa-calendar-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="date"
                      name="expectedDate"
                      value={form.expectedDate}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-4 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ Payment & Notes Row ═══ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Payment Method + Discount */}
              <div>
                <SectionHeader icon="fa-credit-card" title="Payment" />
                <select
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all bg-surface"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>{m.id}</option>
                  ))}
                </select>
                {form.paymentMethod && (
                  <input
                    type="text"
                    name="paymentRef"
                    value={form.paymentRef}
                    onChange={handleInputChange}
                    placeholder="Transaction ref (optional)"
                    className="w-full mt-1.5 px-3 py-2 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-all"
                  />
                )}
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">Discount (KES)</label>
                  <div className="relative">
                    <i className="fas fa-tag absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="number"
                      name="discount"
                      value={form.discount}
                      onChange={(e) => setForm((prev) => ({ ...prev, discount: Math.max(0, Number(e.target.value) || 0) }))}
                      placeholder="0"
                      min="0"
                      className="w-full pl-9 pr-4 py-2 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <SectionHeader icon="fa-sticky-note" title="Notes" />
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border-2 border-outline-variant rounded-xl text-sm focus:outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/20 transition-all resize-none"
                  rows={3}
                  placeholder="Order notes..."
                  aria-label="Order notes"
                />
              </div>
            </div>

            {/* ═══ Options ═══ */}
            <div>
              <SectionHeader icon="fa-cog" title="Options" />
              <div className="space-y-1.5">
                <ToggleSwitch
                  label="Send WhatsApp Notification"
                  description="Alert customer their order is confirmed & waiting to ship"
                  checked={form.sendWhatsApp}
                  onChange={(checked) => setForm((prev) => ({ ...prev, sendWhatsApp: checked }))}
                />
                <ToggleSwitch
                  label="Save Customer to Database"
                  description="Create a customer profile for future orders"
                  checked={form.saveCustomer}
                  onChange={(checked) => setForm((prev) => ({ ...prev, saveCustomer: checked }))}
                />
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex-shrink-0 p-3 border-t border-outline-variant bg-surface">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2.5">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant order-2 sm:order-1">
                <i className="fas fa-check-circle text-[#10b981]" />
                <span>
                  <strong>Manual order</strong> • {selectedCount} items • {formatCurrency(totals.total)}
                </span>
              </div>
              <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                <button
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-surface border-2 border-outline-variant text-on-surface-variant rounded-xl font-semibold text-sm hover:border-gray-400 hover:text-on-surface transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2"
                  onClick={onClose}
                  disabled={creatingOrder || isSubmitting}
                >
                  <i className="fas fa-times" />
                  Cancel
                </button>
                <button
                  className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 touch-manipulation flex items-center justify-center gap-2 min-w-[140px] ${
                    isFormValid
                      ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white hover:shadow-lg hover:from-[#22c55e] hover:to-[#0d9488]"
                      : "bg-surface-container-high text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleSubmit}
                  disabled={!isFormValid || creatingOrder || isSubmitting}
                >
                  {creatingOrder || isSubmitting ? (
                    <><i className="fas fa-circle-notch fa-spin" /><span>Processing...</span></>
                  ) : (
                    <><i className="fas fa-check" /><span>Create Order</span></>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Confirmation Modal ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-surface rounded-2xl shadow-2xl w-full max-w-md p-6 animate-slideUp">
            <div className="w-14 h-14 rounded-full bg-[rgba(37,211,102,0.1)] flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clipboard-check text-2xl text-[#25D366]" />
            </div>
            <h3 className="text-xl font-bold text-on-surface text-center mb-2">Confirm Manual Order</h3>
            <p className="text-on-surface-variant text-center text-sm mb-6">
              This will create a <strong>paid</strong> order for <strong>{form.customerName}</strong> with{" "}
              <strong>{selectedCount} items</strong> totaling{" "}
              <strong className="text-[#25D366]">{formatCurrency(totals.total)}</strong>{" "}
              ({form.deliveryMethod === "pickup" ? "Pickup" : "Delivery"})
              {form.expectedDate && <> • {form.expectedDate}</>}.
              A WhatsApp notification will be sent to the customer.
            </p>
            <div className="bg-[rgba(37,211,102,0.05)] border border-[#25D366]/30 rounded-xl p-3 mb-5 flex items-start gap-2.5">
              <i className="fas fa-info-circle text-[#25D366] mt-0.5" />
              <p className="text-xs text-on-surface-variant">
                Manual order means <strong>payment was already collected</strong> by you. The order will be marked as <strong>paid</strong> and set to <strong>processing</strong> status.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 px-4 py-3 bg-surface-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-all active:scale-95"
                onClick={() => setShowConfirm(false)}
              >
                Review
              </button>
              <button
                className="flex-1 px-4 py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={confirmCreate}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <i className="fas fa-circle-notch fa-spin" />
                ) : (
                  <i className="fas fa-check" />
                )}
                {isSubmitting ? "Processing..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
