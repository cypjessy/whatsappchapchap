// src/app/api/webhook/evolution/handlers/product-search.ts
// Search products handler - extracted from route.ts

import { getFirestore, FieldValue } from "firebase-admin/firestore";

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
  sendMedia: (tenantId: string, phone: string, mediaUrl: string, caption: string) => Promise<void>;
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
  const distance = levenshteinDistance(a, b);
  return distance <= maxDistance;
}

// Debug logging helper
function debugLog(...args: any[]) {
  if (process.env.DEBUG === 'true') {
    console.log(...args);
  }
}

/**
 * Handle product search request
 * Extracted from route.ts for better modularity
 */
export async function handleProductSearch(
  tenantId: string,
  phone: string,
  query: string,
  deps: Deps
): Promise<void> {
  await deps.sendTypingIndicator(tenantId, phone);
  
  try {
    debugLog(`[ProductSearch] Handling product search: "${query}"`);
    
    // Clean search term - remove common phrases
    let searchTerm = query
      .replace(/^(am looking for|i am looking for|looking for|searching for|want to buy|need to buy|do you have|show me|find|i want|i need|can i get)\s+/i, '')
      .trim();
    
    if (!searchTerm) {
      searchTerm = query.trim();
    }
    
    debugLog(`[ProductSearch] Extracted search term: "${searchTerm}"`);
    
    // ⭐ MINIMUM QUERY LENGTH CHECK
    if (searchTerm.length < 2) {
      await deps.stopTypingIndicator(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        ` Please enter at least 2 characters to search.\n\nExample: "laptop", "red shoes"`
      );
      return;
    }
    
    // Direct Firestore query
    const adminDb = getAdminDb();
    
    // LIMIT: 100 prevents unbounded reads — enough for meaningful results without risking timeout
    const productsSnap = await adminDb
      .collection("products")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .limit(100)
      .get();
    
    if (productsSnap.empty) {
      await deps.stopTypingIndicator(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `🔍 No products found for "${searchTerm}".\n\nTry searching with different keywords or browse our categories!\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu`
      );
      return;
    }
    
    // Score products with fuzzy matching
    const searchLower = searchTerm.toLowerCase();
    const allProducts = productsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // PAGINATION: Warn if there may be more products beyond the limit
    if (productsSnap.docs.length === 100) {
      debugLog(`[ProductSearch] Hit 100-item limit — tenant may have more products beyond this batch`);
    }
    
    const scoredProducts = allProducts.map((product: any) => {
      let score = 0;
      
      const name = (product.name || "").toLowerCase();
      const brand = (product.brand || "").toLowerCase();
      const category = (product.category || product.categoryName || "").toLowerCase();
      const description = (product.description || "").toLowerCase();
      const type = (product.type || "").toLowerCase();
      
      // EXACT NAME MATCH (Highest)
      if (name === searchLower) {
        score += 200;
      }
      
      // NAME STARTS WITH
      if (name.startsWith(searchLower)) {
        score += 150;
      }
      
      // NAME CONTAINS
      if (name.includes(searchLower)) {
        score += 100;
      }
      
      // FUZZY NAME MATCH (for typos)
      if (isFuzzyMatch(name, searchLower, 2) && !name.includes(searchLower)) {
        score += 80;
      }
      
      // Split into words for multi-word matching
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      const nameWords = name.split(/\s+/);
      
      for (const searchWord of searchWords) {
        for (const nameWord of nameWords) {
          if (nameWord === searchWord) {
            score += 60;
          } else if (nameWord.includes(searchWord) || searchWord.includes(nameWord)) {
            score += 30;
          }
        }
      }
      
      // BRAND MATCH
      if (brand === searchLower) {
        score += 80;
      } else if (brand.includes(searchLower)) {
        score += 50;
      } else if (isFuzzyMatch(brand, searchLower, 2)) {
        score += 30;
      }
      
      // CATEGORY MATCH
      if (category === searchLower) {
        score += 60;
      } else if (category.includes(searchLower)) {
        score += 40;
      } else if (isFuzzyMatch(category, searchLower, 2)) {
        score += 20;
      }
      
      // ⭐ TYPE MATCH
      if (type === searchLower) {
        score += 70;
      } else if (type.includes(searchLower)) {
        score += 40;
      } else if (isFuzzyMatch(type, searchLower, 2)) {
        score += 25;
      }
      
      // ⭐ COLOR MATCH (if product has colors)
      if (product.colors && product.colors.length > 0) {
        const colorsMatch = product.colors.some((c: string) => 
          c.toLowerCase().includes(searchLower)
        );
        if (colorsMatch) score += 20;
      }
      
      // DESCRIPTION MATCH (lower weight)
      if (description.includes(searchLower)) {
        score += 15;
      } else if (isFuzzyMatch(description, searchLower, 3)) {
        score += 10;
      }
      
      return { ...product, score };
    }).filter((p: any) => p.score > 0);
    
    // Sort by score (highest first)
    scoredProducts.sort((a: any, b: any) => b.score - a.score);
    
    debugLog(`[ProductSearch] Search found ${scoredProducts.length} matching products for "${searchTerm}"`);
    
    // Debug logging
    if (process.env.DEBUG === 'true' && scoredProducts.length > 0) {
      console.log(`[ProductSearch] Sample product names:`, allProducts.slice(0, 3).map(p => p.name));
      console.log(`[ProductSearch] First scored product:`, scoredProducts[0]?.name, scoredProducts[0]?.score);
    }
    
    // Find similar products for suggestions
    let similarProducts: any[] = [];
    if (scoredProducts.length === 0) {
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 2);
      
      for (const product of allProducts) {
        const name = (product.name || "").toLowerCase();
        let matchScore = 0;
        
        for (const searchWord of searchWords) {
          if (name.includes(searchWord)) {
            matchScore += 10;
          }
        }
        
        if (matchScore > 0) {
          similarProducts.push({
            ...product,
            matchScore: matchScore
          });
        }
      }
      
      similarProducts.sort((a, b) => b.matchScore - a.matchScore);
      similarProducts.splice(5);
    }
    
    // CASE 1: No results but have similar products suggestions
    if (scoredProducts.length === 0 && similarProducts.length > 0) {
      await deps.stopTypingIndicator(tenantId, phone);
      
      let suggestionMessage = `🔍 *No exact match for "${searchTerm}"*\n\n` +
        `💡 *Did you mean?*\n\n`;
      
      similarProducts.forEach((product: any, idx: number) => {
        suggestionMessage += `${idx + 1}. *${product.name}* - KES ${product.price?.toLocaleString()}\n`;
        if (product.brand) suggestionMessage += `   🏷️ ${product.brand}\n`;
        if (product.category || product.categoryName) {
          suggestionMessage += `   📂 ${product.category || product.categoryName}\n`;
        }
        suggestionMessage += `\n`;
      });
      
      suggestionMessage += `Reply with a number to see product details, or *0* to go back.\n\n` +
        `Or try searching with different keywords!`;
      
      await deps.sendMessage(tenantId, phone, suggestionMessage);
      
      await deps.setFlowState(tenantId, phone, {
        flowName: 'similar_products_selection',
        currentStep: 'waiting_for_selection',
        similarProducts: similarProducts,
        originalQuery: searchTerm,
        isActive: true,
        lastActivity: new Date().toISOString(),
      });
      return;
    }
    
    // CASE 2: No results at all
    if (scoredProducts.length === 0) {
      await deps.stopTypingIndicator(tenantId, phone);
      await deps.sendMessage(
        tenantId,
        phone,
        `🔍 No products found for "${searchTerm}".\n\nTry searching with different keywords or browse our categories!\n\n*Reply:*\n1️⃣ - View Categories\n2️⃣ - Main Menu`
      );
      return;
    }
    
    // CASE 3: Has results - display them
    const results = scoredProducts.slice(0, 5);
    const totalResults = scoredProducts.length;
    
    let headerMessage = `🔍 *Search Results for "${searchTerm}"*\n\n`;
    headerMessage += `Found ${totalResults} product${totalResults > 1 ? 's' : ''}:\n\n`;
    await deps.sendMessage(tenantId, phone, headerMessage);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://yourdomain.com');
    
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
        const stockLabel = product.stock === 0
          ? ' Out of stock'
          : product.stock <= 5
            ? `⚠️ Only ${product.stock} left`
            : `✅ In stock (${product.stock})`;
        productText += `   📦 ${stockLabel}\n`;
      }

      if (product.description) {
        const shortDesc = product.description.substring(0, 100);
        productText += `   📝 ${shortDesc}${product.description.length > 100 ? '...' : ''}\n`;
      }

      if (product.brand) {
        productText += `   🏷️ Brand: ${product.brand}\n`;
      }
      
      if (product.category || product.categoryName) {
        productText += `   📂 Category: ${product.category || product.categoryName}\n`;
      }

      const orderLink = `${baseUrl}/order?tenant=${tenantId}&product=${product.id}&phone=${phone}`;
      productText += `    Order: ${orderLink}\n`;

      if (imageUrl) {
        await deps.sendMedia(tenantId, phone, imageUrl, productText);
      } else {
        await deps.sendMessage(tenantId, phone, productText);
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
    
    await deps.sendMessage(tenantId, phone, replyMessage);    // PAGINATION: Cap stored results to 50 items to avoid oversized Firestore documents
    const MAX_STORED_RESULTS = 50;
    const storedResults = scoredProducts.slice(0, MAX_STORED_RESULTS);
    
    await deps.setFlowState(tenantId, phone, {
      flowName: 'product_search',
      currentStep: 'search_results',
      searchQuery: searchTerm,
      allResults: storedResults,
      hasMoreResults: scoredProducts.length > MAX_STORED_RESULTS, // Flag for pagination hint
      currentIndex: 0,
      isActive: true,
      lastActivity: new Date().toISOString(),
    });
    
    debugLog(`[ProductSearch] Sent ${results.length} search results for "${searchTerm}" (total: ${totalResults})`);
  } catch (error) {
    console.error('[ProductSearch] Error handling product search:', error);
    await deps.stopTypingIndicator(tenantId, phone);
    await deps.sendMessage(tenantId, phone, `❌ Search failed. Please try again or browse categories.\n\nReply *1* to browse products or *MENU* for main menu.`);
  }
}
