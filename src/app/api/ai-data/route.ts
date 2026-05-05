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

  // SECURITY: Verify API key or session token (implement based on your auth strategy)
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.AI_DATA_API_KEY) {
    console.warn(`[AI Data] Unauthorized access attempt for tenant ${tenantId}`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  
  // Build products query - ONLY active products
  let productsQuery = db
    .collection("products")
    .where("tenantId", "==", tenantId)
    .where("status", "==", "active"); // Filter out drafts/archived
  
  if (category && category !== "all") {
    productsQuery = productsQuery.where("category", "==", category);
  }
  
  const [settingsSnap, productsSnap, customersSnap, ordersSnap, reviewsSnap, campaignsSnap] = await Promise.all([
    db.collection("settings").doc(tenantId).get(),
    productsQuery.get(),
    db.collection("customers").where("tenantId", "==", tenantId).limit(100).get(), // Limit to prevent huge payloads
    db.collection("orders").where("tenantId", "==", tenantId).orderBy("createdAt", "desc").limit(50).get(),
    db.collection("reviews").where("tenantId", "==", tenantId).orderBy("createdAt", "desc").limit(20).get(), // Fixed: added orderBy
    db.collection("campaigns").where("tenantId", "==", tenantId).limit(20).get(), // Limit campaigns
  ]);

  let messages: any[] = [];
  if (phone) {
    // Handle various JID formats: user@s.whatsapp.net, user:39@s.whatsapp.net, etc.
    const phoneNum = phone.replace(/:\d+@s\.whatsapp\.net$/, "").replace("@s.whatsapp.net", "");
    
    try {
      const messagesSnap = await db
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phoneNum)
        .collection("messages")
        .orderBy("timestamp", "desc") // Get most recent first
        .limit(20)
        .get();
      
      messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.warn(`[AI Data] Failed to fetch messages for ${phoneNum}:`, error);
      // Don't fail entire request if messages unavailable
    }
  }

  // Fixed: settingsSnap.exists is a property, not a method
  const settingsData = settingsSnap.exists ? settingsSnap.data() : null;
  
  // Fixed: Build products data with explicit shaping
  const productsData = productsSnap.docs.map(d => {
    const data = d.data();
    const category = data.category || "other";
    // Build a comprehensive product description for AI - now included in response
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
      description: data.description, // Use raw description
      aiDescription, // Fixed: Now included in response
      category,
      subcategory: data.subcategory,
      images: data.images,
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

  // Fixed: Only fetch all products when category filter is active to avoid double scan
  const sourceForCategories = (category && category !== "all")
    ? await db.collection("products")
        .where("tenantId", "==", tenantId)
        .where("status", "==", "active")
        .get()
    : productsSnap;

  const allCategoriesCount: Record<string, number> = {};
  sourceForCategories.docs.forEach(doc => {
    const cat = doc.data().category || "other";
    allCategoriesCount[cat] = (allCategoriesCount[cat] || 0) + 1;
  });
  
  const availableCategories = Object.keys(allCategoriesCount).map(cat => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    productCount: allCategoriesCount[cat],
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
      productCount: allCategoriesCount[doc.id] || 0, // Fixed: Use allCategoriesCount instead of filtered productsByCategory
    };
  });

  // Fixed: Shape customers data - only expose necessary fields
  const customersData = customersSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      totalOrders: data.totalOrders,
      totalSpent: data.totalSpent,
      createdAt: data.createdAt,
      lastOrderAt: data.lastOrderAt,
    };
  });

  // Fixed: Shape orders data - exclude sensitive payment details
  const ordersData = ordersSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      orderNumber: data.orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      totalAmount: data.totalAmount,
      status: data.status,
      paymentStatus: data.paymentStatus,
      items: data.items?.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      shippingAddress: data.shippingAddress ? {
        street: data.shippingAddress.street,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        zipCode: data.shippingAddress.zipCode,
        country: data.shippingAddress.country,
      } : null,
    };
  });

  // Fixed: Shape reviews data
  const reviewsData = reviewsSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      productId: data.productId,
      productName: data.productName,
      customerName: data.customerName,
      rating: data.rating,
      comment: data.comment,
      createdAt: data.createdAt,
      status: data.status,
      verified: data.verified,
    };
  });

  // Fixed: Shape campaigns data
  const campaignsData = campaignsSnap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      type: data.type,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
      discountType: data.discountType,
      discountValue: data.discountValue,
      applicableProducts: data.applicableProducts?.slice(0, 50), // Limit to first 50 products
      createdAt: data.createdAt,
    };
  });

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
  
  return parts.join(". ") + ".";
}