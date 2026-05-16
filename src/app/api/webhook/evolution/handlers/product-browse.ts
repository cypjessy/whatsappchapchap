/**
 * Product Browse Handler
 * Handles browsing products via WhatsApp
 * Multi-level navigation: Categories → Subcategories → Types → Products
 * 
 * FIXED: Now properly handles categoryId field name, type extraction, and brand selection
 */

import { getFirestore, FieldValue } from "firebase-admin/firestore";

/**
 * Lazy initialization - get Firestore instance only when needed
 */
function getDb() {
  return getFirestore();
}

/**
 * Dependencies passed from main route
 */
export interface ProductBrowseDeps {
  sendMessage: (tenantId: string, phone: string, message: string) => Promise<void>;
  sendMedia: (tenantId: string, phone: string, mediaUrl: string, caption: string) => Promise<void>;
  startTyping: (tenantId: string, phone: string) => Promise<void>;
  stopTyping: (tenantId: string, phone: string) => Promise<void>;
  sendWelcomeMenu: (tenantId: string, phone: string) => Promise<void>;
  debugLog?: (...args: any[]) => void;
  checkIfSearchQuery?: (message: string) => boolean;
  handleProductSearch?: (tenantId: string, phone: string, query: string) => Promise<void>;
}

/**
 * Start product browse flow - show categories
 */
export async function startProductBrowseFlow(
  tenantId: string,
  phone: string,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  try {
    const categoriesSnap = await adminDb
      .collection("categoryNames")
      .where("tenantId", "==", tenantId)
      .get();
    
    if (categoriesSnap.empty) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, "🛍️ We don't have any products listed yet. Please check back soon!");
      return;
    }
    
    const categories = categoriesSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        categorySlug: data.mainCategory,
        name: data.mainCategoryName || data.mainCategory,
        subcategories: data.subcategories || [],
        brands: [] as string[],
        productCount: 0,
      };
    });
    
    // Fetch product counts and brands for each category
    for (const category of categories) {
      // FIXED: Use "category" field (not "categoryId") to match Add Product Modal
      // Use .count() aggregation for efficient counting without fetching documents
      const productCountSnap = await adminDb
        .collection("products")
        .where("tenantId", "==", tenantId)
        .where("category", "==", category.categorySlug)
        .where("status", "==", "active")
        .count()
        .get();
      category.productCount = productCountSnap.data().count || 0;
      
      // Get unique brands from products (sample limited set for performance)
      const productsSnap = await adminDb
        .collection("products")
        .where("tenantId", "==", tenantId)
        .where("category", "==", category.categorySlug)
        .where("status", "==", "active")
        .limit(50) // Reduced limit for better performance
        .get();
      
      const uniqueBrands = new Set<string>();
      productsSnap.docs.forEach((doc: any) => {
        const productData = doc.data();
        // Check both top-level brand and filters.brand
        let brandValue = productData.brand;
        if (!brandValue && productData.filters?.brand && productData.filters.brand.length > 0) {
          brandValue = productData.filters.brand[0];
        }
        if (brandValue && brandValue.trim() !== '' && 
            brandValue.toLowerCase() !== 'null' && 
            brandValue.toLowerCase() !== 'unknown' &&
            brandValue.toLowerCase() !== 'other') {
          uniqueBrands.add(brandValue);
        }
      });
      
      category.brands = Array.from(uniqueBrands).sort();
      if (deps.debugLog) {
        deps.debugLog(`[ProductBrowse] Category "${category.name}" has ${category.brands.length} brands`);
      }
    }
    
    const categoryList = categories
      .filter(cat => cat.productCount > 0) // Only show categories with products
      .map((cat, idx) => `${idx + 1}️⃣ ${cat.name} (${cat.productCount} products)`)
      .join('\n');
    
    if (!categoryList) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, "🛍️ No products available at the moment. Please check back soon!");
      return;
    }
    
    const response = `🛍️ *Browse Products*\n\nChoose a category:\n\n${categoryList}\n\n0️⃣ Back to main menu`;
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'product_browse',
          currentStep: 'category_selection',
          selections: {
            categories: categories.filter(cat => cat.productCount > 0),
          },
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } catch (error) {
    console.error('[ProductBrowse] Error in startProductBrowseFlow:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "❌ Unable to load products. Please try again later.");
  }
}

/**
 * Handle product browse input at various steps
 */
