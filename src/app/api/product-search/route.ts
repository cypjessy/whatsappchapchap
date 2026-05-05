import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ============================================
// CACHE CONFIGURATION (5 minutes TTL)
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
// OPTIMIZED SCORING FUNCTION
// ============================================
function scoreProduct(product: any, searchTerm: string): number {
  let score = 0;
  const term = searchTerm.toLowerCase();
  const termWords = term.split(/\s+/).filter(w => w.length > 1);
  
  const name = (product.name || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const category = (product.category || product.categoryName || "").toLowerCase();
  const description = (product.description || "").toLowerCase();
  
  // ===== EXACT NAME MATCH (Highest priority - 200 points) =====
  if (name === term) {
    score += 200;
  }
  
  // ===== NAME STARTS WITH SEARCH TERM (150 points) =====
  if (name.startsWith(term)) {
    score += 150;
  }
  
  // ===== WORD BOUNDARY MATCHES (80 points per exact word) =====
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
  
  // Bonus if ALL search words appear in name (50 points)
  if (matchCount === termWords.length && termWords.length > 1) {
    score += 50;
  }
  
  // ===== BRAND MATCH (40-60 points) =====
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
  
  // ===== CATEGORY MATCH (30-50 points) =====
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
  
  // ===== DESCRIPTION MATCH (5 points per word - lowest priority) =====
  for (const word of termWords) {
    if (description.includes(word)) {
      score += 5;
    }
  }
  
  // ===== STOCK AVAILABILITY BOOST (bonus for in-stock) =====
  if (product.stock > 0) {
    score += 5;
  }
  
  // ===== SALE PRICE BOOST (bonus for discounted items) =====
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
  
  // Return cached if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`[Product Search] Cache hit for tenant ${tenantId} (${cached.products.length} products)`);
    return cached.products;
  }
  
  // Fetch from Firestore
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
  
  // Cache the results
  productsCache.set(tenantId, {
    products,
    timestamp: now,
  });
  
  console.log(`[Product Search] Cached ${products.length} products for tenant ${tenantId}`);
  return products;
}

// ============================================
// MAIN SEARCH HANDLER
// ============================================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const { query, tenantId, limit = 20 } = body;

    // Validation
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: "Search query is required", results: [], totalResults: 0 },
        { status: 400 }
      );
    }

    const trimmedQuery = query.trim();
    
    if (trimmedQuery.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Search query must be at least 2 characters", 
          results: [], 
          totalResults: 0 
        },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required", results: [], totalResults: 0 },
        { status: 400 }
      );
    }

    // Get products (with caching)
    const allProducts = await getCachedProducts(tenantId);
    
    if (allProducts.length === 0) {
      return NextResponse.json({
        success: true,
        results: [],
        totalResults: 0,
        query: trimmedQuery,
      });
    }

    // Score all products
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

    // Apply limit and remove score from response
    const limitedResults = scoredResults.slice(0, limit);
    const finalResults = limitedResults.map(({ score, ...rest }) => rest);

    const duration = Date.now() - startTime;
    console.log(`[Product Search] Found ${scoredResults.length} results for "${query}" in ${duration}ms`);

    return NextResponse.json({
      success: true,
      results: finalResults,
      totalResults: scoredResults.length,
      query: trimmedQuery,
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Product Search] Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Search failed. Please try again.",
        results: [],
        totalResults: 0,
      },
      { status: 500 }
    );
  }
}

// ============================================
// CLEAR CACHE ENDPOINT (Optional)
// Usage: DELETE /api/product-search?tenantId=xxx
// ============================================
export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const tenantId = url.searchParams.get('tenantId');
  
  if (tenantId) {
    productsCache.delete(tenantId);
    console.log(`[Product Search] Cache cleared for tenant ${tenantId}`);
    return NextResponse.json({ 
      success: true, 
      message: `Cache cleared for tenant ${tenantId}` 
    });
  }
  
  productsCache.clear();
  console.log(`[Product Search] All cache cleared`);
  return NextResponse.json({ 
    success: true, 
    message: "All cache cleared" 
  });
}