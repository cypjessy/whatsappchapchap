// src/app/api/webhook/evolution/handlers/service-search.ts
// Service search handler - similar to product-search but for services

import { getFirestore } from "firebase-admin/firestore";

let adminDb: ReturnType<typeof getFirestore> | null = null;

function getAdminDb() {
  if (!adminDb) {
    adminDb = getFirestore();
  }
  return adminDb;
}

export interface Deps {
  sendTypingIndicator: (tenantId: string, phone: string) => Promise<void>;
  stopTypingIndicator: (tenantId: string, phone: string) => Promise<void>;
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  sendMedia?: (tenantId: string, phone: string, mediaUrl: string, caption: string) => Promise<void>;  // ✅ Added
  setFlowState: (tenantId: string, phone: string, state: any) => Promise<void>;
}

// Fuzzy matching helper
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

function isFuzzyMatch(a: string, b: string, maxDistance: number = 2): boolean {
  if (!a || !b) return false;
  
  // Full string match
  if (levenshteinDistance(a, b) <= maxDistance) return true;
  
  // Word-level match (each word in 'a' against 'b')
  const words = a.split(/\s+/);
  for (const word of words) {
    if (word.length > 2 && levenshteinDistance(word, b) <= maxDistance) return true;
  }
  
  return false;
}

// Debug logging helper
function debugLog(...args: any[]) {
  if (process.env.DEBUG === 'true') {
    console.log(...args);
  }
}

// Helper to get display price
function getServicePrice(service: any): string {
  if (service.packagePrices?.basic) {
    return `KES ${service.packagePrices.basic.toLocaleString()}`;
  }
  if (service.packagePrices?.standard) {
    return `KES ${service.packagePrices.standard.toLocaleString()}`;
  }
  if (service.packagePrices?.premium) {
    return `KES ${service.packagePrices.premium.toLocaleString()}`;
  }
  if (service.priceMin === service.priceMax && service.priceMin > 0) {
    return `KES ${service.priceMin.toLocaleString()}`;
  }
  if (service.priceMin && service.priceMax) {
    return `KES ${service.priceMin.toLocaleString()} - ${service.priceMax.toLocaleString()}`;
  }
  return `Price on request`;
}

// Helper to get display mode
function getDisplayMode(mode: string): string {
  const modeMap: Record<string, string> = {
    'in-person': '🏠 In-Person',
    'remote': '💻 Remote/Online',
    'both': '📍 Both Options'
  };
  return modeMap[mode] || mode;
}

/**
 * Handle service search request
 * Similar logic to product-search but for services
 */
