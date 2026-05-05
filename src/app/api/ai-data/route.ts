import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Singleton pattern - store db instance like webhook does
let adminDb: Firestore | null = null;
let adminApp: App | null = null;

function getAdminDb(): Firestore {
  if (!adminDb) {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    } else {
      adminApp = getApps()[0];
    }
    adminDb = getFirestore(adminApp);
  }
  return adminDb;
}

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const phone = req.nextUrl.searchParams.get("phone");
  const category = req.nextUrl.searchParams.get("category"); // Optional: filter by category
  
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const db = getAdminDb();
  
  // Build products query
  let productsQuery = db.collection("products").where("tenantId", "==", tenantId);
  if (category && category !== "all") {
    productsQuery = productsQuery.where("category", "==", category);
  }
  
  const [settingsSnap, productsSnap, customersSnap, ordersSnap, reviewsSnap, campaignsSnap, inventorySnap] = await Promise.all([
    db.collection("settings").doc(tenantId).get(),
    productsQuery.get(),
    db.collection("customers").where("tenantId", "==", tenantId).get(),
    db.collection("orders").where("tenantId", "==", tenantId).limit(50).get(),
    db.collection("reviews").where("tenantId", "==", tenantId).limit(20).get(),
    db.collection("campaigns").where("tenantId", "==", tenantId).get(),
    db.collection("inventory").where("tenantId", "==", tenantId).get(),
  ]);

  let messages: any[] = [];
  if (phone) {
    const phoneNum = phone.replace("@s.whatsapp.net", "");
    const messagesSnap = await db.collection("tenants").doc(tenantId).collection("conversations").doc(phoneNum).collection("messages").limit(20).get();
    messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  const settingsData = (settingsSnap as any).exists() ? (settingsSnap as any).data() : null;
  const productsData = productsSnap.docs.map(d => {
    const data = d.data();
    const category = data.category || "other";
    // Build a comprehensive product description for AI
    const aiDescription = buildProductDescription(data);
    // Include ONLY public pricing info (NO costPrice or taxRate)
    const pricing = {
      regular: data.price,
      sale: data.salePrice || null,
    };
    // Include inventory info (NO lowStockAlert - internal flag)
    const inventory = {
      stock: data.stock,
      sku: data.sku,
      status: data.status,
    };
    // Include specifications (NO barcode - internal identifier)
    const specifications = {
      brand: data.brand,
      condition: data.condition,
      material: data.material,
      gender: data.gender,
      weight: data.weight,
      weightUnit: data.weightUnit,
      colors: data.colors || [],
      sizes: data.sizes || [],
      categorySpecific: data.categorySpecific || {},
    };
    return {
      id: d.id,
      name: data.name,
      description: data.description,
      category,
      subcategory: data.subcategory,
      images: data.images,
      aiDescription,
      pricing,
      inventory,
      specifications,
      variants: data.variants?.map((v: any) => ({
        specs: v.specs,
        price: v.price,
        stock: v.stock,
      })), // Strip variant id/sku
    };
  });

  // Group products by category for AI
  const productsByCategory: Record<string, any[]> = {};
  productsData.forEach(product => {
    const cat = product.category || "other";
    if (!productsByCategory[cat]) {
      productsByCategory[cat] = [];
    }
    productsByCategory[cat].push(product);
  });

  // Get available categories list
  const availableCategories = Object.keys(productsByCategory).map(cat => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    productCount: productsByCategory[cat].length,
  }));

  // Get product category hierarchy from productCategories collection (filtered by tenant)
  const productCategoriesSnap = await db
    .collection("productCategories")
    .where("tenantId", "==", tenantId)
    .get();
  const productCategoryHierarchy = productCategoriesSnap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || doc.id,
      description: data.description || "",
      subcategories: data.subcategories || [],
      brands: data.brands || [],
      productCount: productsByCategory[doc.id]?.length || 0,
    };
  });

  const customersData = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const ordersData = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const reviewsData = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const campaignsData = campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const inventoryData = inventorySnap.docs.map(d => ({ id: d.id, ...d.data() }));

  return NextResponse.json({
    settings: settingsData,
    products: productsData,
    productsByCategory,
    availableCategories,
    productCategoryHierarchy,
    customers: customersData,
    orders: ordersData,
    reviews: reviewsData,
    campaigns: campaignsData,
    inventory: inventoryData,
    messages,
  });
}

function buildProductDescription(product: any): string {
  const parts = [];
  
  // Basic info
  parts.push(`Product: ${product.name}`);
  if (product.description) {
    parts.push(`Description: ${product.description}`);
  }
  
  // Price - use KES for Kenyan market
  const price = `Price: KES ${(product.price || 0).toLocaleString()}`;
  if (product.salePrice && product.salePrice > 0) {
    parts.push(`${price} (On sale: KES ${(product.salePrice || 0).toLocaleString()})`);
  } else {
    parts.push(price);
  }
  
  // Stock status
  const stock = product.stock || 0;
  if (stock === 0) {
    parts.push(`Status: Out of Stock`);
  } else if (stock <= 5) {
    parts.push(`Status: Low Stock (${stock} remaining)`);
  } else {
    parts.push(`Status: In Stock (${stock} available)`);
  }
  
  // Category
  if (product.category) {
    parts.push(`Category: ${product.category}`);
  }
  
  // Brand
  if (product.brand) {
    parts.push(`Brand: ${product.brand}`);
  }
  
  // Condition
  if (product.condition && product.condition !== "new") {
    parts.push(`Condition: ${product.condition}`);
  }
  
  // Colors
  if (product.colors && product.colors.length > 0) {
    parts.push(`Available Colors: ${product.colors.join(", ")}`);
  }
  
  // Sizes
  if (product.sizes && product.sizes.length > 0) {
    parts.push(`Available Sizes: ${product.sizes.join(", ")}`);
  }
  
  // Material
  if (product.material) {
    parts.push(`Material: ${product.material}`);
  }
  
  // Gender
  if (product.gender) {
    parts.push(`Gender: ${product.gender}`);
  }
  
  // Weight
  if (product.weight) {
    parts.push(`Weight: ${product.weight} ${product.weightUnit || "kg"}`);
  }
  
  // SKU
  if (product.sku) {
    parts.push(`SKU: ${product.sku}`);
  }
  
  return parts.join(". ") + ".";
}
