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

  const pathStr = path.join('/');
  const queryString = request.nextUrl.search;
  
  const baseUrl = evolutionApiUrl.endsWith('/') ? evolutionApiUrl.slice(0, -1) : evolutionApiUrl;

  const targetUrl = baseUrl + '/' + pathStr + queryString;

  console.log('[Evolution Proxy] Request:', method, pathStr, '->', targetUrl);

  try {
    let body: BodyInit | undefined = undefined;
    if (method === 'POST' || method === 'PUT') {
      body = await request.text();
    }

    let response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': xApiKey,
      },
      body,
    });

    if (response.status === 404) {
      const fallbackUrl = baseUrl + '/api/' + pathStr + queryString;
      console.log('[Evolution Proxy] 404 received, trying fallback ->', fallbackUrl);
      
      const fallbackResponse = await fetch(fallbackUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': xApiKey,
        },
        body,
      });
      
      if (fallbackResponse.status !== 404) {
        response = fallbackResponse;
      }
    }

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
