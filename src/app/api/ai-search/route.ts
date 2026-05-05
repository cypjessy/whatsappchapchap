import { NextRequest, NextResponse } from "next/server";
import { enhanceSearchQuery } from "@/lib/ai-service";
import { adminDb } from "@/lib/firebase-admin";

// Module-level cache with TTL (5 minutes)
interface CacheEntry {
  products: any[];
  timestamp: number;
}

const productsCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Relevance scoring function
function scoreProduct(product: any, term: string): number {
  let score = 0;
  const termLower = term.toLowerCase();
  
  // Name match - highest priority
  if (product.name?.toLowerCase().includes(termLower)) score += 10;
  
  // Category match - high priority
  if (product.category?.toLowerCase().includes(termLower)) score += 5;
  
  // Brand match - medium-high priority
  if (product.brand?.toLowerCase().includes(termLower)) score += 4;
  
  // Subcategory match - medium priority
  if (product.subcategory?.toLowerCase().includes(termLower)) score += 3;
  
  // Description match - lower priority
  if (product.description?.toLowerCase().includes(termLower)) score += 2;
  
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
  
  // Fetch fresh from Firestore
  console.log(`[AI Search] Fetching products from Firestore for tenant ${tenantId}`);
  const productsSnap = await adminDb!
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
      images: data.images,
      filters: data.filters,
      tenantId: data.tenantId,
      status: data.status,
    };
  });
  
  // Cache the results
  productsCache.set(tenantId, { products, timestamp: now });
  console.log(`[AI Search] Cached ${products.length} products for tenant ${tenantId}`);
  
  return products;
}

export async function POST(req: NextRequest) {
  try {
    const { searchQuery, tenantId } = await req.json();

    if (!searchQuery || !tenantId) {
      return NextResponse.json(
        { error: "Missing searchQuery or tenantId" },
        { status: 400 }
      );
    }

    // Use Firebase Admin SDK (server-side)
    if (!adminDb) {
      console.error('[AI Search] Firebase Admin SDK not initialized');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get products (with caching)
    const allProducts = await getProductsForTenant(tenantId);

    // Prepare minimal context for AI enhancement (no businessName needed for query expansion)
    const aiContext = {
      products: allProducts.map((p: any) => ({
        name: p.name,
        category: p.category,
        brand: p.brand,
        description: p.description,
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
        enhancedQueries = await Promise.race([
          enhanceSearchQuery(searchQuery, aiContext),
          new Promise<string[]>((_, reject) => 
            setTimeout(() => reject(new Error("AI timeout after 5s")), 5000)
          )
        ]);
        
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
    // Map stores: productId -> { product, totalScore }
    const scoredResults = new Map<string, { product: any; score: number }>();

    for (const searchTerm of enhancedQueries) {
      for (const product of allProducts) {
        const score = scoreProduct(product, searchTerm);
        
        if (score > 0) {
          const existing = scoredResults.get(product.id);
          if (existing) {
            // Accumulate scores across multiple enhanced queries
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

    // Shape response to expose only public fields (no internal data)
    const results = sortedResults.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image: item.product.images?.[0] || null,
      category: item.product.category,
      subcategory: item.product.subcategory,
      brand: item.product.brand,
      stock: item.product.stock,
      description: item.product.description,
      filters: item.product.filters,
    }));

    console.log(`[AI Search] Returning ${results.length} results (sorted by relevance)`);

    return NextResponse.json({
      success: true,
      originalQuery: searchQuery,
      enhancedQueries,
      results,
      totalResults: results.length,
    });

  } catch (error) {
    console.error("[AI Search] Error:", error);
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}
