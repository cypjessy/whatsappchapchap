/**
 * Service Browse Handler
 * Handles browsing services via WhatsApp
 * Three-level navigation: Categories → Subcategories → Services → Service Details
 * 
 * UPDATED: Now supports full hierarchical browsing with subcategories
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";
import type { Service } from "@/lib/db";

// Import expanded service data helpers
// Note: This is client-side data, but we need server-side access
// We'll replicate the structure in Firestore via auto-population

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
  sendWelcomeMenu: (tenantId: string, phone: string) => Promise<void>;
  debugLog?: (...args: any[]) => void;
}

// Service category icons (fallback - will be overridden by Firestore data)
const DEFAULT_CATEGORY_ICONS: Record<string, string> = {
  beauty: '💇‍♀️',
  home: '🔧',
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
  legal: '⚖️',
  financial: '💰',
  real_estate: '🏠',
  logistics: '🚚',
  travel: '✈️',
  other: '✨'
};

/**
 * Start service browse flow - show service categories
 */
export async function startServiceBrowseFlow(
  tenantId: string,
  phone: string,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  try {
    // Get service categories from Firestore (pre-populated by AddServiceModal)
    const categoriesSnap = await adminDb
      .collection("serviceCategoryNames")
      .where("tenantId", "==", tenantId)
      .get();
    
    if (categoriesSnap.empty) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "🛠️ We don't have any services listed yet. Please check back soon!\n\n" +
        "Reply *0️⃣* for main menu."
      );
      return;
    }
    
    // Build categories with service counts
    const categories = categoriesSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        categorySlug: data.mainCategory,
        name: data.mainCategoryName || data.mainCategory,
        icon: data.icon || DEFAULT_CATEGORY_ICONS[data.mainCategory] || '✨',
        subcategories: data.subcategories || [],
        subcategoryMap: data.subcategoryMap || {},  // NEW: key -> display name mapping
        serviceCount: data.serviceCount || 0,
      };
    }).filter(cat => cat.serviceCount > 0); // Only show categories with services
    
    if (categories.length === 0) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "🛠️ No services available at the moment. Please check back soon!\n\n" +
        "Reply *0️⃣* for main menu."
      );
      return;
    }
    
    // Build categories menu
    const categoryList = categories
      .map((cat, idx) => `${idx + 1}️⃣ ${cat.icon} *${cat.name}* (${cat.serviceCount} services)`)
      .join('\n');
    
    const response = `🛠️ *Browse Services*\n\n` +
      `Choose a category:\n\n${categoryList}\n\n` +
      `0️⃣ Back to main menu`;
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
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
          },
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
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
  const { currentStep, selections } = flowState;
  
  await deps.startTyping(tenantId, phone);
  
  try {
    if (currentStep === 'category_selection') {
      await handleCategorySelection(tenantId, phone, message, selections, deps);
    } else if (currentStep === 'subcategory_selection') {
      await handleSubcategorySelection(tenantId, phone, message, flowState, deps);
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
  } catch (error) {
    console.error("[ServiceBrowse] Error handling input:", error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Something went wrong. Please try again or reply *0️⃣* for main menu."
    );
  }
}

/**
 * Handle category selection - show subcategories or services
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
  const trimmed = message.trim().toLowerCase();
  
  if (trimmed === '0' || trimmed === 'menu') {
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  if (isNaN(num) || num < 1 || num > categories.length) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please choose a number from 1️⃣ to ${categories.length}️⃣.\n\n` +
      `0️⃣ Back to main menu`
    );
    return;
  }
  
  const selectedCategory = categories[num - 1];
  
  // Check if category has subcategories
  if (selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
    // Show subcategories
    const subcategoryList = selectedCategory.subcategories
      .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
      .join('\n');
    
    const response = `📂 *${selectedCategory.name}* - Subcategories\n\n${subcategoryList}\n\n0️⃣ Back to categories`;
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'service_browse',
          currentStep: 'subcategory_selection',
          selections: {
            ...selections,
            categorySlug: selectedCategory.categorySlug,
            categoryName: selectedCategory.name,
            categorySubcategories: selectedCategory.subcategories,
            subcategoryMap: selectedCategory.subcategoryMap || {},  // NEW: Store key->name mapping
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // No subcategories, show services directly
    await showServicesForCategory(tenantId, phone, selectedCategory.categorySlug, selectedCategory.name, deps);
  }
}

/**
 * Handle subcategory selection - show services in that subcategory
 */
