import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";

console.log("[Webhook] Module loaded");

export async function POST(req: NextRequest) {
  console.log("[Webhook] Received POST request");
  
  try {
    const body = await req.json();
    console.log("[Webhook] Raw body:", JSON.stringify(body));
    
    const event = body.event || body.type;
    const instance = body.instance || body.instanceName;
    
    console.log("[Webhook] Event:", event);
    console.log("[Webhook] Instance:", instance);

    if (!instance) {
      console.log("[Webhook] No instance found in request");
      return NextResponse.json({ received: true, error: "No instance" });
    }

    // Check for different message event formats
    let messageData = null;
    let fromMe = false;
    let remoteJid = "";
    let messageText = "";
    let senderName = "";

    // Format 1: Evolution API v2
    if (body.data?.key) {
      messageData = body.data;
      fromMe = messageData.key.fromMe || false;
      remoteJid = messageData.key.remoteJid || "";
      const msg = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text || "";
      messageText = msg;
      senderName = messageData.pushName || "";
    }
    // Format 2: Simple format
    else if (body.message) {
      messageText = body.message;
      remoteJid = body.from || body.remoteJid || "";
      fromMe = body.fromMe || false;
      senderName = body.senderName || body.pushName || "";
    }

    console.log("[Webhook] From Me:", fromMe);
    console.log("[Webhook] Remote JID:", remoteJid);
    console.log("[Webhook] Message:", messageText);

    // Skip messages we sent
    if (fromMe) {
      console.log("[Webhook] Skipping - message from me");
      return NextResponse.json({ received: true, status: "skipped fromMe" });
    }

    if (!messageText) {
      console.log("[Webhook] No message text found");
      return NextResponse.json({ received: true, status: "no text" });
    }

    const tenantId = instance.replace("tenant_", "");
    const customerPhone = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");

    console.log(`[Webhook] Processing message from ${customerPhone}: ${messageText}`);
    console.log(`[Webhook] Tenant ID: ${tenantId}`);

    // Find or create conversation
    const conversationsRef = collection(db, "conversations");
    const q = query(conversationsRef, where("tenantId", "==", tenantId), where("customerPhone", "==", customerPhone));
    const snapshot = await getDocs(q);

    let conversationId: string;
    const now = new Date();

    if (!snapshot.empty) {
      const existingDoc = snapshot.docs[0];
      conversationId = existingDoc.id;
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: messageText,
        lastMessageTime: now,
        unreadCount: (existingDoc.data().unreadCount || 0) + 1,
        updatedAt: now,
      });
      console.log("[Webhook] Updated existing conversation");
    } else {
      const newConv = await addDoc(conversationsRef, {
        tenantId,
        customerId: customerPhone,
        customerName: senderName || "Customer",
        customerPhone,
        lastMessage: messageText,
        lastMessageTime: now,
        unreadCount: 1,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      conversationId = newConv.id;
      console.log("[Webhook] Created new conversation:", conversationId);
    }

    // Save message
    await addDoc(collection(db, "messages"), {
      tenantId,
      conversationId,
      text: messageText,
      sender: "customer",
      status: "delivered",
      createdAt: now,
    });

    console.log("[Webhook] Message saved successfully");
    return NextResponse.json({ received: true, status: "saved" });

  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: "Webhook endpoint active",
    message: "POST to this endpoint to receive WhatsApp messages"
  });
}
