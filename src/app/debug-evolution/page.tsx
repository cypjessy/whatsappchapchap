"use client";

import { useState, useEffect } from "react";
import { getConnectionState, getQRCode } from "@/lib/evolution";

export default function EvolutionDiagnostic() {
  const [instanceName, setInstanceName] = useState("");
  const [status, setStatus] = useState<any>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = async () => {
    if (!instanceName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Checking connection state...");
      const state = await getConnectionState(instanceName);
      console.log("Connection state:", state);
      setStatus(state);
      
      if (state?.instance?.state === "open") {
        setError("✅ Instance is already connected!");
      } else if (state?.instance?.state === "close") {
        setError("❌ Instance is disconnected. Need to reconnect.");
      }
    } catch (err: any) {
      console.error("Error checking state:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getQR = async () => {
    if (!instanceName) return;
    
    setLoading(true);
    setError(null);
    setQrCode(null);
    
    try {
      console.log("Getting QR code...");
      const qr = await getQRCode(instanceName);
      console.log("QR Code response:", qr);
      
      if (qr?.base64) {
        const base64Value = qr.base64.startsWith("data:image")
          ? qr.base64
          : `data:image/png;base64,${qr.base64}`;
        setQrCode(base64Value);
        setError("Scan this QR code within 60 seconds!");
      } else if (qr?.code || qr?.pairingCode) {
        const code = qr.code || qr.pairingCode || "";
        setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=500x500&margin=10&data=${encodeURIComponent(code)}`);
        setError("Scan this QR code within 60 seconds!");
      } else {
        setError("No QR code received. Instance may already be connected.");
      }
    } catch (err: any) {
      console.error("Error getting QR:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">🔧 Evolution API Diagnostic</h1>
        
        <div className="space-y-6">
          {/* Instance Name Input */}
          <div>
            <label className="block font-semibold mb-2">Instance Name:</label>
            <input
              type="text"
              value={instanceName}
              onChange={(e) => setInstanceName(e.target.value)}
              placeholder="tenant_abc123"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={checkConnection}
              disabled={loading || !instanceName}
              className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Check Status"}
            </button>
            <button
              onClick={getQR}
              disabled={loading || !instanceName}
              className="flex-1 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Get QR Code"}
            </button>
          </div>

          {/* Status Display */}
          {status && (
            <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <h3 className="font-bold mb-2">Connection Status:</h3>
              <pre className="text-sm overflow-auto bg-white p-3 rounded-lg">
                {JSON.stringify(status, null, 2)}
              </pre>
            </div>
          )}

          {/* QR Code Display */}
          {qrCode && (
            <div className="text-center">
              <h3 className="font-bold mb-4">QR Code:</h3>
              <img src={qrCode} alt="QR Code" className="mx-auto max-w-sm rounded-xl shadow-lg" />
              <p className="mt-4 text-sm text-gray-600">
                ⏱️ Scan within 60 seconds before it expires!
              </p>
            </div>
          )}

          {/* Error/Status Messages */}
          {error && (
            <div className={`p-4 rounded-xl ${error.includes("✅") ? "bg-green-100 text-green-800" : error.includes("❌") ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <h3 className="font-bold mb-2 text-blue-900">🔍 Troubleshooting Tips:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Make sure Evolution API server is running</li>
              <li>Check if the URL is accessible in browser</li>
              <li>QR codes expire after 60 seconds - scan quickly</li>
              <li>If already connected, logout first then reconnect</li>
              <li>WhatsApp requires stable internet connection</li>
              <li>Try restarting your WhatsApp app</li>
            </ul>
          </div>

          {/* Evolution API Config */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-bold mb-2">Current Evolution API URL:</h3>
            <code className="text-sm bg-white px-3 py-2 rounded block break-all">
              http://evo-xi7da27bck86s6jwe25w0zt4.173.249.50.98.sslip.io
            </code>
            <p className="text-xs text-gray-600 mt-2">
              ⚠️ Using HTTP (Evolution server doesn't have valid SSL certificate)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
