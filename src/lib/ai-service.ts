import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AIContext {
  businessName: string;
  products: Array<{
    id: string;
    name: string;
    price: number;
    category?: string;
    categoryName?: string;
    stock?: number;
    description?: string;
    images?: string[];
    orderLink?: string;
  }>;
  services: Array<{
    id: string;
    name: string;
    priceMin: number;
    priceMax?: number;
    businessType?: string;
    businessCategory?: string;
    serviceName?: string;
    duration?: string;
    description?: string;
  }>;
  recentOrders?: Array<{
    id: string;
    customerPhone: string;
    status: string;
    total: number;
  }>;
  
  // Business Profile
  businessProfile?: {
    tagline?: string;
    description?: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    website?: string;
    address?: string;
    city?: string;
    country?: string;
    businessHours?: any;
    socialMedia?: any;
  };
  
  // Shipping Methods
  shippingMethods?: Array<{
    id: string;
    name: string;
    price: number;
    estimatedDays?: string;
    description?: string;
  }>;
  
  // Payment Methods
  paymentMethods?: {
    mpesa?: { enabled: boolean; phoneNumber?: string; businessName?: string; paybillNumber?: string };
    bank?: { enabled: boolean; bankName?: string; accountNumber?: string };
    card?: { enabled: boolean; provider?: string; instructions?: string };
    cash?: { enabled: boolean; instructions?: string };
  };
  
  // Product Settings
  productSettings?: {
    enabled: boolean;
    storeDescription?: string;
    returnPolicy?: string;
    warrantyInfo?: string;
  };
  
  // Service Settings
  serviceSettings?: {
    enabled: boolean;
    serviceDescription?: string;
    bookingPolicy?: string;
    cancellationPolicy?: string;
  };
}

export async function generateAIResponse(
  message: string,
  context: AIContext,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build system prompt with business context
    const systemPrompt = buildSystemPrompt(context);

    // Filter empty messages and ensure history starts with 'user'
    let historyMessages = conversationHistory
      .filter(msg => msg.content && msg.content.trim() !== "")
      .map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

    // Drop leading model messages until we hit a user message
    while (historyMessages.length > 0 && historyMessages[0].role !== "user") {
      historyMessages = historyMessages.slice(1);
    }

    // Start chat with history AND system instruction
    const chat = model.startChat({
      history: historyMessages,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
      systemInstruction: {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    });

    // Send user message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error("[AI] Full error:", JSON.stringify(error, null, 2));
    console.error("[AI] GEMINI_API_KEY set:", !!process.env.GEMINI_API_KEY);
    throw error; // Rethrow so webhook-logger catches it
  }
}

