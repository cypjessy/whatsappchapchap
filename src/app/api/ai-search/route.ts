import { NextRequest, NextResponse } from "next/server";
import { enhanceSearchQuery } from "@/lib/ai-service";
import { adminDb } from "@/lib/firebase-admin";

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

    // Fetch only ACTIVE products for this tenant to provide context to AI
    const productsSnap = await adminDb
      .collection("products")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .get();

    // Strip down to essential fields for memory efficiency
    const allProducts = productsSnap.docs.map((doc: any) => {
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

    console.log(`[AI Search] Found ${allProducts.length} active products for tenant ${tenantId}`);

    // Prepare minimal context for AI enhancement (no businessName needed for query expansion)
    const aiContext = {
      products: allProducts.map((p: any) => ({
        name: p.name,
        category: p.category,
        brand: p.brand,
        description: p.description,
      })),
    };

    // Use AI to enhance the search query
    console.log(`[AI Search] Enhancing query: "${searchQuery}"`);
    let enhancedQueries: string[] = [];
    
    try {
      enhancedQueries = await enhanceSearchQuery(searchQuery, aiContext);
      console.log(`[AI Search] Enhanced queries:`, enhancedQueries);
      
      // Validate enhanced queries - ensure we have at least the original query
      if (!enhancedQueries || !Array.isArray(enhancedQueries) || enhancedQueries.length === 0) {
        console.warn('[AI Search] No valid enhanced queries, using original');
        enhancedQueries = [searchQuery];
      }
    } catch (aiError) {
      console.error('[AI Search] AI enhancement failed, falling back to original query:', aiError);
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
    const results = Array.from(scoredResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
      .map(item => item.product);

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
