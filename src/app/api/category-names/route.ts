import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json(
        { error: "Firebase Admin SDK not configured" },
        { status: 500 }
      );
    }

    // Get tenant ID from query parameter or header
    const tenantId = request.nextUrl.searchParams.get("tenantId");
    
    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    // Fetch all category names for this tenant (hierarchical structure)
    const snapshot = await adminDb
      .collection("categoryNames")
      .where("tenantId", "==", tenantId)
      .orderBy("createdAt", "desc")
      .get();

    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        mainCategory: data.mainCategory,
        mainCategoryName: data.mainCategoryName,
        subcategories: data.subcategories || [],
      };
    });

    return NextResponse.json({
      success: true,
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Error fetching category names:", error);
    return NextResponse.json(
      { error: "Failed to fetch category names" },
      { status: 500 }
    );
  }
}
