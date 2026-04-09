import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";

interface EvolutionWebhook {
  event: string;
  instance: string;
  data: {
    key?: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    pushName?: string;
  };
}

function getTenantIdFromInstance(instanceName: string): string | null {
  if (instanceName.startsWith("tenant_")) {
    return instanceName.replace("tenant_", "");
  }
  return null;
}

function formatPhoneNumber(remoteJid: string): string {
  return remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
}

export async function POST(req: NextRequest) {
  try {
    const body: EvolutionWebhook = await req.json();
    console.log("[Webhook] Received event:", body.event);
    console.log("[Webhook] Instance:", body.instance);

    if (body.event === "messages.upsert") {
      const messageData = body.data;
      const remoteJid = messageData.key?.remoteJid;
      const fromMe = messageData.key?.fromMe;
      const messageText = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text;
      const senderName = messageData.pushName || "Unknown";

      if (!remoteJid || !messageText || fromMe) {
        console.log("[Webhook] Skipping - no message text or it's from me");
        return NextResponse.json({ success: true });
      }

      const tenantId = getTenantIdFromInstance(body.instance);
      if (!tenantId) {
        console.log("[Webhook] No tenantId found in instance name");
        return NextResponse.json({ success: true });
      }

      const customerPhone = formatPhoneNumber(remoteJid);
      console.log(`[Webhook] New message from ${customerPhone}: ${messageText}`);

      const conversationsRef = collection(db, "conversations");
      const q = query(conversationsRef, where("tenantId", "==", tenantId), where("customerPhone", "==", customerPhone));
      const snapshot = await getDocs(q);

      let conversationId: string;

      if (!snapshot.empty) {
        const existingDoc = snapshot.docs[0];
        conversationId = existingDoc.id;
        await updateDoc(doc(db, "conversations", conversationId), {
          lastMessage: messageText,
          lastMessageTime: serverTimestamp(),
          unreadCount: (existingDoc.data().unreadCount || 0) + 1,
          updatedAt: serverTimestamp(),
        });
      } else {
        const newConvRef = await addDoc(conversationsRef, {
          tenantId,
          customerId: customerPhone,
          customerName: senderName,
          customerPhone,
          lastMessage: messageText,
          lastMessageTime: serverTimestamp(),
          unreadCount: 1,
          status: "active",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        conversationId = newConvRef.id;
      }

      await addDoc(collection(db, "messages"), {
        tenantId,
        conversationId,
        text: messageText,
        sender: "customer",
        status: "delivered",
        createdAt: serverTimestamp(),
      });

      console.log("[Webhook] Message saved successfully");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint active" });
}
