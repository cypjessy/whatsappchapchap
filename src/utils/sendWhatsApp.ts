/**
 * Send WhatsApp message via server-side API route
 * Passes tenant's Evolution credentials to avoid Firebase Admin SDK requirement
 */
export const sendEvolutionWhatsAppMessage = async (
  phone: string,
  message: string,
  tenantId: string
): Promise<void> => {
  try {
    // Get tenant's Evolution credentials from Firestore
    const { doc, getDoc } = await import('firebase/firestore');
    const { app } = await import('@/lib/firebase');
    
    if (!app) {
      console.error("No Firebase app");
      throw new Error("Firebase not initialized");
    }
    
    const { getFirestore } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    
    let evolutionConfig = null;
    
    if (tenantDoc.exists()) {
      const tenant = tenantDoc.data();
      if (tenant.evolutionServerUrl && tenant.evolutionApiKey && tenant.evolutionInstanceId) {
        evolutionConfig = {
          evolutionServerUrl: tenant.evolutionServerUrl,
          evolutionApiKey: tenant.evolutionApiKey,
          evolutionInstanceId: tenant.evolutionInstanceId
        };
      }
    }
    
    // Call our Next.js API route (runs server-side)
    const requestBody: any = { phone, message, tenantId };
    if (evolutionConfig) {
      requestBody.evolutionConfig = evolutionConfig;
    }
    
    const response = await fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error("❌ WhatsApp API error:", error);
      throw new Error(`Failed to send WhatsApp: ${JSON.stringify(error)}`);
    }
    
    const result = await response.json();
    console.log("✅ WhatsApp sent successfully via server-side API");
    
  } catch (err) {
    console.error("sendEvolutionWhatsAppMessage error:", err);
    // Fallback: Open WhatsApp Web with message
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    console.log("Opened WhatsApp Web (fallback after error)");
  }
};