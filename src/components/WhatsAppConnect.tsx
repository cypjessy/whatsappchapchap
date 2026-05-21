'use client';
import { useEffect, useState, useCallback } from 'react';
import { createInstance, getQRCode, getConnectionState, setWebhook, getInstanceDetails, fetchInstanceApiKey, getPairingCode } from '@/lib/evolution';

interface Props {
  instanceName: string;
  onConnected: (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string; evolutionUUID?: string }) => void;
  autoStart?: boolean;
  showModeSelector?: boolean;
}

type ConnectMode = 'qr' | 'pairing';

export default function WhatsAppConnect({ instanceName, onConnected, autoStart = true, showModeSelector = true }: Props) {
  const [connectMode, setConnectMode] = useState<ConnectMode>('qr');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'qr' | 'pairing' | 'connected' | 'error'>('idle');
  const [createApiKey, setCreateApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pairingCountdown, setPairingCountdown] = useState(60);

  const resetPairingCountdown = useCallback(() => {
    setPairingCountdown(60);
  }, []);

  // Countdown timer for pairing code
  useEffect(() => {
    if (status !== 'pairing' || pairingCountdown <= 0) return;
    const timer = setTimeout(() => setPairingCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, pairingCountdown]);

  const handleConnected = useCallback(async () => {
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";

    console.log('Setting webhook for:', instanceName, 'with URL:', webhookUrl);

    try {
      await setWebhook(instanceName, webhookUrl);
      console.log('Webhook set successfully');
    } catch (webhookErr: any) {
      console.log('Webhook error (may already be set):', webhookErr?.message);
    }

    // Fetch instance-specific API key
    let actualApiKey = '';
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) {
        actualApiKey = instanceKey;
        console.log('Got instance API key:', actualApiKey);
      }
    } catch (err) {
      console.error('Could not fetch instance API key:', err);
    }

    // Fallback: use API key from create response
    if (!actualApiKey && createApiKey) {
      actualApiKey = createApiKey;
    }

    // Fetch UUID from Evolution API
    let evolutionUUID = '';
    try {
      const details = await getInstanceDetails(instanceName);
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || '';
      // Also try to get apikey from details if still don't have one
      if (!actualApiKey && details?.instance?.apikey) {
        actualApiKey = details.instance.apikey;
      }
    } catch (err) {
      console.error('Could not get UUID:', err);
    }

    setStatus('connected');

    if (onConnected) {
      onConnected({
        instanceId: instanceName,
        evolutionUrl: "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
        evolutionKey: actualApiKey,
        evolutionUUID: evolutionUUID,
      });
    }
  }, [instanceName, onConnected, createApiKey]);

  const setupQRCode = useCallback(async () => {
    try {
      setStatus('loading');
      setError(null);

      console.log('Setting up QR code connection for:', instanceName);

      // Check if instance exists and create if needed
      try {
        const state = await getConnectionState(instanceName);
        if (state?.instance?.state === 'open') {
          setStatus('connected');
          handleConnected();
          return;
        }
      } catch {
        // Instance doesn't exist, create it
      }

      try {
        const instanceData = await createInstance(instanceName);
        // Capture API key from create response
        if (instanceData?.hash) {
          const keyFromCreate = typeof instanceData.hash === 'string'
            ? instanceData.hash
            : instanceData.hash?.apikey || instanceData.hash?.token || '';
          if (keyFromCreate) {
            setCreateApiKey(keyFromCreate);
          }
        }
      } catch (createErr: any) {
        const errMsg = createErr?.message?.toString() || '';
        if (!/already.*in.*use|already.*exists|duplicate/i.test(errMsg)) {
          throw createErr;
        }
      }

      // Get QR code
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
        // Fallback: generate QR from instance name
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(instanceName)}`);
        setStatus('qr');
      }
    } catch (err: any) {
      console.error('QR setup error:', err);
      setError(err.message || 'Failed to setup QR code. Please try again.');
      setStatus('error');
    }
  }, [instanceName, handleConnected]);

  const setupPairingCode = useCallback(async () => {
    if (!phoneNumber.trim()) {
      setPhoneError('Please enter your WhatsApp number');
      return;
    }

    // Validate phone number - strip non-digits
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    // Handle Kenyan formats: 07xx, 01xx, +254, 254
    let normalizedPhone = cleanPhone;
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      normalizedPhone = '254' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('254') && !cleanPhone.startsWith('+' as any)) {
      normalizedPhone = '254' + cleanPhone;
    }
    // Remove any remaining + 
    normalizedPhone = normalizedPhone.replace(/^\+/, '');

    if (normalizedPhone.length < 9 || normalizedPhone.length > 15) {
      setPhoneError('Enter a valid phone number (e.g., 0712345678 or +254712345678)');
      return;
    }

    setPhoneError('');
    setStatus('loading');
    setError(null);

    try {
      console.log('Getting pairing code for:', instanceName, 'phone:', normalizedPhone);

      const result = await getPairingCode(instanceName, normalizedPhone);

      if (result?.pairingCode) {
        setPairingCode(result.pairingCode);
        setStatus('pairing');
        resetPairingCountdown();
        console.log('✅ Pairing code received:', result.pairingCode);
      } else {
        setError('Failed to get pairing code. The server may not support this feature. Try QR code instead.');
        setStatus('error');
      }
    } catch (err: any) {
      console.error('Pairing code setup error:', err);
      setError(err.message || 'Failed to get pairing code. Try QR code instead.');
      setStatus('error');
    }
  }, [instanceName, phoneNumber, resetPairingCountdown]);

  // Poll for connection state when in qr or pairing status
  useEffect(() => {
    if (status !== 'qr' && status !== 'pairing') return;

    const interval = setInterval(async () => {
      try {
        const state = await getConnectionState(instanceName);
        console.log('Polling state:', state?.instance?.state);
        if (state?.instance?.state === 'open') {
          clearInterval(interval);
          handleConnected();
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, instanceName, handleConnected]);

  // Auto-start QR setup on mount
  useEffect(() => {
    if (autoStart && connectMode === 'qr') {
      setupQRCode();
    }
  }, [instanceName, autoStart, connectMode, setupQRCode]);

  const handleContinue = useCallback(async () => {
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";

    setStatus('loading');

    try {
      await setWebhook(instanceName, webhookUrl);
      console.log('Webhook set successfully');
    } catch (webhookErr: any) {
      console.log('Webhook error:', webhookErr?.message);
    }

    // Fetch instance-specific API key
    let actualApiKey = '';
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) actualApiKey = instanceKey;
    } catch (err) {
      console.log('Could not fetch instance API key:', err);
    }

    if (!actualApiKey && createApiKey) {
      actualApiKey = createApiKey;
    }

    // Fetch UUID
    let evolutionUUID = '';
    try {
      const details = await getInstanceDetails(instanceName);
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || '';
      if (!actualApiKey && details?.instance?.apikey) {
        actualApiKey = details.instance.apikey;
      }
    } catch (err: any) {
      console.log('getInstanceDetails error:', err?.message);
    }

    if (!evolutionUUID) {
      try {
        const state = await getConnectionState(instanceName);
        evolutionUUID = state?.instance?.id || state?.instance?.instanceId || '';
      } catch (err: any) {
        console.log('getConnectionState error:', err?.message);
      }
    }

    setStatus('connected');

    onConnected({
      instanceId: instanceName,
      evolutionUrl: "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io",
      evolutionKey: actualApiKey,
      evolutionUUID: evolutionUUID,
    });
  }, [instanceName, onConnected, createApiKey]);

  // ─── Mode Selector ──────────────────────────────────────────────────────────

  const renderModeSelector = () => (
    <div className="flex gap-2 mb-6">
      <button
        onClick={() => { setConnectMode('qr'); setError(null); setStatus('idle'); }}
        className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          connectMode === 'qr'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/30'
            : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <i className="fas fa-qrcode text-base" />
        Scan QR Code
        <span className="text-[10px] opacity-70">(2 phones)</span>
      </button>
      <button
        onClick={() => { setConnectMode('pairing'); setError(null); setStatus('idle'); }}
        className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          connectMode === 'pairing'
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md shadow-green-500/30'
            : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <i className="fas fa-keyboard text-base" />
        Pairing Code
        <span className="text-[10px] opacity-70">(1 phone)</span>
      </button>
    </div>
  );

  // ─── QR Code View ──────────────────────────────────────────────────────────

  const renderQRCode = () => {
    if (status === 'loading') return (
      <div className="flex flex-col items-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent" />
        <p className="mt-4 text-on-surface-variant">Setting up QR code...</p>
      </div>
    );

    if (status === 'error') return (
      <div className="flex flex-col items-center p-6">
        <div className="text-amber-500 text-5xl mb-3">⚠️</div>
        <p className="text-amber-600 text-center text-sm mb-4">{error}</p>
        <div className="flex gap-3">
          <button onClick={setupQRCode} className="px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold text-sm transition-all">
            Try Again
          </button>
          <button onClick={handleContinue} className="px-5 py-2.5 bg-surface-variant text-on-surface rounded-xl hover:bg-surface-container-high font-semibold text-sm transition-all">
            Continue Anyway
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center p-4">
        <div className="flex items-center gap-2 mb-3">
          <i className="fas fa-qrcode text-green-500 text-lg" />
          <span className="font-semibold text-sm">QR Code Scan</span>
        </div>
        <p className="text-on-surface-variant text-xs text-center mb-4">
          Open WhatsApp → Linked Devices → Link a Device → Scan this QR
        </p>
        {qrCode && (
          <div className="relative">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56 md:w-64 md:h-64 border-4 border-green-500 rounded-xl" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <i className="fas fa-circle text-white text-[6px]" />
            </div>
          </div>
        )}
        <p className="mt-4 text-xs text-on-surface-variant animate-pulse flex items-center gap-2">
          <i className="fas fa-hourglass-half" />
          Waiting for scan...
        </p>
        <button
          onClick={setupQRCode}
          className="mt-3 px-4 py-2 text-xs text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-all"
        >
          <i className="fas fa-refresh mr-1" /> Refresh QR
        </button>
      </div>
    );
  };

  // ─── Pairing Code View ─────────────────────────────────────────────────────

  const renderPairingCode = () => {
    if (status === 'loading') return (
      <div className="flex flex-col items-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-green-500 border-t-transparent" />
        <p className="mt-4 text-on-surface-variant">Getting pairing code...</p>
      </div>
    );

    if (status === 'error') return (
      <div className="flex flex-col items-center p-6">
        <div className="text-amber-500 text-5xl mb-3">⚠️</div>
        <p className="text-amber-600 text-center text-sm mb-4">{error}</p>
        <div className="flex gap-3">
          <button onClick={() => setStatus('idle')} className="px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold text-sm transition-all">
            Try Again
          </button>
          <button onClick={handleContinue} className="px-5 py-2.5 bg-surface-variant text-on-surface rounded-xl hover:bg-surface-container-high font-semibold text-sm transition-all">
            Continue Anyway
          </button>
        </div>
      </div>
    );

    if (status === 'pairing' && pairingCode) return (
      <div className="flex flex-col items-center p-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-3 shadow-lg shadow-green-500/30">
          <i className="fas fa-key text-white text-xl" />
        </div>
        <h4 className="font-bold text-lg mb-1">Pairing Code</h4>
        <p className="text-on-surface-variant text-xs text-center mb-4">
          Open WhatsApp → Linked Devices → Link with phone number → Enter this code
        </p>

        {/* Pairing Code Display */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl px-8 py-5 mb-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 font-semibold">Your Code</p>
          <p className="text-3xl md:text-4xl font-mono font-black tracking-[0.3em] text-green-700 select-all">
            {pairingCode}
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-surface-variant rounded-xl p-4 w-full mb-4 space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold">1</span>
            </div>
            <p className="text-xs text-on-surface-variant">Open <strong>WhatsApp</strong> on your phone</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold">2</span>
            </div>
            <p className="text-xs text-on-surface-variant">Go to <strong>Linked Devices</strong> → <strong>Link with phone number</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-[10px] font-bold">3</span>
            </div>
            <p className="text-xs text-on-surface-variant">Enter this code: <strong className="text-green-700">{pairingCode}</strong></p>
          </div>
        </div>

        {/* Countdown / Status */}
        <div className="flex items-center gap-2 text-xs text-on-surface-variant">
          {pairingCountdown > 0 ? (
            <>
              <i className="fas fa-hourglass-half" />
              Code expires in <span className="font-bold text-green-600">{pairingCountdown}s</span>
            </>
          ) : (
            <span className="text-amber-600 font-medium flex items-center gap-1">
              <i className="fas fa-exclamation-triangle" />
              Code expired — get a new one
            </span>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {pairingCountdown <= 0 && (
            <button
              onClick={setupPairingCode}
              className="px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 font-semibold text-sm transition-all"
            >
              <i className="fas fa-refresh mr-1" /> Get New Code
            </button>
          )}
        </div>
      </div>
    );

    // Show phone number input form
    return (
      <div className="flex flex-col items-center p-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/30">
          <i className="fas fa-phone text-white text-xl" />
        </div>
        <h4 className="font-bold text-lg mb-1">Link with Phone Number</h4>
        <p className="text-on-surface-variant text-xs text-center mb-5">
          Enter your WhatsApp number below to receive a pairing code
        </p>

        <div className="w-full space-y-3">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant mb-1.5">
              Your WhatsApp Number
            </label>
            <div className="flex gap-2">
              <div className="shrink-0 px-3 py-3 bg-surface-variant rounded-xl text-sm font-medium text-on-surface flex items-center border border-outline-variant">
                🇰🇪 +254
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setupPairingCode();
                }}
                placeholder="712 345 678"
                className="flex-1 px-4 py-3 border-2 border-outline rounded-xl text-sm font-medium outline-none focus:border-green-500 transition-all"
                autoFocus
              />
            </div>
            {phoneError && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <i className="fas fa-exclamation-circle" /> {phoneError}
              </p>
            )}
            <p className="text-[10px] text-on-surface-variant mt-1.5">
              Use format: 0712345678 or 712345678 or +254712345678
            </p>
          </div>

          <button
            onClick={setupPairingCode}
            disabled={!phoneNumber.trim()}
            className="w-full px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <i className="fas fa-key" />
            Get Pairing Code
          </button>
        </div>
      </div>
    );
  };

  // ─── Connected View ────────────────────────────────────────────────────────

  if (status === 'connected') return (
    <div className="flex flex-col items-center p-6">
      <div className="text-green-500 text-6xl mb-2">✅</div>
      <h3 className="text-xl font-bold text-green-600">WhatsApp Connected!</h3>
      <p className="text-on-surface-variant text-sm mt-1 text-center">Your number is ready to use.</p>

      <button
        onClick={handleContinue}
        className="mt-5 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold text-sm transition-all shadow-lg shadow-green-500/30"
      >
        <i className="fas fa-check mr-2" />
        Continue to Dashboard
      </button>
    </div>
  );

  // ─── Idle / Initial View ───────────────────────────────────────────────────

  if (status === 'idle' && !autoStart) {
    return (
      <div className="flex flex-col items-center p-6">
        <div className="text-5xl mb-3">📱</div>
        <h3 className="text-xl font-bold text-on-surface">Connect Your WhatsApp</h3>
        <p className="text-on-surface-variant text-sm mt-1 text-center">
          Choose your connection method below
        </p>

        {showModeSelector && renderModeSelector()}

        {connectMode === 'qr' ? (
          <button
            onClick={setupQRCode}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-semibold text-sm transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
          >
            <i className="fas fa-qrcode" />
            Start QR Scan
          </button>
        ) : (
          renderPairingCode()
        )}
      </div>
    );
  }

  // ─── Main Connection View ──────────────────────────────────────────────────

  return (
    <div className="flex flex-col">
      {/* Mode Selector */}
      {showModeSelector && renderModeSelector()}

      {/* Current Mode Content */}
      {connectMode === 'qr' ? renderQRCode() : renderPairingCode()}
    </div>
  );
}
