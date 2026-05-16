import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { generateAIResponse, AIContext } from "@/lib/ai-service";
import { logWebhookError, logWebhookSuccess } from "@/lib/webhook-logger";
import { 
  startOrderStatusFlow, 
  handleOrderStatusLookup,
  handleOrderStatusSelection,
  handleOrderCancellation,
  type OrderStatusDeps 
} from "./handlers/order-status";
import { 
  startServiceBrowseFlow, 
  handleServiceBrowseInput,
  type ServiceBrowseDeps 
} from "./handlers/service-browse";
import { 
  startProductBrowseFlow,
  handleProductBrowseInput,
  type ProductBrowseDeps
} from "./handlers/product-browse";
import { 
  handleProductSearch as handleProductSearchHandler,
  type Deps as ProductSearchDeps
} from "./handlers/product-search";
import { 
  handleServiceSearch as handleServiceSearchHandler,
  type Deps as ServiceSearchDeps
} from "./handlers/service-search";

// Initialize Firebase Admin SDK
let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminApp: App | null = null;

const DEBUG = process.env.DEBUG_MODE === 'true';
const FLOW_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

// Track active typing indicator intervals to prevent memory leaks
const activeTypingIntervals = new Map<string, NodeJS.Timeout>();

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log(...args);
  }
}

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

async function getTenantSettings(tenantId: string): Promise<{ businessName: string; welcomeMessage: string; welcomeMessageEnabled: boolean }> {
  try {
    const adminDb = getAdminDb();
    
    // PRIORITY 1: Fetch from tenants collection (most accurate - primary source)
    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
    
    if (tenantDoc.exists) {
      const tenantData = tenantDoc.data();
      return {
        businessName: tenantData?.businessName || "Our Shop",
        welcomeMessage: tenantData?.welcomeMessage || `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
        welcomeMessageEnabled: tenantData?.welcomeMessageEnabled ?? true
      };
    }
    
    // Fallback: whatsappSettings collection
    const whatsappQuery = await adminDb.collection("whatsappSettings").where("tenantId", "==", tenantId).get();
    
    if (!whatsappQuery.empty) {
      const data = whatsappQuery.docs[0].data();
      return {
        businessName: data?.businessName || "Our Shop",
        welcomeMessage: data?.welcomeMessage || `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
        welcomeMessageEnabled: data?.welcomeMessageEnabled ?? true
      };
    }
    
    const profileDoc = await adminDb.collection("businessProfiles").doc(tenantId).get();
    
    if (profileDoc.exists) {
      const data = profileDoc.data();
      return {
        businessName: data?.businessName || "Our Shop",
        welcomeMessage: `Hello! 👋 Welcome to ${data?.businessName || "our shop"}.\n\nWe're excited to connect with you! How can we help you today?`,
        welcomeMessageEnabled: true
      };
    }
    
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

// ============================================
// FUZZY MATCHING HELPER (Levenshtein distance)
// ============================================
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function isFuzzyMatch(str: string, searchTerm: string, maxDistance: number = 2): boolean {
  if (!str || !searchTerm) return false;
  
  const strLower = str.toLowerCase();
  const termLower = searchTerm.toLowerCase();
  
  if (strLower.includes(termLower)) return true;
  
  const words = strLower.split(/\s+/);
  for (const word of words) {
    const distance = levenshteinDistance(word, termLower);
    if (distance <= maxDistance && word.length > 3) {
      return true;
    }
    if (termLower.length > 3 && word.length > 3) {
      const termDistance = levenshteinDistance(termLower, word);
      if (termDistance <= maxDistance) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Send typing indicator to show "..." in WhatsApp
 */
async function sendTypingIndicator(
  tenantId: string,
  phoneNumber: string,
  action: "composing" | "paused" | "recording" = "composing"
): Promise<void> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      return;
    }

    const typingAction = action === "composing" ? "composing" : "paused";

    await fetch(`${evolutionApiUrl}/chat/updatePresence/${tenantId}`, {
      method: "POST",
      headers: {
        apikey: evolutionApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number: phoneNumber,
        presence: typingAction,
      }),
    });
    
    debugLog(`[Webhook] Typing indicator sent: ${typingAction}`);
  } catch (error) {
    debugLog(`[Webhook] Typing indicator error:`, error);
  }
}

/**
 * Start continuous typing indicator that refreshes every 4 seconds
 */
async function startTypingIndicator(tenantId: string, phone: string): Promise<void> {
  const existingInterval = activeTypingIntervals.get(phone);
  if (existingInterval) {
    clearInterval(existingInterval);
  }
  
  await sendTypingIndicator(tenantId, phone, "composing");
  
  const interval = setInterval(async () => {
    await sendTypingIndicator(tenantId, phone, "composing");
  }, 4000);
  
  activeTypingIntervals.set(phone, interval);
  debugLog(`[Webhook] Started typing indicator for ${phone}`);
}

/**
 * Stop typing indicator and clean up interval
 */
async function stopTypingIndicator(tenantId: string, phone: string): Promise<void> {
  const interval = activeTypingIntervals.get(phone);
  if (interval) {
    clearInterval(interval);
    activeTypingIntervals.delete(phone);
  }
  await sendTypingIndicator(tenantId, phone, "paused");
  debugLog(`[Webhook] Stopped typing indicator for ${phone}`);
}

async function getBusinessContext(tenantId: string): Promise<AIContext> {
  try {
    debugLog("[Webhook] Starting to fetch business context...");
    debugLog("[Webhook] Tenant ID:", tenantId);
    
    const db = getAdminDb();
    
    if (!db) {
      console.error("[Webhook] ❌ Failed to initialize database");
      return { businessName: "Our Shop", products: [], services: [] };
    }
    
    const fetchWithTimeout = <T>(promise: Promise<T>, timeoutMs: number = 5000): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };
    
    const [tenantSnap, productsSnap, servicesSnap] = await Promise.all([
      fetchWithTimeout(db.collection("tenants").doc(tenantId).get()),
      fetchWithTimeout(db.collection("products")
        .where("tenantId", "==", tenantId)
        .where("status", "==", "active")
        .limit(20)
        .get()),
      fetchWithTimeout(db.collection("services")
        .where("tenantId", "==", tenantId)
        .where("status", "==", "active")
        .limit(20)
        .get())
    ]);
    
    const businessName = tenantSnap.exists ? tenantSnap.data()?.businessName || "Our Shop" : "Our Shop";
    
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
        bookingUrl: data.bookingUrl || null,
      };
    });
    
    const [profileSnap, shippingSnap, productSettingsSnap, serviceSettingsSnap, hierarchySnap] = await Promise.all([
      db.collection("businessProfiles").doc(tenantId).get(),
      db.collection("shippingMethods").where("tenantId", "==", tenantId).get(),
      db.collection("productSettings").doc(tenantId).get(),
      db.collection("serviceSettings").doc(tenantId).get(),
      db.collection("productCategories").where("tenantId", "==", tenantId).get(),
    ]);
    
    const businessProfile = profileSnap.exists ? profileSnap.data() : null;
    
    const shippingMethods = shippingSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; name: string; price: number; estimatedDays?: string; description?: string }>;
    
    const productSettings = productSettingsSnap.exists ? productSettingsSnap.data() : null;
    const serviceSettings = serviceSettingsSnap.exists ? serviceSettingsSnap.data() : null;
    
    const productCategoryHierarchy = hierarchySnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || doc.id,
        description: data.description || "",
        subcategories: data.subcategories || [],
        brands: data.brands || [],
        productCount: data.productCount || products.filter(p => p.category === doc.id).length,
      };
    });
    
    const context = {
      businessName,
      products,
      productCategories: productCategoryHierarchy.length > 0 ? productCategoryHierarchy.map(c => ({
        id: c.id,
        name: c.name,
        icon: undefined,
        productCount: c.productCount,
      })) : undefined,
      productCategoryHierarchy: productCategoryHierarchy.length > 0 ? productCategoryHierarchy : undefined,
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
        paymentMethods: businessProfile.paymentMethods,
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
    
    debugLog("[Webhook] Context built successfully ✅");
    return context;
  } catch (error) {
    console.error("[Webhook] Error getting business context:", error);
    
    try {
      await logWebhookError(
        tenantId,
        "BUSINESS_CONTEXT_ERROR",
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
        { step: "getBusinessContext" }
      );
    } catch (logError) {
      console.error("[Webhook] Failed to log error to Firestore:", logError);
    }
    
    return {
      businessName: "Our Shop",
      products: [],
      services: [],
    };
  }
}

