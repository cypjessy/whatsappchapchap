import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { generateAIResponse, detectIntent, AIContext } from "@/lib/ai-service";
import { logWebhookError, logWebhookSuccess } from "@/lib/webhook-logger";
import { getProductCategories, formatProductList, getProductImage } from "@/lib/product-helper";
import { 
  generateGreetingWithCategories,
  generateSubCategoriesList,
  generateProductsList,
  detectBrowseIntent
} from "@/lib/category-browser";
import { shortenURL, formatOrderLink } from "@/lib/url-shortener";

// Initialize Firebase Admin SDK
let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminApp: App | null = null;

// In-memory conversation cache (faster than database reads)
// Stores: selectedMainCategory for tracking browsing context
const conversationCache = new Map<string, {
  selectedMainCategory: string;
  updatedAt: number;
}>();

// Cache expiry: 30 seconds (auto-clears old conversations)
const CACHE_TTL = 30 * 1000;

function getAdminDb() {
  if (!adminDb) {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
    adminDb = getFirestore();
  }
  return adminDb;
}

async function sendWelcomeMessage(
  tenantId: string,
  phoneNumber: string,
  businessName: string,
  welcomeMessage?: string
) {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.log(
        "[Webhook] Evolution API not configured, skipping welcome message"
      );
      return;
    }

    const messageText = welcomeMessage 
      ? welcomeMessage.replace(/\{\{business_name\}\}/g, businessName)
      : `Hello! 👋 Welcome to ${businessName}. We're excited to respond to your messages. How can we help you today?`;

    console.log(`[Webhook] Sending welcome message to ${phoneNumber}: ${messageText}`);

    const response = await fetch(
      `${evolutionApiUrl}/message/sendText/${tenantId}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: messageText, // ✅ Use processed message with business name replaced
        }),
      }
    );

    const data = await response.json();
    console.log("[Webhook] Welcome message response:", data);

    if (!response.ok) {
      console.error("[Webhook] Failed to send welcome message:", data);
    }
  } catch (error) {
    console.error("[Webhook] Error sending welcome message:", error);
  }
}

async function getTenantBusinessName(tenantId: string): Promise<string> {
  try {
    const adminDb = getAdminDb();
    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();

    if (tenantDoc.exists) {
      const data = tenantDoc.data();
      return data?.businessName || "Our Shop";
    }
    return "Our Shop";
  } catch (error) {
    console.error("[Webhook] Error fetching tenant business name:", error);
    return "Our Shop";
  }
}

async function getTenantSettings(tenantId: string): Promise<{ businessName: string; welcomeMessage: string; welcomeMessageEnabled: boolean }> {
  try {
    const adminDb = getAdminDb();
    
    // Try to get WhatsApp settings first
    const whatsappDoc = await adminDb.collection("whatsappSettings").doc(tenantId).get();
    
    if (whatsappDoc.exists) {
      const data = whatsappDoc.data();
      return {
        businessName: data?.businessName || "Our Shop",
        welcomeMessage: data?.welcomeMessage || `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
        welcomeMessageEnabled: data?.welcomeMessageEnabled ?? true
      };
    }
    
    // Fallback to business profile
    const profileDoc = await adminDb.collection("businessProfiles").doc(tenantId).get();
    
    if (profileDoc.exists) {
      const data = profileDoc.data();
      return {
        businessName: data?.businessName || "Our Shop",
        welcomeMessage: `Hello! 👋 Welcome to ${data?.businessName || "our shop"}.\n\nWe're excited to connect with you! How can we help you today?`,
        welcomeMessageEnabled: true
      };
    }
    
    // Fallback to old settings collection
    const settingsDoc = await adminDb.collection("settings").doc(tenantId).get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      return {
        businessName: data?.businessName || "Our Shop",
        welcomeMessage: data?.welcomeMessage || `Hello! Welcome to our shop. How can we help you today?`,
        welcomeMessageEnabled: true
      };
    }
    
    return {
      businessName: "Our Shop",
      welcomeMessage: `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
      welcomeMessageEnabled: true
    };
  } catch (error) {
    console.error("[Webhook] Error fetching tenant settings:", error);
    return {
      businessName: "Our Shop",
      welcomeMessage: `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
      welcomeMessageEnabled: true
    };
  }
}

