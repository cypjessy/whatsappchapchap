export const getOrderStatusMessage = (
  status: string,
  customerName: string,
  orderId: string,
  productName: string,
  deliveryAddress?: string
) => {
  const trackingUrl = `https://whatsappchapchap.vercel.app/track?order=${orderId}`;

  const messages: Record<string, string> = {
    confirmed: `✅ Order Confirmed!\n\nHi ${customerName}! Your order has been confirmed.\n\nOrder: ${productName}\nOrder ID: ${orderId}\n\nWe will prepare your order shortly!`,
    
    processing: `🔄 Order Processing!\n\nHi ${customerName}! Your order is being prepared.\n\nOrder: ${productName}\nOrder ID: ${orderId}\n\nWe will notify you when it ships!`,
    
    shipped: `🚚 Order Shipped!\n\nHi ${customerName}! Your order is on the way!\n\nOrder: ${productName}\nOrder ID: ${orderId}\nDelivery to: ${deliveryAddress || ''}\n\nTrack here: ${trackingUrl}`,
    
    delivered: `🎉 Order Delivered!\n\nHi ${customerName}! Your order has been delivered.\n\nOrder: ${productName}\nOrder ID: ${orderId}\n\nThank you for shopping with us! 😊`,
    
    cancelled: `❌ Order Cancelled\n\nHi ${customerName}, your order has been cancelled.\n\nOrder: ${productName}\nOrder ID: ${orderId}\n\nContact us if you have questions.`,
    
    refunded: `💰 Refund Processed\n\nHi ${customerName}, your refund has been processed.\n\nOrder: ${productName}\nOrder ID: ${orderId}\n\nAllow 3-5 business days to reflect.`
  };

  return messages[status] || `📦 Order Update\n\nHi ${customerName}! Your order #${orderId} status: ${status}`;
};

export const getShipmentMessage = (
  customerName: string,
  orderId: string,
  productName: string,
  shippingMethod: string,
  trackingNumber: string
) => {
  const trackingUrl = `https://whatsappchapchap.vercel.app/track?order=${trackingNumber}`;
  
  return `📦 Great News!\n\nHi ${customerName}! Your order has been shipped!\n\nOrder: ${productName}\nOrder ID: ${orderId}\nShipping: ${shippingMethod}\nTracking: ${trackingNumber}\n\nTrack your order: ${trackingUrl}\n\nWe'll notify you when it arrives!`;
};