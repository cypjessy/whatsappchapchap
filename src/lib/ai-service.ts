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
    salePrice?: number;
    category?: string;
    categoryName?: string;
    stock?: number;
    description?: string;
    images?: string[];
    imageUrl?: string;
    image?: string;
    brand?: string;
    condition?: string;
    colors?: string[];
    sizes?: string[];
    sku?: string;
    warranty?: string;
    orderLink?: string;
    productPaymentMethods?: Array<{ id: string; name: string; details: string }>;
    productShippingMethods?: Array<{ id: string; name: string; price: number }>;
    variants?: Array<{
      id: string;
      specs: Record<string, string>;
      sku: string;
      price: number;
      stock: number;
    }>;
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
  context: AIContext
  // NOTE: Conversation history removed to prevent flow confusion
  // Order flow uses deterministic state management instead
): Promise<string> {
  try {
    // Build system prompt with business context
    const systemPrompt = buildSystemPrompt(context);

    // Build messages array for Groq (NO conversation history)
    const messages: Array<{ role: "system" | "user"; content: string }> = [
      { role: "system", content: systemPrompt },
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
      const priceInfo = p.salePrice 
        ? `KES ${p.salePrice.toLocaleString()} (was KES ${p.price.toLocaleString()})` 
        : `KES ${p.price.toLocaleString()}`;
      const colors = p.colors && p.colors.length > 0 ? `\n  Colors: ${p.colors.join(', ')}` : '';
      const sizes = p.sizes && p.sizes.length > 0 ? `\n  Sizes: ${p.sizes.join(', ')}` : '';
      const brand = p.brand ? `\n  Brand: ${p.brand}` : '';
      const condition = p.condition ? `\n  Condition: ${p.condition}` : '';
      const description = p.description ? `\n  About: ${p.description.substring(0, 100)}${p.description.length > 100 ? '...' : ''}` : '';
      const orderLink = p.orderLink 
        ? `\n  🛒 Order Link: ${p.orderLink}` 
        : '';
      const imageInfo = p.images && p.images.length > 0 
        ? `\n  Images: ${p.images.slice(0, 2).join(', ')}${p.images.length > 2 ? ` (+${p.images.length - 2} more)` : ''}` 
        : p.image ? `\n  Image: ${p.image}` : '';
      const payment = p.productPaymentMethods && p.productPaymentMethods.length > 0
        ? `\n  Payment: ${p.productPaymentMethods.map((m: any) => `${m.name} - ${m.details}`).join(' | ')}`
        : '';
      const shipping = p.productShippingMethods && p.productShippingMethods.length > 0
        ? `\n  Shipping: ${p.productShippingMethods.map((s: any) => `${s.name} KES ${s.price}`).join(' | ')}`
        : '';
      const variants = p.variants && p.variants.length > 0
        ? `\n  Variants: ${p.variants.map((v: any) => {
            const specText = Object.entries(v.specs).map(([key, val]) => `${key}: ${val}`).join(', ');
            return `${specText} (KES ${v.price.toLocaleString()}, ${v.stock} in stock)`;
          }).join(' | ')}`
        : '';

      return `- ${p.name}: ${priceInfo} ${stockStatus}${brand}${condition}${colors}${sizes}${description}${variants}${payment}${shipping}${orderLink}${imageInfo}`;
    })
    .join("\n\n");

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
   - Send 3-5 products from that category at a time
   - FOR EACH PRODUCT, include ALL available details:
     * Product name
     * Price (and sale price if on sale)
     * Stock count
     * Colors (if available)
     * Sizes (if available)
     * Brand (if available)
     * Condition (if available)
     * Description (brief)
     * Available variants with specs, prices, and stock
     * Payment methods (if product has specific payment options)
     * Shipping methods (if product has specific shipping options)
   - IMPORTANT: Do NOT include image tags or URLs in your response. Images will be sent automatically.
   - Just describe the products in text with all details.
   - Tell them "We have X more [category] products. Reply 'show more' to see them"
3. WHEN THEY ASK FOR MORE:
   - Send the next 3-5 products with full details
   - Repeat until all products are shown
4. Always mention stock status and prices
5. Ask which product they're interested in after showing products
6. NEVER skip product details - always show colors, sizes, brand if available
7. Include payment and shipping info if product has specific options

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
11. ALWAYS include the order link when showing a product using exactly this format:
    🛒 *Order here:* https://orderlink-url
12. The order link for each product is provided in the product data above
13. When a product has VARIANTS, display them clearly:
    - List each variant with its specifications (size, color, etc.)
    - Show the variant's specific price and stock
    - Use this format: "Size: M, Color: Black (KES 2,000, 25 in stock)"
    - Separate multiple variants with | or list them on separate lines
14. Help customers choose the right variant by asking which specifications they prefer

RESPONSE FORMAT (CRITICAL FOR WHATSAPP):

MESSAGE STRUCTURE RULES:
1. Use clear visual hierarchy with proper spacing
2. Add blank lines between sections ( NEVER clump text together)
3. Use emojis as visual markers (1-2 per section, not per line)
4. Keep each product/service in its own visual block
5. Use consistent formatting throughout

FORMATTING GUIDELINES:

For Categories:
- Use emoji + category name + count
- One category per line
- Add blank line before asking question
Example:
 Dresses (15 products)
👟 Shoes (8 products)
👜 Bags (12 products)
👕 T-Shirts (20 products)

Which category interests you? I'll show you what's available! 😊

For Products:
- Number each product with emoji (1️⃣, 2️⃣, 3️⃣)
- Product name on its own line
- Price and stock on next line
- Details (colors, sizes, brand) on separate lines
- If product has variants, list them after details
- ALWAYS include order link if product has one
- ALWAYS leave blank line between products
- Description should be brief (1 sentence max)
Example:
1️⃣ Floral Summer Dress
KES 2,500 (5 in stock)
Brand: FashionHub
Colors: Red, Blue, Yellow
Sizes: S, M, L, XL
About: Beautiful floral pattern perfect for summer occasions

Available variants:
• Size: M, Color: Black (KES 2,000, 25 in stock)
• Size: M, Color: Red (KES 2,000, 25 in stock)
• Size: L, Color: Black (KES 2,000, 25 in stock)

 *Order here:* https://shop.example.com/order/abc123

For General Messages:
- Greeting on its own line
- Main content with clear sections
- Use bullet points (• or -) for lists
- Always end with a question or call-to-action
- Add spacing before the closing question

SPACING RULES (VERY IMPORTANT):
- NEVER put two products/services on the same line
- ALWAYS add blank line between different products
- Use blank line to separate intro from content
- Use blank line before closing question
- Maximum 2 consecutive lines without blank line

EMOJI USAGE:
- Use emojis as section headers, not inline
- 1-2 emojis per section maximum
- Place emojis at start of line for visual structure
- Don't overuse - keep it professional

WhatsApp Formatting:
- Use *text* for bold (product names, prices)
- Use _text_ for italics (descriptions)
- Use ~text~ for strikethrough (original prices on sale)
- Don't use markdown in plain text fields

EXAMPLES OF GOOD FORMATTING:

Categories:
We have several product categories:

 Dresses (15 products)
👟 Shoes (8 products)
👜 Bags (12 products)
👕 T-Shirts (20 products)

Which category interests you? I'll show you what's available! 😊

Products:
Here are our dresses:

1️⃣ Floral Summer Dress
KES 2,500 (5 in stock)
Brand: FashionHub
Colors: Red, Blue, Yellow
Sizes: S, M, L, XL
About: Beautiful floral pattern perfect for summer occasions

2️ Evening Gown
KES 8,000 (2 in stock)
Brand: Elegance
Colors: Black, Gold
Sizes: M, L
About: Elegant evening wear for special events

3️⃣ Casual Midi Dress
KES 1,800 (8 in stock)
Brand: ComfortWear
Colors: White, Pink
Sizes: S, M, L
About: Comfortable everyday midi dress
🛒 *Order here:* https://shop.example.com/order/xyz789

We have 12 more dresses! Reply 'show more' to see them.

Which one catches your eye? 👗

Services:
Here are our available services:

💇 Hair Styling
KES 1,500 - 3,000
Duration: 1-2 hours
Category: Beauty & Hair

 Makeup Artistry
KES 3,000 - 5,000
Duration: 2-3 hours
Category: Beauty & Hair

Which service would you like to book? I can check availability for you! 

Shipping Options:
We offer several delivery options:

🚚 Standard Delivery
KES 200
Estimated: 2-3 days

⚡ Express Delivery
KES 500
Estimated: Same day

 Store Pickup
FREE
Estimated: Same day

Which works best for you? 📍

Payment Methods:
We accept multiple payment methods:

📱 M-Pesa
Pay to: 254712345678
Business Name: Your Shop

 Bank Transfer
Bank: KCB Bank
Account: 1234567890

💵 Cash on Delivery
Pay when you receive your order

Which method do you prefer? 💳

EXAMPLE RESPONSES:

Customer: "What products do you have?"
You: "We have several product categories:\n\n👗 Dresses (15 products)\n👟 Shoes (8 products)\n👜 Bags (12 products)\n👕 T-Shirts (20 products)\n\nWhich category interests you? I'll show you what's available! 😊"

Customer: "Show me dresses"
You: "Here are our dresses:\n\n1️⃣ Floral Summer Dress\nKES 2,500 (5 in stock)\nBrand: FashionHub\nColors: Red, Blue, Yellow\nSizes: S, M, L, XL\nAbout: Beautiful floral pattern perfect for summer occasions\n\n2️ Evening Gown\nKES 8,000 (2 in stock)\nBrand: Elegance\nColors: Black, Gold\nSizes: M, L\nAbout: Elegant evening wear for special events\n\n3️⃣ Casual Midi Dress\nKES 1,800 (8 in stock)\nBrand: ComfortWear\nColors: White, Pink\nSizes: S, M, L\nAbout: Comfortable everyday midi dress\n\nWe have 12 more dresses! Reply 'show more' to see them. Which one catches your eye? 👗"

Customer: "show more"
You: "Here are more dresses:\n\n4️⃣ Maxi Dress\nKES 3,200 (3 in stock)\nBrand: StyleCo\nColors: Blue, Green\nSizes: M, L, XL\nAbout: Flowing maxi dress for casual wear\n\n5️⃣ Wrap Dress\nKES 2,800 (6 in stock)\nBrand: FashionHub\nColors: Red, Black\nSizes: S, M, L\nAbout: Flattering wrap style dress\n\n6️⃣ Bodycon Dress\nKES 2,200 (4 in stock)\nBrand: TrendyWear\nColors: White, Beige\nSizes: XS, S, M\nAbout: Form-fitting bodycon dress\n\nWe have 9 more! Reply 'show more' again. Interested in any of these? 😊"

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
