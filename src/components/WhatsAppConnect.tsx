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
  const [copied, setCopied] = useState(false);

  const resetPairingCountdown = useCallback(() => setPairingCountdown(60), []);

  useEffect(() => {
    if (status !== 'pairing' || pairingCountdown <= 0) return;
    const timer = setTimeout(() => setPairingCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, pairingCountdown]);

  const handleConnected = useCallback(async () => {
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";
    try { await setWebhook(instanceName, webhookUrl); } catch {}
    let actualApiKey = '';
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) actualApiKey = instanceKey;
    } catch {}
    if (!actualApiKey && createApiKey) actualApiKey = createApiKey;
    let evolutionUUID = '';
    try {
      const details = await getInstanceDetails(instanceName);
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || '';
      if (!actualApiKey && details?.instance?.apikey) actualApiKey = details.instance.apikey;
    } catch {}
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
      try {
        const state = await getConnectionState(instanceName);
        if (state?.instance?.state === 'open') {
          setStatus('connected');
          handleConnected();
          return;
        }
      } catch {}
      try {
        const instanceData = await createInstance(instanceName);
        if (instanceData?.hash) {
          const keyFromCreate = typeof instanceData.hash === 'string'
            ? instanceData.hash
            : instanceData.hash?.apikey || instanceData.hash?.token || '';
          if (keyFromCreate) setCreateApiKey(keyFromCreate);
        }
      } catch (createErr: any) {
        const errMsg = createErr?.message?.toString() || '';
        if (!/already.*in.*use|already.*exists|duplicate/i.test(errMsg)) throw createErr;
      }
      const qrData = await getQRCode(instanceName);
      const rawQrData = qrData?.base64 || qrData?.code || qrData?.pairingCode;
      if (rawQrData) {
        if (qrData?.base64) {
          const base64Value = qrData.base64.startsWith("data:image") ? qrData.base64 : `data:image/png;base64,${qrData.base64}`;
          setQrCode(base64Value);
        } else {
          setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=5&data=${encodeURIComponent(rawQrData)}`);
        }
        setStatus('qr');
      } else {
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=5&data=${encodeURIComponent(instanceName)}`);
        setStatus('qr');
      }
    } catch (err: any) {
      console.error('QR setup error:', err);
      setError(err.message || 'Failed to setup QR code.');
      setStatus('error');
    }
  }, [instanceName, handleConnected]);

  const setupPairingCode = useCallback(async () => {
    if (!phoneNumber.trim()) { setPhoneError('Enter your WhatsApp number'); return; }
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    let normalizedPhone = cleanPhone;
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) normalizedPhone = '254' + cleanPhone.slice(1);
    else if (!cleanPhone.startsWith('254') && !cleanPhone.startsWith('+')) normalizedPhone = '254' + cleanPhone;
    normalizedPhone = normalizedPhone.replace(/^\+/, '');
    if (normalizedPhone.length < 9 || normalizedPhone.length > 15) {
      setPhoneError('Invalid phone number');
      return;
    }
    setPhoneError('');
    setStatus('loading');
    setError(null);
    try {
      const result = await getPairingCode(instanceName, normalizedPhone);
      if (result?.pairingCode) {
        setPairingCode(result.pairingCode);
        setStatus('pairing');
        resetPairingCountdown();
      } else {
        setError('Failed to get pairing code. Try QR code instead.');
        setStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to get pairing code.');
      setStatus('error');
    }
  }, [instanceName, phoneNumber, resetPairingCountdown]);

  useEffect(() => {
    if (status !== 'qr' && status !== 'pairing') return;
    const interval = setInterval(async () => {
      try {
        const state = await getConnectionState(instanceName);
        if (state?.instance?.state === 'open') {
          clearInterval(interval);
          handleConnected();
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [status, instanceName, handleConnected]);

  useEffect(() => {
    if (autoStart && connectMode === 'qr') setupQRCode();
  }, [instanceName]);

  const handleContinue = useCallback(async () => {
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";
    setStatus('loading');
    try { await setWebhook(instanceName, webhookUrl); } catch {}
    let actualApiKey = '';
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) actualApiKey = instanceKey;
    } catch {}
    if (!actualApiKey && createApiKey) actualApiKey = createApiKey;
    let evolutionUUID = '';
    try {
      const details = await getInstanceDetails(instanceName);
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || '';
      if (!actualApiKey && details?.instance?.apikey) actualApiKey = details.instance.apikey;
    } catch {}
    if (!evolutionUUID) {
      try {
        const state = await getConnectionState(instanceName);
        evolutionUUID = state?.instance?.id || state?.instance?.instanceId || '';
      } catch {}
    }
    setStatus('connected');
    onConnected({ instanceId: instanceName, evolutionUrl: "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io", evolutionKey: actualApiKey, evolutionUUID: evolutionUUID });
  }, [instanceName, onConnected, createApiKey]);

  // ─── MD3 Mode Selector ───────────────────────────────────────────────────────
  const renderModeSelector = () => (
    <div className="flex gap-1.5 mb-4 p-1 bg-surface-variant rounded-full">
      <button
        onClick={() => { setConnectMode('qr'); setError(null); setStatus('idle'); }}
        className={`flex-1 py-2.5 px-3 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
          connectMode === 'qr'
            ? 'bg-[#25D366] text-white shadow-md3-level1'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <i className="fas fa-qrcode" />
        <span className="hidden sm:inline">QR Code</span>
        <span className="sm:hidden">QR</span>
      </button>
      <button
        onClick={() => { setConnectMode('pairing'); setError(null); setStatus('idle'); }}
        className={`flex-1 py-2.5 px-3 rounded-full font-semibold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 ${
          connectMode === 'pairing'
            ? 'bg-[#25D366] text-white shadow-md3-level1'
            : 'text-on-surface-variant hover:bg-surface-container-high'
        }`}
      >
        <i className="fas fa-mobile-alt" />
        <span className="hidden sm:inline">Pairing Code</span>
        <span className="sm:hidden">Code</span>
      </button>
    </div>
  );

  // ─── QR Code View ────────────────────────────────────────────────────────────
  const renderQRCode = () => {
    if (status === 'loading') return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 border-3 border-[#25D366]/20 border-t-[#25D366] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-on-surface-variant font-medium">Generating QR Code...</p>
      </div>
    );

    if (status === 'error') return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-3">
          <i className="fas fa-exclamation-triangle text-2xl text-amber-500" />
        </div>
        <p className="text-amber-700 text-sm text-center mb-4 px-2">{error}</p>
        <div className="flex gap-2">
          <button onClick={setupQRCode} className="px-4 py-2 bg-[#25D366] text-white rounded-lg font-semibold text-sm hover:bg-[#128C7E] transition-colors active:scale-95">
            Try Again
          </button>
          <button onClick={() => setStatus('idle')} className="px-4 py-2 bg-surface-variant text-on-surface rounded-lg font-semibold text-sm hover:bg-surface-container-high transition-colors">
            Use Code
          </button>
        </div>
      </div>
    );

    return (
      <div className="flex flex-col items-center px-2 py-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-[#25D366]/10 flex items-center justify-center">
            <i className="fas fa-qrcode text-[#25D366] text-xs" />
          </div>
          <span className="font-semibold text-sm text-on-surface">Scan QR Code</span>
        </div>
        <p className="text-[10px] text-on-surface-variant text-center mb-3 leading-tight">
          WhatsApp → Linked Devices → Link a Device → Scan
        </p>
        <div className="relative">
          {qrCode ? (
            <div className="relative">
              <img src={qrCode} alt="QR Code" className="w-44 h-44 sm:w-48 sm:h-48 border-2 border-[#25D366] rounded-lg shadow-sm" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#25D366] rounded-full flex items-center justify-center animate-pulse">
                <i className="fas fa-sync text-white text-[8px]" />
              </div>
            </div>
          ) : (
            <div className="w-44 h-44 sm:w-48 sm:h-48 border-2 border-surface-variant rounded-lg flex items-center justify-center bg-surface-variant/50">
              <div className="w-10 h-10 border-3 border-[#25D366]/20 border-t-[#25D366] rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#25D366]">
          <div className="w-1.5 h-1.5 bg-[#25D366] rounded-full animate-pulse" />
          <span className="font-medium">Waiting for scan...</span>
        </div>
        <button onClick={setupQRCode} className="mt-2.5 px-3 py-1.5 text-[11px] text-[#25D366] border border-[#25D366]/30 rounded-full hover:bg-[#25D366]/5 transition-colors flex items-center gap-1.5">
          <i className="fas fa-redo text-[10px]" />
          Refresh
        </button>
      </div>
    );
  };

  // ─── Pairing Code View ───────────────────────────────────────────────────────
  const renderPairingCode = () => {
    if (status === 'loading') return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 border-3 border-[#25D366]/20 border-t-[#25D366] rounded-full animate-spin" />
        <p className="mt-4 text-sm text-on-surface-variant font-medium">Getting pairing code...</p>
      </div>
    );

    if (status === 'error') return (
      <div className="flex flex-col items-center justify-center py-6">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mb-3">
          <i className="fas fa-exclamation-triangle text-2xl text-amber-500" />
        </div>
        <p className="text-amber-700 text-sm text-center mb-4 px-2">{error}</p>
        <button onClick={() => setStatus('idle')} className="px-4 py-2 bg-[#25D366] text-white rounded-lg font-semibold text-sm hover:bg-[#128C7E] transition-colors">
          Try Again
        </button>
      </div>
    );

    if (status === 'pairing' && pairingCode) {
      return (
        <div className="flex flex-col items-center px-2 py-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center mb-2 shadow-md3-level1">
            <i className="fas fa-key text-white text-lg" />
          </div>
          <h4 className="font-bold text-base text-on-surface mb-1">Pairing Code</h4>
          <p className="text-[10px] text-on-surface-variant text-center mb-4">
            Enter in WhatsApp to link
          </p>

          {/* Code Display */}
          <div className="relative w-full max-w-[200px] bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-[#25D366]/30 rounded-xl p-3 mb-3">
            <p className="text-[8px] uppercase tracking-wider text-on-surface-variant mb-1.5 font-semibold text-center">Your Code</p>
            <div className="flex items-center justify-center gap-2">
              <span className={`font-mono font-bold tracking-wider text-green-700 select-all ${pairingCode.length > 6 ? 'text-xl' : 'text-2xl'}`}>
                {pairingCode}
              </span>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(pairingCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    const ta = document.createElement('textarea');
                    ta.value = pairingCode;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                  copied ? 'bg-[#25D366] text-white' : 'bg-green-200 text-green-800 hover:bg-green-300'
                }`}
              >
                {copied ? <><i className="fas fa-check" /> Copied</> : <><i className="fas fa-copy" /> Copy</>}
              </button>
            </div>
            {copied && (
              <div className="absolute -top-2 -right-2 bg-[#25D366] text-white text-[8px] font-bold px-2 py-0.5 rounded-full animate-bounce">
                Copied!
              </div>
            )}
          </div>

          {/* Steps */}
          <div className="w-full bg-surface-variant/50 rounded-lg p-3 mb-3">
            <p className="text-[9px] uppercase tracking-wider font-semibold text-on-surface-variant mb-2">How to</p>
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant">
              <div className="w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold">1</span>
              </div>
              <span>Open WhatsApp</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant mt-1.5">
              <div className="w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold">2</span>
              </div>
              <span>Linked Devices → Link with phone</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant mt-1.5">
              <div className="w-4 h-4 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold">3</span>
              </div>
              <span>Enter code and tap Link</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 text-[11px]">
            <i className="fas fa-hourglass-half text-on-surface-variant text-[10px]" />
            {pairingCountdown > 0 ? (
              <span className="text-on-surface-variant">Expires in <span className="font-bold text-[#25D366]">{pairingCountdown}s</span></span>
            ) : (
              <span className="text-amber-600 font-medium">Code expired</span>
            )}
          </div>

          {pairingCountdown <= 0 && (
            <button onClick={setupPairingCode} className="mt-2.5 px-4 py-2 bg-[#25D366] text-white rounded-full text-xs font-semibold hover:bg-[#128C7E] transition-colors">
              <i className="fas fa-redo mr-1 text-[10px]" /> New Code
            </button>
          )}
        </div>
      );
    }

    // Phone input form
    return (
      <div className="flex flex-col items-center px-2 py-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-md">
          <i className="fas fa-mobile-alt text-white text-lg" />
        </div>
        <h4 className="font-bold text-base text-on-surface mb-0.5">Link with Phone</h4>
        <p className="text-[10px] text-on-surface-variant text-center mb-4">
          Enter your WhatsApp number
        </p>

        <div className="w-full space-y-3">
          <div>
            <div className="flex gap-2">
              <div className="shrink-0 px-3 py-2.5 bg-surface-variant rounded-lg text-xs font-semibold text-on-surface flex items-center border border-outline-variant">
                🇰🇪 +254
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') setupPairingCode(); }}
                placeholder="712 345 678"
                className="flex-1 px-3 py-2.5 border-2 border-outline rounded-lg text-sm outline-none focus:border-[#25D366] transition-colors"
                autoFocus
              />
            </div>
            {phoneError && (
              <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                <i className="fas fa-exclamation-circle" /> {phoneError}
              </p>
            )}
          </div>

          <button
            onClick={setupPairingCode}
            disabled={!phoneNumber.trim()}
            className="w-full py-3 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#128C7E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md3-level1"
          >
            <i className="fas fa-key" />
            Get Pairing Code
          </button>
        </div>
      </div>
    );
  };

  // ─── Connected View ─────────────────────────────────────────────────────────
  if (status === 'connected') return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="w-14 h-14 bg-gradient-to-br from-[#25D366] to-emerald-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
        <i className="fas fa-check text-white text-2xl" />
      </div>
      <h3 className="text-lg font-bold text-[#128C7E]">Connected!</h3>
      <p className="text-[11px] text-on-surface-variant mt-1">WhatsApp is ready</p>
      <button onClick={handleContinue} className="mt-4 px-6 py-2.5 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#128C7E] transition-colors shadow-md3-level1">
        Continue
      </button>
    </div>
  );

  // ─── Idle View ───────────────────────────────────────────────────────────────
  if (status === 'idle' && !autoStart) {
    return (
      <div className="flex flex-col items-center px-2 py-4">
        <div className="w-14 h-14 bg-[#25D366]/10 rounded-2xl flex items-center justify-center mb-2">
          <i className="fab fa-whatsapp text-3xl text-[#25D366]" />
        </div>
        <h3 className="text-base font-bold text-on-surface mb-1">Connect WhatsApp</h3>
        <p className="text-[11px] text-on-surface-variant text-center mb-4">
          Choose a connection method
        </p>
        {showModeSelector && renderModeSelector()}
        {connectMode === 'qr' ? (
          <button onClick={setupQRCode} className="px-5 py-2.5 bg-[#25D366] text-white rounded-xl font-semibold text-sm hover:bg-[#128C7E] transition-colors shadow-md3-level1 flex items-center gap-2">
            <i className="fas fa-qrcode" />
            Start QR Scan
          </button>
        ) : (
          renderPairingCode()
        )}
      </div>
    );
  }

  // ─── Main View ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      {showModeSelector && renderModeSelector()}
      {connectMode === 'qr' ? renderQRCode() : renderPairingCode()}
    </div>
  );
}