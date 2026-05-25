"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useHaptics, useClipboard, useShare, useToast } from "@/hooks/useNativeAndroid";
import { useModalBackHandler } from "@/hooks/useModalBackHandler";
import { useStatusBar } from "@/hooks/useStatusBar";
import { serviceService, bookingService, Booking, Service } from "@/lib/db";
import { db } from "@/lib/firebase";
import ManualBookingModal from "./components/ManualBookingModal";
import ViewBookingModal from "./components/ViewBookingModal";
import PaymentConfirmationModal from "./components/PaymentConfirmationModal";
import BookingStats from "./components/BookingStats";
import BookingAnalytics from "./components/BookingAnalytics";
import BookingFilters from "./components/BookingFilters";
import BulkActionsToolbar from "./components/BulkActionsToolbar";
import BookingCancellationRequests from "./components/BookingCancellationRequests";
import { CalendarTab, TimelineTab, ListTab, GridTab } from "./components/tabs";
import { collection, query, where, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { app as firebaseApp } from "@/lib/firebase";
import { getFirestore } from "firebase/firestore";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";
import { getBookingStatusMessage, getBookingPaymentMessage, getBookingReminderMessage } from "@/utils/bookingMessages";
import {
  getWhatsAppPhone,
  normalizePhone,
  isValidWhatsAppPhone,
} from "@/utils/phoneUtils";
import { formatCurrency } from "@/lib/currency";

const getTenantId = (user: any): string => `tenant_${user.uid}`;

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "calendar" | "timeline" | "list" | "grid" | "cancellations";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// ─── Constants ─────────────────────────────────────────────────────────────

const VIEW_TABS = [
  { id: "calendar" as ViewMode, label: "Calendar", icon: "fa-calendar", desc: "Monthly overview" },
  { id: "timeline" as ViewMode, label: "Timeline", icon: "fa-stream", desc: "Chronological" },
  { id: "list" as ViewMode, label: "List", icon: "fa-list", desc: "Detailed rows" },
  { id: "grid" as ViewMode, label: "Grid", icon: "fa-th-large", desc: "Card view" },
  { id: "cancellations" as ViewMode, label: "Cancellations", icon: "fa-exclamation-triangle", desc: "Pending requests" },
];

const STATUS_CHIPS = [
  { id: "all", label: "All", icon: "fa-layer-group" },
  { id: "confirmed", label: "Confirmed", icon: "fa-check-circle" },
  { id: "pending", label: "Pending", icon: "fa-clock" },
  { id: "completed", label: "Completed", icon: "fa-check-double" },
  { id: "cancelled", label: "Cancelled", icon: "fa-times-circle" },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[3000] space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-md3-level3
            text-sm font-semibold animate-slideInRight
            ${toast.type === "success" ? "bg-[#10b981] text-white" : ""}
            ${toast.type === "error" ? "bg-[#ef4444] text-white" : ""}
            ${toast.type === "info" ? "bg-[#3b82f6] text-white" : ""}
          `}
        >
          <i className={`fas ${toast.type === "success" ? "fa-check-circle" : toast.type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}`} />
          {toast.message}
          <button onClick={() => onRemove(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
}

function DeleteConfirmDialog({
  isOpen,
  onCancel,
  onConfirm,
  count = 1,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  count?: number;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 animate-fadeIn">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative md3-card-elevated w-full max-w-md p-6 animate-scaleIn">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-[var(--md-sys-color-error-container)] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-[var(--md-sys-color-on-error-container)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)] mb-2">
            Delete {count > 1 ? `${count} Bookings` : "Booking"}?
          </h3>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
            This action cannot be undone. {count > 1 ? "All selected bookings will be permanently removed." : "This booking will be permanently removed."}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 md3-button-outlined rounded-xl font-medium text-sm transition-all active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] rounded-xl font-medium text-sm hover:bg-[var(--md-sys-color-error)]/90 transition-all active:scale-95 shadow-md3-level3 shadow-[var(--md-sys-color-error)]/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ viewMode }: { viewMode: ViewMode }) {
  const icons: Record<ViewMode, string> = {
    calendar: "fa-calendar-times",
    timeline: "fa-stream",
    list: "fa-list",
    grid: "fa-th-large",
    cancellations: "fa-exclamation-triangle",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 text-on-surface-variant animate-fadeIn">
      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] flex items-center justify-center mb-4 shadow-inner">
        <i className={`fas ${icons[viewMode]} text-3xl md:text-4xl text-[#cbd5e1]`} />
      </div>
      <p className="text-base md:text-lg font-bold text-on-surface-variant mb-1">No bookings found</p>
      <p className="text-xs md:text-sm text-outline max-w-xs text-center">
        Try adjusting your filters or create a new booking to get started.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingsPage() {
  const { user } = useAuth();
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const { copy } = useClipboard();
  const { share } = useShare();
  const { show: showToastNative } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("");
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [cancellationRequests, setCancellationRequests] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreBookings, setHasMoreBookings] = useState(false);
  const bookingsCursorRef = useRef<any>(null);
  const BOOKINGS_PAGE_SIZE = 20;
  const [cancellationFilter, setCancellationFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Status bar: green when at top, white when scrolled
  useStatusBar({
    color: headerScrolled ? '#ffffff' : '#25D366',
    style: headerScrolled ? 'dark' : 'light'
  });

  // Register modals for Android back button handling
  useModalBackHandler(modalOpen, () => setModalOpen(false));
  useModalBackHandler(editModalOpen, () => setEditModalOpen(false));
  useModalBackHandler(paymentModalOpen, () => setPaymentModalOpen(false));
  useModalBackHandler(showDeleteConfirm !== null, () => setShowDeleteConfirm(null));

  const toastIdRef = useRef(0);
  const pageRef = useRef<HTMLDivElement>(null);

  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Persist view mode
  useEffect(() => {
    const saved = localStorage.getItem("bookings_view_mode") as ViewMode;
    if (saved && VIEW_TABS.some((t) => t.id === saved)) {
      setViewMode(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bookings_view_mode", viewMode);
  }, [viewMode]);

  // Scroll detection for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setHeaderScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "n") {
          e.preventDefault();
          setModalOpen(true);
        }
        if (e.key === "e") {
          e.preventDefault();
          handleExportCSV();
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (user) {
      loadServices();
      loadBookings();
      loadCancellationRequests();
    }
  }, [user, filterStatus]);

  // Load bookings with pagination
  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    bookingsCursorRef.current = null;
    try {
      const result = await bookingService.getBookingsPaginated(user, BOOKINGS_PAGE_SIZE, undefined, filterStatus);
      setBookings(result.bookings);
      bookingsCursorRef.current = result.lastVisible;
      setHasMoreBookings(result.hasMore);
    } catch (error) {
      console.error("Error loading bookings:", error);
      setBookings([]);
      addToast("Failed to load bookings", "error");
    } finally {
      setLoading(false);
    }
  }, [user, filterStatus, addToast]);

  const loadMoreBookings = useCallback(async () => {
    if (!user || !bookingsCursorRef.current || loadingMore || !hasMoreBookings) return;
    setLoadingMore(true);
    try {
      const result = await bookingService.getBookingsPaginated(user, BOOKINGS_PAGE_SIZE, bookingsCursorRef.current ?? undefined, filterStatus);
      setBookings(prev => [...prev, ...result.bookings]);
      bookingsCursorRef.current = result.lastVisible;
      setHasMoreBookings(result.hasMore);
    } catch (error) {
      console.error("Error loading more bookings:", error);
      addToast("Failed to load more bookings", "error");
    } finally {
      setLoadingMore(false);
    }
  }, [user, filterStatus, loadingMore, hasMoreBookings, addToast]);

  const loadServices = async () => {
    if (!user) return;
    try {
      const data = await serviceService.getServices(user);
      setServices(data);
    } catch (error) {
      console.error("Error loading services:", error);
      addToast("Failed to load services", "error");
    }
  };

  const reloadBookings = useCallback(async () => {
    await loadBookings();
  }, [loadBookings]);

  const handleBookingCreated = async () => {      await notificationSuccess();
      await showToastNative({ text: 'Booking created successfully!', duration: 'short' });
      reloadBookings();
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: Booking["status"]) => {
    if (!user) return;
    
    // Find the booking to get its data for WhatsApp message
    const booking = bookings.find((b) => b.id === bookingId);
    
    await impactMedium();
    
    try {
      await bookingService.updateBooking(user, bookingId, { status: newStatus });

      // Send WhatsApp notifications for status changes (similar to orders logic)
      if (["confirmed", "completed", "cancelled", "pending"].includes(newStatus) && booking) {
        sendBookingWhatsAppNotification(booking, newStatus).catch((err) =>
          console.error("Failed to send WhatsApp:", err)
        );
      }

      await notificationSuccess();
      await showToastNative({ text: `Booking ${newStatus}`, duration: 'short' });
      reloadBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error updating status:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to update booking', position: 'top' });
    }
  };

  // Send WhatsApp notification for booking status changes (similar to orders)
  const sendBookingWhatsAppNotification = useCallback(
    async (booking: Booking, status: Booking["status"]) => {
      if (!user) return;
      try {
        // Format date and price for the message
        const formattedDate = booking.date;
        const formattedPrice = formatCurrency(booking.price);

        const message = getBookingStatusMessage(
          status,
          booking.client,
          booking.bookingNumber || booking.id,
          booking.service,
          formattedDate,
          booking.time,
          booking.location,
          formattedPrice
        );

        // Get WhatsApp phone number
        const normalizedPhone = normalizePhone(booking.phone);
        const phone = getWhatsAppPhone({
          customerPhone: normalizedPhone,
        });

        if (!isValidWhatsAppPhone(phone)) {
          console.error("Invalid phone number for booking:", phone);
          return;
        }

        await sendEvolutionWhatsAppMessage(phone, message, `tenant_${user.uid}`);
      } catch (error) {
        console.error("Error sending booking WhatsApp:", error);
      }
    },
    [user]
  );

  const handleConfirmPayment = async (bookingId: string, paymentProof: any) => {
    if (!user) return;
    
    // Find the booking to get its data for WhatsApp message
    const booking = bookings.find((b) => b.id === bookingId);
    
    await notificationSuccess();
    
    try {
      await bookingService.updateBooking(user, bookingId, {
        paymentProof,
        paymentStatus: "paid",
        status: "confirmed",
      });

      // Send WhatsApp notification for payment confirmation
      if (booking) {
        sendPaymentWhatsAppNotification(booking, paymentProof).catch((err) =>
          console.error("Failed to send payment WhatsApp:", err)
        );
      }

      await showToastNative({ text: 'Payment confirmed!', duration: 'short' });
      reloadBookings();
      setPaymentModalOpen(false);
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error confirming payment:", error);
      await notificationError();
      throw error;
    }
  };

  // Send WhatsApp notification for payment confirmation
  const sendPaymentWhatsAppNotification = useCallback(
    async (booking: Booking, paymentProof: any) => {
      if (!user) return;
      try {
        const message = getBookingPaymentMessage(
          booking.client,
          booking.bookingNumber || booking.id,
          booking.service,
          formatCurrency(paymentProof.amount || booking.price),
          paymentProof.transactionId
        );

        const normalizedPhone = normalizePhone(booking.phone);
        const phone = getWhatsAppPhone({
          customerPhone: normalizedPhone,
        });

        if (!isValidWhatsAppPhone(phone)) {
          console.error("Invalid phone number for payment notification:", phone);
          return;
        }

        await sendEvolutionWhatsAppMessage(phone, message, `tenant_${user.uid}`);
      } catch (error) {
        console.error("Error sending payment WhatsApp:", error);
      }
    },
    [user]
  );

  // Handle reminder sending: WhatsApp + update DB
  const handleSendReminder = useCallback(
    async (bookingId: string) => {
      if (!user) return;
      await impactMedium();
      
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) {
        await notificationError();
        await showToastNative({ text: 'Booking not found', position: 'top' });
        return;
      }

      try {
        // Send WhatsApp reminder
        const message = getBookingReminderMessage(
          booking.client,
          booking.bookingNumber || booking.id,
          booking.service,
          booking.date,
          booking.time,
          booking.location
        );

        const normalizedPhone = normalizePhone(booking.phone);
        const phone = getWhatsAppPhone({
          customerPhone: normalizedPhone,
        });

        if (isValidWhatsAppPhone(phone)) {
          await sendEvolutionWhatsAppMessage(phone, message, `tenant_${user.uid}`);
        }

        // Update booking with reminder sent flag
        await bookingService.updateBooking(user, bookingId, {
          reminderSent: true,
          reminderSentAt: new Date(),
        });

        await notificationSuccess();
        await showToastNative({ text: 'Reminder sent successfully!', duration: 'short' });
        reloadBookings();
      } catch (error) {
        console.error("Error sending reminder:", error);
        await notificationError();
        await showToastNative({ text: 'Failed to send reminder', position: 'top' });
      }
    },
    [user, bookings, reloadBookings, impactMedium, notificationSuccess, notificationError, showToastNative]
  );

  const handleDeleteBooking = async (bookingId: string) => {
    if (!user) return;
    
    await impactMedium();
    
    try {
      await bookingService.deleteBooking(user, bookingId);
      await showToastNative({ text: 'Booking deleted', duration: 'short' });
      reloadBookings();
      setShowDeleteConfirm(null);
      setBulkSelected((prev) => prev.filter((id) => id !== bookingId));
    } catch (error) {
      console.error("Error deleting booking:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to delete booking', position: 'top' });
    }
  };

  // Load cancellation requests
  const loadCancellationRequests = useCallback(async () => {
    if (!user) return;
    try {
      const db = getFirestore(firebaseApp);
      const tenantId = `tenant_${user.uid}`;

      console.log('[loadCancellationRequests] Loading requests for tenant:', tenantId);

      // Query all booking cancellation requests for this tenant
      const q = query(
        collection(db, "cancellation_requests"),
        where("tenantId", "==", tenantId),
        orderBy("requestedAt", "desc")
      );

      const snap = await getDocs(q);
      console.log('[loadCancellationRequests] Total documents:', snap.size);
      
      // Filter for booking type on client side to avoid composite index requirement
      const allRequests = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as any));
      const requests = allRequests.filter((req) => req.type === 'booking');
      
      console.log('[loadCancellationRequests] Filtered booking requests:', requests.length);
      setCancellationRequests(requests);
    } catch (error) {
      console.error("Error loading cancellation requests:", error);
    }
  }, [user]);

  // Handle booking cancellation action (approve/reject)
  const handleBookingCancellationAction = useCallback(
    async (requestId: string, bookingId: string, action: "approve" | "reject") => {
      if (!user) return;
      const isApproving = action === "approve";

      try {
        const db = getFirestore(firebaseApp);
        const tenantId = `tenant_${user.uid}`;

        // Update cancellation request
        const cancelRef = doc(db, "cancellation_requests", requestId);
        await updateDoc(cancelRef, {
          status: isApproving ? "approved" : "rejected",
          respondedAt: new Date(),
          responseNote:
            isApproving
              ? "Cancellation approved by merchant"
              : "Cancellation rejected by merchant",
        });

        // Find and update booking
        const bookingsRef = collection(db, "bookings");
        const bookingQuery = query(bookingsRef, where("tenantId", "==", tenantId), where("id", "==", bookingId));
        const bookingSnap = await getDocs(bookingQuery);

        if (!bookingSnap.empty) {
          const bookingDoc = bookingSnap.docs[0];
          const bookingData = bookingDoc.data();
          await updateDoc(bookingDoc.ref, {
            status: isApproving ? "cancelled" : "confirmed",
            cancellationStatus: isApproving ? "approved" : "rejected",
            cancelledAt: isApproving ? new Date() : null,
            updatedAt: new Date(),
          });

          // Send WhatsApp notification to customer
          const customerPhone = bookingData?.phone;
          const customerName = bookingData?.client || "Customer";
          const bookingNumber = bookingData?.bookingNumber || bookingId;
          const bookingService = bookingData?.service || "Service";
          const bookingDate = bookingData?.date || "N/A";
          const bookingTime = bookingData?.time || "N/A";

          if (customerPhone && isValidWhatsAppPhone(customerPhone)) {
            const message = isApproving
              ? `✅ *BOOKING CANCELLED* ✅\n\nDear ${customerName},\n\nYour cancellation request for booking *${bookingNumber}* has been approved.\n\n📅 Service: ${bookingService}\n Date: ${bookingDate} at ${bookingTime}\n\nIf you have any questions, please contact us.\n\nThank you! 🙏`
              : `ℹ️ *CANCELLATION UPDATE*\n\nDear ${customerName},\n\nYour cancellation request for booking *${bookingNumber}* was not approved.\n\n📅 Service: ${bookingService}\n Date: ${bookingDate} at ${bookingTime}\n\nYour booking remains confirmed as scheduled.\n\nThank you for understanding!`;

            await sendEvolutionWhatsAppMessage(customerPhone, message, user.uid);
          }
        }

        await loadCancellationRequests();
        await reloadBookings();
        await notificationSuccess();
        await showToastNative({ text: `Cancellation ${isApproving ? 'approved' : 'rejected'}`, duration: 'short' });
      } catch (error) {
        console.error("Error handling booking cancellation:", error);
        await notificationError();
        await showToastNative({ text: 'Failed to process cancellation', position: 'top' });
      }
    },
    [user, loadCancellationRequests, reloadBookings, notificationSuccess, notificationError, showToastNative]
  );

  const handleSendMessage = async (booking: Booking) => {
    if (!booking) return;
    
    await impactLight();
    
    const message = `Hello ${booking.client},\n\nThis is a reminder for your upcoming booking:\n\n Service: ${booking.service || 'N/A'}\n📅 Date: ${formatDate(booking.date)}\n⏰ Time: ${booking.time}\n📍 Location: ${booking.location}\n💰 Price: ${(booking.price || 0).toLocaleString()}\n\nThank you!`;

    try {
      if (user) {
        await sendEvolutionWhatsAppMessage(booking.phone, message, `tenant_${user.uid}`);
        await showToastNative({ text: 'Message sent!', duration: 'short' });
      }
    } catch {
      window.open(
        `https://wa.me/${booking.phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  const handleEditBooking = async (booking: Booking) => {
    await impactLight();
    setEditingBooking(booking);
    setEditModalOpen(true);
  };

  const toggleBulkSelect = async (bookingId: string) => {
    await impactLight();
    setBulkSelected((prev) =>
      prev.includes(bookingId) ? prev.filter((id) => id !== bookingId) : [...prev, bookingId]
    );
  };

  const selectAllBookings = () => {
    if (bulkSelected.length === filteredBookings.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredBookings.map((b) => b.id));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: Booking["status"]) => {
    if (!user || bulkSelected.length === 0) return;
    
    await impactMedium();
    
    try {
      await Promise.all(
        bulkSelected.map((id) => bookingService.updateBooking(user, id, { status: newStatus }))
      );
      await notificationSuccess();
      await showToastNative({ text: `${bulkSelected.length} bookings updated`, duration: 'short' });
      reloadBookings();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error updating bookings:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to update bookings', position: 'top' });
    }
  };

  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    
    await impactMedium();
    
    try {
      await Promise.all(bulkSelected.map((id) => bookingService.deleteBooking(user, id)));
      await showToastNative({ text: `${bulkSelected.length} bookings deleted`, duration: 'short' });
      reloadBookings();
      setBulkSelected([]);
      setBulkMode(false);
    } catch (error) {
      console.error("Error deleting bookings:", error);
      await notificationError();
      await showToastNative({ text: 'Failed to delete bookings', position: 'top' });
    }
  };

  // Filter bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (!booking) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          booking.client?.toLowerCase().includes(query) ||
          booking.phone?.toLowerCase().includes(query) ||
          booking.service?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      if (selectedServiceFilter && booking.serviceId !== selectedServiceFilter) return false;

      if (filterPaymentStatus !== "all") {
        if (filterPaymentStatus === "unpaid" && booking.paymentStatus !== "unpaid") return false;
        if (filterPaymentStatus === "partial" && booking.paymentStatus !== "partial") return false;
        if (filterPaymentStatus === "paid" && booking.paymentStatus !== "paid") return false;
      }

      if (dateRangeStart && booking.date < dateRangeStart) return false;
      if (dateRangeEnd && booking.date > dateRangeEnd) return false;

      if (selectedDate) {
        const selectedDateStr = selectedDate.toISOString().split("T")[0];
        if (booking.date !== selectedDateStr) return false;
      }

      if (sourceFilter !== "all" && booking.source !== sourceFilter) return false;

      return true;
    });
  }, [bookings, searchQuery, selectedServiceFilter, filterPaymentStatus, dateRangeStart, dateRangeEnd, selectedDate, sourceFilter]);

  const handleExportCSV = useCallback(async () => {
    await impactLight();
    setIsExporting(true);
    try {
      const headers = ["Client", "Phone", "Service", "Date", "Time", "Duration", "Location", "Price", "Status", "Payment Status"];
      const rows = filteredBookings.map((b) => [
        b.client || "",
        b.phone || "",
        b.service || "",
        b.date || "",
        b.time || "",
        b.duration || "",
        b.location || "",
        b.price || 0,
        b.status || "",
        b.paymentStatus || "unpaid",
      ]);

      const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bookings_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await showToastNative({ text: `Exported ${filteredBookings.length} bookings`, duration: 'short' });
    } finally {
      setIsExporting(false);
    }
  }, [filteredBookings, impactLight, showToastNative]);

  // Analytics
  const analytics = useMemo(() => {
    const totalRevenue = bookings.reduce((sum, b) => sum + ((b?.price) || 0), 0);
    const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;
    const completedRevenue = bookings.filter((b) => b?.status === "completed").reduce((sum, b) => sum + ((b?.price) || 0), 0);
    const pendingRevenue = bookings.filter((b) => b?.status === "pending").reduce((sum, b) => sum + ((b?.price) || 0), 0);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    const currentPeriodRevenue = bookings
      .filter((b) => {
        if (!b?.date) return false;
        const d = new Date(b.date);
        return d >= thirtyDaysAgo && d <= today;
      })
      .reduce((sum, b) => sum + ((b?.price) || 0), 0);

    const previousPeriodRevenue = bookings
      .filter((b) => {
        if (!b?.date) return false;
        const d = new Date(b.date);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      })
      .reduce((sum, b) => sum + ((b?.price) || 0), 0);

    return { totalRevenue, averageBookingValue, completedRevenue, pendingRevenue, currentPeriodRevenue, previousPeriodRevenue };
  }, [bookings]);

  const hasData = filteredBookings.length > 0;

  return (
    <div ref={pageRef} className="overflow-x-hidden px-3 md:px-6 py-3 md:py-4 pb-2 bg-surface">
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Sticky Header - Desktop only (TopBar handles mobile) */}
      <div
        className={`
          sticky top-0 z-[60] bg-surface/80 backdrop-blur-md border-b transition-all duration-300 hidden md:block
          ${headerScrolled ? "border-outline-variant shadow-md3-level1" : "border-transparent"}
        `}
      >
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-outline font-bold uppercase tracking-wider mb-1">
                <i className="fas fa-home text-[8px]" />
                <span>Dashboard</span>
                <i className="fas fa-chevron-right text-[6px]" />
                <span className="text-on-surface">Bookings</span>
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-on-surface flex items-center gap-2">
                Bookings
                <span className="text-sm font-bold text-outline ml-1">
                  ({filteredBookings.length})
                </span>
              </h1>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`
                  flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all active:scale-95
                  ${bulkMode
                    ? "bg-[#1e293b] text-white shadow-md3-level2"
                    : "border-2 border-outline-variant text-on-surface-variant hover:border-[#1e293b] hover:text-on-surface"
                  }
                `}
              >
                <i className={`fas ${bulkMode ? "fa-check-square" : "fa-square"} text-xs`} />
                <span className="hidden sm:inline">Bulk</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={isExporting || filteredBookings.length === 0}
                className={`
                  flex items-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all active:scale-95
                  border-2 border-outline-variant text-on-surface-variant hover:border-[#1e293b] hover:text-on-surface
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isExporting ? (
                  <div className="w-3.5 h-3.5 border-2 border-[#1e293b]/30 border-t-[#1e293b] rounded-full animate-spin" />
                ) : (
                  <i className="fas fa-download text-xs" />
                )}
                <span className="hidden sm:inline">Export</span>
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#1e293b] to-[#334155] text-white rounded-xl font-semibold text-xs md:text-sm shadow-md3-level3 hover:opacity-90 transition-all active:scale-95"
              >
                <i className="fas fa-plus text-xs" />
                <span className="hidden sm:inline">New Booking</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4 px-3 md:px-6 py-3 md:py-4">
        {/* Mobile Add Button - Visible at top of page */}
        <div className="md:hidden mb-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1e293b] to-[#334155] text-white rounded-xl font-bold text-sm shadow-md3-level3 active:scale-95 transition-all"
          >
            <i className="fas fa-plus" />
            <span>New Booking</span>
          </button>
        </div>

        {/* Stats */}
        <BookingStats
          bookings={bookings}
          filterStatus={filterStatus}
          onStatusClick={(status) => setFilterStatus(filterStatus === status ? "all" : status)}
          isLoading={loading}
        />

        {/* Analytics */}
        <BookingAnalytics
          totalRevenue={analytics.currentPeriodRevenue}
          averageBookingValue={analytics.averageBookingValue}
          completedRevenue={analytics.completedRevenue}
          pendingRevenue={analytics.pendingRevenue}
          isLoading={loading}
          previousPeriodRevenue={analytics.previousPeriodRevenue}
        />

        {/* Filters */}
        <BookingFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedServiceFilter={selectedServiceFilter}
          setSelectedServiceFilter={setSelectedServiceFilter}
          filterPaymentStatus={filterPaymentStatus}
          setFilterPaymentStatus={setFilterPaymentStatus}
          dateRangeStart={dateRangeStart}
          setDateRangeStart={setDateRangeStart}
          dateRangeEnd={dateRangeEnd}
          setDateRangeEnd={setDateRangeEnd}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          services={services}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
        />

        {/* Bulk Toolbar */}
        <BulkActionsToolbar
          bulkSelected={bulkSelected}
          filteredBookingsCount={filteredBookings.length}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onBulkDelete={handleBulkDelete}
          onSelectAll={selectAllBookings}
          onCancel={() => {
            setBulkMode(false);
            setBulkSelected([]);
          }}
        />

        {/* View Tabs */}
        <div className="bg-surface rounded-xl md:rounded-2xl border border-outline-variant p-1 shadow-md3-level1">
          <div className="flex overflow-x-auto scrollbar-hide">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={async () => {
                  await impactLight();
                  setViewMode(tab.id);
                }}
                className={`
                  flex-1 min-w-[80px] flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2
                  px-3 py-2.5 md:px-4 md:py-3 rounded-lg font-bold text-[10px] md:text-xs transition-all duration-200
                  ${viewMode === tab.id
                    ? "bg-gradient-to-r from-[#1e293b] to-[#334155] text-white shadow-md3-level2"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-variant"
                  }
                `}
              >
                <i className={`fas ${tab.icon} text-xs`} />
                <span>{tab.label}</span>
                <span className={`hidden lg:inline text-[9px] opacity-70 ${viewMode === tab.id ? "text-white/70" : "text-outline"}`}>
                  {tab.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.id}
              onClick={() => setFilterStatus(chip.id)}
              className={`
                shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full font-bold text-[11px] md:text-xs transition-all duration-200 active:scale-95
                ${filterStatus === chip.id
                  ? "bg-gradient-to-r from-[#1e293b] to-[#334155] text-white shadow-md3-level2"
                  : "bg-surface border border-outline-variant text-on-surface-variant hover:border-[#1e293b] hover:text-on-surface"
                }
              `}
            >
              <i className={`fas ${chip.icon} text-[10px]`} />
              {chip.label}
              <span className={`
                ml-0.5 px-1.5 py-0.5 rounded-full text-[9px]
                ${filterStatus === chip.id ? "bg-surface/20" : "bg-surface-variant"}
              `}>
                {chip.id === "all" ? bookings.length : bookings.filter((b) => b.status === chip.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[300px]">
          {viewMode === "cancellations" ? (
            <BookingCancellationRequests
              cancellationRequests={cancellationRequests}
              cancellationFilter={cancellationFilter}
              setCancellationFilter={setCancellationFilter}
              onAction={handleBookingCancellationAction}
              isLoading={loading}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-3 border-outline-variant border-t-[#1e293b] rounded-full animate-spin mb-4" />
              <p className="text-sm text-on-surface-variant font-medium">Loading bookings...</p>
            </div>
          ) : !hasData ? (
            <EmptyState viewMode={viewMode} />
          ) : (
            <>
              {viewMode === "calendar" && (
                <CalendarTab
                  bookings={filteredBookings}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onViewBooking={setSelectedBooking}
                  isLoading={loading}
                />
              )}
              {viewMode === "timeline" && (
                <TimelineTab
                  bookings={filteredBookings}
                  onViewBooking={setSelectedBooking}
                  isLoading={loading}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeleteBooking}
                />
              )}
              {viewMode === "list" && (
                <ListTab
                  bookings={filteredBookings}
                  onViewBooking={setSelectedBooking}
                  isLoading={loading}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeleteBooking}
                />
              )}
              {viewMode === "grid" && (
                <GridTab
                  bookings={filteredBookings}
                  onViewBooking={setSelectedBooking}
                  isLoading={loading}
                  onUpdateStatus={handleUpdateStatus}
                  onDelete={handleDeleteBooking}
                />
              )}

              {/* Load More */}
              {hasMoreBookings && viewMode !== "calendar" && (
                <div className="flex justify-center pt-4 pb-8">
                  <button
                    onClick={loadMoreBookings}
                    disabled={loadingMore}
                    className="flex items-center gap-2 px-6 py-3 bg-surface border-2 border-outline-variant rounded-xl font-bold text-sm text-on-surface-variant hover:border-[#1e293b] hover:text-[#1e293b] transition-all active:scale-95 disabled:opacity-40"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#1e293b]/30 border-t-[#1e293b] rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-chevron-down text-xs" />
                        Load More Bookings
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <ViewBookingModal
        booking={selectedBooking}
        open={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={(bookingId) => {
          setShowDeleteConfirm(bookingId);
          setSelectedBooking(null);
        }}
        onEdit={(booking) => {
          handleEditBooking(booking);
          setSelectedBooking(null);
        }}
        onConfirmPayment={handleConfirmPayment}
        onOpenPaymentModal={() => setPaymentModalOpen(true)}
        onSendReminder={handleSendReminder}
      />

      <PaymentConfirmationModal
        item={selectedBooking}
        itemType="booking"
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      <DeleteConfirmDialog
        isOpen={!!showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDeleteBooking(showDeleteConfirm)}
      />

      <ManualBookingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onBookingCreated={handleBookingCreated}
      />

      {/* Edit Modal - simplified inline for now */}
      {editModalOpen && editingBooking && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 animate-fadeIn">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setEditModalOpen(false); setEditingBooking(null); }} />
          <div className="relative md3-card-elevated w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scaleIn">
            <div className="px-5 py-4 border-b border-[var(--md-sys-color-outline-variant)] flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--md-sys-color-on-surface)]">
                <div className="w-8 h-8 rounded-lg bg-[var(--md-sys-color-surface-variant)] flex items-center justify-center">
                  <i className="fas fa-edit text-[var(--md-sys-color-on-surface-variant)] text-sm" />
                </div>
                Edit Booking
              </h2>
              <button
                onClick={() => { setEditModalOpen(false); setEditingBooking(null); }}
                className="w-9 h-9 rounded-full border-2 border-[var(--md-sys-color-outline-variant)] flex items-center justify-center text-[var(--md-sys-color-on-surface-variant)] hover:border-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-primary)] transition-all active:scale-95"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user || !editingBooking) return;
                  try {
                    const formData = new FormData(e.currentTarget);
                    const updates: Partial<Booking> = {
                      client: formData.get("client") as string,
                      phone: formData.get("phone") as string,
                      date: formData.get("date") as string,
                      time: formData.get("time") as string,
                      duration: formData.get("duration") as string,
                      location: formData.get("location") as string,
                      price: Number(formData.get("price")),
                      deposit: Number(formData.get("deposit") || 0),
                      paymentMethod: formData.get("paymentMethod") as any,
                      notes: formData.get("notes") as string,
                    };
                    updates.clientInitials = (updates.client || "").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                    updates.balance = (updates.price || 0) - (updates.deposit || 0);
                    updates.paymentStatus = updates.deposit && updates.deposit > 0 ? (updates.deposit >= (updates.price || 0) ? "paid" : "partial") : "unpaid";

                    await bookingService.updateBooking(user, editingBooking.id, updates);
                    reloadBookings();
                    setEditModalOpen(false);
                    setEditingBooking(null);
                    addToast("Booking updated successfully!");
                  } catch (error) {
                    console.error("Error updating booking:", error);
                    addToast("Failed to update booking", "error");
                  }
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: "client", label: "Client Name", type: "text", defaultValue: editingBooking.client },
                    { name: "phone", label: "Phone", type: "tel", defaultValue: editingBooking.phone },
                    { name: "date", label: "Date", type: "date", defaultValue: editingBooking.date },
                    { name: "time", label: "Time", type: "time", defaultValue: editingBooking.time },
                    { name: "duration", label: "Duration", type: "text", defaultValue: editingBooking.duration },
                    { name: "location", label: "Location", type: "text", defaultValue: editingBooking.location },
                    { name: "price", label: "Price (KES)", type: "number", defaultValue: String(editingBooking.price) },
                    { name: "deposit", label: "Deposit (KES)", type: "number", defaultValue: String(editingBooking.deposit || 0) },
                  ].map((field) => (
                    <div key={field.name}>
                      <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">{field.label}</label>
                      <input
                        name={field.name}
                        type={field.type}
                        defaultValue={field.defaultValue}
                        className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-primary)] focus:shadow-md3-level2 focus:outline-none text-sm transition-all md3-input-outlined"
                        required={field.name !== "deposit"}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">Payment Method</label>
                    <select
                      name="paymentMethod"
                      defaultValue={editingBooking.paymentMethod || ""}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-primary)] focus:shadow-md3-level2 focus:outline-none text-sm transition-all md3-input-outlined"
                    >
                      <option value="">Select method</option>
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--md-sys-color-on-surface-variant)] mb-1.5">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={editingBooking.notes || ""}
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-[var(--md-sys-color-outline)] focus:border-[var(--md-sys-color-primary)] focus:shadow-md3-level2 focus:outline-none text-sm resize-none transition-all md3-input-outlined"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setEditModalOpen(false); setEditingBooking(null); }}
                    className="flex-1 px-4 py-3 md3-button-outlined rounded-xl font-medium text-sm transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 md3-button-filled rounded-xl font-medium text-sm transition-all active:scale-95 shadow-md3-level3"
                  >
                    <i className="fas fa-save mr-2 text-xs" />
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}