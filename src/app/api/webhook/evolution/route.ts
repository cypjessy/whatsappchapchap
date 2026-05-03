import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { generateAIResponse, detectIntent, AIContext } from "@/lib/ai-service";
import { logWebhookError, logWebhookSuccess } from "@/lib/webhook-logger";
import { getProductCategories, formatProductList, getProductImage } from "@/lib/product-helper";

// Initialize Firebase Admin SDK
let adminDb: ReturnType<typeof getFirestore> | null = null;
let adminApp: App | null = null;

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
    
    // NEW: Get product category hierarchy (with subcategories and brands)
    console.log("[Webhook] Fetching product category hierarchy...");
    const hierarchyFetchStart = Date.now();
    const hierarchySnap = await db.collection("productCategories")
      .where("tenantId", "==", tenantId)
      .get();
    console.log(`[Webhook] Hierarchy fetch took ${Date.now() - hierarchyFetchStart}ms`);
    
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
    console.log(`[Webhook] Product category hierarchy loaded: ${productCategoryHierarchy.length}`);
    console.log("[Webhook] Hierarchy details:", JSON.stringify(productCategoryHierarchy.map(c => ({ name: c.name, subcategories: c.subcategories.length, brands: c.brands.length }))));
    
    console.log("[Webhook] Building context object...");
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

// Send welcome menu with numbered options
async function sendWelcomeMenu(tenantId: string, phone: string): Promise<void> {
  const businessName = await getTenantBusinessName(tenantId);
  const menuMsg = `Hello! 👋 Welcome to *${businessName}*!\n\nHow can we help you today?\n\n1️ Browse Products\n2️ Browse Services\n3️ Check Order Status\n4️ Payment Info\n5️ Talk to Support\n\n*Reply with a number (1-5)*`;
  
  await sendEvolutionMessage(tenantId, phone, menuMsg);
  
  // Save to database
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
    
  // Set flow state to waiting for main menu selection
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

// Parse menu selection (numbers 1-5)
function parseMenuSelection(message: string): number | null {
  const trimmed = message.trim();
  
  // Check if it's a number
  const num = parseInt(trimmed);
  if (!isNaN(num) && num >= 1 && num <= 5) {
    return num;
  }
  
  // Check for keywords
  const lower = trimmed.toLowerCase();
  if (lower.includes('product') || lower.includes('browse')) return 1;
  if (lower.includes('service')) return 2;
  if (lower.includes('order') || lower.includes('track')) return 3;
  if (lower.includes('payment') || lower.includes('pay')) return 4;
  if (lower.includes('support') || lower.includes('help')) return 5;
  
  return null;
}

// Handle main menu selection
async function handleMenuSelection(tenantId: string, phone: string, selection: number): Promise<void> {
  const adminDb = getAdminDb();
  
  switch (selection) {
    case 1: // Browse Products
      console.log("[Webhook] Starting product browse flow");
      await startProductBrowseFlow(tenantId, phone);
      break;
      
    case 2: // Browse Services
      console.log("[Webhook] Starting service browse flow");
      await startServiceBrowseFlow(tenantId, phone);
      break;
      
    case 3: // Check Order
      console.log("[Webhook] Order status requested");
      await sendOrderStatusInfo(tenantId, phone);
      break;
      
    case 4: // Payment Info
      console.log("[Webhook] Payment info requested");
      await sendPaymentInfo(tenantId, phone);
      break;
      
    case 5: // Support
      console.log("[Webhook] Support requested");
      await sendSupportInfo(tenantId, phone);
      break;
  }
}

// Start product browse flow
async function startProductBrowseFlow(tenantId: string, phone: string): Promise<void> {
  const adminDb = getAdminDb();
  
  // Fetch categories from categoryNames collection
  const categoriesSnap = await adminDb
    .collection("categoryNames")
    .where("tenantId", "==", tenantId)
    .get();
  
  if (categoriesSnap.empty) {
    await sendEvolutionMessage(tenantId, phone, " We don't have any products listed yet. Please check back soon!");
    return;
  }
  
  const categories = categoriesSnap.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      categorySlug: data.mainCategory,
      name: data.mainCategoryName || data.mainCategory,
      subcategories: data.subcategories || [],
      brands: [],
      productCount: 0, // Will be calculated below
    };
  });
  
  // Count products for each category
  const productsSnap = await adminDb
    .collection('products')
    .where('tenantId', '==', tenantId)
    .get();
  
  const products = productsSnap.docs.map((doc: any) => doc.data());
  
  categories.forEach((category) => {
    category.productCount = products.filter(
      (p: any) => p.categoryId === category.categorySlug || p.category === category.categorySlug
    ).length;
  });
  
  // Format category menu
  const categoryList = categories
    .map((cat, idx) => `${idx + 1}️⃣ ${cat.name} (${cat.productCount} products)`)
    .join('\n');
  
  const response = `🛍️ *Browse Products*\n\nChoose a category:\n\n${categoryList}\n\n2️ - Back to main menu`;
  
  await sendEvolutionMessage(tenantId, phone, response);
  
  // Update flow state
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'product_browse',
        currentStep: 'category_selection',
        selections: {
          categories: categories,
        },
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

