"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "./Sidebar";
import Header from "./Header";
import TopBar from "./TopBar";
import BottomNav from "./BottomNav";

// ─── Modal Imports ────────────────────────────────────────────────────────────
import NewOrderModal from "@/app/(app)/orders/components/NewOrderModal";
import ManualBookingModal from "@/app/(app)/bookings/components/ManualBookingModal";
import AddProductModal from "@/components/products/AddProductModal";
import AddCustomerModal from "@/app/(app)/customers/components/AddCustomerModal";

// ─── Service & Utility Imports ────────────────────────────────────────────────
import {
  orderService,
  productService,
  customerService,
  shippingService,
  inventoryService,
  Product,
  Customer,
  Client,
} from "@/lib/db";
import { app as firebaseApp } from "@/lib/firebase";
import {
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getOrderStatusMessage } from "@/utils/orderMessages";
import {
  getWhatsAppPhone,
  normalizePhone,
  createWhatsAppJid,
  isValidWhatsAppPhone,
} from "@/utils/phoneUtils";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // ─── Modal State ─────────────────────────────────────────────────────────
  const [newOrderModalOpen, setNewOrderModalOpen] = useState(false);
  const [newBookingModalOpen, setNewBookingModalOpen] = useState(false);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);

  // ─── Shared Data for Modals ──────────────────────────────────────────────
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pickupStations, setPickupStations] = useState<any[]>([]);
  const [savingCustomer, setSavingCustomer] = useState(false);

  const loadOrderData = useCallback(async () => {
    if (!user) return;
    try {
      const [prods, custs, stations] = await Promise.all([
        productService.getProducts(user),
        customerService.getClients(user),
        shippingService.getPickupStations(user),
      ]);
      setProducts(prods);
      setCustomers(custs);
      setPickupStations(stations);
    } catch (error) {
      console.error("Error loading order data:", error);
    }
  }, [user]);

  // Load modal data eagerly so it's ready when user taps a quick action
  useEffect(() => {
    if (user) {
      loadOrderData();
    }
  }, [user, loadOrderData]);

  // ─── Mobile detection ────────────────────────────────────────────────────

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Track scroll position for top bar color sync
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleFabClick = () => {
    setShowFabMenu(!showFabMenu);
  };

  // ─── Quick Action Handler — Opens Modals Directly ────────────────────────

  const handleQuickAction = (actionId: string) => {
    setShowFabMenu(false);

    switch (actionId) {
      case "new-order":
        setNewOrderModalOpen(true);
        break;
      case "new-booking":
        setNewBookingModalOpen(true);
        break;
      case "add-product":
        setAddProductModalOpen(true);
        break;
      case "add-customer":
        setAddCustomerModalOpen(true);
        break;
    }
  };

  // ─── New Order Callback ──────────────────────────────────────────────────

  const handleCreateOrder = useCallback(
    async (formData: any) => {
      if (!user) return;
      try {
        const normalizedPhone = normalizePhone(formData.customerPhone);
        const whatsappJid = createWhatsAppJid(normalizedPhone);

        const subtotal = (formData.selectedProducts || []).reduce(
          (sum: number, p: any) => sum + (p.price || 0) * (p.quantity || 1), 0
        );
        const discount = formData.discount || 0;
        const total = Math.max(0, subtotal - discount);

        const deliveryAddress = formData.deliveryMethod === "delivery"
          ? (formData.deliveryAddress || formData.customerAddress || "")
          : "";

        const createdOrder = await orderService.createOrder(user, {
          customerId: "",
          customerName: formData.customerName,
          customerPhone: normalizedPhone,
          whatsappJid,
          customerEmail: formData.customerEmail || "",
          customerAddress: formData.customerAddress || "",
          deliveryAddress,
          deliveryMethod: formData.deliveryMethod === "delivery" ? "Delivery" : "Pickup",
          products: formData.selectedProducts || [],
          subtotal,
          shipping: 0,
          tax: 0,
          discount,
          total,
          paymentMethod: formData.paymentMethod || "Cash",
          paymentDetails: formData.paymentRef || "",
          status: "processing",
          paymentStatus: "paid",
          notes: formData.notes || "",
          orderNotes: formData.expectedDate
            ? `Expected ${formData.deliveryMethod === "pickup" ? "pickup" : "delivery"}: ${formData.expectedDate}`
            : undefined,
        });

        // Deduct stock for each product
        if (formData.selectedProducts && formData.selectedProducts.length > 0) {
          for (const item of formData.selectedProducts) {
            try {
              const productDoc = await getDoc(doc(getFirestore(firebaseApp), "products", item.productId));
              if (productDoc.exists()) {
                const productData = productDoc.data();
                const currentStock = productData.stock || 0;
                if (currentStock > 0) {
                  await productService.updateProduct(user, item.productId, {
                    stock: Math.max(0, currentStock - item.quantity),
                  });
                  await inventoryService.logInventoryChange(user, {
                    productId: item.productId,
                    productName: item.name,
                    change: -item.quantity,
                    reason: `Manual order: ${createdOrder.orderNumber || createdOrder.id}`,
                    previousStock: currentStock,
                    newStock: Math.max(0, currentStock - item.quantity),
                  });
                }
              }
            } catch (stockErr) {
              console.error(`Failed to deduct stock for ${item.productId}:`, stockErr);
            }
          }
        }

        // Send WhatsApp notification
        if (createdOrder.orderNumber) {
          try {
            const productName = formData.selectedProducts?.[0]?.name || "Order";
            const message = getOrderStatusMessage(
              "manual_order",
              formData.customerName,
              createdOrder.orderNumber,
              productName,
              deliveryAddress || formData.customerAddress
            );

            const phone = getWhatsAppPhone({
              customerPhone: normalizedPhone,
              whatsappJid: whatsappJid,
            });

            if (isValidWhatsAppPhone(phone)) {
              await sendEvolutionWhatsAppMessage(phone, message, user.uid);
            } else {
              const cleanPhone = normalizedPhone.replace(/[^0-9]/g, "");
              const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
              window.open(waUrl, '_blank');
            }
          } catch (whatsappError) {
            console.error("Failed to send manual order WhatsApp:", whatsappError);
          }
        }

        setNewOrderModalOpen(false);
      } catch (error) {
        console.error("Error creating manual order:", error);
        throw error;
      }
    },
    [user]
  );

  // ─── Add Customer Callback ───────────────────────────────────────────────

  const handleSaveCustomer = useCallback(
    async (data: { firstName: string; lastName: string; phone: string; status: string; location: string }) => {
      if (!user) return;
      if (!data.firstName.trim() || !data.lastName.trim() || !data.phone.trim()) return;
      setSavingCustomer(true);
      try {
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
        const rawNormalized = normalizePhone(data.phone);
        const fullPhone = rawNormalized.startsWith("254") ? rawNormalized : "254" + rawNormalized.replace(/^0+/, "");

        await customerService.createClient(user, {
          name: fullName,
          phone: fullPhone,
          location: data.location.trim() || undefined,
          initials: `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase(),
          status: data.status as Client["status"],
          verified: false,
          visits: 0,
          totalSpent: 0,
          rating: 0,
          services: [],
        });

        // Send WhatsApp welcome message
        try {
          const normalizedPhone = normalizePhone(fullPhone);
          if (isValidWhatsAppPhone(normalizedPhone)) {
            const welcomeMessage = [
              "━━━━━━━━━━━━━━━━━━━━",
              "👋 *WELCOME!* 🇰🇪",
              "━━━━━━━━━━━━━━━━━━━━",
              "",
              `Hello *${fullName}*!`,
              "",
              "Thank you for registering with us! 🎉",
              "You're now part of our community.",
              "",
              " *WHAT'S NEXT?*",
              "📦 Browse our products and services",
              "🛒 Place orders directly via WhatsApp",
              "💬 Get real-time order updates",
              "📞 Reach us anytime for support",
              "",
              "━━━━━━━━━━━━━━━━━━━━",
              "✨ *We're excited to serve you!* ✨",
              "━━━━━━━━━━━━━━━━━━━━",
            ].join("\n");

            await sendEvolutionWhatsAppMessage(normalizedPhone, welcomeMessage, user.uid);
          }
        } catch (whatsappError) {
          console.error("Failed to send welcome WhatsApp:", whatsappError);
        }

        setAddCustomerModalOpen(false);
      } catch (error) {
        console.error("Error saving customer:", error);
        alert("Failed to save customer. Please try again.");
      } finally {
        setSavingCustomer(false);
      }
    },
    [user]
  );

  // ─── Booking Created Callback ────────────────────────────────────────────
  // Modal already calls onClose, this is just a no-op success handler
  const handleBookingCreated = useCallback(() => {
    // Booking was created successfully
  }, []);

  // ─── Product Added Callback ──────────────────────────────────────────────
  // Modal already calls onClose, this is just a no-op success handler
  const handleProductAdded = useCallback(() => {
    // Product was added successfully
  }, []);

  return (
    <div className="flex min-h-screen w-full max-w-full overflow-hidden">
      {/* Desktop Sidebar - Fixed position, always visible on desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-50" style={{ width: sidebarExpanded ? "280px" : "80px" }}>
        <div
          className="h-full transition-all duration-300"
          onMouseEnter={() => setSidebarExpanded(true)}
          onMouseLeave={() => setSidebarExpanded(false)}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} isExpanded={sidebarExpanded} />
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed sidebar */}
      <div className="hidden lg:block flex-shrink-0" style={{ width: sidebarExpanded ? "280px" : "80px" }} />

      {/* Tablet/Mobile Drawer - Full sidebar when opened */}
      <aside className={`lg:hidden fixed inset-0 z-50 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300`}>
        <Sidebar onClose={() => setSidebarOpen(false)} isExpanded={true} />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content - Full width on mobile */}
      <div className="flex-1 flex flex-col min-h-screen w-full max-w-full lg:pl-0">
        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden md:block">
          <Header onMenuClick={() => setSidebarOpen(true)} scrolled={isScrolled} />
        </div>

        {/* Mobile TopBar - Only visible on mobile (rendered directly, no wrapper) */}
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          title="ChapChap"
          notificationCount={3}
          onScrollChange={(scrolled) => setIsScrolled(scrolled)}
        />

        <main className="flex-1 w-full p-0 overflow-y-auto" style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom, 0px))' }}>
          {children}
        </main>
      </div>

      {/* Premium Mobile Bottom Navigation - Only on mobile (< 768px) */}
      {isMobile && <BottomNav onFABClick={handleFabClick} onQuickAction={handleQuickAction} />}

      {/* ────── MODALS ────── */}

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={newOrderModalOpen}
        onClose={() => setNewOrderModalOpen(false)}
        products={products}
        customers={customers}
        pickupStations={pickupStations}
        onCreateOrder={handleCreateOrder}
        creatingOrder={false}
      />

      {/* New Booking Modal */}
      <ManualBookingModal
        open={newBookingModalOpen}
        onClose={() => setNewBookingModalOpen(false)}
        onBookingCreated={handleBookingCreated}
      />

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={addProductModalOpen}
        onClose={() => setAddProductModalOpen(false)}
        onSuccess={handleProductAdded}
      />

      {/* Add Customer Modal */}
      {addCustomerModalOpen && (
        <AddCustomerModal
          onClose={() => setAddCustomerModalOpen(false)}
          onSave={handleSaveCustomer}
          saving={savingCustomer}
        />
      )}
    </div>
  );
}