export async function handleProductBrowseInput(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const { currentStep, selections } = flowState;
  
  await deps.startTyping(tenantId, phone);
  
  try {
    if (currentStep === 'category_selection') {
      await handleCategorySelection(tenantId, phone, message, selections, deps);
    } else if (currentStep === 'subcategory_selection') {
      await handleSubcategorySelection(tenantId, phone, message, flowState, deps);
    } else if (currentStep === 'type_selection') {
      await handleTypeSelection(tenantId, phone, message, flowState, deps);
    } else if (currentStep === 'brand_selection') {
      // FIXED: Added brand selection handler
      await handleBrandSelection(tenantId, phone, message, flowState, deps);
    } else if (currentStep === 'product_pagination') {
      await handleProductPagination(tenantId, phone, message, flowState, deps);
    }
  } catch (error) {
    console.error('[ProductBrowse] Error in handleProductBrowseInput:', error);
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "❌ Something went wrong. Please try again or reply *MENU* for main menu.");
  }
}

/**
 * Handle category selection
 */
async function handleCategorySelection(
  tenantId: string,
  phone: string,
  message: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const num = parseInt(message.trim());
  const categories = selections.categories;
  const trimmed = message.trim().toLowerCase();
  
  if (isNaN(num) || num < 1 || num > categories.length) {
    // Check for special commands
    if (trimmed === 'menu' || num === 3 || trimmed === '0' || trimmed === 'back') {
      await deps.stopTyping(tenantId, phone);
      await deps.sendWelcomeMenu(tenantId, phone);
      return;
    }
    
    // Check if it's a search query
    if (deps.checkIfSearchQuery && deps.checkIfSearchQuery(message)) {
      await deps.stopTyping(tenantId, phone);
      if (deps.handleProductSearch) {
        await deps.handleProductSearch(tenantId, phone, message);
      }
      return;
    }
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "❌ Invalid selection. Please choose a number from the list.");
    return;
  }
  
  const selectedCategory = categories[num - 1];
  
  if (selectedCategory.subcategories && selectedCategory.subcategories.length > 0) {
    // Show subcategories
    const subcategoryList = selectedCategory.subcategories
      .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
      .join('\n');
    
    const response = `📂 *${selectedCategory.name}* - Subcategories\n\n${subcategoryList}\n\n0️⃣ Back to categories\n*Or* send a brand name to search`;
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
    const adminDb = getDb();
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'product_browse',
          currentStep: 'subcategory_selection',
          selections: {
            ...selections,
            categoryId: selectedCategory.id,
            categorySlug: selectedCategory.categorySlug,
            categoryName: selectedCategory.name,
            categoryBrands: selectedCategory.brands || [],
            categorySubcategories: selectedCategory.subcategories || [],
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // No subcategories, check if brands exist
    if (selectedCategory.brands && selectedCategory.brands.length > 0) {
      await showBrandsForCategory(tenantId, phone, selectedCategory, deps);
    } else {
      await showProductsForSelection(tenantId, phone, {
        categorySlug: selectedCategory.categorySlug,
        categoryName: selectedCategory.name,
      }, deps);
    }
  }
}

/**
 * Show brands for a category
 */
async function showBrandsForCategory(
  tenantId: string,
  phone: string,
  category: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  const brandList = category.brands
    .map((brand: string, idx: number) => `${idx + 1}️⃣ ${brand}`)
    .join('\n');
  
  const response = `🏷️ *${category.name}* - Brands\n\n${brandList}\n\n0️⃣ Back to categories\n*Or* send a brand name to search`;
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, response);
  
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'product_browse',
        currentStep: 'brand_selection',
        selections: {
          categorySlug: category.categorySlug,
          categoryName: category.name,
          availableBrands: category.brands,
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

/**
 * Handle brand selection
 */
async function handleBrandSelection(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const { selections } = flowState;
  const num = parseInt(message.trim());
  const availableBrands = selections.availableBrands || [];
  const trimmed = message.trim().toLowerCase();
  
  // Check if user typed a brand name directly
  let selectedBrand: string | null = null;
  
  if (!isNaN(num) && num >= 1 && num <= availableBrands.length) {
    selectedBrand = availableBrands[num - 1];
  } else {
    // Try to match typed brand name (case-insensitive)
    const matchedBrand = availableBrands.find(
      (brand: string) => brand.toLowerCase() === trimmed || 
                         brand.toLowerCase().includes(trimmed)
    );
    if (matchedBrand) {
      selectedBrand = matchedBrand;
    }
  }
  
  if (!selectedBrand) {
    // Check navigation commands
    if (trimmed === '0' || trimmed === 'back' || trimmed === 'categories') {
      await deps.stopTyping(tenantId, phone);
      await startProductBrowseFlow(tenantId, phone, deps);
      return;
    }
    
    if (trimmed === 'menu') {
      await deps.stopTyping(tenantId, phone);
      await deps.sendWelcomeMenu(tenantId, phone);
      return;
    }
    
    // Check if it's a search query
    if (deps.checkIfSearchQuery && deps.checkIfSearchQuery(message)) {
      await deps.stopTyping(tenantId, phone);
      if (deps.handleProductSearch) {
        await deps.handleProductSearch(tenantId, phone, message);
      }
      return;
    }
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "❌ Invalid brand selection. Please choose a number from the list or type a brand name.");
    return;
  }
  
  if (deps.debugLog) {
    deps.debugLog("[ProductBrowse] Selected brand:", selectedBrand);
  }
  
  await showProductsForBrand(tenantId, phone, {
    ...selections,
    brand: selectedBrand,
  }, deps);
}

