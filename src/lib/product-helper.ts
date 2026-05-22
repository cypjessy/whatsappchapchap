import { getFirestore } from "firebase-admin/firestore";

// Get product categories for a tenant
export async function getProductCategories(tenantId: string, db: any) {
  try {
    const categoriesSnap = await db
      .collection("productCategories")
      .where("tenantId", "==", tenantId)
      .get();

    return categoriesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[Product Helper] Error fetching categories:", error);
    return [];
  }
}

// Get products by category with pagination
export async function getProductsByCategory(
  tenantId: string,
  categoryId: string,
  limit: number = 5,
  offset: number = 0,
  db: any
) {
  try {
    const productsSnap = await db
      .collection("products")
      .where("tenantId", "==", tenantId)
      .where("category", "==", categoryId)
      .where("status", "==", "active")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return productsSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("[Product Helper] Error fetching products:", error);
    return [];
  }
}

// Get total product count for a category
export async function getCategoryProductCount(
  tenantId: string,
  categoryId: string,
  db: any
): Promise<number> {
  try {
    const productsSnap = await db
      .collection("products")
      .where("tenantId", "==", tenantId)
      .where("category", "==", categoryId)
      .where("status", "==", "active")
      .get();

    return productsSnap.size;
  } catch (error) {
    console.error("[Product Helper] Error counting products:", error);
    return 0;
  }
}

// Format product list for WhatsApp message
export function formatProductList(
  products: any[],
  startIndex: number = 0
): string {
  return products
    .map((product, index) => {
      const num = startIndex + index + 1;
      const price = product.salePrice || product.price;
      const originalPrice = product.salePrice ? ` ~~KES ${product.price.toLocaleString()}~~` : '';
      const stockStatus = product.stock && product.stock > 0 
        ? `(${product.stock} in stock)` 
        : "(Out of stock)";
      
      return `${num}️ ${product.name} - KES ${price.toLocaleString()}${originalPrice} ${stockStatus}`;
    })
    .join("\n\n");
}

// Get product image URL (first available)
export function getProductImage(product: any): string | null {
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  return product.imageUrl || product.image || null;
}
