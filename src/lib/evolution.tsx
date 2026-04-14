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
      apiUrl: "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io", 
      apiKey: "lhnGSMQrQmC54PyPUBqILuWWeau20gDn" 
    };
  }
}

async function callEvolutionApi(endpoint: string, method: string = "GET", body?: any) {
  const config = await getEvolutionConfig();
  const response = await fetch(`/api/evolution/${endpoint}`, {
    method,
    headers: { 
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
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
  return callEvolutionApi(`instance/find/${instanceName}`, "GET");
};

export const fetchInstanceApiKey = async (instanceName: string): Promise<string | null> => {
  try {
    const details = await callEvolutionApi(`instance/find/${instanceName}`, "GET");
    return details?.instance?.apikey || details?.instance?.hash || null;
  } catch {
    return null;
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