// Handle flow input based on current flow state
async function handleFlowInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any
): Promise<void> {
  const adminDb = getAdminDb();
  const { flowName, currentStep, selections } = flowState;
  
  // Check for back option
  if (message.trim() === '0') {
    if (flowName === 'product_browse') {
      if (currentStep === 'category_selection') {
        // Back to main menu
        await sendWelcomeMenu(tenantId, phone);
        return;
      } else {
        // Back to categories
        await startProductBrowseFlow(tenantId, phone);
        return;
      }
    }
  }
  
  // Check for main menu option
  if (message.trim() === '3') {
    await sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  // Check for main menu option
  if (message.trim().toLowerCase() === 'menu') {
    await sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  // Handle product browse flow
  if (flowName === 'product_browse') {
    await handleProductBrowseInput(tenantId, phone, message, flowState);
    return;
  }
  
  // Handle service browse flow
  if (flowName === 'service_browse') {
    // TODO: Implement service browse flow
    await sendEvolutionMessage(tenantId, phone, "Service browsing coming soon!");
    return;
  }
}

// Handle product browse flow input
async function handleProductBrowseInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any
): Promise<void> {
  const adminDb = getAdminDb();
  const { currentStep, selections } = flowState;
  
  // Step 1: Category selection
  if (currentStep === 'category_selection') {
    const num = parseInt(message.trim());
    const categories = selections.categories;
    
    if (isNaN(num) || num < 1 || num > categories.length) {
      await sendEvolutionMessage(tenantId, phone, "❌ Invalid selection. Please choose a number from the list.");
      return;
    }
    
    const selectedCategory = categories[num - 1];
    
    // Check if category has subcategories
    if (selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
      // Show subcategories
      const subcategoryList = selectedCategory.subcategories
        .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
        .join('\n');
      
      const response = ` *${selectedCategory.name}* - Subcategories\n\n${subcategoryList}\n\n2️⃣ Back to categories\n3️ - Main menu`;
      await sendEvolutionMessage(tenantId, phone, response);
      
      // Update flow state
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            isActive: true,
            flowName: 'product_browse',
            currentStep: 'subcategory_selection',
            selections: {
              ...selections,
              categoryId: selectedCategory.id,           // Firestore doc ID
              categorySlug: selectedCategory.categorySlug, // The "clothing" slug
              categoryName: selectedCategory.name,
              categoryBrands: selectedCategory.brands || [],
              categorySubcategories: selectedCategory.subcategories || [],
            },
            lastActivity: new Date().toISOString(),
          }
        }, { merge: true });
    } else {
      // No subcategories, check for brands or show products
      await handleBrandOrProductSelection(tenantId, phone, selectedCategory);
    }
  }
  
  // Step 2: Subcategory selection
  else if (currentStep === 'subcategory_selection') {
    const num = parseInt(message.trim());
    const { categoryId, categoryName, categorySubcategories } = selections;
      
    if (isNaN(num) || num < 1 || num > categorySubcategories.length) {
      await sendEvolutionMessage(tenantId, phone, "❌ Invalid selection. Please choose a number from the list.");
      return;
    }
      
    const selectedSubcategory = categorySubcategories[num - 1];
    console.log("[Webhook] Selected subcategory:", selectedSubcategory);
      
    // Check if there are brands for this subcategory
    const brands = (selections.categoryBrands || []).filter((b: string) => 
      b.toLowerCase() !== 'null' && b.toLowerCase() !== 'unknown'
    );
      
    if (brands.length > 0) {
      // Show brands
      const brandList = brands
        .map((brand: string, idx: number) => `${idx + 1}️⃣ ${brand}`)
        .join('\n');
        
      const response = ` *${selectedSubcategory}* - Brands\n\n${brandList}\n\n2️ - Back to subcategories\n3️ - Main menu`;
      await sendEvolutionMessage(tenantId, phone, response);
        
      // Update flow state
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            isActive: true,
            flowName: 'product_browse',
            currentStep: 'brand_selection',
            selections: {
              ...selections,
              subcategory: selectedSubcategory,
              availableBrands: brands,
            },
            lastActivity: new Date().toISOString(),
          }
        }, { merge: true });
    } else {
      // No brands, go directly to products
      await showProductsForSelection(tenantId, phone, selections);
    }
  }
    
  // Step 3: Brand selection
  else if (currentStep === 'brand_selection') {
    const num = parseInt(message.trim());
    const availableBrands = selections.availableBrands || [];
      
    if (isNaN(num) || num < 1 || num > availableBrands.length) {
      await sendEvolutionMessage(tenantId, phone, "❌ Invalid selection. Please choose a number from the list.");
      return;
    }
      
    const selectedBrand = availableBrands[num - 1];
    console.log("[Webhook] Selected brand:", selectedBrand);
      
    // Show products for this brand
    await showProductsForSelection(tenantId, phone, {
      ...selections,
      brand: selectedBrand,
    });
  }
    
  // Step 4: Product pagination
  else if (currentStep === 'product_pagination') {
    const trimmed = message.trim().toLowerCase();
    const num = message.trim();

    if (trimmed === 'next' || trimmed === 'more' || num === '1') {
      await showNextProductPage(tenantId, phone, selections);
    } else if (trimmed === 'back' || num === '2') {
      if (selections.brand) {
        await handleBrandOrProductSelection(tenantId, phone, {
          id: selections.categoryId,
          categorySlug: selections.categorySlug,
          name: selections.categoryName,
          brands: selections.categoryBrands || [],
          subcategories: selections.categorySubcategories || [],
        });
      } else if (selections.subcategory) {
        const subcategoryList = (selections.categorySubcategories || [])
          .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
          .join('\n');
        const response = ` *${selections.categoryName}* - Subcategories\n\n${subcategoryList}\n\n2️⃣ Back to categories\n3️ - Main menu`;
        await sendEvolutionMessage(tenantId, phone, response);
        await adminDb.collection("tenants").doc(tenantId)
          .collection("conversations").doc(phone)
          .set({ flowState: { ...flowState, currentStep: 'subcategory_selection', lastActivity: new Date().toISOString() } }, { merge: true });
      } else {
        await startProductBrowseFlow(tenantId, phone);
      }
    } else if (trimmed === 'menu' || num === '3') {
      await sendWelcomeMenu(tenantId, phone);
    } else {
      await sendEvolutionMessage(tenantId, phone, 
        "*Reply with a number:*\n1️⃣ - Next page\n2️⃣ - Go back\n3️ - Main menu"
      );
    }
  }
}

