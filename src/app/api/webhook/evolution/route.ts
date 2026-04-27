import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { generateAIResponse, detectIntent, AIContext } from "@/lib/ai-service";

let db: ReturnType<typeof getFirestore> | null = null;

function getAdminDb() {
  if (!db) {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }
    db = getFirestore();
  }
  return db;
}

async function sendWelcomeMessage(
  tenantId: string,
  phoneNumber: string,
  businessName: string,
  welcomeMessage?: string
) {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.log(
        "[Webhook] Evolution API not configured, skipping welcome message"
      );
      return;
    }

    const messageText = welcomeMessage 
      ? welcomeMessage.replace(/\{\{business_name\}\}/g, businessName)
      : `Hello! 👋 Welcome to ${businessName}. We're excited to respond to your messages. How can we help you today?`;

    console.log(`[Webhook] Sending welcome message to ${phoneNumber}: ${messageText}`);

    const response = await fetch(
      `${evolutionApiUrl}/message/sendText/${tenantId}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: welcomeMessage,
        }),
      }
    );

    const data = await response.json();
    console.log("[Webhook] Welcome message response:", data);

    if (!response.ok) {
      console.error("[Webhook] Failed to send welcome message:", data);
    }
  } catch (error) {
    console.error("[Webhook] Error sending welcome message:", error);
  }
}

async function getTenantBusinessName(tenantId: string): Promise<string> {
  try {
    const adminDb = getAdminDb();
    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();

    if (tenantDoc.exists) {
      const data = tenantDoc.data();
      return data?.businessName || "Our Shop";
    }
    return "Our Shop";
  } catch (error) {
    console.error("[Webhook] Error fetching tenant business name:", error);
    return "Our Shop";
  }
}

async function getTenantSettings(tenantId: string): Promise<{ businessName: string; welcomeMessage: string; welcomeMessageEnabled: boolean }> {
  try {
    const adminDb = getAdminDb();
    
    // Try to get WhatsApp settings first
    const whatsappDoc = await adminDb.collection("whatsappSettings").doc(tenantId).get();
    
    if (whatsappDoc.exists) {
      const data = whatsappDoc.data();
      return {
        businessName: data?.businessName || "Our Shop",
        welcomeMessage: data?.welcomeMessage || `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
        welcomeMessageEnabled: data?.welcomeMessageEnabled ?? true
      };
    }
    
    // Fallback to old settings collection
    const settingsDoc = await adminDb.collection("settings").doc(tenantId).get();

    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      return {
        businessName: data?.businessName || "Our Shop",
        welcomeMessage: data?.welcomeMessage || `Hello! Welcome to our shop. How can we help you today?`,
        welcomeMessageEnabled: true
      };
    }
    
    return {
      businessName: "Our Shop",
      welcomeMessage: `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
      welcomeMessageEnabled: true
    };
  } catch (error) {
    console.error("[Webhook] Error fetching tenant settings:", error);
    return {
      businessName: "Our Shop",
      welcomeMessage: `Hello! 👋 Welcome to {{business_name}}.\n\nWe're excited to connect with you! How can we help you today?`,
      welcomeMessageEnabled: true
    };
  }
}

// Get business context for AI (products, services, etc.)
async function getBusinessContext(tenantId: string): Promise<AIContext> {
  try {
    const adminDb = getAdminDb();
    
    // Get tenant info
    const tenantDoc = await adminDb.collection("tenants").doc(tenantId).get();
    const businessName = tenantDoc.exists ? tenantDoc.data()?.businessName || "Our Shop" : "Our Shop";
    
    // Get active products (limit to 20 for context)
    const productsSnap = await adminDb
      .collection("products")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .limit(20)
      .get();
    
    const products = productsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        price: data.price || 0,
        category: data.category,
        categoryName: data.categoryName,
        stock: data.stock || 0,
        description: data.description,
        images: data.images,
        orderLink: data.orderLink,
      };
    });
    
    // Get active services (limit to 20 for context)
    const servicesSnap = await adminDb
      .collection("services")
      .where("tenantId", "==", tenantId)
      .where("status", "==", "active")
      .limit(20)
      .get();
    
    const services = servicesSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        priceMin: data.priceMin || 0,
        priceMax: data.priceMax,
        businessType: data.businessType,
        businessCategory: data.businessCategory,
        serviceName: data.serviceName,
        duration: data.duration,
        description: data.description,
      };
    });
    
    return {
      businessName,
      products,
      services,
    };
  } catch (error) {
    console.error("[Webhook] Error getting business context:", error);
    return {
      businessName: "Our Shop",
      products: [],
      services: [],
    };
  }
}

