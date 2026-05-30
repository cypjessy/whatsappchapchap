"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api-config";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DiagnosticsResult {
  configured: boolean;
  envVars: Record<string, boolean>;
  [key: string]: any;
}

interface ServiceStatus {
  testing: boolean;
  result: DiagnosticsResult | null;
  error: string | null;
}

type ServiceName = "firebase" | "evolution" | "bunny";

// ─── Service Config ───────────────────────────────────────────────────────────

const SERVICE_CONFIG: Record<ServiceName, {
  label: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  endpoint: string;
  envLabels: Record<string, string>;
}> = {
  firebase: {
    label: "Firebase Admin SDK",
    description: "Server-side Firebase configuration for Firestore access",
    icon: "fa-fire",
    color: "#f59e0b",
    gradient: "from-[#f59e0b]/10 to-[#d97706]/10",
    endpoint: "/api/diagnostics/firebase",
    envLabels: {
      projectId: "Project ID",
      clientEmail: "Client Email",
      privateKey: "Private Key",
      preferRest: "GOOGLE_CLOUD_FIRESTORE_PREFER_REST",
    },
  },
  evolution: {
    label: "Evolution API",
    description: "WhatsApp API server for sending/receiving messages",
    icon: "fa-wifi",
    color: "#25D366",
    gradient: "from-[#25D366]/10 to-[#128C7E]/10",
    endpoint: "/api/diagnostics/evolution",
    envLabels: {
      apiUrl: "API URL",
      apiKey: "API Key",
    },
  },
  bunny: {
    label: "Bunny.net Storage",
    description: "CDN & storage for product/service images",
    icon: "fa-database",
    color: "#8b5cf6",
    gradient: "from-[#8b5cf6]/10 to-[#7c3aed]/10",
    endpoint: "/api/diagnostics/bunny",
    envLabels: {
      storageHost: "Storage Host",
      storageZone: "Storage Zone",
      apiKey: "API Key",
      cdnUrl: "CDN URL",
    },
  },
};

// ─── Helper Functions ─────────────────────────────────────────────────────────

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

// ─── ServiceCard Component ────────────────────────────────────────────────────

