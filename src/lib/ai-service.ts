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
}

export async function generateAIResponse(
  message: string,
  context: AIContext,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Build system prompt with business context
    const systemPrompt = buildSystemPrompt(context);

    // Build conversation history
    const historyMessages = conversationHistory.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Start chat with history
    const chat = model.startChat({
      history: historyMessages,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    });

    // Send user message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return text.trim();
  } catch (error) {
    console.error("[AI] Error generating response:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact us directly.";
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

  return `You are a friendly and helpful AI assistant for ${context.businessName}, a business using WhatsApp for customer service.

YOUR ROLE:
- Answer customer questions about products and services
- Help customers place orders
- Provide pricing and availability information
- Be professional, friendly, and concise
- Use emojis sparingly to make messages engaging

AVAILABLE PRODUCTS:
${productsList || "No products currently available"}

AVAILABLE SERVICES:
${servicesList || "No services currently available"}

IMPORTANT RULES:
1. ONLY recommend products/services that are IN STOCK (stock > 0)
2. Always include prices when mentioning products/services
3. If a product is out of stock, suggest alternatives
4. Keep responses concise (WhatsApp-friendly, max 3-4 short paragraphs)
5. Use bullet points for lists
6. If asked about something not available, politely say so and offer alternatives
7. For order inquiries, ask for delivery address and preferred payment method
8. Never make up products or prices - only use what's provided above
9. If you don't know something, ask the customer to clarify
10. End with a question or call-to-action to keep conversation going

RESPONSE FORMAT:
- Start with a friendly greeting if it's a new conversation
- Use short paragraphs (2-3 sentences max)
- Include relevant emojis (1-2 per message)
- End with a question or next step

EXAMPLE RESPONSES:
Customer: "Do you have iPhone?"
You: "Yes! We have these iPhones available:\n\n📱 iPhone 15 - KES 120,000 (10 in stock)\n📱 iPhone 15 Pro - KES 150,000 (5 in stock)\n\nWhich one interests you? I can share more details! 😊"

Customer: "What are your prices?"
You: "Here are our current prices:\n\n${productsList.substring(0, 200)}...\n\nWould you like details about any specific product? 🛍️"

Customer: "I want to order"
You: "Great! I'd be happy to help you place an order. \n\nCould you please tell me:\n1. Which product/service you'd like?\n2. Your delivery address?\n3. Preferred payment method?\n\nLooking forward to serving you! 🎉"`;
}

export async function detectIntent(message: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
