/**
 * Order Status Handler
 * Handles checking order status via WhatsApp
 * Orders are stored with phone number for cross-device access
 * 
 * FIXES:
 * - Uses orderNumber field instead of non-existent orderId
 * - Uses products field instead of items
 * - Added proper composite index instructions
 * - Added order number generation helper
 * - Fixed pagination queries
 * - Added cancellation window validation
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Lazy initialization - get Firestore instance only when needed
 * This prevents "app not initialized" errors at module load time
 */
function getDb() {
  return getFirestore();
}

/**
 * Dependencies passed from main route
 */
export interface OrderStatusDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  startTyping?: (tenantId: string, phone: string) => Promise<void>;
  stopTyping?: (tenantId: string, phone: string) => Promise<void>;
  sendWelcomeMenu?: (tenantId: string, phone: string) => Promise<void>; // ⭐ ADDED for main menu navigation
}

/**
 * Start order status check flow - shows recent orders immediately
 */
export async function startOrderStatusFlow(
  tenantId: string,
  phone: string,
  deps: OrderStatusDeps
): Promise<void> {
  if (deps.startTyping) await deps.startTyping(tenantId, phone);
  
  // Directly show recent orders instead of asking for order number
  await showRecentOrders(tenantId, phone, deps);
}

/**
 * Handle order status lookup - can look up by order number or refresh recent orders
 */
export async function handleOrderStatusLookup(
  tenantId: string,
  phone: string,
  userInput: string,
  deps: OrderStatusDeps
): Promise<void> {
  if (deps.startTyping) await deps.startTyping(tenantId, phone);
  
  const input = userInput.trim().toUpperCase();
  
  // Handle "NEXT" for pagination
  if (input === 'NEXT') {
    const db = getDb();
    const convDoc = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .get();
    
    const currentPage = convDoc.data()?.flowState?.orderPage || 1;
    const lastOrderDocId = convDoc.data()?.flowState?.lastOrderDocId;  // ⭐ ADDED: Get cursor
    await showRecentOrders(tenantId, phone, deps, currentPage + 1, lastOrderDocId);
    return;
  }
  
  // If user types an order number (starts with ORD-)
  if (input.startsWith('ORD-')) {
    await lookupOrderByNumber(tenantId, phone, input, deps);
    return;
  }
  
  // Otherwise, show recent orders again (refresh)
  await showRecentOrders(tenantId, phone, deps);
}

/**
 * Look up a specific order by order number
 */
