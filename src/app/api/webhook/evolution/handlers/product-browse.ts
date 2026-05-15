/**
 * Product Browse Handler
 * Handles browsing products via WhatsApp
 * Multi-level navigation: Categories → Subcategories → Brands → Products
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
      const productCountSnap = await adminDb
        .collection("products")
        .where("tenantId", "==", tenantId)
        .where("categoryId", "==", category.categorySlug)
        .where("status", "==", "active")
        .count()
        .get();
      category.productCount = productCountSnap.data().count || 0;
      
      const productsSnap = await adminDb
        .collection("products")
        .where("tenantId", "==", tenantId)
        .where("categoryId", "==", category.categorySlug)
        .where("status", "==", "active")
        .get();
      
      const uniqueBrands = new Set<string>();
      productsSnap.docs.forEach((doc: any) => {
        const productData = doc.data();
        if (productData.brand && productData.brand.trim() !== '' && 
            productData.brand.toLowerCase() !== 'null' && 
            productData.brand.toLowerCase() !== 'unknown') {
          uniqueBrands.add(productData.brand);
        }
      });
      
      if (category.subcategories && category.subcategories.length > 0) {
        for (const subcat of category.subcategories) {
          const subcatProductsSnap = await adminDb
            .collection("products")
            .where("tenantId", "==", tenantId)
            .where("categoryId", "==", category.categorySlug)
            .where("subcategory", "==", subcat)
            .where("status", "==", "active")
            .get();
          
          subcatProductsSnap.docs.forEach((doc: any) => {
            const productData = doc.data();
            if (productData.brand && productData.brand.trim() !== '' && 
                productData.brand.toLowerCase() !== 'null' && 
                productData.brand.toLowerCase() !== 'unknown') {
              uniqueBrands.add(productData.brand);
            }
          });
        }
      }
      
      category.brands = Array.from(uniqueBrands).sort();
      if (deps.debugLog) {
        deps.debugLog(`[ProductBrowse] Category "${category.name}" has brands: ${category.brands.join(', ') || 'none'}`);
      }
    }
    
    const categoryList = categories
      .map((cat, idx) => `${idx + 1}️⃣ ${cat.name} (${cat.productCount} products)`)
      .join('\n');
    
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
            categories: categories,
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
    } else if (currentStep === 'brand_selection') {
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
    if (trimmed === 'menu' || num === 3) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendWelcomeMenu(tenantId, phone);
      return;
    }
    
    if (trimmed === 'back' || num === 0) {
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
    
    const response = `📂 *${selectedCategory.name}* - Subcategories\n\n${subcategoryList}\n\n2️⃣ Back to categories\n3️⃣ Main menu`;
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
    // No subcategories, go directly to brand/product selection
    await deps.stopTyping(tenantId, phone);
    await handleBrandOrProductSelection(tenantId, phone, selectedCategory, deps);
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
  
  if (isNaN(num) || num < 1 || num > categorySubcategories.length) {
    // Check for navigation commands
    if (trimmed === 'categories' || num === 2) {
      await deps.stopTyping(tenantId, phone);
      await startProductBrowseFlow(tenantId, phone, deps);
      return;
    } else if (trimmed === 'menu' || trimmed === 'main' || num === 3) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendWelcomeMenu(tenantId, phone);
      return;
    } else if (trimmed === 'back' || num === 0) {
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
  
  const brands = (categoryBrands || []).filter((b: string) => 
    b && b.toLowerCase() !== 'null' && b.toLowerCase() !== 'unknown'
  );
  
  if (deps.debugLog) {
    deps.debugLog(`[ProductBrowse] Brands for subcategory "${selectedSubcategory}":`, brands);
  }
  
  if (brands.length > 0) {
    // Show brands
    const brandList = brands
      .map((brand: string, idx: number) => `${idx + 1}️⃣ ${brand}`)
      .join('\n');
    
    const response = `🏷️ *${selectedSubcategory}* - Choose a brand\n\n${brandList}\n\n2️⃣ - Back to subcategories\n3️⃣ - View Categories\n4️⃣ - Main menu`;
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
            availableBrands: brands,
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // No brands, show products directly
    await showProductsForSelection(tenantId, phone, {
      ...selections,
      subcategory: selectedSubcategory,
    }, deps);
  }
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
  
  if (isNaN(num) || num < 1 || num > availableBrands.length) {
    // Check for navigation commands
    if (trimmed === 'categories' || num === 3) {
      await deps.stopTyping(tenantId, phone);
      await startProductBrowseFlow(tenantId, phone, deps);
      return;
    } else if (trimmed === 'menu' || trimmed === 'main' || num === 4) {
      await deps.stopTyping(tenantId, phone);
      await deps.sendWelcomeMenu(tenantId, phone);
      return;
    } else if (trimmed === 'back' || num === 2) {
      // Go back to subcategory selection
      const subcategoryList = (selections.categorySubcategories || [])
        .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
        .join('\n');
      const response = `📂 *${selections.categoryName}* - Subcategories\n\n${subcategoryList}\n\n2️⃣ Back to categories\n3️⃣ View Categories\n4️⃣ - Main menu`;
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, response);
      await adminDb.collection("tenants").doc(tenantId)
        .collection("conversations").doc(phone)
        .set({ flowState: { ...flowState, currentStep: 'subcategory_selection', lastActivity: new Date().toISOString() } }, { merge: true });
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
  
  const selectedBrand = availableBrands[num - 1];
  if (deps.debugLog) {
    deps.debugLog("[ProductBrowse] Selected brand:", selectedBrand);
  }
  
  await showProductsForSelection(tenantId, phone, {
    ...selections,
    brand: selectedBrand,
  }, deps);
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
  } else if (trimmed === 'back' || num === '2') {
    // Navigate back based on current context
    if (selections.brand) {
      await handleBrandOrProductSelection(tenantId, phone, {
        id: selections.categoryId,
        categorySlug: selections.categorySlug,
        name: selections.categoryName,
        brands: selections.categoryBrands || [],
        subcategories: selections.categorySubcategories || [],
      }, deps);
    } else if (selections.subcategory) {
      const subcategoryList = (selections.categorySubcategories || [])
        .map((sub: string, idx: number) => `${idx + 1}️⃣ ${sub}`)
        .join('\n');
      const response = `📂 *${selections.categoryName}* - Subcategories\n\n${subcategoryList}\n\n2️⃣ Back to categories\n3️⃣ View Categories\n4️⃣ - Main menu`;
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, response);
      await adminDb.collection("tenants").doc(tenantId)
        .collection("conversations").doc(phone)
        .set({ flowState: { ...flowState, currentStep: 'subcategory_selection', lastActivity: new Date().toISOString() } }, { merge: true });
    } else {
      await deps.stopTyping(tenantId, phone);
      await startProductBrowseFlow(tenantId, phone, deps);
    }
  } else if (trimmed === 'categories' || num === '3') {
    await deps.stopTyping(tenantId, phone);
    await startProductBrowseFlow(tenantId, phone, deps);
  } else if (trimmed === 'menu' || num === '4') {
    await deps.stopTyping(tenantId, phone);
    await deps.sendWelcomeMenu(tenantId, phone);
  } else {
    // Check if it's a search query
    if (deps.checkIfSearchQuery && deps.checkIfSearchQuery(message)) {
      await deps.stopTyping(tenantId, phone);
      if (deps.handleProductSearch) {
        await deps.handleProductSearch(tenantId, phone, message);
      }
    } else {
      await deps.stopTyping(tenantId, phone);
      await deps.sendMessage(tenantId, phone, 
        "*Reply with a number:*\n1️⃣ - View More\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu"
      );
    }
  }
}

/**
 * Handle showing products or brands based on category
 */
