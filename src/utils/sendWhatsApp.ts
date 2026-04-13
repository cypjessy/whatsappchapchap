export const sendEvolutionWhatsAppMessage = async (
  phone: string,
  message: string,
  tenantId: string
) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { app } = await import('@/lib/firebase');
    
    if (!app) {
      console.error("No Firebase app");
      return;
    }
    
    const { getFirestore } = await import('firebase/firestore');
    const db = getFirestore(app);
    
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    
    if (!tenantDoc.exists()) {
      console.error("Tenant not found:", tenantId);
      return;
    }
    
    const tenant = tenantDoc.data();
    
    // Send via n8n webhook
    await fetch('https://n8n-lfk9ps3h72dezxj6jwy4905s.173.249.50.98.sslip.io/webhook/order-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerPhone: phone,
        customerName: "Customer",
        message: message,
        tenantId: tenantId,
        evolutionServerUrl: tenant?.evolutionServerUrl,
        evolutionApiKey: tenant?.evolutionApiKey,
        evolutionInstanceId: tenant?.evolutionInstanceId
      })
    });
    
    console.log("WhatsApp notification sent via n8n");
    
  } catch (err) {
    console.error('sendEvolutionWhatsAppMessage error:', err);
  }
};