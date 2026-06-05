import { NextResponse } from 'next/server';

export async function GET() {
  const apiUrl = process.env.EVOLUTION_API_URL || '';
  const apiKey = process.env.EVOLUTION_API_KEY || '';

  const envVars = {
    apiUrl: !!apiUrl,
    apiKey: !!apiKey,
  };

  const allConfigured = envVars.apiUrl && envVars.apiKey;

  // Connection test
  let connectionTest: {
    success: boolean;
    status?: number;
    message: string;
    error?: string;
  } = { success: false, message: 'Not attempted' };

  if (allConfigured) {
    try {
      const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

      // Try to fetch instances — this confirms the URL is reachable and the key works
      const response = await fetch(`${baseUrl}/instance/fetchInstances`, {
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const data = await response.json();
        const instanceCount = Array.isArray(data) ? data.length : 0;
        connectionTest = {
          success: true,
          status: response.status,
          message: `Connected successfully! Found ${instanceCount} instance(s)`,
        };
      } else if (response.status === 401 || response.status === 403) {
        connectionTest = {
          success: false,
          status: response.status,
          message: 'Authentication failed — check your API key',
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      } else {
        // Try a simpler endpoint: the base API health
        try {
          const healthResponse = await fetch(baseUrl, {
            signal: AbortSignal.timeout(10000),
          });
          connectionTest = {
            success: healthResponse.ok,
            status: healthResponse.status,
            message: healthResponse.ok
              ? 'Server reachable but fetchInstances failed'
              : `Server returned HTTP ${healthResponse.status}`,
            error: `fetchInstances returned ${response.status}, health check returned ${healthResponse.status}`,
          };
        } catch {
          connectionTest = {
            success: false,
            status: response.status,
            message: `Server responded with HTTP ${response.status}`,
            error: response.statusText,
          };
        }
      }
    } catch (netError: any) {
      if (netError?.name === 'TimeoutError' || netError?.message?.includes('timed out')) {
        connectionTest = {
          success: false,
          message: 'Connection timed out — check that the URL is correct and the server is running',
          error: netError.message,
        };
      } else {
        connectionTest = {
          success: false,
          message: 'Could not reach the Evolution API server',
          error: netError?.message || String(netError),
        };
      }
    }
  }

  return NextResponse.json({
    configured: allConfigured,
    envVars,
    urlPreview: apiUrl ? apiUrl.substring(0, 40) + (apiUrl.length > 40 ? '...' : '') : null,
    connection: connectionTest,
  });
}