export async function sendWelcomeMenu(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  const settings = await getTenantSettings(tenantId);
  const businessName = settings.businessName;
  
  let cartNote = '';
  try {
    const adminDb = getAdminDb();
    const convoDoc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .get();
    
    const cartData = convoDoc.data()?.cart;
    if (cartData && cartData.items && cartData.items.length > 0) {
      cartNote = `\n\n🛒 *You have ${cartData.items.length} item(s) in your cart*\nReply *VIEW CART* to checkout`;
    }
  } catch (err) {
    console.error('[Webhook] Error checking cart:', err);
  }
  
  let welcomeText: string;
  if (settings.welcomeMessageEnabled && settings.welcomeMessage) {
    welcomeText = settings.welcomeMessage.replace(/\{\{business_name\}\}/g, businessName);
  } else {
    welcomeText = `Hello! 👋 Welcome to *${businessName}*!\n\nHow can we help you today?`;
  }
  
  const menuMsg = `${welcomeText}\n\n` +
    `1️⃣ Browse Products\n` +
    `2️⃣ Browse Services\n` +
    `3️⃣ 🔍 Search Products\n` +
    `4️⃣ 🔍 Search Services\n` +
    `5️⃣ Check Order Status\n` +
    `6️⃣ Payment Info\n` +
    `7️⃣ Talk to Support${cartNote}\n\n` +
    `*Reply with a number (1-7)*`;
  
  await stopTypingIndicator(tenantId, phone);
  await sendEvolutionMessage(tenantId, phone, menuMsg);
  
  const adminDb = getAdminDb();
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .collection("messages")
    .doc(`ai_${Date.now()}`)
    .set({
      text: menuMsg,
      from: tenantId,
      fromMe: true,
      sender: "business",
      timestamp: new Date(),
      status: "sent",
      createdAt: new Date(),
      isAI: false,
    });
    
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'main_menu',
        currentStep: 'waiting_for_selection',
        selections: {},
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

function parseMenuSelection(message: string): number | null {
  const trimmed = message.trim();
  const wordCount = trimmed.split(/\s+/).length;
  
  const num = parseInt(trimmed);
  if (!isNaN(num) && num >= 1 && num <= 7) {
    return num;
  }
  
  if (wordCount <= 3) {
    const lower = trimmed.toLowerCase();
    if (lower === 'products' || lower === 'browse' || lower === 'product') return 1;
    if (lower === 'services' || lower === 'service') return 2;
    if (lower === 'search' || lower === 'find') return 3;
    if (lower === 'order' || lower === 'orders' || lower === 'track') return 4;
    if (lower === 'payment' || lower === 'payments' || lower === 'pay') return 5;
    if (lower === 'support' || lower === 'help') return 6;
  }
  
  return null;
}

async function startSearchFlow(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  const response = `🔍 *Product Search*\n\n` +
    `Please type the product you're looking for.\n\n` +
    `📝 *Examples:*\n` +
    `• "asus laptop"\n` +
    `• "red dress"\n` +
    `• "iPhone 14"\n\n` +
    `0️⃣ - Back to main menu`;
  
  await stopTypingIndicator(tenantId, phone);
  await sendEvolutionMessage(tenantId, phone, response);
  
  const adminDb = getAdminDb();
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'search_prompt',
        currentStep: 'waiting_for_search_term',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

async function startServiceSearchFlow(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  const response = `🔍 *Service Search*\n\n` +
    `Please type the service you're looking for.\n\n` +
    `📝 *Examples:*\n` +
    `• "haircut"\n` +
    `• "massage"\n` +
    `• "consultation"\n\n` +
    `0️⃣ - Back to main menu`;
  
  await stopTypingIndicator(tenantId, phone);
  await sendEvolutionMessage(tenantId, phone, response);
  
  const adminDb = getAdminDb();
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'service_search_prompt',
        currentStep: 'waiting_for_search_term',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

async function handleMenuSelection(tenantId: string, phone: string, selection: number): Promise<void> {
  switch (selection) {
    case 1:
      debugLog("[Webhook] Starting product browse flow");
      const productDeps: ProductBrowseDeps = { 
        sendMessage: sendEvolutionMessage,
        sendMedia: sendEvolutionMedia,
        startTyping: startTypingIndicator,
        stopTyping: stopTypingIndicator,
        sendWelcomeMenu: sendWelcomeMenu,
        debugLog: debugLog,
        checkIfSearchQuery: checkIfSearchQuery,
        handleProductSearch: handleProductSearch,
      };
      await startProductBrowseFlow(tenantId, phone, productDeps);
      break;
      
    case 2:
      debugLog("[Webhook] Starting service browse flow");
      const serviceDeps: ServiceBrowseDeps = { 
        sendMessage: sendEvolutionMessage,
        sendMedia: sendEvolutionMedia,
        startTyping: startTypingIndicator,
        stopTyping: stopTypingIndicator,
        sendWelcomeMenu: sendWelcomeMenu,
      };
      await startServiceBrowseFlow(tenantId, phone, serviceDeps);
      break;
      
    case 3:
      debugLog("[Webhook] Starting product search flow");
      await startSearchFlow(tenantId, phone);
      break;
      
    case 4:
      debugLog("[Webhook] Starting service search flow");
      await startServiceSearchFlow(tenantId, phone);
      break;
      
    case 5:
      debugLog("[Webhook] Order status requested");
      await sendOrderStatusInfo(tenantId, phone);
      break;
      
    case 6:
      debugLog("[Webhook] Payment info requested");
      await sendPaymentInfo(tenantId, phone);
      break;
      
    case 7:
      debugLog("[Webhook] Support requested");
      await sendSupportInfo(tenantId, phone);
      break;
      
    default:
      debugLog("[Webhook] Unknown menu selection:", selection);
      await sendEvolutionMessage(tenantId, phone, "❌ Invalid selection. Please reply with a number 1-7.");
  }
}

async function handleFlowInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any
): Promise<void> {
  const { flowName, currentStep, selections } = flowState;
  
  // Debug log
  console.log(`[Webhook] handleFlowInput - flowName: ${flowName}, currentStep: ${currentStep}, message: ${message}`);
  
  if (message.trim().toUpperCase() === 'VIEW CART' || message.trim().toUpperCase() === 'CART') {
    await handleViewCart(tenantId, phone);
    return;
  }
  
  if (message.trim().toUpperCase() === 'CLEAR CART') {
    await handleClearCart(tenantId, phone);
    return;
  }
  
  if (message.trim().toLowerCase() === 'menu') {
    await sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  // Note: '0' is handled at the top level before handleFlowInput is called
  
  // Handle similar products selection
  if (flowName === 'similar_products_selection') {
    if (currentStep === 'waiting_for_selection') {
      const num = parseInt(message.trim());
      const similarProducts = selections.similarProducts || [];
      
      if (isNaN(num) || num < 1 || num > similarProducts.length) {
        if (message.trim().toLowerCase() === 'menu') {
          await sendWelcomeMenu(tenantId, phone);
          return;
        }
        await sendEvolutionMessage(tenantId, phone, 
          `❌ Invalid selection. Please reply with a number from 1-${similarProducts.length} to see product details, or *0* to go back.`
        );
        return;
      }
      
      const selectedProduct = similarProducts[num - 1];
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://yourdomain.com';
      const orderLink = `${baseUrl}/order?tenant=${tenantId}&product=${selectedProduct.id}&phone=${phone}`;
      
      let productDetails = `🔍 *You selected:*\n\n`;
      productDetails += `*${selectedProduct.name}*\n`;
      productDetails += `💰 KES ${selectedProduct.price?.toLocaleString() || 'N/A'}\n`;
      if (selectedProduct.brand) productDetails += `🏷️ Brand: ${selectedProduct.brand}\n`;
      if (selectedProduct.category || selectedProduct.categoryName) {
        productDetails += `📂 Category: ${selectedProduct.category || selectedProduct.categoryName}\n`;
      }
      if (selectedProduct.description) {
        productDetails += `\n📝 ${selectedProduct.description.substring(0, 200)}${selectedProduct.description.length > 200 ? '...' : ''}\n`;
      }
      productDetails += `\n🛒 Order: ${orderLink}\n\n`;
      productDetails += `Reply *0* to go back or *MENU* for main menu.`;
      
      const imageUrl = selectedProduct.image || selectedProduct.images?.[0];
      if (imageUrl) {
        await sendEvolutionMedia(tenantId, phone, imageUrl, productDetails);
      } else {
        await sendEvolutionMessage(tenantId, phone, productDetails);
      }
      
      // Clear the flow state
      await setFlowState(tenantId, phone, {
        flowState: FieldValue.delete()
      });
      return;
    }
  }
  
  if (flowName === 'search_prompt') {
    if (currentStep === 'waiting_for_search_term') {
      const trimmed = message.trim();
      
      if (trimmed === '0') {
        await sendWelcomeMenu(tenantId, phone);
        return;
      }
      
      if (trimmed.length < 2) {
        await sendEvolutionMessage(tenantId, phone, 
          "❌ Please enter a valid search term (at least 2 characters).\n\n" +
          "Example: 'laptop', 'red shoes', 'iPhone'\n\n" +
          "Or reply *0* to go back."
        );
        return;
      }
      
      await handleProductSearchHandler(
        tenantId,
        phone,
        trimmed,
        {
          sendTypingIndicator: startTypingIndicator,
          stopTypingIndicator: stopTypingIndicator,
          sendMessage: sendEvolutionMessage,
          sendMedia: sendEvolutionMedia,
          setFlowState: setFlowState,
        }
      );
      return;
    }
  }
  
  if (flowName === 'service_search_prompt') {
    if (currentStep === 'waiting_for_search_term') {
      const trimmed = message.trim();
      
      if (trimmed === '0') {
        await sendWelcomeMenu(tenantId, phone);
        return;
      }
      
      if (trimmed.length < 2) {
        await sendEvolutionMessage(tenantId, phone, 
          "❌ Please enter a valid search term (at least 2 characters).\n\n" +
          "Example: 'haircut', 'massage', 'consultation'\n\n" +
          "Or reply *0* to go back."
        );
        return;
      }
      
      await handleServiceSearchHandler(
        tenantId,
        phone,
        trimmed,
        {
          sendTypingIndicator: startTypingIndicator,
          stopTypingIndicator: stopTypingIndicator,
          sendMessage: sendEvolutionMessage,
          sendMedia: sendEvolutionMedia,  // ⭐ ADDED: Support for service images
          setFlowState: setFlowState,
        }
      );
      return;
    }
  }
  
  if (flowName === 'product_browse') {
    const productDeps: ProductBrowseDeps = { 
      sendMessage: sendEvolutionMessage,
      sendMedia: sendEvolutionMedia,
      startTyping: startTypingIndicator,
      stopTyping: stopTypingIndicator,
      sendWelcomeMenu: sendWelcomeMenu,
      debugLog: debugLog,
      checkIfSearchQuery: checkIfSearchQuery,
      handleProductSearch: handleProductSearch,
    };
    await handleProductBrowseInput(tenantId, phone, message, flowState, productDeps);
    return;
  }
  
  if (flowName === 'service_browse') {
    const deps: ServiceBrowseDeps = { 
      sendMessage: sendEvolutionMessage,
      sendMedia: sendEvolutionMedia,
      startTyping: startTypingIndicator,
      stopTyping: stopTypingIndicator,
      sendWelcomeMenu: sendWelcomeMenu,
    };
    await handleServiceBrowseInput(tenantId, phone, message, flowState, deps);
    return;
  }
  
  // Handle order status flows
  if (flowName === 'order_status_lookup') {
    const deps: OrderStatusDeps = { 
      sendMessage: sendEvolutionMessage,
      startTyping: startTypingIndicator,
      stopTyping: stopTypingIndicator
    };
    await handleOrderStatusLookup(tenantId, phone, message, deps);
    return;
  }
  
  if (flowName === 'order_status_selection') {
    const deps: OrderStatusDeps = { 
      sendMessage: sendEvolutionMessage,
      startTyping: startTypingIndicator,
      stopTyping: stopTypingIndicator
    };
    console.log(`[Webhook] Routing to order_status_selection with message: ${message}`);
    await handleOrderStatusSelection(tenantId, phone, message, flowState, deps);
    return;
  }
  
  // Handle order cancellation flow
  if (flowName === 'order_cancellation') {
    const deps: OrderStatusDeps = { 
      sendMessage: sendEvolutionMessage,
      startTyping: startTypingIndicator,
      stopTyping: stopTypingIndicator
    };
    await handleOrderCancellation(tenantId, phone, message, flowState, deps);
    return;
  }
  
  if (flowName === 'product_search') {
    await handleProductSearchInput(tenantId, phone, message, flowState);
    return;
  }
  
  // ⭐ ADD THIS — Handle service search results navigation
  if (flowName === 'service_search') {
    await handleServiceSearchInput(tenantId, phone, message, flowState);
    return;
  }
  
  // ⭐ ADD THIS — Handle "did you mean?" service suggestions
  if (flowName === 'similar_services_selection') {
    const num = parseInt(message.trim());
    const similarServices = flowState.similarServices || [];

    if (isNaN(num) || num < 1 || num > similarServices.length) {
      await stopTypingIndicator(tenantId, phone);
      await sendEvolutionMessage(tenantId, phone,
        `❌ Invalid selection. Reply with 1-${similarServices.length} or *0* to go back.`
      );
      return;
    }

    const selected = similarServices[num - 1];
    const name = selected.serviceName || selected.name;
    let msg = `✅ *${name}*\n`;
    if (selected.packagePrices?.basic) msg += `💰 KES ${selected.packagePrices.basic.toLocaleString()}\n`;
    else if (selected.priceMin) msg += `💰 KES ${selected.priceMin.toLocaleString()}${selected.priceMax && selected.priceMax !== selected.priceMin ? ` - ${selected.priceMax.toLocaleString()}` : ''}\n`;
    if (selected.duration) msg += `⏱️ Duration: ${selected.duration}\n`;
    if (selected.businessCategory) msg += `📂 ${selected.businessCategory}\n`;
    if (selected.subcategoryName) msg += `📁 ${selected.subcategoryName}\n`;
    if (selected.description) msg += `\n📝 ${selected.description.substring(0, 200)}${selected.description.length > 200 ? '...' : ''}\n`;
    if (selected.bookingUrl) msg += `\n🛒 Book: ${selected.bookingUrl}`;
    else msg += `\n💬 Reply *BOOK* to book this service`;
    msg += `\n\nReply *0* to go back or *MENU* for main menu.`;

    const imageUrl = selected.imageUrl || selected.portfolioImages?.[0];
    await stopTypingIndicator(tenantId, phone);
    if (imageUrl) {
      await sendEvolutionMedia(tenantId, phone, imageUrl, msg);
    } else {
      await sendEvolutionMessage(tenantId, phone, msg);
    }

    // ⭐ FIXED: Use FieldValue.delete() to properly clear flow state
    const adminDb = getAdminDb();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({ flowState: FieldValue.delete() }, { merge: true });
    return;
  }
}

async function handleProductSearchInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any
): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  const adminDb = getAdminDb();
  const { currentStep, searchQuery } = flowState;
  const allResults = flowState.allResults || [];
  const trimmed = message.trim();
  const num = parseInt(trimmed);
  
  if (!isNaN(num)) {
    if (num === 1 && currentStep === 'search_results') {
      const currentIndex = flowState.currentIndex || 0;
      const nextIndex = currentIndex + 5;
      const nextBatch = allResults.slice(nextIndex, nextIndex + 5);
      
      if (nextBatch.length === 0) {
        await stopTypingIndicator(tenantId, phone);
        await sendEvolutionMessage(tenantId, phone, "✅ No more products to show.\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu");
        return;
      }
      
      for (let idx = 0; idx < nextBatch.length; idx++) {
        const product = nextBatch[idx];
        const imageUrl = product.image || product.images?.[0];
        
        let productText = `*${idx + 1}. ${product.name}*\n`;

        if (product.salePrice && product.salePrice < product.price) {
          productText += `   💰 ~~KES ${product.price?.toLocaleString()}~~ → *KES ${product.salePrice.toLocaleString()}* 🔥\n`;
        } else {
          productText += `   💰 KES ${product.price?.toLocaleString() || 'N/A'}\n`;
        }

        if (product.stock !== undefined) {
          const stockLabel = product.stock === 0
            ? '❌ Out of stock'
            : product.stock <= 5
              ? `⚠️ Only ${product.stock} left`
              : `✅ In stock (${product.stock})`;
          productText += `   📦 ${stockLabel}\n`;
        }

        if (product.description) {
          productText += `   📝 ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
        }

        if (product.brand) {
          productText += `   🏷️ Brand: ${product.brand}\n`;
        }
        
        if (product.category || product.categoryName) {
          productText += `   📂 Category: ${product.category || product.categoryName}\n`;
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://yourdomain.com';
        const orderLink = `${baseUrl}/order?tenant=${tenantId}&product=${product.id}&phone=${phone}`;
        productText += `   🛒 Order: ${orderLink}\n\n`;

        if (imageUrl) {
          await sendEvolutionMedia(tenantId, phone, imageUrl, productText);
        } else {
          await sendEvolutionMessage(tenantId, phone, productText);
        }
        
        if (idx < nextBatch.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 600));
        }
      }
      
      const remaining = allResults.length - (nextIndex + 5);
      let responseText = '';
      if (remaining > 0) {
        responseText = `\n*Reply with a number:*\n1️⃣ - View More (${remaining} more)\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
      } else {
        responseText = `\n*Reply with a number:*\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
      }
      
      await stopTypingIndicator(tenantId, phone);
      await sendEvolutionMessage(tenantId, phone, responseText);
      
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            ...flowState,
            currentIndex: nextIndex,
            lastActivity: new Date().toISOString(),
          }
        }, { merge: true });
      
      return;
    } else if (num === 2 || num === 3) {
      await stopTypingIndicator(tenantId, phone);
      const productDeps: ProductBrowseDeps = { 
        sendMessage: sendEvolutionMessage,
        sendMedia: sendEvolutionMedia,
        startTyping: startTypingIndicator,
        stopTyping: stopTypingIndicator,
        sendWelcomeMenu: sendWelcomeMenu,
        debugLog: debugLog,
        checkIfSearchQuery: checkIfSearchQuery,
        handleProductSearch: handleProductSearch,
      };
      await startProductBrowseFlow(tenantId, phone, productDeps);
      return;
    } else if (num === 4) {
      await stopTypingIndicator(tenantId, phone);
      await sendWelcomeMenu(tenantId, phone);
      return;
    }
  }
  
  if (checkIfSearchQuery(trimmed)) {
    await stopTypingIndicator(tenantId, phone);
    await handleProductSearchHandler(
      tenantId,
      phone,
      trimmed,
      {
        sendTypingIndicator: startTypingIndicator,
        stopTypingIndicator: stopTypingIndicator,
        sendMessage: sendEvolutionMessage,
        sendMedia: sendEvolutionMedia,
        setFlowState: setFlowState,
      }
    );
  } else {
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone,
      "❌ Invalid selection. Please reply with a number:\n\n1️⃣ - View More\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu"
    );
  }
}

async function handleServiceSearchInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any
): Promise<void> {
  await startTypingIndicator(tenantId, phone);

  const adminDb = getAdminDb();
  const { currentStep, allResults = [], searchQuery } = flowState;
  const trimmed = message.trim();
  const num = parseInt(trimmed);

  if (!isNaN(num)) {
    // "View More"
    if (num === 1 && currentStep === 'search_results') {
      const currentIndex = flowState.currentIndex || 0;
      const nextIndex = currentIndex + 5;
      const nextBatch = allResults.slice(nextIndex, nextIndex + 5);

      if (nextBatch.length === 0) {
        await stopTypingIndicator(tenantId, phone);
        await sendEvolutionMessage(tenantId, phone, "✅ No more services to show.\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu");
        return;
      }

      for (let idx = 0; idx < nextBatch.length; idx++) {
        const service = nextBatch[idx];
        const name = service.serviceName || service.name;
        let text = `*${idx + 1}. ${name}*\n`;
        if (service.packagePrices?.basic) text += `   💰 KES ${service.packagePrices.basic.toLocaleString()}\n`;
        else if (service.priceMin) text += `   💰 KES ${service.priceMin.toLocaleString()}${service.priceMax && service.priceMax !== service.priceMin ? ` - ${service.priceMax.toLocaleString()}` : ''}\n`;
        if (service.duration) text += `   ⏱️ ${service.duration}\n`;
        if (service.businessCategory) text += `   📂 ${service.businessCategory}\n`;
        if (service.bookingUrl) text += `\n   🛒 Book: ${service.bookingUrl}`;
        else text += `\n   💬 Reply *${idx + 1}* to book`;

        const imageUrl = service.imageUrl || service.portfolioImages?.[0];
        if (imageUrl) await sendEvolutionMedia(tenantId, phone, imageUrl, text);
        else await sendEvolutionMessage(tenantId, phone, text);

        if (idx < nextBatch.length - 1) await new Promise(r => setTimeout(r, 600));
      }

      const remaining = allResults.length - (nextIndex + 5);
      const replyMsg = remaining > 0
        ? `\n*Reply:*\n1️⃣ - View More (${remaining} more)\n2️⃣ - Go back\n3️⃣ - Main Menu`
        : `\n*Reply:*\n2️⃣ - Go back\n3️⃣ - Main Menu`;

      await stopTypingIndicator(tenantId, phone);
      await sendEvolutionMessage(tenantId, phone, replyMsg);
      
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            ...flowState,
            currentIndex: nextIndex,
            lastActivity: new Date().toISOString(),
          }
        }, { merge: true });
      
      return;
    }

    // Go back / browse services
    if (num === 2) {
      await stopTypingIndicator(tenantId, phone);
      const serviceDeps: ServiceBrowseDeps = {
        sendMessage: sendEvolutionMessage,
        sendMedia: sendEvolutionMedia,
        startTyping: startTypingIndicator,
        stopTyping: stopTypingIndicator,
        sendWelcomeMenu: sendWelcomeMenu,
      };
      await startServiceBrowseFlow(tenantId, phone, serviceDeps);
      return;
    }

    // Main menu
    if (num === 3) {
      await stopTypingIndicator(tenantId, phone);
      await sendWelcomeMenu(tenantId, phone);
      return;
    }
  }

  // Fallback
  await stopTypingIndicator(tenantId, phone);
  await sendEvolutionMessage(tenantId, phone,
    "❌ Invalid selection.\n\n*Reply:*\n1️⃣ - View More\n2️⃣ - Go back\n3️⃣ - Main Menu"
  );
}

async function sendOrderStatusInfo(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  const deps: OrderStatusDeps = { 
    sendMessage: sendEvolutionMessage,
    startTyping: startTypingIndicator,
    stopTyping: stopTypingIndicator
  };
  
  await startOrderStatusFlow(tenantId, phone, deps);
  
  await stopTypingIndicator(tenantId, phone);
}

async function sendPaymentInfo(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  try {
    const adminDb = getAdminDb();
    const profileSnap = await adminDb.collection("businessProfiles").doc(tenantId).get();
    const paymentMethods = profileSnap.exists ? profileSnap.data()?.paymentMethods : null;
    
    let response: string;
    if (paymentMethods && paymentMethods.length > 0) {
      const paymentList = paymentMethods.map((method: any) => `• ${method.name}${method.details ? ` - ${method.details}` : ''}`).join('\n');
      response = `💳 *Payment Methods*\n\n${paymentList}\n\nWhich payment method would you like to use?`;
    } else {
      response = "💳 We accept:\n\n• M-Pesa\n• Bank Transfer\n• Cash on Delivery\n\nWhich payment method would you like to use?";
    }
    
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, response);
  } catch (error) {
    console.error('[Webhook] Error fetching payment methods:', error);
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, "💳 We accept:\n\n• M-Pesa\n• Bank Transfer\n• Cash on Delivery\n\nWhich payment method would you like to use?");
  }
}

async function sendSupportInfo(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  await stopTypingIndicator(tenantId, phone);
  await sendEvolutionMessage(tenantId, phone, "🆘 Our support team is here to help! Please describe your issue and we'll assist you.");
}

async function handleViewCart(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  try {
    const adminDb = getAdminDb();
    
    const convoDoc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .get();
    
    const cartData = convoDoc.data()?.cart;
    
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      await stopTypingIndicator(tenantId, phone);
      await sendEvolutionMessage(tenantId, phone, "🛒 *Your cart is empty*\n\nBrowse products and add items to your cart to see them here!\n\nReply *1* to browse products or *MENU* for main menu.");
      return;
    }
    
    let cartMessage = `🛒 *Your Cart* (${cartData.items.length} item(s))\n\n`;
    let total = 0;
    
    cartData.items.forEach((item: any, idx: number) => {
      const itemTotal = (item.price || 0) * (item.quantity || 1);
      total += itemTotal;
      
      cartMessage += `${idx + 1}. *${item.name}*\n`;
      cartMessage += `   💰 KES ${(item.price || 0).toLocaleString()} x ${item.quantity || 1}\n`;
      
      if (item.specs && Object.keys(item.specs).length > 0) {
        const specDetails = Object.entries(item.specs)
          .map(([key, val]) => `${key}: ${val}`)
          .join(', ');
        cartMessage += `   📝 ${specDetails}\n`;
      }
      
      cartMessage += `   Subtotal: KES ${itemTotal.toLocaleString()}\n\n`;
    });
    
    cartMessage += `━━━━━━━━━━━━━━━\n`;
    cartMessage += `*TOTAL: KES ${total.toLocaleString()}*\n\n`;
    cartMessage += `*To checkout:*\n`;
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://yourdomain.com';
    const firstItem = cartData.items[0];
    
    const orderLinkUrl = cartData.items.length === 1 && firstItem
      ? `${baseUrl}/order?tenant=${tenantId}&product=${firstItem.productId}&phone=${phone}`
      : `${baseUrl}?tenant=${tenantId}`;
    
    let checkoutMessage = '';
    if (cartData.items.length === 1 && firstItem) {
      checkoutMessage = `🔗 Complete checkout: ${orderLinkUrl}`;
    } else {
      checkoutMessage = `🔗 Continue shopping: ${orderLinkUrl}\n\n⚠️ *Note:* For multiple items, please visit our store and add each item to cart before checkout.`;
    }
    
    cartMessage += checkoutMessage;
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        'cart.orderLink': orderLinkUrl
      }, { merge: true });
    
    cartMessage += `\n\n💡 Or reply *CLEAR CART* to empty your cart.`;
    
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, cartMessage);
  } catch (err) {
    console.error('[Webhook] Error viewing cart:', err);
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, "❌ Unable to retrieve your cart. Please try again later.");
  }
}

async function handleClearCart(tenantId: string, phone: string): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  try {
    const adminDb = getAdminDb();
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        cart: FieldValue.delete(),
      }, { merge: true });
    
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, "🗑️ *Cart cleared!*\n\nYour cart is now empty. Browse products to add new items!\n\nReply *1* to browse products or *MENU* for main menu.");
  } catch (err) {
    console.error('[Webhook] Error clearing cart:', err);
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, "❌ Unable to clear cart. Please try again later.");
  }
}

function checkIfGreeting(message: string): boolean {
  const greetings = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'greetings', 'howdy', 'sup', 'whats up', 'what\'s up'
  ];
  const lowerMsg = message.toLowerCase().trim();
  return greetings.some(greeting => lowerMsg === greeting || lowerMsg.startsWith(greeting + ' '));
}

async function setFlowState(
  tenantId: string,
  phone: string,
  flowState: any
): Promise<void> {
  const adminDb = getAdminDb();
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({ flowState }, { merge: true });
}

function checkIfSearchQuery(message: string): boolean {
  const lowerMsg = message.toLowerCase().trim();
  
  const searchPatterns = [
    /^looking for\s+/i,
    /^searching for\s+/i,
    /^i want (a|an)?\s+/i,
    /^i need (a|an)?\s+/i,
    /^do you have\s+/i,
    /\bsearch for\b/i,
  ];
  
  if (lowerMsg.length <= 3) return false;
  if (lowerMsg === 'menu' || lowerMsg === 'back' || lowerMsg === 'help' || lowerMsg === '0') return false;
  if (/^\d+$/.test(lowerMsg)) return false;
  
  return searchPatterns.some(pattern => pattern.test(lowerMsg));
}

// ============================================
// ENHANCED PRODUCT SEARCH with Similar Products Support
// ============================================
async function handleProductSearch(
  tenantId: string,
  phone: string,
  query: string
): Promise<void> {
  await startTypingIndicator(tenantId, phone);
  
  try {
    debugLog(`[Webhook] Handling product search: "${query}"`);
    
    let searchTerm = query
      .replace(/^(am looking for|i am looking for|looking for|searching for|want to buy|need to buy|do you have|show me|find|i want|i need|can i get)\s+/i, '')
      .trim();
    
    if (!searchTerm) {
      searchTerm = query.trim();
    }
    
    debugLog(`[Webhook] Extracted search term: "${searchTerm}"`);
    
    const adminDb = getAdminDb();
    
    const productsSnap = await adminDb
      .collection("products")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .get();
    
    if (productsSnap.empty) {
      await stopTypingIndicator(tenantId, phone);
      await sendEvolutionMessage(
        tenantId,
        phone,
        `🔍 No products found for "${searchTerm}".\n\nTry searching with different keywords or browse our categories!\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu`
      );
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const allProducts = productsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const scoredProducts = allProducts.map((product: any) => {
      let score = 0;
      
      const name = (product.name || "").toLowerCase();
      const brand = (product.brand || "").toLowerCase();
      const category = (product.category || product.categoryName || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      
      if (name === searchLower) score += 200;
      if (name.startsWith(searchLower)) score += 150;
      if (name.includes(searchLower)) score += 100;
      if (isFuzzyMatch(name, searchLower, 2) && !name.includes(searchLower)) score += 80;
      
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      const nameWords = name.split(/\s+/);
      
      for (const searchWord of searchWords) {
        for (const nameWord of nameWords) {
          if (nameWord === searchWord) score += 60;
          else if (nameWord.includes(searchWord) || searchWord.includes(nameWord)) score += 30;
        }
      }
      
      if (brand === searchLower) score += 80;
      else if (brand.includes(searchLower)) score += 50;
      else if (isFuzzyMatch(brand, searchLower, 2)) score += 30;
      
      if (category === searchLower) score += 60;
      else if (category.includes(searchLower)) score += 40;
      else if (isFuzzyMatch(category, searchLower, 2)) score += 20;
      
      if (description.includes(searchLower)) score += 15;
      else if (isFuzzyMatch(description, searchLower, 3)) score += 10;
      
      return { ...product, score };
    }).filter((p: any) => p.score > 0);
    
    scoredProducts.sort((a: any, b: any) => b.score - a.score);
    
    debugLog(`[Webhook] Search found ${scoredProducts.length} matching products for "${searchTerm}"`);
    
    let similarProducts: any[] = [];
    if (scoredProducts.length === 0) {
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      
      for (const product of allProducts) {
        const name = (product.name || "").toLowerCase();
        let matchScore = 0;
        
        for (const searchWord of searchWords) {
          if (name.includes(searchWord)) matchScore += 10;
        }
        
        if (matchScore > 0) {
          similarProducts.push({ ...product, matchScore });
        }
      }
      
      similarProducts.sort((a, b) => b.matchScore - a.matchScore);
      similarProducts.splice(5);
    }
    
    if (scoredProducts.length === 0 && similarProducts.length > 0) {
      await stopTypingIndicator(tenantId, phone);
      
      let suggestionMessage = `🔍 *No exact match for "${searchTerm}"*\n\n💡 *Did you mean?*\n\n`;
      
      similarProducts.forEach((product: any, idx: number) => {
        suggestionMessage += `${idx + 1}. *${product.name}* - KES ${product.price?.toLocaleString()}\n`;
        if (product.brand) suggestionMessage += `   🏷️ ${product.brand}\n`;
        if (product.category || product.categoryName) {
          suggestionMessage += `   📂 ${product.category || product.categoryName}\n`;
        }
        suggestionMessage += `\n`;
      });
      
      suggestionMessage += `Reply with a number to see product details, or *0* to go back.\n\nOr try searching with different keywords!`;
      
      await sendEvolutionMessage(tenantId, phone, suggestionMessage);
      
      await setFlowState(tenantId, phone, {
        flowName: 'similar_products_selection',
        currentStep: 'waiting_for_selection',
        similarProducts: similarProducts,
        originalQuery: searchTerm,
        isActive: true,
        lastActivity: new Date().toISOString(),
      });
      return;
    }
    
    if (scoredProducts.length === 0) {
      await stopTypingIndicator(tenantId, phone);
      await sendEvolutionMessage(
        tenantId,
        phone,
        `🔍 No products found for "${searchTerm}".\n\nTry searching with different keywords or browse our categories!\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu`
      );
      return;
    }
    
    const results = scoredProducts.slice(0, 5);
    const totalResults = scoredProducts.length;
    
    let headerMessage = `🔍 *Search Results for "${searchTerm}"*\n\nFound ${totalResults} product${totalResults > 1 ? 's' : ''}:\n\n`;
    await sendEvolutionMessage(tenantId, phone, headerMessage);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://yourdomain.com');
    
    for (let idx = 0; idx < results.length; idx++) {
      const product = results[idx];
      const imageUrl = product.image || product.images?.[0] || product.imageUrl;
      
      let productText = `*${idx + 1}. ${product.name}*\n`;

      if (product.salePrice && product.salePrice < product.price) {
        productText += `   💰 ~~KES ${product.price?.toLocaleString()}~~ → *KES ${product.salePrice.toLocaleString()}* 🔥\n`;
      } else {
        productText += `   💰 KES ${product.price?.toLocaleString() || 'N/A'}\n`;
      }

      if (product.stock !== undefined) {
        const stockLabel = product.stock === 0 ? '❌ Out of stock' : product.stock <= 5 ? `⚠️ Only ${product.stock} left` : `✅ In stock (${product.stock})`;
        productText += `   📦 ${stockLabel}\n`;
      }

      if (product.description) {
        const shortDesc = product.description.substring(0, 100);
        productText += `   📝 ${shortDesc}${product.description.length > 100 ? '...' : ''}\n`;
      }

      if (product.brand) productText += `   🏷️ Brand: ${product.brand}\n`;
      if (product.category || product.categoryName) productText += `   📂 Category: ${product.category || product.categoryName}\n`;

      const orderLink = `${baseUrl}/order?tenant=${tenantId}&product=${product.id}&phone=${phone}`;
      productText += `   🛒 Order: ${orderLink}\n`;

      if (imageUrl) {
        await sendEvolutionMedia(tenantId, phone, imageUrl, productText);
      } else {
        await sendEvolutionMessage(tenantId, phone, productText);
      }
      
      if (idx < results.length - 1) await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    let replyMessage = totalResults > 5 
      ? `\n*Reply with a number:*\n1️⃣ - View More (${totalResults - 5} more)\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`
      : `\n*Reply with a number:*\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
    
    await sendEvolutionMessage(tenantId, phone, replyMessage);
    
    await setFlowState(tenantId, phone, {
      flowName: 'product_search',
      currentStep: 'search_results',
      searchQuery: searchTerm,
      allResults: scoredProducts,
      currentIndex: 0,
      isActive: true,
      lastActivity: new Date().toISOString(),
    });
    
    debugLog(`[Webhook] Sent ${results.length} search results for "${searchTerm}" (total: ${totalResults})`);
  } catch (error) {
    console.error('[Webhook] Error handling product search:', error);
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, `❌ Search failed. Please try again or browse categories.\n\nReply *1* to browse products or *MENU* for main menu.`);
  }
}

async function getFlowState(
  tenantId: string,
  phone: string
): Promise<any> {
  try {
    const adminDb = getAdminDb();
    
    const convoDoc = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .get();
    
    return convoDoc.exists ? convoDoc.data()?.flowState || null : null;
  } catch (error) {
    console.error("[Webhook] Error getting flow state:", error);
    return null;
  }
}

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

    debugLog(`[Webhook] Sending response to ${phoneNumber}`);

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
    debugLog("[Webhook] Response sent:", data);

    if (!response.ok) {
      console.error("[Webhook] Failed to send response:", data);
    }
  } catch (error) {
    console.error("[Webhook] Error sending response:", error);
  }
}

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

    debugLog(`[Webhook] Sending media to ${phoneNumber}: ${mediaUrl}`);

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
    debugLog("[Webhook] Media sent:", data);

    if (!response.ok) {
      console.error("[Webhook] Failed to send media:", data);
    }
  } catch (error) {
    console.error("[Webhook] Error sending media:", error);
  }
}

