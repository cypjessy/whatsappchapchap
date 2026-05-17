import { getFirestore, FieldValue } from "firebase-admin/firestore";

export interface BookingStatusDeps {
  sendMessage: (tenantId: string, phone: string, text: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
  sendWelcomeMenu: (tenantId: string, phone: string) => Promise<void>;
}

/**
 * Start booking status check flow - shows recent bookings immediately
 */
export async function startBookingStatusFlow(
  tenantId: string,
  phone: string,
  deps: BookingStatusDeps
): Promise<void> {
  await deps.startTyping(tenantId, phone);
  
  // Directly show recent bookings instead of asking for booking ID
  await showRecentBookings(tenantId, phone, deps);
}

/**
 * Handle booking status selection (from recent bookings list)
 */
export async function handleBookingStatusSelection(
  tenantId: string,
  phone: string,
  selection: string,
  flowState: any,
  deps: BookingStatusDeps
): Promise<void> {
  console.log(`[BookingStatus] Selection: "${selection}", Recent bookings: ${flowState.recentBookings?.length || 0}`);
  
  const recentBookings = flowState.recentBookings || [];

  // Handle NEXT pagination
  if (selection.trim().toUpperCase() === 'NEXT') {
    const lastBookingDocId = flowState.lastBookingDocId;
    const currentPage = flowState.bookingPage || 1;
    await showRecentBookings(tenantId, phone, deps, currentPage + 1, lastBookingDocId);
    return;
  }

  // Handle direct booking ID lookup (Firestore document ID)
  // Note: Booking IDs are auto-generated Firestore IDs (20 char base62)
  if (/^[a-zA-Z0-9]{20}$/.test(selection.trim())) {
    await lookupBookingById(tenantId, phone, selection.trim(), deps);
    return;
  }

  const num = parseInt(selection.trim());

  // Go to main menu
  if (num === 0 || selection.trim() === '0') {
    console.log(`[BookingStatus] User pressed 0 - going to main menu`);
    await deps.stopTyping(tenantId, phone);
    
    // Clear flow state
    const adminDb = getFirestore();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
    
    await deps.sendWelcomeMenu(tenantId, phone);
    return;
  }

  if (isNaN(num) || num < 1 || num > recentBookings.length) {
    console.log(`[BookingStatus] Invalid selection - num: ${num}, range: 1-${recentBookings.length}`);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Reply with a number from 1-${recentBookings.length}, or *0* for main menu.`
    );
    return;
  }

  const selectedBooking = recentBookings[num - 1];
  console.log(`[BookingStatus] Selected booking: ${selectedBooking.id}`);
  
  // Show detailed booking info with cancellation option
  await sendBookingDetails(tenantId, phone, selectedBooking, deps);
}

/**
 * Look up a specific booking by booking ID
 */
async function lookupBookingById(
  tenantId: string,
  phone: string,
  bookingId: string,
  deps: BookingStatusDeps
): Promise<void> {
  try {
    console.log(`[BookingStatus] Looking up booking: ${bookingId} for phone: ${phone}`);
    
    const adminDb = getFirestore();
    
    // Query by id field
    const bookingQuery = await adminDb
      .collection("bookings")
      .where("id", "==", bookingId)
      .where("tenantId", "==", tenantId)
      .get();
    
    if (bookingQuery.empty) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `❌ Booking *${bookingId}* not found.\n\n` +
        `Please check the booking ID and try again.\n\n` +
        `💡 Type *RECENT* to see your recent bookings, or *MENU* for main menu`
      );
      return;
    }
    
    const bookingDoc = bookingQuery.docs[0];
    const bookingData = bookingDoc.data();
    
    await sendBookingDetails(tenantId, phone, bookingData, deps);
    
  } catch (error) {
    console.error('[BookingStatus] Error looking up booking:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Error looking up booking. Please try again or type *RECENT* to see recent bookings.`
    );
  }
}

/**
 * Show recent bookings for the user with pagination
 */
