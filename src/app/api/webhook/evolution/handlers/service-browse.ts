/**
 * Service Browse Handler
 * Handles browsing services via WhatsApp
 * Two-level navigation: Categories → Services
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Lazy initialization - get Firestore instance only when needed
 */
function getDb() {
  return getFirestore();
}

interface Service {
  id: string;
  name: string;
  description?: string;
  priceMin: number;
  priceMax: number;
  businessType?: string;
  businessCategory?: string;
  serviceName?: string;
  categoryName?: string;
  duration?: string;
  location?: string;
  emoji?: string;
  imageUrl?: string;
  portfolioImages?: string[];
  bookingUrl?: string;
  packagePrices?: {
    basic?: number;
    standard?: number;
    premium?: number;
  };
  tags?: string[];
  status?: string;
}

/**
 * Dependencies passed from main route
 */
export interface ServiceBrowseDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  sendMedia?: (tenantId: string, phone: string, mediaUrl: string, caption: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
}

// Business type icons
const BUSINESS_ICONS: Record<string, string> = {
  beauty: '💇‍♀️',
  home: '',
  health: '🏥',
  education: '📚',
  automotive: '🚗',
  events: '',
  tech: '💻',
  fitness: '🏋️',
  cleaning: '🧹',
  photography: '',
  catering: '🍽️',
  medical: '🏥',
  other: '✨'
};

/**
 * Start service browse flow - show business categories
 */
export async function startServiceBrowseFlow(
  tenantId: string,
  phone: string,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  try {
    // Get all services for this tenant
    const servicesSnap = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("services")
      .where("status", "==", "active")
      .get();
    
    const services = servicesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    })) as Service[];
    
    if (services.length === 0) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "🛠️ We don't have any services available right now.\n\n" +
        "Please check back later or reply *0* for main menu."
      );
      return;
    }
    
    // Group services by businessType
    const servicesByType: Record<string, Service[]> = {};
    services.forEach(service => {
      const type = service.businessType || 'other';
      if (!servicesByType[type]) {
        servicesByType[type] = [];
      }
      servicesByType[type].push(service);
    });
    
    // Build category list
    const categories = Object.entries(servicesByType).map(([type, typeServices]) => ({
      type,
      name: typeServices[0]?.businessCategory || typeServices[0]?.serviceName || type,
      icon: BUSINESS_ICONS[type] || '✨',
      count: typeServices.length
    }));
    
    // Build categories menu
    let categoryList = categories
      .map((cat, idx) => `${idx + 1}️⃣ ${cat.icon} *${cat.name}* (${cat.count} services)`)
      .join('\n');
    
    const response = `️ *Browse Our Services*\n\n` +
      `Choose a category:\n\n${categoryList}\n\n` +
      `*Reply with a number (1-${categories.length})*\n` +
      `Or reply *0* for main menu`;
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
    // Update flow state
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'service_browse',
          currentStep: 'category_selection',
          selections: {
            categories,
            servicesByType
          },
          lastActivity: new Date().toISOString()
        }
      }, { merge: true });
      
  } catch (error) {
    console.error("[ServiceBrowse] Error starting flow:", error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Sorry, something went wrong. Please try again or reply *0* for main menu."
    );
  }
}

/**
 * Handle service browse input - route to appropriate handler
 */
export async function handleServiceBrowseInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const { currentStep, selections } = flowState;
  
  await deps.startTyping(tenantId, phone);
  
  if (currentStep === 'category_selection') {
    await handleCategorySelection(tenantId, phone, message, selections, deps);
  } else if (currentStep === 'service_listing') {
    await handleServiceListing(tenantId, phone, message, flowState, deps);
  } else if (currentStep === 'service_detail') {
    await handleServiceDetailInput(tenantId, phone, message, flowState, deps);
  } else {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Invalid state. Reply *0* for main menu."
    );
  }
}

/**
 * Handle category selection - show services in that category
 */
async function handleCategorySelection(
  tenantId: string,
  phone: string,
  message: string,
  selections: any,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const num = parseInt(message.trim());
  const categories = selections.categories;
  const servicesByType = selections.servicesByType;
  
  if (isNaN(num) || num < 1 || num > categories.length) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please choose a number from 1 to ${categories.length}.\n\n` +
      `Or reply *0* for main menu.`
    );
    return;
  }
  
  const selectedCategory = categories[num - 1];
  const categoryServices = servicesByType[selectedCategory.type] || [];
  
  if (categoryServices.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ No services found in this category.\n\n` +
      `Reply *0* for main menu.`
    );
    return;
  }
  
  // Show first 5 services
  await showServiceBatch(tenantId, phone, categoryServices, 0, selectedCategory, deps);
  
  // Update flow state
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'service_browse',
        currentStep: 'service_listing',
        selections: {
          ...selections,
          categoryId: selectedCategory.type,
          categoryName: selectedCategory.name,
          categoryServices,
          currentIndex: 0
        },
        lastActivity: new Date().toISOString()
      }
    }, { merge: true });
}