export async function handleServiceSearch(
  tenantId: string,
  phone: string,
  query: string,
  deps: Deps
): Promise<void> {
  await deps.sendTypingIndicator(tenantId, phone);
  
  try {
    debugLog(`[ServiceSearch] Handling service search: "${query}"`);
    
    // Clean search term - remove common phrases
    let searchTerm = query
      .replace(/^(am looking for|i am looking for|looking for|searching for|want to book|need to book|do you offer|show me|find|i want|i need|can i get)\s+/i, '')
      .trim();
    
    if (!searchTerm) {
      searchTerm = query.trim();
    }
    
    debugLog(`[ServiceSearch] Extracted search term: "${searchTerm}"`);
    
    // Minimum query length check
    if (searchTerm.length < 2) {
      await deps.stopTypingIndicator(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `🔍 Please enter at least 2 characters to search.\n\nExample: "haircut", "massage", "consultation"`
      );
      return;
    }
    
    // Direct Firestore query
    const adminDb = getAdminDb();
    
    debugLog(`[ServiceSearch] Querying services collection for tenantId: ${tenantId}, status: active`);
    
    // LIMIT: 100 prevents unbounded reads — enough for meaningful results without risking timeout
    const servicesSnap = await adminDb
      .collection("services")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .limit(100)
      .get();
    
    debugLog(`[ServiceSearch] Found ${servicesSnap.size} services in Firestore`);
    
    if (servicesSnap.empty) {
      debugLog(`[ServiceSearch] No services found - checking if collection exists`);
      
      // Try querying without status filter to see if any services exist at all
      const allServicesCheck = await adminDb
        .collection("services")
        .where("tenantId", "==", tenantId)
        .get();
      
      debugLog(`[ServiceSearch] Total services (all statuses): ${allServicesCheck.size}`);
      
      if (allServicesCheck.empty) {
        await deps.stopTypingIndicator(tenantId, phone);
        await deps.sendMessage(
          tenantId,
          phone,
          `🔍 No services found for "${searchTerm}".\n\nIt looks like you haven't added any services yet. Please add services first, then try searching!\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu`
        );
      } else {
        await deps.stopTypingIndicator(tenantId, phone);
        await deps.sendMessage(
          tenantId,
          phone,
          `🔍 No active services found for "${searchTerm}".\n\nYou have ${allServicesCheck.size} service(s) but they may be paused or in draft status.\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu`
        );
      }
      return;
    }
    
    // Score services with fuzzy matching
    const searchLower = searchTerm.toLowerCase();
    const allServices = servicesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // PAGINATION: Warn if there may be more services beyond the limit
    if (servicesSnap.docs.length === 100) {
      debugLog(`[ServiceSearch] Hit 100-item limit — tenant may have more services beyond this batch`);
    }
    
    debugLog(`[ServiceSearch] Processing ${allServices.length} services for scoring`);
    if (process.env.DEBUG === 'true' && allServices.length > 0) {
      console.log(`[ServiceSearch] Sample service data:`, {
        id: allServices[0].id,
        name: allServices[0].name,
        serviceName: allServices[0].serviceName,
        businessCategory: allServices[0].businessCategory,
        status: allServices[0].status
      });
    }
    
    const scoredServices = allServices.map((service: any) => {
      let score = 0;
      
      // ⭐ FIXED: Check BOTH serviceName and name fields
      const serviceName = (service.serviceName || "").toLowerCase();
      const name = (service.name || "").toLowerCase();
      const category = (service.businessCategory || "").toLowerCase();
      const type = (service.businessType || "").toLowerCase();
      const subcategory = (service.subcategoryName || "").toLowerCase();
      const description = (service.description || "").toLowerCase();
      const mode = (service.mode || "").toLowerCase();
      const providerName = (service.providerName || "").toLowerCase();
      
      // Score against serviceName (primary display name)
      if (serviceName === searchLower) score += 200;
      if (serviceName.startsWith(searchLower)) score += 150;
      if (serviceName.includes(searchLower)) score += 100;
      if (isFuzzyMatch(serviceName, searchLower, 2) && !serviceName.includes(searchLower)) score += 80;
      
      // Score against name field (stored name like "PROFFESIONAL BRAIDSCARE")
      if (name === searchLower) score += 200;
      if (name.startsWith(searchLower)) score += 150;
      if (name.includes(searchLower)) score += 100;
      if (isFuzzyMatch(name, searchLower, 2) && !name.includes(searchLower)) score += 80;
      
      // Word-level matching on BOTH fields
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      const nameWords = [...name.split(/\s+/), ...serviceName.split(/\s+/)];
      
      for (const searchWord of searchWords) {
        for (const nameWord of nameWords) {
          if (nameWord === searchWord) {
            score += 60;
          } else if (nameWord.includes(searchWord) || searchWord.includes(nameWord)) {
            score += 30;
          }
        }
      }
      
      // CATEGORY MATCH
      if (category === searchLower) {
        score += 70;
      } else if (category.includes(searchLower)) {
        score += 45;
      } else if (isFuzzyMatch(category, searchLower, 2)) {
        score += 30;
      }
      
      // TYPE MATCH
      if (type === searchLower) {
        score += 60;
      } else if (type.includes(searchLower)) {
        score += 40;
      } else if (isFuzzyMatch(type, searchLower, 2)) {
        score += 25;
      }
      
      // ✅ NEW: SUBCATEGORY MATCH
      if (subcategory === searchLower) {
        score += 55;
      } else if (subcategory.includes(searchLower)) {
        score += 35;
      } else if (isFuzzyMatch(subcategory, searchLower, 2)) {
        score += 20;
      }
      
      // PROVIDER NAME MATCH
      if (providerName.includes(searchLower)) {
        score += 25;
      }
      
      // DELIVERY MODE MATCH
      if (mode.includes(searchLower)) {
        score += 20;
      }
      
      // DESCRIPTION MATCH (lower weight)
      if (description.includes(searchLower)) {
        score += 15;
      } else if (isFuzzyMatch(description, searchLower, 3)) {
        score += 10;
      }
      
      return { ...service, score };
    }).filter((s: any) => s.score > 0);
    
    // Sort by score (highest first)
    scoredServices.sort((a: any, b: any) => b.score - a.score);
    
    debugLog(`[ServiceSearch] Search found ${scoredServices.length} matching services for "${searchTerm}"`);
    
    // Debug logging
    if (process.env.DEBUG === 'true' && scoredServices.length > 0) {
      console.log(`[ServiceSearch] Sample service names:`, allServices.slice(0, 3).map(s => s.serviceName || s.name));
      console.log(`[ServiceSearch] First scored service:`, scoredServices[0]?.serviceName || scoredServices[0]?.name, scoredServices[0]?.score);
    }
    
    // Find similar services for suggestions
    let similarServices: any[] = [];
    if (scoredServices.length === 0) {
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      
      for (const service of allServices) {
        const name = (service.serviceName || service.name || "").toLowerCase();
        let matchScore = 0;
        
        for (const searchWord of searchWords) {
          if (name.includes(searchWord)) {
            matchScore += 10;
          }
        }
        
        if (matchScore > 0) {
          similarServices.push({
            ...service,
            matchScore: matchScore
          });
        }
      }
      
      similarServices.sort((a, b) => b.matchScore - a.matchScore);
      similarServices.splice(5);
    }
    
    // CASE 1: No results but have similar services suggestions
    if (scoredServices.length === 0 && similarServices.length > 0) {
      await deps.stopTypingIndicator(tenantId, phone);
      
      let suggestionMessage = `🔍 *No exact match for "${searchTerm}"*\n\n` +
        `💡 *Did you mean?*\n\n`;
      
      similarServices.forEach((service: any, idx: number) => {
        const serviceName = service.serviceName || service.name;
        suggestionMessage += `${idx + 1}. *${serviceName}* - ${getServicePrice(service)}\n`;
        if (service.businessCategory) suggestionMessage += `   📂 ${service.businessCategory}\n`;
        if (service.subcategoryName) suggestionMessage += `   📁 ${service.subcategoryName}\n`;
        suggestionMessage += `\n`;
      });
      
      suggestionMessage += `Reply with a number to see service details, or *0* to go back.\n\n` +
        `Or try searching with different keywords!`;
      
      await deps.sendMessage(tenantId, phone, suggestionMessage);
      
      await deps.setFlowState(tenantId, phone, {
        flowName: 'similar_services_selection',
        currentStep: 'waiting_for_selection',
        similarServices: similarServices,
        originalQuery: searchTerm,
        isActive: true,
        lastActivity: new Date().toISOString(),
      });
      return;
    }
    
    // CASE 2: No results at all
    if (scoredServices.length === 0) {
      await deps.stopTypingIndicator(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `🔍 No services found for "${searchTerm}".\n\nTry searching with different keywords or browse our categories!\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu`
      );
      return;
    }
    
    // CASE 3: Has results - display them
    const results = scoredServices.slice(0, 5);
    const totalResults = scoredServices.length;
    
    let headerMessage = `🔍 *Search Results for "${searchTerm}"*\n\n`;
    headerMessage += `Found ${totalResults} service${totalResults > 1 ? 's' : ''}:\n\n`;
    await deps.sendMessage(tenantId, phone, headerMessage);
    
    for (let idx = 0; idx < results.length; idx++) {
      const service = results[idx];
      const serviceName = service.serviceName || service.name;
      const imageUrl = service.imageUrl || service.portfolioImages?.[0];
      
      // ⭐ Build pricing (same as browse)
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
      
      // ⭐ Build info badges (same as browse)
      const info = [];
      if (service.duration) info.push(`⏱️ ${service.duration}`);
      if (service.mode) {
        const modeMap: Record<string, string> = {
          'on-site': '🏠 On-site',
          'remote': '💻 Remote',
          'both': '📍 Both',
          'in-person': '🏢 In-person'
        };
        info.push(modeMap[service.mode] || service.mode);
      }
      const infoText = info.length > 0 ? `\n   ${info.join(' | ')}` : '';
      
      // ⭐ Short description (same as browse)
      const description = service.description 
        ? `\n   📝 ${service.description.substring(0, 80)}${service.description.length > 80 ? '...' : ''}`
        : '';
      
      // ⭐ Category/Subcategory (additional info for search context)
      const categoryInfo = [];
      if (service.businessCategory) categoryInfo.push(service.businessCategory);
      if (service.subcategoryName) categoryInfo.push(service.subcategoryName);
      const categoryText = categoryInfo.length > 0 ? `\n   📂 ${categoryInfo.join(' → ')}` : '';
      
      let serviceText = `*${idx + 1}. ${serviceName}*\n`;
      serviceText += `   ${priceText}${infoText}${categoryText}${description}\n`;
      
      if (service.bookingUrl) {
        serviceText += `\n   🛒 Book: ${service.bookingUrl}`;
      } else {
        serviceText += `\n   💬 Reply *${idx + 1}* to book this service`;
      }
      
      // Send with image if available
      if (imageUrl && deps.sendMedia) {
        await deps.sendMedia(tenantId, phone, imageUrl, serviceText);
      } else {
        await deps.sendMessage(tenantId, phone, serviceText);
      }
      
      if (idx < results.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }
    
    let replyMessage = '';
    if (totalResults > 5) {
      replyMessage = `\n*Reply with a number:*\n1️⃣ - View More (${totalResults - 5} more)\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
    } else {
      replyMessage = `\n*Reply with a number:*\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
    }
    
    await deps.sendMessage(tenantId, phone, replyMessage);
    
    // PAGINATION: Cap stored results to 50 items to avoid oversized Firestore documents
    const MAX_STORED_RESULTS = 50;
    const storedResults = scoredServices.slice(0, MAX_STORED_RESULTS);
    
    await deps.setFlowState(tenantId, phone, {
      flowName: 'service_search',
      currentStep: 'search_results',
      searchQuery: searchTerm,
      allResults: storedResults,
      hasMoreResults: scoredServices.length > MAX_STORED_RESULTS, // Flag for pagination hint
      currentIndex: 0,
      isActive: true,
      lastActivity: new Date().toISOString(),
    });
    
    debugLog(`[ServiceSearch] Sent ${results.length} search results for "${searchTerm}" (total: ${totalResults})`);
  } catch (error) {
    console.error('[ServiceSearch] Error handling service search:', error);
    await deps.stopTypingIndicator(tenantId, phone);
    await deps.sendMessage(tenantId, phone, `❌ Search failed. Please try again or browse services.\n\nReply *1* to browse services or *MENU* for main menu.`);
  }
}