async function showRecentBookings(
  tenantId: string,
  phone: string,
  deps: BookingStatusDeps,
  page: number = 1,
  lastDocId?: string
): Promise<void> {
  try {
    console.log(`[BookingStatus] Fetching bookings for phone: ${phone}, page: ${page}, lastDocId: ${lastDocId || 'none'}`);
    
    const adminDb = getFirestore();
    const BOOKINGS_PER_PAGE = 5;
    
    // Get total count first
    const countSnap = await adminDb
      .collection("bookings")
      .where("phone", "==", phone)
      .where("tenantId", "==", tenantId)
      .get();
    
    const totalBookings = countSnap.size;
    
    if (totalBookings === 0) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `📅 *No Bookings Found*\n\n` +
        `You haven't made any bookings yet.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `0️⃣ - Back to Main Menu\n` +
        `2️ - Browse Services`
      );
      return;
    }
    
    // Use cursor-based pagination with startAfter
    let query = adminDb.collection("bookings")
      .where("phone", "==", phone)
      .where("tenantId", "==", tenantId)
      .orderBy("createdAt", "desc")
      .limit(BOOKINGS_PER_PAGE);
    
    // Apply cursor for pages beyond 1
    if (page > 1 && lastDocId) {
      const lastDoc = await adminDb.collection("bookings").doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }
    
    // Get paginated bookings
    let bookingsSnap;
    try {
      bookingsSnap = await query.get();
    } catch (indexError) {
      console.error('[BookingStatus] Index error - please create composite index:', indexError);
      // Fallback: Get all and sort in memory
      const allBookingsSnap = await adminDb
        .collection("bookings")
        .where("phone", "==", phone)
        .where("tenantId", "==", tenantId)
        .get();
      
      const allBookings = allBookingsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as any)
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
      
      const paginatedBookings = allBookings.slice((page - 1) * BOOKINGS_PER_PAGE, page * BOOKINGS_PER_PAGE);
      bookingsSnap = { docs: paginatedBookings.map((booking: any) => ({ id: booking.id, data: () => booking })), size: paginatedBookings.length } as any;
    }
    
    let message = `📅 *Your Bookings (Page ${page})*\n\n`;
    
    bookingsSnap.docs.forEach((doc: any, idx: number) => {
      const booking = doc.data ? doc.data() : doc;
      const bookingId = booking.id || doc.id;
      const statusEmoji = getStatusEmoji(booking.status);
      
      let date = 'N/A';
      if (booking.date) {
        date = formatDate(booking.date);
      }
      
      message += `${idx + 1}️⃣ *${booking.service}*\n`;
      message += `    📅 ${date} at ${booking.time}\n`;
      message += `    👤 ${booking.client}\n`;
      message += `   💰 KES ${booking.price?.toLocaleString() || 0}\n`;
      message += `   📊 Status: ${statusEmoji} ${capitalizeFirst(booking.status)}\n\n`;
    });
    
    // Pagination info
    const startNum = (page - 1) * BOOKINGS_PER_PAGE + 1;
    const endNum = Math.min(page * BOOKINGS_PER_PAGE, totalBookings);
    message += `*Showing bookings ${startNum}-${endNum} of ${totalBookings}*\n\n`;
    
    message += `*Reply with a number (1-${bookingsSnap.docs.length}) to see details,*\n`;
    message += `or type a Booking ID to search directly\n`;
    
    // Show "Load More" if there are more bookings
    if (endNum < totalBookings) {
      message += `or *NEXT* to view more bookings\n`;
    }
    message += `or *0️⃣* for main menu`;
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, message);
    
    // Store flow state for selection with pagination info
    const recentBookingsList = bookingsSnap.docs.map((doc: any) => {
      const data = doc.data ? doc.data() : doc;
      return {
        id: doc.id,
        ...data
      };
    });
    
    console.log(`[BookingStatus] Storing ${recentBookingsList.length} bookings in flow state`);
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          flowName: 'booking_status_selection',
          currentStep: 'waiting_for_selection',
          bookingPage: page,
          lastBookingDocId: bookingsSnap.docs[bookingsSnap.docs.length - 1]?.id || null,
          recentBookings: recentBookingsList,
          isActive: true,
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
    
  } catch (error) {
    console.error('[BookingStatus] Error fetching recent bookings:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Error fetching bookings. Please try again.`
    );
  }
}

