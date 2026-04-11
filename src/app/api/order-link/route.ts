import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productIds, quantities, customerPhone, customerName, notes } = await req.json();

    if (!productIds || productIds.length === 0) {
      return NextResponse.json({ error: "No products specified" }, { status: 400 });
    }

    const db = getAdminDb();
    
    // Get tenant from the token
    let userId: string;
    try {
      const adminAuth = require("firebase-admin/auth");
      const decodedToken = await adminAuth.getAuth().verifyIdToken(authHeader.split("Bearer ")[1]);
      userId = decodedToken.uid;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const tenantId = `tenant_${userId}`;
    
    // Get product details from Firestore
    const productSnap = await db.collection("products")
      .where("tenantId", "==", tenantId)
      .where("__name__", "in", productIds)
      .get();

    const products = productSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Create order session in Firestore
    const sessionRef = db.collection("orderSessions").doc();
    const sessionData = {
      id: sessionRef.id,
      tenantId,
      products: products.map((p: any, idx: number) => ({
        productId: p.id,
        name: p.name,
        price: p.price,
        image: p.image,
        quantity: quantities?.[idx] || 1,
      })),
      customerPhone: customerPhone || null,
      customerName: customerName || null,
      notes: notes || null,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    await sessionRef.set(sessionData);

    // Generate the order link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const orderLink = `${baseUrl}/order/${sessionRef.id}`;

    // Generate shareable message
    const productList = products.map((p: any, idx: number) => 
      `${p.name} x${quantities?.[idx] || 1} - KES ${(p.price * (quantities?.[idx] || 1)).toLocaleString()}`
    ).join("\n• ");

    const totalAmount = products.reduce((sum: number, p: any, idx: number) => 
      sum + (p.price * (quantities?.[idx] || 1)), 0
    );

    const shareText = encodeURIComponent(
      `🛒 *Order Summary*\n\n• ${productList}\n\n*Total: KES ${totalAmount.toLocaleString()}*\n\nClick to confirm your order:\n${orderLink}`
    );

    return NextResponse.json({
      success: true,
      sessionId: sessionRef.id,
      orderLink,
      shareLink: `https://wa.me/${customerPhone}?text=${shareText}`,
      products: sessionData.products,
      total: totalAmount,
    });
  } catch (error) {
    console.error("Generate order link error:", error);
    return NextResponse.json({ error: "Failed to generate order link" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    const sessionSnap = await db.collection("orderSessions").doc(sessionId).get();

    if (!sessionSnap.exists) {
      return NextResponse.json({ error: "Order session not found" }, { status: 404 });
    }

    const sessionData = sessionSnap.data();
    
    // Check if expired
    if (new Date(sessionData?.expiresAt) < new Date()) {
      return NextResponse.json({ error: "Order link expired" }, { status: 410 });
    }

    return NextResponse.json({
      id: sessionSnap.id,
      ...sessionData,
    });
  } catch (error) {
    console.error("Get order session error:", error);
    return NextResponse.json({ error: "Failed to get order session" }, { status: 500 });
  }
}
