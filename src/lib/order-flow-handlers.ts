/**
 * Order Flow Handlers - Deterministic step-by-step order collection
 * 
 * Each handler processes user input for a specific order step,
 * validates the input, updates state, and returns a deterministic response.
 * NO AI is used for order flow responses - everything is programmatically generated.
 */

import { OrderState, OrderStep, AIContext } from "./ai-service";
import { saveOrderState, advanceOrderStep, deleteOrderState } from "./order-state-manager";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find product by name or ID
 */
function findProduct(message: string, context: AIContext) {
  const normalized = message.toLowerCase().trim();
  
  // Try exact ID match first
  const byId = context.products.find(p => p.id === normalized);
  if (byId) return byId;
  
  // Try exact name match
  const byName = context.products.find(p => 
    p.name.toLowerCase() === normalized
  );
  if (byName) return byName;
  
  // Try partial name match
  const byPartial = context.products.find(p => 
    p.name.toLowerCase().includes(normalized) ||
    normalized.includes(p.name.toLowerCase())
  );
  if (byPartial) return byPartial;
  
  // Try number selection (e.g., "1", "2")
  const numberMatch = normalized.match(/^\d+$/);
  if (numberMatch) {
    const index = parseInt(numberMatch[0]) - 1;
    if (index >= 0 && index < context.products.length) {
      return context.products[index];
    }
  }
  
  return null;
}

/**
 * Parse quantity from message
 */
function parseQuantity(message: string): number | null {
  const normalized = message.toLowerCase().trim();
  
  // Direct number
  const numberMatch = normalized.match(/\d+/);
  if (numberMatch) {
    const qty = parseInt(numberMatch[0]);
    if (qty > 0 && qty <= 100) return qty;
  }
  
  // Word-based quantities
  const wordQuantities: Record<string, number> = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'couple': 2, 'few': 3, 'several': 5, 'dozen': 12
  };
  
  for (const [word, qty] of Object.entries(wordQuantities)) {
    if (normalized.includes(word)) return qty;
  }
  
  return null;
}

/**
 * Validate Kenyan phone number
 */
function validatePhone(phone: string): { valid: boolean; error?: string; cleaned?: string } {
  const cleaned = phone.replace(/\s/g, '').replace(/^\+/, '');
  
  // Kenyan format: 07XX XXX XXX or 2547XX XXX XXX or +2547XX XXX XXX
  const kenyanRegex = /^(0|254|\+254)?[7]\d{8}$/;
  
  if (!kenyanRegex.test(cleaned)) {
    return {
      valid: false,
      error: "Please enter a valid Kenyan phone number (e.g., 0712345678 or +254712345678)"
    };
  }
  
  // Normalize to 254 format
  let normalized = cleaned;
  if (normalized.startsWith('0')) {
    normalized = '254' + normalized.substring(1);
  } else if (normalized.startsWith('+')) {
    normalized = normalized.substring(1);
  }
  
  return { valid: true, cleaned: normalized };
}

/**
 * Validate email address
 */
function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Please enter a valid email address (e.g., john@example.com)" };
  }
  
  return { valid: true };
}

/**
 * Get product price (sale price if available)
 */
function getProductPrice(productId: string, context: AIContext): number {
  const product = context.products.find(p => p.id === productId);
  return product?.salePrice || product?.price || 0;
}

// ============================================================================
// STEP HANDLERS
// ============================================================================

/**
 * STEP 1: Product Selection
 */