// Show products for current selection (category, subcategory, brand)
async function showProductsForSelection(
  tenantId: string,
  phone: string,
  selections: any
): Promise<void> {
  const adminDb = getAdminDb();
  
  // Build query based on selections
  let query = adminDb.collection('products').where('tenantId', '==', tenantId);
  
  if (selections.categoryId) {
    // Query by the slug (e.g., "clothing") not the Firestore doc ID
    query = query.where('categoryId', '==', selections.categorySlug || selections.categoryId);
  }
  
  // Fetch all matching products
  const productsSnap = await query.get();
  let products = productsSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  // Debug: Log first product structure
  if (products.length > 0) {
    console.log('[Product Browse] Sample product fields:', Object.keys(products[0]));
    console.log('[Product Browse] Sample product data:', JSON.stringify(products[0], null, 2));
  }
  
  // Filter by subcategory if specified
  if (selections.subcategory) {
    products = products.filter((p: any) => p.subcategory === selections.subcategory);
  }
  
  // Filter by brand if specified
  if (selections.brand) {
    products = products.filter((p: any) => p.brand === selections.brand);
  }
  
  if (products.length === 0) {
    await sendEvolutionMessage(tenantId, phone, "😔 No products found for this selection. Please try another category.");
    return;
  }
  
  // Show first 5 products
  const productsToShow = products.slice(0, 5);
  const totalProducts = products.length;
  
  // Send category header first
  let headerMessage = `🛍️ *${selections.categoryName}${selections.subcategory ? ' → ' + selections.subcategory : ''}${selections.brand ? ' → ' + selections.brand : ''}*\n\n`;
  headerMessage += `Showing ${productsToShow.length} of ${totalProducts} products:\n\n`;
  await sendEvolutionMessage(tenantId, phone, headerMessage);
  
  // Send each product with its image and details together
  for (let idx = 0; idx < productsToShow.length; idx++) {
    const product = productsToShow[idx];
    const imageUrl = product.images?.[0] || product.imageUrl || product.image;
    
    // Build product text
    let productText = `*${idx + 1}. ${product.name}*\n`;

    // Price (with sale price support)
    if (product.salePrice) {
      productText += `   💰 ~~KES ${product.price?.toLocaleString()}~~ → *KES ${product.salePrice.toLocaleString()}* 🔥\n`;
    } else {
      productText += `   💰 KES ${product.price?.toLocaleString() || 'N/A'}\n`;
    }

    // Stock status
    if (product.stock !== undefined) {
      const stockLabel = product.stock === 0
        ? '❌ Out of stock'
        : product.stock <= 5
          ? `⚠️ Only ${product.stock} left`
          : `✅ In stock (${product.stock})`;
      productText += `   📦 ${stockLabel}\n`;
    }

    // Description
    if (product.description) {
      productText += `   📝 ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
    }

    // Display all filters (colors, sizes, brand, condition, warranty, etc.)
    if (product.filters && Object.keys(product.filters).length > 0) {
      // Map common filter keys to readable labels and icons
      const filterLabels: Record<string, { label: string; icon: string }> = {
        'color': { label: 'Colors', icon: '🎨' },
        'colors': { label: 'Colors', icon: '🎨' },
        'size': { label: 'Sizes', icon: '' },
        'sizes': { label: 'Sizes', icon: '📏' },
        'brand': { label: 'Brand', icon: '🏷️' },
        'condition': { label: 'Condition', icon: '✨' },
        'warranty': { label: 'Warranty', icon: '🛡️' },
        'material': { label: 'Material', icon: '🧵' },
        'weight': { label: 'Weight', icon: '⚖️' },
        'capacity': { label: 'Capacity', icon: '📦' },
        'power': { label: 'Power', icon: '⚡' },
        'screen_size': { label: 'Screen Size', icon: '📱' },
        'ram': { label: 'RAM', icon: '💾' },
        'storage': { label: 'Storage', icon: '💿' },
      };
      
      Object.entries(product.filters).forEach(([filterKey, filterValues]) => {
        if (Array.isArray(filterValues) && filterValues.length > 0) {
          const config = filterLabels[filterKey] || { label: filterKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), icon: '📌' };
          productText += `   ${config.icon} ${config.label}: ${filterValues.join(', ')}\n`;
        }
      });
    }

    // Fallback to individual fields if filters not present (backward compatibility)
    if (!product.filters) {
      if (product.colors && product.colors.length > 0) {
        productText += `   🎨 Colors: ${product.colors.join(', ')}\n`;
      }
      if (product.sizes && product.sizes.length > 0) {
        productText += `   📏 Sizes: ${product.sizes.join(', ')}\n`;
      }
      if (product.brand) {
        productText += `   🏷️ Brand: ${product.brand}\n`;
      }
      if (product.condition) {
        productText += `   ✨ Condition: ${product.condition}\n`;
      }
      if (product.warranty) {
        productText += `   🛡️ Warranty: ${product.warranty}\n`;
      }
    }

    // Variants
    if (product.variants && product.variants.length > 0) {
      productText += `   🔀 Variants: ${product.variants.length} options available\n`;
    }

    // Payment methods
    if (product.paymentMethods && product.paymentMethods.length > 0) {
      productText += `   💳 Pay via: ${product.paymentMethods.map((m: any) => m.name).join(', ')}\n`;
    }

    // Order link
    if (product.orderLink) {
      productText += `    *Order here:* ${product.orderLink}\n`;
    }

    // Send image with text caption if image exists, otherwise send text only
    if (imageUrl) {
      await sendEvolutionMedia(tenantId, phone, imageUrl, productText);
    } else {
      await sendEvolutionMessage(tenantId, phone, productText);
    }
    
    // Small delay between products to prevent rate limiting
    if (idx < productsToShow.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  // Reply instructions
  let replyMessage = '';
  if (totalProducts > 5) {
    replyMessage = `\n*Reply with a number:*\n1️⃣ - Next page (${totalProducts - 5} more)\n2️⃣ - Go back\n3️ - Main menu`;
  } else {
    replyMessage = `\n*Reply with a number:*\n2️⃣ - Go back\n3️ - Main menu`;
  }
  
  await sendEvolutionMessage(tenantId, phone, replyMessage);
  
  // Update flow state
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'product_browse',
        currentStep: 'product_pagination',
        selections: {
          ...selections,
          allProducts: products.map((p: any) => p.id),
          currentPage: 0,
          pageSize: 5,
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

// Show next page of products
async function showNextProductPage(
  tenantId: string,
  phone: string,
  selections: any
): Promise<void> {
  const adminDb = getAdminDb();
  
  const allProductIds = selections.allProducts || [];
  const currentPage = selections.currentPage || 0;
  const pageSize = selections.pageSize || 5;
  
  const startIndex = (currentPage + 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  if (startIndex >= allProductIds.length) {
    await sendEvolutionMessage(tenantId, phone, "✅ You've seen all available products! Reply *0* to go back.");
    return;
  }
  
  // Get product IDs for this page
  const pageIds = allProductIds.slice(startIndex, endIndex);
  
  // Fetch only the specific product IDs for this page (optimized query)
  const productsSnap = await adminDb.collection('products')
    .where('__name__', 'in', pageIds)
    .get();
  
  const productsToShow = productsSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  if (productsToShow.length === 0) {
    await sendEvolutionMessage(tenantId, phone, "No more products available.");
    return;
  }
  
  // Send page header
  let headerMessage = `🛍️ *More Products* (Page ${currentPage + 2})\n\n`;
  await sendEvolutionMessage(tenantId, phone, headerMessage);
  
  // Send each product with its image and details together
  for (let idx = 0; idx < productsToShow.length; idx++) {
    const product = productsToShow[idx];
    const imageUrl = product.images?.[0] || product.imageUrl || product.image;
    
    // Build product text
    let productText = `*${idx + 1}. ${product.name}*\n`;

    // Price (with sale price support)
    if (product.salePrice) {
      productText += `   💰 ~~KES ${product.price?.toLocaleString()}~~ → *KES ${product.salePrice.toLocaleString()}* 🔥\n`;
    } else {
      productText += `   💰 KES ${product.price?.toLocaleString() || 'N/A'}\n`;
    }

    // Stock status
    if (product.stock !== undefined) {
      const stockLabel = product.stock === 0
        ? '❌ Out of stock'
        : product.stock <= 5
          ? `⚠️ Only ${product.stock} left`
          : `✅ In stock (${product.stock})`;
      productText += `   📦 ${stockLabel}\n`;
    }

    // Description
    if (product.description) {
      productText += `    ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
    }

    // Display all filters (colors, sizes, brand, condition, warranty, etc.)
    if (product.filters && Object.keys(product.filters).length > 0) {
      // Map common filter keys to readable labels and icons
      const filterLabels: Record<string, { label: string; icon: string }> = {
        'color': { label: 'Colors', icon: '' },
        'colors': { label: 'Colors', icon: '🎨' },
        'size': { label: 'Sizes', icon: '' },
        'sizes': { label: 'Sizes', icon: '📏' },
        'brand': { label: 'Brand', icon: '🏷️' },
        'condition': { label: 'Condition', icon: '✨' },
        'warranty': { label: 'Warranty', icon: '🛡️' },
        'material': { label: 'Material', icon: '🧵' },
        'weight': { label: 'Weight', icon: '' },
        'capacity': { label: 'Capacity', icon: '📦' },
        'power': { label: 'Power', icon: '' },
        'screen_size': { label: 'Screen Size', icon: '📱' },
        'ram': { label: 'RAM', icon: '' },
        'storage': { label: 'Storage', icon: '' },
      };
      
      Object.entries(product.filters).forEach(([filterKey, filterValues]) => {
        if (Array.isArray(filterValues) && filterValues.length > 0) {
          const config = filterLabels[filterKey] || { label: filterKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), icon: '' };
          productText += `   ${config.icon} ${config.label}: ${filterValues.join(', ')}\n`;
        }
      });
    }

    // Fallback to individual fields if filters not present (backward compatibility)
    if (!product.filters) {
      if (product.colors && product.colors.length > 0) {
        productText += `   🎨 Colors: ${product.colors.join(', ')}\n`;
      }
      if (product.sizes && product.sizes.length > 0) {
        productText += `    Sizes: ${product.sizes.join(', ')}\n`;
      }
      if (product.brand) {
        productText += `   🏷️ Brand: ${product.brand}\n`;
      }
      if (product.condition) {
        productText += `    Condition: ${product.condition}\n`;
      }
      if (product.warranty) {
        productText += `   🛡️ Warranty: ${product.warranty}\n`;
      }
    }

    // Variants
    if (product.variants && product.variants.length > 0) {
      productText += `   🔀 Variants: ${product.variants.length} options available\n`;
    }

    // Payment methods
    if (product.paymentMethods && product.paymentMethods.length > 0) {
      productText += `   💳 Pay via: ${product.paymentMethods.map((m: any) => m.name).join(', ')}\n`;
    }

    // Order link
    if (product.orderLink) {
      productText += `   🛒 *Order here:* ${product.orderLink}\n`;
    }

    // Send image with text caption if image exists, otherwise send text only
    if (imageUrl) {
      await sendEvolutionMedia(tenantId, phone, imageUrl, productText);
    } else {
      await sendEvolutionMessage(tenantId, phone, productText);
    }
    
    // Small delay between products to prevent rate limiting
    if (idx < productsToShow.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  const remaining = allProductIds.length - endIndex;
  let replyMessage = '';
  if (remaining > 0) {
    replyMessage = `\n*Reply with a number:*\n1️⃣ - Next page (${remaining} more)\n2️⃣ - Go back\n3️ - Main menu`;
  } else {
    replyMessage = `\n*Reply with a number:*\n2️ - Go back\n3️ - Main menu`;
  }
  
  await sendEvolutionMessage(tenantId, phone, replyMessage);
  
  // Update flow state
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'product_browse',
        currentStep: 'product_pagination',
        selections: {
          ...selections,
          currentPage: currentPage + 1,
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

// Handle brand or product selection
async function handleBrandOrProductSelection(
  tenantId: string,
  phone: string,
  category: any
): Promise<void> {
  const adminDb = getAdminDb();
  
  // Filter valid brands
  const brands = (category.brands || []).filter((b: string) => 
    b.toLowerCase() !== 'null' && b.toLowerCase() !== 'unknown'
  );
  
  if (brands.length > 0) {
    // Show brands
    const brandList = brands
      .map((brand: string, idx: number) => `${idx + 1}. ${brand}`)
      .join('\n');
    
    const response = `🏷️ *${category.name}* - Brands\n\n${brandList}\n\n0 Back to categories`;
    await sendEvolutionMessage(tenantId, phone, response);
    
    // Update flow state
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'product_browse',
          currentStep: 'brand_selection',
          selections: {
            categoryId: category.id,
            categorySlug: category.categorySlug,
            categoryName: category.name,
            availableBrands: brands,
            categorySubcategories: category.subcategories || [],
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // No brands, show products directly
    await showProductsForSelection(tenantId, phone, {
      categoryId: category.id,
      categorySlug: category.categorySlug,
      categoryName: category.name,
      categorySubcategories: category.subcategories || [],
      categoryBrands: category.brands || [],
    });
  }
}

// Placeholder functions for other menu options
async function startServiceBrowseFlow(tenantId: string, phone: string): Promise<void> {
  await sendEvolutionMessage(tenantId, phone, "🛠️ Service browsing coming soon! We're adding services now.");
}

async function sendOrderStatusInfo(tenantId: string, phone: string): Promise<void> {
  await sendEvolutionMessage(tenantId, phone, "📦 To check your order status, please provide your order ID or tracking number.");
}

async function sendPaymentInfo(tenantId: string, phone: string): Promise<void> {
  await sendEvolutionMessage(tenantId, phone, "💳 We accept:\n\n• M-Pesa\n• Bank Transfer\n• Cash on Delivery\n\nWhich payment method would you like to use?");
}

async function sendSupportInfo(tenantId: string, phone: string): Promise<void> {
  await sendEvolutionMessage(tenantId, phone, " Our support team is here to help! Please describe your issue and we'll assist you.");
}
function checkIfGreeting(message: string): boolean {
  const greetings = [
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'greetings', 'howdy', 'sup', 'whats up', 'what\'s up'
  ];
  const lowerMsg = message.toLowerCase().trim();
  return greetings.some(greeting => lowerMsg === greeting || lowerMsg.startsWith(greeting + ' '));
}

// Get flow state ONLY (no conversation history)
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

// Get conversation history for context (last 5 messages) - DEPRECATED, using flow state instead
async function getConversationHistory(
  tenantId: string,
  phone: string
): Promise<{ history: Array<{ role: "user" | "assistant"; content: string }>; flowState: any }> {
  try {
    const adminDb = getAdminDb();
    
    // Get messages
    const messagesSnap = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(5)
      .get();
    
    const messages = messagesSnap.docs
      .map(doc => doc.data())
      .reverse()
      .slice(-5);
    
    const history = messages.map(msg => ({
      role: (msg.fromMe || msg.sender === "business") ? "assistant" as const : "user" as const,
      content: msg.text || "",
    }));
    
    // Get flow state
    const flowState = await getFlowState(tenantId, phone);
    
    return { history, flowState };
  } catch (error) {
    console.error("[Webhook] Error getting conversation history:", error);
    return { history: [], flowState: null };
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

// Process message with AI and send response
async function processWithAI(
  tenantId: string,
  phone: string,
  message: string
): Promise<void> {
  const processStart = Date.now();
  try {
    console.log("[Webhook] Processing message with AI...");
    console.log("[Webhook] Phone:", phone, "Message:", message.substring(0, 50) + (message.length > 50 ? '...' : ''));
    
    // STEP 1: Check flow state FIRST (before anything else)
    const currentFlowState = await getFlowState(tenantId, phone);
    
    if (currentFlowState && currentFlowState.isActive) {
      const { flowName, currentStep } = currentFlowState;
      console.log("[Webhook] Customer in active flow:", flowName, "- Step:", currentStep);
      
      // Handle main_menu flow (waiting for 1-5 selection)
      if (flowName === 'main_menu' && currentStep === 'waiting_for_selection') {
        const menuSelection = parseMenuSelection(message);
        if (menuSelection !== null) {
          console.log("[Webhook] Main menu selection:", menuSelection);
          await handleMenuSelection(tenantId, phone, menuSelection);
        } else {
          console.log("[Webhook] Invalid main menu input:", message);
          await sendEvolutionMessage(tenantId, phone, 
            "Please reply with a number *1-5* to continue:\n\n1 Browse Products\n2 Browse Services\n3 Check Order Status\n4 Payment Info\n5 Talk to Support"
          );
        }
        return;
      }
      
      // Handle other active flows (product_browse, service_browse)
      console.log("[Webhook] Routing to flow handler:", flowName);
      await handleFlowInput(tenantId, phone, message, currentFlowState);
      return;
    }
    
    // STEP 2: Greeting or no prior flow → send welcome menu
    const isGreeting = checkIfGreeting(message);
    if (isGreeting) {
      console.log("[Webhook] Greeting detected, sending welcome menu");
      await sendWelcomeMenu(tenantId, phone);
      return;
    }
    
    // STEP 3: No active flow, not a greeting → parse menu selection (start fresh)
    const menuSelection = parseMenuSelection(message);
    if (menuSelection !== null) {
      console.log("[Webhook] Fresh menu selection detected:", menuSelection);
      await handleMenuSelection(tenantId, phone, menuSelection);
      return;
    }
    
    // STEP 4: Natural language → AI
    console.log("[Webhook] Using AI for natural language query...");
    
    // Get business context (products, services, shipping, payments, policies)
    console.log("[Webhook] Fetching business context for tenant:", tenantId);
    const contextStart = Date.now();
    const context = await getBusinessContext(tenantId);
    console.log(`[Webhook] Context fetch took ${Date.now() - contextStart}ms`);
    console.log(`[Webhook] Context loaded: ${context.products.length} products, ${context.services.length} services`);
    console.log(`[Webhook] Shipping methods: ${context.shippingMethods?.length || 0}`);
    console.log(`[Webhook] Payment methods: ${context.paymentMethods ? 'loaded' : 'none'}`);
    console.log(`[Webhook] Category hierarchy: ${context.productCategoryHierarchy?.length || 0} categories`);
    
    // Get flow state ONLY (NO conversation history to prevent AI from messing up flow)
    console.log("[Webhook] Fetching flow state...");
    const flowState = await getFlowState(tenantId, phone);
    console.log(`[Webhook] Flow state:`, flowState);
    
    // Add flow state to AI context (NO history)
    const enhancedContext = {
      ...context,
      conversationFlow: flowState,
    };
    
    // Generate AI response (NO conversation history - AI only handles natural language queries)
    console.log("[Webhook] Calling AI for natural language query...");
    const aiStart = Date.now();
    
    // Add timeout to prevent hanging
    const aiPromise = generateAIResponse(message, enhancedContext, []); // Empty history array
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI generation timeout after 15000ms")), 15000)
    );
    
    const aiResponse = await Promise.race([aiPromise, timeoutPromise]) as string;
    console.log(`[Webhook] AI generation took ${Date.now() - aiStart}ms`);
    console.log("[Webhook] AI Response generated successfully, length:", aiResponse.length);
    console.log("[Webhook] AI Response preview:", aiResponse.substring(0, 100));
    
    // Save AI response to messages collection
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
    
    // Update conversation with last message
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
    
    console.log("[Webhook] Conversation updated");
    
    // Send response via Evolution API
    console.log("[Webhook] Sending response via Evolution API...");
    
    // Extract mentioned products and send their images automatically
    const mentionedProducts = context.products.filter(p => 
      aiResponse.toLowerCase().includes(p.name.toLowerCase()) &&
      (p.images && p.images.length > 0 || p.image)
    );
    
    // Send images FIRST (before text)
    const productsToShow = mentionedProducts.slice(0, 3);
    console.log(`[Webhook] Found ${productsToShow.length} products with images to send`);
    
    for (const product of productsToShow) {
      // Send only the first/main image for each product
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
    
    // Then send text AFTER images
    const cleanText = aiResponse.replace(/\[IMAGE:[^\]]+\]/g, '').trim();
    await sendEvolutionMessage(tenantId, phone, cleanText);
    
    console.log("[Webhook] All messages sent");
    
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

    console.log("[Webhook] Conversation saved");

    // Save individual message
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

    // Process with AI and send response (replaces n8n)
    if (text) {
      // Await AI processing to prevent Vercel from killing the function
      console.log("[Webhook] Starting AI processing...");
      await processWithAI(tenantId, from, text).catch(err => {
        console.error("[Webhook] AI processing error:", err);
      });
      console.log("[Webhook] AI processing completed");
    }

    // ✅ Welcome message is now handled by processWithAI (sends menu with numbered options)
    // Removed duplicate sendWelcomeMessage to prevent double messages

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
