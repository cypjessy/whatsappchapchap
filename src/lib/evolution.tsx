import { TenantSettings } from "./db";

export interface EvolutionQRCode {
  code?: string;
  base64?: string;
  pairingCode?: string;
  count?: number;
}

async function callEvolutionApi(endpoint: string, method: string = "GET", apiKey: string, apiUrl: string, body?: any) {
  const url = `/api/evolution/${endpoint}?apiUrl=${encodeURIComponent(apiUrl)}`;
  
  const response = await fetch(url, {
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

export const evolutionService = {
  async testConnection(apiUrl: string, apiKey: string): Promise<boolean> {
    try {
      await callEvolutionApi("instance/create", "POST", apiKey, apiUrl, {
        instanceName: "test-connection",
        integration: "WHATSAPP-BAILEYS",
        qrcode: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  async createInstance(apiUrl: string, apiKey: string, instanceName: string): Promise<any> {
    return callEvolutionApi("instance/create", "POST", apiKey, apiUrl, {
      instanceName,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    });
  },

  async getInstanceStatus(apiUrl: string, apiKey: string, instanceName: string): Promise<any> {
    return callEvolutionApi(`instance/connectionState/${instanceName}`, "GET", apiKey, apiUrl);
  },

  async getQRCode(apiUrl: string, apiKey: string, instanceName: string): Promise<EvolutionQRCode | null> {
    try {
      return await callEvolutionApi(`instance/connect/${instanceName}`, "GET", apiKey, apiUrl);
    } catch {
      return null;
    }
  },

  async logoutInstance(apiUrl: string, apiKey: string, instanceName: string): Promise<boolean> {
    try {
      await callEvolutionApi(`instance/delete/${instanceName}`, "DELETE", apiKey, apiUrl);
      return true;
    } catch {
      return false;
    }
  },

  async sendMessage(apiUrl: string, apiKey: string, instanceName: string, phone: string, text: string): Promise<boolean> {
    try {
      await callEvolutionApi(`message/sendText/${instanceName}`, "POST", apiKey, apiUrl, {
        number: phone,
        text,
      });
      return true;
    } catch {
      return false;
    }
  },

  async getInstance(apiUrl: string, apiKey: string, instanceName: string): Promise<any> {
    try {
      return await callEvolutionApi(`instance/connectionState/${instanceName}`, "GET", apiKey, apiUrl);
    } catch {
      return null;
    }
  },

  async getMessages(apiUrl: string, apiKey: string, instanceName: string, limit: number = 100): Promise<any[]> {
    try {
      const data = await callEvolutionApi(`message/list/${instanceName}?limit=${limit}`, "GET", apiKey, apiUrl);
      return data.messages || [];
    } catch {
      return [];
    }
  },

  async fetchMessages(apiUrl: string, apiKey: string, instanceName: string): Promise<any> {
    try {
      return await callEvolutionApi(`message/fetch/${instanceName}`, "POST", apiKey, apiUrl, {});
    } catch {
      return { messages: [] };
    }
  },
};