// Get conversation history for context (last 5 messages)
async function getConversationHistory(
  tenantId: string,
  phone: string
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  try {
    const adminDb = getAdminDb();
    
    const messagesSnap = await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .collection("messages")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();
    
    const messages = messagesSnap.docs
      .map(doc => doc.data())
      .reverse() // Reverse to get chronological order
      .slice(-10); // Take last 10 messages
    
    return messages.map(msg => ({
      role: msg.fromMe || msg.sender === "business" ? "assistant" : "user",
      content: msg.text || "",
    }));
  } catch (error) {
    console.error("[Webhook] Error getting conversation history:", error);
    return [];
  }
}

// Send message via Evolution API
async function sendEvolutionMessage(
  tenantId: string,
  phoneNumber: string,
  text: string
): Promise<void> {
  try {
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.log("[Webhook] Evolution API not configured, skipping response");
      return;
    }

    console.log(`[Webhook] Sending AI response to ${phoneNumber}`);

    const response = await fetch(
      `${evolutionApiUrl}/message/sendText/${tenantId}`,
      {
        method: "POST",
        headers: {
          apikey: evolutionApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: phoneNumber,
          text: text,
        }),
      }
    );

    const data = await response.json();
    console.log("[Webhook] AI response sent:", data);

    if (!response.ok) {
      console.error("[Webhook] Failed to send AI response:", data);
    }
  } catch (error) {
    console.error("[Webhook] Error sending AI response:", error);
  }
}

// Process message with AI and send response
async function processWithAI(
  tenantId: string,
  phone: string,
  message: string
): Promise<void> {
  try {
    console.log("[Webhook] Processing message with AI...");
    
    // Get business context (products, services)
    const context = await getBusinessContext(tenantId);
    console.log(`[Webhook] Context loaded: ${context.products.length} products, ${context.services.length} services`);
    
    // Get conversation history
    const history = await getConversationHistory(tenantId, phone);
    console.log(`[Webhook] Conversation history: ${history.length} messages`);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(message, context, history);
    console.log("[Webhook] AI Response generated:", aiResponse.substring(0, 100));
    
    // Save AI response to messages collection
    const adminDb = getAdminDb();
    const messageId = `ai_${Date.now()}`;
    const timestamp = new Date();
    
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .collection("messages")
      .doc(messageId)
      .set({
        text: aiResponse,
        from: tenantId,
        fromMe: true,
        sender: "business",
        timestamp,
        status: "sent",
        createdAt: timestamp,
        isAI: true,
      });
    
    // Update conversation with last message
    await adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(phone)
      .set({
        lastMessage: aiResponse,
        lastMessageTime: timestamp,
        updatedAt: timestamp,
      }, { merge: true });
    
    // Send response via Evolution API
    await sendEvolutionMessage(tenantId, phone, aiResponse);
    
    console.log("[Webhook] AI processing complete");
  } catch (error) {
    console.error("[Webhook] Error in AI processing:", error);
    // Send fallback message
    await sendEvolutionMessage(
      tenantId,
      phone,
      "Thank you for your message! We'll get back to you shortly. 🙏"
    );
  }
}

