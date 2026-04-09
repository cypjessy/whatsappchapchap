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

export async function GET(req: NextRequest) {
  const tenantId = req.nextUrl.searchParams.get("tenantId");
  const phone = req.nextUrl.searchParams.get("phone");
  
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const db = getAdminDb();
  
  const [settingsSnap, productsSnap, customersSnap, ordersSnap, reviewsSnap, campaignsSnap, inventorySnap] = await Promise.all([
    db.collection("settings").doc(tenantId).get(),
    db.collection("products").where("tenantId", "==", tenantId).get(),
    db.collection("customers").where("tenantId", "==", tenantId).get(),
    db.collection("orders").where("tenantId", "==", tenantId).limit(50).get(),
    db.collection("reviews").where("tenantId", "==", tenantId).limit(20).get(),
    db.collection("campaigns").where("tenantId", "==", tenantId).get(),
    db.collection("inventory").where("tenantId", "==", tenantId).get(),
  ]);

  let messages = [];
  if (phone) {
    const phoneNum = phone.replace("@s.whatsapp.net", "");
    const messagesSnap = await db.collection("tenants").doc(tenantId).collection("conversations").doc(phoneNum).collection("messages").limit(20).get();
    messages = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  return NextResponse.json({
    settings: settingsSnap.exists() ? settingsSnap.data() : null,
    products: productsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    customers: customersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    orders: ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    reviews: reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    campaigns: campaignsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    inventory: inventorySnap.docs.map(d => ({ id: d.id, ...d.data() })),
    messages,
  });
}
