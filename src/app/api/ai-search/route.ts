import { NextRequest, NextResponse } from "next/server";
import { enhanceSearchQuery } from "@/lib/ai-service";
import { adminDb } from "@/lib/firebase-admin";

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

    const allProducts = productsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`[AI Search] Found ${allProducts.length} active products for tenant ${tenantId}`);

    // Get business profile for business name
    const profileSnap = await adminDb
      .collection("businessProfiles")
      .where("tenantId", "==", tenantId)
      .limit(1)
      .get();

    const businessName = !profileSnap.empty 
      ? profileSnap.docs[0].data().businessName || "Our Store"
      : "Our Store";

    // Prepare context for AI enhancement
    const aiContext = {
      businessName,
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

    // Search using all enhanced queries
    const searchResults = new Map<string, any>();

    for (const searchTerm of enhancedQueries) {
      const filtered = allProducts.filter((p: any) => {
        const term = searchTerm.toLowerCase();
        
        return (
          p.name?.toLowerCase().includes(term) ||
          p.description?.toLowerCase().includes(term) ||
          p.category?.toLowerCase().includes(term) ||
          p.subcategory?.toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term) ||
          Object.values(p.filters || {}).some((arr: any) =>
            Array.isArray(arr) && arr.some((val: any) =>
              String(val).toLowerCase().includes(term) // Safe string conversion
            )
          )
        );
      });

      // Add results to map (avoid duplicates)
      filtered.forEach((product: any) => {
        if (!searchResults.has(product.id)) {
          searchResults.set(product.id, product);
        }
      });
    }

    // Convert map to array and limit results
    const results = Array.from(searchResults.values()).slice(0, 15);

    console.log(`[AI Search] Returning ${results.length} results`);

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
