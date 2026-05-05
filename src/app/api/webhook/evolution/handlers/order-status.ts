/**
 * Order Status Handler
 * Handles checking order status via WhatsApp
 * Orders are stored with phone number for cross-device access
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
    await showRecentOrders(tenantId, phone, deps, currentPage + 1);
    return;
  }
  
  // If user types an order number (starts with ORD- or looks like order ID)
  if (input.startsWith('ORD-') || input.match(/^\d{10,}$/)) {
    const orderId = input.startsWith('ORD-') ? input : `ORD-${input}`;
    await lookupOrderById(tenantId, phone, orderId, deps);
    return;
  }
  
  // Otherwise, show recent orders again (refresh)
  await showRecentOrders(tenantId, phone, deps);
}

/**
 * Look up a specific order by ID
 */
async function lookupOrderById(
  tenantId: string,
  phone: string,
  orderId: string,
  deps: OrderStatusDeps
): Promise<void> {
  try {
    console.log(`[OrderStatus] Looking up order: ${orderId} for phone: ${phone}`);
    
    const db = getDb();
    const orderDoc = await db
      .collection("orders")
      .where("orderId", "==", orderId)
      .where("tenantId", "==", tenantId)
      .get();
    
    if (orderDoc.empty) {
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `❌ Order *${orderId}* not found.\n\n` +
        `Please check the order number and try again.\n\n` +
        `💡 Type *RECENT* to see your recent orders, or *0️⃣* for main menu`
      );
      return;
    }
    
    const orderData = orderDoc.docs[0].data();
    const actualOrderId = orderData.orderId || orderData.orderNumber || orderId;
    await sendOrderDetails(tenantId, phone, actualOrderId, orderData, deps);
    
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
  page: number = 1
): Promise<void> {
  try {
    console.log(`[OrderStatus] Fetching orders for phone: ${phone}, page: ${page}`);
    
    const db = getDb();
    const ORDERS_PER_PAGE = 5;
    
    // Get total count first
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
        `Reply *1* to browse products or *0️* for main menu`
      );
      return;
    }
    
    // Calculate offset
    const offset = (page - 1) * ORDERS_PER_PAGE;
    
    // Get paginated orders
    const ordersSnap = await db
      .collection("orders")
      .where("customerPhone", "==", phone)
      .where("tenantId", "==", tenantId)
      .orderBy("createdAt", "desc")
      .limit(ORDERS_PER_PAGE)
      .get();
    
    let message = `📦 *Your Orders (Page ${page})*\n\n`;
    
    ordersSnap.docs.forEach((doc, idx) => {
      const order = doc.data();
      
      const orderId = order.orderId || order.orderNumber || doc.id;
      const statusEmoji = getStatusEmoji(order.status);
      const date = order.createdAt?.toDate 
        ? order.createdAt.toDate().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        : 'N/A';
      
      message += `${idx + 1}️ *${orderId}*\n`;
      message += `    ${date}\n`;
      
      // Show product details if available
      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          const productName = item.name || item.productName || 'Product';
          const variant = item.variant || item.selectedOptions || '';
          const quantity = item.quantity || 1;
          
          message += `    ${productName}`;
          if (variant) message += ` (${variant})`;
          message += ` x${quantity}\n`;
        });
      }
      
      message += `   💰 KES ${order.total?.toLocaleString() || 0}\n`;
      message += `   📊 Status: ${statusEmoji} ${capitalizeFirst(order.status)}\n\n`;
    });
    
    // Pagination info
    const startNum = offset + 1;
    const endNum = Math.min(offset + ORDERS_PER_PAGE, totalOrders);
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
    const recentOrdersList = ordersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: data.orderId || data.orderNumber || doc.id,
        orderNumber: data.orderNumber || data.orderId || doc.id,
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
  orderId: string,
  orderData: any,
  deps: OrderStatusDeps
): Promise<void> {
  const statusEmoji = getStatusEmoji(orderData.status);
  const date = orderData.createdAt?.toDate 
    ? orderData.createdAt.toDate().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    : 'N/A';
  
  let message = `✅ *Order Found!*\n\n`;
  message += `📦 Order: *${orderId}*\n`;
  message += `📅 Date: ${date}\n`;
  message += `💰 Total: KES ${orderData.total?.toLocaleString() || 0}\n`;
  message += `📊 Status: ${statusEmoji} *${capitalizeFirst(orderData.status)}*\n\n`;
  
  // Items with full details
  if (orderData.items && orderData.items.length > 0) {
    message += `📋 *Order Items:*\n`;
    orderData.items.forEach((item: any, idx: number) => {
      const itemName = item.name || item.productName || 'Product';
      const quantity = item.quantity || 1;
      const itemPrice = item.price || 0;
      const itemTotal = itemPrice * quantity;
      const variant = item.variant || item.selectedOptions || '';
      const productCode = item.productCode || item.sku || '';
      
      message += `*${idx + 1}. ${itemName}*\n`;
      if (productCode) message += `   SKU: ${productCode}\n`;
      if (variant) message += `   Options: ${variant}\n`;
      message += `   Quantity: ${quantity}\n`;
      message += `   Price: KES ${itemPrice.toLocaleString()} each\n`;
      message += `   Subtotal: KES ${itemTotal.toLocaleString()}\n\n`;
    });
    message += `━━━━━━━━━━━━━━━\n\n`;
  }
  
  // Shipping address
  if (orderData.shippingAddress) {
    const addr = orderData.shippingAddress;
    message += `📍 *Delivery Address:*\n`;
    if (addr.fullName) message += `${addr.fullName}\n`;
    if (addr.phone) message += `📱 ${addr.phone}\n`;
    if (addr.city || addr.town) message += `${addr.city || addr.town}`;
    if (addr.area) message += `, ${addr.area}`;
    if (addr.city || addr.town || addr.area) message += `\n`;
    if (addr.postalCode) message += `Postal Code: ${addr.postalCode}\n`;
    message += `\n`;
  }
  
  // Tracking info
  if (orderData.trackingNumber) {
    message += `🚚 *Tracking Number:* ${orderData.trackingNumber}\n`;
  }
  
  if (orderData.estimatedDelivery) {
    const deliveryDate = orderData.estimatedDelivery?.toDate
      ? orderData.estimatedDelivery.toDate().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      : 'N/A';
    message += `📅 *Expected Delivery:* ${deliveryDate}\n`;
  }
  
  // Payment info
  if (orderData.paymentMethod) {
    message += ` *Payment Method:* ${capitalizeFirst(orderData.paymentMethod)}\n`;
  }
  
  if (orderData.paymentStatus) {
    message += `💰 *Payment Status:* ${capitalizeFirst(orderData.paymentStatus)}\n`;
  }
  
  message += `\n━━━━━━━━━━━━━━━\n`;
  
  // Only show cancel option for orders that can be cancelled
  const cancellableStatuses = ['pending', 'processing', 'confirmed'];
  const canCancel = cancellableStatuses.includes(orderData.status?.toLowerCase());
  
  if (canCancel) {
    message += `1️⃣ - Request Cancellation & Refund\n`;
  }
  
  message += `0️⃣ - Back to Main Menu`;

  // Add note about typing the number
  if (canCancel) {
    message += `\n\n_Reply with the number (1 or 0)_`;
  }
  
  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);
  
  // Store flow state for cancellation option (only if order can be cancelled)
  const db = getDb();
  
  if (canCancel) {
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          flowName: 'order_cancellation',
          currentStep: 'waiting_for_cancel_selection',
          currentOrderId: orderId,
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
  console.log(`[OrderStatus] Flow state:`, JSON.stringify(flowState, null, 2));
  
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
  const orderId = selectedOrder.orderId || selectedOrder.orderNumber || selectedOrder.id;
  
  console.log(`[OrderStatus] Selected order: ${orderId}, Order data:`, JSON.stringify(selectedOrder, null, 2));
  
  // Call sendOrderDetails to show full order with CANCEL option
  await sendOrderDetails(tenantId, phone, orderId, selectedOrder, deps);
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
    
    // User selected back to menu (option 0)
    if (num === 0) {
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, `✅ Returning to main menu.\n\nReply *MENU* to see options.`);
      
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
    const orderId = flowState.currentOrderId;
    const orderData = flowState.orderData;
    
    console.log(`[OrderCancel] Processing cancellation for order: ${orderId}`);
    
    // Create cancellation request in Firestore
    await db
      .collection("cancellation_requests")
      .add({
        tenantId,
        orderId,
        customerPhone: phone,
        orderData,
        status: 'pending', // pending, approved, rejected
        reason: 'Customer requested cancellation',
        requestedAt: FieldValue.serverTimestamp(),
        respondedAt: null,
        responseNote: null,
      });
    
    // Update order status to cancellation_requested
    const orderQuery = await db
      .collection("orders")
      .where("orderId", "==", orderId)
      .where("tenantId", "==", tenantId)
      .get();
    
    if (!orderQuery.empty) {
      const orderDoc = orderQuery.docs[0];
      await orderDoc.ref.update({
        status: 'cancellation_requested',
        cancellationRequestedAt: FieldValue.serverTimestamp(),
      });
    }
    
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `✅ *Cancellation Request Submitted*\n\n` +
      `Your cancellation request for order *${orderId}* has been submitted.\n\n` +
      `Our team will review your request and process the refund within 24-48 hours.\n\n` +
      `You will receive a confirmation once the refund is processed.\n\n` +
      `Reply *0* for main menu`
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
      `❌ Error processing cancellation request. Please try again or contact support.\n\nReply *0* for main menu`
    );
  }
}