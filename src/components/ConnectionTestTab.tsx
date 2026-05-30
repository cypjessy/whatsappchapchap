"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConnectionTestResult {
  configured: boolean;
  envVars: {
    apiUrl: boolean;
    apiKey: boolean;
  };
  urlPreview: string | null;
  connection: {
    success: boolean;
    status?: number;
    message: string;
    error?: string;
  };
}

type TestStatus = "idle" | "testing" | "success" | "error";

// ─── Mask Helper ──────────────────────────────────────────────────────────────

function maskValue(value: string): string {
  if (!value || value.length < 8) return value;
  return `${value.slice(0, 4)}••••••••${value.slice(-4)}`;
}

// ─── StatusBadge Component ───────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
      ok
        ? "bg-[#d1fae5]/60 text-[#065f46]"
        : "bg-[#fef2f2]/60 text-[#991b1b]"
    }`}>
      <i className={`fas fa-${ok ? "check-circle" : "exclamation-circle"} text-[8px]`} />
      {label || (ok ? "OK" : "Error")}
    </span>
  );
}

// ─── EnvVarRow Component ─────────────────────────────────────────────────────

function EnvVarRow({ name, present }: { name: string; present: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-outline-variant/50 last:border-0">
      <span className="text-xs text-on-surface-variant font-mono">{name}</span>
      <span className={`flex items-center gap-1.5 text-xs font-bold ${
        present ? "text-[#10b981]" : "text-[#ef4444]"
      }`}>
        <i className={`fas fa-${present ? "check" : "times"} text-[8px]`} />
        {present ? "Set" : "Missing"}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConnectionTestTab() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TestStatus>("idle");
  const [result, setResult] = useState<ConnectionTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    setStatus("testing");
    setError(null);
    setResult(null);

    try {
      const token = await user?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/diagnostics/evolution", { headers });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data: ConnectionTestResult = await res.json();
      setResult(data);
      setStatus(data.connection?.success ? "success" : "error");
    } catch (err: any) {
      setError(err?.message || String(err));
      setStatus("error");
    }
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Info Banner */}
      <div className="p-4 md:p-5 rounded-xl bg-gradient-to-r from-[#25D366]/5 to-[#128C7E]/5 border-l-4 border-[#25D366]">
        <div className="flex items-start gap-3">
          <i className="fab fa-whatsapp text-xl md:text-2xl text-[#25D366] mt-0.5" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-on-surface mb-0.5">Evolution API Connection Test</h3>
            <p className="text-xs text-on-surface-variant">
              Test the connection to your Evolution API server. This checks that the environment variables
              are configured correctly and the server is reachable.
            </p>
          </div>
        </div>
      </div>

      {/* Test Button */}
      <div className="flex justify-center">
        <button
          onClick={runTest}
          disabled={status === "testing"}
          className={`
            flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-sm
            transition-all duration-200 active:scale-95
            ${status === "testing"
              ? "bg-surface-variant text-outline cursor-not-allowed"
              : "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            }
          `}
        >
          {status === "testing" ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <i className="fas fa-plug text-sm" />
              {status === "idle" ? "Test Connection" : "Test Again"}
            </>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-xl">
          <div className="flex items-start gap-3">
            <i className="fas fa-exclamation-triangle text-[#ef4444] text-sm mt-0.5" />
            <div>
              <p className="text-sm font-bold text-[#991b1b]">Connection Test Failed</p>
              <p className="text-xs text-[#b91c1c] mt-1 font-mono break-all">{error}</p>
              <p className="text-xs text-[#b91c1c] mt-2">
                Make sure you are logged in and the Vercel deployment is running. Check that
                <code className="mx-1 px-1.5 py-0.5 bg-[#fecaca] rounded text-[11px]">EVOLUTION_API_URL</code>
                and
                <code className="mx-1 px-1.5 py-0.5 bg-[#fecaca] rounded text-[11px]">EVOLUTION_API_KEY</code>
                are set in your environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Card */}
      {result && (
        <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden">
          {/* Header */}
          <div className={`p-5 ${
            result.connection?.success
              ? "bg-gradient-to-r from-[#d1fae5]/40 to-[#a7f3d0]/40"
              : "bg-gradient-to-r from-[#fef2f2]/40 to-[#fecaca]/40"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  result.connection?.success
                    ? "bg-[#d1fae5] text-[#065f46]"
                    : "bg-[#fef2f2] text-[#991b1b]"
                }`}>
                  <i className={`fas fa-${
                    result.connection?.success ? "check-circle" : "exclamation-circle"
                  } text-lg`} />
                </div>
                <div>
                  <h4 className="font-bold text-base text-on-surface">
                    {result.connection?.success ? "Connected Successfully" : "Connection Failed"}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {result.connection?.message || "No details available"}
                  </p>
                </div>
              </div>
              {result.connection?.status && (
                <div className="text-right">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">HTTP Status</div>
                  <div className={`font-mono font-bold text-sm ${
                    (result.connection.status >= 200 && result.connection.status < 300)
                      ? "text-[#065f46]"
                      : "text-[#991b1b]"
                  }`}>
                    {result.connection.status}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="p-5 space-y-5">
            {/* Environment Variables */}
            <div>
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                <i className="fas fa-cog text-[9px]" />
                Environment Variables
              </h5>
              <div className="bg-surface-container-lowest rounded-xl p-3">
                <EnvVarRow name="API URL" present={result.envVars?.apiUrl} />
                <EnvVarRow name="API Key" present={result.envVars?.apiKey} />
              </div>
            </div>

            {/* Configuration Status */}
            <div>
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                <i className="fas fa-check-double text-[9px]" />
                Configuration
              </h5>
              <div className="bg-surface-container-lowest rounded-xl p-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs text-on-surface-variant">All Variables Set</span>
                  <StatusBadge ok={result.configured} label={result.configured ? "Yes" : "No"} />
                </div>
                {!result.configured && (
                  <p className="text-[10px] text-[#991b1b] mt-1">
                    Both EVOLUTION_API_URL and EVOLUTION_API_KEY must be set in your server environment variables.
                  </p>
                )}
              </div>
            </div>

            {/* Connection Test */}
            <div>
              <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                <i className="fas fa-wifi text-[9px]" />
                Connection Test
              </h5>
              <div className="bg-surface-container-lowest rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-on-surface-variant">Status</span>
                  <StatusBadge
                    ok={!!result.connection?.success}
                    label={result.connection?.success ? "Connected" : "Failed"}
                  />
                </div>
                <p className="text-xs text-on-surface-variant">{result.connection?.message}</p>
                {result.connection?.error && (
                  <div className="p-2.5 bg-[#fef2f2] rounded-lg text-[10px] text-[#991b1b] font-mono break-all mt-1">
                    <i className="fas fa-bug mr-1.5" />
                    {result.connection.error}
                  </div>
                )}
              </div>
            </div>

            {/* Server URL */}
            {result.urlPreview && (
              <div>
                <h5 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-2">
                  <i className="fas fa-link text-[9px]" />
                  Server URL
                </h5>
                <div className="bg-surface-container-lowest rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <i className="fas fa-server text-outline" />
                    <span className="text-outline truncate">{result.urlPreview}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-outline-variant/50 bg-surface-container-lowest/50">
            <p className="text-[10px] text-on-surface-variant flex items-center gap-2">
              <i className="fas fa-clock" />
              Test completed — results reflect the current server-side configuration
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