async function processWithAI(
  tenantId: string,
  phone: string,
  message: string
): Promise<void> {
  const processStart = Date.now();
  
  await startTypingIndicator(tenantId, phone);
  
  try {
    console.log("[Webhook] Processing message with AI...");
    debugLog("[Webhook] Phone:", phone, "Message:", message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    
    const currentFlowState = await getFlowState(tenantId, phone);
    
    // CRITICAL: Check for '0' FIRST, before ANY flow routing
    if (message.trim() === '0') {
      console.log(`[Webhook] CRITICAL: '0' detected - clearing flow and showing main menu`);
      
      const adminDb = getAdminDb();
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: FieldValue.delete()
        }, { merge: true });
      
      await stopTypingIndicator(tenantId, phone);
      await sendWelcomeMenu(tenantId, phone);
      return;
    }
    
    if (currentFlowState && currentFlowState.isActive) {
      const { flowName, currentStep, lastActivity } = currentFlowState;
      debugLog("[Webhook] Customer in active flow:", flowName, "- Step:", currentStep);
      
      const isStale = lastActivity && 
        (Date.now() - new Date(lastActivity).getTime()) > FLOW_TIMEOUT_MS;
      
      if (isStale) {
        console.log("[Webhook] Flow state expired, sending welcome menu");
        await stopTypingIndicator(tenantId, phone);
        await sendWelcomeMenu(tenantId, phone);
        return;
      }
      
      if (flowName === 'main_menu' && currentStep === 'waiting_for_selection') {
        const menuSelection = parseMenuSelection(message);
        if (menuSelection !== null) {
          debugLog("[Webhook] Main menu selection:", menuSelection);
          await handleMenuSelection(tenantId, phone, menuSelection);
        } else {
          if (checkIfSearchQuery(message)) {
            debugLog("[Webhook] Natural language query from main menu:", message);
            await handleProductSearchHandler(
              tenantId,
              phone,
              message,
              {
                sendTypingIndicator: startTypingIndicator,
                stopTypingIndicator: stopTypingIndicator,
                sendMessage: sendEvolutionMessage,
                sendMedia: sendEvolutionMedia,
                setFlowState: setFlowState,
              }
            );
          } else {
            debugLog("[Webhook] Invalid main menu input:", message);
            await stopTypingIndicator(tenantId, phone);
            await sendEvolutionMessage(tenantId, phone, 
              "Please reply with a number *1-7* to continue:\n\n1 Browse Products\n2 Browse Services\n3 Search Products\n4 Search Services\n5 Check Order Status\n6 Payment Info\n7 Talk to Support"
            );
          }
        }
        return;
      }
      
      debugLog("[Webhook] Routing to flow handler:", flowName);
      await handleFlowInput(tenantId, phone, message, currentFlowState);
      return;
    }
    
    const isGreeting = checkIfGreeting(message);
    if (isGreeting) {
      console.log("[Webhook] Greeting detected, sending welcome menu");
      await stopTypingIndicator(tenantId, phone);
      await sendWelcomeMenu(tenantId, phone);
      return;
    }
    
    const menuSelection = parseMenuSelection(message);
    if (menuSelection !== null) {
      debugLog("[Webhook] Fresh menu selection detected:", menuSelection);
      await handleMenuSelection(tenantId, phone, menuSelection);
      return;
    }
    
    const isSearchQuery = checkIfSearchQuery(message);
    if (isSearchQuery) {
      debugLog("[Webhook] Search query detected:", message);
      await handleProductSearchHandler(
        tenantId,
        phone,
        message,
        {
          sendTypingIndicator: startTypingIndicator,
          stopTypingIndicator: stopTypingIndicator,
          sendMessage: sendEvolutionMessage,
          sendMedia: sendEvolutionMedia,
          setFlowState: setFlowState,
        }
      );
      return;
    }
    
    console.log("[Webhook] Using AI for natural language query...");
    
    const contextStart = Date.now();
    const context = await getBusinessContext(tenantId);
    debugLog(`[Webhook] Context fetch took ${Date.now() - contextStart}ms`);
    
    const enhancedContext = {
      ...context,
      conversationFlow: currentFlowState,
    };
    
    console.log("[Webhook] Calling AI for natural language query...");
    const aiStart = Date.now();
    
    const aiPromise = generateAIResponse(message, enhancedContext, []);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI generation timeout after 15000ms")), 15000)
    );
    
    const aiResponse = await Promise.race([aiPromise, timeoutPromise]) as string;
    console.log(`[Webhook] AI generation took ${Date.now() - aiStart}ms`);
    debugLog("[Webhook] AI Response preview:", aiResponse.substring(0, 100));
    
    console.log("[Webhook] Sending response via Evolution API...");
    
    const mentionedProducts = context.products.filter(p => {
      const productName = p.name.toLowerCase();
      const responseLower = aiResponse.toLowerCase();
      
      const wordBoundaryRegex = new RegExp(`\\b${productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return wordBoundaryRegex.test(aiResponse) &&
             (p.images && p.images.length > 0 || p.image);
    });
    
    const productsToShow = mentionedProducts.slice(0, 3);
    debugLog(`[Webhook] Found ${productsToShow.length} products with images to send`);
    
    for (const product of productsToShow) {
      const imageUrl = product.images?.[0] || product.image;
      if (imageUrl) {
        await sendEvolutionMedia(
          tenantId,
          phone,
          imageUrl,
          `*${product.name}* - KES ${product.price.toLocaleString()}`
        );
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const cleanText = aiResponse.replace(/\[IMAGE:[^\]]+\]/g, '').trim();
    
    await stopTypingIndicator(tenantId, phone);
    await sendEvolutionMessage(tenantId, phone, cleanText);
    
    console.log("[Webhook] All messages sent successfully");
    
    console.log("[Webhook] Saving AI response to database...");
    const adminDb = getAdminDb();
    const messageId = `ai_${Date.now()}`;
    const timestamp = new Date();
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .collection("messages")
      .doc(messageId)
      .set({
        text: aiResponse,
        from: tenantId,
        fromMe: true,
        sender: "business",
        timestamp,
        status: "sent",
        createdAt: timestamp,
        isAI: true,
      });
    
    console.log("[Webhook] AI response saved to database");
    console.log("[Webhook] AI processing complete ✅");
    console.log(`[Webhook] Total processing time: ${Date.now() - processStart}ms`);
    
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
    
    await logWebhookSuccess(tenantId, phone, message, Date.now() - processStart);
  } catch (error) {
    const processingTime = Date.now() - processStart;
    console.error("[Webhook] ❌ ERROR in AI processing after", processingTime, "ms:", error);
    
    await stopTypingIndicator(tenantId, phone);
    
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
    debugLog("[Webhook] Body:", JSON.stringify(body));

    const event = body.event || body.type || body.eventName;
    const instanceName = body.instance || body.instanceName || body.instance_id || body.instanceId;

    debugLog("[Webhook] Event:", event);
    debugLog("[Webhook] Instance:", instanceName);

    const allowedEvents = ["messages.upsert", "MESSAGES_UPSERT", "messages.update", "MESSAGES_UPDATE"];
    if (!allowedEvents.includes(event)) {
      debugLog("[Webhook] Ignoring event:", event);
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

    const remoteJid = message?.key?.remoteJid || message?.remoteJid || "";
    const from = remoteJid
      .replace(/:\d+@s\.whatsapp\.net$/, "")
      .replace(/@s\.whatsapp\.net$/, "")
      .replace(/^\+/, "");
    
    if (!from) {
      console.log("[Webhook] ❌ No phone number extracted from remoteJid:", remoteJid);
      return NextResponse.json({ received: true, error: "No phone number" });
    }
    
    console.log(`[Webhook] Extracted phone: ${from} from remoteJid: ${remoteJid}`);
    
    const text =
      message?.message?.conversation ||
      message?.message?.extendedTextMessage?.text ||
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

    let tenantId = instanceName;
    debugLog("[Webhook] Instance Name:", instanceName);

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

    const conversationRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(from);

    const existingConvo = await conversationRef.get();
    const currentUnreadCount = existingConvo.exists
      ? (existingConvo.data()?.unreadCount || 0) + 1
      : 1;

    await conversationRef.set({
      phone: from,
      customerPhone: from,
      customerName: message?.pushName || "Customer",
      lastMessage: text,
      lastMessageTime: timestamp,
      unreadCount: currentUnreadCount,
      updatedAt: timestamp,
    }, { merge: true });

    console.log("[Webhook] Conversation saved");

    await conversationRef.collection("messages").doc(messageId).set({
      text,
      from,
      fromMe: false,
      sender: "customer",
      timestamp,
      status: "received",
      createdAt: timestamp,
    });

    console.log("[Webhook] Message saved");

    if (text) {
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