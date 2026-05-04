export const getOrderStatusMessage = (
  status: string,
  customerName: string,
  orderId: string,
  productName: string,
  deliveryAddress?: string
) => {
  const trackingUrl = `https://whatsappchapchap.vercel.app/track?order=${orderId}`;

  const messages: Record<string, string> = {
    pending: `━━━━━━━━━━━━━━━━━━━━
📦 *ORDER RECEIVED*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

Thank you for your order! 🙏

We've successfully received your order and it's currently pending approval by our team.

📋 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}${deliveryAddress ? `\n📍 *Delivery:* ${deliveryAddress}` : ''}
━━━━━━━━━━━━━━━━━━

 *Next Steps:*
Our team will review your order and send you a confirmation shortly.

💬 Need help? Just reply to this message!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for choosing us!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    confirmed: `━━━━━━━━━━━━━━━━━━━━
✅ *ORDER CONFIRMED*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

Great news! 🎉 Your order has been *confirmed* and is now being prepared.

 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}${deliveryAddress ? `\n📍 *Delivery to:* ${deliveryAddress}` : ''}
━━━━━━━━━━━━━━━━━━

🔜 *What's Next?*
Your order is being carefully prepared and will be shipped soon. We'll notify you once it's on its way!

💬 Questions? We're here to help!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for your trust!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    processing: `━━━━━━━━━━━━━━━━━━━━
🔄 *ORDER IN PROGRESS*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

Your order is now being *prepared with care!* 👨‍🍳

📋 *ORDER STATUS*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}
📊 *Status:* Being Prepared
━━━━━━━━━━━━━━━━━━

 *Current Stage:*
✓ Order Confirmed
✓ Payment Verified
 Preparing Your Items
⊘ Ready to Ship
⊘ Out for Delivery

We'll notify you as soon as your order ships!

━━━━━━━━━━━━━━━━━━━━
✨ *We appreciate your patience!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    shipped: `━━━━━━━━━━━━━━━━━━━━
🚚 *YOUR ORDER IS ON THE WAY!*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

Exciting news!  Your order has been *shipped* and is heading to you!

📋 *SHIPMENT DETAILS*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}${deliveryAddress ? `\n📍 *Delivering to:* ${deliveryAddress}` : ''}
 *Tracking:* Available
━━━━━━━━━━━━━━━━━━

🔍 *Track Your Order:*
${trackingUrl}

 *Tip:* Save this link to check real-time updates on your delivery!

 *Estimated Delivery:*
Your order is on its way and should arrive soon. Keep an eye on your tracking link for live updates.

━━━━━━━━━━━━━━━━━━━━
✨ *Enjoy your purchase!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    delivered: `━━━━━━━━━━━━━━━━━━━━
🎉 *ORDER DELIVERED!*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

Wonderful!  Your order has been *successfully delivered!*

📋 *DELIVERY CONFIRMED*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}
✅ *Status:* Delivered
━━━━━━━━━━━━━━━━━━

📝 *Next Steps:*
• Check your package and verify everything is perfect
• Love your purchase? Share your experience with us!
• Need assistance? We're just a message away

 *We Hope You Love It!*
Thank you for choosing us! Your satisfaction is our priority.

🌟 *Rate Your Experience:*
We'd love to hear your feedback!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for shopping with us!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    cancelled: `━━━━━━━━━━━━━━━━━━━━
❌ *ORDER CANCELLED*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

We're writing to inform you that your order has been *cancelled.*

 *ORDER DETAILS*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}
 *Status:* Cancelled
━━━━━━━━━━━━━━━━━━

💭 *Need Assistance?*
If you have any questions about this cancellation or would like to place a new order, please don't hesitate to reach out.

💬 *Contact Us:*
We're here to help and happy to assist you with anything you need!

━━━━━━━━━━━━━━━━━━━━
✨ *We're here when you need us!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    refunded: `━━━━━━━━━━━━━━━━━━━━
💰 *REFUND PROCESSED*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

We're pleased to inform you that your *refund has been successfully processed.*

📋 *REFUND DETAILS*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}
💳 *Status:* Refunded
━━━━━━━━━━━━━━━━━━

⏰ *Refund Timeline:*
• *Processing:* Completed ✓
• *Bank Processing:* 3-5 business days
• *Reflects in Account:* Usually within a week

💡 *Important Note:*
The refund timeline may vary depending on your bank or payment method. If you don't see the refund after 7 business days, please contact us.

💬 *Questions?*
We're here to help if you need any assistance!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for your patience!* ✨
━━━━━━━━━━━━━━━━━━━━`
  };

  return messages[status] || `━━━━━━━━━━━━━━━━━━━━\n📦 *ORDER UPDATE*\n━━━━━━━━━━━━━━━━━━━━\n\nDear *${customerName}*,\n\nYour order status has been updated.\n\n *DETAILS*\n🔖 *Order ID:* ${orderId}\n📊 *Status:* ${status}\n\nFor more information, please contact us.\n\n━━━━━━━━━━━━━━━━━━━━\n✨ *Thank you!* ✨\n━━━━━━━━━━━━━━━━━━━━`;
};

export const getShipmentMessage = (
  customerName: string,
  orderId: string,
  productName: string,
  shippingMethod: string,
  trackingNumber: string
) => {
  const trackingUrl = `https://whatsappchapchap.vercel.app/track?order=${trackingNumber}`;
  
  return `━━━━━━━━━━━━━━━━━━━━
📦 *YOUR ORDER HAS SHIPPED!*
━━━━━━━━━━━━━━━━━━━━

Dear *${customerName}*,

Great news! Your order is now on its way to you! 

📋 *SHIPMENT DETAILS*
━━━━━━━━━━━━━━━━━━
🏷️  *Product:* ${productName}
🔖 *Order ID:* ${orderId}
🚚 *Shipping Method:* ${shippingMethod}
📊 *Tracking Number:* ${trackingNumber}
━━━━━━━━━━━━━━━━━━

🔍 *Track Your Package:*
${trackingUrl}

💡 *Pro Tip:*
Bookmark this link to receive real-time updates on your delivery!

 *What's Next?*
• Your package is now in transit
• Expect delivery updates via tracking
• We'll notify you when it arrives

📞 *Need Help?*
If you have any questions about your shipment, feel free to reach out!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for choosing us!* ✨
━━━━━━━━━━━━━━━━━━━━`;
};