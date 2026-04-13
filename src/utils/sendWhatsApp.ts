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
    
    console.log("Fetching tenant:", tenantId);
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
    
    if (!tenantDoc.exists()) {
      console.error("Tenant not found:", tenantId);
      return;
    }
    
    const tenant = tenantDoc.data();
    console.log("Tenant evolution config:", {
      serverUrl: tenant?.evolutionServerUrl,
      hasApiKey: !!tenant?.evolutionApiKey,
      instanceId: tenant?.evolutionInstanceId
    });
    
    if (!tenant?.evolutionServerUrl || !tenant?.evolutionApiKey || !tenant?.evolutionInstanceId) {
      console.error('Missing Evolution credentials for tenant:', tenantId);
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    
    // Convert http to https for Evolution server URL
    let evolutionUrl = tenant.evolutionServerUrl.replace(/\/$/, '');
    if (evolutionUrl.startsWith('http://')) {
      evolutionUrl = evolutionUrl.replace('http://', 'https://');
      console.log("Converted HTTP to HTTPS for Evolution server");
    }
    
    const apiUrl = `${evolutionUrl}/api/message/sendText/${tenant.evolutionInstanceId}`;

    console.log("Sending WhatsApp to:", fullPhone);
    console.log("API URL:", apiUrl);
    console.log("API Key length:", tenant.evolutionApiKey?.length);

    let response: Response;
    
    try {
      response = await fetch(apiUrl, {
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
    } catch (fetchError) {
      console.log("Evolution API failed, trying n8n fallback...");
      // Fallback to n8n webhook
      response = await fetch('https://n8n-lfk9ps3h72dezxj6jwy4905s.173.249.50.98.sslip.io/webhook/order-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: fullPhone,
          message: message,
          tenantId: tenantId
        })
      });
    }

    const result = await response.text();
    console.log("WhatsApp response:", response.status, result);
    
    return result;
  } catch (err: any) {
    console.error('sendEvolutionWhatsAppMessage error:', err.message || err);
  }
};