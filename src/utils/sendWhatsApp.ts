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
    
    // Check if Evolution API is configured
    if (!tenant.evolutionServerUrl || !tenant.evolutionApiKey || !tenant.evolutionInstanceId) {
      console.error("Evolution API not configured for tenant:", tenantId);
      // Fallback: Open WhatsApp Web with message
      const cleanPhone = phone.replace(/[^0-9]/g, "");
      const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
      const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank');
      console.log("Opened WhatsApp Web (Evolution not configured)");
      return;
    }
    
    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    
    // Send via Evolution API directly
    const evolutionUrl = `${tenant.evolutionServerUrl}/message/sendText/${tenant.evolutionInstanceId}`;
    
    const response = await fetch(evolutionUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'apikey': tenant.evolutionApiKey
      },
      body: JSON.stringify({
        number: fullPhone,
        text: message
      })
    });
    
    if (response.ok) {
      console.log("✅ WhatsApp sent via Evolution API");
      return;
    } else {
      const errorData = await response.json().catch(() => null);
      console.error("❌ Evolution API error:", response.status, errorData);
      throw new Error(`Evolution API returned ${response.status}`);
    }
    
  } catch (err) {
    console.error('sendEvolutionWhatsAppMessage error:', err);
    // Fallback: Open WhatsApp Web with message
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    const waUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    console.log("Opened WhatsApp Web (fallback after error)");
  }
};