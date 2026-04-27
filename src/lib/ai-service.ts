import Groq from "groq-sdk";

// Initialize Groq
const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY || "",
});

console.log("[AI Service] Initializing with Groq API key:", process.env.GROQ_API_KEY ? "✓ Present" : "✗ Missing");

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
  // NEW: Product categories for browsing
  productCategories?: Array<{
    id: string;
    name: string;
    icon?: string;
    productCount: number;
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
    // Build system prompt with business context
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array for Groq
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...conversationHistory
        .filter(msg => msg.content && msg.content.trim() !== "")
        .map((msg): { role: "user" | "assistant"; content: string } => ({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content
        })),
      { role: "user", content: message }
    ];

    // Call Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
      top_p: 0.8,
    });

    const response = chatCompletion.choices[0]?.message?.content || "";
    return response.trim();
  } catch (error) {
    console.error("[AI] Full error:", JSON.stringify(error, null, 2));
    console.error("[AI] GROQ_API_KEY set:", !!process.env.GROQ_API_KEY);
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

  // NEW: Product categories section
  const categoriesSection = context.productCategories && context.productCategories.length > 0
    ? `\n\nPRODUCT CATEGORIES:\n${context.productCategories.map(c => 
        `- ${c.name} (${c.productCount} products)`
      ).join('\n')}`
    : '';

  return `You are a friendly and helpful AI assistant for ${context.businessName}, a business using WhatsApp for customer service.

YOUR ROLE:
- Answer customer questions about products, services, and business information
- Help customers place orders with correct pricing and shipping
- Provide payment instructions when customers want to pay
- Share business hours, location, and contact information
- Explain return policies, warranties, and booking policies
- Be professional, friendly, and concise
- Use emojis sparingly to make messages engaging

PRODUCT BROWSING FLOW (IMPORTANT):
When customers ask about products or want to see what you have:
1. FIRST: Show them the PRODUCT CATEGORIES list and ask them to choose one
2. WHEN THEY CHOOSE A CATEGORY: 
   - Send 3-5 products from that category at a time (with names, prices, stock status)
   - For each product with images, include: [IMAGE:image_url|Product Name - KES price]
   - Tell them "We have X more [category] products. Reply 'show more' to see them"
3. WHEN THEY ASK FOR MORE:
   - Send the next 3-5 products
   - Repeat until all products are shown
4. Always mention stock status and prices
5. Ask which product they're interested in after showing products
6. Use the IMAGE format for products with images: [IMAGE:url|caption]

AVAILABLE PRODUCT CATEGORIES:${categoriesSection || "\nNo categories available"}

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

Customer: "What products do you have?"
You: "We have several product categories:\n\n👗 Dresses (15 products)\n👟 Shoes (8 products)\n👜 Bags (12 products)\n👕 T-Shirts (20 products)\n\nWhich category interests you? I'll show you what's available! 😊"

Customer: "Show me dresses"
You: "Here are our dresses:\n\n1️⃣ Floral Summer Dress - KES 2,500 (5 in stock)\n[IMAGE:https://example.com/dress1.jpg|Floral Summer Dress]\n\n2️⃣ Evening Gown - KES 8,000 (2 in stock)\n[IMAGE:https://example.com/dress2.jpg|Evening Gown]\n\n3️⃣ Casual Midi Dress - KES 1,800 (8 in stock)\n[IMAGE:https://example.com/dress3.jpg|Casual Midi Dress]\n\nWe have 12 more dresses! Reply 'show more' to see them. Which one catches your eye? 👗"

Customer: "show more"
You: "Here are more dresses:\n\n4️⃣ Maxi Dress - KES 3,200 (3 in stock)\n5️⃣ Wrap Dress - KES 2,800 (6 in stock)\n6️⃣ Bodycon Dress - KES 2,200 (4 in stock)\n\nWe have 9 more! Reply 'show more' again. Interested in any of these? 😊"

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

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 20,
    });

    const response = chatCompletion.choices[0]?.message?.content || "general_question";
    return response.trim().toLowerCase();
  } catch (error) {
    console.error("[AI] Error detecting intent:", error);
    return "general_question";
  }
}
