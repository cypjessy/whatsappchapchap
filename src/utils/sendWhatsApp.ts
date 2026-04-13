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
    
    // Try Evolution API first
    let evolutionWorked = false;
    
    if (tenant?.evolutionServerUrl && tenant?.evolutionApiKey && tenant?.evolutionInstanceId) {
      try {
        const cleanPhone = phone.replace(/[^0-9]/g, "");
        const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
        
        let evolutionUrl = tenant.evolutionServerUrl.replace(/\/$/, '');
        if (evolutionUrl.startsWith('http://')) {
          evolutionUrl = evolutionUrl.replace('http://', 'https://');
        }
        
        const apiUrl = `${evolutionUrl}/api/message/sendText/${tenant.evolutionInstanceId}`;
        
        const response = await fetch(apiUrl, {
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
          console.log("WhatsApp sent via Evolution API");
          evolutionWorked = true;
          return;
        }
      } catch (e) {
        console.log("Evolution API failed, trying alternatives...");
      }
    }

    // Try n8n fallback
    try {
      await fetch('https://n8n-lfk9ps3h72dezxj6jwy4905s.173.249.50.98.sslip.io/webhook/order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerPhone: phone, message, tenantId })
      });
      console.log("WhatsApp sent via n8n fallback");
      return;
    } catch (e) {
      console.log("n8n fallback failed");
    }

    // Final fallback: Open wa.me link (simplest, works without any API)
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    console.log("Opening WhatsApp Web:", waUrl);
    window.open(waUrl, '_blank');
    
  } catch (err) {
    console.error('sendEvolutionWhatsAppMessage error:', err);
  }
};