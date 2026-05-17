import { getFirestore } from "firebase-admin/firestore";

export interface BookingStatusDeps {
  sendMessage: (tenantId: string, phone: string, text: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
  sendWelcomeMenu: (tenantId: string, phone: string) => Promise<void>;
}

/**
 * Start booking status lookup flow - ask for booking ID or phone number
 */
export async function startBookingStatusFlow(
  tenantId: string,
  phone: string,
  deps: BookingStatusDeps
): Promise<void> {
  await deps.startTyping(tenantId, phone);
  
  const message = `📅 *Check Booking Status*\n\n` +
    `Please provide one of the following:\n\n` +
    `• Your *Booking ID* (e.g., BK-123456)\n` +
    `• Your *Phone Number* used for booking\n\n` +
    `Example: *BK-ABC123* or *0712345678*\n\n` +
    `0️⃣ - Back to main menu`;
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);
  
  // Set flow state
  const adminDb = getFirestore();
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'booking_status_lookup',
        currentStep: 'waiting_for_identifier',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

/**
 * Handle booking status lookup input - search by booking ID or phone
 */
export async function handleBookingStatusLookup(
  tenantId: string,
  phone: string,
  message: string,
  deps: BookingStatusDeps
): Promise<void> {
  await deps.startTyping(tenantId, phone);
  
  const trimmed = message.trim();
  
  // Check if user wants to go back
  if (trimmed === '0') {
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  try {
    const adminDb = getFirestore();
    
    let bookingsQuery;
    
    // Check if input looks like a booking ID (starts with BK- or contains alphanumeric)
    const isBookingId = trimmed.toUpperCase().startsWith('BK-') || /^[A-Z0-9-]+$/i.test(trimmed);
    
    if (isBookingId) {
      // Search by booking ID
      const normalizedId = trimmed.toUpperCase();
      bookingsQuery = await adminDb
        .collection("bookings")
        .where("tenantId", "==", tenantId)
        .where("id", "==", normalizedId)
        .limit(1)
        .get();
    } else {
      // Search by phone number - normalize by removing non-digits
      const normalizedPhone = trimmed.replace(/\D/g, '');
      
      if (normalizedPhone.length < 9) {
        await deps.stopTyping(tenantId, phone);
        await deps.sendMessage(
          tenantId,
          phone,
          `❌ Invalid phone number. Please enter a valid phone number.\n\n` +
          `Example: *0712345678* or *+254712345678*\n\n` +
          `Or reply with your *Booking ID*\n\n` +
          `0️⃣ - Back to main menu`
        );
        return;
      }
      
      bookingsQuery = await adminDb
        .collection("bookings")
        .where("tenantId", "==", tenantId)
        .where("phone", "==", normalizedPhone)
        .orderBy("date", "desc")
        .limit(5)
        .get();
    }
    
    if (bookingsQuery.empty) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `❌ No bookings found.\n\n` +
        `Please check your booking ID or phone number and try again.\n\n` +
        `💡 *Tip:* Your booking ID was sent when you made the reservation.\n\n` +
        `0️⃣ - Back to main menu`
      );
      return;
    }
    
    const bookings = bookingsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // If searching by phone and multiple bookings found, show list
    if (!isBookingId && bookings.length > 1) {
      let responseMessage = `📅 *Your Recent Bookings*\n\n`;
      responseMessage += `Found ${bookings.length} booking(s):\n\n`;
      
      bookings.forEach((booking: any, idx: number) => {
        const statusEmoji = getStatusEmoji(booking.status);
        const date = formatDate(booking.date);
        
        responseMessage += `${idx + 1}. *${booking.service}*\n`;
        responseMessage += `   📅 ${date} at ${booking.time}\n`;
        responseMessage += `   👤 ${booking.client}\n`;
        responseMessage += `   ${statusEmoji} Status: *${booking.status.toUpperCase()}*\n`;
        responseMessage += `   💰 KES ${booking.price?.toLocaleString() || 'N/A'}\n\n`;
      });
      
      responseMessage += `Reply with a number (1-${bookings.length}) to see full details,\n`;
      responseMessage += `or *0* to go back.`;
      
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, responseMessage);
      
      // Update flow state to wait for selection
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            isActive: true,
            flowName: 'booking_status_selection',
            currentStep: 'waiting_for_booking_selection',
            bookings: bookings.map((b: any) => ({
              id: b.id,
              client: b.client,
              service: b.service,
              date: b.date,
              time: b.time,
              status: b.status,
              price: b.price,
              phone: b.phone,
              location: b.location,
              notes: b.notes,
            })),
            lastActivity: new Date().toISOString(),
          }
        }, { merge: true });
      
      return;
    }
    
    // Single booking found - show details
    const booking = bookings[0];
    await sendBookingDetails(tenantId, phone, booking, deps);
    
    // Clear flow state
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          flowState: require("firebase-admin/firestore").FieldValue.delete()
        }
      }, { merge: true });
    
  } catch (error) {
    console.error('[Webhook] Error looking up booking:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Unable to look up booking. Please try again later.\n\n` +
      `0️⃣ - Back to main menu`
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
        flowState: require("firebase-admin/firestore").FieldValue.delete()
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
          flowState: require("firebase-admin/firestore").FieldValue.delete()
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
        requestedAt: require("firebase-admin/firestore").FieldValue.serverTimestamp(),
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
          cancellationRequestedAt: require("firebase-admin/firestore").FieldValue.serverTimestamp(),
          updatedAt: require("firebase-admin/firestore").FieldValue.serverTimestamp(),
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
        flowState: require("firebase-admin/firestore").FieldValue.delete()
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
        flowState: require("firebase-admin/firestore").FieldValue.delete()
      }, { merge: true });
  }
}
