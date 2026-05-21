import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      evolutionServerUrl, 
      evolutionInstanceId, 
      customerPhone, 
      message 
    } = body;

    // Validate required fields
    if (!evolutionServerUrl || !evolutionInstanceId || !customerPhone || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get API key from environment variable (server-side only)
    const apiKey = process.env.EVOLUTION_API_KEY;
    
    if (!apiKey) {
      console.error('EVOLUTION_API_KEY not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Send WhatsApp message via Evolution API
    const response = await fetch(
      `${evolutionServerUrl}/message/sendText/${evolutionInstanceId}`,
      {
        method: 'POST',
        headers: {
          apikey: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: customerPhone,
          text: message,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Evolution API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('Error in notify-cart API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
