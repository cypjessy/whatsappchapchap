/**
 * Service Browse Handler
 * Handles browsing services via WhatsApp
 * Two-level navigation: Categories → Services
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { Service } from "@/lib/db";

/**
 * Lazy initialization - get Firestore instance only when needed
 */
function getDb() {
  return getFirestore();
}

/**
 * Dependencies passed from main route
 */
export interface ServiceBrowseDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  sendMedia?: (tenantId: string, phone: string, mediaUrl: string, caption: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
  sendWelcomeMenu: (tenantId: string, phone: string) => Promise<void>;  // ADDED
}

// Business type icons
const BUSINESS_ICONS: Record<string, string> = {
  beauty: '💇‍♀️',
  home: '🏠',
  health: '🏥',
  education: '📚',
  automotive: '🚗',
  events: '🎉',
  tech: '💻',
  fitness: '🏋️',
  cleaning: '🧹',
  photography: '📸',
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
      .collection("services")
      .where("tenantId", "==", tenantId)
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
        "Please check back later or reply *0️⃣* for main menu."
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
      name: typeServices[0]?.businessCategory || typeServices[0]?.categoryName || type,
      icon: BUSINESS_ICONS[type] || '✨',
      count: typeServices.length
    }));
    
    // Build categories menu with emoji numbers
    const categoryList = categories
      .map((cat, idx) => {
        const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        return `${emojiNumbers[idx]} ${cat.icon} *${cat.name}* (${cat.count} services)`;
      })
      .join('\n');
    
    const response = `🛠️ *Browse Our Services*\n\n` +
      `Choose a category:\n\n${categoryList}\n\n` +
      `*Reply with a number (1️⃣-${categories.length}️⃣)*\n` +
      `Or reply *0️⃣* for main menu`;
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
    // Store only IDs, not full service objects
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
            // Store only IDs grouped by type, not full objects
            serviceIdsByType: Object.fromEntries(
              Object.entries(servicesByType).map(([type, svcs]) => [
                type,
                svcs.map(s => s.id)
              ])
            ),
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
      "❌ Sorry, something went wrong. Please try again or reply *0️⃣* for main menu."
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
      "❌ Invalid state. Reply *0️⃣* for main menu."
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
  const serviceIdsByType = selections.serviceIdsByType;
  
  if (isNaN(num) || num < 1 || num > categories.length) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please choose a number from 1️⃣ to ${categories.length}️⃣.\n\n` +
      `Or reply *0️⃣* for main menu.`
    );
    return;
  }
  
  const selectedCategory = categories[num - 1];
  const serviceIds = serviceIdsByType[selectedCategory.type] || [];
  
  if (serviceIds.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ No services found in this category.\n\n` +
      `Reply *0️⃣* for main menu.`
    );
    return;
  }
  
  // Re-fetch full service objects by ID
  const services: Service[] = [];
  const batchSize = 10;
  for (let i = 0; i < serviceIds.length; i += batchSize) {
    const batch = serviceIds.slice(i, i + batchSize);
    const servicesSnap = await adminDb
      .collection("services")
      .where('__name__', 'in', batch)
      .get();
    
    servicesSnap.docs.forEach((doc: any) => {
      services.push({
        id: doc.id,
        ...doc.data()
      });
    });
  }
  
  // Preserve original order
  services.sort((a, b) => serviceIds.indexOf(a.id) - serviceIds.indexOf(b.id));
  
  if (services.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ No services found in this category.\n\n` +
      `Reply *0️⃣* for main menu.`
    );
    return;
  }
  
  // Show first 5 services
  await showServiceBatch(tenantId, phone, services, 0, selectedCategory, deps);
  
  // Update flow state - store service IDs only
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
          categoryServiceIds: serviceIds,
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
      if (deps.sendMedia) {
        await deps.sendMedia(tenantId, phone, imageUrl, serviceMessage);
      } else {
        await deps.sendMessage(tenantId, phone, serviceMessage);
      }
    } else {
      await deps.sendMessage(tenantId, phone, serviceMessage);
    }
    
    // Small delay between messages
    if (idx < batch.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  // Show navigation with clear service selection numbers
  const remaining = services.length - (startIndex + batchSize);
  let responseText = `\n*Reply with a number to view a service:*\n`;
  
  for (let i = 0; i < batch.length; i++) {
    responseText += `${i + 1}️⃣ - View *${batch[i].name}* details\n`;
  }
  
  responseText += `\n`;
  
  if (remaining > 0) {
    responseText += `6️⃣ - View More (${remaining} more)\n`;
  }
  responseText += `7️⃣ - Back to categories\n`;
  responseText += `8️⃣ - Main menu`;
  
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
  const { categoryServiceIds, currentIndex, categoryName } = flowState.selections;
  
  if (isNaN(num)) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Please reply with a number.\n\n" +
      "Or reply *0️⃣* for main menu."
    );
    return;
  }
  
  const batchSize = 5;
  
  // Re-fetch current batch for service selection
  const serviceIds = categoryServiceIds;
  const startIdx = currentIndex;
  const currentBatchIds = serviceIds.slice(startIdx, startIdx + batchSize);
  
  // Numbers 1-5 = select a service from current batch
  if (num >= 1 && num <= currentBatchIds.length) {
    const selectedServiceId = currentBatchIds[num - 1];
    const serviceDoc = await adminDb.collection("services").doc(selectedServiceId).get();
    const selectedService = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
    
    await showServiceDetail(tenantId, phone, selectedService, flowState, deps);
    return;
  }
  
  // Shifted navigation numbers
  if (num === 6) {
    // View more services
    const nextIndex = currentIndex + batchSize;
    if (nextIndex >= serviceIds.length) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "✅ You've seen all services in this category.\n\n" +
        "*Reply with a number:*\n" +
        "7️⃣ - Back to categories\n" +
        "8️⃣ - Main menu"
      );
      return;
    }
    
    // Re-fetch services for next batch
    const nextBatchIds = serviceIds.slice(nextIndex, nextIndex + batchSize);
    const nextServices: Service[] = [];
    
    for (let i = 0; i < nextBatchIds.length; i += 10) {
      const batch = nextBatchIds.slice(i, i + 10);
      const servicesSnap = await adminDb
        .collection("services")
        .where('__name__', 'in', batch)
        .get();
      
      servicesSnap.docs.forEach((doc: any) => {
        nextServices.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }
    
    nextServices.sort((a, b) => nextBatchIds.indexOf(a.id) - nextBatchIds.indexOf(b.id));
    
    await showServiceBatch(
      tenantId,
      phone,
      nextServices,
      0,
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
      
  } else if (num === 7) {
    // Back to categories
    await startServiceBrowseFlow(tenantId, phone, deps);
    
  } else if (num === 8) {
    // Main menu - use the passed dependency
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
  } else {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Invalid selection. Please reply with 1️⃣-8️⃣ as shown above.\n\n" +
      "Or reply *0️⃣* for main menu."
    );
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
  
  // Build pricing display based on your DB schema
  let pricingText = '';
  
  // Check for packagePrices (new structure)
  if (service.packagePrices) {
    const prices = service.packagePrices;
    const priceLines = [];
    if (prices.basic) priceLines.push(`   • Basic: KES ${prices.basic.toLocaleString()}`);
    if (prices.standard) priceLines.push(`   • Standard: KES ${prices.standard.toLocaleString()}`);
    if (prices.premium) priceLines.push(`   • Premium: KES ${prices.premium.toLocaleString()}`);
    
    if (priceLines.length > 0) {
      pricingText = `\n💰 *Pricing:*\n${priceLines.join('\n')}`;
    }
  } 
  // Fallback to priceMin/priceMax
  else if (service.priceMin === service.priceMax) {
    pricingText = `\n💰 *Price:* KES ${service.priceMin.toLocaleString()}`;
  } else if (service.priceMin && service.priceMax) {
    pricingText = `\n💰 *Price Range:* KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
  }
  
  // Build service details based on your DB schema
  const details = [];
  
  // Provider name
  if (service.providerName) {
    details.push(`👤 *Provider:* ${service.providerName}`);
  }
  
  // Duration - IMPORTANT field from your DB
  if (service.duration) {
    details.push(`⏱️ *Duration:* ${service.duration}`);
  }
  
  // Location
  if (service.location) {
    const locationMap: Record<string, string> = {
      'client-place': "Client's place",
      'my-place': 'My place',
      'remote': 'Remote/Online',
      'both-places': 'Both locations'
    };
    details.push(`📍 *Location:* ${locationMap[service.location] || service.location}`);
  }
  
  // Mode
  if (service.mode) {
    const modeMap: Record<string, string> = {
      'in-person': 'In-Person',
      'online': 'Online',
      'hybrid': 'Hybrid'
    };
    details.push(`🔄 *Mode:* ${modeMap[service.mode] || service.mode}`);
  }
  
  // Category
  if (service.businessCategory || service.categoryName) {
    details.push(`📂 *Category:* ${service.businessCategory || service.categoryName}`);
  }
  
  // Rating
  if (service.rating) {
    details.push(`⭐ *Rating:* ${service.rating}/5`);
  }
  
  const detailsText = details.length > 0 ? `\n\n${details.join('\n')}` : '';
  
  // Build specifications section - properly display arrays
  let specsText = '';
  if (service.specifications && typeof service.specifications === 'object') {
    const specEntries = Object.entries(service.specifications);
    if (specEntries.length > 0) {
      const specLines = specEntries.map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        // Handle array values properly
        if (Array.isArray(value) && value.length > 0) {
          return `   • ${formattedKey}: ${value.join(', ')}`;
        } else if (typeof value === 'string' && value) {
          return `   • ${formattedKey}: ${value}`;
        }
        return null;
      }).filter(line => line !== null);
      
      if (specLines.length > 0) {
        specsText = `\n\n📋 *Specifications:*\n${specLines.join('\n')}`;
      }
    }
  }
  
  // Build package features section
  let featuresText = '';
  if (service.packageFeatures) {
    const featureSections = [];
    
    if (service.packagePrices?.basic && service.packageFeatures.basic?.length > 0) {
      featureSections.push(`   *Basic Package:*\n${service.packageFeatures.basic.map(f => `     ✓ ${f}`).join('\n')}`);
    }
    if (service.packagePrices?.standard && service.packageFeatures.standard?.length > 0) {
      featureSections.push(`   *Standard Package:*\n${service.packageFeatures.standard.map(f => `     ✓ ${f}`).join('\n')}`);
    }
    if (service.packagePrices?.premium && service.packageFeatures.premium?.length > 0) {
      featureSections.push(`   *Premium Package:*\n${service.packageFeatures.premium.map(f => `     ✓ ${f}`).join('\n')}`);
    }
    
    if (featureSections.length > 0) {
      featuresText = `\n\n✨ *What's Included:*\n${featureSections.join('\n\n')}`;
    }
  }
  
  // Build tags section
  let tagsText = '';
  if (service.tags && service.tags.length > 0) {
    tagsText = `\n\n🏷️ *Tags:* ${service.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')}`;
  }
  
  // Build availability section
  let availabilityText = '';
  if (service.availability) {
    const availParts = [];
    if (service.availability.days && service.availability.days.length > 0) {
      availParts.push(`📅 ${service.availability.days.join(', ')}`);
    }
    if (service.availability.timeSlots && service.availability.timeSlots.length > 0) {
      availParts.push(`⏰ ${service.availability.timeSlots.join(', ')}`);
    }
    if (availParts.length > 0) {
      availabilityText = `\n\n🕒 *Available:*\n   ${availParts.join(' · ')}`;
    }
  }
  
  // Booking URL - use direct link from database
  let bookingUrlText = '';
  if (service.bookingUrl) {
    bookingUrlText = `\n\n🛒 *Book Now:* ${service.bookingUrl}`;
  }
  
  // Proper emoji fallback
  let completeMessage = `${service.emoji || '🛠️'} *${service.name}*${pricingText}${detailsText}`;
  
  // CRITICAL: Add booking URL immediately after basic info
  completeMessage += bookingUrlText;
  
  // Add description (truncated like products - max 300 chars)
  if (service.description && service.description.trim() !== '') {
    const desc = service.description.length > 300 
      ? service.description.substring(0, 300) + '...' 
      : service.description;
    completeMessage += `\n\n📝 *Description:*\n${desc}`;
  }
  
  // Add specifications
  completeMessage += specsText;
  
  // Add package features
  completeMessage += featuresText;
  
  // Add availability
  completeMessage += availabilityText;
  
  // Fixed navigation options
  const navOptions = `\n\n*Reply with a number:*\n` +
    `1️⃣ - Book this service\n` +
    `2️⃣ - Back to services\n` +
    `3️⃣ - Main menu\n` +
    `4️⃣ - Browse Service Categories`;
  
  // Hard cap the message at 980 characters to prevent WhatsApp truncation
  const MAX_CAPTION = 980;
  
  // Find where booking URL ends
  const safeBase = completeMessage.substring(0, completeMessage.indexOf(bookingUrlText) + bookingUrlText.length);
  
  if (completeMessage.length + navOptions.length > MAX_CAPTION) {
    // Calculate how much we can keep after the safe base
    const remainingSpace = MAX_CAPTION - safeBase.length - navOptions.length - 10;
    let truncatedContent = completeMessage.substring(safeBase.length, safeBase.length + remainingSpace);
    
    // Find last complete word or sentence
    const lastPeriod = truncatedContent.lastIndexOf('.');
    const lastNewline = truncatedContent.lastIndexOf('\n');
    const cutPoint = Math.max(lastPeriod, lastNewline, 50);
    
    truncatedContent = truncatedContent.substring(0, cutPoint);
    if (truncatedContent.length < completeMessage.substring(safeBase.length).length) {
      truncatedContent += '...';
    }
    
    completeMessage = safeBase + truncatedContent + navOptions;
  } else {
    completeMessage += navOptions;
  }
  
  console.log(`[ServiceBrowse] Complete message length: ${completeMessage.length} chars`);
  console.log(`[ServiceBrowse] Has booking URL: ${!!service.bookingUrl}`);
  
  // Send using same pattern as products
  if (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) {
    const imageUrl = service.imageUrl || service.portfolioImages![0];
    if (deps.sendMedia) {
      console.log(`[ServiceBrowse] Sending with image (product pattern)`);
      await deps.sendMedia(tenantId, phone, imageUrl, completeMessage);
    } else {
      console.log(`[ServiceBrowse] sendMedia not available, sending as text`);
      await deps.sendMessage(tenantId, phone, completeMessage);
    }
  } else {
    console.log(`[ServiceBrowse] No image, sending complete message as text`);
    await deps.sendMessage(tenantId, phone, completeMessage);
  }
  
  console.log(`[ServiceBrowse] Service details sent successfully`);
  
  // Store only service ID, not full object
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
          selectedServiceId: service.id,
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
  const adminDb = getDb();
  const num = parseInt(message.trim());
  
  if (isNaN(num)) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Please reply with a number.\n\n" +
      "Or reply *0️⃣* for main menu."
    );
    return;
  }
    
  if (num === 1) {
    // Re-fetch service by ID instead of reading from flow state
    const serviceId = flowState.selections.selectedServiceId;
    if (!serviceId) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "❌ Service not found. Please try browsing again.\n\n" +
        "Reply *0️⃣* for main menu."
      );
      return;
    }
    
    const serviceDoc = await adminDb.collection("services").doc(serviceId).get();
    
    if (!serviceDoc.exists) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "❌ Service not found. Please try browsing again.\n\n" +
        "Reply *0️⃣* for main menu."
      );
      return;
    }
    
    const service = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
    
    if (service && service.bookingUrl) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `🎉 *Great choice!*\n\n` +
        `Click the link below to book *${service.name}*:\n\n` +
        `${service.bookingUrl}\n\n` +
        `Or reply *2* to browse more services.`
      );
    } else {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "📞 *Contact Us*\n\n" +
        "Please contact us directly to book this service.\n\n" +
        "Or reply *2️⃣* to browse more services."
      );
    }
  } else if (num === 2) {
    // Back to service listing
    await handleServiceListing(tenantId, phone, '7', flowState, deps);
  } else if (num === 3) {
    // Main menu - use passed dependency
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
  } else if (num === 4) {
    // Browse Service Categories
    await startServiceBrowseFlow(tenantId, phone, deps);
  } else {
    // Updated error message to include 4️⃣
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Invalid selection. Please reply with 1️⃣, 2️⃣, 3️⃣, or 4️⃣.\n\n" +
      "Or reply *0️⃣* for main menu."
    );
  }
}