/**
 * Show a batch of services (5 at a time)
 */
async function showServiceBatch(
  tenantId: string,
  phone: string,
  services: Service[],
  startIndex: number,
  category: any,
  deps: ServiceBrowseDeps
): Promise<void> {
  const batchSize = 5;
  const batch = services.slice(startIndex, startIndex + batchSize);
  
  // Send each service
  for (let idx = 0; idx < batch.length; idx++) {
    const service = batch[idx];
    const serviceMessage = formatServiceMessage(service, idx + 1);
    
    if (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) {
      const imageUrl = service.imageUrl || service.portfolioImages![0];
      await deps.sendMedia!(tenantId, phone, imageUrl, serviceMessage);
    } else {
      await deps.sendMessage(tenantId, phone, serviceMessage);
    }
    
    // Small delay between messages
    if (idx < batch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  // Show navigation options
  const remaining = services.length - (startIndex + batchSize);
  let responseText = `\n*Reply with a number:*\n`;
  
  if (remaining > 0) {
    responseText += `1️⃣ - View More (${remaining} more)\n`;
  }
  responseText += `2️ - Back to categories\n`;
  responseText += `3️⃣ - Main menu`;
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, responseText);
}

/**
 * Handle service listing - pagination and navigation
 */
async function handleServiceListing(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const num = parseInt(message.trim());
  const { categoryServices, currentIndex, categoryId, categoryName } = flowState.selections;
  
  if (isNaN(num)) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Please reply with a number.\n\n" +
      "Or reply *0* for main menu."
    );
    return;
  }
  
  const batchSize = 5;
  
  if (num === 1) {
    // View more services
    const nextIndex = currentIndex + batchSize;
    if (nextIndex >= categoryServices.length) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "✅ You've seen all services in this category.\n\n" +
        "*Reply with a number:*\n" +
        "2️ - Back to categories\n" +
        "3️⃣ - Main menu"
      );
      return;
    }
    
    // Show next batch
    await showServiceBatch(
      tenantId,
      phone,
      categoryServices,
      nextIndex,
      { name: categoryName },
      deps
    );
    
    // Update index
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          ...flowState,
          currentIndex: nextIndex,
          lastActivity: new Date().toISOString()
        }
      }, { merge: true });
      
  } else if (num === 2) {
    // Back to categories
    await startServiceBrowseFlow(tenantId, phone, deps);
    
  } else if (num === 3) {
    // Main menu (will be handled by top-level '0' check in route.ts)
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `Hello! 👋 Welcome to our store!\n\n` +
      `How can we help you today?\n\n` +
      `1️⃣ Browse Products\n` +
      `2️⃣ Browse Services\n` +
      `3️⃣ 🔍 Search Products\n` +
      `4️⃣ Check Order Status\n` +
      `5️⃣ Payment Info\n` +
      `6️⃣ Talk to Support\n\n` +
      `*Reply with a number (1-6)*`
    );
    
    // Clear flow state
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: FieldValue.delete()
      }, { merge: true });
      
  } else {
    // Check if it's a service selection (within current batch)
    const serviceIndex = currentIndex + (num - 1);
    if (serviceIndex >= 0 && serviceIndex < categoryServices.length) {
      // User selected a service - show details
      await showServiceDetail(tenantId, phone, categoryServices[serviceIndex], flowState, deps);
    } else {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "❌ Invalid selection. Please reply with a number from the list.\n\n" +
        "Or reply *0* for main menu."
      );
    }
  }
}

/**
 * Show service detail with booking options
 */