/**
 * Show products for a specific brand
 */
async function showProductsForBrand(
  tenantId: string,
  phone: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  // Query products by brand (check both top-level and filters)
  const productsSnap = await adminDb
    .collection("products")
    .where("tenantId", "==", tenantId)
    .where("category", "==", selections.categorySlug)
    .where("status", "==", "active")
    .get();
  
  let products = productsSnap.docs.map((doc: any) => {
    const data = doc.data();
    return { id: doc.id, ...data };
  });
  
  // Filter by brand (check both top-level and filters)
  products = products.filter((p: any) => {
    const topLevelBrand = p.brand;
    const filterBrand = p.filters?.brand?.[0];
    const productBrand = topLevelBrand || filterBrand;
    return productBrand === selections.brand;
  });
  
  if (products.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, `😔 No products found for brand "${selections.brand}". Please try another.`);
    return;
  }
  
  // Check if we need to show types first
  const uniqueTypes = new Set<string>();
  products.forEach((p: any) => {
    if (p.type && p.type.trim() !== '') {
      uniqueTypes.add(p.type);
    }
  });
  
  const types = Array.from(uniqueTypes).sort();
  
  if (types.length > 0 && !selections.skipTypeSelection) {
    const typeList = types
      .map((type: string, idx: number) => `${idx + 1}️⃣ ${type}`)
      .join('\n');
    
    const response = `🏷️ *${selections.brand}* - Choose a type\n\n${typeList}\n\n0️⃣ Back to brands`;
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'product_browse',
          currentStep: 'type_selection',
          selections: {
            ...selections,
            brand: selections.brand,
            availableTypes: types,
            productsByBrand: products.map((p: any) => p.id),
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    await showProductsList(tenantId, phone, products, selections, deps);
  }
}

/**
 * Handle subcategory selection
 */
