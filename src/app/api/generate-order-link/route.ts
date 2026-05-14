import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    
    let userId: string;
    try {
      const adminAuth = require("firebase-admin/auth");
      const decodedToken = await adminAuth.getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { productId, quantity, phone, size } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const tenantId = `tenant_${userId}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://whatsappchapchap.vercel.app";

    // Build the order link with query parameters
    let orderLink = `${baseUrl}/order?tenant=${tenantId}&product=${productId}`;
    
    if (quantity && quantity > 1) {
      orderLink += `&quantity=${quantity}`;
    }
    
    if (phone) {
      orderLink += `&phone=${encodeURIComponent(phone)}`;
    }
    
    if (size) {
      orderLink += `&size=${encodeURIComponent(size)}`;
    }

    return NextResponse.json({
      success: true,
      orderLink,
    });
  } catch (error) {
    console.error("Generate order link error:", error);
    return NextResponse.json({ error: "Failed to generate link" }, { status: 500 });
  }
}