export async function handleProductSelection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  // Check for cancel
  if (message.toLowerCase().match(/cancel|never mind|stop/)) {
    return {
      response: "No problem! Your order has been cancelled. How else can I help you?",
      newState: state
    };
  }
  
  const product = findProduct(message, context);
  
  if (!product) {
    // Show product list
    const inStockProducts = context.products.filter(p => p.stock && p.stock > 0);
    
    if (inStockProducts.length === 0) {
      return {
        response: "Sorry, we currently have no products in stock. Please check back later!",
        newState: state
      };
    }
    
    let response = "🛍️ *AVAILABLE PRODUCTS*\n\n";
    
    inStockProducts.slice(0, 5).forEach((p, index) => {
      const price = p.salePrice || p.price;
      response += `${index + 1}. *${p.name}* - KES ${price.toLocaleString()}\n`;
      if (p.description) {
        response += `   ${p.description.substring(0, 80)}...\n`;
      }
      response += '\n';
    });
    
    if (inStockProducts.length > 5) {
      response += `\n...and ${inStockProducts.length - 5} more products.\n\n`;
    }
    
    response += "Which product would you like to order? (Type the name or number)";
    
    return { response, newState: state };
  }
  
  // Product found - save it
  const newState = {
    ...state,
    productId: product.id,
    productName: product.name,
    updatedAt: new Date()
  };
  
  // Check if product has variants
  if (product.variants && product.variants.length > 0) {
    await saveOrderState(tenantId, phone, newState);
    
    let response = `✅ *${product.name}* selected!\n\n`;
    response += "Available variants:\n";
    
    product.variants.forEach((variant, index) => {
      const specs = Object.entries(variant.specs)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
      response += `${index + 1}. ${specs} - KES ${variant.price.toLocaleString()} (${variant.stock} in stock)\n`;
    });
    
    response += "\nWhich variant would you like? (Type the number or specifications)";
    
    return {
      response,
      newState: advanceOrderStep(newState, 'selecting_variant')
    };
  }
  
  // No variants - move to quantity
  await saveOrderState(tenantId, phone, newState);
  
  const price = product.salePrice || product.price;
  const response = `✅ *${product.name}* selected!\n\nPrice: KES ${price.toLocaleString()}\n\nHow many would you like?`;
  
  return {
    response,
    newState: advanceOrderStep(newState, 'collecting_quantity')
  };
}

/**
 * STEP 2: Variant Selection
 */
export async function handleVariantSelection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const product = context.products.find(p => p.id === state.productId);
  
  if (!product || !product.variants) {
    return {
      response: "Something went wrong. Let's start over.",
      newState: state
    };
  }
  
  // Try to match variant by number
  const numberMatch = message.toLowerCase().trim().match(/^\d+$/);
  if (numberMatch) {
    const index = parseInt(numberMatch[0]) - 1;
    if (index >= 0 && index < product.variants.length) {
      const variant = product.variants[index];
      
      const newState = {
        ...state,
        variantId: variant.id,
        variantSpecs: variant.specs,
        updatedAt: new Date()
      };
      
      await saveOrderState(tenantId, phone, newState);
      
      const response = `✅ Variant selected!\n\nHow many would you like?`;
      
      return {
        response,
        newState: advanceOrderStep(newState, 'collecting_quantity')
      };
    }
  }
  
  // Try to match by specs (simplified - just take first matching variant)
  const matchedVariant = product.variants.find(v => {
    const specValues = Object.values(v.specs).map(s => s.toLowerCase());
    const messageWords = message.toLowerCase().split(' ');
    return messageWords.some(word => specValues.some(spec => spec.includes(word)));
  });
  
  if (matchedVariant) {
    const newState = {
      ...state,
      variantId: matchedVariant.id,
      variantSpecs: matchedVariant.specs,
      updatedAt: new Date()
    };
    
    await saveOrderState(tenantId, phone, newState);
    
    const response = `✅ Variant selected!\n\nHow many would you like?`;
    
    return {
      response,
      newState: advanceOrderStep(newState, 'collecting_quantity')
    };
  }
  
  // No match - show variants again
  let response = "I didn't understand that. Available variants:\n\n";
  
  product.variants.forEach((variant, index) => {
    const specs = Object.entries(variant.specs)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
    response += `${index + 1}. ${specs} - KES ${variant.price.toLocaleString()}\n`;
  });
  
  response += "\nWhich variant would you like? (Type the number)";
  
  return { response, newState: state };
}

/**
 * STEP 3: Quantity Collection
 */
