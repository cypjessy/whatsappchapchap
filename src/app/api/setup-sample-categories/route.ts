// Script to set up sample product category hierarchy
import { adminDb } from "@/lib/firebase-admin";

interface SampleCategory {
  id: string;
  name: string;
  description: string;
  subcategories: string[];
  brands: string[];
}

const sampleCategories: SampleCategory[] = [
  {
    id: "electronics",
    name: "Electronics",
    description: "Electronic devices and accessories",
    subcategories: ["laptops", "phones", "tablets", "audio", "cameras"],
    brands: ["asus", "apple", "samsung", "dell", "hp", "lenovo", "sony", "bose"],
  },
  {
    id: "fashion",
    name: "Fashion",
    description: "Clothing, shoes, and accessories",
    subcategories: ["dresses", "shirts", "pants", "shoes", "bags", "watches"],
    brands: ["nike", "adidas", "zara", "h&m", "gucci", "prada", "rolex"],
  },
  {
    id: "home-living",
    name: "Home & Living",
    description: "Furniture, decor, and home essentials",
    subcategories: ["furniture", "decor", "kitchen", "bedding", "lighting"],
    brands: ["ikea", "ashley", "pottery-barn", "west-elm", "crate-barrel"],
  },
  {
    id: "sports-outdoors",
    name: "Sports & Outdoors",
    description: "Sports equipment and outdoor gear",
    subcategories: ["fitness", "camping", "cycling", "water-sports", "team-sports"],
    brands: ["nike", "adidas", "under-armour", "columbia", "north-face", "patagonia"],
  },
  {
    id: "beauty-health",
    name: "Beauty & Health",
    description: "Beauty products and health items",
    subcategories: ["skincare", "makeup", "haircare", "fragrances", "wellness"],
    brands: ["loreal", "maybelline", "mac", "clinique", "neutrogena", "olay"],
  },
];

export async function setupSampleCategoryHierarchy() {
  console.log("Setting up sample product category hierarchy...");

  if (!adminDb) {
    throw new Error("Firebase Admin SDK not configured");
  }

  try {
    const batch = adminDb.batch();

    for (const category of sampleCategories) {
      const categoryRef = adminDb.collection("productCategories").doc(category.id);
      
      batch.set(categoryRef, {
        name: category.name,
        description: category.description,
        subcategories: category.subcategories,
        brands: category.brands,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`Added category: ${category.name}`);
    }

    await batch.commit();
    console.log("Sample category hierarchy setup completed successfully!");
    console.log(`Created ${sampleCategories.length} categories`);

    return {
      success: true,
      categoriesCreated: sampleCategories.length,
      categories: sampleCategories.map(c => c.name),
    };
  } catch (error) {
    console.error("Failed to setup sample category hierarchy:", error);
    throw error;
  }
}

// API route handler
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log("Setting up sample category hierarchy...");
    
    const result = await setupSampleCategoryHierarchy();
    
    return NextResponse.json({
      success: true,
      message: "Sample category hierarchy created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Failed to setup sample category hierarchy:", error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : "Setup failed" 
      },
      { status: 500 }
    );
  }
}
