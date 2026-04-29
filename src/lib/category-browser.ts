/**
 * Category Browser - Simple hierarchical product browsing for WhatsApp
 * 
 * Flow: Main Categories → Sub-categories → Products (5 at a time)
 * No state management needed - each message is independent
 */

import { AIContext } from "./ai-service";

// ============================================================================
// CATEGORY BROWSING FUNCTIONS
// ============================================================================

/**
 * Get unique main categories from products
 */
export function getMainCategories(context: AIContext): Array<{ id: string; name: string; count: number }> {
  const categoryMap = new Map<string, { name: string; count: number }>();
  
  context.products.forEach(product => {
    if (product.category) {
      const existing = categoryMap.get(product.category);
      if (existing) {
        existing.count++;
      } else {
        categoryMap.set(product.category, {
          name: product.categoryName || product.category,
          count: 1
        });
      }
    }
  });
  
  return Array.from(categoryMap.entries()).map(([id, data]) => ({
    id,
    name: data.name,
    count: data.count
  }));
}

/**
 * Get sub-categories for a main category
 */
export function getSubCategories(
  mainCategory: string,
  context: AIContext
): Array<{ name: string; count: number }> {
  const subCategoryMap = new Map<string, number>();
  
  context.products.forEach(product => {
    if (product.category === mainCategory && product.categoryName) {
      const existing = subCategoryMap.get(product.categoryName);
      subCategoryMap.set(product.categoryName, (existing || 0) + 1);
    }
  });
  
  return Array.from(subCategoryMap.entries()).map(([name, count]) => ({
    name,
    count
  }));
}

/**
 * Get products by sub-category with pagination
 */
export function getProductsBySubCategory(
  mainCategory: string,
  subCategory: string,
  context: AIContext,
  page: number = 1,
  pageSize: number = 5
): { products: any[]; total: number; hasMore: boolean } {
  const filtered = context.products.filter(p => 
    p.category === mainCategory && 
    p.categoryName === subCategory &&
    p.stock && p.stock > 0
  );
  
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const products = filtered.slice(start, end);
  
  return {
    products,
    total,
    hasMore: end < total
  };
}

/**
 * Detect what user wants based on message
 */
export function detectBrowseIntent(
  message: string,
  currentContext?: { mainCategory?: string; subCategory?: string; page?: number }
): {
  action: 'show_main_categories' | 'show_subcategories' | 'show_products' | 'next_page' | 'go_back' | 'go_home' | 'unknown';
  selectedCategory?: string;
  selectedSubCategory?: string;
  page?: number;
} {
  const normalized = message.toLowerCase().trim();
  
  // Navigation commands
  if (normalized.match(/\b(back|previous|return)\b/)) {
    return { action: 'go_back' };
  }
  
  if (normalized.match(/\b(main|menu|home|start|categories)\b/)) {
    return { action: 'go_home' };
  }
  
  if (normalized.match(/\b(more|next|show more)\b/)) {
    return { 
      action: 'next_page',
      page: (currentContext?.page || 1) + 1
    };
  }
  
  // Check if message matches a main category
  if (!currentContext?.mainCategory) {
    // Looking for main category selection
    // This will be handled by the webhook with actual context
    return { action: 'unknown' };
  } else if (!currentContext?.subCategory) {
    // Looking for sub-category selection
    // This will be handled by checking against actual sub-categories
    return {
      action: 'show_products',
      selectedSubCategory: normalized
    };
  }
  
  return { action: 'unknown' };
}

// ============================================================================
// RESPONSE GENERATORS
// ============================================================================

/**
 * Generate greeting message with main categories
 */
export function generateGreetingWithCategories(
  businessName: string,
  context: AIContext
): string {
  const mainCategories = getMainCategories(context);
  
  if (mainCategories.length === 0) {
    return `Welcome to ${businessName}! 🎉\n\nWe're currently updating our catalog. Please check back soon!`;
  }
  
  let response = `👋 Welcome to *${businessName}*!\n\n`;
  response += `What are you looking for today?\n\n`;
  response += `*BROWSE CATEGORIES:*\n\n`;
  
  mainCategories.forEach((cat, index) => {
    response += `${index + 1}. *${cat.name}* (${cat.count} products)\n`;
  });
  
  response += `\nReply with a category name or number to browse!`;
  response += `\n\n💡 Or ask me anything about our products, policies, or services.`;
  
  return response;
}

/**
 * Generate sub-categories list
 */
export function generateSubCategoriesList(
  mainCategory: string,
  mainCategoryName: string,
  context: AIContext
): string {
  const subCategories = getSubCategories(mainCategory, context);
  
  if (subCategories.length === 0) {
    return `Sorry, no products found in ${mainCategoryName}.`;
  }
  
  let response = `📂 *${mainCategoryName}*\n\n`;
  response += `Choose a sub-category:\n\n`;
  
  subCategories.forEach((subCat, index) => {
    response += `${index + 1}. *${subCat.name}* (${subCat.count} products)\n`;
  });
  
  response += `\nReply with a sub-category name or number.`;
  response += `\n\nType "back" to return to main categories.`;
  
  return response;
}

/**
 * Generate products list with order links
 */
export function generateProductsList(
  mainCategory: string,
  subCategory: string,
  context: AIContext,
  page: number = 1
): { response: string; hasMore: boolean } {
  const { products, total, hasMore } = getProductsBySubCategory(
    mainCategory,
    subCategory,
    context,
    page,
    5
  );
  
  if (products.length === 0) {
    return {
      response: `No products found in ${subCategory}.`,
      hasMore: false
    };
  }
  
  const startItem = (page - 1) * 5 + 1;
  const endItem = startItem + products.length - 1;
  
  let response = `🛍️ *${subCategory}* (${startItem}-${endItem} of ${total})\n\n`;
  
  products.forEach((product, index) => {
    const price = product.salePrice || product.price;
    const stockInfo = product.stock ? `(${product.stock} in stock)` : '';
    
    response += `*${index + 1}. ${product.name}*\n`;
    response += `💰 ${formatCurrency(price)} ${stockInfo}\n`;
    
    if (product.description) {
      response += `   ${product.description.substring(0, 100)}${product.description.length > 100 ? '...' : ''}\n`;
    }
    
    if (product.colors && product.colors.length > 0) {
      response += `   Colors: ${product.colors.join(', ')}\n`;
    }
    
    if (product.sizes && product.sizes.length > 0) {
      response += `   Sizes: ${product.sizes.join(', ')}\n`;
    }
    
    // Add order link
    if (product.orderLink) {
      response += `\n   🔗 Order: ${product.orderLink}\n`;
    }
    
    response += '\n';
  });
  
  if (hasMore) {
    response += `\nType *"more"* to see next 5 products.`;
  }
  
  response += `\n\nType "back" to return to ${mainCategory} categories.`;
  response += `\nType "main" to see all categories.`;
  
  return { response, hasMore };
}

/**
 * Format currency (simple version)
 */
function formatCurrency(amount: number): string {
  return `KES ${amount.toLocaleString()}`;
}
