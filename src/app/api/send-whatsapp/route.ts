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

    // Call Evolution API server-side (same method as webhook)
    const evolutionUrl = evolutionConfig?.evolutionServerUrl?.replace(/\/$/, '') || process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
    const evolutionApiKey = evolutionConfig?.evolutionApiKey || process.env.EVOLUTION_API_KEY;
    const instanceName = evolutionConfig?.evolutionInstanceId || tenantId;
    
    if (!evolutionUrl || !evolutionApiKey || !instanceName) {
      return NextResponse.json(
        { error: "Evolution API credentials not configured" }, 
        { status: 500 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    
    // Use same endpoint as webhook route
    const apiUrl = `${evolutionUrl}/message/sendText/${instanceName}`;
    
    console.log(`[Send WhatsApp] Sending to ${fullPhone}`);
    console.log(`[Send WhatsApp] URL: ${apiUrl}`);
    console.log(`[Send WhatsApp] Instance: ${instanceName}`);
    
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
      console.error("[Send WhatsApp] Evolution API returned non-JSON response:");
      console.error("   Status:", response.status);
      console.error("   Content-Type:", contentType);
      console.error("   Response (first 500 chars):", textResponse.substring(0, 500));
      console.error("   URL:", apiUrl);
      console.error("   Instance:", instanceName);
      return NextResponse.json(
        { 
          error: "Evolution API returned invalid response",
          status: response.status,
          response: textResponse.substring(0, 200),
          url: apiUrl,
          instanceId: instanceName
        }, 
        { status: 500 }
      );
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("[Send WhatsApp] Evolution API error response:");
      console.error("   Status:", response.status);
      console.error("   Data:", JSON.stringify(data));
      return NextResponse.json(
        { error: data, status: response.status }, 
        { status: response.status }
      );
    }
    
    console.log("[Send WhatsApp] ✅ WhatsApp sent successfully via Evolution API");
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return NextResponse.json(
      { error: String(error) }, 
      { status: 500 }
    );
  }
}
