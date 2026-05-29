import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, params, 'DELETE');
}

async function proxyRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: string
) {
  const { path } = await paramsPromise;
  const evolutionApiUrl = process.env.EVOLUTION_API_URL || '';
  const evolutionApiKey = process.env.EVOLUTION_API_KEY || '';
  const xApiKey = request.headers.get('x-api-key') || evolutionApiKey;

  if (!evolutionApiUrl) {
    return NextResponse.json(
      { error: 'Evolution API URL not configured' },
      { status: 500 }
    );
  }

  // Build the target URL: EVOLUTION_API_URL/api/[...path]
  const pathStr = path.join('/');
  const queryString = request.nextUrl.search;
  const targetUrl = `${evolutionApiUrl.replace(/\/$/, '')}/api/${pathStr}${queryString}`;

  try {
    // Forward the request body for methods that support it
    let body: BodyInit | undefined = undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: xApiKey,
      },
      body,
    });

    // Try to parse as JSON, fall back to text
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } else {
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: { 'content-type': contentType },
      });
    }
  } catch (error) {
    console.error('[Evolution Proxy] Error forwarding request:', error);
    return NextResponse.json(
      { error: 'Failed to reach Evolution API', details: String(error) },
      { status: 502 }
    );
  }
}
