'use client';
import { useEffect, useState } from 'react';
import { createInstance, getQRCode, getConnectionState, setWebhook, getInstanceDetails, fetchInstanceApiKey } from '@/lib/evolution';

interface Props {
  instanceName: string;
  onConnected: (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string; evolutionUUID?: string }) => void;
  autoStart?: boolean;
}

export default function WhatsAppConnect({ instanceName, onConnected, autoStart = true }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'qr' | 'connected' | 'error'>('loading');
  const [apiKeyFetched, setApiKeyFetched] = useState(false);
  const [fetchingApiKey, setFetchingApiKey] = useState(false);
  const [fetchedApiKey, setFetchedApiKey] = useState("");
  const [createApiKey, setCreateApiKey] = useState(""); // API key from create instance response
  const [error, setError] = useState<string | null>(null);

  const setupInstance = async () => {
    try {
      setStatus('loading');
      setError(null);
      
      console.log('Checking instance:', instanceName);
      
      try {
        const state = await getConnectionState(instanceName);
        console.log('Connection state:', state);
        
        if (state?.instance?.state === 'open') {
          console.log('Instance already connected');
          setStatus('connected');
          handleConnected();
          return;
        } else if (state?.instance?.state === 'close') {
          console.log('Instance exists but disconnected - will try to reconnect');
        }
      } catch (stateErr) {
        console.log('Instance does not exist, creating new one');
      }
      
      console.log('Creating instance:', instanceName);
      let instanceData;
      try {
        instanceData = await createInstance(instanceName);
        console.log('Instance created:', JSON.stringify(instanceData));
        
        // Capture API key from create response
        // Evolution API returns it as: hash: "key" (string) or hash: { apikey: "key" } (object)
        if (instanceData?.hash) {
          const keyFromCreate = typeof instanceData.hash === 'string' 
            ? instanceData.hash 
            : instanceData.hash?.apikey || instanceData.hash?.token || "";
          if (keyFromCreate) {
            console.log('Got API key from create instance response:', keyFromCreate);
            setCreateApiKey(keyFromCreate);
          }
        }
      } catch (createErr: any) {
        const errMsg = createErr?.message?.toString() || "";
        console.log('Create error:', errMsg);
        if (/already.*in.*use|already.*exists|duplicate/i.test(errMsg)) {
          console.log('Instance already exists, trying to get QR code');
        } else {
          throw createErr;
        }
      }
      
      try {
        const state = await getConnectionState(instanceName);
        console.log('Connection state after:', state);
        
        if (state?.instance?.state === 'open') {
          setStatus('connected');
          handleConnected();
          return;
        }
      } catch (stateErr) {
        console.log('Could not get connection state');
      }
      
      try {
        const qrData = await getQRCode(instanceName);
        console.log('QR Code data:', qrData);

        const rawQrData = qrData?.base64 || qrData?.code || qrData?.pairingCode;

        if (rawQrData) {
          if (qrData?.base64) {
            const base64Value = qrData.base64.startsWith("data:image")
              ? qrData.base64
              : `data:image/png;base64,${qrData.base64}`;
            setQrCode(base64Value);
          } else {
            setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(rawQrData)}`);
          }
          setStatus('qr');
        } else {
          setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(instanceName)}`);
          setStatus('qr');
        }
      } catch (qrErr) {
        console.log('Could not get QR code, showing connected state');
        setStatus('connected');
        handleConnected();
      }
    } catch (err: any) {
      console.error('Setup error:', err);
      const errMsg = err?.message?.toString() || "";
      
      if (/already.*in.*use|already.*exists|duplicate/i.test(errMsg)) {
        console.log('Instance already exists, trying to connect anyway');
        setStatus('connected');
        handleConnected();
      } else {
        setError(err.message || 'Failed to setup WhatsApp. Please try again.');
        setStatus('error');
      }
    }
  };

  const handleConnected = async () => {
    // Always use production Vercel URL for webhook (stable, not preview URLs)
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";
      
    console.log('Setting webhook for:', instanceName, 'with URL:', webhookUrl);
    
    try {
      await setWebhook(instanceName, webhookUrl);
      console.log('Webhook set successfully');
    } catch (webhookErr: any) {
      console.log('Webhook error (may already be set):', webhookErr?.message);
    }
    
    // Fetch instance-specific API key from Evolution API
    let actualApiKey = "";
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) {
        actualApiKey = instanceKey;
        console.log('Got instance API key from fetchInstanceApiKey:', actualApiKey);
      } else {
        console.warn('fetchInstanceApiKey returned null/empty for:', instanceName);
      }
    } catch (err) {
      console.error('Could not fetch instance API key:', err);
    }
    
    // Fallback: use API key captured from create instance response
    if (!actualApiKey && createApiKey) {
      actualApiKey = createApiKey;
      console.log('Using API key from create instance response:', actualApiKey);
    }
    
    setFetchedApiKey(actualApiKey);
    setApiKeyFetched(true);
    
    // Fetch UUID from Evolution API
    let evolutionUUID = "";
    try {
      const details = await getInstanceDetails(instanceName);
      console.log('getInstanceDetails full response:', JSON.stringify(details));
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || "";
      console.log('Evolution UUID from handleConnected:', evolutionUUID);
      
      // Also try to get apikey from details if we still don't have one
      if (!actualApiKey && details?.instance?.apikey) {
        actualApiKey = details.instance.apikey;
        console.log('Got API key from getInstanceDetails:', actualApiKey);
        setFetchedApiKey(actualApiKey);
      }
      
      // Store UUID for later use
      (window as any).__evolutionUUID = evolutionUUID;
    } catch (err) {
      console.error('Could not get UUID:', err);
    }
    
    // Always call onConnected even if UUID fetch failed - API key is the critical piece
    if (onConnected) {
      console.log('Calling onConnected with evolutionKey:', actualApiKey, 'UUID:', evolutionUUID);
      onConnected({
        instanceId: instanceName,
        evolutionUrl: "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
        evolutionKey: actualApiKey,
        evolutionUUID: evolutionUUID
      });
    }
  };

  const handleContinue = async () => {
    setStatus('loading');
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";
    console.log('Setting webhook for:', instanceName, 'with URL:', webhookUrl);
    
    try {
      await setWebhook(instanceName, webhookUrl);
      console.log('Webhook set successfully');
    } catch (webhookErr: any) {
      console.log('Webhook error (may already be set):', webhookErr?.message);
    }
    
    // Fetch instance-specific API key from Evolution API
    let actualApiKey = "";
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) {
        actualApiKey = instanceKey;
        console.log('Got instance API key from fetchInstanceApiKey:', actualApiKey);
      }
    } catch (err) {
      console.log('Could not fetch instance API key:', err);
    }
    
    // Fallback: use API key captured from create instance response
    if (!actualApiKey && createApiKey) {
      actualApiKey = createApiKey;
      console.log('Using API key from create instance response:', actualApiKey);
    }
    
    // Fetch UUID from Evolution API - try multiple methods
    let evolutionUUID = (window as any).__evolutionUUID || "";
    if (!evolutionUUID) {
      try {
        // Try getInstanceDetails first
        const details = await getInstanceDetails(instanceName);
        console.log('getInstanceDetails response:', JSON.stringify(details));
        evolutionUUID = details?.instance?.instanceId || details?.instance?.id || details?.instance?.owner || "";
        console.log('Evolution UUID from getInstanceDetails:', evolutionUUID);
        
        // Also try to get apikey from details if we still don't have one
        if (!actualApiKey && details?.instance?.apikey) {
          actualApiKey = details.instance.apikey;
          console.log('Got API key from getInstanceDetails:', actualApiKey);
        }
      } catch (err: any) {
        console.log('getInstanceDetails error:', err?.message);
      }
    }
    
    // If still no UUID, try connection state
    if (!evolutionUUID) {
      try {
        const state = await getConnectionState(instanceName);
        console.log('getConnectionState response:', JSON.stringify(state));
        evolutionUUID = state?.instance?.id || state?.instance?.instanceId || "";
        console.log('Evolution UUID from getConnectionState:', evolutionUUID);
      } catch (err: any) {
        console.log('getConnectionState error:', err?.message);
      }
    }
    
    console.log('Final Evolution UUID:', evolutionUUID);
    
    setFetchedApiKey(actualApiKey);
    setApiKeyFetched(true);
    
    const evolutionUrl = "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io";
    
    console.log('Sending to onConnected:', { evolutionKey: actualApiKey, evolutionUUID });
    
    onConnected({ 
      instanceId: instanceName, 
      evolutionUrl,
      evolutionKey: actualApiKey,
      evolutionUUID: evolutionUUID
    });
  };

  const refreshWebhook = async () => {
    try {
      const webhookUrl = "http://n8n-lfk9ps3h72dezxj6jwy4905s.173.249.50.98.sslip.io/webhook/whatsapp";
      await setWebhook(instanceName, webhookUrl);
      alert('Webhook registered successfully!');
    } catch (err) {
      console.error('Failed to set webhook:', err);
      alert('Failed to register webhook. Please try again.');
    }
  };

  useEffect(() => {
    if (autoStart !== false) {
      setupInstance();
    }
  }, [instanceName, autoStart]);

  useEffect(() => {
    if (status !== 'qr') return;
    
    const interval = setInterval(async () => {
      try {
        const state = await getConnectionState(instanceName);
        console.log('Polling state:', state);
        if (state?.instance?.state === 'open') {
          setStatus('connected');
          handleConnected();
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, instanceName]);

  if (status === 'loading' && !autoStart) return (
    <div className="flex flex-col items-center p-6">
      <div className="text-blue-500 text-6xl">📱</div>
      <h3 className="mt-4 text-xl font-bold text-gray-700">Ready to Connect WhatsApp</h3>
      <p className="text-gray-500 mt-2 text-center">
        Click the button below to scan the QR code and connect your WhatsApp number.
      </p>
      <button 
        onClick={setupInstance}
        className="mt-6 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
      >
        Start Connection
      </button>
    </div>
  );

  if (status === 'loading') return (
    <div className="flex flex-col items-center p-6">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      <p className="mt-4 text-gray-600">Setting up WhatsApp...</p>
    </div>
  );

  if (status === 'connected') return (
    <div className="flex flex-col items-center p-6">
      <div className="text-green-500 text-6xl">✅</div>
      <h3 className="mt-4 text-xl font-bold text-green-600">WhatsApp Connected!</h3>
      <p className="text-gray-600 mt-2 text-center">Your number is ready to use.</p>
      
      {fetchingApiKey && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Fetching your API key...</span>
        </div>
      )}
      
      {apiKeyFetched && fetchedApiKey && (
        <div className="mt-3 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm">
          <i className="fas fa-key mr-2"></i>
          API Key fetched successfully!
        </div>
      )}
      
      <div className="flex gap-3 mt-4">
        <button 
          onClick={refreshWebhook}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh Webhook
        </button>
        <button 
          onClick={handleContinue}
          disabled={status !== 'connected'}
          className={`px-6 py-2 rounded-lg font-semibold ${
            status === 'connected'
              ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );

  if (status === 'error') return (
    <div className="flex flex-col items-center p-6">
      <div className="text-orange-500 text-6xl">⚠️</div>
      <p className="text-orange-600 mt-4 text-center">{error}</p>
      <div className="flex gap-3 mt-4">
        <button 
          onClick={setupInstance}
          className="px-4 py-2 text-sm text-orange-600 border border-orange-500 rounded-lg hover:bg-orange-50"
        >
          Try Again
        </button>
        <button 
          onClick={handleContinue}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center p-6">
      <h3 className="text-xl font-bold mb-2">Connect Your WhatsApp</h3>
      <p className="text-gray-600 mb-4 text-center">
        Open WhatsApp on your phone → Linked Devices → Link a Device → Scan this QR code
      </p>
      {qrCode && (
        <img 
          src={qrCode} 
          alt="WhatsApp QR Code" 
          className="w-64 h-64 border-4 border-green-500 rounded-lg"
        />
      )}
      <p className="mt-4 text-sm text-gray-500 animate-pulse">
        Waiting for you to scan...
      </p>

      <button 
        onClick={setupInstance}
        className="mt-4 px-4 py-2 text-sm text-green-600 border border-green-500 rounded-lg hover:bg-green-50"
      >
        Refresh QR Code
      </button>
    </div>
  );
}
