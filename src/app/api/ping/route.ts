import { NextResponse } from "next/server";

/**
 * Ping endpoint — lightweight health check used by the app's keep-alive mechanism
 * to prevent the Capacitor WebView JavaScript context from sleeping during idle periods.
 * 
 * This endpoint intentionally returns minimal data to stay as lightweight as possible
 * since it's called every 2 minutes by useAppLifecycle.ts.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