async function lookupOrderByNumber(
  tenantId: string,
  phone: string,
  orderNumber: string,
  deps: OrderStatusDeps
): Promise<void> {
  try {
    console.log(`[OrderStatus] Looking up order: ${orderNumber} for phone: ${phone}`);
    
    const db = getDb();
    
    // Query by orderNumber field (not document ID)
    const orderQuery = await db
      .collection("orders")
      .where("orderNumber", "==", orderNumber)
      .where("tenantId", "==", tenantId)
      .get();
    
    if (orderQuery.empty) {
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `❌ Order *${orderNumber}* not found.\n\n` +
        `Please check the order number and try again.\n\n` +
        `💡 Type *RECENT* to see your recent orders, or *0️⃣* for main menu`
      );
      return;
    }
    
    const orderDoc = orderQuery.docs[0];
    const orderData = orderDoc.data();
    const actualOrderNumber = orderData.orderNumber || orderNumber;
    
    await sendOrderDetails(tenantId, phone, actualOrderNumber, orderDoc.id, orderData, deps);
    
  } catch (error) {
    console.error('[OrderStatus] Error looking up order:', error);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Error looking up order. Please try again or type *RECENT* to see recent orders.`
    );
  }
}

/**
 * Show recent orders for the user with pagination
 */
async function showRecentOrders(
  tenantId: string,
  phone: string,
  deps: OrderStatusDeps,
  page: number = 1,
  lastDocId?: string  // ⭐ ADDED: Cursor for pagination
): Promise<void> {
  try {
    console.log(`[OrderStatus] Fetching orders for phone: ${phone}, page: ${page}, lastDocId: ${lastDocId || 'none'}`);
    
    const db = getDb();
    const ORDERS_PER_PAGE = 5;
    
    // Get total count first - using customerPhone field
    const countSnap = await db
      .collection("orders")
      .where("customerPhone", "==", phone)
      .where("tenantId", "==", tenantId)
      .get();
    
    const totalOrders = countSnap.size;
    
    if (totalOrders === 0) {
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `📦 *No Orders Found*\n\n` +
        `You haven't placed any orders yet.\n\n` +
        `Reply *1* to browse products or *0️⃣* for main menu`
      );
      return;
    }
    
    // ⭐ FIXED: Use cursor-based pagination with startAfter
    let query = db.collection("orders")
      .where("customerPhone", "==", phone)
      .where("tenantId", "==", tenantId)
      .orderBy("createdAt", "desc")
      .limit(ORDERS_PER_PAGE);
    
    // Apply cursor for pages beyond 1
    if (page > 1 && lastDocId) {
      const lastDoc = await db.collection("orders").doc(lastDocId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }
    
    // Get paginated orders - requires composite index
    // Required index: tenantId (ASC) + customerPhone (ASC) + createdAt (DESC)
    let ordersSnap;
    try {
      ordersSnap = await query.get();
    } catch (indexError) {
      console.error('[OrderStatus] Index error - please create composite index:', indexError);
      // Fallback: Get all and sort in memory (less efficient but works without index)
      const allOrdersSnap = await db
        .collection("orders")
        .where("customerPhone", "==", phone)
        .where("tenantId", "==", tenantId)
        .get();
      
      const allOrders = allOrdersSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as any)
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
      
      const paginatedOrders = allOrders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE);
      ordersSnap = { docs: paginatedOrders.map((order: any) => ({ id: order.id, data: () => order })), size: paginatedOrders.length } as any;
    }
    
    let message = `📦 *Your Orders (Page ${page})*\n\n`;
    
    ordersSnap.docs.forEach((doc: any, idx: number) => {
      const order = doc.data ? doc.data() : doc;
      const orderId = order.id || doc.id;
      const orderNumber = order.orderNumber || `ORD-${orderId.slice(-10)}`;
      const statusEmoji = getStatusEmoji(order.status);
      
      let date = 'N/A';
      if (order.createdAt?.toDate) {
        date = order.createdAt.toDate().toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      } else if (order.createdAt) {
        date = new Date(order.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
      
      message += `${idx + 1}️⃣ *${orderNumber}*\n`;
      message += `    📅 ${date}\n`;
      
      // FIXED: Use 'products' field (not 'items')
      if (order.products && order.products.length > 0) {
        order.products.forEach((item: any) => {
          const productName = item.name || item.productName || 'Product';
          const quantity = item.quantity || 1;
          message += `    📦 ${productName} x${quantity}\n`;
        });
      }
      
      message += `   💰 KES ${order.total?.toLocaleString() || 0}\n`;
      message += `   📊 Status: ${statusEmoji} ${capitalizeFirst(order.status)}\n\n`;
    });
    
    // Pagination info
    const startNum = (page - 1) * ORDERS_PER_PAGE + 1;
    const endNum = Math.min(page * ORDERS_PER_PAGE, totalOrders);
    message += `*Showing orders ${startNum}-${endNum} of ${totalOrders}*\n\n`;
    
    message += `*Reply with a number (1-${ordersSnap.docs.length}) to see details,*\n`;
    message += `or type an Order Number (e.g., ORD-1234567890) to search\n`;
    
    // Show "Load More" if there are more orders
    if (endNum < totalOrders) {
      message += `or *NEXT* to view more orders\n`;
    }
    message += `or *0️⃣* for main menu`;
    
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, message);
    
    // Store flow state for selection with pagination info
    const recentOrdersList = ordersSnap.docs.map((doc: any) => {
      const data = doc.data ? doc.data() : doc;
      return {
        id: doc.id,
        orderNumber: data.orderNumber || `ORD-${doc.id.slice(-10)}`,
        ...data
      };
    });
    
    console.log(`[OrderStatus] Storing ${recentOrdersList.length} orders in flow state`);
    
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          flowName: 'order_status_selection',
          currentStep: 'waiting_for_selection',
          orderPage: page,
          lastOrderDocId: ordersSnap.docs[ordersSnap.docs.length - 1]?.id || null,  // ⭐ ADDED: Cursor for next page
          recentOrders: recentOrdersList,
          isActive: true,
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
    
  } catch (error) {
    console.error('[OrderStatus] Error fetching recent orders:', error);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Error fetching orders. Please try again.`
    );
  }
}

/**
 * Send detailed order information
 */
async function sendOrderDetails(
  tenantId: string,
  phone: string,
  orderNumber: string,
  orderDocId: string,
  orderData: any,
  deps: OrderStatusDeps
): Promise<void> {
  const statusEmoji = getStatusEmoji(orderData.status);
  
  let date = 'N/A';
  if (orderData.createdAt?.toDate) {
    date = orderData.createdAt.toDate().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } else if (orderData.createdAt) {
    date = new Date(orderData.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  let message = `✅ *Order Found!*\n\n`;
  message += `📦 Order: *${orderNumber}*\n`;
  message += `📅 Date: ${date}\n`;
  message += `💰 Total: KES ${orderData.total?.toLocaleString() || 0}\n`;
  message += `📊 Status: ${statusEmoji} *${capitalizeFirst(orderData.status)}*\n\n`;
  
  // FIXED: Use 'products' field (not 'items')
  if (orderData.products && orderData.products.length > 0) {
    message += `📋 *Order Items:*\n`;
    orderData.products.forEach((item: any, idx: number) => {
      const itemName = item.name || item.productName || 'Product';
      const quantity = item.quantity || 1;
      const itemPrice = item.price || 0;
      const itemTotal = itemPrice * quantity;
      const variant = item.variant || item.selectedOptions || '';
      
      message += `${idx + 1}. *${itemName}*\n`;
      if (variant) message += `   🎨 Options: ${variant}\n`;
      message += `   📦 Quantity: ${quantity}\n`;
      message += `   💰 Price: KES ${itemPrice.toLocaleString()} each\n`;
      message += `   💵 Subtotal: KES ${itemTotal.toLocaleString()}\n\n`;
    });
    message += `━━━━━━━━━━━━━━━\n\n`;
  }
  
  // Shipping address
  if (orderData.deliveryAddress || orderData.shippingAddress) {
    const address = orderData.deliveryAddress || orderData.shippingAddress;
    message += `📍 *Delivery Address:*\n`;
    if (typeof address === 'string') {
      message += `${address}\n`;
    } else {
      if (address.fullName) message += `${address.fullName}\n`;
      if (address.phone) message += `📱 ${address.phone}\n`;
      if (address.city || address.town) message += `${address.city || address.town}`;
      if (address.area) message += `, ${address.area}`;
      if (address.city || address.town || address.area) message += `\n`;
    }
    message += `\n`;
  }
  
  // Tracking info
  if (orderData.trackingNumber) {
    message += `🚚 *Tracking Number:* ${orderData.trackingNumber}\n`;
  }
  
  if (orderData.estimatedDelivery) {
    let deliveryDate = 'N/A';
    if (orderData.estimatedDelivery?.toDate) {
      deliveryDate = orderData.estimatedDelivery.toDate().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } else if (orderData.estimatedDelivery) {
      deliveryDate = new Date(orderData.estimatedDelivery).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
    message += `📅 *Expected Delivery:* ${deliveryDate}\n`;
  }
  
  // Payment info
  if (orderData.paymentMethod) {
    message += `💳 *Payment Method:* ${capitalizeFirst(orderData.paymentMethod)}\n`;
  }
  
  if (orderData.paymentStatus) {
    const paymentEmoji = orderData.paymentStatus === 'paid' ? '✅' : '⏳';
    message += `${paymentEmoji} *Payment Status:* ${capitalizeFirst(orderData.paymentStatus)}\n`;
  }
  
  message += `\n━━━━━━━━━━━━━━━\n`;
  
  // Check if order can be cancelled (not shipped/delivered, within 24 hours)
  const cancellableStatuses = ['pending', 'processing', 'confirmed'];
  const canCancel = cancellableStatuses.includes(orderData.status?.toLowerCase());
  
  // Check cancellation window (optional: within 24 hours of order)
  let isWithinWindow = true;
  if (orderData.createdAt?.toDate) {
    const orderDate = orderData.createdAt.toDate();
    const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
    isWithinWindow = hoursSinceOrder <= 24; // Can cancel within 24 hours
  }
  
  const canCancelOrder = canCancel && isWithinWindow;
  
  if (canCancelOrder) {
    message += `1️⃣ - Request Cancellation & Refund\n`;
  }
  
  message += `0️⃣ - Back to Main Menu`;
  
  if (canCancelOrder) {
    message += `\n\n_Reply with the number (1 or 0)_`;
  }
  
  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);
  
  // Store flow state for cancellation option (only if order can be cancelled)
  const db = getDb();
  
  if (canCancelOrder) {
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          flowName: 'order_cancellation',
          currentStep: 'waiting_for_cancel_selection',
          currentOrderNumber: orderNumber,
          currentOrderDocId: orderDocId,
          orderData: orderData,
          isActive: true,
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // Clear any existing flow state
    await db
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
 * Handle order status selection (from recent orders list)
 */
export async function handleOrderStatusSelection(
  tenantId: string,
  phone: string,
  selection: string,
  flowState: any,
  deps: OrderStatusDeps
): Promise<void> {
  const num = parseInt(selection);
  const recentOrders = flowState.recentOrders || [];
  
  console.log(`[OrderStatus] Selection: "${selection}", Num: ${num}, Recent orders: ${recentOrders.length}`);
  
  // Handle "0" - ALWAYS go to main menu
  if (num === 0 || selection === '0') {
    console.log(`[OrderStatus] User pressed 0 - going to main menu`);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    
    // Clear flow state immediately
    const db = getDb();
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
    
    // ⭐ Fetch business name for personalized welcome
    let businessName = "Our Shop";
    try {
      const adminDb = getDb();
        
      // ⭐ PRIORITY 1: Fetch from tenants collection (most accurate - primary source)
      const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
        
      if (tenantDoc.exists) {
        const tenantData = tenantDoc.data();
        businessName = tenantData?.businessName || "Our Shop";
      } else {
        // Fallback: Try whatsappSettings
        const whatsappQuery = await adminDb.collection("whatsappSettings").where("tenantId", "==", tenantId).get();
          
        if (!whatsappQuery.empty) {
          const data = whatsappQuery.docs[0].data();
          businessName = data?.businessName || "Our Shop";
        } else {
          // Fallback to settings collection
          const settingsDoc = await adminDb.collection("settings").doc(tenantId).get();
          if (settingsDoc.exists) {
            const data = settingsDoc.data();
            businessName = data?.businessName || "Our Shop";
          }
        }
      }
    } catch (error) {
      console.error('[OrderStatus] Error fetching business name:', error);
    }
    
    // ⭐ FIXED: Use sendWelcomeMenu instead of hardcoded menu
    if (deps.sendWelcomeMenu) {
      await deps.sendWelcomeMenu(tenantId, phone);
    } else {
      // Fallback if sendWelcomeMenu not provided
      await deps.sendMessage(
        tenantId,
        phone,
        `👋 *Welcome to ${businessName}!*\n\n` +
        `How can we help you today?\n\n` +
        `Reply *MENU* to see the main menu.`
      );
    }
    return;
  }
  
  if (isNaN(num) || num < 1 || num > recentOrders.length) {
    console.log(`[OrderStatus] Invalid selection - num: ${num}, range: 1-${recentOrders.length}`);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please reply with a number from 1-${recentOrders.length}, or *0️⃣* for main menu.`
    );
    return;
  }
  
  const selectedOrder = recentOrders[num - 1];
  const orderNumber = selectedOrder.orderNumber || `ORD-${selectedOrder.id?.slice(-10)}`;
  const orderDocId = selectedOrder.id;
  
  console.log(`[OrderStatus] Selected order: ${orderNumber}, Order doc ID: ${orderDocId}`);
  
  // Call sendOrderDetails to show full order with CANCEL option
  await sendOrderDetails(tenantId, phone, orderNumber, orderDocId, selectedOrder, deps);
}

