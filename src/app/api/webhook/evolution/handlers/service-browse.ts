/**
 * Service Browse Handler
 * Handles browsing services via WhatsApp
 * Two-level navigation: Categories → Services
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { shortenUrl } from "@/lib/url-shortener";
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
  const servicesByType = selections.servicesByType;
  
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
  const categoryServices = servicesByType[selectedCategory.type] || [];
  
  if (categoryServices.length === 0) {
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
  
  // Show navigation options with emoji numbers
  const remaining = services.length - (startIndex + batchSize);
  let responseText = `\n*Reply with a number:*\n`;
  
  if (remaining > 0) {
    responseText += `1️⃣ - View More (${remaining} more)\n`;
  }
  responseText += `2️⃣ - Back to categories\n`;
  responseText += `3️⃣ - Main menu`;
  
  if (remaining > 0) {
    responseText += `\n4️⃣ - Browse Service Categories`;
  }
  
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
  const { categoryServices, currentIndex, categoryName } = flowState.selections;
    
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
        "2️⃣ - Back to categories\n" +
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
    // Main menu - with proper emoji numbers
    const adminDb = getDb();
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
      `*Reply with a number (1️⃣-6️⃣)*`
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
  } else if (num === 4) {
    // Browse service categories - restart service browse flow
    await startServiceBrowseFlow(tenantId, phone, deps);
  } else {
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
  
  // Build specifications section - FIXED to properly display arrays
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
  
  // Booking URL (shortened)
  let bookingUrlText = '';
  if (service.bookingUrl) {
    try {
      const shortUrl = await shortenUrl(service.bookingUrl);
      bookingUrlText = `\n\n🛒 *Book Now:* ${shortUrl}`;
    } catch (error) {
      console.error("[ServiceBrowse] Error shortening URL:", error);
      bookingUrlText = `\n\n🛒 *Book Now:* ${service.bookingUrl}`;
    }
  }
  
  // Build the complete message (used only when no image available)
  let message = `${service.emoji || '🛠️'} *${service.name}*${pricingText}${detailsText}`;
  
  // Description
  if (service.description) {
    message += `\n\n📝 *Description:*\n${service.description}`;
  }
  
  // Add remaining sections
  message += specsText + featuresText + tagsText + availabilityText + bookingUrlText;
  
  // Send service details - ALWAYS send image with caption FIRST, then description and details AFTER
  if (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) {
    const imageUrl = service.imageUrl || service.portfolioImages![0];
    if (deps.sendMedia) {
      // STEP 1: Send image with a short caption (under 1024 chars) - NO description here
      const shortCaption = `${service.emoji || '🛠️'} *${service.name}*${pricingText}${detailsText}`;
      await deps.sendMedia(tenantId, phone, imageUrl, shortCaption.substring(0, 1000));
      
      // STEP 2: Send full details as separate text message - description comes FIRST in this message
      let fullMessage = '';
      if (service.description) {
        fullMessage += `📝 *Description:*\n${service.description}`;
      }
      fullMessage += specsText + featuresText + tagsText + availabilityText + bookingUrlText;
      
      if (fullMessage) {
        await deps.sendMessage(tenantId, phone, fullMessage);
      }
    } else {
      // Fallback: send everything as one message (no image)
      await deps.sendMessage(tenantId, phone, message);
    }
  } else {
    // No image: send complete message
    await deps.sendMessage(tenantId, phone, message);
  }
  
  // Navigation options with emoji numbers
  const responseText = `\n*Reply with a number:*\n` +
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
      "Or reply *0️⃣* for main menu."
    );
    return;
  }
    
  if (num === 1) {
    // Book this service
    const service = flowState.selections.selectedService;
    if (service && service.bookingUrl) {
      try {
        const shortUrl = await shortenUrl(service.bookingUrl);
        await deps.stopTyping(tenantId, phone);
        await deps.sendMessage(
          tenantId,
          phone,
          `🎉 *Great choice!*\n\n` +
          `Click the link below to book *${service.name}*:\n\n` +
          `${shortUrl}\n\n` +
          `Or reply *2️⃣* to browse more services.`
        );
      } catch (error) {
        console.error("[ServiceBrowse] Error shortening URL:", error);
        await deps.stopTyping(tenantId, phone);
        await deps.sendMessage(
          tenantId,
          phone,
          `🎉 *Great choice!*\n\n` +
          `Click the link below to book *${service.name}*:\n\n` +
          `${service.bookingUrl}\n\n` +
          `Or reply *2️⃣* to browse more services.`
        );
      }
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
    await handleServiceListing(tenantId, phone, '2', flowState, deps);
  } else if (num === 3) {
    // Main menu - with proper emoji numbers
    const adminDb = getDb();
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
      `*Reply with a number (1️⃣-6️⃣)*`
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
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Invalid selection. Please reply with 1️⃣, 2️⃣, or 3️⃣.\n\n" +
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
      priceText = `💰 KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
    }
  } else if (service.priceMin === service.priceMax) {
    priceText = `💰 KES ${service.priceMin.toLocaleString()}`;
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