async function showServiceDetail(
  tenantId: string,
  phone: string,
  service: Service,
  flowState: any,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  // Build pricing display
  let pricingText = '';
  if (service.packagePrices) {
    const prices = service.packagePrices;
    const priceLines = [];
    if (prices.basic) priceLines.push(`   • Basic: KES ${prices.basic.toLocaleString()}`);
    if (prices.standard) priceLines.push(`   • Standard: KES ${prices.standard.toLocaleString()}`);
    if (prices.premium) priceLines.push(`   • Premium: KES ${prices.premium.toLocaleString()}`);
    
    if (priceLines.length > 0) {
      pricingText = `\n *Pricing:*\n${priceLines.join('\n')}`;
    }
  } else if (service.priceMin === service.priceMax) {
    pricingText = `\n💰 *Price:* KES ${service.priceMin.toLocaleString()}`;
  } else {
    pricingText = `\n💰 *Price Range:* KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
  }
  
  // Build service details
  const details = [];
  if (service.duration) details.push(`️ Duration: ${service.duration}`);
  if (service.location) {
    const locationMap: Record<string, string> = {
      'client-place': "Client's place",
      'my-place': 'My place',
      'remote': 'Remote/Online',
      'both-places': 'Both locations'
    };
    details.push(`📍 Location: ${locationMap[service.location] || service.location}`);
  }
  if (service.businessCategory || service.categoryName) {
    details.push(` Category: ${service.businessCategory || service.categoryName}`);
  }
  
  const detailsText = details.length > 0 ? `\n${details.join('\n')}` : '';
  
  const message = `${service.emoji || '️'} *${service.name}*${pricingText}${detailsText}\n\n` +
    (service.description ? `📝 ${service.description.substring(0, 200)}${service.description.length > 200 ? '...' : ''}\n\n` : '') +
    (service.bookingUrl ? `🛒 Book Now: ${service.bookingUrl}\n\n` : '');
  
  // Send service details
  if (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) {
    const imageUrl = service.imageUrl || service.portfolioImages![0];
    await deps.sendMedia!(tenantId, phone, imageUrl, message);
  } else {
    await deps.sendMessage(tenantId, phone, message);
  }
  
  // Navigation options
  const responseText = `*Reply with a number:*\n` +
    `1️⃣ - Book this service\n` +
    `2️⃣ - Back to services\n` +
    `3️⃣ - Main menu`;
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, responseText);
  
  // Update flow state
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'service_browse',
        currentStep: 'service_detail',
        selections: {
          ...flowState.selections,
          selectedService: service
        },
        lastActivity: new Date().toISOString()
      }
    }, { merge: true });
}

/**
 * Handle input when viewing service detail
 */
async function handleServiceDetailInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ServiceBrowseDeps
): Promise<void> {
  const num = parseInt(message.trim());
  
  if (isNaN(num)) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Please reply with a number.\n\n" +
      "Or reply *0* for main menu."
    );
    return;
  }
  
  if (num === 1) {
    // Book this service - show booking URL
    const service = flowState.selections.selectedService;
    if (service && service.bookingUrl) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        ` Great choice!\n\n` +
        `Click the link below to book *${service.name}*:\n\n` +
        `${service.bookingUrl}\n\n` +
        `Or reply *2* to browse more services.`
      );
    } else {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        " Please contact us directly to book this service.\n\n" +
        "Or reply *2* to browse more services."
      );
    }
  } else if (num === 2) {
    // Back to service listing
    await handleServiceListing(tenantId, phone, '2', flowState, deps);
  } else if (num === 3) {
    // Main menu
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `Hello! 👋 Welcome to our store!\n\n` +
      `How can we help you today?\n\n` +
      `1️⃣ Browse Products\n` +
      `2️ Browse Services\n` +
      `3️ 🔍 Search Products\n` +
      `4️⃣ Check Order Status\n` +
      `5️⃣ Payment Info\n` +
      `6️⃣ Talk to Support\n\n` +
      `*Reply with a number (1-6)*`
    );
  } else {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Invalid selection. Please reply with 1, 2, or 3.\n\n" +
      "Or reply *0* for main menu."
    );
  }
}

/**
 * Format a service for WhatsApp display
 */
function formatServiceMessage(service: Service, index: number): string {
  // Build pricing
  let priceText = '';
  if (service.packagePrices) {
    const prices = service.packagePrices;
    const validPrices = [prices.basic, prices.standard, prices.premium]
      .filter((p): p is number => p !== undefined && p > 0);
    if (validPrices.length === 1) {
      priceText = `💰 KES ${validPrices[0]!.toLocaleString()}`;
    } else if (validPrices.length > 1) {
      priceText = `💰 KES ${Math.min(...validPrices).toLocaleString()} - ${Math.max(...validPrices).toLocaleString()}`;
    } else {
      priceText = ` KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
    }
  } else if (service.priceMin === service.priceMax) {
    priceText = `💰 KES ${service.priceMin.toLocaleString()}`;
  } else {
    priceText = `💰 KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
  }
  
  // Build service info
  const info = [];
  if (service.duration) info.push(`⏱️ ${service.duration}`);
  if (service.businessCategory || service.categoryName) {
    info.push(`📂 ${service.businessCategory || service.categoryName}`);
  }
  const infoText = info.length > 0 ? `\n   ${info.join(' | ')}` : '';
  
  const description = service.description 
    ? `\n   📝 ${service.description.substring(0, 100)}${service.description.length > 100 ? '...' : ''}`
    : '';
  
  return `${index}. ${service.emoji || '🛠️'} *${service.name}*\n` +
    `   ${priceText}${infoText}${description}\n`;
}
