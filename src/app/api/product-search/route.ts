import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ============================================
// CACHE CONFIGURATION
// ============================================
interface CacheEntry {
  products: any[];
  timestamp: number;
}

const productsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// FIREBASE INITIALIZATION
// ============================================
let adminDb: any = null;

function getAdminDb() {
  if (!adminDb) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    adminDb = getFirestore();
  }
  return adminDb;
}

// ============================================
// FUZZY MATCHING HELPER (Levenshtein distance)
// ============================================
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];

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

// ============================================
// NORMALIZE TEXT (remove spaces, special chars)
// ============================================
function normalizeText(text: string): string {
  return text.toLowerCase()
    .replace(/\s+/g, '')  // Remove all spaces
    .replace(/[^\w]/g, ''); // Remove special characters
}

// ============================================
// ENHANCED FUZZY MATCH with space insensitivity
// ============================================
function isFuzzyMatch(str: string, searchTerm: string, maxDistance: number = 2): boolean {
  if (!str || !searchTerm) return false;
  
  const strLower = str.toLowerCase();
  const termLower = searchTerm.toLowerCase();
  const normalizedStr = normalizeText(str);
  const normalizedTerm = normalizeText(searchTerm);
  
  // Normalized match (ignores spaces) - "sundress" matches "sun dress"
  if (normalizedStr.includes(normalizedTerm) || normalizedTerm.includes(normalizedStr)) {
    return true;
  }
  
  // Exact match or contains
  if (strLower.includes(termLower)) return true;
  
  // Check each word in the string against search term
  const words = strLower.split(/\s+/);
  for (const word of words) {
    const distance = levenshteinDistance(word, termLower);
    if (distance <= maxDistance && word.length > 2) {
      return true;
    }
    // Also check normalized version
    const normalizedWord = normalizeText(word);
    if (normalizedWord.includes(normalizedTerm) && word.length > 2) {
      return true;
    }
  }
  
  // Check if search term words match product words
  const termWords = termLower.split(/\s+/);
  for (const termWord of termWords) {
    for (const word of words) {
      const distance = levenshteinDistance(word, termWord);
      if (distance <= maxDistance && word.length > 2) {
        return true;
      }
    }
  }
  
  return false;
}

// ============================================
// GET SIMILAR PRODUCTS SUGGESTIONS
// ============================================
function getSimilarProducts(allProducts: any[], searchTerm: string, limit: number = 3): any[] {
  const termLower = searchTerm.toLowerCase();
  const normalizedTerm = normalizeText(searchTerm);
  
  const scored = allProducts.map(product => {
    let score = 0;
    const name = (product.name || "").toLowerCase();
    const normalizedName = normalizeText(name);
    const category = (product.category || product.categoryName || "").toLowerCase();
    
    // Check for common word matches
    const termWords = termLower.split(/\s+/);
    const nameWords = name.split(/\s+/);
    
    for (const termWord of termWords) {
      for (const nameWord of nameWords) {
        if (nameWord.includes(termWord) || termWord.includes(nameWord)) {
          score += 30;
        }
        const distance = levenshteinDistance(nameWord, termWord);
        if (distance <= 2 && nameWord.length > 2) {
          score += 20;
        }
      }
    }
    
    // Category match gives bonus
    if (category.includes(termLower) || termLower.includes(category)) {
      score += 15;
    }
    
    // Normalized match
    if (normalizedName.includes(normalizedTerm)) {
      score += 25;
    }
    
    return { ...product, score };
  }).filter(p => p.score > 0);
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ============================================
// ENHANCED SCORING WITH SPACE-INSENSITIVE MATCHING
// ============================================
function scoreProduct(product: any, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();
  const normalizedTerm = normalizeText(term);
  const termWords = term.split(/\s+/).filter(w => w.length > 1);
  
  const name = (product.name || "").toLowerCase();
  const normalizedName = normalizeText(name);
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || product.categoryName || "").toLowerCase();
  const description = (product.description || "").toLowerCase();
  
  // ===== NORMALIZED MATCH (ignores spaces) - "sundress" matches "sun dress" =====
  if (normalizedName === normalizedTerm) {
    score += 250;
  } else if (normalizedName.includes(normalizedTerm)) {
    score += 180;
  }
  
  // ===== FUZZY NAME MATCH (for typos) =====
  if (isFuzzyMatch(name, term, 2)) {
    score += 120;
  }
  
  // ===== EXACT NAME MATCH =====
  if (name === term) {
    score += 200;
  }
  
  // ===== NAME STARTS WITH SEARCH TERM =====
  if (name.startsWith(term)) {
    score += 150;
  }
  
  // ===== WORD BOUNDARY MATCHES =====
  const nameWords = name.split(/\s+/);
  for (const word of termWords) {
    if (nameWords.includes(word)) {
      score += 80;
    }
  }
  
  // ===== NAME CONTAINS (20 points per word) =====
  let matchCount = 0;
  for (const word of termWords) {
    if (name.includes(word)) {
      score += 20;
      matchCount++;
    }
  }
  
  // Bonus if ALL search words appear in name
  if (matchCount === termWords.length && termWords.length > 1) {
    score += 50;
  }
  
  // ===== PARTIAL WORD MATCH (e.g., "dress" matches "sundress") =====
  for (const word of termWords) {
    for (const nameWord of nameWords) {
      if (nameWord.includes(word) && word.length > 2) {
        score += 40;
      }
      if (word.includes(nameWord) && nameWord.length > 2) {
        score += 30;
      }
    }
  }
  
  // ===== BRAND MATCH =====
  if (isFuzzyMatch(brand, term, 2)) {
    score += 50;
  }
  
  if (brand === term) {
    score += 60;
  } else if (brand.includes(term)) {
    score += 40;
  } else {
    for (const word of termWords) {
      if (brand.includes(word)) {
        score += 15;
        break;
      }
    }
  }
  
  // ===== CATEGORY MATCH =====
  if (isFuzzyMatch(category, term, 2)) {
    score += 40;
  }
  
  if (category === term) {
    score += 50;
  } else if (category.includes(term)) {
    score += 30;
  } else {
    for (const word of termWords) {
      if (category.includes(word)) {
        score += 10;
        break;
      }
    }
  }
  
  // ===== DESCRIPTION MATCH =====
  for (const word of termWords) {
    if (description.includes(word)) {
      score += 5;
    }
  }
  
  if (isFuzzyMatch(description, term, 3)) {
    score += 15;
  }
  
  // ===== STOCK AVAILABILITY BOOST =====
  if (product.stock > 0) {
    score += 5;
  }
  
  // ===== SALE PRICE BOOST =====
  if (product.salePrice && product.salePrice < product.price) {
    score += 3;
  }
  
  return score;
}

