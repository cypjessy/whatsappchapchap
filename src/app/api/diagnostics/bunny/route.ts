import { NextResponse } from 'next/server';

export async function GET() {
  const storageHost = process.env.NEXT_PUBLIC_BUNNY_STORAGE_HOST || '';
  const storageZone = process.env.NEXT_PUBLIC_BUNNY_STORAGE_ZONE || '';
  const apiKey = process.env.BUNNY_API_KEY || '';
  const cdnUrl = process.env.NEXT_PUBLIC_BUNNY_CDN_URL || '';

  const envVars = {
    storageHost: !!storageHost,
    storageZone: !!storageZone,
    apiKey: !!apiKey,
    cdnUrl: !!cdnUrl,
  };

  const allConfigured = envVars.storageHost && envVars.storageZone && envVars.apiKey;

  // Connection test
  let connectionTest: {
    success: boolean;
    status?: number;
    message: string;
    error?: string;
  } = { success: false, message: 'Not attempted' };

  if (allConfigured) {
    try {
      // Bunny Storage API: GET https://{storageHost}/{storageZone}/ lists files
      const response = await fetch(`https://${storageHost}/${storageZone}/`, {
        headers: {
          AccessKey: apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        let fileCount = 0;
        try {
          const data = await response.json();
          fileCount = Array.isArray(data) ? data.length : 0;
        } catch {
          // Response might not be JSON
        }
        connectionTest = {
          success: true,
          status: response.status,
          message: `Connected successfully! Storage zone has ${fileCount} file(s)`,
        };
      } else if (response.status === 401 || response.status === 403) {
        connectionTest = {
          success: false,
          status: response.status,
          message: 'Authentication failed — check your Bunny API key',
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      } else if (response.status === 404) {
        connectionTest = {
          success: false,
          status: response.status,
          message: 'Storage zone not found — check your storage zone name',
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      } else {
        connectionTest = {
          success: false,
          status: response.status,
          message: `Server responded with HTTP ${response.status}`,
          error: response.statusText,
        };
      }
    } catch (netError: any) {
      if (netError?.name === 'TimeoutError' || netError?.message?.includes('timed out')) {
        connectionTest = {
          success: false,
          message: 'Connection timed out — check the storage host URL',
          error: netError.message,
        };
      } else {
        connectionTest = {
          success: false,
          message: 'Could not reach Bunny.net storage',
          error: netError?.message || String(netError),
        };
      }
    }
  }

  return NextResponse.json({
    configured: allConfigured,
    envVars,
    storageHost: storageHost || null,
    storageZone: storageZone || null,
    cdnUrl: cdnUrl || null,
    connection: connectionTest,
  });
}
