// Utility functions for working with product category hierarchy
import { db } from "./firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { Product, ProductCategoryHierarchy } from "./db";

// Get all product categories
export async function getAllProductCategories(): Promise<ProductCategoryHierarchy[]> {
  try {
    const categoriesRef = collection(db, "productCategories");
    const snapshot = await getDocs(categoriesRef);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductCategoryHierarchy[];
  } catch (error) {
    console.error("Error fetching product categories:", error);
    return [];
  }
}

// Get a specific category by ID
export async function getProductCategory(categoryId: string): Promise<ProductCategoryHierarchy | null> {
  try {
    const categoryRef = doc(db, "productCategories", categoryId);
    const docSnap = await getDoc(categoryRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as ProductCategoryHierarchy;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching product category:", error);
    return null;
  }
}

// Get products by category
export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products");
    const q = query(productsRef, where("categoryId", "==", categoryId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return [];
  }
}

// Get products by category and subcategory
export async function getProductsByCategoryAndSubcategory(
  categoryId: string,
  subcategoryId: string
): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products");
    const q = query(
      productsRef,
      where("categoryId", "==", categoryId),
      where("subcategoryId", "==", subcategoryId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error fetching products by category and subcategory:", error);
    return [];
  }
}

// Get products by category, subcategory, and brand
export async function getProductsByCategorySubcategoryAndBrand(
  categoryId: string,
  subcategoryId: string,
  brandId: string
): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products");
    const q = query(
      productsRef,
      where("categoryId", "==", categoryId),
      where("subcategoryId", "==", subcategoryId),
      where("brandId", "==", brandId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error fetching products by full hierarchy:", error);
    return [];
  }
}

// Get all brands in a category
export async function getBrandsInCategory(categoryId: string): Promise<string[]> {
  try {
    const category = await getProductCategory(categoryId);
    return category?.brands || [];
  } catch (error) {
    console.error("Error fetching brands in category:", error);
    return [];
  }
}

// Get all subcategories in a category
export async function getSubcategoriesInCategory(categoryId: string): Promise<string[]> {
  try {
    const category = await getProductCategory(categoryId);
    return category?.subcategories || [];
  } catch (error) {
    console.error("Error fetching subcategories in category:", error);
    return [];
  }
}

// Search products across all categories
export async function searchProducts(searchTerm: string): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products");
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - consider using Algolia/Elasticsearch for production
    const q = query(productsRef, where("name", ">=", searchTerm), where("name", "<=", searchTerm + "\uf8ff"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
}