async function handleSubcategorySelection(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const { selections } = flowState;
  const num = parseInt(message.trim());
  const { categoryId, categoryName, categorySubcategories, categoryBrands } = selections;
  const trimmed = message.trim().toLowerCase();
  
  // Check if user typed a brand name
  if (trimmed !== '0' && trimmed !== 'back' && trimmed !== 'categories' && trimmed !== 'menu') {
    const matchedBrand = categoryBrands?.find(
      (brand: string) => brand.toLowerCase() === trimmed || 
                         brand.toLowerCase().includes(trimmed)
    );
    if (matchedBrand) {
      await showProductsForBrand(tenantId, phone, {
        ...selections,
        brand: matchedBrand,
      }, deps);
      return;
    }
  }
  
  if (isNaN(num) || num < 1 || num > categorySubcategories.length) {
    // Check for navigation commands
    if (trimmed === '0' || trimmed === 'back' || trimmed === 'categories') {
      await deps.stopTyping(tenantId, phone);
      await startProductBrowseFlow(tenantId, phone, deps);
      return;
    } else if (trimmed === 'menu') {
      await deps.stopTyping(tenantId, phone);
      await deps.sendWelcomeMenu(tenantId, phone);
      return;
    }
    
    // Check if it's a search query
    if (deps.checkIfSearchQuery && deps.checkIfSearchQuery(message)) {
      await deps.stopTyping(tenantId, phone);
      if (deps.handleProductSearch) {
        await deps.handleProductSearch(tenantId, phone, message);
      }
      return;
    }
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "❌ Invalid selection. Please choose a number from the list.");
    return;
  }
  
  const selectedSubcategory = categorySubcategories[num - 1];
  if (deps.debugLog) {
    deps.debugLog("[ProductBrowse] Selected subcategory:", selectedSubcategory);
  }
  
  // Query unique types from products in this subcategory
  // FIXED: Use "category" field (not "categoryId")
  const productsSnap = await adminDb
    .collection("products")
    .where("tenantId", "==", tenantId)
    .where("category", "==", selections.categorySlug)
    .where("subcategory", "==", selectedSubcategory)
    .where("status", "==", "active")
    .get();
  
  const uniqueTypes = new Set<string>();
  productsSnap.docs.forEach((doc: any) => {
    const productData = doc.data();
    if (productData.type && productData.type.trim() !== '' && 
        productData.type.toLowerCase() !== 'null' && 
        productData.type.toLowerCase() !== 'unknown') {
      uniqueTypes.add(productData.type);
    }
  });
  
  const types = Array.from(uniqueTypes).sort();
  
  if (deps.debugLog) {
    deps.debugLog(`[ProductBrowse] Types for subcategory "${selectedSubcategory}":`, types);
  }
  
  if (types.length > 0) {
    // Show types
    const typeList = types
      .map((type: string, idx: number) => `${idx + 1}️⃣ ${type}`)
      .join('\n');
    
    const response = `🏷️ *${selectedSubcategory}* - Choose a type\n\n${typeList}\n\n0️⃣ Back to subcategories\n*Or* send a brand name to search`;
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, response);
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        flowState: {
          isActive: true,
          flowName: 'product_browse',
          currentStep: 'type_selection',
          selections: {
            ...selections,
            subcategory: selectedSubcategory,
            availableTypes: types,
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // No types, check if brands exist for this subcategory
    const uniqueBrands = new Set<string>();
    productsSnap.docs.forEach((doc: any) => {
      const productData = doc.data();
      let brandValue = productData.brand;
      if (!brandValue && productData.filters?.brand && productData.filters.brand.length > 0) {
        brandValue = productData.filters.brand[0];
      }
      if (brandValue && brandValue.trim() !== '') {
        uniqueBrands.add(brandValue);
      }
    });
    
    const subcategoryBrands = Array.from(uniqueBrands).sort();
    
    if (subcategoryBrands.length > 0) {
      const brandList = subcategoryBrands
        .map((brand: string, idx: number) => `${idx + 1}️⃣ ${brand}`)
        .join('\n');
      
      const response = `🏷️ *${selectedSubcategory}* - Brands\n\n${brandList}\n\n0️⃣ Back to subcategories`;
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, response);
      
      await adminDb
        .collection("tenants")
        .doc(tenantId)
        .collection("conversations")
        .doc(phone)
        .set({
          flowState: {
            isActive: true,
            flowName: 'product_browse',
            currentStep: 'brand_selection',
            selections: {
              ...selections,
              subcategory: selectedSubcategory,
              availableBrands: subcategoryBrands,
            },
            lastActivity: new Date().toISOString(),
          }
        }, { merge: true });
    } else {
      await showProductsForSelection(tenantId, phone, {
        ...selections,
        subcategory: selectedSubcategory,
      }, deps);
    }
  }
}

/**
 * Handle type selection
 */
async function handleTypeSelection(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const { selections } = flowState;
  const num = parseInt(message.trim());
  const availableTypes = selections.availableTypes || [];
  const trimmed = message.trim().toLowerCase();
  
  // Check if user typed a brand name
  const categoryBrands = selections.categoryBrands || [];
  const matchedBrand = categoryBrands.find(
    (brand: string) => brand.toLowerCase() === trimmed || 
                       brand.toLowerCase().includes(trimmed)
  );
  
  if (matchedBrand) {
    await showProductsForBrand(tenantId, phone, {
      ...selections,
      brand: matchedBrand,
      skipTypeSelection: true,
    }, deps);
    return;
  }
  
  if (isNaN(num) || num < 1 || num > availableTypes.length) {
    // Check for navigation commands
    if (trimmed === '0' || trimmed === 'back') {
      await deps.stopTyping(tenantId, phone);
      // Go back to subcategory selection
      const subcategoryList = (selections.categorySubcategories || [])
        .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
        .join('\n');
      const response = `📂 *${selections.categoryName}* - Subcategories\n\n${subcategoryList}\n\n0️⃣ Back to categories`;
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, response);
      await adminDb.collection("tenants").doc(tenantId)
        .collection("conversations").doc(phone)
        .set({ flowState: { ...flowState, currentStep: 'subcategory_selection', lastActivity: new Date().toISOString() } }, { merge: true });
      return;
    } else if (trimmed === 'menu') {
      await deps.stopTyping(tenantId, phone);
      await deps.sendWelcomeMenu(tenantId, phone);
      return;
    } else if (trimmed === 'categories') {
      await deps.stopTyping(tenantId, phone);
      await startProductBrowseFlow(tenantId, phone, deps);
      return;
    }
    
    // Check if it's a search query
    if (deps.checkIfSearchQuery && deps.checkIfSearchQuery(message)) {
      await deps.stopTyping(tenantId, phone);
      if (deps.handleProductSearch) {
        await deps.handleProductSearch(tenantId, phone, message);
      }
      return;
    }
    
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "❌ Invalid selection. Please choose a number from the list.");
    return;
  }
  
  const selectedType = availableTypes[num - 1];
  if (deps.debugLog) {
    deps.debugLog("[ProductBrowse] Selected type:", selectedType);
  }
  
  await showProductsForSelection(tenantId, phone, {
    ...selections,
    type: selectedType,
  }, deps);
}

