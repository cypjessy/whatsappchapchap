import { NextRequest, NextResponse } from "next/server";

const DEFAULT_API_URL = process.env.EVOLUTION_API_URL || "";
const DEFAULT_API_KEY = process.env.EVOLUTION_API_KEY || "";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = req.headers.get("x-api-key") || DEFAULT_API_KEY;
  const apiUrl = req.nextUrl.searchParams.get("apiUrl") || DEFAULT_API_URL;
  // Forward query params (except apiUrl which is for the proxy)
  const queryParams = new URLSearchParams();
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key !== "apiUrl") queryParams.set(key, value);
  });
  return proxyRequest(path, "GET", apiKey, apiUrl, undefined, queryParams);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = req.headers.get("x-api-key") || DEFAULT_API_KEY;
  const apiUrl = req.nextUrl.searchParams.get("apiUrl") || DEFAULT_API_URL;
  const body = await req.json();
  return proxyRequest(path, "POST", apiKey, apiUrl, body);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const apiKey = req.headers.get("x-api-key") || DEFAULT_API_KEY;
  const apiUrl = req.nextUrl.searchParams.get("apiUrl") || DEFAULT_API_URL;
  return proxyRequest(path, "DELETE", apiKey, apiUrl);
}

async function proxyRequest(path: string[], method: string, apiKey: string, apiUrl: string, body?: any, queryParams?: URLSearchParams) {
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
  const queryString = queryParams && queryParams.toString() ? `?${queryParams.toString()}` : "";
  const url = `${apiUrl.replace(/\/$/, "")}/${endpoint}${queryString}`;
  console.log(`[Evolution API Proxy] ${method} ${url}`);
  console.log(`[Evolution API Proxy] Using API Key:`, apiKey.substring(0, 8) + "...");

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
    console.log(`[Evolution API Proxy] Response:`, data);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Evolution API Proxy] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 500 }
    );
  }
}
