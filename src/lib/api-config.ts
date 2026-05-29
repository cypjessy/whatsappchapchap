/**
 * API Configuration for Mobile and Web
 * 
 * This utility helps manage API endpoints for both web and mobile (Capacitor) builds.
 * In mobile builds, API calls need to point to a deployed backend server.
 * In web builds, relative paths work fine since frontend and API are on the same domain.
 */

/**
 * Get the API base URL for the current environment.
 * - In Capacitor (Android/iOS): uses NEXT_PUBLIC_API_URL to reach the deployed backend
 * - In web: returns empty string (relative paths work)
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Check if running in Capacitor native platform
    const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
    
    if (isCapacitor) {
      return process.env.NEXT_PUBLIC_API_URL || '';
    }
  }
  
  // For web development/production, use relative paths
  return '';
}

/**
 * Build a full API URL by prepending the base URL if needed.
 * Handles leading slash consistently.
 * 
 * Example: buildApiUrl('/api/ping') => 'https://api.example.com/api/ping' (Capacitor)
 *          buildApiUrl('/api/ping') => '/api/ping' (web)
 */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) return path;
  // Remove leading slash from path if base already has it
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
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
