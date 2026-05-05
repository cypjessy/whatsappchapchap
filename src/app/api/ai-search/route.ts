import { NextRequest, NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import { enhanceSearchQuery } from "@/lib/ai-service";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
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

    const app = getFirebaseApp();
    const db = getFirestore(app);

    // Fetch all products for this tenant to provide context to AI
    const productsQuery = query(
      collection(db, "products"),
      where("tenantId", "==", tenantId)
    );

    const productsSnap = await getDocs(productsQuery);
    const allProducts = productsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get business profile for business name
    const profileQuery = query(
      collection(db, "businessProfiles"),
      where("tenantId", "==", tenantId)
    );
    const profileSnap = await getDocs(profileQuery);
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
    const enhancedQueries = await enhanceSearchQuery(searchQuery, aiContext);
    console.log(`[AI Search] Enhanced queries:`, enhancedQueries);

    // Search using all enhanced queries
    const searchResults = new Map<string, any>();

    for (const searchTerm of enhancedQueries) {
      const filtered = allProducts.filter((p: any) =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subcategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(p.filters || {}).some((arr: any) =>
          Array.isArray(arr) && arr.some((val: any) =>
            val.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );

      // Add results to map (avoid duplicates)
      filtered.forEach((product: any) => {
        if (!searchResults.has(product.id)) {
          searchResults.set(product.id, product);
        }
      });
    }

    // Convert map to array and limit results
    const results = Array.from(searchResults.values()).slice(0, 15);

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