function ServiceCard({
  service,
  status,
  onTest,
}: {
  service: ServiceName;
  status: ServiceStatus;
  onTest: (service: ServiceName) => void;
}) {
  const config = SERVICE_CONFIG[service];
  const [expanded, setExpanded] = useState(false);

  const isConfigured = status.result?.configured;
  const isConnected = status.result?.initialization?.success || status.result?.connection?.success;

  return (
    <div className="bg-surface rounded-2xl border border-outline-variant shadow-sm overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className={`bg-gradient-to-r ${config.gradient} p-4 md:p-5`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <i className={`fas ${config.icon} text-base`} style={{ color: config.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm md:text-base text-on-surface">{config.label}</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{config.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {status.result && (
              <StatusBadge ok={!!isConnected} label={isConnected ? "Connected" : "Failed"} />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 md:p-5 space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTest(service)}
            disabled={status.testing}
            className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs
              transition-all duration-200 active:scale-95
              ${status.testing
                ? "bg-surface-variant text-outline cursor-not-allowed"
                : "bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }
            `}
          >
            {status.testing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <i className="fas fa-plug text-[10px]" />
                Test Connection
              </>
            )}
          </button>

          {status.result && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-2.5 rounded-xl font-bold text-xs text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              <i className={`fas fa-chevron-${expanded ? "up" : "down"} mr-1.5`} />
              {expanded ? "Less" : "Details"}
            </button>
          )}
        </div>

        {/* Error Message */}
        {status.error && (
          <div className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-xl">
            <div className="flex items-start gap-2">
              <i className="fas fa-exclamation-triangle text-[#ef4444] text-xs mt-0.5" />
              <div>
                <p className="text-xs font-bold text-[#991b1b]">Test Failed</p>
                <p className="text-[10px] text-[#b91c1c] mt-0.5">{status.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && status.result && (
          <div className="space-y-4 animate-fadeIn">
            {/* Env Vars */}
            <div>
              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Environment Variables
              </h4>
              <div className="bg-surface-container-lowest rounded-xl p-3">
                {Object.entries(config.envLabels).map(([key, label]) => (
                  <EnvVarRow
                    key={key}
                    name={label}
                    present={!!status.result?.envVars?.[key]}
                  />
                ))}
              </div>
            </div>

            {/* Firebase-specific details */}
            {service === "firebase" && (
              <>
                <div>
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Key Format Validation
                  </h4>
                  <div className="bg-surface-container-lowest rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">Format valid</span>
                      <StatusBadge ok={!!status.result?.keyFormat?.valid} label={status.result?.keyFormat?.valid ? "Valid" : "Invalid"} />
                    </div>
                    {status.result?.keyFormat?.message && (
                      <p className="text-[10px] text-on-surface-variant">{status.result.keyFormat.message}</p>
                    )}
                    {status.result?.keyFormat?.preview && (
                      <div className="flex items-center gap-2 text-[10px] font-mono bg-surface rounded-lg p-2">
                        <i className="fas fa-key text-outline" />
                        <span className="text-outline">Key preview: {maskValue(status.result.keyFormat.preview)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                    Initialization Status
                  </h4>
                  <div className="bg-surface-container-lowest rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">SDK Initialized</span>
                      <StatusBadge ok={!!status.result?.initialized} label={status.result?.initialized ? "Yes" : "No"} />
                    </div>
                    <p className="text-[10px] text-on-surface-variant">
                      {status.result?.initialization?.message || "Not tested"}
                    </p>
                    {status.result?.initialization?.error && (
                      <div className="p-2 bg-[#fef2f2] rounded-lg text-[10px] text-[#991b1b] font-mono break-all">
                        {status.result.initialization.error}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Evolution-specific details */}
            {service === "evolution" && (
              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Connection Test
                </h4>
                <div className="bg-surface-container-lowest rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Status</span>
                    <StatusBadge ok={!!status.result?.connection?.success} label={status.result?.connection?.success ? "Connected" : "Failed"} />
                  </div>
                  {status.result?.connection?.status && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">HTTP Status</span>
                      <span className="font-mono font-bold">{status.result.connection.status}</span>
                    </div>
                  )}
                  {status.result?.connection?.message && (
                    <p className="text-[10px] text-on-surface-variant">{status.result.connection.message}</p>
                  )}
                  {status.result?.connection?.error && (
                    <div className="p-2 bg-[#fef2f2] rounded-lg text-[10px] text-[#991b1b] font-mono break-all">
                      {status.result.connection.error}
                    </div>
                  )}
                  {status.result?.urlPreview && (
                    <div className="flex items-center gap-2 text-[10px] font-mono bg-surface rounded-lg p-2">
                      <i className="fas fa-link text-outline" />
                      <span className="text-outline truncate">{status.result.urlPreview}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bunny-specific details */}
            {service === "bunny" && (
              <div>
                <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                  Connection Test
                </h4>
                <div className="bg-surface-container-lowest rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-on-surface-variant">Status</span>
                    <StatusBadge ok={!!status.result?.connection?.success} label={status.result?.connection?.success ? "Connected" : "Failed"} />
                  </div>
                  {status.result?.connection?.status && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant">HTTP Status</span>
                      <span className="font-mono font-bold">{status.result.connection.status}</span>
                    </div>
                  )}
                  {status.result?.connection?.message && (
                    <p className="text-[10px] text-on-surface-variant">{status.result.connection.message}</p>
                  )}
                  {status.result?.connection?.error && (
                    <div className="p-2 bg-[#fef2f2] rounded-lg text-[10px] text-[#991b1b] font-mono break-all">
                      {status.result.connection.error}
                    </div>
                  )}
                  {status.result?.storageHost && (
                    <div className="flex items-center gap-2 text-[10px] font-mono bg-surface rounded-lg p-2">
                      <i className="fas fa-server text-outline" />
                      <span className="text-outline truncate">{status.result.storageHost}/{status.result.storageZone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntegrationsTab() {
  const { user } = useAuth();

  const [statuses, setStatuses] = useState<Record<ServiceName, ServiceStatus>>({
    firebase: { testing: false, result: null, error: null },
    evolution: { testing: false, result: null, error: null },
    bunny: { testing: false, result: null, error: null },
  });

  const runTest = useCallback(async (service: ServiceName) => {
    setStatuses(prev => ({
      ...prev,
      [service]: { ...prev[service], testing: true, error: null },
    }));

    try {
      const token = await user?.getIdToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await apiFetch(SERVICE_CONFIG[service].endpoint, { headers });
      const data = await res.json();

      setStatuses(prev => ({
        ...prev,
        [service]: { testing: false, result: data, error: null },
      }));
    } catch (err: any) {
      setStatuses(prev => ({
        ...prev,
        [service]: { testing: false, result: null, error: err?.message || String(err) },
      }));
    }
  }, [user]);

  const testAll = useCallback(async () => {
    await Promise.all([
      runTest("firebase"),
      runTest("evolution"),
      runTest("bunny"),
    ]);
  }, [runTest]);

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-[#8b5cf6]/5 to-[#7c3aed]/5 border-l-4 border-[#8b5cf6]">
        <div className="flex items-start gap-3">
          <i className="fas fa-stethoscope text-lg md:text-xl text-[#8b5cf6] mt-0.5" />
          <div>
            <h3 className="font-bold text-sm md:text-base text-on-surface mb-0.5">Service Diagnostics</h3>
            <p className="text-xs text-on-surface-variant">
              Test your integrations to make sure everything is configured correctly.
              These tests check server-side environment variables and attempt real connections to each service.
            </p>
          </div>
        </div>
      </div>

      {/* Test All Button */}
      <div className="flex justify-end">
        <button
          onClick={testAll}
          disabled={Object.values(statuses).some(s => s.testing)}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs
            transition-all duration-200 active:scale-95
            ${Object.values(statuses).some(s => s.testing)
              ? "bg-surface-variant text-outline cursor-not-allowed"
              : "bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            }
          `}
        >
          {Object.values(statuses).some(s => s.testing) ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Testing All...
            </>
          ) : (
            <>
              <i className="fas fa-play-circle" />
              Test All Connections
            </>
          )}
        </button>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 gap-5">
        <ServiceCard service="firebase" status={statuses.firebase} onTest={runTest} />
        <ServiceCard service="evolution" status={statuses.evolution} onTest={runTest} />
        <ServiceCard service="bunny" status={statuses.bunny} onTest={runTest} />
      </div>
    </div>
  );
}
