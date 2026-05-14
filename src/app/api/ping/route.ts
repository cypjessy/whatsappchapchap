// Lightweight endpoint to keep WebView alive during idle periods
export async function GET() {
  return Response.json({ ok: true, timestamp: Date.now() });
}
