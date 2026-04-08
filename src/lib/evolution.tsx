export interface EvolutionQRCode {
  code?: string;
  base64?: string;
  pairingCode?: string;
  count?: number;
}

export const createInstance = async (instanceName: string) => {
  const response = await fetch(`/api/evolution/instance/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
    }),
  });
  return response.json();
};

export const getQRCode = async (instanceName: string): Promise<EvolutionQRCode | null> => {
  try {
    const response = await fetch(`/api/evolution/instance/connect/${instanceName}`);
    if (response.ok) {
      return response.json();
    }
    return null;
  } catch {
    return null;
  }
};

export const getConnectionState = async (instanceName: string) => {
  const response = await fetch(`/api/evolution/instance/connectionState/${instanceName}`);
  return response.json();
};

export const sendMessage = async (instanceName: string, phone: string, text: string) => {
  const response = await fetch(`/api/evolution/message/sendText/${instanceName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ number: phone, text }),
  });
  return response.json();
};
