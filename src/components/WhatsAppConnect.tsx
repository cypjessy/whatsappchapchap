'use client';
import { useEffect, useState } from 'react';
import { createInstance, getQRCode, getConnectionState, setWebhook, getInstanceDetails } from '@/lib/evolution';

interface Props {
  instanceName: string;
  onConnected: (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string }) => void;
}

export default function WhatsAppConnect({ instanceName, onConnected }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'qr' | 'connected' | 'error'>('loading');
  const [apiKeyFetched, setApiKeyFetched] = useState(false);
  const [fetchingApiKey, setFetchingApiKey] = useState(false);
  const [fetchedApiKey, setFetchedApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const setupInstance = async () => {
    try {
      setStatus('loading');
      setError(null);
      
      console.log('Creating instance:', instanceName);
      const instanceData = await createInstance(instanceName);
      console.log('Instance created:', instanceData);
      
      if (instanceData.instance?.instanceName) {
        console.log('Instance exists, getting QR code...');
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
          const state = await getConnectionState(instanceName);
          console.log('Connection state:', state);
          if (state?.instance?.state === 'open') {
            setStatus('connected');
            handleConnected();
          } else if (state?.instance?.state === 'close') {
            setError('Your WhatsApp is not connected. Please scan the QR code to connect.');
            setStatus('error');
          } else {
            setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(instanceName)}`);
            setStatus('qr');
          }
        }
      }
    } catch (err: any) {
      console.error('Setup error:', err);
      setError(err.message || 'Failed to setup WhatsApp. Please try again.');
      setStatus('error');
    }
  };

  const handleConnected = async () => {
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || "https://whatsappchapchap.vercel.app";
      console.log('Setting webhook for:', instanceName, 'with URL:', webhookUrl + '/api/webhook/evolution');
      await setWebhook(instanceName, webhookUrl);
      console.log('Webhook set successfully');
      
      setFetchingApiKey(true);
      try {
        console.log('Fetching instance details for:', instanceName);
        const details = await getInstanceDetails(instanceName);
        console.log('Instance details:', JSON.stringify(details));
        
        const apikey = details?.instance?.apikey || details?.apikey || "";
        console.log('API Key found:', apikey);
        
        setFetchedApiKey(apikey);
        setApiKeyFetched(true);
      } catch (err) {
        console.error("Error getting instance details:", err);
      } finally {
        setFetchingApiKey(false);
      }
    } catch (err) {
      console.error('Failed to set webhook:', err);
    }
  };

  const handleContinue = async () => {
    if (!apiKeyFetched || !fetchedApiKey) {
      alert("Please wait while we fetch your API key...");
      return;
    }
    
    const evolutionUrl = process.env.EVOLUTION_API_URL || "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io";
    
    onConnected({ 
      instanceId: instanceName, 
      evolutionUrl,
      evolutionKey: fetchedApiKey
    });
  };

  const refreshWebhook = async () => {
    try {
      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || "https://whatsappchapchap.vercel.app";
      await setWebhook(instanceName, webhookUrl);
      alert('Webhook registered successfully!');
    } catch (err) {
      console.error('Failed to set webhook:', err);
      alert('Failed to register webhook. Please try again.');
    }
  };

  useEffect(() => {
    setupInstance();
  }, [instanceName]);

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
          disabled={!apiKeyFetched || fetchingApiKey}
          className={`px-6 py-2 rounded-lg font-semibold ${
            apiKeyFetched && !fetchingApiKey
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
      <div className="text-red-500 text-6xl">❌</div>
      <p className="text-red-600 mt-4 text-center">{error}</p>
      <button 
        onClick={setupInstance}
        className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        Try Again
      </button>
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
