import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

// Webhook error logger - saves errors to Firestore for viewing in app
export async function logWebhookError(
  tenantId: string,
  errorType: string,
  errorMessage: string,
  errorStack?: string,
  context?: Record<string, any>
) {
  try {
    // We need to use admin SDK or a service account for this
    // For now, we'll use fetch to write directly to Firestore REST API
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    if (!projectId || !apiKey) {
      console.error("[Webhook Logger] Missing Firebase credentials");
      return;
    }
    
    const errorDoc = {
      tenantId,
      errorType,
      errorMessage,
      errorStack: errorStack || "",
      context: context || {},
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    
    // Use Firestore REST API to log error
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/webhookErrors?key=${apiKey}`;
    
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          tenantId: { stringValue: tenantId },
          errorType: { stringValue: errorType },
          errorMessage: { stringValue: errorMessage },
          errorStack: { stringValue: errorStack || "" },
          context: { 
            mapValue: { 
              fields: Object.entries(context || {}).reduce((acc, [key, value]) => {
                acc[key] = { stringValue: String(value) };
                return acc;
              }, {} as Record<string, any>)
            } 
          },
          timestamp: { stringValue: new Date().toISOString() },
          resolved: { booleanValue: false },
        },
      }),
    });
    
    console.log("[Webhook Logger] Error logged to Firestore");
  } catch (logError) {
    console.error("[Webhook Logger] Failed to log error:", logError);
  }
}

// Log successful webhook processing
export async function logWebhookSuccess(
  tenantId: string,
  phone: string,
  message: string,
  processingTimeMs: number
) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    
    if (!projectId || !apiKey) return;
    
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/webhookLogs?key=${apiKey}`;
    
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          tenantId: { stringValue: tenantId },
          phone: { stringValue: phone },
          message: { stringValue: message.substring(0, 200) },
          processingTimeMs: { integerValue: processingTimeMs.toString() },
          status: { stringValue: "success" },
          timestamp: { stringValue: new Date().toISOString() },
        },
      }),
    });
  } catch (error) {
    console.error("[Webhook Logger] Failed to log success:", error);
  }
}
