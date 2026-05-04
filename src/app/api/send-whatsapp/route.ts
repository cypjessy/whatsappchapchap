import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message, tenantId, evolutionConfig } = body;
    
    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing required fields: phone, message" }, 
        { status: 400 }
      );
    }

    // Use Evolution config from client (tenant-specific credentials)
    // This avoids needing Firebase Admin SDK on the server
    let evolutionUrl, evolutionApiKey, evolutionInstanceId;
    
    if (evolutionConfig) {
      // Client passed tenant's Evolution credentials directly
      evolutionUrl = evolutionConfig.evolutionServerUrl?.replace(/\/$/, ''); // Remove trailing slash
      evolutionApiKey = evolutionConfig.evolutionApiKey;
      evolutionInstanceId = evolutionConfig.evolutionInstanceId;
      console.log('📦 Received evolutionConfig from client:', {
        url: evolutionUrl,
        hasApiKey: !!evolutionApiKey,
        instanceId: evolutionInstanceId
      });
    } else {
      // Fallback to environment variables (single Evolution instance)
      evolutionUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
      evolutionApiKey = process.env.EVOLUTION_API_KEY;
      evolutionInstanceId = tenantId; // Use tenantId as instance ID
      console.log(' Using environment variables for Evolution config');
    }
    
    if (!evolutionUrl || !evolutionApiKey || !evolutionInstanceId) {
      return NextResponse.json(
        { error: "Evolution API credentials not configured" }, 
        { status: 500 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    
    // Call Evolution API server-side
    const apiUrl = `${evolutionUrl}/message/sendText/${evolutionInstanceId}`;
    
    console.log(` Sending WhatsApp to ${fullPhone} via Evolution API`);
    console.log(` Full Evolution URL: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        apikey: evolutionApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        number: fullPhone, 
        text: message 
      }),
    });
    
    // Handle non-JSON responses from Evolution API
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      console.error(" Evolution API returned non-JSON response:", textResponse.substring(0, 200));
      return NextResponse.json(
        { 
          error: "Evolution API returned invalid response",
          status: response.status,
          response: textResponse.substring(0, 200)
        }, 
        { status: 500 }
      );
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error(" Evolution API error:", response.status, JSON.stringify(data));
      return NextResponse.json(
        { error: data, status: response.status }, 
        { status: response.status }
      );
    }
    
    console.log("✅ WhatsApp sent successfully via Evolution API");
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: String(error) }, 
      { status: 500 }
    );
  }
}
