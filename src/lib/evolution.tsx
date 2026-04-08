interface EvolutionQRCode {
  code?: string;
  base64?: string;
  pairingCode?: string;
  count?: number;
}

async function callEvolutionApi(endpoint: string, method: string = "GET", body?: any) {
  const response = await fetch(`/api/evolution/${endpoint}`, {
    method,
    headers: { 
      "Content-Type": "application/json",
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
  return callEvolutionApi("instance/create", "POST", {
    instanceName,
    qrcode: true,
    integration: "WHATSAPP-BAILEYS",
  });
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