export async function handleQuantityCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const quantity = parseQuantity(message);
  
  if (!quantity || quantity <= 0) {
    return {
      response: "Please enter a valid number (e.g., 1, 2, 3).\n\nHow many would you like?",
      newState: state
    };
  }
  
  // Check stock
  const product = context.products.find(p => p.id === state.productId);
  if (!product) {
    return {
      response: "Product not found. Let's start over.",
      newState: state
    };
  }
  
  const maxStock = product.stock || 0;
  if (quantity > maxStock) {
    return {
      response: `Sorry, we only have ${maxStock} in stock. How many would you like?`,
      newState: state
    };
  }
  
  const newState = {
    ...state,
    quantity,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  const total = quantity * (product.salePrice || product.price);
  const response = `Great! 🎉\n\n*${product.name}* x ${quantity} = KES ${total.toLocaleString()}\n\nWhat's your full name?`;
  
  return {
    response,
    newState: advanceOrderStep(newState, 'collecting_customer_name')
  };
}

/**
 * STEP 4a: Customer Name Collection
 */
export async function handleCustomerNameCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const name = message.trim();
  
  if (name.length < 2) {
    return {
      response: "Please provide your full name.",
      newState: state
    };
  }
  
  const newState = {
    ...state,
    customerName: name,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  const response = `Thanks ${name}! 📱 What's your phone number?`;
  
  return {
    response,
    newState: advanceOrderStep(newState, 'collecting_customer_phone')
  };
}

/**
 * STEP 4b: Customer Phone Collection
 */
export async function handleCustomerPhoneCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const validation = validatePhone(message);
  
  if (!validation.valid) {
    return {
      response: validation.error!,
      newState: state
    };
  }
  
  const newState = {
    ...state,
    customerPhone: validation.cleaned!,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  const response = `Perfect! 📧 What's your email address? (Type 'skip' if you don't want to provide)`;
  
  return {
    response,
    newState: advanceOrderStep(newState, 'collecting_customer_email')
  };
}

/**
 * STEP 4c: Customer Email Collection
 */
export async function handleCustomerEmailCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const normalized = message.toLowerCase().trim();
  
  if (normalized === 'skip' || normalized === 'none') {
    const newState = {
      ...state,
      customerEmail: 'skipped',
      updatedAt: new Date()
    };
    
    await saveOrderState(tenantId, phone, newState);
    
    return await moveToDeliverySelection(tenantId, phone, newState, context);
  }
  
  const validation = validateEmail(message);
  
  if (!validation.valid) {
    return {
      response: validation.error! + "\n\nOr type 'skip' to continue without email.",
      newState: state
    };
  }
  
  const newState = {
    ...state,
    customerEmail: message.trim(),
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  return await moveToDeliverySelection(tenantId, phone, newState, context);
}

/**
 * Helper: Move to delivery selection
 */
async function moveToDeliverySelection(
  tenantId: string,
  phone: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const hasShipping = context.shippingMethods && context.shippingMethods.length > 0;
  
  if (!hasShipping) {
    // Only pickup available
    const newState: OrderState = {
      ...state,
      deliveryMethod: 'pickup',
      updatedAt: new Date()
    };
    
    await saveOrderState(tenantId, phone, newState);
    
    const response = "📍 Which pickup station would you prefer?";
    
    return {
      response,
      newState: advanceOrderStep(newState, 'collecting_delivery_station')
    };
  }
  
  // Show delivery options
  let response = "🚚 *DELIVERY OPTIONS*\n\n";
  response += "1. Pickup (Free)\n";
  
  context.shippingMethods!.forEach((method, index) => {
    response += `${index + 2}. ${method.name} - KES ${method.price.toLocaleString()}`;
    if (method.estimatedDays) {
      response += ` (${method.estimatedDays})`;
    }
    response += "\n";
  });
  
  response += "\nWhich delivery method would you prefer? (Type the number or name)";
  
  const newState = advanceOrderStep(state, 'selecting_delivery_method');
  await saveOrderState(tenantId, phone, newState);
  
  return { response, newState };
}

/**
 * STEP 5: Delivery Method Selection
 */