/**
 * Show products for current selection (category/subcategory/type/brand)
 */
async function showProductsForSelection(
  tenantId: string,
  phone: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  if (deps.debugLog) {
    deps.debugLog(`[ProductBrowse] showProductsForSelection called with:`, JSON.stringify({
      categorySlug: selections.categorySlug,
      subcategory: selections.subcategory,
      type: selections.type,
      brand: selections.brand,
    }));
  }
  
  // FIXED: Use "category" field with display name to match Add Product Modal
  let query = adminDb.collection('products')
    .where('tenantId', '==', tenantId)
    .where('status', '==', 'active');
  
  if (selections.categoryName) {
    query = query.where('category', '==', selections.categoryName);
  }
  
  // Also support categoryId as fallback
  if (selections.categoryId && !selections.categorySlug) {
    query = query.where('category', '==', selections.categoryId);
  }
  
  const productsSnap = await query.get();
  if (deps.debugLog) {
    deps.debugLog(`[ProductBrowse] Found ${productsSnap.size} products for category ${selections.categorySlug || selections.categoryId}`);
  }
  
  let products = productsSnap.docs.map((doc: any) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
    };
  });
  
  // Filter by subcategory if selected
  if (selections.subcategory) {
    products = products.filter((p: any) => {
      const matchesSubcategory = p.subcategory === selections.subcategory;
      return matchesSubcategory;
    });
    if (deps.debugLog) {
      deps.debugLog(`[ProductBrowse] After subcategory filter "${selections.subcategory}": ${products.length} products`);
    }
  }
  
  // Filter by type if selected (check both top-level and filters)
  if (selections.type) {
    products = products.filter((p: any) => {
      const topLevelType = p.type;
      const filterType = p.filters?.type?.[0];
      return topLevelType === selections.type || filterType === selections.type;
    });
    if (deps.debugLog) {
      deps.debugLog(`[ProductBrowse] After type filter "${selections.type}": ${products.length} products`);
    }
  }
  
  // Filter by brand if selected (check both top-level and filters)
  if (selections.brand) {
    products = products.filter((p: any) => {
      const topLevelBrand = p.brand;
      const filterBrand = p.filters?.brand?.[0];
      return topLevelBrand === selections.brand || filterBrand === selections.brand;
    });
    if (deps.debugLog) {
      deps.debugLog(`[ProductBrowse] After brand filter "${selections.brand}": ${products.length} products`);
    }
  }
  
  if (products.length === 0) {
    await deps.stopTyping(tenantId, phone);
    
    // Try to find similar products by relaxing filters
    let suggestionMessage = "😔 No products found for this selection.\n\n";
    
    // Suggest browsing without type filter
    if (selections.type && selections.subcategory) {
      const broaderQuery = adminDb.collection('products')
        .where('tenantId', '==', tenantId)
        .where('category', '==', selections.categoryName || selections.categoryId)
        .where('subcategory', '==', selections.subcategory)
        .where('status', '==', 'active')
        .limit(3);
      
      const broaderSnap = await broaderQuery.get();
      
      if (!broaderSnap.empty) {
        suggestionMessage += `💡 *Try these instead:*\n`;
        suggestionMessage += `We have ${broaderSnap.size} other products in *${selections.subcategory}* without the "${selections.type}" filter.\n\n`;
        suggestionMessage += `Reply *BACK* to see all ${selections.subcategory} products.`;
      } else {
        suggestionMessage += `💡 *Suggestion:* Reply *CATEGORIES* to browse all available categories.`;
      }
    } else if (selections.subcategory) {
      // Suggest other subcategories in same category
      suggestionMessage += `💡 *Suggestion:* Reply *BACK* to see other subcategories in ${selections.categoryName}.`;
    } else {
      suggestionMessage += `💡 *Suggestion:* Reply *CATEGORIES* to browse all available categories.`;
    }
    
    await deps.sendMessage(tenantId, phone, suggestionMessage);
    return;
  }
  
  await showProductsList(tenantId, phone, products, selections, deps);
}

/**
 * Display list of products with pagination
 */
