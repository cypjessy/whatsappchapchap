/**
 * API Configuration for Mobile and Web
 * 
 * This utility helps manage API endpoints for both web and mobile (Capacitor) builds.
 * In mobile builds, API calls need to point to a deployed backend server.
 * In web builds, relative paths work fine since frontend and API are on the same domain.
 */

/**
 * Default deployed backend URL used as fallback when running on Android (Capacitor)
 * but NEXT_PUBLIC_API_URL is not set. This matches the default Vercel deployment.
 */
const DEFAULT_DEPLOYED_URL = 'https://whatsappchapchap.vercel.app';

/**
 * Get the API base URL for the current environment.
 * - In Capacitor (Android/iOS): uses NEXT_PUBLIC_API_URL to reach the deployed backend
 *   Falls back to DEFAULT_DEPLOYED_URL if NEXT_PUBLIC_API_URL is not set
 * - In web: returns empty string (relative paths work)
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // ─── Diagnostic: Log environment info ───────────────────────────────────────
    console.log('[API Config] === DIAGNOSTIC START ===');
    console.log('[API Config] Location:', window.location.href);
    console.log('[API Config] Protocol:', window.location.protocol);
    console.log('[API Config] User Agent:', navigator.userAgent?.substring(0, 150));
    console.log('[API Config] Capacitor global:', !!(window as any).Capacitor);
    console.log('[API Config] Capacitor.isNativePlatform:', typeof (window as any).Capacitor?.isNativePlatform);
    console.log('[API Config] CapacitorPlatforms:', !!(window as any).CapacitorPlatforms);
    console.log('[API Config] NEXT_PUBLIC_API_URL (build-time):', process.env.NEXT_PUBLIC_API_URL || '(not set)');

    // Check if running in Capacitor native platform
    const check1 = !!(window as any).Capacitor?.isNativePlatform?.();
    const check2 = (window as any).CapacitorPlatforms?.currentPlatform === 'android';
    const check3 = (window as any).CapacitorPlatforms?.currentPlatform === 'ios';
    const check4 = window.location.protocol === 'capacitor:';
    const check5 = window.location.protocol === 'http-extension:';
    const isCapacitor = check1 || check2 || check3 || check4 || check5;

    console.log('[API Config] Capacitor checks:', { check1, check2, check3, check4, check5, isCapacitor });
    
    if (isCapacitor) {
      const configuredUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('[API Config] isCapacitor=true, configuredUrl:', configuredUrl || '(not set)');
      
      if (configuredUrl) {
        console.log('[API Config] Using configured URL:', configuredUrl);
        return configuredUrl;
      }
      // NEXT_PUBLIC_API_URL not set at build time - use default fallback
      console.warn(
        '[API Config] NEXT_PUBLIC_API_URL not set for Capacitor build. ' +
        `Falling back to default: ${DEFAULT_DEPLOYED_URL}. ` +
        'Set NEXT_PUBLIC_API_URL in .env.local for production builds.'
      );
      console.log('[API Config] Using fallback URL:', DEFAULT_DEPLOYED_URL);
      return DEFAULT_DEPLOYED_URL;
    }
  }
  
  // For web development/production, use relative paths
  console.log('[API Config] Not Capacitor, using relative paths (empty base URL)');
  console.log('[API Config] === DIAGNOSTIC END ===');
  return '';
}

/**
 * Build a full API URL by prepending the base URL if needed.
 * Handles leading slash and trailing slash consistently.
 * 
 * Trailing slashes are required because the Vercel deployment has `trailingSlash: true`.
 * Without them, Vercel issues a 308 redirect that lacks CORS headers, breaking
 * cross-origin requests from the Capacitor Android WebView.
 * 
 * Example: buildApiUrl('/api/ping') => 'https://api.example.com/api/ping/' (Capacitor)
 *          buildApiUrl('/api/ping') => '/api/ping/' (web)
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  
  // Split query string from path to handle trailing slash correctly
  // The trailing slash must be added BEFORE the query string (e.g. /api/endpoint/?key=val)
  // so Vercel doesn't issue a CORS-breaking 308 redirect.
  const [pathPart, queryString] = path.split('?');
  const cleanPathPart = (pathPart.startsWith('/') ? pathPart : `/${pathPart}`).replace(/\/?$/, '/');
  const cleanPath = queryString != null ? `${cleanPathPart}?${queryString}` : cleanPathPart;
  
  if (!base) return cleanPath;
  return `${base.replace(/\/$/, '')}${cleanPath}`;
}

/**
 * Make an API request with proper base URL handling
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = buildApiUrl(endpoint);
  
  // Add default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * Helper for GET requests
 */
export const apiGet = async (endpoint: string) => {
  return apiFetch(endpoint, { method: 'GET' });
};

/**
 * Helper for POST requests
 */
export const apiPost = async (endpoint: string, data?: any) => {
  return apiFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Helper for PUT requests
 */
export const apiPut = async (endpoint: string, data?: any) => {
  return apiFetch(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
};

/**
 * Helper for DELETE requests
 */
export const apiDelete = async (endpoint: string) => {
  return apiFetch(endpoint, { method: 'DELETE' });
};

export default getApiBaseUrl;
