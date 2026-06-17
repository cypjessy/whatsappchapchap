'use client';

import { useState, useEffect, useCallback } from 'react';
import { useHaptics } from '@/hooks/useNativeAndroid';
import { logoutInstance, deleteInstance, getConnectionState } from '@/lib/evolution';
import { apiFetch, getApiBaseUrl } from '@/lib/api-config';
import WhatsAppDialog from './WhatsAppDialog';

interface WhatsAppConnectionManagerProps {
  instanceName: string;
  onConnectionChange?: (connected: boolean) => void;
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected' | 'error';

export default function WhatsAppConnectionManager({ 
  instanceName,
  onConnectionChange 
}: WhatsAppConnectionManagerProps) {
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const disconnectInstance = useCallback(async () => {
    try {
      await impactMedium();
      setDisconnecting(true);
      
      await logoutInstance(instanceName);
      setConnectionStatus('disconnected');
      setConfirmingDisconnect(false);
      await notificationSuccess();
      if (onConnectionChange) onConnectionChange(false);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      await notificationError();
      setConnectionStatus('disconnected');
      setConfirmingDisconnect(false);
      if (onConnectionChange) onConnectionChange(false);
    } finally {
      setDisconnecting(false);
      setIsLoading(false);
    }
  }, [instanceName, impactMedium, notificationSuccess, notificationError, onConnectionChange]);

  const handleConnectSuccess = useCallback(() => {
    impactLight();
    setConnectionStatus('connected');
    setShowConnectDialog(false);
    if (onConnectionChange) onConnectionChange(true);
  }, [impactLight, onConnectionChange]);

  const handleReconnect = useCallback(async () => {
    await impactLight();
    // Fully disconnect: logout WhatsApp session, then delete the Evolution instance
    // so the dialog creates a fresh one and shows a new QR code
    try {
      await logoutInstance(instanceName);
    } catch {
      // Ignore logout errors
    }
    try {
      await deleteInstance(instanceName);
    } catch {
      // Ignore delete errors (instance may not exist)
    }
    setShowConnectDialog(true);
  }, [instanceName, impactLight]);

  // Check initial connection state
  useEffect(() => {
    const checkConnection = async () => {
      console.log('[WhatsAppConnectionManager] === CONNECTION CHECK START ===');
      console.log('[WhatsAppConnectionManager] instanceName:', instanceName);
      try {
        setErrorMessage(null);
        
        // Step 1: Get Evolution config from Vercel
        console.log('[WhatsAppConnectionManager] Step 1: Fetching evolution config...');
        const configResponse = await apiFetch('/api/evolution-config');
        console.log('[WhatsAppConnectionManager] Config response status:', configResponse.status);
        console.log('[WhatsAppConnectionManager] Config response URL:', configResponse.url);
        const config = await configResponse.json();
        console.log('[WhatsAppConnectionManager] Config received:', { 
          hasUrl: !!config?.apiUrl, 
          hasKey: !!config?.apiKey 
        });
        const apiKey = config?.apiKey || '';
        
        // Step 2: Check connection state via Vercel proxy
        const stateEndpoint = `/api/evolution/instance/connectionState/${instanceName}`;
        console.log('[WhatsAppConnectionManager] Step 2: Checking connection state...');
        console.log('[WhatsAppConnectionManager] State endpoint:', stateEndpoint);
        console.log('[WhatsAppConnectionManager] Has API key:', !!apiKey);
        
        const stateResponse = await apiFetch(stateEndpoint, {
          headers: { 'x-api-key': apiKey },
        });
        console.log('[WhatsAppConnectionManager] State response status:', stateResponse.status);
        console.log('[WhatsAppConnectionManager] State response URL:', stateResponse.url);
        
        const state = await stateResponse.json();
        console.log('[WhatsAppConnectionManager] State response data:', JSON.stringify(state).substring(0, 300));
        
        if (state?.instance?.state === 'open') {
          console.log('[WhatsAppConnectionManager] ✅ Instance is CONNECTED (open)');
          setConnectionStatus('connected');
        } else {
          console.log('[WhatsAppConnectionManager] ❌ Instance state is not open:', state?.instance?.state);
          setConnectionStatus('disconnected');
        }
      } catch (err) {
        console.error('[WhatsAppConnectionManager] ❌ Error checking connection:', err);
        console.log('[WhatsAppConnectionManager] Error name:', (err as Error)?.name);
        console.log('[WhatsAppConnectionManager] Error message:', (err as Error)?.message);
        console.log('[WhatsAppConnectionManager] Error stack:', (err as Error)?.stack?.substring(0, 300));
        
        setConnectionStatus('error');
        
        const baseUrl = getApiBaseUrl();
        console.log('[WhatsAppConnectionManager] getApiBaseUrl() returned:', baseUrl);
        console.log('[WhatsAppConnectionManager] Capacitor global available:', !!(window as any).Capacitor);
        
        if (!baseUrl && typeof window !== 'undefined' && (window as any).Capacitor) {
          setErrorMessage('API URL not configured for mobile. Check .env.local');
        } else {
          setErrorMessage('Could not reach API server. Check your connection.');
        }
      } finally {
        console.log('[WhatsAppConnectionManager] === CONNECTION CHECK END ===');
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [instanceName]);

  if (isLoading) {
    return (
      <div className="bg-surface rounded-2xl p-5 shadow-md border-2 border-outline">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-variant animate-pulse" />
            <div>
              <div className="h-4 w-32 bg-surface-variant rounded animate-pulse" />
              <div className="h-3 w-24 bg-surface-variant rounded mt-2 animate-pulse" />
            </div>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-surface rounded-2xl p-5 shadow-md border-2 transition-all duration-300 ${
      connectionStatus === 'connected' 
        ? 'border-green-500' 
        : 'border-outline'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            connectionStatus === 'connected'
              ? 'bg-gradient-to-br from-green-400 to-emerald-500'
              : 'bg-surface-variant'
          }`}>
            <i className={`fab fa-whatsapp text-lg ${
              connectionStatus === 'connected' ? 'text-white' : 'text-on-surface-variant'
            }`} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-on-surface">WhatsApp Connection</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {connectionStatus === 'connected' 
                ? 'AI replies are active' 
                : 'Connect to enable AI replies'}
            </p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-surface-variant text-on-surface-variant'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-gray-400'
          }`} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            {connectionStatus === 'connected' ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Connection Status Card */}
      {connectionStatus === 'connected' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border-2 border-green-500">
            <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center shrink-0">
              <i className="fas fa-check text-white text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 text-sm">WhatsApp Connected</p>
              <p className="text-[11px] text-green-700 truncate">Instance: {instanceName}</p>
            </div>
            <div className="flex gap-1">
              <button
                onClick={async () => {
                  await impactLight();
                  const state = await getConnectionState(instanceName).catch(() => null);
                  if (state?.instance?.state !== 'open') {
                    setConnectionStatus('disconnected');
                  }
                }}
                className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors border border-green-300"
                title="Refresh status"
              >
                <i className="fas fa-sync text-[11px] text-green-600" />
              </button>
            </div>
          </div>
          
          {!confirmingDisconnect ? (
            <div className="flex gap-2">
              <button
                onClick={handleReconnect}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-green-500/20"
              >
                <i className="fas fa-sync" />
                Reconnect
              </button>
              <button
                onClick={() => setConfirmingDisconnect(true)}
                disabled={disconnecting}
                className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-all font-semibold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <i className="fas fa-plug-circle-xmark" />
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs text-amber-700 font-medium flex items-center gap-2">
                  <i className="fas fa-exclamation-triangle" />
                  This will stop all AI replies. Are you sure?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDisconnect(false)}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-2.5 bg-surface-variant text-on-surface rounded-xl hover:bg-surface-container-high transition-all font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={disconnectInstance}
                  disabled={disconnecting}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {disconnecting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                      Disconnecting...
                    </>
                  ) : (
                    'Yes, Disconnect'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : connectionStatus === 'error' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl border-2 border-red-200">
            <div className="w-9 h-9 bg-red-500 rounded-full flex items-center justify-center shrink-0">
              <i className="fas fa-exclamation-triangle text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-900 text-sm">Server Unreachable</p>
              <p className="text-[11px] text-red-700">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsLoading(true);
              setConnectionStatus('checking');
            }}
            className="w-full px-4 py-2.5 bg-surface-variant text-on-surface rounded-xl hover:bg-surface-container-high transition-all font-semibold text-xs flex items-center justify-center gap-2"
          >
            <i className="fas fa-sync" />
            Retry Connection
          </button>
        </div>
      ) : (
        /* Disconnected state */
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border-2 border-outline-variant">
            <div className="w-9 h-9 bg-gray-400 rounded-full flex items-center justify-center shrink-0">
              <i className="fas fa-plug text-white text-sm" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-on-surface text-sm">Not Connected</p>
              <p className="text-[11px] text-on-surface-variant">Link your WhatsApp to get started</p>
            </div>
          </div>

          <button
            onClick={() => {
              impactLight();
              setShowConnectDialog(true);
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-md shadow-green-500/30"
          >
            <i className="fab fa-whatsapp text-lg" />
            Connect WhatsApp Number
          </button>

          <div className="flex gap-2 pt-1">
            <div className="flex-1 p-2 bg-surface-container-low rounded-lg text-center border border-outline-variant">
              <i className="fas fa-qrcode text-green-500 text-sm" />
              <p className="text-[10px] text-on-surface-variant mt-1">Scan QR</p>
            </div>
            <div className="flex-1 p-2 bg-surface-container-low rounded-lg text-center border border-outline-variant">
              <i className="fas fa-keyboard text-blue-500 text-sm" />
              <p className="text-[10px] text-on-surface-variant mt-1">Pairing Code</p>
            </div>
            <div className="flex-1 p-2 bg-surface-container-low rounded-lg text-center border border-outline-variant">
              <i className="fas fa-bolt text-amber-500 text-sm" />
              <p className="text-[10px] text-on-surface-variant mt-1">Auto-reply</p>
            </div>
          </div>
        </div>
      )}

      {/* Premium WhatsApp Connection Dialog */}
      <WhatsAppDialog
        instanceName={instanceName}
        isOpen={showConnectDialog}
        onClose={() => setShowConnectDialog(false)}
        onConnected={handleConnectSuccess}
      />
    </div>
  );
}