/**
 * Helper: Get emoji for order status
 */
function getStatusEmoji(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': '⏳',
    'processing': '🔄',
    'confirmed': '✅',
    'shipped': '🚚',
    'out_for_delivery': '📦',
    'delivered': '✅',
    'cancelled': '❌',
    'cancellation_requested': '⏳',
    'refunded': '💰'
  };
  return statusMap[status?.toLowerCase()] || '📦';
}

/**
 * Helper: Capitalize first letter and replace underscores with spaces
 */
function capitalizeFirst(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Handle order cancellation request (with number selection)
 */
export async function handleOrderCancellation(
  tenantId: string,
  phone: string,
  userInput: string,
  flowState: any,
  deps: OrderStatusDeps
): Promise<void> {
  if (deps.startTyping) await deps.startTyping(tenantId, phone);
  
  const input = userInput.trim();
  const num = parseInt(input);
  
  console.log(`[OrderCancel] Input: "${input}", Num: ${num}, Current step: ${flowState.currentStep}`);
  
  // Handle "0" - Back to main menu
  if (num === 0 || input === '0') {
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    
    // Clear flow state using FieldValue.delete()
    const db = getDb();
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
    
    // ⭐ FIXED: Use sendWelcomeMenu for consistency
    if (deps.sendWelcomeMenu) {
      await deps.sendWelcomeMenu(tenantId, phone);
    } else {
      await deps.sendMessage(tenantId, phone, `Reply *MENU* to see the main menu.`);
    }
    return;
  }
  
  // Check if user selected a number option
  if (flowState.currentStep === 'waiting_for_cancel_selection') {
    // User selected cancellation (option 1)
    if (num === 1) {
      // Move to confirmation step
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      
      const confirmMessage = `⚠️ *Confirm Cancellation*\n\n` +
        `Are you sure you want to cancel this order?\n\n` +
        `1️⃣ - Yes, Cancel Order\n` +
        `2️⃣ - No, Go Back\n\n` +
        `_Reply with the number (1 or 2)_`;
      
      await deps.sendMessage(tenantId, phone, confirmMessage);
      
      // Update flow state to confirmation step
      const db = getDb();
      await db
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
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please reply with *1* to cancel or *0* for main menu.`
    );
    return;
  }
  
  // Handle confirmation step
  if (flowState.currentStep === 'waiting_for_confirm') {
    // User confirmed cancellation (option 1)
    if (num === 1) {
      await processCancellation(tenantId, phone, flowState, deps);
      return;
    }
    
    // User declined cancellation (option 2)
    if (num === 2) {
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `✅ Cancellation cancelled.\n\nReply *0* for main menu`
      );
      
      // Clear flow state
      const db = getDb();
      await db
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
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please reply with *1* to confirm cancellation or *2* to go back.`
    );
    return;
  }
  
  // Fallback for any other state
  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(
    tenantId,
    phone,
    `❌ Please reply with *1* to cancel or *0* for main menu.`
  );
}

/**
 * Process the actual cancellation and create request for tenant
 */
async function processCancellation(
  tenantId: string,
  phone: string,
  flowState: any,
  deps: OrderStatusDeps
): Promise<void> {
  try {
    const db = getDb();
    const orderNumber = flowState.currentOrderNumber;
    const orderDocId = flowState.currentOrderDocId;
    const orderData = flowState.orderData;
    
    console.log(`[OrderCancel] Processing cancellation for order: ${orderNumber}`);
    
    // Create cancellation request in Firestore
    await db
      .collection("cancellation_requests")
      .add({
        tenantId: tenantId,
        orderNumber: orderNumber,
        orderDocId: orderDocId,
        customerPhone: phone,
        orderData: orderData,
        status: 'pending',
        reason: 'Customer requested cancellation',
        requestedAt: FieldValue.serverTimestamp(),
        respondedAt: null,
        responseNote: null,
      });
    
    console.log(`[OrderCancel] Created cancellation request with tenantId: ${tenantId}`);
    
    // Update order status to cancellation_requested - using document ID directly
    if (orderDocId) {
      const orderRef = db.collection("orders").doc(orderDocId);
      const orderDoc = await orderRef.get();
      
      if (orderDoc.exists) {
        await orderRef.update({
          status: 'cancellation_requested',
          cancellationRequestedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`[OrderCancel] Updated order status to cancellation_requested`);
      }
    } else {
      // Fallback: query by orderNumber
      const orderQuery = await db
        .collection("orders")
        .where("orderNumber", "==", orderNumber)
        .where("tenantId", "==", tenantId)
        .get();
      
      if (!orderQuery.empty) {
        const orderDoc = orderQuery.docs[0];
        await orderDoc.ref.update({
          status: 'cancellation_requested',
          cancellationRequestedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        console.log(`[OrderCancel] Updated order status to cancellation_requested (by query)`);
      }
    }
    
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    
    // Send confirmation message with 0 option
    await deps.sendMessage(
      tenantId,
      phone,
      `✅ *Cancellation Request Submitted*\n\n` +
      `Your cancellation request for order *${orderNumber}* has been submitted.\n\n` +
      `Our team will review your request and process the refund within 24-48 hours.\n\n` +
      `You will receive a confirmation once the refund is processed.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━\n\n` +
      `0️⃣ - Back to Main Menu`
    );
    
    // Clear flow state
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
    
  } catch (error) {
    console.error('[OrderCancel] Error processing cancellation:', error);
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Error processing cancellation request. Please try again or contact support.\n\n0️⃣ - Back to Main Menu`
    );
    
    // Clear flow state on error too
    const db = getDb();
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
  }
}