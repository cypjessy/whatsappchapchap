/**
 * Order State Manager - Database operations for order state persistence
 * 
 * This module handles saving, loading, and managing order states in Firestore.
 * Orders are stored per phone number and auto-expire after 30 minutes.
 */

import { getFirestore } from "firebase-admin/firestore";
import { OrderState, OrderStep } from "./ai-service";

const ORDER_EXPIRY_MINUTES = 30;

/**
 * Get the current order state for a phone number
 */
export async function getOrderState(
  tenantId: string,
  phone: string
): Promise<OrderState | null> {
  try {
    const db = getFirestore();
    const docRef = db
      .collection("tenants")
      .doc(tenantId)
      .collection("orders")
      .doc(phone);

    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data() as OrderState;

    // Check if order has expired
    if (new Date(data.expiresAt) < new Date()) {
      console.log(`[Order State] Order expired for ${phone}, deleting`);
      await docRef.delete();
      return null;
    }

    return data;
  } catch (error) {
    console.error("[Order State] Error getting order state:", error);
    return null;
  }
}

/**
 * Save or update order state
 */
export async function saveOrderState(
  tenantId: string,
  phone: string,
  state: OrderState
): Promise<void> {
  try {
    const db = getFirestore();
    const docRef = db
      .collection("tenants")
      .doc(tenantId)
      .collection("orders")
      .doc(phone);

    await docRef.set(state, { merge: true });
    console.log(`[Order State] Saved state for ${phone}: step=${state.step}`);
  } catch (error) {
    console.error("[Order State] Error saving order state:", error);
    throw error;
  }
}

/**
 * Delete order state (for cancellation or completion)
 */
export async function deleteOrderState(
  tenantId: string,
  phone: string
): Promise<void> {
  try {
    const db = getFirestore();
    const docRef = db
      .collection("tenants")
      .doc(tenantId)
      .collection("orders")
      .doc(phone);

    await docRef.delete();
    console.log(`[Order State] Deleted order for ${phone}`);
  } catch (error) {
    console.error("[Order State] Error deleting order state:", error);
    throw error;
  }
}

/**
 * Create a new order state (starting fresh order)
 */
export function createNewOrderState(): OrderState {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000);

  return {
    step: 'selecting_product',
    createdAt: now,
    updatedAt: now,
    expiresAt: expiresAt,
  };
}

/**
 * Reset order state to beginning (for restart)
 */
export function resetOrderState(existingState: OrderState): OrderState {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ORDER_EXPIRY_MINUTES * 60 * 1000);

  return {
    step: 'selecting_product',
    createdAt: existingState.createdAt,
    updatedAt: now,
    expiresAt: expiresAt,
  };
}

/**
 * Update the step and timestamp
 */
export function advanceOrderStep(
  state: OrderState,
  newStep: OrderStep
): OrderState {
  return {
    ...state,
    step: newStep,
    updatedAt: new Date(),
  };
}