async function handleSubcategorySelection(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const { selections } = flowState;
  const num = parseInt(message.trim());
  const { categorySlug, categoryName, categorySubcategories, subcategoryMap } = selections;
  const trimmed = message.trim().toLowerCase();
  
  if (trimmed === '0' || trimmed === 'back') {
    await deps.stopTyping(tenantId, phone);
    await startServiceBrowseFlow(tenantId, phone, deps);
    return;
  }
  
  if (trimmed === 'menu') {
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  if (isNaN(num) || num < 1 || num > categorySubcategories.length) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `❌ Invalid selection. Please choose a number from 1️⃣ to ${categorySubcategories.length}️⃣.\n\n` +
      `0️⃣ Back to categories`
    );
    return;
  }
  
  const selectedSubcategoryName = categorySubcategories[num - 1];
  
  // FIXED: Find the subcategory key from the display name using the mapping
  let selectedSubcategoryKey = '';
  if (subcategoryMap && typeof subcategoryMap === 'object') {
    // Reverse lookup: find key by display name
    selectedSubcategoryKey = Object.entries(subcategoryMap).find(([key, name]) => name === selectedSubcategoryName)?.[0] || '';
  }
  
  if (deps.debugLog) {
    deps.debugLog("[ServiceBrowse] Selected subcategory:", {
      name: selectedSubcategoryName,
      key: selectedSubcategoryKey
    });
  }
  
  await showServicesForSubcategory(tenantId, phone, categorySlug, selectedSubcategoryName, selectedSubcategoryKey, categoryName, deps);
}

/**
 * Show services for a specific category (no subcategory)
 */
async function showServicesForCategory(
  tenantId: string,
  phone: string,
  categorySlug: string,
  categoryName: string,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  // Query services by businessType
  const servicesSnap = await adminDb
    .collection("services")
    .where("tenantId", "==", tenantId)
    .where("businessType", "==", categorySlug)
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
      `😔 No services found in ${categoryName}.\n\n` +
      `0️⃣ Back to categories`
    );
    return;
  }
  
  // Store service IDs for pagination
  const serviceIds = services.map(s => s.id);
  
  await showServiceBatch(tenantId, phone, services, 0, { name: categoryName, type: 'category' }, deps);
  
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
          categorySlug,
          categoryName,
          serviceIds,
          currentIndex: 0,
          listingType: 'category',
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

/**
 * Show services for a specific subcategory
 */
