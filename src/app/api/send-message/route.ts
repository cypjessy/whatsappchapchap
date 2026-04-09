import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, phone, message } = body;

    if (!tenantId || !phone || !message) {
      return NextResponse.json(
        { error: "tenantId, phone, and message are required" },
        { status: 400 }
      );
    }

    const evolutionApiUrl = process.env.EVOLUTION_API_URL;
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;

    if (!evolutionApiUrl || !evolutionApiKey) {
      return NextResponse.json(
        { error: "Evolution API not configured" },
        { status: 500 }
      );
    }

    const cleanPhone = phone.replace("@s.whatsapp.net", "");

    const response = await fetch(
      `${evolutionApiUrl}/message/sendText/${tenantId}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: message,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Send Message API] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