// Get business context for AI (products, services, shipping, payments, policies)
async function getBusinessContext(tenantId: string): Promise<AIContext> {
  try {
    console.log("[Webhook] Starting to fetch business context...");
    console.log("[Webhook] Tenant ID:", tenantId);
    console.log("[Webhook] Environment check - Project ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "✓" : "✗");
    console.log("[Webhook] Environment check - Private Key:", process.env.FIREBASE_PRIVATE_KEY ? "✓" : "✗");
    
    const db = getAdminDb();
    
    if (!db) {
      console.error("[Webhook] ❌ Failed to initialize database");
      return { businessName: "Our Shop", products: [], services: [] };
    }
    
    console.log("[Webhook] Database initialized:", typeof db);
    
    // Get tenant info with timeout
    console.log("[Webhook] Fetching tenant info...");
    const tenantFetchStart = Date.now();
    let businessName = "Our Shop";
    
    try {
      const tenantPromise = db.collection("tenants").doc(tenantId).get();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Tenant fetch timeout after 5000ms")), 5000)
      );
      
      const tenantSnap = await Promise.race([tenantPromise, timeoutPromise]) as any;
      console.log(`[Webhook] Tenant fetch took ${Date.now() - tenantFetchStart}ms`);
      console.log("[Webhook] Tenant exists:", tenantSnap.exists);
      
      businessName = tenantSnap.exists ? tenantSnap.data()?.businessName || "Our Shop" : "Our Shop";
      console.log("[Webhook] Business name:", businessName);
    } catch (tenantError) {
      console.error("[Webhook] ❌ Tenant fetch error:", tenantError);
      console.error("[Webhook] Error name:", tenantError instanceof Error ? tenantError.name : "Unknown");
      console.error("[Webhook] Error message:", tenantError instanceof Error ? tenantError.message : "Unknown");
      console.error("[Webhook] Error stack:", tenantError instanceof Error ? tenantError.stack : "No stack");
      
      // Log error to Firestore
      await logWebhookError(
        tenantId,
        "TENANT_FETCH_ERROR",
        tenantError instanceof Error ? tenantError.message : String(tenantError),
        tenantError instanceof Error ? tenantError.stack : undefined,
        { step: "getBusinessContext" }
      );
      
      throw tenantError;
    }
    
    // Get active products (limit to 20 for context)
    console.log("[Webhook] Fetching products...");
    const productsFetchStart = Date.now();
    const productsSnap = await db.collection("products")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .limit(20)
      .get();
    console.log(`[Webhook] Products fetch took ${Date.now() - productsFetchStart}ms`);
    
    const products = productsSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        price: data.price || 0,
        salePrice: data.salePrice,
        category: data.category,
        categoryName: data.categoryName,
        stock: data.stock || 0,
        description: data.description,
        images: data.images || [],
        imageUrl: data.imageUrl,
        image: data.image,
        brand: data.brand,
        condition: data.condition,
        colors: data.filters?.colors || data.filters?.color || data.colors || [],
        sizes: data.filters?.sizes || data.filters?.size || data.sizes || [],
        sku: data.sku,
        warranty: data.warranty,
        orderLink: data.orderLink,
        productPaymentMethods: data.paymentMethods || [],
        productShippingMethods: data.shippingMethods || [],
        variants: data.variants || [],
      };
    });
    console.log(`[Webhook] Products loaded: ${products.length}`);
    
    // Get active services (limit to 20 for context)
    console.log("[Webhook] Fetching services...");
    const servicesFetchStart = Date.now();
    const servicesSnap = await db.collection("services")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .limit(20)
      .get();
    console.log(`[Webhook] Services fetch took ${Date.now() - servicesFetchStart}ms`);
    
    const services = servicesSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        priceMin: data.priceMin || 0,
        priceMax: data.priceMax,
        businessType: data.businessType,
        businessCategory: data.businessCategory,
        serviceName: data.serviceName,
        duration: data.duration,
        description: data.description,
      };
    });
    console.log(`[Webhook] Services loaded: ${services.length}`);
    
    // NEW: Get business profile
    console.log("[Webhook] Fetching business profile...");
    const profileFetchStart = Date.now();
    const profileSnap = await db.collection("businessProfiles").doc(tenantId).get();
    console.log(`[Webhook] Profile fetch took ${Date.now() - profileFetchStart}ms`);
    const businessProfile = profileSnap.exists ? profileSnap.data() : null;
    console.log("[Webhook] Business profile:", businessProfile ? "found" : "not found");
    
    // NEW: Get shipping methods
    console.log("[Webhook] Fetching shipping methods...");
    const shippingFetchStart = Date.now();
    const shippingSnap = await db.collection("shippingMethods")
      .where("tenantId", "==", tenantId)
      .get();
    console.log(`[Webhook] Shipping fetch took ${Date.now() - shippingFetchStart}ms`);
    
    const shippingMethods = shippingSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; name: string; price: number; estimatedDays?: string; description?: string }>;
    console.log(`[Webhook] Shipping methods loaded: ${shippingMethods.length}`);
    
    // NEW: Get product settings
    console.log("[Webhook] Fetching product settings...");
    const prodSettingsFetchStart = Date.now();
    const productSettingsSnap = await db.collection("productSettings").doc(tenantId).get();
    console.log(`[Webhook] Product settings fetch took ${Date.now() - prodSettingsFetchStart}ms`);
    const productSettings = productSettingsSnap.exists ? productSettingsSnap.data() : null;
    console.log("[Webhook] Product settings:", productSettings ? "found" : "not found");
    
    // NEW: Get service settings
    console.log("[Webhook] Fetching service settings...");
    const svcSettingsFetchStart = Date.now();
    const serviceSettingsSnap = await db.collection("serviceSettings").doc(tenantId).get();
    console.log(`[Webhook] Service settings fetch took ${Date.now() - svcSettingsFetchStart}ms`);
    const serviceSettings = serviceSettingsSnap.exists ? serviceSettingsSnap.data() : null;
    console.log("[Webhook] Service settings:", serviceSettings ? "found" : "not found");
    
    // NEW: Get product categories
    console.log("[Webhook] Fetching product categories...");
    const categoriesFetchStart = Date.now();
    const categoriesSnap = await db.collection("productCategories")
      .where("tenantId", "==", tenantId)
      .get();
    console.log(`[Webhook] Categories fetch took ${Date.now() - categoriesFetchStart}ms`);
    
    const productCategories = categoriesSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        icon: data.icon,
        productCount: data.productCount || 0,
      };
    });
    console.log(`[Webhook] Product categories loaded: ${productCategories.length}`);
    
    console.log("[Webhook] Building context object...");
    const context = {
      businessName,
      products,
      productCategories: productCategories.length > 0 ? productCategories : undefined,
      services,
      businessProfile: businessProfile ? {
        tagline: businessProfile.tagline,
        description: businessProfile.description,
        email: businessProfile.email,
        phone: businessProfile.phone,
        whatsappNumber: businessProfile.whatsappNumber,
        website: businessProfile.website,
        address: businessProfile.address,
        city: businessProfile.city,
        country: businessProfile.country,
        businessHours: businessProfile.businessHours,
        socialMedia: businessProfile.socialMedia,
      } : undefined,
      shippingMethods: shippingMethods.length > 0 ? shippingMethods : undefined,
      paymentMethods: businessProfile?.paymentMethods,
      productSettings: productSettings ? {
        enabled: productSettings.enabled,
        storeDescription: productSettings.storeDescription,
        returnPolicy: productSettings.returnPolicy,
        warrantyInfo: productSettings.warrantyInfo,
      } : undefined,
      serviceSettings: serviceSettings ? {
        enabled: serviceSettings.enabled,
        serviceDescription: serviceSettings.serviceDescription,
        bookingPolicy: serviceSettings.bookingPolicy,
        cancellationPolicy: serviceSettings.cancellationPolicy,
      } : undefined,
    };
    
    console.log("[Webhook] Context built successfully ✅");
    return context;
  } catch (error) {
    console.error("[Webhook] Error getting business context:", error);
    console.error("[Webhook] Error stack:", error instanceof Error ? error.stack : 'No stack');
    return {
      businessName: "Our Shop",
      products: [],
      services: [],
    };
  }
}