// ============================================
// FETCH PRODUCTS WITH CACHING
// ============================================
async function getCachedProducts(tenantId: string): Promise<any[]> {
  const now = Date.now();
  const cached = productsCache.get(tenantId);
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`[Product Search] Cache hit for tenant ${tenantId} (${cached.products.length} products)`);
    return cached.products;
  }
  
  const db = getAdminDb();
  console.log(`[Product Search] Cache miss - fetching from Firestore for tenant ${tenantId}`);
  
  const productsSnap = await db
    .collection("products")
    .where("tenantId", "==", tenantId)
    .where("status", "==", "active")
    .get();
  
  const products = productsSnap.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      price: data.price || 0,
      salePrice: data.salePrice,
      image: data.image || (data.images?.[0]) || null,
      brand: data.brand,
      category: data.category,
      categoryName: data.categoryName,
      description: data.description,
      stock: data.stock || 0,
      categoryId: data.categoryId,
    };
  });
  
  productsCache.set(tenantId, { products, timestamp: now });
  console.log(`[Product Search] Cached ${products.length} products for tenant ${tenantId}`);
  return products;
}

// ============================================
// MAIN SEARCH HANDLER with similar products
// ============================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, tenantId, limit = 20 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: "Search query is required", results: [], totalResults: 0, similarProducts: [] },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < 2) {
      return NextResponse.json(
        { success: false, error: "Search query must be at least 2 characters", results: [], totalResults: 0, similarProducts: [] },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required", results: [], totalResults: 0, similarProducts: [] },
        { status: 400 }
      );
    }

    const allProducts = await getCachedProducts(tenantId);
    
    if (allProducts.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        totalResults: 0,
        query: trimmedQuery,
        similarProducts: [],
      });
    }

    // Score all products with enhanced fuzzy matching
    const searchTerm = trimmedQuery.toLowerCase();
    const scoredResults = allProducts
      .map(product => ({
        ...product,
        score: scoreProduct(product, searchTerm)
      }))
      .filter(item => item.score > 0);

    // Sort by score (highest first), then by name
    scoredResults.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    const exactMatches = scoredResults.filter(r => r.score >= 180);
    const fuzzyMatches = scoredResults.filter(r => r.score >= 50 && r.score < 180);
    const weakMatches = scoredResults.filter(r => r.score < 50);
    
    // Get similar products suggestions (when no exact matches)
    let similarProducts: any[] = [];
    if (exactMatches.length === 0 && fuzzyMatches.length === 0) {
      similarProducts = getSimilarProducts(allProducts, searchTerm, 3);
    }

    const limitedResults = scoredResults.slice(0, limit);
    const finalResults = limitedResults.map(({ score, ...rest }) => rest);

    const duration = Date.now() - startTime;
    console.log(`[Product Search] Found ${scoredResults.length} results for "${query}" in ${duration}ms`);
    console.log(`[Product Search] Exact: ${exactMatches.length}, Fuzzy: ${fuzzyMatches.length}, Similar: ${similarProducts.length}`);

    return NextResponse.json({
      success: true,
      results: finalResults,
      totalResults: scoredResults.length,
      query: trimmedQuery,
      similarProducts: similarProducts.map(({ score, ...rest }) => rest),
      hasExactMatch: exactMatches.length > 0,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Product Search] Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { success: false, error: "Search failed. Please try again.", results: [], totalResults: 0, similarProducts: [] },
      { status: 500 }
    );
  }
}

// ============================================
// CLEAR CACHE ENDPOINT
// ============================================
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');
  
  if (tenantId) {
    productsCache.delete(tenantId);
    console.log(`[Product Search] Cache cleared for tenant ${tenantId}`);
    return NextResponse.json({ success: true, message: `Cache cleared for tenant ${tenantId}` });
  }
  
  productsCache.clear();
  console.log(`[Product Search] All cache cleared`);
  return NextResponse.json({ success: true, message: "All cache cleared" });
}