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
  // NEW: Product category hierarchy for structured browsing
  productCategoryHierarchy?: Array<{
    id: string;
    name: string;
    description: string;
    subcategories: string[];
    brands: string[];
    productCount: number;
  }>;
  // NEW: Conversation flow state
  conversationFlow?: {
    step?: string;
    waitingFor?: string;
    selectedCategory?: string;
    selectedSubcategory?: string;
    selectedBrand?: string;
  };
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
    mpesa?: { 
      enabled: boolean; 
      buyGoods?: { tillNumber?: string };
      paybill?: { paybillNumber?: string };
      personal?: { phoneNumber?: string };
      businessName?: string;
    };
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
  const maxRetries = 2;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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

      // Call Groq API with lower temperature for factual accuracy
      const chatCompletion = await groq.chat.completions.create({
        messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.3, // Lower temperature for commerce bot (factual responses)
        max_tokens: 500,
        top_p: 0.8,
      });

      const response = chatCompletion.choices[0]?.message?.content || "";
      return response.trim();
    } catch (error) {
      lastError = error;
      console.error(`[AI] Attempt ${attempt}/${maxRetries} failed:`, error);
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  console.error("[AI] All attempts failed, throwing error");
  throw lastError;
}

function buildSystemPrompt(context: AIContext): string {
  const productsList = context.products
    .map(p => {
      const stockStatus = p.stock && p.stock > 0 ? `(${p.stock} in stock)` : "(Out of stock)";
      const priceInfo = p.salePrice 
        ? `KES ${(p.salePrice || 0).toLocaleString()} (was KES ${(p.price || 0).toLocaleString()})` 
        : `KES ${(p.price || 0).toLocaleString()}`;
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
            return `${specText} (KES ${(v.price || 0).toLocaleString()}, ${v.stock || 0} in stock)`;
          }).join(' | ')}`
        : '';

      return `- ${p.name}: ${priceInfo} ${stockStatus}${brand}${condition}${colors}${sizes}${description}${variants}${payment}${shipping}${orderLink}`;
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
      paymentMethods.mpesa?.enabled ? (() => {
        // Extract M-Pesa numbers from nested structure
        const tillNumber = paymentMethods.mpesa.buyGoods?.tillNumber;
        const paybillNumber = paymentMethods.mpesa.paybill?.paybillNumber;
        const phoneNumber = paymentMethods.mpesa.personal?.phoneNumber;
        const businessName = paymentMethods.mpesa.businessName;
        
        let mpesaInfo = '📱 M-Pesa: ';
        if (tillNumber) mpesaInfo += `Buy Goods Till: ${tillNumber}`;
        else if (paybillNumber) mpesaInfo += `Paybill: ${paybillNumber}`;
        else if (phoneNumber) mpesaInfo += `Send Money: ${phoneNumber}`;
        else mpesaInfo += 'Configure in settings';
        
        if (businessName) mpesaInfo += ` (${businessName})`;
        return mpesaInfo;
      })() : null,
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

  // NEW: Product category hierarchy section
  const categoryHierarchySection = context.productCategoryHierarchy && context.productCategoryHierarchy.length > 0
    ? `\n\nPRODUCT CATEGORY HIERARCHY:\n${context.productCategoryHierarchy.map(c => 
        `- ${c.name} (${c.productCount} products)\n  Subcategories: ${c.subcategories.join(', ')}\n  Brands: ${c.brands.join(', ')}`
      ).join('\n')}`
    : '';

  // Build sections array and join with consistent spacing
  const sections = [
    categoriesSection,
    categoryHierarchySection,
    shippingSection,
    paymentSection,
    policiesSection,
    businessInfo
  ].filter(Boolean);
  
  const additionalInfo = sections.length > 0 ? '\n\n' + sections.join('\n\n') : '';

  // Translate internal flow state to human-readable descriptions
  let flowStateText = 'No active browsing session';
  if (context.conversationFlow) {
    const stepLabels: Record<string, string> = {
      'product_pagination': 'Browsing products',
      'brand_selection': 'Selecting a brand',
      'subcategory_selection': 'Selecting a subcategory',
      'category_selection': 'Selecting a category',
      'variant_selection': 'Choosing product variant'
    };
    const waitingLabels: Record<string, string> = {
      'category': 'Customer needs to pick a category',
      'subcategory': 'Customer needs to pick a subcategory',
      'brand': 'Customer needs to pick a brand',
      'product': 'Customer needs to pick a product'
    };
    
    const currentStep = stepLabels[context.conversationFlow.step || ''] || context.conversationFlow.step || 'none';
    const waitingFor = waitingLabels[context.conversationFlow.waitingFor || ''] || context.conversationFlow.waitingFor || 'none';
    
    flowStateText = `Current Activity: ${currentStep}\nWaiting For: ${waitingFor}`;
    if (context.conversationFlow.selectedCategory) {
      flowStateText += `\nSelected Category: ${context.conversationFlow.selectedCategory}`;
    }
    if (context.conversationFlow.selectedSubcategory) {
      flowStateText += `\nSelected Subcategory: ${context.conversationFlow.selectedSubcategory}`;
    }
    if (context.conversationFlow.selectedBrand) {
      flowStateText += `\nSelected Brand: ${context.conversationFlow.selectedBrand}`;
    }
    flowStateText += '\n\nNOTE: This is managed by the system. Just answer questions naturally.';
  }

  return `You are a friendly AI assistant for ${context.businessName} on WhatsApp.