// Get conversation history for context (last 5 messages)
async function getConversationHistory(
  tenantId: string,
  phone: string
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  try {
    const adminDb = getAdminDb();
    
    const messagesSnap = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();
    
    const messages = messagesSnap.docs
      .map(doc => doc.data())
      .reverse() // Reverse to get chronological order
      .slice(-10); // Take last 10 messages
    
    return messages.map(msg => ({
      role: msg.fromMe || msg.sender === "business" ? "assistant" : "user",
      content: msg.text || "",
    }));
  } catch (error) {
    console.error("[Webhook] Error getting conversation history:", error);
    return [];
  }
}

// Send message via Evolution API
async function sendEvolutionMessage(
  tenantId: string,
  phoneNumber: string,
  text: string
): Promise<void> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.log("[Webhook] Evolution API not configured, skipping response");
      return;
    }

    console.log(`[Webhook] Sending AI response to ${phoneNumber}`);

    const response = await fetch(
      `${evolutionApiUrl}/message/sendText/${tenantId}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: text,
        }),
      }
    );

    const data = await response.json();
    console.log("[Webhook] AI response sent:", data);

    if (!response.ok) {
      console.error("[Webhook] Failed to send AI response:", data);
    }
  } catch (error) {
    console.error("[Webhook] Error sending AI response:", error);
  }
}

// Send media message (image) via Evolution API
async function sendEvolutionMedia(
  tenantId: string,
  phoneNumber: string,
  mediaUrl: string,
  caption?: string
): Promise<void> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.log("[Webhook] Evolution API not configured, skipping media");
      return;
    }

    console.log(`[Webhook] Sending media to ${phoneNumber}: ${mediaUrl}`);

    const response = await fetch(
      `${evolutionApiUrl}/message/sendMedia/${tenantId}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: phoneNumber,
          mediatype: "image",
          mimetype: "image/jpeg",
          caption: caption || "",
          media: mediaUrl,
        }),
      }
    );

    const data = await response.json();
    console.log("[Webhook] Media sent:", data);

    if (!response.ok) {
      console.error("[Webhook] Failed to send media:", data);
    }
  } catch (error) {
    console.error("[Webhook] Error sending media:", error);
  }
}

