'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { createInstance, getQRCode, getConnectionState, setWebhook, getInstanceDetails, fetchInstanceApiKey, getPairingCode } from '@/lib/evolution';

interface WhatsAppDialogProps {
  instanceName: string;
  isOpen: boolean;
  onClose: () => void;
  onConnected: (data?: { instanceId: string; evolutionUrl: string; evolutionKey: string; evolutionUUID?: string }) => void;
  initialMode?: 'qr' | 'pairing';
}

type ConnectMode = 'qr' | 'pairing';

export default function WhatsAppDialog({ instanceName, isOpen, onClose, onConnected, initialMode = 'qr' }: WhatsAppDialogProps) {
  const [connectMode, setConnectMode] = useState<ConnectMode>(initialMode);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'qr' | 'pairing' | 'connected' | 'error'>('idle');
  const [createApiKey, setCreateApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pairingCountdown, setPairingCountdown] = useState(60);
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  }, [onClose]);

  const resetPairingCountdown = useCallback(() => {
    setPairingCountdown(60);
  }, []);

  useEffect(() => {
    if (status !== 'pairing' || pairingCountdown <= 0) return;
    const timer = setTimeout(() => setPairingCountdown((p) => p - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, pairingCountdown]);

  const handleConnected = useCallback(async () => {
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";
    try {
      await setWebhook(instanceName, webhookUrl);
    } catch (webhookErr: any) {
      console.log('Webhook error:', webhookErr?.message);
    }

    let actualApiKey = '';
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) actualApiKey = instanceKey;
    } catch (err) {
      console.error('Could not fetch instance API key:', err);
    }

    if (!actualApiKey && createApiKey) actualApiKey = createApiKey;

    let evolutionUUID = '';
    try {
      const details = await getInstanceDetails(instanceName);
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || '';
      if (!actualApiKey && details?.instance?.apikey) actualApiKey = details.instance.apikey;
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
          setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(rawQrData)}`);
        }
        setStatus('qr');
      } else {
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

    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    let normalizedPhone = cleanPhone;
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      normalizedPhone = '254' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('254') && !cleanPhone.startsWith('+')) {
      normalizedPhone = '254' + cleanPhone;
    }
    normalizedPhone = normalizedPhone.replace(/^\+/, '');

    if (normalizedPhone.length < 9 || normalizedPhone.length > 15) {
      setPhoneError('Enter a valid phone number (e.g., 0712345678 or +254712345678)');
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
      console.error('Pairing code setup error:', err);
      setError(err.message || 'Failed to get pairing code. Try QR code instead.');
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
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [status, instanceName, handleConnected]);

  useEffect(() => {
    if (isOpen && connectMode === 'qr') {
      setupQRCode();
    }
  }, [isOpen]);

  const handleContinue = useCallback(async () => {
    const webhookUrl = "https://whatsappchapchap.vercel.app/api/webhook/evolution";
    setStatus('loading');

    try {
      await setWebhook(instanceName, webhookUrl);
    } catch (webhookErr: any) {
      console.log('Webhook error:', webhookErr?.message);
    }

    let actualApiKey = '';
    try {
      const instanceKey = await fetchInstanceApiKey(instanceName);
      if (instanceKey) actualApiKey = instanceKey;
    } catch (err) {
      console.log('Could not fetch instance API key:', err);
    }

    if (!actualApiKey && createApiKey) actualApiKey = createApiKey;

    let evolutionUUID = '';
    try {
      const details = await getInstanceDetails(instanceName);
      evolutionUUID = details?.instance?.instanceId || details?.instance?.id || '';
      if (!actualApiKey && details?.instance?.apikey) actualApiKey = details.instance.apikey;
    } catch (err: unknown) {
      console.log('getInstanceDetails error:', err);
    }

    if (!evolutionUUID) {
      try {
        const state = await getConnectionState(instanceName);
        evolutionUUID = state?.instance?.id || state?.instance?.instanceId || '';
      } catch (err: unknown) {
        console.log('getConnectionState error:', err);
      }
    }

    setStatus('connected');
    onConnected({ instanceId: instanceName, evolutionUrl: "http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io", evolutionKey: actualApiKey, evolutionUUID: evolutionUUID });
  }, [instanceName, onConnected, createApiKey]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen && !isVisible) return null;
  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Dialog Container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className={`w-full max-w-md bg-white rounded-2xl shadow-2xl transform transition-all duration-300 overflow-hidden ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {/* Premium Header */}
          <div className="relative bg-gradient-to-r from-[#25D366] via-[#128C7E] to-[#075E54] px-5 py-5 text-white">
            {/* Decorative circles */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -bottom-8 -left-4 w-24 h-24 bg-white/10 rounded-full" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <i className="fab fa-whatsapp text-2xl text-[#25D366]" />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">Connect WhatsApp</h2>
                  <p className="text-white/80 text-xs">{instanceName}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-sm" />
              </button>
            </div>

            {/* Progress indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div className={`flex-1 h-1 rounded-full ${status === 'qr' || status === 'pairing' || status === 'connected' ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`w-3 h-3 rounded-full ${status === 'pairing' || status === 'connected' ? 'bg-white' : status === 'qr' ? 'bg-white/50' : 'bg-white/30'}`} />
              <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-white' : 'bg-white/30'}`} />
            </div>
          </div>

          {/* Content Body */}
          <div className="p-5 max-h-[60vh] overflow-y-auto">
            {/* Mode Selector */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => { setConnectMode('qr'); setError(null); setStatus('idle'); }}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  connectMode === 'qr'
                    ? 'bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30'
                    : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <i className="fas fa-qrcode" />
                Scan QR
              </button>
              <button
                onClick={() => { setConnectMode('pairing'); setError(null); setStatus('idle'); }}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                  connectMode === 'pairing'
                    ? 'bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30'
                    : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <i className="fas fa-mobile-alt" />
                Pairing Code
              </button>
            </div>

            {/* QR Code View */}
            {connectMode === 'qr' && (
              <div className="space-y-4">
                {status === 'loading' && (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-16 h-16 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
                    <p className="mt-4 text-on-surface-variant font-medium">Generating QR Code...</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex flex-col items-center py-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-exclamation-triangle text-3xl text-amber-500" />
                    </div>
                    <p className="text-amber-700 text-center text-sm mb-4">{error}</p>
                    <button
                      onClick={setupQRCode}
                      className="px-5 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-redo" />
                      Try Again
                    </button>
                  </div>
                )}

                {status === 'qr' && (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      {qrCode ? (
                        <div className="relative">
                          <img src={qrCode} alt="WhatsApp QR Code" className="w-56 h-56 md:w-64 md:h-64 border-4 border-[#25D366] rounded-2xl shadow-lg" />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#25D366] rounded-full flex items-center justify-center animate-pulse shadow-lg">
                            <i className="fas fa-sync text-white text-xs" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-56 h-56 md:w-64 md:h-64 border-4 border-surface-variant rounded-2xl flex items-center justify-center bg-surface-variant">
                          <div className="animate-spin rounded-full h-12 w-12 border-3 border-[#25D366]/30 border-t-[#25D366]" />
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-center text-sm text-on-surface">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Waiting for scan...
                      </span>
                    </p>
                    <p className="mt-2 text-xs text-on-surface-variant text-center">
                      Open WhatsApp → Settings → Linked Devices → Link a Device
                    </p>
                    <button
                      onClick={setupQRCode}
                      className="mt-4 px-4 py-2 text-[#25D366] border-2 border-[#25D366]/30 rounded-xl hover:bg-[#25D366]/5 font-semibold text-sm transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-redo text-xs" />
                      Refresh QR
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pairing Code View */}
            {connectMode === 'pairing' && (
              <div className="space-y-4">
                {status === 'idle' && (
                  <div className="flex flex-col items-center py-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <i className="fas fa-mobile-alt text-3xl text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-on-surface mb-2">Link with Phone Number</h3>
                    <p className="text-on-surface-variant text-sm text-center mb-6">
                      Enter your WhatsApp number to receive a pairing code
                    </p>

                    <div className="w-full space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-on-surface-variant mb-2">
                          WhatsApp Number
                        </label>
                        <div className="flex gap-2">
                          <div className="shrink-0 px-4 py-3 bg-surface-variant rounded-xl text-sm font-semibold text-on-surface flex items-center border border-outline-variant">
                            🇰🇪 +254
                          </div>
                          <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => { setPhoneNumber(e.target.value); setPhoneError(''); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') setupPairingCode(); }}
                            placeholder="712 345 678"
                            className="flex-1 px-4 py-3 border-2 border-outline rounded-xl text-sm font-medium outline-none focus:border-[#25D366] transition-all"
                            autoFocus
                          />
                        </div>
                        {phoneError && (
                          <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                            <i className="fas fa-exclamation-circle" />
                            {phoneError}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={setupPairingCode}
                        disabled={!phoneNumber.trim()}
                        className="w-full px-5 py-3.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
                      >
                        <i className="fas fa-key" />
                        Get Pairing Code
                      </button>
                    </div>
                  </div>
                )}

                {status === 'loading' && (
                  <div className="flex flex-col items-center py-8">
                    <div className="w-16 h-16 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin" />
                    <p className="mt-4 text-on-surface-variant font-medium">Getting pairing code...</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="flex flex-col items-center py-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                      <i className="fas fa-exclamation-triangle text-3xl text-amber-500" />
                    </div>
                    <p className="text-amber-700 text-center text-sm mb-4">{error}</p>
                    <div className="flex gap-3">
                      <button onClick={() => setStatus('idle')} className="px-5 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] font-semibold text-sm">
                        Try Again
                      </button>
                      <button onClick={() => setConnectMode('qr')} className="px-5 py-2.5 bg-surface-variant text-on-surface rounded-xl hover:bg-surface-container-high font-semibold text-sm">
                        Use QR Code
                      </button>
                    </div>
                  </div>
                )}

                {status === 'pairing' && pairingCode && (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#25D366] to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#25D366]/30">
                      <i className="fas fa-key text-2xl text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-on-surface mb-1">Your Pairing Code</h3>
                    <p className="text-on-surface-variant text-xs text-center mb-5">
                      Enter this code in WhatsApp to link your number
                    </p>

                    {/* Premium Code Display */}
                    <div className="relative w-full bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-[#25D366]/30 rounded-2xl p-5 mb-5">
                      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3 font-semibold text-center">Pairing Code</p>
                      <div className="flex items-center justify-center gap-3">
                        <span className={`font-mono font-bold tracking-wider text-green-700 select-all ${pairingCode.length > 8 ? 'text-3xl' : 'text-4xl'}`}>
                          {pairingCode}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(pairingCode);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            } catch {}
                          }}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            copied ? 'bg-[#25D366] text-white' : 'bg-green-200 text-green-800 hover:bg-green-300'
                          }`}
                        >
                          {copied ? <><i className="fas fa-check mr-1" /> Copied</> : <><i className="fas fa-copy mr-1" /> Copy</>}
                        </button>
                      </div>
                      {copied && (
                        <div className="absolute -top-3 -right-3 bg-[#25D366] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg animate-bounce">
                          Copied!
                        </div>
                      )}
                    </div>

                    {/* Steps */}
                    <div className="w-full bg-surface-variant rounded-xl p-4 mb-4">
                      <p className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant mb-3">How to connect</p>
                      <div className="space-y-3">
                        {['Open WhatsApp on your phone', 'Go to Settings → Linked Devices', 'Tap "Link with phone number"', 'Enter the code above and tap Link'].map((step, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white flex items-center justify-center shrink-0 shadow-sm">
                              <span className="text-[11px] font-bold">{i + 1}</span>
                            </div>
                            <p className="text-xs text-on-surface-variant leading-relaxed pt-0.5">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Countdown */}
                    <div className="flex items-center gap-2 text-sm">
                      <i className="fas fa-hourglass-half text-on-surface-variant" />
                      {pairingCountdown > 0 ? (
                        <span className="text-on-surface-variant">
                          Code expires in <span className="font-bold text-[#25D366]">{pairingCountdown}s</span>
                        </span>
                      ) : (
                        <span className="text-amber-600 font-medium">Code expired</span>
                      )}
                    </div>

                    {pairingCountdown <= 0 && (
                      <button
                        onClick={setupPairingCode}
                        className="mt-4 px-5 py-2.5 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] font-semibold text-sm transition-all"
                      >
                        <i className="fas fa-redo mr-2" />
                        Get New Code
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Connected State */}
            {status === 'connected' && (
              <div className="flex flex-col items-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#25D366]/30">
                  <i className="fas fa-check text-4xl text-white" />
                </div>
                <h3 className="font-bold text-xl text-on-surface mb-2">WhatsApp Connected!</h3>
                <p className="text-on-surface-variant text-sm text-center mb-6">
                  Your WhatsApp is now linked and ready to use
                </p>
                <button
                  onClick={handleContinue}
                  className="px-6 py-3 bg-[#25D366] text-white rounded-xl hover:bg-[#128C7E] font-semibold text-sm transition-all shadow-lg shadow-[#25D366]/20 flex items-center gap-2"
                >
                  <i className="fas fa-check" />
                  Continue
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 bg-surface-variant flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-on-surface-variant">
              <i className="fas fa-shield-alt text-[#25D366]" />
              <span>Secure connection</span>
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 text-on-surface-variant hover:text-on-surface font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}