function buildSystemPrompt(context: AIContext): string {
  const productsList = context.products
    .map(p => {
      const stockStatus = p.stock && p.stock > 0 ? `(${p.stock} in stock)` : "(Out of stock)";
      return `- ${p.name}: KES ${p.price.toLocaleString()} ${stockStatus}${p.categoryName ? ` [${p.categoryName}]` : ""}`;
    })
    .join("\n");

  const servicesList = context.services
    .map(s => {
      const priceRange = s.priceMax && s.priceMax > s.priceMin 
        ? `KES ${s.priceMin.toLocaleString()} - ${s.priceMax.toLocaleString()}`
        : `KES ${s.priceMin.toLocaleString()}`;
      return `- ${s.name}: ${priceRange}${s.duration ? ` (${s.duration})` : ""}${s.businessCategory ? ` [${s.businessCategory}]` : ""}`;
    })
    .join("\n");
  
  // NEW: Build shipping methods section
  const shippingSection = context.shippingMethods && context.shippingMethods.length > 0
    ? `\n\nSHIPPING OPTIONS:\n${context.shippingMethods.map(s => 
        `- ${s.name}: KES ${s.price.toLocaleString()} (${s.estimatedDays || 'N/A'})${s.description ? ` - ${s.description}` : ''}`
      ).join('\n')}`
    : '';
  
  // NEW: Build payment methods section
  const paymentMethods = context.paymentMethods;
  const paymentSection = paymentMethods ? `\n\nPAYMENT METHODS:\n${
    [
      paymentMethods.mpesa?.enabled ? `📱 M-Pesa: Pay to ${paymentMethods.mpesa.phoneNumber || 'N/A'}${paymentMethods.mpesa.businessName ? ` (${paymentMethods.mpesa.businessName})` : ''}` : null,
      paymentMethods.bank?.enabled ? `🏦 Bank Transfer: ${paymentMethods.bank.bankName || 'N/A'}, Account: ${paymentMethods.bank.accountNumber || 'N/A'}` : null,
      paymentMethods.card?.enabled ? `💳 Card Payment: ${paymentMethods.card.provider || 'Card'}${paymentMethods.card.instructions ? ` - ${paymentMethods.card.instructions}` : ''}` : null,
      paymentMethods.cash?.enabled ? `💵 Cash: ${paymentMethods.cash.instructions || 'Pay on delivery'}` : null,
    ].filter(Boolean).join('\n')
  }` : '';
  
  // NEW: Build policies section
  const policiesSection = `\n\nBUSINESS POLICIES:\n${
    [
      context.productSettings?.returnPolicy ? `Returns: ${context.productSettings.returnPolicy}` : null,
      context.productSettings?.warrantyInfo ? `Warranty: ${context.productSettings.warrantyInfo}` : null,
      context.serviceSettings?.bookingPolicy ? `Booking Policy: ${context.serviceSettings.bookingPolicy}` : null,
      context.serviceSettings?.cancellationPolicy ? `Cancellation: ${context.serviceSettings.cancellationPolicy}` : null,
    ].filter(Boolean).join('\n') || 'Contact us for policy details'
  }`;
  
  // NEW: Business info section
  const businessInfo = context.businessProfile ? `\n\nBUSINESS INFORMATION:\n${
    [
      context.businessProfile.tagline ? `Tagline: ${context.businessProfile.tagline}` : null,
      context.businessProfile.description ? `About: ${context.businessProfile.description}` : null,
      context.businessProfile.email ? `Email: ${context.businessProfile.email}` : null,
      context.businessProfile.phone ? `Phone: ${context.businessProfile.phone}` : null,
      context.businessProfile.website ? `Website: ${context.businessProfile.website}` : null,
      context.businessProfile.address ? `Address: ${context.businessProfile.address}${context.businessProfile.city ? `, ${context.businessProfile.city}` : ''}${context.businessProfile.country ? `, ${context.businessProfile.country}` : ''}` : null,
    ].filter(Boolean).join('\n')
  }` : '';

  return `You are a friendly and helpful AI assistant for ${context.businessName}, a business using WhatsApp for customer service.

YOUR ROLE:
- Answer customer questions about products, services, and business information
- Help customers place orders with correct pricing and shipping
- Provide payment instructions when customers want to pay
- Share business hours, location, and contact information
- Explain return policies, warranties, and booking policies
- Be professional, friendly, and concise
- Use emojis sparingly to make messages engaging

AVAILABLE PRODUCTS:
${productsList || "No products currently available"}

AVAILABLE SERVICES:
${servicesList || "No services currently available"}${shippingSection}${paymentSection}${policiesSection}${businessInfo}

IMPORTANT RULES:
1. ONLY recommend products/services that are IN STOCK (stock > 0)
2. Always include prices when mentioning products/services
3. When customers ask about delivery, ALWAYS mention available shipping methods with prices
4. When customers want to pay, provide the correct payment method details (M-Pesa number, bank account, etc.)
5. If asked about returns or warranties, quote the exact policy from BUSINESS POLICIES
6. If asked about business hours or location, provide info from BUSINESS INFORMATION
7. Keep responses concise (WhatsApp-friendly, max 3-4 short paragraphs)
8. Use bullet points for lists
9. Never make up products, prices, shipping costs, or payment details - only use what's provided above
10. If you don't know something, ask the customer to clarify or say "Let me check with our team"

RESPONSE FORMAT:
- Start with a friendly greeting if it's a new conversation
- Use short paragraphs (2-3 sentences max)
- Include relevant emojis (1-2 per message)
- End with a question or next step

EXAMPLE RESPONSES:

Customer: "Do you have iPhone?"
You: "Yes! We have these iPhones available:\n\n📱 iPhone 15 - KES 120,000 (10 in stock)\n📱 iPhone 15 Pro - KES 150,000 (5 in stock)\n\nWhich one interests you? I can share more details! 😊"

Customer: "How much is delivery?"
You: "We offer several shipping options:\n\n🚚 Standard Delivery - KES 200 (2-3 days)\n⚡ Express Delivery - KES 500 (Same day)\n📦 Pickup - FREE (Same day)\n\nWhich works best for you? 📍"

Customer: "How can I pay?"
You: "We accept multiple payment methods:\n\n📱 M-Pesa: Pay to 254712345678 (Your Business Name)\n🏦 Bank Transfer: KCB Bank, Account: 1234567890\n💵 Cash: Pay on delivery\n\nWhich method do you prefer? 💳"

Customer: "What's your return policy?"
You: "Our return policy:\n\n🔄 Returns: Items can be returned within 7 days of delivery\n✅ Warranty: 1-year warranty on all electronics\n\nNeed help with a return? Just let us know! 😊"`;
}

export async function detectIntent(message: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this customer message and classify the intent. Return ONLY one of these categories:
- greeting
- product_inquiry
- service_inquiry
- pricing
- order_placement
- order_status
- complaint
- general_question
- farewell

Message: "${message}"

Intent:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim().toLowerCase();
  } catch (error) {
    console.error("[AI] Error detecting intent:", error);
    return "general_question";
  }
}
