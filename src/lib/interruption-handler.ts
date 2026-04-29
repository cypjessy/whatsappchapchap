/**
 * Interruption Handler - Manages flow interruptions during order collection
 * 
 * Detects when users interrupt the order flow with questions, cancellations,
 * or change requests, and handles them appropriately without losing state.
 */

import { OrderState, AIContext } from "./ai-service";
import { getOrderState, saveOrderState, deleteOrderState, resetOrderState } from "./order-state-manager";

export type InterruptionType = 
  | 'continue_flow'      // Normal progression
  | 'ask_price'          // "How much is it?"
  | 'ask_product_info'   // "Tell me about this product"
  | 'ask_delivery'       // "How long does delivery take?"
  | 'ask_payment'        // "What payment methods?"
  | 'ask_policy'         // "What's your return policy?"
  | 'change_product'     // "I want a different product"
  | 'change_quantity'    // "Actually I want 3 instead"
  | 'change_delivery'    // "Can I change delivery method?"
  | 'cancel_order'       // "Cancel", "Never mind"
  | 'start_over'         // "Start over", "Reset"
  | 'help'               // "Help", "What do I do?"
  | 'unknown';           // Can't determine intent

/**
 * Detect the type of interruption in user message
 */
export function detectInterruption(
  message: string,
  currentStep: string
): InterruptionType {
  const normalized = message.toLowerCase().trim();
  
  // Cancellation (highest priority)
  if (normalized.match(/\b(cancel|never mind|stop order|dont want|don't want)\b/)) {
    return 'cancel_order';
  }
  
  // Start over
  if (normalized.match(/\b(start over|restart|reset|begin again)\b/)) {
    return 'start_over';
  }
  
  // Help
  if (normalized.match(/\b(help|what do i do|how does this work)\b/)) {
    return 'help';
  }
  
  // Change product
  if (normalized.match(/\b(different product|another product|change product|show me other|something else)\b/)) {
    return 'change_product';
  }
  
  // Change quantity
  if (normalized.match(/\b(change quantity|want \d+ instead|actually \d+)\b/)) {
    return 'change_quantity';
  }
  
  // Change delivery
  if (normalized.match(/\b(change delivery|different delivery|change address)\b/)) {
    return 'change_delivery';
  }
  
  // Price questions
  if (normalized.match(/\b(how much|price|cost|how expensive|afford)\b/)) {
    return 'ask_price';
  }
  
  // Product info questions
  if (normalized.match(/\b(tell me about|details|specifications|features|what is)\b/)) {
    return 'ask_product_info';
  }
  
  // Delivery questions
  if (normalized.match(/\b(delivery time|how long|shipping time|when will|arrive)\b/)) {
    return 'ask_delivery';
  }
  
  // Payment questions
  if (normalized.match(/\b(payment methods|how to pay|pay with|accept)\b/)) {
    return 'ask_payment';
  }
  
  // Policy questions
  if (normalized.match(/\b(return policy|warranty|refund|exchange|guarantee)\b/)) {
    return 'ask_policy';
  }
  
  // Default: assume continuing flow
  return 'continue_flow';
}

/**
 * Handle interruption and generate appropriate response
 */
export async function handleInterruption(
  tenantId: string,
  phone: string,
  interruption: InterruptionType,
  message: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  switch (interruption) {
    case 'cancel_order':
      return await handleCancellation(tenantId, phone, state);
      
    case 'start_over':
      return await handleStartOver(tenantId, phone, state, context);
      
    case 'help':
      return await handleHelp(state);
      
    case 'change_product':
      return await handleChangeProduct(tenantId, phone, state, context);
      
    case 'change_quantity':
      return await handleChangeQuantity(message, state);
      
    case 'change_delivery':
      return await handleChangeDelivery(tenantId, phone, state, context);
      
    case 'ask_price':
      return await handlePriceQuestion(state, context);
      
    case 'ask_product_info':
      return await handleProductInfoQuestion(message, state, context);
      
    case 'ask_delivery':
      return await handleDeliveryQuestion(context);
      
    case 'ask_payment':
      return await handlePaymentQuestion(context);
      
    case 'ask_policy':
      return await handlePolicyQuestion(message, context);
      
    case 'continue_flow':
    default:
      // Not an interruption - continue normal flow
      return {
        response: '',
        newState: state,
        shouldContinue: true
      };
  }
}

// ============================================================================
// INTERRUPTION HANDLERS
// ============================================================================

/**
 * Handle order cancellation
 */
async function handleCancellation(
  tenantId: string,
  phone: string,
  state: OrderState
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  await deleteOrderState(tenantId, phone);
  
  return {
    response: "✅ Order cancelled. How else can I help you?",
    newState: state,
    shouldContinue: false
  };
}

/**
 * Handle start over request
 */
async function handleStartOver(
  tenantId: string,
  phone: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  const newState = resetOrderState(state);
  await saveOrderState(tenantId, phone, newState);
  
  // Show products
  const inStockProducts = context.products.filter(p => p.stock && p.stock > 0);
  
  if (inStockProducts.length === 0) {
    return {
      response: "Sorry, we have no products in stock right now.",
      newState,
      shouldContinue: false
    };
  }
  
  let response = "Let's start fresh! 🛍️\n\n*AVAILABLE PRODUCTS*\n\n";
  
  inStockProducts.slice(0, 5).forEach((p, index) => {
    const price = p.salePrice || p.price;
    response += `${index + 1}. *${p.name}* - KES ${price.toLocaleString()}\n`;
  });
  
  if (inStockProducts.length > 5) {
    response += `\n...and ${inStockProducts.length - 5} more.\n`;
  }
  
  response += "\nWhich product would you like?";
  
  return {
    response,
    newState,
    shouldContinue: false
  };
}

/**
 * Handle help request
 */
async function handleHelp(
  state: OrderState
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  let response = "📖 *ORDER HELP*\n\n";
  
  switch (state.step) {
    case 'selecting_product':
      response += "To place an order:\n";
      response += "1. Choose a product from the list\n";
      response += "2. Select variant (if available)\n";
      response += "3. Enter quantity\n";
      response += "4. Provide your details\n";
      response += "5. Choose delivery method\n";
      response += "6. Select payment method\n";
      response += "7. Confirm order\n\n";
      response += "You can type 'cancel' anytime to cancel.";
      break;
      
    case 'collecting_quantity':
      response += "Please enter how many items you want.\n";
      response += "Example: Type '2' for two items.\n\n";
      response += `Current product: ${state.productName}`;
      break;
      
    case 'collecting_customer_name':
      response += "Please enter your full name.\n";
      response += "Example: John Doe";
      break;
      
    case 'collecting_customer_phone':
      response += "Please enter your phone number.\n";
      response += "Example: 0712345678 or +254712345678";
      break;
      
    case 'reviewing_order':
      response += "Review your order summary above.\n";
      response += "Type 'Yes' to confirm or 'No' to make changes.";
      break;
      
    default:
      response += "Follow the prompts to complete your order.\n";
      response += "Type 'cancel' to cancel at any time.";
  }
  
  return {
    response,
    newState: state,
    shouldContinue: false
  };
}

/**
 * Handle change product request
 */
async function handleChangeProduct(
  tenantId: string,
  phone: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  // Reset to product selection but keep customer info
  const newState: OrderState = {
    ...state,
    step: 'selecting_product',
    productId: undefined,
    productName: undefined,
    variantId: undefined,
    variantSpecs: undefined,
    quantity: undefined,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  const inStockProducts = context.products.filter(p => p.stock && p.stock > 0);
  
  let response = "No problem! Here are our products:\n\n";
  
  inStockProducts.slice(0, 5).forEach((p, index) => {
    const price = p.salePrice || p.price;
    response += `${index + 1}. *${p.name}* - KES ${price.toLocaleString()}\n`;
  });
  
  response += "\nWhich product would you like instead?";
  
  return {
    response,
    newState,
    shouldContinue: false
  };
}

/**
 * Handle change quantity request
 */
async function handleChangeQuantity(
  message: string,
  state: OrderState
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  // Extract new quantity from message
  const numberMatch = message.match(/\d+/);
  
  if (!numberMatch) {
    return {
      response: "Please specify the new quantity (e.g., 'I want 3').",
      newState: state,
      shouldContinue: false
    };
  }
  
  const newQuantity = parseInt(numberMatch[0]);
  
  if (newQuantity <= 0) {
    return {
      response: "Quantity must be at least 1.",
      newState: state,
      shouldContinue: false
    };
  }
  
  const newState: OrderState = {
    ...state,
    quantity: newQuantity,
    updatedAt: new Date()
  };
  
  return {
    response: `✅ Quantity updated to ${newQuantity}.\n\nLet's continue with your order.`,
    newState,
    shouldContinue: true
  };
}

/**
 * Handle change delivery request
 */
async function handleChangeDelivery(
  tenantId: string,
  phone: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  // Reset to delivery method selection
  const newState: OrderState = {
    ...state,
    step: 'selecting_delivery_method',
    deliveryMethod: undefined,
    deliveryCounty: undefined,
    deliveryStation: undefined,
    deliveryAddress: undefined,
    updatedAt: new Date()
  };
  
  await saveOrderState(tenantId, phone, newState);
  
  let response = "🚚 *DELIVERY OPTIONS*\n\n";
  response += "1. Pickup (Free)\n";
  
  if (context.shippingMethods) {
    context.shippingMethods.forEach((method, index) => {
      response += `${index + 2}. ${method.name} - KES ${method.price.toLocaleString()}\n`;
    });
  }
  
  response += "\nWhich delivery method would you prefer?";
  
  return {
    response,
    newState,
    shouldContinue: false
  };
}

/**
 * Handle price question
 */
async function handlePriceQuestion(
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  const product = context.products.find(p => p.id === state.productId);
  
  if (!product) {
    return {
      response: "I don't have pricing information for that product.",
      newState: state,
      shouldContinue: false
    };
  }
  
  const price = product.salePrice || product.price;
  const total = state.quantity ? state.quantity * price : price;
  
  let response = `💰 *PRICING*\n\n`;
  response += `*${product.name}*: KES ${price.toLocaleString()} each\n`;
  
  if (state.quantity) {
    response += `Quantity: ${state.quantity}\n`;
    response += `Total: KES ${total.toLocaleString()}\n`;
  }
  
  if (product.variants && product.variants.length > 0) {
    response += "\nVariant prices:\n";
    product.variants.forEach(v => {
      const specs = Object.entries(v.specs).map(([k, val]) => `${k}: ${val}`).join(', ');
      response += `- ${specs}: KES ${v.price.toLocaleString()}\n`;
    });
  }
  
  response += "\nShall we continue with your order?";
  
  return {
    response,
    newState: state,
    shouldContinue: false
  };
}

/**
 * Handle product info question
 */
async function handleProductInfoQuestion(
  message: string,
  state: OrderState,
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  const product = context.products.find(p => p.id === state.productId);
  
  if (!product) {
    return {
      response: "I don't have information about that product.",
      newState: state,
      shouldContinue: false
    };
  }
  
  let response = `📋 *${product.name}*\n\n`;
  
  if (product.description) {
    response += `${product.description}\n\n`;
  }
  
  if (product.brand) {
    response += `Brand: ${product.brand}\n`;
  }
  
  if (product.condition) {
    response += `Condition: ${product.condition}\n`;
  }
  
  if (product.colors && product.colors.length > 0) {
    response += `Colors: ${product.colors.join(', ')}\n`;
  }
  
  if (product.sizes && product.sizes.length > 0) {
    response += `Sizes: ${product.sizes.join(', ')}\n`;
  }
  
  if (product.warranty) {
    response += `Warranty: ${product.warranty}\n`;
  }
  
  response += `\nStock: ${product.stock || 0} available`;
  
  if (product.variants && product.variants.length > 0) {
    response += "\n\nVariants available.";
  }
  
  response += "\n\nShall we continue with your order?";
  
  return {
    response,
    newState: state,
    shouldContinue: false
  };
}

/**
 * Handle delivery question
 */
async function handleDeliveryQuestion(
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  let response = "🚚 *DELIVERY INFORMATION*\n\n";
  
  if (context.shippingMethods && context.shippingMethods.length > 0) {
    response += "Available shipping methods:\n\n";
    
    context.shippingMethods.forEach(method => {
      response += `*${method.name}*\n`;
      response += `Cost: KES ${method.price.toLocaleString()}\n`;
      if (method.estimatedDays) {
        response += `Time: ${method.estimatedDays}\n`;
      }
      if (method.description) {
        response += `${method.description}\n`;
      }
      response += '\n';
    });
  } else {
    response += "We offer pickup from our stations.\n";
  }
  
  response += "\nShall we continue with your order?";
  
  // Create a dummy state since we don't have one
  const dummyState: OrderState = {
    step: 'idle',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date()
  };
  
  return {
    response,
    newState: dummyState,
    shouldContinue: false
  };
}

/**
 * Handle payment question
 */
async function handlePaymentQuestion(
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  let response = "💳 *PAYMENT METHODS*\n\n";
  
  const paymentMethods = context.paymentMethods;
  
  if (!paymentMethods) {
    response += "Payment methods not configured. Please contact support.";
    
    const dummyState: OrderState = {
      step: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date()
    };
    
    return {
      response,
      newState: dummyState,
      shouldContinue: false
    };
  }
  
  if (paymentMethods.mpesa?.enabled) {
    response += "*M-Pesa*\n";
    if (paymentMethods.mpesa.phoneNumber) {
      response += `Pay to: ${paymentMethods.mpesa.phoneNumber}\n`;
    }
    if (paymentMethods.mpesa.businessName) {
      response += `Business: ${paymentMethods.mpesa.businessName}\n`;
    }
    response += '\n';
  }
  
  if (paymentMethods.bank?.enabled) {
    response += "*Bank Transfer*\n";
    if (paymentMethods.bank.bankName) {
      response += `Bank: ${paymentMethods.bank.bankName}\n`;
    }
    if (paymentMethods.bank.accountNumber) {
      response += `Account: ${paymentMethods.bank.accountNumber}\n`;
    }
    response += '\n';
  }
  
  if (paymentMethods.cash?.enabled) {
    response += "*Cash on Delivery*\n";
    if (paymentMethods.cash.instructions) {
      response += `${paymentMethods.cash.instructions}\n`;
    }
    response += '\n';
  }
  
  response += "\nShall we continue with your order?";
  
  const dummyState: OrderState = {
    step: 'idle',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date()
  };
  
  return {
    response,
    newState: dummyState,
    shouldContinue: false
  };
}

/**
 * Handle policy question
 */
async function handlePolicyQuestion(
  message: string,
  context: AIContext
): Promise<{ response: string; newState: OrderState; shouldContinue: boolean }> {
  const normalized = message.toLowerCase();
  
  let response = "📜 *POLICY INFORMATION*\n\n";
  
  if (normalized.includes('return') || normalized.includes('refund')) {
    const returnPolicy = context.productSettings?.returnPolicy || "Please contact us for return policy details.";
    response += `*Return Policy*\n${returnPolicy}\n\n`;
  }
  
  if (normalized.includes('warranty')) {
    const warrantyInfo = context.productSettings?.warrantyInfo || "Please contact us for warranty details.";
    response += `*Warranty*\n${warrantyInfo}\n\n`;
  }
  
  if (normalized.includes('cancel') || normalized.includes('booking')) {
    const cancellationPolicy = context.serviceSettings?.cancellationPolicy || "Please contact us for cancellation policy.";
    response += `*Cancellation Policy*\n${cancellationPolicy}\n\n`;
  }
  
  response += "\nShall we continue with your order?";
  
  const dummyState: OrderState = {
    step: 'idle',
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date()
  };
  
  return {
    response,
    newState: dummyState,
    shouldContinue: false
  };
}
