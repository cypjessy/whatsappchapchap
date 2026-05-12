'use client';

import { useState, useEffect } from 'react';
import { useHaptics } from '@/hooks/useNativeAndroid';
import { logoutInstance } from '@/lib/evolution';
import WhatsAppConnect from '@/components/WhatsAppConnect';

interface WhatsAppConnectionManagerProps {
  instanceName: string;
  onConnectionChange?: (connected: boolean) => void;
}

export default function WhatsAppConnectionManager({ 
  instanceName,
  onConnectionChange 
}: WhatsAppConnectionManagerProps) {
  const { impactLight, impactMedium, notificationSuccess, notificationError } = useHaptics();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const disconnectInstance = async () => {
    try {
      await impactMedium();
      setIsLoading(true);
      
      await logoutInstance(instanceName);
      
      setConnectionStatus('disconnected');
      setConfirmingLogout(false);
      
      await notificationSuccess();
      if (onConnectionChange) onConnectionChange(false);
    } catch (err) {
      console.error('Failed to disconnect:', err);
      await notificationError();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectSuccess = (data?: any) => {
    impactLight();
    setConnectionStatus('connected');
    setShowConnectModal(false);
    setIsConnecting(false);
    if (onConnectionChange) onConnectionChange(true);
  };

  // Check initial connection state
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/api/evolution-config');
        const config = await response.json();
        const apiKey = config?.apiKey || 'lhnGSMQrQmC54PyPUBqILuWWeau20gDn';
        
        const stateResponse = await fetch(`/api/evolution/instance/connectionState/${instanceName}`, {
          headers: {
            'x-api-key': apiKey,
          },
        });
        
        if (stateResponse.ok) {
          const state = await stateResponse.json();
          if (state?.instance?.state === 'open') {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('disconnected');
          }
        } else {
          setConnectionStatus('disconnected');
        }
      } catch (err) {
        console.error('Error checking connection:', err);
        setConnectionStatus('disconnected');
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [instanceName]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">WhatsApp Connection</h3>
            <p className="text-sm text-gray-500 mt-1">Checking connection status...</p>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-green-500 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">WhatsApp Connection</h3>
          <p className="text-sm text-gray-500 mt-1">
            {connectionStatus === 'connected' 
              ? 'AI replies are active' 
              : 'Connect to enable AI replies'}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
          connectionStatus === 'connected' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' 
              ? 'bg-green-500 animate-pulse' 
              : 'bg-gray-400'
          }`}></div>
          <span className="text-xs font-semibold">
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {connectionStatus === 'connected' ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <i className="fas fa-check text-white text-lg"></i>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-900 text-sm">WhatsApp Connected</p>
              <p className="text-xs text-green-700">Instance: {instanceName}</p>
            </div>
          </div>
          
          {!confirmingLogout ? (
            <button
              onClick={() => setConfirmingLogout(true)}
              disabled={isLoading}
              className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-xl border border-red-200 hover:bg-red-100 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2"
            >
              <i className="fas fa-plug-circle-xmark"></i>
              Disconnect Number
            </button>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-sm text-red-700 font-medium">
                  ⚠️ This will stop all AI replies. Are you sure?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingLogout(false)}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={disconnectInstance}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-semibold text-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Disconnecting...
                    </div>
                  ) : (
                    'Yes, Disconnect'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => {
            impactLight();
            setShowConnectModal(true);
            setIsConnecting(true);
          }}
          disabled={isLoading}
          className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/30"
        >
          <i className="fab fa-whatsapp text-lg"></i>
          Connect WhatsApp Number
        </button>
      )}

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900">Connect WhatsApp</h3>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setIsConnecting(false);
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <i className="fas fa-times text-gray-500"></i>
              </button>
            </div>
            
            <div className="p-6">
              <WhatsAppConnect 
                instanceName={instanceName}
                onConnected={handleConnectSuccess}
                autoStart={isConnecting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}