async function showServicesForSubcategory(
  tenantId: string,
  phone: string,
  categorySlug: string,
  subcategoryName: string,
  subcategoryKey: string,  // NEW: Added subcategory key parameter
  categoryName: string,
  deps: ServiceBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  // FIXED: Query by businessType and filter by subcategory key
  const servicesSnap = await adminDb
    .collection("services")
    .where("tenantId", "==", tenantId)
    .where("businessType", "==", categorySlug)
    .where("status", "==", "active")
    .get();
  
  let services = servicesSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data()
  })) as Service[];
  
  // Filter by subcategory key (services store the key, not display name)
  if (subcategoryKey) {
    services = services.filter((s: any) => s.subcategory === subcategoryKey);
  } else {
    // Fallback: try matching by display name
    services = services.filter((s: any) => s.subcategoryName === subcategoryName);
  }
  
  if (services.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      `😔 No services found in ${categoryName} → ${subcategoryName}.\n\n` +
      `0️⃣ Back to subcategories`
    );
    return;
  }
  
  // Store service IDs for pagination
  const serviceIds = services.map(s => s.id);
  
  await showServiceBatch(tenantId, phone, services, 0, { name: `${categoryName} → ${subcategoryName}`, type: 'subcategory' }, deps);
  
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
          categorySlug,
          categoryName,
          subcategoryName,
          serviceIds,
          currentIndex: 0,
          listingType: 'subcategory',
        },
        lastActivity: new Date().toISOString(),
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
  context: { name: string; type: string },
  deps: ServiceBrowseDeps
): Promise<void> {
  const batchSize = 5;
  const batch = services.slice(startIndex, startIndex + batchSize);
  const totalServices = services.length;
  
  let headerMessage = `🛠️ *${context.name}*\n\n`;
  headerMessage += `Showing ${startIndex + 1}-${Math.min(startIndex + batchSize, totalServices)} of ${totalServices} services:\n\n`;
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, headerMessage);
  
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
  
  // Show navigation options
  const remaining = totalServices - (startIndex + batchSize);
  let navigationMessage = `\n*Reply with a number to view service details:*\n`;
  
  for (let i = 0; i < batch.length; i++) {
    navigationMessage += `${i + 1}️⃣ - View *${batch[i].name}*\n`;
  }
  
  navigationMessage += `\n`;
  
  if (remaining > 0) {
    navigationMessage += `6️⃣ - View More (${remaining} more)\n`;
  }
  navigationMessage += `0️⃣ - Go back\n`;
  navigationMessage += `*MENU* - Main menu`;
  
  await deps.sendMessage(tenantId, phone, navigationMessage);
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
  const trimmed = message.trim().toLowerCase();
  const { serviceIds, currentIndex, listingType, categorySlug, categoryName, subcategoryName } = flowState.selections;
  
  // Handle navigation commands
  if (trimmed === '0' || trimmed === 'back') {
    if (listingType === 'subcategory') {
      // Go back to subcategories
      await deps.stopTyping(tenantId, phone);
      await startServiceBrowseFlow(tenantId, phone, deps);
    } else {
      // Go back to categories
      await deps.stopTyping(tenantId, phone);
      await startServiceBrowseFlow(tenantId, phone, deps);
    }
    return;
  }
  
  if (trimmed === 'menu') {
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  const batchSize = 5;
  const currentBatchIds = serviceIds.slice(currentIndex, currentIndex + batchSize);
  
  // Numbers 1-5 = select a service from current batch
  if (num >= 1 && num <= currentBatchIds.length) {
    const selectedServiceId = currentBatchIds[num - 1];
    const serviceDoc = await adminDb.collection("services").doc(selectedServiceId).get();
    
    if (!serviceDoc.exists) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "❌ Service not found. Please try browsing again.\n\n" +
        "0️⃣ Go back"
      );
      return;
    }
    
    const selectedService = { id: serviceDoc.id, ...serviceDoc.data() } as Service;
    await showServiceDetail(tenantId, phone, selectedService, flowState, deps);
    return;
  }
  
  // Number 6 = view more
  if (num === 6) {
    const nextIndex = currentIndex + batchSize;
    if (nextIndex >= serviceIds.length) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "✅ You've seen all services.\n\n" +
        "0️⃣ - Go back\n" +
        "*MENU* - Main menu"
      );
      return;
    }
    
    // Fetch next batch of services
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
    
    // Preserve order
    nextServices.sort((a, b) => nextBatchIds.indexOf(a.id) - nextBatchIds.indexOf(b.id));
    
    let contextName = categoryName;
    if (subcategoryName) {
      contextName = `${categoryName} → ${subcategoryName}`;
    }
    
    await showServiceBatch(
      tenantId,
      phone,
      nextServices,
      0,
      { name: contextName, type: listingType },
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
    return;
  }
  
  // Invalid selection
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(
    tenantId,
    phone,
    `❌ Invalid selection. Please reply with 1️⃣-${currentBatchIds.length}️⃣ to view a service, or 6️⃣ for more.\n\n` +
    `0️⃣ - Go back\n` +
    `*MENU* - Main menu`
  );
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
      pricingText = `\n💰 *Pricing:*\n${priceLines.join('\n')}`;
    }
  } else if (service.priceMin === service.priceMax) {
    pricingText = `\n💰 *Price:* KES ${service.priceMin?.toLocaleString() || 'N/A'}`;
  } else if (service.priceMin && service.priceMax) {
    pricingText = `\n💰 *Price Range:* KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
  }
  
  // Build service details
  const details = [];
  
  if (service.providerName) {
    details.push(`👤 *Provider:* ${service.providerName}`);
  }
  
  if (service.duration) {
    details.push(`⏱️ *Duration:* ${service.duration}`);
  }
  
  if (service.location) {
    const locationMap: Record<string, string> = {
      'client-place': "Client's place",
      'my-place': 'My place',
      'remote': 'Remote/Online',
      'both-places': 'Both locations'
    };
    details.push(`📍 *Location:* ${locationMap[service.location] || service.location}`);
  }
  
  if (service.mode) {
    const modeMap: Record<string, string> = {
      'in-person': 'In-Person',
      'online': 'Online',
      'hybrid': 'Hybrid'
    };
    details.push(`🔄 *Mode:* ${modeMap[service.mode] || service.mode}`);
  }
  
  if (service.businessCategory || service.categoryName) {
    details.push(`📂 *Category:* ${service.businessCategory || service.categoryName}`);
  }
  
  if (service.subcategoryName) {
    details.push(`📁 *Subcategory:* ${service.subcategoryName}`);
  }
  
  if (service.rating) {
    details.push(`⭐ *Rating:* ${service.rating}/5`);
  }
  
  const detailsText = details.length > 0 ? `\n\n${details.join('\n')}` : '';
  
  // Build specifications section
  let specsText = '';
  if (service.specifications && typeof service.specifications === 'object') {
    const specEntries = Object.entries(service.specifications);
    if (specEntries.length > 0) {
      const specLines = specEntries.map(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
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
  
  // Build package features
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
  
  // Build availability
  let availabilityText = '';
  if (service.availability) {
    const availParts = [];
    if (service.availability.days && service.availability.days.length > 0) {
      availParts.push(`📅 ${service.availability.days.join(', ')}`);
    }
    if (service.availability.timeSlots && service.availability.timeSlots.length > 0) {
      const timeSlots = service.availability.timeSlots.slice(0, 5);
      availParts.push(`⏰ ${timeSlots.join(', ')}${service.availability.timeSlots.length > 5 ? '...' : ''}`);
    }
    if (availParts.length > 0) {
      availabilityText = `\n\n🕒 *Available:*\n   ${availParts.join(' · ')}`;
    }
  }
  
  // Booking URL
  let bookingUrlText = '';
  if (service.bookingUrl) {
    bookingUrlText = `\n\n🛒 *Book Now:* ${service.bookingUrl}`;
  }
  
  // Build complete message
  let completeMessage = `${service.emoji || '🛠️'} *${service.name}*${pricingText}${detailsText}`;
  completeMessage += bookingUrlText;
  
  // Add description
  if (service.description && service.description.trim() !== '') {
    const desc = service.description.length > 300 
      ? service.description.substring(0, 300) + '...' 
      : service.description;
    completeMessage += `\n\n📝 *Description:*\n${desc}`;
  }
  
  completeMessage += specsText;
  completeMessage += featuresText;
  completeMessage += availabilityText;
  
  // Navigation options
  const navOptions = `\n\n*Reply with a number:*\n` +
    `1️⃣ - Book this service\n` +
    `2️⃣ - Back to services\n` +
    `3️⃣ - Main menu\n` +
    `0️⃣ - Browse Categories`;
  
  // Ensure message isn't too long
  const MAX_LENGTH = 980;
  if (completeMessage.length + navOptions.length > MAX_LENGTH) {
    const availableForContent = MAX_LENGTH - navOptions.length - 50;
    completeMessage = completeMessage.substring(0, availableForContent) + '...';
  }
  
  completeMessage += navOptions;
  
  // Send message
  if (service.imageUrl || (service.portfolioImages && service.portfolioImages.length > 0)) {
    const imageUrl = service.imageUrl || service.portfolioImages![0];
    if (deps.sendMedia) {
      await deps.sendMedia(tenantId, phone, imageUrl, completeMessage);
    } else {
      await deps.sendMessage(tenantId, phone, completeMessage);
    }
  } else {
    await deps.sendMessage(tenantId, phone, completeMessage);
  }
  
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
  const trimmed = message.trim().toLowerCase();
  
  if (trimmed === '0' || trimmed === 'categories') {
    await deps.stopTyping(tenantId, phone);
    await startServiceBrowseFlow(tenantId, phone, deps);
    return;
  }
  
  if (trimmed === 'menu') {
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
    return;
  }
  
  if (isNaN(num)) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Please reply with a number:\n\n" +
      "1️⃣ - Book this service\n" +
      "2️⃣ - Back to services\n" +
      "3️⃣ - Main menu\n" +
      "0️⃣ - Browse Categories"
    );
    return;
  }
  
  if (num === 1) {
    // Book this service
    const serviceId = flowState.selections.selectedServiceId;
    if (!serviceId) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        "❌ Service not found. Please try browsing again.\n\n" +
        "0️⃣ Browse Categories"
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
        "0️⃣ Browse Categories"
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
    // Back to services
    const { serviceIds, currentIndex, listingType, categorySlug, categoryName, subcategoryName } = flowState.selections;
    
    if (serviceIds && serviceIds.length > 0) {
      // Re-fetch current batch
      const batchSize = 5;
      const currentBatchIds = serviceIds.slice(currentIndex, currentIndex + batchSize);
      const services: Service[] = [];
      
      for (let i = 0; i < currentBatchIds.length; i += 10) {
        const batch = currentBatchIds.slice(i, i + 10);
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
      
      services.sort((a, b) => currentBatchIds.indexOf(a.id) - currentBatchIds.indexOf(b.id));
      
      let contextName = categoryName;
      if (subcategoryName) {
        contextName = `${categoryName} → ${subcategoryName}`;
      }
      
      await showServiceBatch(
        tenantId,
        phone,
        services,
        0,
        { name: contextName, type: listingType },
        deps
      );
      
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            ...flowState,
            currentStep: 'service_listing',
            lastActivity: new Date().toISOString()
          }
        }, { merge: true });
    } else {
      await deps.stopTyping(tenantId, phone);
      await startServiceBrowseFlow(tenantId, phone, deps);
    }
  } else if (num === 3) {
    // Main menu
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
  } else {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(
      tenantId,
      phone,
      "❌ Invalid selection. Please reply with 1️⃣, 2️⃣, 3️⃣, or 0️⃣.\n\n" +
      "1️⃣ - Book this service\n" +
      "2️⃣ - Back to services\n" +
      "3️⃣ - Main menu\n" +
      "0️⃣ - Browse Categories"
    );
  }
}

/**
 * Format a service for WhatsApp display (list view)
 */
function formatServiceMessage(service: Service, index: number): string {
  const emojiNumbers = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  const numberEmoji = emojiNumbers[index - 1] || `${index}️⃣`;
  
  // Build pricing
  let priceText = '';
  if (service.packagePrices) {
    const prices = service.packagePrices;
    const validPrices = [prices.basic, prices.standard, prices.premium]
      .filter((p): p is number => p !== undefined && p > 0);
    if (validPrices.length === 1) {
      priceText = `💰 KES ${validPrices[0].toLocaleString()}`;
    } else if (validPrices.length > 1) {
      priceText = `💰 KES ${Math.min(...validPrices).toLocaleString()} - ${Math.max(...validPrices).toLocaleString()}`;
    }
  } else if (service.priceMin === service.priceMax) {
    priceText = `💰 KES ${service.priceMin?.toLocaleString() || 'N/A'}`;
  } else if (service.priceMin && service.priceMax) {
    priceText = `💰 KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
  }
  
  // Build info badges
  const info = [];
  if (service.duration) info.push(`⏱️ ${service.duration}`);
  if (service.location) {
    const locationShort: Record<string, string> = {
      'client-place': '🏠 Client',
      'my-place': '🏢 Studio',
      'remote': '💻 Remote',
      'both-places': '📍 Both'
    };
    info.push(locationShort[service.location] || service.location);
  }
  const infoText = info.length > 0 ? `\n   ${info.join(' | ')}` : '';
  
  // Short description
  const description = service.description 
    ? `\n   📝 ${service.description.substring(0, 80)}${service.description.length > 80 ? '...' : ''}`
    : '';
  
  return `${numberEmoji} ${service.emoji || '🛠️'} *${service.name}*\n` +
    `   ${priceText}${infoText}${description}\n`;
}