export async function POST(req: NextRequest) {
  console.log("[Webhook] Received request");
  
  try {
    const body = await req.json();
    console.log("[Webhook] Body:", JSON.stringify(body));

    const event = body.event || body.type || body.eventName;
    const instanceName = body.instance || body.instanceName || body.instance_id || body.instanceId;

    console.log("[Webhook] Event:", event);
    console.log("[Webhook] Instance:", instanceName);
    console.log("[Webhook] Raw data:", JSON.stringify(body.data || body));

    const allowedEvents = ["messages.upsert", "MESSAGES_UPSERT", "messages.update", "MESSAGES_UPDATE"];
    if (!allowedEvents.includes(event)) {
      console.log("[Webhook] Ignoring event:", event);
      return NextResponse.json({ received: true });
    }

    if (!instanceName) {
      console.log("[Webhook] No instance found");
      return NextResponse.json({ received: true });
    }

    const message = Array.isArray(body.data)
      ? body.data[0]
      : body.data?.messages?.[0] || body.data;

    if (!message) {
      console.log("[Webhook] No message payload found");
      return NextResponse.json({ received: true });
    }

    if (message?.key?.fromMe) {
      console.log("[Webhook] Ignoring own message");
      return NextResponse.json({ received: true });
    }

    const from = message?.key?.remoteJid?.replace("@s.whatsapp.net", "") || "";
    const text =
      message?.message?.conversation ||
      message?.message?.extendedTextMessage?.text ||
      message?.message?.conversation ||
      message?.message?.buttonsResponseMessage?.selectedButtonId ||
      message?.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
      "";
    const messageId = message?.key?.id || Date.now().toString();
    const timestamp = message?.messageTimestamp
      ? new Date(message.messageTimestamp * 1000)
      : message?.messageTimestampMs
      ? new Date(message.messageTimestampMs)
      : new Date();

    console.log(`[Webhook] Message from ${from}: ${text}`);

    // Use instance name as tenant ID (e.g., tenant_USER_ID)
    let tenantId = instanceName;
    console.log("[Webhook] Instance Name:", instanceName);

    // If instanceName looks like a UUID (not tenant_xxx), find the tenant by evolutionUUID
    const adminDb = getAdminDb();
    
    if (!instanceName.startsWith("tenant_")) {
      console.log("[Webhook] Instance is UUID, searching for tenant...");
      const tenantsQuery = await adminDb.collection("tenants")
        .where("evolutionUUID", "==", instanceName)
        .limit(1)
        .get();
      
      if (!tenantsQuery.empty) {
        tenantId = tenantsQuery.docs[0].id;
        console.log("[Webhook] Found tenant by UUID:", tenantId);
      } else {
        // Also try finding by evolutionInstanceId
        const tenantsQuery2 = await adminDb.collection("tenants")
          .where("evolutionInstanceId", "==", instanceName)
          .limit(1)
          .get();
        
        if (!tenantsQuery2.empty) {
          tenantId = tenantsQuery2.docs[0].id;
          console.log("[Webhook] Found tenant by instanceId:", tenantId);
        }
      }
    }
    
    console.log("[Webhook] Final Tenant ID:", tenantId);

    // Save to conversations collection - using our tenant structure
    const conversationRef = adminDb
      .collection("tenants")
      .doc(tenantId)
      .collection("conversations")
      .doc(from);

    const existingConvo = await conversationRef.get();
    const currentUnreadCount = existingConvo.exists
      ? (existingConvo.data()?.unreadCount || 0) + 1
      : 1;

    const isNewConversation = !existingConvo.exists;

    await conversationRef.set({
      phone: from,
      customerPhone: from,
      customerName: message?.pushName || "Customer",
      lastMessage: text,
      lastMessageTime: timestamp,
      unreadCount: currentUnreadCount,
      updatedAt: timestamp,
    }, { merge: true });

    console.log("[Webhook] Conversation saved");

    // Save individual message
    await conversationRef.collection("messages").doc(messageId).set({
      text,
      from,
      fromMe: false,
      sender: "customer",
      timestamp,
      status: "received",
      createdAt: timestamp,
    });

    console.log("[Webhook] Message saved");

    // Process with AI and send response (replaces n8n)
    if (text) {
      // Use async processing to not block webhook response
      processWithAI(tenantId, from, text).catch(err => {
        console.error("[Webhook] Async AI processing error:", err);
      });
    }

    // Send welcome message only on first contact
    if (isNewConversation) {
      console.log("[Webhook] New conversation detected, sending welcome message");
      console.log("[Webhook] Tenant ID for settings:", tenantId);
      const settings = await getTenantSettings(tenantId);
      console.log("[Webhook] Settings found:", settings);
      
      // Only send if welcome message is enabled
      if (settings.welcomeMessageEnabled) {
        await sendWelcomeMessage(tenantId, from, settings.businessName, settings.welcomeMessage);
      } else {
        console.log("[Webhook] Welcome message is disabled, skipping");
      }
    }

    return NextResponse.json({ received: true, status: "saved" });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "Webhook active",
    message: "POST to receive WhatsApp messages",
  });
}