async function showProductsList(
  tenantId: string,
  phone: string,
  products: any[],
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  const productsToShow = products.slice(0, 5);
  const totalProducts = products.length;
  
  let headerMessage = `🛍️ *${selections.categoryName || selections.categorySlug}`;
  if (selections.subcategory) headerMessage += ` → ${selections.subcategory}`;
  if (selections.type) headerMessage += ` → ${selections.type}`;
  if (selections.brand) headerMessage += ` → ${selections.brand}`;
  headerMessage += `*\n\nShowing ${productsToShow.length} of ${totalProducts} products:\n\n`;
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, headerMessage);
  
  // Send each product
  for (let idx = 0; idx < productsToShow.length; idx++) {
    const product = productsToShow[idx];
    const imageUrl = product.images?.[0] || product.imageUrl || product.image;
    
    let productText = `*${idx + 1}. ${product.name}*\n`;

    if (product.salePrice) {
      productText += `   💰 ~~KES ${product.price?.toLocaleString()}~~ → *KES ${product.salePrice.toLocaleString()}* 🔥\n`;
    } else {
      productText += `   💰 KES ${product.price?.toLocaleString() || 'N/A'}\n`;
    }

    if (product.stock !== undefined) {
      const stockLabel = product.stock === 0
        ? '❌ Out of stock'
        : product.stock <= 5
          ? `⚠️ Only ${product.stock} left`
          : `✅ In stock (${product.stock})`;
      productText += `   📦 ${stockLabel}\n`;
    }

    if (product.description) {
      productText += `   📝 ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
    }

    // Add filters/specs
    if (product.filters && Object.keys(product.filters).length > 0) {
      const filterLabels: Record<string, { label: string; icon: string }> = {
        'color': { label: 'Colors', icon: '🎨' },
        'colors': { label: 'Colors', icon: '🎨' },
        'size': { label: 'Sizes', icon: '📏' },
        'sizes': { label: 'Sizes', icon: '📏' },
        'brand': { label: 'Brand', icon: '🏷️' },
        'condition': { label: 'Condition', icon: '✨' },
        'warranty': { label: 'Warranty', icon: '🛡️' },
        'material': { label: 'Material', icon: '🧵' },
        'weight': { label: 'Weight', icon: '⚖️' },
        'capacity': { label: 'Capacity', icon: '📦' },
        'power': { label: 'Power', icon: '⚡' },
        'screen_size': { label: 'Screen Size', icon: '📱' },
        'ram': { label: 'RAM', icon: '💾' },
        'storage': { label: 'Storage', icon: '💿' },
      };
      
      // Show top 3 important specs
      const importantSpecs = ['brand', 'color', 'size', 'condition', 'warranty'];
      let specsShown = 0;
      
      for (const importantSpec of importantSpecs) {
        if (product.filters[importantSpec] && product.filters[importantSpec].length > 0 && specsShown < 3) {
          const config = filterLabels[importantSpec] || { label: importantSpec, icon: '📌' };
          productText += `   ${config.icon} ${config.label}: ${product.filters[importantSpec].join(', ')}\n`;
          specsShown++;
        }
      }
      
      // If still need to show more specs, show additional ones
      if (specsShown < 3) {
        for (const [filterKey, filterValues] of Object.entries(product.filters)) {
          if (specsShown >= 3) break;
          if (!importantSpecs.includes(filterKey) && Array.isArray(filterValues) && filterValues.length > 0) {
            const config = filterLabels[filterKey] || { label: filterKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), icon: '📌' };
            productText += `   ${config.icon} ${config.label}: ${filterValues.join(', ')}\n`;
            specsShown++;
          }
        }
      }
    }

    // Legacy fields (without filters)
    if (!product.filters) {
      if (product.colors && product.colors.length > 0) {
        productText += `   🎨 Colors: ${product.colors.join(', ')}\n`;
      }
      if (product.sizes && product.sizes.length > 0) {
        productText += `   📏 Sizes: ${product.sizes.join(', ')}\n`;
      }
      if (product.brand) {
        productText += `   🏷️ Brand: ${product.brand}\n`;
      }
      if (product.condition) {
        productText += `   ✨ Condition: ${product.condition}\n`;
      }
      if (product.warranty) {
        productText += `   🛡️ Warranty: ${product.warranty}\n`;
      }
    }

    if (product.variants && product.variants.length > 0) {
      productText += `   🔀 Variants: ${product.variants.length} options available\n`;
    }

    if (product.paymentMethods && product.paymentMethods.length > 0) {
      productText += `   💳 Pay via: ${product.paymentMethods.map((m: any) => m.name).join(', ')}\n`;
    }

    if (product.orderLink) {
      productText += `   🛒 *Order here:* ${product.orderLink}\n`;
    }

    // Send as media if image available, otherwise text
    if (imageUrl) {
      await deps.sendMedia(tenantId, phone, imageUrl, productText);
    } else {
      await deps.sendMessage(tenantId, phone, productText);
    }
    
    // Small delay between messages
    if (idx < productsToShow.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  // Show pagination options
  let replyMessage = '';
  if (totalProducts > 5) {
    replyMessage = `\n*Reply with a number:*\n1️⃣ - View More (${totalProducts - 5} more)\n0️⃣ - Go back\n*Or* send a product number to order`;
  } else {
    replyMessage = `\n*Reply with a number:*\n0️⃣ - Go back\n*Or* send a product number to order`;
  }
  
  await deps.sendMessage(tenantId, phone, replyMessage);
  
  // Update flow state - use cursor-based pagination to avoid storing all IDs
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'product_browse',
        currentStep: 'product_pagination',
        selections: {
          ...selections,
          // Store filter criteria instead of all product IDs
          lastDocId: productsToShow.length > 0 ? productsToShow[productsToShow.length - 1].id : null,
          currentPage: 0,
          pageSize: 5,
          totalProducts: totalProducts, // Store count for reference
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

/**
 * Handle product pagination (view more products)
 */
async function handleProductPagination(
  tenantId: string,
  phone: string,
  message: string,
  flowState: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  const { selections } = flowState;
  const trimmed = message.trim().toLowerCase();
  const num = message.trim();

  if (trimmed === 'next' || trimmed === 'more' || num === '1') {
    await showNextProductPage(tenantId, phone, selections, deps);
  } else if (trimmed === '0' || trimmed === 'back') {
    await deps.stopTyping(tenantId, phone);
    await startProductBrowseFlow(tenantId, phone, deps);
  } else if (trimmed === 'menu') {
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
  } else {
    // Check if it's a product number (1-5)
    const productNum = parseInt(num);
    if (!isNaN(productNum) && productNum >= 1 && productNum <= 5) {
      // Handle product order - this would call your order flow
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, 
        `🛒 To order product #${productNum}, please reply with "ORDER ${productNum}" or contact us directly.`
      );
    } 
    // Check if it's a search query
    else if (deps.checkIfSearchQuery && deps.checkIfSearchQuery(message)) {
      await deps.stopTyping(tenantId, phone);
      if (deps.handleProductSearch) {
        await deps.handleProductSearch(tenantId, phone, message);
      }
    } else {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, 
        "*Reply with a number:*\n1️⃣ - View More\n0️⃣ - Go back\n*Or* send a product number to order"
      );
    }
  }
}