export async function handleDeliveryMethodSelection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const normalized = message.toLowerCase().trim();
  
  // Check for pickup
  if (normalized.includes('pickup') || normalized === '1') {
    const newState: OrderState = {
      ...state,
      deliveryMethod: 'pickup',
      updatedAt: new Date()
    };
    
    await saveOrderState(tenantId, phone, newState);
    
    const response = "📍 Which pickup station would you prefer?";
    
    return {
      response,
      newState: advanceOrderStep(newState, 'collecting_delivery_station')
    };
  }
  
  // Check for shipping method by number
  const numberMatch = normalized.match(/^\d+$/);
  if (numberMatch && context.shippingMethods) {
    const index = parseInt(numberMatch[0]) - 2; // Subtract 2 because pickup is #1
    if (index >= 0 && index < context.shippingMethods.length) {
      const method = context.shippingMethods[index];
      
      const newState: OrderState = {
        ...state,
        deliveryMethod: 'shipping',
        updatedAt: new Date()
      };
      
      await saveOrderState(tenantId, phone, newState);
      
      const response = `✅ ${method.name} selected (KES ${method.price.toLocaleString()})\n\nWhich county are you in?`;
      
      return {
        response,
        newState: advanceOrderStep(newState, 'collecting_delivery_county')
      };
    }
  }
  
  // No match - show options again
  let response = "I didn't understand that. Available delivery options:\n\n";
  response += "1. Pickup (Free)\n";
  
  if (context.shippingMethods) {
    context.shippingMethods.forEach((method, index) => {
      response += `${index + 2}. ${method.name} - KES ${method.price.toLocaleString()}\n`;
    });
  }
  
  response += "\nWhich delivery method would you prefer? (Type the number or name)";
  
  return { response, newState: state };
}

/**
 * STEP 6a: Delivery County Collection
 */
export async function handleDeliveryCountyCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const county = message.trim();
  
  if (county.length < 2) {
    return {
      response: "Please enter a valid county name.",
      newState: state
    };
  }
  
  const newState: OrderState = {
    ...state,
    deliveryCounty: county,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  const response = `🏪 Which pickup station or town in ${county}?`;
  
  return {
    response,
    newState: advanceOrderStep(newState, 'collecting_delivery_station')
  };
}

/**
 * STEP 6b: Delivery Station Collection
 */
export async function handleDeliveryStationCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const station = message.trim();
  
  if (station.length < 2) {
    return {
      response: "Please enter a valid station/town name.",
      newState: state
    };
  }
  
  const newState: OrderState = {
    ...state,
    deliveryStation: station,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  if (state.deliveryMethod === 'pickup') {
    // Move to payment
    return await moveToPaymentSelection(tenantId, phone, newState, context);
  }
  
  // Shipping - need full address
  const response = `📍 What's your full delivery address in ${station}, ${state.deliveryCounty}?`;
  
  return {
    response,
    newState: advanceOrderStep(newState, 'collecting_delivery_address')
  };
}

/**
 * STEP 6c: Delivery Address Collection
 */
export async function handleDeliveryAddressCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const address = message.trim();
  
  if (address.length < 5) {
    return {
      response: "Please provide a complete delivery address (building, street, landmarks).",
      newState: state
    };
  }
  
  const newState: OrderState = {
    ...state,
    deliveryAddress: address,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  return await moveToPaymentSelection(tenantId, phone, newState, context);
}

/**
 * Helper: Move to payment selection
 */
async function moveToPaymentSelection(
  tenantId: string,
  phone: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const paymentMethods = context.paymentMethods;
  
  if (!paymentMethods) {
    // Default to M-Pesa
    const newState: OrderState = {
      ...state,
      paymentMethod: 'mpesa',
      updatedAt: new Date()
    };
    
    await saveOrderState(tenantId, phone, newState);
    
    const response = `💳 Please send payment to M-Pesa\n\nAfter sending, type the transaction code or type 'done' when ready.`;
    
    return {
      response,
      newState: advanceOrderStep(newState, 'collecting_payment_details')
    };
  }
  
  // Show available payment methods
  let response = "💳 *PAYMENT METHODS*\n\n";
  
  const methods = [];
  if (paymentMethods.mpesa?.enabled) methods.push("1. M-Pesa");
  if (paymentMethods.bank?.enabled) methods.push("2. Bank Transfer");
  if (paymentMethods.card?.enabled) methods.push("3. Card Payment");
  if (paymentMethods.cash?.enabled) methods.push("4. Cash on Delivery");
  
  response += methods.join('\n');
  response += "\n\nWhich payment method would you like to use? (Type the number)";
  
  const newState = advanceOrderStep(state, 'selecting_payment_method');
  await saveOrderState(tenantId, phone, newState);
  
  return { response, newState };
}

