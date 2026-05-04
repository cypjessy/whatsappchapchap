interface EvolutionQRCode {
  code?: string;
  base64?: string;
  pairingCode?: string;
  count?: number;
}

let cachedApiConfig: { apiUrl: string; apiKey: string } | null = null;

async function getEvolutionConfig() {
  if (cachedApiConfig) return cachedApiConfig;
  try {
    const res = await fetch('/api/evolution-config');
    cachedApiConfig = await res.json();
    return cachedApiConfig;
  } catch {
    return { 
      apiUrl: "https://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      apiKey: "lhnGSMQrQmC54PyPUBqILuWWeau20gDn" 
    };
  }
}

async function callEvolutionApi(endpoint: string, method: string = "GET", body?: any) {
  const config = await getEvolutionConfig();
  const apiKey = config?.apiKey || "lhnGSMQrQmC54PyPUBqILuWWeau20gDn";
  const response = await fetch(`/api/evolution/${endpoint}`, {
    method,
    headers: { 
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
}

export const createInstance = async (instanceName: string) => {
  try {
    const result = await callEvolutionApi("instance/create", "POST", {
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    });
    return result;
  } catch (err: any) {
    const message = err?.message?.toString() || "";
    if (/already.*in.*use|already.*exists|duplicate/i.test(message)) {
      return { instance: { instanceName } } as any;
    }
    throw err;
  }
};

export const getQRCode = async (instanceName: string): Promise<EvolutionQRCode | null> => {
  try {
    return await callEvolutionApi(`instance/connect/${instanceName}`);
  } catch {
    return null;
  }
};

export const getConnectionState = async (instanceName: string) => {
  return callEvolutionApi(`instance/connectionState/${instanceName}`);
};

export const sendMessage = async (instanceName: string, phone: string, text: string) => {
  return callEvolutionApi(`message/sendText/${instanceName}`, "POST", {
    number: phone,
    text,
  });
};

export const deleteInstance = async (instanceName: string) => {
  return callEvolutionApi(`instance/delete/${instanceName}`, "DELETE");
};

export const setWebhook = async (instanceName: string, webhookUrl: string) => {
  return callEvolutionApi(`webhook/set/${instanceName}`, "POST", {
    webhook: {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      webhookBase64: false,
      events: [
        "MESSAGES_UPSERT",
        "MESSAGES_UPDATE",
        "CONNECTION_UPDATE",
        "QRCODE_UPDATED"
      ]
    }
  });
};

export const getInstanceDetails = async (instanceName: string) => {
  // Evolution API v2 uses fetchInstances with query param, returns an array
  try {
    const result = await callEvolutionApi(`instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`, "GET");
    console.log('[Evolution] getInstanceDetails raw response:', JSON.stringify(result));
    
    // Response is an array of instances - find matching one
    if (Array.isArray(result) && result.length > 0) {
      const instance = result.find((i: any) => i.instanceName === instanceName) || result[0];
      // Wrap in { instance: ... } for backward compatibility with callers
      return { instance };
    }
    
    // Fallback: if response has .instance property (older API versions)
    if (result?.instance) {
      return result;
    }
    
    // Fallback: if response itself is the instance object
    if (result?.instanceName || result?.apikey) {
      return { instance: result };
    }
    
    return result;
  } catch (err) {
    console.error('[Evolution] getInstanceDetails error, trying legacy endpoint:', err);
    // Fallback to legacy endpoint
    try {
      const legacyResult = await callEvolutionApi(`instance/find/${instanceName}`, "GET");
      console.log('[Evolution] Legacy getInstanceDetails response:', JSON.stringify(legacyResult));
      return legacyResult;
    } catch {
      return null;
    }
  }
};

export const fetchInstanceApiKey = async (instanceName: string): Promise<string | null> => {
  try {
    // Evolution API v2 uses fetchInstances with query param, returns an array
    const result = await callEvolutionApi(`instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`, "GET");
    console.log('[Evolution] fetchInstanceApiKey raw response:', JSON.stringify(result));
    
    // Response is an array of instances
    if (Array.isArray(result) && result.length > 0) {
      const instance = result.find((i: any) => i.instanceName === instanceName) || result[0];
      const apikey = instance?.apikey || instance?.token || instance?.hash || null;
      console.log('[Evolution] Extracted apikey from array response:', apikey);
      return apikey;
    }
    
    // Fallback: nested under .instance (older API versions)
    if (result?.instance) {
      const apikey = result.instance.apikey || result.instance.token || result.instance.hash || null;
      console.log('[Evolution] Extracted apikey from nested response:', apikey);
      return apikey;
    }
    
    // Fallback: direct properties
    if (result?.apikey || result?.token || result?.hash) {
      const apikey = result.apikey || result.token || result.hash;
      console.log('[Evolution] Extracted apikey from direct response:', apikey);
      return apikey;
    }
    
    console.warn('[Evolution] Could not extract apikey from response:', result);
    return null;
  } catch (err) {
    console.error('[Evolution] fetchInstanceApiKey error, trying legacy endpoint:', err);
    // Fallback to legacy endpoint
    try {
      const details = await callEvolutionApi(`instance/find/${instanceName}`, "GET");
      console.log('[Evolution] Legacy fetchInstanceApiKey response:', JSON.stringify(details));
      return details?.instance?.apikey || details?.instance?.hash || details?.apikey || details?.hash || null;
    } catch {
      return null;
    }
  }
};

export const checkInstanceExists = async (instanceName: string): Promise<boolean> => {
  try {
    await callEvolutionApi(`instance/connectionState/${instanceName}`, "GET");
    return true;
  } catch {
    return false;
  }
};
