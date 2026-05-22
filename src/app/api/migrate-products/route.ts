// API Route to trigger product migration to hybrid structure
import { NextRequest, NextResponse } from "next/server";
import { migrateProductsToHybridStructure } from "@/lib/product-migration";

export async function POST(request: NextRequest) {
  try {
    console.log("Triggering product migration...");
    
    const result = await migrateProductsToHybridStructure();
    
    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("Migration failed:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Migration failed" 
      },
      { status: 500 }
    );
  }
}