/**
 * STEP 7: Payment Method Selection
 */
export async function handlePaymentMethodSelection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const normalized = message.toLowerCase().trim();
  const paymentMethods = context.paymentMethods;
  
  if (!paymentMethods) {
    return {
      response: "Payment methods not configured. Please contact support.",
      newState: state
    };
  }
  
  // Determine selected method
  let selectedMethod: 'mpesa' | 'bank' | 'cash' | 'card' | null = null;
  
  if ((normalized.includes('mpesa') || normalized === '1') && paymentMethods.mpesa?.enabled) {
    selectedMethod = 'mpesa';
  } else if ((normalized.includes('bank') || normalized === '2') && paymentMethods.bank?.enabled) {
    selectedMethod = 'bank';
  } else if ((normalized.includes('card') || normalized === '3') && paymentMethods.card?.enabled) {
    selectedMethod = 'card';
  } else if ((normalized.includes('cash') || normalized === '4') && paymentMethods.cash?.enabled) {
    selectedMethod = 'cash';
  }
  
  if (!selectedMethod) {
    return {
      response: "Please select a valid payment method (type the number).",
      newState: state
    };
  }
  
  const newState: OrderState = {
    ...state,
    paymentMethod: selectedMethod,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  // Generate payment instructions based on method
  let response = "";
  
  switch (selectedMethod) {
    case 'mpesa':
      const mpesaNumber = paymentMethods.mpesa?.phoneNumber || 'N/A';
      response = `📱 *M-PESA PAYMENT*\n\nSend payment to: *${mpesaNumber}*\n\nAfter sending, please provide the M-Pesa transaction code.`;
      break;
      
    case 'bank':
      const bankName = paymentMethods.bank?.bankName || 'N/A';
      const accountNumber = paymentMethods.bank?.accountNumber || 'N/A';
      response = `🏦 *BANK TRANSFER*\n\nBank: ${bankName}\nAccount: ${accountNumber}\n\nAfter transferring, please provide the transaction reference.`;
      break;
      
    case 'card':
      response = `💳 *CARD PAYMENT*\n\nYou'll receive a secure payment link after confirming your order.`;
      break;
      
    case 'cash':
      response = `💵 *CASH ON DELIVERY*\n\nYou'll pay when you receive your order.\n\nAny special instructions for delivery? (Type 'skip' if none)`;
      break;
  }
  
  if (selectedMethod !== 'cash') {
    response += "\n\nAfter payment, type the transaction code or type 'done' when ready.";
  }
  
  return {
    response,
    newState: advanceOrderStep(newState, 'collecting_payment_details')
  };
}

/**
 * STEP 8: Payment Details Collection
 */