/**
 * Show next page of products using cursor-based pagination
 */
async function showNextProductPage(
  tenantId: string,
  phone: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  const currentPage = selections.currentPage || 0;
  const pageSize = selections.pageSize || 5;
  const lastDocId = selections.lastDocId; // Last document ID from previous page
  
  // Build query with filters
  let query = adminDb.collection('products')
    .where('tenantId', '==', tenantId)
    .where('status', '==', 'active');
  
  if (selections.categoryName || selections.categorySlug) {
    query = query.where('category', '==', selections.categoryName || selections.categorySlug);
  }
  
  if (selections.subcategory) {
    query = query.where('subcategory', '==', selections.subcategory);
  }
  
  if (selections.type) {
    query = query.where('type', '==', selections.type);
  }
  
  if (selections.brand) {
    query = query.where('brand', '==', selections.brand);
  }
  
  // Order by createdAt for consistent pagination
  query = query.orderBy('createdAt', 'desc');
  
  // Use startAfter for cursor-based pagination
  if (lastDocId) {
    const lastDocSnap = await adminDb.collection('products').doc(lastDocId).get();
    if (lastDocSnap.exists) {
      query = query.startAfter(lastDocSnap);
    }
  }
  
  // Fetch next page
  const productsSnap = await query.limit(pageSize).get();
  
  if (productsSnap.empty) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "✅ You've seen all available products! Reply *0* to go back.");
    return;
  }
  
  const productsToShow = productsSnap.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));
  
  const totalProducts = selections.totalProducts || 0;
  const shownSoFar = (currentPage + 1) * pageSize + productsToShow.length;
  
  let headerMessage = `🛍️ *${selections.categoryName || selections.categorySlug}`;
  if (selections.subcategory) headerMessage += ` → ${selections.subcategory}`;
  if (selections.type) headerMessage += ` → ${selections.type}`;
  if (selections.brand) headerMessage += ` → ${selections.brand}`;
  headerMessage += `*\n\nPage ${currentPage + 2} - Showing ${productsToShow.length} more products:\n\n`;
  
  await deps.stopTyping(tenantId, phone);
  await deps.sendMessage(tenantId, phone, headerMessage);
  
  // Send each product
  for (let idx = 0; idx < productsToShow.length; idx++) {
    const product = productsToShow[idx];
    const imageUrl = product.images?.[0] || product.imageUrl || product.image;
    
    let productText = `*${idx + 1}. ${product.name}*\n`;

    if (product.salePrice) {
      productText += `   💰 ~~KES ${product.price?.toLocaleString()}~~ → *KES ${product.salePrice.toLocaleString()}* 🔥\n`;
    } else {
      productText += `   💰 KES ${product.price?.toLocaleString() || 'N/A'}\n`;
    }

    if (product.stock !== undefined) {
      const stockLabel = product.stock === 0
        ? '❌ Out of stock'
        : product.stock <= 5
          ? `⚠️ Only ${product.stock} left`
          : `✅ In stock (${product.stock})`;
      productText += `   📦 ${stockLabel}\n`;
    }

    if (product.description) {
      productText += `   📝 ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
    }

    // Add filters/specs (same as above)
    if (product.filters && Object.keys(product.filters).length > 0) {
      const filterLabels: Record<string, { label: string; icon: string }> = {
        'color': { label: 'Colors', icon: '🎨' },
        'colors': { label: 'Colors', icon: '🎨' },
        'size': { label: 'Sizes', icon: '📏' },
        'sizes': { label: 'Sizes', icon: '📏' },
        'brand': { label: 'Brand', icon: '🏷️' },
        'condition': { label: 'Condition', icon: '✨' },
        'warranty': { label: 'Warranty', icon: '🛡️' },
        'material': { label: 'Material', icon: '🧵' },
        'weight': { label: 'Weight', icon: '⚖️' },
        'capacity': { label: 'Capacity', icon: '📦' },
        'power': { label: 'Power', icon: '⚡' },
        'screen_size': { label: 'Screen Size', icon: '📱' },
        'ram': { label: 'RAM', icon: '💾' },
        'storage': { label: 'Storage', icon: '💿' },
      };
      
      let specsShown = 0;
      const importantSpecs = ['brand', 'color', 'size', 'condition', 'warranty'];
      
      for (const importantSpec of importantSpecs) {
        if (product.filters[importantSpec] && product.filters[importantSpec].length > 0 && specsShown < 3) {
          const config = filterLabels[importantSpec] || { label: importantSpec, icon: '📌' };
          productText += `   ${config.icon} ${config.label}: ${product.filters[importantSpec].join(', ')}\n`;
          specsShown++;
        }
      }
      
      if (specsShown < 3) {
        for (const [filterKey, filterValues] of Object.entries(product.filters)) {
          if (specsShown >= 3) break;
          if (!importantSpecs.includes(filterKey) && Array.isArray(filterValues) && filterValues.length > 0) {
            const config = filterLabels[filterKey] || { label: filterKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), icon: '📌' };
            productText += `   ${config.icon} ${config.label}: ${filterValues.join(', ')}\n`;
            specsShown++;
          }
        }
      }
    }

    if (product.variants && product.variants.length > 0) {
      productText += `   🔀 Variants: ${product.variants.length} options available\n`;
    }

    if (product.orderLink) {
      productText += `   🛒 *Order here:* ${product.orderLink}\n`;
    }

    if (imageUrl) {
      await deps.sendMedia(tenantId, phone, imageUrl, productText);
    } else {
      await deps.sendMessage(tenantId, phone, productText);
    }
    
    if (idx < productsToShow.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  // Calculate if there are more products
  const hasMoreProducts = productsToShow.length === pageSize;
  let replyMessage = '';
  if (hasMoreProducts) {
    replyMessage = `\n*Reply with a number:*\n1️⃣ - View More\n0️⃣ - Go back\n*Or* send a product number to order`;
  } else {
    replyMessage = `\n*Reply with a number:*\n0️⃣ - Go back\n*Or* send a product number to order`;
  }
  
  await deps.sendMessage(tenantId, phone, replyMessage);
  
  // Update flow state with new cursor
  await adminDb
    .collection("tenants")
    .doc(tenantId)
    .collection("conversations")
    .doc(phone)
    .set({
      flowState: {
        isActive: true,
        flowName: 'product_browse',
        currentStep: 'product_pagination',
        selections: {
          ...selections,
          currentPage: currentPage + 1,
          lastDocId: productsToShow.length > 0 ? productsToShow[productsToShow.length - 1].id : null,
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}