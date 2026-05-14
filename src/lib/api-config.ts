/**
 * API Configuration for Mobile and Web
 * 
 * This utility helps manage API endpoints for both web and mobile (Capacitor) builds.
 * In mobile builds, API calls need to point to a deployed backend server.
 */

// Get the API base URL from environment or use relative path for web
const getApiBaseUrl = (): string => {
  // For Capacitor mobile builds, use the configured API URL
  if (typeof window !== 'undefined') {
    // Check if running in Capacitor
    const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
    
    if (isCapacitor) {
      // Use production API URL for mobile
      return process.env.NEXT_PUBLIC_API_URL || '';
    }
  }
  
  // For web development/production, use relative paths
  return '';
};

/**
 * Make an API request with proper base URL handling
 */
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
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
