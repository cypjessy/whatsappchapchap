// Migration script to convert flat products structure to hybrid structure
import { adminDb } from "@/lib/firebase-admin";

interface ProductData {
  category?: string;
  categoryName?: string;
  brand?: string;
  [key: string]: any;
}

interface CategoryStructure {
  [category: string]: {
    name: string;
    subcategories: Set<string>;
    brands: Set<string>;
  };
}

export async function migrateProductsToHybridStructure() {
  console.log("Starting migration to hybrid product structure...");

  if (!adminDb) {
    throw new Error("Firebase Admin SDK not configured");
  }

  try {
    // Step 1: Extract all unique categories, subcategories, and brands from existing products
    const productsSnapshot = await adminDb.collection("products").get();
    const categoryStructure: CategoryStructure = {};

    console.log(`Found ${productsSnapshot.docs.length} products to analyze`);

    for (const doc of productsSnapshot.docs) {
      const data = doc.data() as ProductData;
      const category = data.category?.toLowerCase() || "uncategorized";
      const categoryName = data.categoryName || data.category || "Uncategorized";
      const brand = data.brand?.toLowerCase() || "unknown";

      if (!categoryStructure[category]) {
        categoryStructure[category] = {
          name: categoryName,
          subcategories: new Set(),
          brands: new Set(),
        };
      }

      // Add subcategory if it exists and is different from main category
      if (data.categoryName && data.categoryName.toLowerCase() !== category) {
        categoryStructure[category].subcategories.add(data.categoryName.toLowerCase());
      }

      // Add brand
      if (brand && brand !== "unknown") {
        categoryStructure[category].brands.add(brand);
      }
    }

    console.log(`Extracted ${Object.keys(categoryStructure).length} unique categories`);

    // Step 2: Create categories in the new collection
    const createdCategories: string[] = [];

    for (const [categoryId, categoryData] of Object.entries(categoryStructure)) {
      const categoryDoc = await adminDb.collection("productCategories").doc(categoryId).get();

      if (!categoryDoc.exists) {
        await adminDb.collection("productCategories").doc(categoryId).set({
          name: categoryData.name,
          description: `${categoryData.name} products`,
          subcategories: Array.from(categoryData.subcategories),
          brands: Array.from(categoryData.brands),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        createdCategories.push(categoryId);
        console.log(`Created category: ${categoryId} (${categoryData.name})`);
      } else {
        // Update existing category with new subcategories and brands
        const existingData = categoryDoc.data();
        const existingSubcategories = new Set(existingData?.subcategories || []);
        const existingBrands = new Set(existingData?.brands || []);

        categoryData.subcategories.forEach((sub: string) => existingSubcategories.add(sub));
        categoryData.brands.forEach((brand: string) => existingBrands.add(brand));

        await adminDb.collection("productCategories").doc(categoryId).update({
          subcategories: Array.from(existingSubcategories),
          brands: Array.from(existingBrands),
          updatedAt: new Date().toISOString(),
        });
        console.log(`Updated category: ${categoryId}`);
      }
    }

    // Step 3: Update all products to include category references
    let updatedProducts = 0;
    const batch = adminDb.batch();

    for (const doc of productsSnapshot.docs) {
      const data = doc.data() as ProductData;
      const category = data.category?.toLowerCase() || "uncategorized";
      const categoryName = data.categoryName || data.category || "Uncategorized";
      const brand = data.brand?.toLowerCase() || "unknown";

      batch.update(doc.ref, {
        categoryId: category,
        subcategoryId: categoryName.toLowerCase() !== category ? categoryName.toLowerCase() : null,
        brandId: brand !== "unknown" ? brand : null,
        updatedAt: new Date().toISOString(),
      });

      updatedProducts++;
    }

    await batch.commit();
    console.log(`Updated ${updatedProducts} products with category references`);

    console.log("Migration completed successfully!");
    console.log(`Created/Updated ${createdCategories.length} categories`);

    return {
      success: true,
      categoriesCreated: createdCategories.length,
      productsUpdated: updatedProducts,
    };
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Export for use in API route
export default migrateProductsToHybridStructure;
