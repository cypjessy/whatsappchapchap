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
    
    const evolutionUrl = tenant.evolutionServerUrl.replace(/\/$/, '');
    const apiUrl = `${evolutionUrl}/api/message/sendText/${tenant.evolutionInstanceId}`;

    console.log("Sending WhatsApp to:", fullPhone);
    console.log("API URL:", apiUrl);
    console.log("API Key length:", tenant.evolutionApiKey?.length);

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

    const result = await response.text();
    console.log("WhatsApp response:", response.status, result);
    
    return result;
  } catch (err: any) {
    console.error('sendEvolutionWhatsAppMessage error:', err.message);
    if (err.message.includes('Failed to fetch')) {
      console.error("Network error - check if Evolution server is accessible");
    }
    throw err;
  }
};