ROLE:
- Answer specific product/service questions naturally
- Explain features, materials, suitability
- Help customers choose between options
- Be professional, friendly, and concise

RULES:
1. ONLY recommend in-stock items (stock > 0)
2. Always include prices when mentioning products/services
3. Mention shipping methods when asked about delivery
4. Provide correct payment details from PAYMENT METHODS section
5. Quote exact policies from BUSINESS POLICIES
6. Keep responses concise (max 3-4 short paragraphs)
7. Use bullet points for lists
8. NEVER make up products, prices, or details - only use provided data
9. If unsure, ask for clarification
10. Include order link IF the product has one (don't create URLs)
11. When showing variants, list specs + price + stock clearly
12. Help customers choose variants by asking preferences

CONVERSATION CONTEXT:
${flowStateText}

PRODUCTS:
${productsList || "No products available"}

SERVICES:
${servicesList || "No services available"}${additionalInfo}

FORMATTING:
- Use *bold* for product names and prices
- Use emojis sparingly (1-2 per section)
- Add blank lines between products
- Use numbered lists (1️⃣, 2️⃣) for multiple products
- End with a question or call-to-action

EXAMPLES:

Product Question:
User: "Is the floral dress good for summer?"
You: "Yes! The Floral Summer Dress is perfect for summer occasions. It's KES 2,500 with 5 in stock, available in Red, Blue, Yellow (sizes S-XL). 🛒 Order here: [link]"

Shipping Question:
User: "How much is delivery?"
You: "We offer:\n🚚 Standard: KES 200 (2-3 days)\n⚡ Express: KES 500 (same day)\n🏪 Pickup: FREE (same day)\n\nWhich works best?"

Payment Question:
User: "Can I pay with M-Pesa?"
You: "Yes! Send payment via M-Pesa Buy Goods Till: 123456 (Your Shop Name). Once paid, share the confirmation message."`;
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

    // Use smaller, faster model for simple classification task
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant", // Faster & cheaper for classification
      temperature: 0.1, // Very low for consistent classification
      max_tokens: 20,
    });

    const response = chatCompletion.choices[0]?.message?.content || "general_question";
    return response.trim().toLowerCase();
  } catch (error) {
    console.error("[AI] Error detecting intent:", error);
    return "general_question";
  }
}

/**
 * AI-Powered Search Enhancement
 * Translates colloquial/local product names into standardized searchable terms
 * Example: "mitumba shoes" -> "secondhand shoes footwear"
 * Example: "mkate" -> "bread bakery"
 */
export async function enhanceSearchQuery(
  userQuery: string,
  context: {
    businessName?: string;
    products: Array<{ name: string; category?: string; brand?: string; description?: string }>;
  }
): Promise<string[]> {
  try {
    // Extract unique categories and brands for domain hints (not full product list)
    const categories = [...new Set(context.products.map(p => p.category).filter(Boolean))];
    const brands = [...new Set(context.products.map(p => p.brand).filter(Boolean))];
    
    // Limit to top 20 most common categories/brands to reduce token usage
    const categoryHints = categories.slice(0, 10).join(', ');
    const brandHints = brands.slice(0, 10).join(', ');
    
    const businessContext = context.businessName ? ` for ${context.businessName}` : '';
    
    const prompt = `You are a search query enhancer${businessContext}. 

The customer typed: "${userQuery}"

Your task is to translate this into multiple search variations that would match our product catalog.

Product categories in our catalog: ${categoryHints || 'Various'}
Brands we carry: ${brandHints || 'Various'}

RULES:
1. If the query uses local/colloquial language, translate it to standard English
2. Generate 3-5 search variations including:
   - Direct translation (if applicable)
   - Synonyms and related terms
   - Category-level terms
   - Brand names if relevant
3. Keep each variation short (1-3 words max)
4. Return ONLY a JSON array of strings, nothing else

Examples:
Input: "mitumba shoes"
Output: ["secondhand shoes", "used shoes", "thrift shoes", "footwear"]

Input: "mkate"
Output: ["bread", "bakery", "loaf"]

Input: "iPhone"
Output: ["iPhone", "apple phone", "smartphone"]

Input: "nguo za mitumba"
Output: ["secondhand clothes", "used clothing", "thrift wear", "vintage clothes"]

Now process this query: "${userQuery}"`

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
      max_tokens: 100,
    });

    const response = chatCompletion.choices[0]?.message?.content || "";
    
    // Parse JSON array from response with markdown fence stripping
    try {
      // Remove markdown code fences if present
      const cleaned = response.trim().replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.filter((term: any) => typeof term === 'string' && term.trim().length > 0);
      }
    } catch (parseError) {
      console.warn('[AI] Failed to parse search enhancements, using original query');
    }
    
    // Fallback: return original query
    return [userQuery];
  } catch (error) {
    console.error('[AI] Error enhancing search query:', error);
    // Fallback to original query on error
    return [userQuery];
  }
}