// Send products one-by-one with images
async function sendProductsSequentially(
  tenantId: string,
  phone: string,
  products: any[],
  categoryInfo: string,
  totalProducts: number,
  startIndex: number
): Promise<void> {
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productNum = startIndex + i + 1;
    const price = product.salePrice || product.price;
    const stockInfo = product.stock ? `(${product.stock} in stock)` : '';
    
    // Build product details text
    let caption = `*${productNum}. ${product.name}*\n`;
    caption += `💰 KES ${price.toLocaleString()} ${stockInfo}\n`;
    
    if (product.description) {
      caption += `\n${product.description.substring(0, 150)}${product.description.length > 150 ? '...' : ''}\n`;
    }
    
    if (product.colors && product.colors.length > 0) {
      caption += ` Colors: ${product.colors.join(', ')}\n`;
    }
    
    if (product.sizes && product.sizes.length > 0) {
      caption += `📏 Sizes: ${product.sizes.join(', ')}\n`;
    }
    
    if (product.orderLink) {
      // Shorten URL and format with vibrant styling
      const shortUrl = await shortenURL(product.orderLink);
      caption += formatOrderLink(product.orderLink, shortUrl);
    }
    
    // Send image with product details as caption
    const imageUrl = product.images?.[0] || product.image;
    if (imageUrl) {
      await sendEvolutionMedia(tenantId, phone, imageUrl, caption);
      // Small delay between messages to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    } else {
      // Fallback: send text only if no image
      await sendEvolutionMessage(tenantId, phone, caption);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  // Send navigation message after all products
  const hasMore = startIndex + products.length < totalProducts;
  let navMessage = `\n📦 Showing ${startIndex + 1}-${startIndex + products.length} of ${totalProducts} products in ${categoryInfo}\n\n`;
  
  if (hasMore) {
    navMessage += `Type *"more"* to see next products.\n`;
  }
  
  navMessage += `Type "back" to browse categories.`;
  
  await sendEvolutionMessage(tenantId, phone, navMessage);
}

// Process message with AI and send response
async function processWithAI(
  tenantId: string,
  phone: string,
  message: string
): Promise<void> {
  const processStart = Date.now();
  try {
    console.log("[Webhook] Processing message...");
    console.log("[Webhook] Phone:", phone, "Message:", message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    
    // Get business context (products, services, shipping, payments, policies)
    console.log("[Webhook] Fetching business context for tenant:", tenantId);
    const contextStart = Date.now();
    const context = await getBusinessContext(tenantId);
    console.log(`[Webhook] Context fetch took ${Date.now() - contextStart}ms`);
    console.log(`[Webhook] Context loaded: ${context.products.length} products, ${context.services.length} services`);
    console.log(`[Webhook] Shipping methods: ${context.shippingMethods?.length || 0}`);
    console.log(`[Webhook] Payment methods: ${context.paymentMethods ? 'loaded' : 'none'}`);
    
    // SIMPLE CATEGORY BROWSING - No state management needed
    console.log("[Webhook] Processing message...");
    const normalizedMessage = message.toLowerCase().trim();
    
    // Check for greeting (new conversation)
    if (normalizedMessage.match(/^\b(hi|hello|hey|hola|greetings)\b$/)) {
      console.log("[Webhook] New conversation - greeting detected");
      
      // Fetch greeting from database
      const settings = await getTenantSettings(tenantId);
      
      if (settings.welcomeMessageEnabled && settings.welcomeMessage) {
        // Replace placeholder with business name
        let greetingText = settings.welcomeMessage.replace(/\{\{business_name\}\}/g, settings.businessName);
        
        // Enhance formatting for WhatsApp
        // Add bold to business name if not already formatted
        if (!greetingText.includes('*')) {
          greetingText = greetingText.replace(
            new RegExp(settings.businessName, 'gi'),
            `*${settings.businessName}*`
          );
        }
        
        // Ensure proper line breaks for readability
        greetingText = greetingText
          .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
          .trim();
        
        await sendEvolutionMessage(tenantId, phone, greetingText);
        console.log("[Webhook] Greeting sent from database ✅");
        
        // Update conversation metadata
        const timestamp = new Date();
        const adminDb = getAdminDb();
        await adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("conversations")
          .doc(phone)
          .set({
            lastMessage: greetingText,
            lastMessageTime: timestamp,
            updatedAt: timestamp,
          }, { merge: true });
        
        console.log("[Webhook] Greeting complete ✅");
        console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
        await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
        return; // Exit - don't show products yet, wait for user to ask
      }
    }
    
    // GLOBAL SUB-CATEGORY CHECK - Runs for ANY message mentioning a sub-category
    // This prevents AI from intercepting queries like "what about dresses?"
    const allSubCategories = new Map<string, { mainCategory: string; mainCategoryName: string }>();
    context.products.forEach(p => {
      if (p.category && p.categoryName) {
        const key = p.categoryName.toLowerCase();
        if (!allSubCategories.has(key)) {
          allSubCategories.set(key, {
            mainCategory: p.category,
            mainCategoryName: p.categoryName
          });
        }
      }
    });
    
    for (const [subCatKey, subCatInfo] of allSubCategories) {
      if (normalizedMessage.includes(subCatKey)) {
        console.log(`[Webhook] Global sub-category match: ${subCatInfo.mainCategoryName}`);
        
        // Get products for this sub-category (filter by category AND categoryName)
        const filteredProducts = context.products.filter(p => 
          p.category === subCatInfo.mainCategory && 
          p.categoryName === subCatInfo.mainCategoryName &&
          p.stock && p.stock > 0
        );
        
        if (filteredProducts.length === 0) {
          const response = `Sorry, no products available in ${subCatInfo.mainCategoryName} right now.`;
          await sendEvolutionMessage(tenantId, phone, response);
          
          const timestamp = new Date();
          const adminDb = getAdminDb();
          await adminDb
            .collection("tenants")
            .doc(tenantId)
            .collection("conversations")
            .doc(phone)
            .set({
              lastMessage: response,
              lastMessageTime: timestamp,
              updatedAt: timestamp,
            }, { merge: true });
          
          console.log("[Webhook] No products found ✅");
          console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
          await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
          return;
        }
        
        // Show first 5 products one-by-one with images
        const productsToShow = filteredProducts.slice(0, 5);
        
        await sendProductsSequentially(
          tenantId,
          phone,
          productsToShow,
          subCatInfo.mainCategoryName,
          filteredProducts.length,
          0
        );
        
        const timestamp = new Date();
        const adminDb = getAdminDb();
        await adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("conversations")
          .doc(phone)
          .set({
            lastMessage: `Showing products in ${subCatInfo.mainCategoryName}`,
            lastMessageTime: timestamp,
            updatedAt: timestamp,
          }, { merge: true });
        
        console.log(`[Webhook] Products shown: ${productsToShow.length} items ✅`);
        console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
        await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
        return;
      }
    }
    
    // FUZZY CATEGORY MATCHING - Handles misspellings and partial names
    // e.g., "dresss", "laptpos", "shooes", "dress", "lapt"
    const categoryKeywords = normalizedMessage.replace(/\b(what|do|you|have|show|tell|me|about|the|a|an|is|are|any|looking|for|want|buy|order|need|check|see|find|search|i|we|can|get)\b/g, '').trim();
    
    if (categoryKeywords.length > 2) {
      const keywords = categoryKeywords.split(/\s+/).filter(k => k.length > 2);
      
      if (keywords.length > 0) {
        // Find best matching sub-category using similarity scoring
        let bestMatch: { subCatKey: string; subCatInfo: { mainCategory: string; mainCategoryName: string }; score: number } | null = null;
        
        for (const [subCatKey, subCatInfo] of allSubCategories) {
          let score = 0;
          
          for (const keyword of keywords) {
            // Exact substring match (highest priority)
            if (subCatKey.includes(keyword) || keyword.includes(subCatKey)) {
              score += 10;
            }
            // Character-by-character similarity for misspellings
            else if (keyword.length >= 3 && subCatKey.length >= 3) {
              const minLen = Math.min(keyword.length, subCatKey.length);
              let matchChars = 0;
              for (let i = 0; i < minLen; i++) {
                if (keyword[i] === subCatKey[i]) matchChars++;
              }
              const similarity = matchChars / minLen;
              if (similarity > 0.6) {
                score += Math.floor(similarity * 5);
              }
            }
          }
          
          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { subCatKey, subCatInfo, score };
          }
        }
        
        // Only use fuzzy match if score is strong enough (>= 10)
        if (bestMatch && bestMatch.score >= 10) {
          console.log(`[Webhook] FUZZY category match: "${categoryKeywords}" → ${bestMatch.subCatInfo.mainCategoryName} (score: ${bestMatch.score})`);
          
          const filteredProducts = context.products.filter(p => 
            p.category === bestMatch!.subCatInfo.mainCategory && 
            p.categoryName === bestMatch!.subCatInfo.mainCategoryName &&
            p.stock && p.stock > 0
          );
          
          if (filteredProducts.length === 0) {
            const response = `Sorry, no products available in ${bestMatch.subCatInfo.mainCategoryName} right now.`;
            await sendEvolutionMessage(tenantId, phone, response);
            
            const timestamp = new Date();
            const adminDb = getAdminDb();
            await adminDb
              .collection("tenants")
              .doc(tenantId)
              .collection("conversations")
              .doc(phone)
              .set({
                lastMessage: response,
                lastMessageTime: timestamp,
                updatedAt: timestamp,
              }, { merge: true });
            
            console.log("[Webhook] No products found ✅");
            console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
            await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
            return;
          }
          
          const productsToShow = filteredProducts.slice(0, 5);
          
          await sendProductsSequentially(
            tenantId,
            phone,
            productsToShow,
            bestMatch.subCatInfo.mainCategoryName,
            filteredProducts.length,
            0
          );
          
          const timestamp = new Date();
          const adminDb = getAdminDb();
          await adminDb
            .collection("tenants")
            .doc(tenantId)
            .collection("conversations")
            .doc(phone)
            .set({
              lastMessage: `Showing products in ${bestMatch.subCatInfo.mainCategoryName}`,
              lastMessageTime: timestamp,
              updatedAt: timestamp,
            }, { merge: true });
          
          console.log(`[Webhook] Fuzzy category products shown: ${productsToShow.length} items ✅`);
          console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
          await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
          return;
        }
      }
    }
    
    // FUZZY PRODUCT NAME MATCHING - For partial product name searches
    // e.g., "asus laptop", "bikini", "cups", "iphone"
    const productKeywords = normalizedMessage.replace(/\b(what|do|you|have|show|tell|me|about|the|a|an|is|are|any|looking|for|want|buy|order|need|check|see|find|search)\b/g, '').trim();
    
    if (productKeywords.length > 2) {
      // Split into keywords and search products
      const keywords = productKeywords.split(/\s+/).filter(k => k.length > 2);
      
      if (keywords.length > 0) {
        const matchingProducts = context.products.filter(p => {
          if (!p.stock || p.stock <= 0) return false;
          
          const productName = p.name.toLowerCase();
          const description = (p.description || '').toLowerCase();
          const category = (p.category || '').toLowerCase();
          const categoryName = (p.categoryName || '').toLowerCase();
          
          // Check if ANY keyword matches product name, description, or category
          return keywords.some(keyword => 
            productName.includes(keyword) ||
            description.includes(keyword) ||
            category.includes(keyword) ||
            categoryName.includes(keyword)
          );
        });
        
        if (matchingProducts.length > 0) {
          console.log(`[Webhook] Fuzzy product match found: ${matchingProducts.length} products`);
          
          // Show first 5 products one-by-one with images
          const productsToShow = matchingProducts.slice(0, 5);
          
          await sendProductsSequentially(
            tenantId,
            phone,
            productsToShow,
            "search results",
            matchingProducts.length,
            0
          );
          
          const timestamp = new Date();
          const adminDb = getAdminDb();
          await adminDb
            .collection("tenants")
            .doc(tenantId)
            .collection("conversations")
            .doc(phone)
            .set({
              lastMessage: `Showing ${matchingProducts.length} products from search`,
              lastMessageTime: timestamp,
              updatedAt: timestamp,
            }, { merge: true });
          
          console.log(`[Webhook] Fuzzy products shown: ${productsToShow.length} items ✅`);
          console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
          await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
          return;
        }
      }
    }
    const wantsProducts = normalizedMessage.match(/(product|shop|browse|catalog|order|buy|show|see|what.*have|what.*sell|menu|list|available)/i);
    const wantsServices = normalizedMessage.match(/\b(service|book|appointment)\b/);
    
    // Build main categories list (needed for both browsing and number selection)
    const mainCategories: Array<{ id: string; name: string; count: number }> = [];
    const categoryMap = new Map<string, { name: string; count: number }>();
    
    if (context.products.length > 0) {
      context.products.forEach(product => {
        if (product.category) {
          const existing = categoryMap.get(product.category);
          if (existing) {
            existing.count++;
          } else {
            // Use category (main category ID) and capitalize for display
            const displayName = product.category.charAt(0).toUpperCase() + product.category.slice(1);
            categoryMap.set(product.category, {
              name: displayName,
              count: 1
            });
          }
        }
      });
      
      // Convert to array
      categoryMap.forEach((data, id) => {
        mainCategories.push({ id, name: data.name, count: data.count });
      });
    }
    
    // CATEGORY NUMBER SELECTION - Check BEFORE product/service intent
    // This handles when user types "1", "2", etc. to select a category from any previous list
    const numberMatch = normalizedMessage.match(/^\d+$/);
    if (numberMatch && mainCategories.length > 0) {
      const index = parseInt(numberMatch[0]) - 1;
      
      // Check cache for context (O(1) - instant, no database call!)
      const cached = conversationCache.get(phone);
      const selectedMainCategoryId = cached?.selectedMainCategory;
      
      if (selectedMainCategoryId) {
        // We're at sub-category level - treat number as sub-category selection
        console.log(`[Webhook] SUB-CATEGORY selection mode - checking number ${numberMatch[0]} (from cache)`);
        
        // Get the main category info
        const mainCat = mainCategories.find(c => c.id === selectedMainCategoryId);
        if (!mainCat) {
          console.log("[Webhook] Main category not found, clearing cache");
          conversationCache.delete(phone);
          // Fall through to main category selection
        } else {
          // Get sub-categories for this main category
          const subCategories = new Set<string>();
          context.products.forEach(p => {
            if (p.category === mainCat.id && p.categoryName) {
              subCategories.add(p.categoryName);
            }
          });
          
          const subCatArray = Array.from(subCategories);
          
          if (index >= 0 && index < subCatArray.length) {
            const selectedSubCategory = subCatArray[index];
            console.log(`[Webhook] User selected sub-category #${index + 1}: ${selectedSubCategory}`);
            
            // Get products for this sub-category
            const filteredProducts = context.products.filter(p => 
              p.category === mainCat.id && 
              p.categoryName === selectedSubCategory &&
              p.stock && p.stock > 0
            );
            
            if (filteredProducts.length === 0) {
              const response = `Sorry, no products available in ${selectedSubCategory} right now.`;
              await sendEvolutionMessage(tenantId, phone, response);
              
              // Clear cache
              conversationCache.delete(phone);
              
              const timestamp = new Date();
              const adminDb = getAdminDb();
              await adminDb
                .collection("tenants")
                .doc(tenantId)
                .collection("conversations")
                .doc(phone)
                .set({
                  lastMessage: response,
                  lastMessageTime: timestamp,
                  updatedAt: timestamp,
                }, { merge: true });
              
              console.log("[Webhook] No products in sub-category ✅");
              console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
              await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
              return;
            }
            
            const productsToShow = filteredProducts.slice(0, 5);
            await sendProductsSequentially(
              tenantId,
              phone,
              productsToShow,
              `${mainCat.name} > ${selectedSubCategory}`,
              filteredProducts.length,
              0
            );
            
            const timestamp = new Date();
            const adminDb = getAdminDb();
            await adminDb
              .collection("tenants")
              .doc(tenantId)
              .collection("conversations")
              .doc(phone)
              .set({
                lastMessage: `Showing products in ${selectedSubCategory}`,
                lastMessageTime: timestamp,
                updatedAt: timestamp,
              }, { merge: true });
            
            // Clear cache after showing products
            conversationCache.delete(phone);
            
            console.log("[Webhook] Products shown from sub-category ✅");
            console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
            await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
            return;
          }
        }
      }
      
      // Main category selection (original logic)
      if (index >= 0 && index < mainCategories.length) {
        const selectedCategory = mainCategories[index];
        console.log(`[Webhook] MAIN CATEGORY selection #${index + 1}: ${selectedCategory.name}`);
        
        // Get sub-categories for this main category
        const subCategories = new Set<string>();
        context.products.forEach(p => {
          if (p.category === selectedCategory.id && p.categoryName) {
            subCategories.add(p.categoryName);
          }
        });
        
        if (subCategories.size === 0) {
          // No sub-categories, show products directly
          const filteredProducts = context.products.filter(p => 
            p.category === selectedCategory.id && p.stock && p.stock > 0
          );
          
          if (filteredProducts.length === 0) {
            const response = `Sorry, no products available in ${selectedCategory.name} right now.`;
            await sendEvolutionMessage(tenantId, phone, response);
            
            const timestamp = new Date();
            const adminDb = getAdminDb();
            await adminDb
              .collection("tenants")
              .doc(tenantId)
              .collection("conversations")
              .doc(phone)
              .set({
                lastMessage: response,
                lastMessageTime: timestamp,
                updatedAt: timestamp,
              }, { merge: true });
            
            console.log("[Webhook] No products in category ✅");
            console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
            await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
            return;
          }
          
          const productsToShow = filteredProducts.slice(0, 5);
          await sendProductsSequentially(
            tenantId,
            phone,
            productsToShow,
            selectedCategory.name,
            filteredProducts.length,
            0
          );
          
          const timestamp = new Date();
          const adminDb = getAdminDb();
          await adminDb
            .collection("tenants")
            .doc(tenantId)
            .collection("conversations")
            .doc(phone)
            .set({
              lastMessage: `Showing products in ${selectedCategory.name}`,
              lastMessageTime: timestamp,
              updatedAt: timestamp,
            }, { merge: true });
          
          console.log("[Webhook] Products shown directly ✅");
          console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
          await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
          return;
        }
        
        // Show sub-categories
        let response = ` *${selectedCategory.name}*\n\n`;
        response += `Choose a sub-category:\n\n`;
        
        Array.from(subCategories).forEach((subCat, idx) => {
          const count = context.products.filter(p => 
            p.category === selectedCategory.id && p.categoryName === subCat
          ).length;
          response += `${idx + 1}. *${subCat}* (${count} products)\n`;
        });
        
        response += `\nReply with a sub-category name or number.`;
        response += `\n\nType "back" to return to main categories.`;
        
        await sendEvolutionMessage(tenantId, phone, response);
        
        // Save to CACHE instead of database (O(1) - instant!)
        conversationCache.set(phone, {
          selectedMainCategory: selectedCategory.id,
          updatedAt: Date.now(),
        });
        
        // Also save to database for persistence (but not needed for immediate lookup)
        const timestamp = new Date();
        const adminDb = getAdminDb();
        await adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("conversations")
          .doc(phone)
          .set({
            lastMessage: response,
            lastMessageTime: timestamp,
            updatedAt: timestamp,
          }, { merge: true });
        
        console.log(`[Webhook] Sub-categories shown for ${selectedCategory.name} (cached) ✅`);
        console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
        await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
        return;
      }
    }
    
    if (wantsProducts && context.products.length > 0) {
      console.log("[Webhook] User wants to browse products");
      
      // Build main categories list
      const mainCategories: Array<{ id: string; name: string; count: number }> = [];
      const categoryMap = new Map<string, { name: string; count: number }>();
      
      context.products.forEach(product => {
        if (product.category) {
          const existing = categoryMap.get(product.category);
          if (existing) {
            existing.count++;
          } else {
            // Use category (main category ID) and capitalize for display
            const displayName = product.category.charAt(0).toUpperCase() + product.category.slice(1);
            categoryMap.set(product.category, {
              name: displayName,
              count: 1
            });
          }
        }
      });
      
      // Convert to array
      categoryMap.forEach((data, id) => {
        mainCategories.push({ id, name: data.name, count: data.count });
      });
      
      if (mainCategories.length === 0) {
        const response = "Sorry, we currently have no products available.";
        await sendEvolutionMessage(tenantId, phone, response);
        
        const timestamp = new Date();
        const adminDb = getAdminDb();
        await adminDb
          .collection("tenants")
          .doc(tenantId)
          .collection("conversations")
          .doc(phone)
          .set({
            lastMessage: response,
            lastMessageTime: timestamp,
            updatedAt: timestamp,
          }, { merge: true });
        
        console.log("[Webhook] No products available ✅");
        console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
        await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
        return;
      }
          
      // Check if message matches a main category name
      for (const cat of mainCategories) {
        if (normalizedMessage.includes(cat.name.toLowerCase()) || 
            normalizedMessage.includes(cat.id.toLowerCase())) {
          console.log(`[Webhook] User selected category: ${cat.name}`);
          
          // Get sub-categories for this main category
          const subCategories = new Set<string>();
          context.products.forEach(p => {
            if (p.category === cat.id && p.categoryName) {
              subCategories.add(p.categoryName);
            }
          });
          
          let response = `📂 *${cat.name}*\n\n`;
          response += `Choose a sub-category:\n\n`;
          
          Array.from(subCategories).forEach((subCat, idx) => {
            const count = context.products.filter(p => 
              p.category === cat.id && p.categoryName === subCat
            ).length;
            response += `${idx + 1}. *${subCat}* (${count} products)\n`;
          });
          
          response += `\nReply with a sub-category name or number.`;
          response += `\n\nType "back" to return to main categories.`;
          
          await sendEvolutionMessage(tenantId, phone, response);
          
          const timestamp = new Date();
          const adminDb = getAdminDb();
          await adminDb
            .collection("tenants")
            .doc(tenantId)
            .collection("conversations")
            .doc(phone)
            .set({
              lastMessage: response,
              lastMessageTime: timestamp,
              updatedAt: timestamp,
            }, { merge: true });
          
          console.log("[Webhook] Sub-categories shown ✅");
          console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
          await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
          return;
        }
      }
      
      // If no match, show main categories
      let response = `🛍️ *BROWSE OUR PRODUCTS*\n\n`;
      response += `What are you looking for?\n\n`;
      
      mainCategories.forEach((cat, index) => {
        response += `${index + 1}. *${cat.name}* (${cat.count} products)\n`;
      });
      
      response += `\nReply with a category name or number to browse!`;
      
      await sendEvolutionMessage(tenantId, phone, response);
      
      const timestamp = new Date();
      const adminDb = getAdminDb();
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          lastMessage: response,
          lastMessageTime: timestamp,
          updatedAt: timestamp,
        }, { merge: true });
      
      console.log("[Webhook] Main categories shown ✅");
      console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
      await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
      return;
    }
    
    // For all other messages, use AI with enhanced prompt
    console.log("[Webhook] Using AI for general conversation");
    
    // Generate AI response (NO conversation history to prevent flow confusion)
    console.log("[Webhook] Calling Gemini AI...");
    const aiStart = Date.now();
    
    // Add timeout to prevent hanging
    const aiPromise = generateAIResponse(message, context);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI generation timeout after 15000ms")), 15000)
    );
    
    const aiResponse = await Promise.race([aiPromise, timeoutPromise]) as string;
    console.log(`[Webhook] AI generation took ${Date.now() - aiStart}ms`);
    console.log("[Webhook] AI Response generated successfully, length:", aiResponse.length);
    console.log("[Webhook] AI Response preview:", aiResponse.substring(0, 100));
    
    // Send AI response via Evolution API
    console.log("[Webhook] Sending AI response via Evolution API...");
    
    // Clean any image tags from response (images handled separately now)
    const cleanText = aiResponse.replace(/\[IMAGE:[^\]]+\]/g, '').trim();
    await sendEvolutionMessage(tenantId, phone, cleanText);
    
    console.log("[Webhook] All messages sent");
    
    // Update conversation metadata with AI response
    const adminDb = getAdminDb();
    const timestamp = new Date();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        lastMessage: aiResponse,
        lastMessageTime: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    
    console.log("[Webhook] Conversation metadata updated");
    
    console.log("[Webhook] AI processing complete ✅");
    console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
    
    // Log success to Firestore
    await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
  } catch (error) {
    const processingTime = Date.now() - processStart;
    console.error("[Webhook] ❌ ERROR in AI processing after", processingTime, "ms:", error);
    console.error("[Webhook] Error stack:", error instanceof Error ? error.stack : 'No stack');
    console.error("[Webhook] Error name:", error instanceof Error ? error.name : 'Unknown');
    console.error("[Webhook] Error message:", error instanceof Error ? error.message : 'Unknown');
    
    // Log error to Firestore
    await logWebhookError(
      tenantId,
      "AI_PROCESSING_ERROR",
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error.stack : undefined,
      { 
        phone, 
        message: message.substring(0, 100),
        processingTimeMs: processingTime,
        step: "processWithAI"
      }
    );
    
    // Send fallback message
    try {
      await sendEvolutionMessage(
        tenantId,
        phone,
        "Thank you for your message! We'll get back to you shortly. 🙏"
      );
      console.log("[Webhook] Fallback message sent");
    } catch (fallbackError) {
      console.error("[Webhook] Failed to send fallback message:", fallbackError);
    }
  }
}