async function handleBrandOrProductSelection(
  tenantId: string,
  phone: string,
  category: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  const brands = (category.brands || []).filter((b: string) => 
    b.toLowerCase() !== 'null' && b.toLowerCase() !== 'unknown'
  );
  
  if (brands.length > 0) {
    // Show brands first
    const brandList = brands
      .map((brand: string, idx: number) => `${idx + 1}. ${brand}`)
      .join('\n');
    
    const response = `🏷️ *${category.name}* - Brands\n\n${brandList}\n\n0 Back to categories`;
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
            categoryId: category.id,
            categorySlug: category.categorySlug,
            categoryName: category.name,
            availableBrands: brands,
            categorySubcategories: category.subcategories || [],
          },
          lastActivity: new Date().toISOString(),
        }
      }, { merge: true });
  } else {
    // No brands, show products directly
    await deps.stopTyping(tenantId, phone);
    await showProductsForSelection(tenantId, phone, {
      categoryId: category.id,
      categorySlug: category.categorySlug,
      categoryName: category.name,
      categorySubcategories: category.subcategories || [],
      categoryBrands: category.brands || [],
    }, deps);
  }
}

/**
 * Show products for current selection (category/subcategory/brand)
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
      categoryId: selections.categoryId,
      categorySlug: selections.categorySlug,
      subcategory: selections.subcategory,
      brand: selections.brand,
    }));
  }
  
  let query = adminDb.collection('products')
    .where('tenantId', '==', tenantId)
    .where('status', '==', 'active');
  
  if (selections.categoryId) {
    query = query.where('categoryId', '==', selections.categorySlug || selections.categoryId);
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
      const matchesSubcategory = p.subcategory === selections.subcategory || 
                                p.categoryName === selections.subcategory;
      return matchesSubcategory;
    });
  }
  
  // Filter by brand if selected
  if (selections.brand) {
    products = products.filter((p: any) => {
      const matchesBrand = p.brand === selections.brand || 
                          p.filters?.brand?.includes(selections.brand);
      return matchesBrand;
    });
  }
  
  if (products.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "😔 No products found for this selection. Please try another category.");
    return;
  }
  
  const productsToShow = products.slice(0, 5);
  const totalProducts = products.length;
  
  let headerMessage = `🛍️ *${selections.categoryName}${selections.subcategory ? ' → ' + selections.subcategory : ''}${selections.brand ? ' → ' + selections.brand : ''}*\n\n`;
  headerMessage += `Showing ${productsToShow.length} of ${totalProducts} products:\n\n`;
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

    // Add filters if available
    if (product.filters && Object.keys(product.filters).length > 0) {
      const filterLabels: Record<string, { label: string; icon: string }> = {
        'color': { label: 'Colors', icon: '🎨' },
        'colors': { label: 'Colors', icon: '🎨' },
        'size': { label: 'Sizes', icon: '' },
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
      
      Object.entries(product.filters).forEach(([filterKey, filterValues]) => {
        if (Array.isArray(filterValues) && filterValues.length > 0) {
          const config = filterLabels[filterKey] || { label: filterKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), icon: '📌' };
          productText += `   ${config.icon} ${config.label}: ${filterValues.join(', ')}\n`;
        }
      });
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
      productText += `    *Order here:* ${product.orderLink}\n`;
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
    replyMessage = `\n*Reply with a number:*\n1️⃣ - View More (${totalProducts - 5} more)\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
  } else {
    replyMessage = `\n*Reply with a number:*\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
  }
  
  await deps.sendMessage(tenantId, phone, replyMessage);
  
  // Update flow state
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
          allProducts: products.map((p: any) => p.id),
          currentPage: 0,
          pageSize: 5,
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}

/**
 * Show next page of products
 */