/**
 * Send detailed booking information
 */
async function sendBookingDetails(
  tenantId: string,
  phone: string,
  booking: any,
  deps: BookingStatusDeps
): Promise<void> {
  const statusEmoji = getStatusEmoji(booking.status);
  const paymentEmoji = getPaymentEmoji(booking.paymentStatus);
  
  let message = `📅 *Booking Details*\n\n`;
  message += `*ID:* ${booking.id}\n`;
  message += `*Client:* ${booking.client}\n`;
  message += `*Service:* ${booking.service}\n\n`;
  
  message += `📅 *Date & Time*\n`;
  message += `Date: ${formatDate(booking.date)}\n`;
  message += `Time: ${booking.time}\n`;
  message += `Duration: ${booking.duration || 'N/A'}\n\n`;
  
  message += `📍 *Location*\n`;
  message += `${booking.location || 'N/A'}\n\n`;
  
  message += `${statusEmoji} *Status: ${booking.status.toUpperCase()}*\n`;
  
  if (booking.paymentStatus) {
    message += `${paymentEmoji} *Payment: ${booking.paymentStatus.toUpperCase()}*\n`;
    message += `Amount: KES ${booking.price?.toLocaleString() || 'N/A'}\n`;
    
    if (booking.deposit) {
      message += `Deposit: KES ${booking.deposit.toLocaleString()}\n`;
      if (booking.balance) {
        message += `Balance: KES ${booking.balance.toLocaleString()}\n`;
      }
    }
    message += `\n`;
  }
  
  if (booking.phone) {
    message += `📞 *Contact*\n`;
    message += `${booking.phone}\n\n`;
  }
  
  if (booking.notes) {
    message += `📝 *Notes*\n`;
    message += `${booking.notes}\n\n`;
  }
  
  message += `━━━━━━━━━━━━━━━\n\n`;
  
  // Check if booking can be cancelled (NOT completed or already cancelled)
  const nonCancellableStatuses = ['completed', 'cancelled'];
  const canCancel = !nonCancellableStatuses.includes(booking.status?.toLowerCase());
  
  if (canCancel) {
    message += `1️⃣ - Cancel Booking\n`;
  }
  
  message += `Reply *MENU* for main menu`;
  
  if (canCancel) {
    message += ` or reply with the number (1 or MENU)`;
  }
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);
  
  // Store flow state for cancellation option (only if booking can be cancelled)
  if (canCancel) {
    const adminDb = getFirestore();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'booking_cancellation',
          currentStep: 'waiting_for_cancel_selection',
          bookingId: booking.id,
          bookingData: {
            id: booking.id,
            client: booking.client,
            service: booking.service,
            date: booking.date,
            time: booking.time,
            status: booking.status,
            price: booking.price,
            phone: booking.phone,
            location: booking.location,
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // Clear flow state so user isn't stuck in booking_status_selection
    const adminDb = getFirestore();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
  }
}

/**
 * Get emoji for booking status
 */
function getStatusEmoji(status: string): string {
  switch (status?.toLowerCase()) {
    case 'confirmed':
      return '✅';
    case 'pending':
      return '⏳';
    case 'completed':
      return '✔️';
    case 'cancelled':
      return '❌';
    default:
      return '📋';
  }
}

/**
 * Get emoji for payment status
 */
function getPaymentEmoji(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'paid':
      return '💚';
    case 'partial':
      return '💛';
    case 'unpaid':
      return '❤️';
    default:
      return '💰';
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateStr;
  }
}

/**
 * Helper: Capitalize first letter and replace underscores with spaces
 */
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Handle booking cancellation request
 */
