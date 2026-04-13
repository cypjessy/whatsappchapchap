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
    
    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    
    // Send directly to Evolution webhook
    await fetch('http://n8n-lfk9ps3h72dezxj6jwy4905s.173.249.50.98.sslip.io/webhook/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number: fullPhone,
        text: message
      })
    });
    
    console.log("WhatsApp sent to:", fullPhone);
    
  } catch (err) {
    console.error('sendEvolutionWhatsAppMessage error:', err);
  }
};