async function showNextProductPage(
  tenantId: string,
  phone: string,
  selections: any,
  deps: ProductBrowseDeps
): Promise<void> {
  const adminDb = getDb();
  
  await deps.startTyping(tenantId, phone);
  
  const allProductIds = selections.allProducts || [];
  const currentPage = selections.currentPage || 0;
  const pageSize = selections.pageSize || 5;
  
  const startIndex = (currentPage + 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  if (startIndex >= allProductIds.length) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "✅ You've seen all available products! Reply *0* to go back.");
    return;
  }
  
  const pageIds = allProductIds.slice(startIndex, endIndex);
  
  // Fetch products in batches
  const productsToShow: any[] = [];
  const batchSize = 10;
  
  for (let i = 0; i < pageIds.length; i += batchSize) {
    const batch = pageIds.slice(i, i + batchSize);
    const batchSnap = await adminDb.collection('products')
      .where('__name__', 'in', batch)
      .get();
    
    batchSnap.docs.forEach((doc: any) => {
      productsToShow.push({
        id: doc.id,
        ...doc.data(),
      });
    });
  }
  
  if (productsToShow.length === 0) {
    await deps.stopTyping(tenantId, phone);
    await deps.sendMessage(tenantId, phone, "No more products available.");
    return;
  }
  
  let headerMessage = `🛍️ *More Products* (Page ${currentPage + 2})\n\n`;
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
      productText += `    ${product.description.substring(0, 120)}${product.description.length > 120 ? '...' : ''}\n`;
    }

    // Add filters
    if (product.filters && Object.keys(product.filters).length > 0) {
      const filterLabels: Record<string, { label: string; icon: string }> = {
        'color': { label: 'Colors', icon: '🎨' },
        'colors': { label: 'Colors', icon: '' },
        'size': { label: 'Sizes', icon: '📏' },
        'sizes': { label: 'Sizes', icon: '📏' },
        'brand': { label: 'Brand', icon: '️' },
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
      
      Object.entries(product.filters).forEach(([filterKey, filterValues]) => {
        if (Array.isArray(filterValues) && filterValues.length > 0) {
          const config = filterLabels[filterKey] || { label: filterKey.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()), icon: '📌' };
          productText += `   ${config.icon} ${config.label}: ${filterValues.join(', ')}\n`;
        }
      });
    }

    // Legacy fields
    if (!product.filters) {
      if (product.colors && product.colors.length > 0) {
        productText += `   🎨 Colors: ${product.colors.join(', ')}\n`;
      }
      if (product.sizes && product.sizes.length > 0) {
        productText += `    Sizes: ${product.sizes.join(', ')}\n`;
      }
      if (product.brand) {
        productText += `   🏷️ Brand: ${product.brand}\n`;
      }
      if (product.condition) {
        productText += `    Condition: ${product.condition}\n`;
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

    if (imageUrl) {
      await deps.sendMedia(tenantId, phone, imageUrl, productText);
    } else {
      await deps.sendMessage(tenantId, phone, productText);
    }
    
    if (idx < productsToShow.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  }
  
  const remaining = allProductIds.length - endIndex;
  let replyMessage = '';
  if (remaining > 0) {
    replyMessage = `\n*Reply with a number:*\n1️⃣ - View More (${remaining} more)\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
  } else {
    replyMessage = `\n*Reply with a number:*\n2️⃣ - Go back\n3️⃣ - View Categories\n4️⃣ - Main Menu`;
  }
  
  await deps.sendMessage(tenantId, phone, replyMessage);
  
  // Update flow state
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
        },
        lastActivity: new Date().toISOString(),
      }
    }, { merge: true });
}