export async function POST(req: NextRequest) {
  console.log("[Webhook] Received request");
  
  try {
    const body = await req.json();
    console.log("[Webhook] Body:", JSON.stringify(body));

    const event = body.event || body.type || body.eventName;
    const instanceName = body.instance || body.instanceName || body.instance_id || body.instanceId;

    console.log("[Webhook] Event:", event);
    console.log("[Webhook] Instance:", instanceName);
    console.log("[Webhook] Raw data:", JSON.stringify(body.data || body));

    const allowedEvents = ["messages.upsert", "MESSAGES_UPSERT", "messages.update", "MESSAGES_UPDATE"];
    if (!allowedEvents.includes(event)) {
      console.log("[Webhook] Ignoring event:", event);
      return NextResponse.json({ received: true });
    }

    if (!instanceName) {
      console.log("[Webhook] No instance found");
      return NextResponse.json({ received: true });
    }

    const message = Array.isArray(body.data)
      ? body.data[0]
      : body.data?.messages?.[0] || body.data;

    if (!message) {
      console.log("[Webhook] No message payload found");
      return NextResponse.json({ received: true });
    }

    if (message?.key?.fromMe) {
      console.log("[Webhook] Ignoring own message");
      return NextResponse.json({ received: true });
    }

    // Extract phone number from remoteJid
    // Format can be: "254748132692@s.whatsapp.net" or "254748132692:39@s.whatsapp.net"
    // For messages.update events, remoteJid is directly in message object
    // For messages.upsert events, remoteJid is in message.key object
    const remoteJid = message?.key?.remoteJid || message?.remoteJid || "";
    const from = remoteJid
      .replace(/:\d+@s\.whatsapp\.net$/, "")  // Remove :39@s.whatsapp.net
      .replace(/@s\.whatsapp\.net$/, "")       // Remove @s.whatsapp.net
      .replace(/^\+/, "");                      // Remove leading + if present
    
    if (!from) {
      console.log("[Webhook] ❌ No phone number extracted from remoteJid:", remoteJid);
      console.log("[Webhook] Message structure:", JSON.stringify(message).substring(0, 200));
      return NextResponse.json({ received: true, error: "No phone number" });
    }
    
    console.log(`[Webhook] Extracted phone: ${from} from remoteJid: ${remoteJid}`);
    
    const text =
      message?.message?.conversation ||
      message?.message?.extendedTextMessage?.text ||
      message?.message?.conversation ||
      message?.message?.buttonsResponseMessage?.selectedButtonId ||
      message?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      "";
    const messageId = message?.key?.id || Date.now().toString();
    const timestamp = message?.messageTimestamp
      ? new Date(message.messageTimestamp * 1000)
      : message?.messageTimestampMs
      ? new Date(message.messageTimestampMs)
      : new Date();

    console.log(`[Webhook] Message from ${from}: ${text}`);

    // Use instance name as tenant ID (e.g., tenant_USER_ID)
    let tenantId = instanceName;
    console.log("[Webhook] Instance Name:", instanceName);

    // If instanceName looks like a UUID (not tenant_xxx), find the tenant by evolutionUUID
    const adminDb = getAdminDb();
    
    if (!instanceName.startsWith("tenant_")) {
      console.log("[Webhook] Instance is UUID, searching for tenant...");
      const tenantsQuery = await adminDb.collection("tenants")
        .where("evolutionUUID", "==", instanceName)
        .limit(1)
        .get();
      
      if (!tenantsQuery.empty) {
        tenantId = tenantsQuery.docs[0].id;
        console.log("[Webhook] Found tenant by UUID:", tenantId);
      } else {
        // Also try finding by evolutionInstanceId
        const tenantsQuery2 = await adminDb.collection("tenants")
          .where("evolutionInstanceId", "==", instanceName)
          .limit(1)
          .get();
        
        if (!tenantsQuery2.empty) {
          tenantId = tenantsQuery2.docs[0].id;
          console.log("[Webhook] Found tenant by instanceId:", tenantId);
        }
      }
    }
    
    console.log("[Webhook] Final Tenant ID:", tenantId);

    // Save to conversations collection - using our tenant structure
    const conversationRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(from);

    const existingConvo = await conversationRef.get();
    const currentUnreadCount = existingConvo.exists
      ? (existingConvo.data()?.unreadCount || 0) + 1
      : 1;

    const isNewConversation = !existingConvo.exists;

    await conversationRef.set({
      phone: from,
      customerPhone: from,
      customerName: message?.pushName || "Customer",
      lastMessage: text,
      lastMessageTime: timestamp,
      unreadCount: currentUnreadCount,
      updatedAt: timestamp,
    }, { merge: true });

    console.log("[Webhook] Conversation metadata updated");

    // Send welcome message only on first contact (BEFORE AI processing)
    if (isNewConversation) {
      console.log("[Webhook] New conversation detected, sending welcome message");
      console.log("[Webhook] Tenant ID for settings:", tenantId);
      const settings = await getTenantSettings(tenantId);
      console.log("[Webhook] Settings found:", settings);
      
      // Only send if welcome message is enabled
      if (settings.welcomeMessageEnabled) {
        console.log("[Webhook] Sending welcome message...");
        await sendWelcomeMessage(tenantId, from, settings.businessName, settings.welcomeMessage);
        console.log("[Webhook] Welcome message sent");
      } else {
        console.log("[Webhook] Welcome message is disabled, skipping");
      }
    }

    // Process with AI and send response (replaces n8n)
    if (text) {
      // Await AI processing to prevent Vercel from killing the function
      console.log("[Webhook] Starting AI processing...");
      await processWithAI(tenantId, from, text).catch(err => {
        console.error("[Webhook] AI processing error:", err);
      });
      console.log("[Webhook] AI processing completed");
    }

    return NextResponse.json({ received: true, status: "saved" });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Webhook active",
    message: "POST to receive WhatsApp messages",
  });
}