/**
 * Format a service for WhatsApp display (list view)
 */
function formatServiceMessage(service: Service, index: number): string {
  // Emoji numbers for list display
  const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  const numberEmoji = emojiNumbers[index - 1] || `${index}️⃣`;
  
  // Build pricing based on your DB schema
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
      priceText = `💰 KES ${service.priceMin?.toLocaleString() || '0'} - ${service.priceMax?.toLocaleString() || '0'}`;
    }
  } else if (service.priceMin === service.priceMax) {
    priceText = `💰 KES ${service.priceMin?.toLocaleString() || '0'}`;
  } else if (service.priceMin && service.priceMax) {
    priceText = `💰 KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
  } else {
    priceText = `💰 Price on request`;
  }
  
  // Build service info
  const info = [];
  if (service.duration) info.push(`⏱️ ${service.duration}`);
  if (service.businessCategory || service.categoryName) {
    info.push(`📂 ${service.businessCategory || service.categoryName}`);
  }
  if (service.location) {
    const locationMap: Record<string, string> = {
      'client-place': '🏠 Client',
      'my-place': '🏢 My place',
      'remote': '💻 Remote',
      'both-places': '📍 Both'
    };
    info.push(locationMap[service.location] || service.location);
  }
  const infoText = info.length > 0 ? `\n   ${info.join(' | ')}` : '';
  
  // Short description
  const description = service.description 
    ? `\n   📝 ${service.description.substring(0, 80)}${service.description.length > 80 ? '...' : ''}`
    : '';
  
  return `${numberEmoji} ${service.emoji || '🛠️'} *${service.name}*\n` +
    `   ${priceText}${infoText}${description}\n`;
}