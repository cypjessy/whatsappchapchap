import { NextRequest, NextResponse } from "next/server";
import { enhanceSearchQuery } from "@/lib/ai-service";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK directly (don't rely on external import)
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

// Module-level cache with TTL (5 minutes)
interface CacheEntry {
  products: any[];
  timestamp: number;
}

const productsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Relevance scoring function - FIXED with better word matching
function scoreProduct(product: any, term: string): number {
  let score = 0;
  const termLower = term.toLowerCase();
  const termWords = termLower.split(/\s+/).filter(w => w.length > 2);
  
  // Name match - highest priority
  const nameLower = (product.name || "").toLowerCase();
  for (const word of termWords) {
    if (nameLower.includes(word)) {
      score += 10;
      // Exact word boundary match bonus
      if (new RegExp(`\\b${word}\\b`).test(nameLower)) {
        score += 5;
      }
    }
  }
  // Exact name match bonus
  if (nameLower === termLower) score += 20;
  
  // Category match - high priority
  const categoryLower = (product.category || "").toLowerCase();
  for (const word of termWords) {
    if (categoryLower.includes(word)) score += 5;
  }
  
  // Brand match - medium-high priority
  const brandLower = (product.brand || "").toLowerCase();
  for (const word of termWords) {
    if (brandLower.includes(word)) score += 4;
  }
  
  // Subcategory match - medium priority
  const subcategoryLower = (product.subcategory || "").toLowerCase();
  for (const word of termWords) {
    if (subcategoryLower.includes(word)) score += 3;
  }
  
  // Description match - lower priority
  const descLower = (product.description || "").toLowerCase();
  for (const word of termWords) {
    if (descLower.includes(word)) score += 2;
  }
  
  // Filter values match - lowest priority
  if (Object.values(product.filters || {}).some((arr: any) =>
    Array.isArray(arr) && arr.some((val: any) =>
      String(val).toLowerCase().includes(termLower)
    )
  )) {
    score += 1;
  }
  
  return score;
}

// Get cached products or fetch fresh
async function getProductsForTenant(tenantId: string): Promise<any[]> {
  const now = Date.now();
  const cached = productsCache.get(tenantId);
  
  // Return cached if still valid
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    console.log(`[AI Search] Using cached products for tenant ${tenantId} (${cached.products.length} products)`);
    return cached.products;
  }
  
  const db = getAdminDb();
  
  // Fetch fresh from Firestore
  console.log(`[AI Search] Fetching products from Firestore for tenant ${tenantId}`);
  
  try {
    const productsSnap = await db
      .collection("products")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .get();

    // Strip down to essential fields for memory efficiency
    const products = productsSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        subcategory: data.subcategory,
        brand: data.brand,
        description: data.description,
        price: data.price,
        stock: data.stock,
        images: data.images || [],
        filters: data.filters,
        tenantId: data.tenantId,
        status: data.status,
      };
    });
    
    // Cache the results
    productsCache.set(tenantId, { products, timestamp: now });
    console.log(`[AI Search] Cached ${products.length} products for tenant ${tenantId}`);
    
    return products;
  } catch (error) {
    console.error(`[AI Search] Error fetching products for tenant ${tenantId}:`, error);
    // Return empty array on error
    return [];
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchQuery, tenantId } = await req.json();

    if (!searchQuery || !tenantId) {
      return NextResponse.json(
        { success: false, error: "Missing searchQuery or tenantId" },
        { status: 400 }
      );
    }

    console.log(`[AI Search] Searching for: "${searchQuery}" in tenant: ${tenantId}`);

    // Initialize Firebase Admin SDK
    const db = getAdminDb();
    
    if (!db) {
      console.error('[AI Search] Firebase Admin SDK not initialized');
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get products (with caching)
    const allProducts = await getProductsForTenant(tenantId);
    
    if (allProducts.length === 0) {
      console.log(`[AI Search] No products found for tenant ${tenantId}`);
      return NextResponse.json({
        success: true,
        originalQuery: searchQuery,
        enhancedQueries: [searchQuery],
        results: [],
        totalResults: 0,
      });
    }

    // Prepare minimal context for AI enhancement
    const aiContext = {
      products: allProducts.slice(0, 30).map((p: any) => ({
        name: p.name,
        category: p.category,
        brand: p.brand,
        description: p.description?.substring(0, 200),
      })),
    };

    // Use AI to enhance the search query with timeout
    console.log(`[AI Search] Enhancing query: "${searchQuery}"`);
    let enhancedQueries: string[] = [];
    
    try {
      // Check if GROQ_API_KEY is configured
      if (!process.env.GROQ_API_KEY) {
        console.warn('[AI Search] GROQ_API_KEY not configured, using original query');
        enhancedQueries = [searchQuery];
      } else {
        // Add 5-second timeout to AI call
        const aiPromise = enhanceSearchQuery(searchQuery, aiContext);
        const timeoutPromise = new Promise<string[]>((_, reject) => 
          setTimeout(() => reject(new Error("AI timeout after 5s")), 5000)
        );
        
        enhancedQueries = await Promise.race([aiPromise, timeoutPromise]);
        
        console.log(`[AI Search] Enhanced queries:`, enhancedQueries);
        
        // Validate enhanced queries - ensure we have at least the original query
        if (!enhancedQueries || !Array.isArray(enhancedQueries) || enhancedQueries.length === 0) {
          console.warn('[AI Search] No valid enhanced queries, using original');
          enhancedQueries = [searchQuery];
        }
      }
    } catch (aiError) {
      console.error('[AI Search] AI enhancement failed or timed out, falling back to original query:', aiError);
      enhancedQueries = [searchQuery];
    }

    // Search using all enhanced queries with scoring
    const scoredResults = new Map<string, { product: any; score: number }>();

    for (const searchTerm of enhancedQueries) {
      for (const product of allProducts) {
        const score = scoreProduct(product, searchTerm);
        
        if (score > 0) {
          const existing = scoredResults.get(product.id);
          if (existing) {
            existing.score += score;
          } else {
            scoredResults.set(product.id, { product, score });
          }
        }
      }
    }

    // Sort by total score (highest first) and limit to top 15
    const sortedResults = Array.from(scoredResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    // Shape response to expose only public fields
    const results = sortedResults.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images?.[0] || null,
      category: item.product.category,
      subcategory: item.product.subcategory,
      brand: item.product.brand,
      stock: item.product.stock,
      description: item.product.description?.substring(0, 300),
    }));

    const duration = Date.now() - startTime;
    console.log(`[AI Search] Returning ${results.length} results for "${searchQuery}" (took ${duration}ms)`);

    return NextResponse.json({
      success: true,
      originalQuery: searchQuery,
      enhancedQueries,
      results,
      totalResults: results.length,
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[AI Search] Error after ${duration}ms:`, error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Search failed", 
        details: error instanceof Error ? error.message : String(error),
        results: [],
        totalResults: 0,
      },
      { status: 500 }
    );
  }
}