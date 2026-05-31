export const getBookingStatusMessage = (
  status: string,
  clientName: string,
  bookingId: string,
  serviceName: string,
  date: string,
  time: string,
  location?: string,
  price?: string
) => {
  const trackingUrl = `https://whatsappchapchap.vercel.app/track?booking=${bookingId}`;

  const messages: Record<string, string> = {
    confirmed: `━━━━━━━━━━━━━━━━━━━━
✅ *BOOKING CONFIRMED*
━━━━━━━━━━━━━━━━━━━━

Dear *${clientName}*,

Great news!  Your booking has been *confirmed!*

📋 *BOOKING DETAILS*
━━━━━━━━━━━━━━━━━━
💼 *Service:* ${serviceName}
📅 *Date:* ${date}
 *Time:* ${time}${location ? `\n📍 *Location:* ${location}` : ''}${price ? `\n💰 *Price:* ${price}` : ''}
🔖 *Booking ID:* ${bookingId}
━━━━━━━━━━━━━━━━━━

 *What's Next?*
Please arrive 5 minutes before your scheduled time. We're excited to serve you!

💬 Questions? We're here to help!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for choosing us!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    completed: `━━━━━━━━━━━━━━━━━━━━
🎉 *BOOKING COMPLETED!*
━━━━━━━━━━━━━━━━━━━━

Dear *${clientName}*,

Wonderful!  Your appointment has been *successfully completed!*

📋 *SERVICE COMPLETED*
━━━━━━━━━━━━━━━━━━
💼 *Service:* ${serviceName}
📅 *Date:* ${date}
✅ *Status:* Completed
━━━━━━━━━━━━━━━━━━

📝 *Next Steps:*
• We hope you had a great experience!
• Love our service? Share with friends and family!
• Need assistance? We're just a message away

 *Rate Your Experience:*
We'd love to hear your feedback!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for your trust!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    cancelled: `━━━━━━━━━━━━━━━━━━━━
❌ *BOOKING CANCELLED*
━━━━━━━━━━━━━━━━━━━━

Dear *${clientName}*,

We're writing to inform you that your booking has been *cancelled.*

📋 *BOOKING DETAILS*
━━━━━━━━━━━━━━━━━━
💼 *Service:* ${serviceName}
📅 *Date:* ${date}
 *Time:* ${time}
🔖 *Booking ID:* ${bookingId}
 *Status:* Cancelled
━━━━━━━━━━━━━━━━━━

💭 *Need Assistance?*
If you'd like to reschedule or have any questions, please don't hesitate to reach out.

💬 *Contact Us:*
We're here to help and happy to assist you with booking a new appointment!

━━━━━━━━━━━━━━━━━━━━
✨ *We're here when you need us!* 
━━━━━━━━━━━━━━━━━━━━`,

    pending: `━━━━━━━━━━━━━━━━━━━━
📅 *BOOKING RECEIVED*
━━━━━━━━━━━━━━━━━━━━

Dear *${clientName}*,

Thank you for your booking! 

We've successfully received your request and it's currently pending approval.

📋 *BOOKING DETAILS*
━━━━━━━━━━━━━━━━━━
💼 *Service:* ${serviceName}
📅 *Date:* ${date}
⏰ *Time:* ${time}${location ? `\n📍 *Location:* ${location}` : ''}${price ? `\n💰 *Price:* ${price}` : ''}
🔖 *Booking ID:* ${bookingId}
━━━━━━━━━━━━━━━━━━

 *Next Steps:*
Our team will review your booking and send you a confirmation shortly.

💬 Need help? Just reply to this message!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for choosing us!* ✨
━━━━━━━━━━━━━━━━━━━━`,

    manual_booking: `━━━━━━━━━━━━━━━━━━━━
✅ *BOOKING CONFIRMED – WAITING TO SERVE YOU* ✅
━━━━━━━━━━━━━━━━━━━━

Dear *${clientName}*,

Your booking has been created and payment has been *confirmed!* 🎉

📋 *BOOKING DETAILS*
━━━━━━━━━━━━━━━━━━
💼 *Service:* ${serviceName}
📅 *Date:* ${date}
 *Time:* ${time}${location ? `\n📍 *Location:* ${location}` : ''}${price ? `\n💰 *Amount Paid:* ${price}` : ''}
🔖 *Booking ID:* ${bookingId}
━━━━━━━━━━━━━━━━━━

 *What's Next?*
We have received your payment and your booking is confirmed. We're looking forward to serving you!

📝 *Please Note:*
• Arrive 5 minutes before your scheduled time
• Bring any required documents or items
• Your booking is fully paid — no additional charges

💬 Questions? Reply to this message anytime!

━━━━━━━━━━━━━━━━━━━━
✨ *We can't wait to serve you!* ✨
━━━━━━━━━━━━━━━━━━━━`
  };

  return messages[status] || `━━━━━━━━━━━━━━━━━━━━\n *BOOKING UPDATE*\n━━━━━━━━━━━━━━━━━━━━\n\nDear *${clientName}*,\n\nYour booking status has been updated.\n\n📋 *DETAILS*\n🔖 *Booking ID:* ${bookingId}\n *Status:* ${status}\n\nFor more information, please contact us.\n\n━━━━━━━━━━━━━━━━━━━━\n✨ *Thank you!* ✨\n━━━━━━━━━━━━━━━━━━━━`;
};

export const getBookingPaymentMessage = (
  clientName: string,
  bookingId: string,
  serviceName: string,
  amount: string,
  transactionId?: string
) => {
  return `━━━━━━━━━━━━━━━━━━━━
💰 *PAYMENT RECEIVED*
━━━━━━━━━━━━━━━━━━━━

Dear *${clientName}*,

We've successfully received your payment! ✅

📋 *PAYMENT DETAILS*
━━━━━━━━━━━━━━━━━━
💼 *Service:* ${serviceName}
🔖 *Booking ID:* ${bookingId}
💳 *Amount:* ${amount}${transactionId ? `\n🧾 *Transaction ID:* ${transactionId}` : ''}
✅ *Status:* Payment Confirmed
━━━━━━━━━━━━━━━━━━

 *What's Next?*
Your booking is now fully paid and confirmed. We're looking forward to serving you!

💬 Questions? We're here to help!

━━━━━━━━━━━━━━━━━━━━
✨ *Thank you for your payment!* ✨
━━━━━━━━━━━━━━━━━━━━`;
};

export const getBookingReminderMessage = (
  clientName: string,
  bookingId: string,
  serviceName: string,
  date: string,
  time: string,
  location?: string
) => {
  return `━━━━━━━━━━━━━━━━━━━━
 *BOOKING REMINDER*
━━━━━━━━━━━━━━━━━━━━

Dear *${clientName}*,

This is a friendly reminder about your upcoming appointment! ⏰

📋 *BOOKING DETAILS*
━━━━━━━━━━━━━━━━━━
💼 *Service:* ${serviceName}
📅 *Date:* ${date}
⏰ *Time:* ${time}${location ? `\n📍 *Location:* ${location}` : ''}
🔖 *Booking ID:* ${bookingId}
━━━━━━━━━━━━━━━━━━

 *Please Note:*
• Arrive 5 minutes early
• Bring any required documents/items
• We look forward to serving you!

💬 Need to reschedule? Just reply to this message!

━━━━━━━━━━━━━━━━━━━━
✨ *See you soon!* ✨
━━━━━━━━━━━━━━━━━━━━`;
};
