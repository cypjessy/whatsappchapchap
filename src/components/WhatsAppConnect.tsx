'use client';
import { useEffect, useState } from 'react';
import { createInstance, getQRCode, getConnectionState, setWebhook } from '@/lib/evolution';

interface Props {
  instanceName: string;
  onConnected: () => void;
}

export default function WhatsAppConnect({ instanceName, onConnected }: Props) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'qr' | 'connected' | 'error'>('loading');
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
        
        if (qrData?.base64) {
          setQrCode(qrData.base64);
          setStatus('qr');
        } else if (qrData?.code) {
          setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData.code)}`);
          setStatus('qr');
        } else {
          const state = await getConnectionState(instanceName);
          console.log('Connection state:', state);
          if (state?.instance?.state === 'open') {
            setStatus('connected');
            onConnected();
          } else {
            setError('No QR code available. Try again or use Evolution Manager.');
            setStatus('error');
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
      const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      console.log('Setting webhook for:', instanceName, 'with URL:', webhookUrl);
      await setWebhook(instanceName, webhookUrl);
      console.log('Webhook set successfully');
    } catch (err) {
      console.error('Failed to set webhook:', err);
    }
    onConnected();
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
      <p className="text-gray-600 mt-2">Your number is ready to use.</p>
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
