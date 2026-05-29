/**
 * Next.js Middleware - CORS Headers
 * 
 * Adds CORS headers to API responses so the Android (Capacitor) WebView
 * can make cross-origin requests to the deployed backend.
 * 
 * The Capacitor WebView loads from capacitor://localhost but needs to
 * call API routes on the deployed Vercel domain.
 */

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle preflight CORS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, apikey, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // For actual requests, add CORS headers to the response
  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key, apikey, Authorization');
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
