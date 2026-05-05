import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
let adminApp: any = null;
let adminDb: any = null;

function getAdminDb() {
  if (!adminDb) {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
    adminDb = getFirestore();
  }
  return adminDb;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, tenantId, limit = 10 } = body;

    if (!query || query.length < 2) {
      return NextResponse.json(
        { success: false, error: "Search query must be at least 2 characters" },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID is required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const searchTerm = query.toLowerCase().trim();

    // Query products from Firestore
    const productsRef = db.collection("products");
    const productsSnap = await productsRef
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .get();

    // Filter and score products based on search relevance
    const results: any[] = [];

    productsSnap.docs.forEach((doc: any) => {
      const product = doc.data();
      const productId = doc.id;

      // Create searchable text from multiple fields
      const searchableFields = [
        product.name || "",
        product.category || "",
        product.categoryName || "",
        product.brand || "",
        product.description || "",
        ...(product.tags || []),
        ...(product.filters?.brand || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Score based on match quality
      let score = 0;

      // Exact name match gets highest score
      if (product.name?.toLowerCase().includes(searchTerm)) {
        score += 100;
        // Bonus if search term matches start of name
        if (product.name.toLowerCase().startsWith(searchTerm)) {
          score += 50;
        }
      }

      // Brand match
      if (product.brand?.toLowerCase().includes(searchTerm)) {
        score += 40;
      }

      // Category match
      if (
        product.category?.toLowerCase().includes(searchTerm) ||
        product.categoryName?.toLowerCase().includes(searchTerm)
      ) {
        score += 30;
      }

      // Description match
      if (product.description?.toLowerCase().includes(searchTerm)) {
        score += 10;
      }

      // Only include products with a score
      if (score > 0) {
        results.push({
          id: productId,
          name: product.name,
          price: product.price || 0,
          image: product.image || (product.images && product.images[0]) || null,
          brand: product.brand,
          category: product.category || product.categoryName,
          description: product.description,
          stock: product.stock || 0,
          categoryId: product.categoryId,
          score,
        });
      }
    });

    // Sort by score (highest first), then by name
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

    // Return top results
    const topResults = results.slice(0, limit);

    return NextResponse.json({
      success: true,
      results: topResults,
      totalResults: results.length,
      query: searchTerm,
    });
  } catch (error) {
    console.error("[product-search] Error:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
