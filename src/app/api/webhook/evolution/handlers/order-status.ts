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
 * Start order status check flow
 */
export async function startOrderStatusFlow(
  tenantId: string,
  phone: string,
  deps: OrderStatusDeps
): Promise<void> {
  if (deps.startTyping) await deps.startTyping(tenantId, phone);
  
  const message = `📦 *Check Your Order Status*\n\n` +
    `Please enter your **Order Number**\n` +
    `(e.g., ORD-1234567890)\n\n` +
    `💡 Or type *RECENT* to see your last 3 orders\n\n` +
    `Reply *0* to go back to main menu`;
  
  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);
}

/**
 * Handle order status lookup
 */
export async function handleOrderStatusLookup(
  tenantId: string,
  phone: string,
  userInput: string,
  deps: OrderStatusDeps
): Promise<void> {
  if (deps.startTyping) await deps.startTyping(tenantId, phone);
  
  const input = userInput.trim().toUpperCase();
  
  // Handle "RECENT" request
  if (input === 'RECENT') {
    await showRecentOrders(tenantId, phone, deps);
    return;
  }
  
  // Handle order number lookup
  const orderId = input.startsWith('ORD-') ? input : `ORD-${input}`;
  await lookupOrderById(tenantId, phone, orderId, deps);
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
        `💡 Type *RECENT* to see your recent orders, or *0* for main menu`
      );
      return;
    }
    
    const orderData = orderDoc.docs[0].data();
    await sendOrderDetails(tenantId, phone, orderId, orderData, deps);
    
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
 * Show recent orders for the user
 */
async function showRecentOrders(
  tenantId: string,
  phone: string,
  deps: OrderStatusDeps
): Promise<void> {
  try {
    console.log(`[OrderStatus] Fetching recent orders for phone: ${phone}`);
    
    const db = getDb();
    const ordersSnap = await db
      .collection("orders")
      .where("customerPhone", "==", phone)
      .where("tenantId", "==", tenantId)
      .orderBy("createdAt", "desc")
      .limit(3)
      .get();
    
    if (ordersSnap.empty) {
      if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `📦 *No Orders Found*\n\n` +
        `You haven't placed any orders yet.\n\n` +
        `Reply *1* to browse products or *MENU* for main menu`
      );
      return;
    }
    
    let message = `📦 *Your Recent Orders*\n\n`;
    
    ordersSnap.docs.forEach((doc, idx) => {
      const order = doc.data();
      const statusEmoji = getStatusEmoji(order.status);
      const date = order.createdAt?.toDate 
        ? order.createdAt.toDate().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })
        : 'N/A';
      
      message += `${idx + 1}️⃣ *${order.orderId}*\n`;
      message += `   📅 ${date}\n`;
      message += `   💰 KES ${order.total?.toLocaleString() || 0}\n`;
      message += `   Status: ${statusEmoji} ${capitalizeFirst(order.status)}\n\n`;
    });
    
    message += `Reply with a number (1-${ordersSnap.docs.length}) to see details,\n` +
      `or *0* for main menu`;
    
    if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, message);
    
    // Store flow state for selection
    await db
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          flowName: 'order_status_selection',
          currentStep: 'waiting_for_selection',
          recentOrders: ordersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })),
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
  
  // Items
  if (orderData.items && orderData.items.length > 0) {
    message += `📋 *Items:*\n`;
    orderData.items.forEach((item: any, idx: number) => {
      const itemName = item.name || item.productName || 'Product';
      const quantity = item.quantity || 1;
      const itemPrice = item.price || 0;
      const itemTotal = itemPrice * quantity;
      message += `${idx + 1}. ${itemName} x ${quantity}\n`;
      message += `   💰 KES ${itemTotal.toLocaleString()}\n`;
    });
    message += `\n`;
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
  
  message += `\n━━━━━━━━━━━━━━━\n`;
  message += `Reply *0* for main menu`;
  
  if (deps.stopTyping) await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, message);
  
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
  
  if (isNaN(num) || num < 1 || num > recentOrders.length) {
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please reply with a number from 1-${recentOrders.length}, or *0* for main menu.`
    );
    return;
  }
  
  const selectedOrder = recentOrders[num - 1];
  await sendOrderDetails(tenantId, phone, selectedOrder.orderId, selectedOrder, deps);
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