export async function handlePaymentDetailsCollection(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const normalized = message.toLowerCase().trim();
  
  // For cash on delivery, this step collects order notes
  if (state.paymentMethod === 'cash') {
    if (normalized === 'skip' || normalized === 'none') {
      const newState: OrderState = {
        ...state,
        paymentDetails: 'Cash on delivery',
        updatedAt: new Date()
      };
      
      await saveOrderState(tenantId, phone, newState);
      
      return await generateOrderReview(tenantId, phone, newState, context);
    }
    
    const newState: OrderState = {
      ...state,
      paymentDetails: 'Cash on delivery',
      orderNotes: message.trim(),
      updatedAt: new Date()
    };
    
    await saveOrderState(tenantId, phone, newState);
    
    return await generateOrderReview(tenantId, phone, newState, context);
  }
  
  // For other payment methods, collect transaction code
  if (normalized === 'done' || normalized === 'paid') {
    const newState: OrderState = {
      ...state,
      paymentDetails: 'Payment confirmed',
      updatedAt: new Date()
    };
    
    await saveOrderState(tenantId, phone, newState);
    
    return await generateOrderReview(tenantId, phone, newState, context);
  }
  
  // Save transaction code
  const newState: OrderState = {
    ...state,
    paymentDetails: message.trim(),
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  return await generateOrderReview(tenantId, phone, newState, context);
}

/**
 * STEP 9 & 10: Order Review Generation
 */
async function generateOrderReview(
  tenantId: string,
  phone: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const product = context.products.find(p => p.id === state.productId);
  const price = product?.salePrice || product?.price || 0;
  const total = (state.quantity || 0) * price;
  
  let response = "📋 *ORDER SUMMARY*\n\n";
  response += `🛍️ Product: ${state.productName}\n`;
  
  if (state.variantSpecs) {
    const specs = Object.entries(state.variantSpecs)
      .map(([key, val]) => `${key}: ${val}`)
      .join(', ');
    response += `   Variant: ${specs}\n`;
  }
  
  response += `📦 Quantity: ${state.quantity}\n`;
  response += `💰 Price: KES ${total.toLocaleString()}\n\n`;
  
  response += `👤 Name: ${state.customerName}\n`;
  response += `📱 Phone: ${state.customerPhone}\n`;
  
  if (state.customerEmail && state.customerEmail !== 'skipped') {
    response += `📧 Email: ${state.customerEmail}\n`;
  }
  
  response += `\n🚚 Delivery: ${state.deliveryMethod === 'pickup' ? 'Pickup' : 'Shipping'}\n`;
  
  if (state.deliveryMethod === 'pickup') {
    response += `📍 Station: ${state.deliveryStation}\n`;
  } else {
    response += `📍 County: ${state.deliveryCounty}\n`;
    response += `🏪 Town: ${state.deliveryStation}\n`;
    if (state.deliveryAddress) {
      response += `📮 Address: ${state.deliveryAddress}\n`;
    }
  }
  
  response += `\n💳 Payment: ${state.paymentMethod?.toUpperCase()}\n`;
  
  if (state.paymentDetails) {
    response += `   Details: ${state.paymentDetails}\n`;
  }
  
  if (state.orderNotes) {
    response += `\n📝 Notes: ${state.orderNotes}\n`;
  }
  
  response += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  response += `*TOTAL: KES ${total.toLocaleString()}*\n`;
  response += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  response += `Is everything correct? Reply "Yes" to confirm or "No" to make changes.`;
  
  const newState: OrderState = {
    ...state,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  return {
    response,
    newState: advanceOrderStep(newState, 'reviewing_order')
  };
}

/**
 * STEP 11: Order Review Confirmation
 */
export async function handleOrderReview(
  tenantId: string,
  phone: string,
  state: OrderState,
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState }> {
  const normalized = message.toLowerCase().trim();
  
  if (normalized === 'yes' || normalized === 'confirm' || normalized === 'ok') {
    // Order confirmed!
    const product = context.products.find(p => p.id === state.productId);
    const orderLink = product?.orderLink || '';
    
    const newState: OrderState = {
      ...state,
      step: 'completed',
      updatedAt: new Date()
    };
    
    // In production, you'd create an order record in database here
    await deleteOrderState(tenantId, phone); // Clear order state
    
    let response = "✅ *ORDER CONFIRMED!*\n\n";
    response += `Thank you ${state.customerName}! Your order has been placed.\n\n`;
    
    if (orderLink) {
      response += `🔗 Complete your order here: ${orderLink}\n\n`;
    }
    
    response += "We'll contact you shortly to confirm delivery.\n\n";
    response += "Thank you for shopping with us! 🙏";
    
    return { response, newState };
  }
  
  if (normalized === 'no' || normalized === 'change') {
    return {
      response: "What would you like to change? You can say:\n- 'Change product'\n- 'Change quantity'\n- 'Change delivery'\n- 'Cancel order'",
      newState: state
    };
  }
  
  // Unclear response - show summary again
  return await generateOrderReview(tenantId, phone, state, context);
}
