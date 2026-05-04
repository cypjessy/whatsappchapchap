import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const { phone, message, tenantId } = await req.json();
    
    if (!phone || !message || !tenantId) {
      return NextResponse.json(
        { error: "Missing required fields: phone, message, tenantId" }, 
        { status: 400 }
      );
    }

    // Check if Firebase Admin is initialized
    if (!adminDb) {
      console.error("Firebase Admin SDK not initialized. Check environment variables.");
      return NextResponse.json(
        { error: "Firebase Admin SDK not configured" }, 
        { status: 500 }
      );
    }

    // Get tenant data from Firestore using Admin SDK
    const tenantDoc = await adminDb.collection('tenants').doc(tenantId).get();
    
    if (!tenantDoc.exists) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    
    const tenant = tenantDoc.data();
    
    if (!tenant) {
      return NextResponse.json({ error: "Tenant data is empty" }, { status: 500 });
    }
    
    // Check if Evolution API is configured
    if (!tenant.evolutionServerUrl || !tenant.evolutionApiKey || !tenant.evolutionInstanceId) {
      console.error("Evolution API not configured for tenant:", tenantId, {
        hasServerUrl: !!tenant.evolutionServerUrl,
        hasApiKey: !!tenant.evolutionApiKey,
        hasInstanceId: !!tenant.evolutionInstanceId
      });
      return NextResponse.json(
        { error: "Evolution API not configured for this tenant" }, 
        { status: 500 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.startsWith("254") ? cleanPhone : "254" + cleanPhone.slice(-9);
    
    // Call Evolution API server-side
    const evolutionUrl = `${tenant.evolutionServerUrl}/message/sendText/${tenant.evolutionInstanceId}`;
    
    console.log(`📤 Sending WhatsApp to ${fullPhone} via Evolution API`);
    console.log(`🔗 Evolution URL: ${evolutionUrl}`);
    
    const response = await fetch(evolutionUrl, {
      method: "POST",
      headers: {
        apikey: tenant.evolutionApiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        number: fullPhone, 
        text: message 
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("❌ Evolution API error:", response.status, JSON.stringify(data));
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