export async function handleBookingCancellation(
  tenantId: string,
  phone: string,
  userInput: string,
  flowState: any,
  deps: BookingStatusDeps
): Promise<void> {
  await deps.startTyping(tenantId, phone);
  
  const input = userInput.trim();
  const num = parseInt(input);
  
  // Handle "0" or "MENU" - Back to main menu
  if (num === 0 || input === '0' || input.toUpperCase() === 'MENU') {
    await deps.stopTyping(tenantId, phone);
    
    // Clear flow state
    const adminDb = getFirestore();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
    
    await deps.sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  // Check if user selected cancellation (option 1)
  if (flowState.currentStep === 'waiting_for_cancel_selection') {
    if (num === 1) {
      // Move to confirmation step
      await deps.stopTyping(tenantId, phone);
      
      const confirmMessage = `⚠️ *Confirm Cancellation*\n\n` +
        `Are you sure you want to cancel this booking?\n\n` +
        `1️⃣ - Yes, Cancel Booking\n` +
        `2️⃣ - No, Go Back\n\n` +
        `_Reply with the number (1 or 2)_`;
      
      await deps.sendMessage(tenantId, phone, confirmMessage);
      
      // Update flow state to confirmation step
      const adminDb = getFirestore();
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            ...flowState,
            currentStep: 'waiting_for_confirm',
            lastActivity: new Date().toISOString(),
          }
        }, { merge: true });
      return;
    }
    
    // Invalid selection
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please reply with *1* to cancel or *MENU* for main menu.`
    );
    return;
  }
  
  // Handle confirmation step
  if (flowState.currentStep === 'waiting_for_confirm') {
    // User confirmed cancellation (option 1)
    if (num === 1) {
      await processBookingCancellation(tenantId, phone, flowState, deps);
      return;
    }
    
    // User declined cancellation (option 2)
    if (num === 2) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `✅ Cancellation cancelled.\n\nReply *MENU* for main menu`
      );
      
      // Clear flow state
      const adminDb = getFirestore();
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: FieldValue.delete()
        }, { merge: true });
      return;
    }
    
    // Invalid selection
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please reply with *1* to confirm cancellation or *2* to go back.`
    );
    return;
  }
  
  // Fallback
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(
    tenantId,
    phone,
    `❌ Please reply with *1* to cancel or *MENU* for main menu.`
  );
}

/**
 * Process the actual booking cancellation
 */
async function processBookingCancellation(
  tenantId: string,
  phone: string,
  flowState: any,
  deps: BookingStatusDeps
): Promise<void> {
  try {
    const adminDb = getFirestore();
    const bookingId = flowState.bookingId;
    const bookingData = flowState.bookingData;
    
    console.log(`[BookingCancel] Processing cancellation for booking: ${bookingId}`);
    
    // Create cancellation request in Firestore
    await adminDb
      .collection("cancellation_requests")
      .add({
        tenantId: tenantId,
        bookingId: bookingId,
        customerPhone: phone,
        bookingData: bookingData,
        type: 'booking',
        status: 'pending',
        reason: 'Customer requested cancellation',
        requestedAt: FieldValue.serverTimestamp(),
        respondedAt: null,
        responseNote: null,
      });
    
    console.log(`[BookingCancel] Created cancellation request with tenantId: ${tenantId}`);
    
    // Update booking status to cancellation_requested
    if (bookingId) {
      const bookingRef = adminDb.collection("bookings").doc(bookingId);
      const bookingDoc = await bookingRef.get();
      
      if (bookingDoc.exists) {
        await bookingRef.update({
          status: 'cancellation_requested',
          cancellationRequestedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`[BookingCancel] Updated booking status to cancellation_requested`);
      }
    }
    
    await deps.stopTyping(tenantId, phone);
    
    // Send confirmation message
    await deps.sendMessage(
      tenantId,
      phone,
      `✅ *Cancellation Request Submitted*\n\n` +
      `Your cancellation request for booking *${bookingId}* has been submitted.\n\n` +
      `Our team will review your request and confirm the cancellation shortly.\n\n` +
      `You will receive a confirmation once the cancellation is processed.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `0️⃣ - Back to Main Menu`
    );
    
    // Clear flow state
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
    
  } catch (error) {
    console.error('[BookingCancel] Error processing cancellation:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Error processing cancellation request. Please try again or contact support.\n\n0️⃣ - Back to Main Menu`
    );
    
    // Clear flow state on error too
    const adminDb = getFirestore();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
  }
}
