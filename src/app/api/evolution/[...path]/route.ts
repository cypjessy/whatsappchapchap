import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_URL = process.env.EVOLUTION_API_URL || "";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = req.headers.get("x-api-key") || "";
  const apiUrl = req.nextUrl.searchParams.get("apiUrl") || DEFAULT_API_URL;
  return proxyRequest(path, "GET", apiKey, apiUrl);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = req.headers.get("x-api-key") || "";
  const apiUrl = req.nextUrl.searchParams.get("apiUrl") || DEFAULT_API_URL;
  const body = await req.json();
  return proxyRequest(path, "POST", apiKey, apiUrl, body);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = req.headers.get("x-api-key") || "";
  const apiUrl = req.nextUrl.searchParams.get("apiUrl") || DEFAULT_API_URL;
  return proxyRequest(path, "DELETE", apiKey, apiUrl);
}

async function proxyRequest(path: string[], method: string, apiKey: string, apiUrl: string, body?: any) {
  if (!apiUrl) {
    return NextResponse.json(
      { error: "Evolution API URL not configured" },
      { status: 500 }
    );
  }
  
  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required" },
      { status: 401 }
    );
  }

  const endpoint = path.join("/");
  const url = `${apiUrl.replace(/\/$/, "")}/${endpoint}`;
  console.log(`Proxying ${method} request to: ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 500 }
    );
  }
}
