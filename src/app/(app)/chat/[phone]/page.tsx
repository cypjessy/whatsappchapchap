"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  from: string;
  fromMe: boolean;
  sender: "customer" | "business";
  timestamp: any;
  status: string;
  createdAt: any;
}

interface Conversation {
  id: string;
  phone: string;
  customerPhone: string;
  customerName: string;
  lastMessage?: string;
  lastMessageTime?: any;
  unreadCount: number;
  updatedAt?: any;
}

export default function ChatPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const phone = params.phone as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const tenantId = user ? `tenant_${user.uid}` : null;

  useEffect(() => {
    if (user && phone) {
      loadConversation();
      loadMessages();
      markAsRead();
    }
  }, [user, phone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = async () => {
    if (!tenantId || !phone) return;
    try {
      const convoRef = doc(db, "tenants", tenantId, "conversations", phone);
      const snap = await getDoc(convoRef);
      if (snap.exists()) {
        setConversation({ id: snap.id, ...snap.data() } as Conversation);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!tenantId || !phone) return;
    try {
      const messagesRef = collection(db, "tenants", tenantId, "conversations", phone, "messages");
      const q = query(messagesRef, orderBy("timestamp", "asc"));
      const snap = await getDocs(q);
      const msgs = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const markAsRead = async () => {
    if (!tenantId || !phone) return;
    try {
      const convoRef = doc(db, "tenants", tenantId, "conversations", phone);
      await updateDoc(convoRef, { unreadCount: 0 });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!user || !messageText.trim() || !phone) return;
    try {
      const messageId = Date.now().toString();
      const messageData = {
        text: messageText.trim(),
        from: user.phoneNumber || "",
        fromMe: true,
        sender: "business",
        timestamp: new Date(),
        status: "sent",
        createdAt: serverTimestamp(),
      };

      const messageRef = doc(
        db,
        "tenants",
        tenantId!,
        "conversations",
        phone,
        "messages",
        messageId
      );
      await updateDoc(messageRef, messageData);

      const convoRef = doc(db, "tenants", tenantId!, "conversations", phone);
      await updateDoc(convoRef, {
        lastMessage: messageText.trim(),
        lastMessageTime: serverTimestamp(),
      });

      setMessageText("");
      loadMessages();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString("en-US", { weekday: "short" });
      } else {
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getColorFromString = (str: string) => {
    const colors = [
      "from-[#25D366] to-[#128C7E]",
      "from-[#3b82f6] to-[#2563eb]",
      "from-[#ec4899] to-[#db2777]",
      "from-[#8b5cf6] to-[#7c3aed]",
      "from-[#10b981] to-[#059669]",
      "from-[#f59e0b] to-[#d97706]",
    ];
    const hash = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="w-8 h-8 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <p className="text-[#64748b]">Conversation not found</p>
          <button
            onClick={() => router.push("/conversations")}
            className="mt-4 px-4 py-2 bg-[#25D366] text-white rounded-lg"
          >
            Go to Conversations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl overflow-hidden max-w-[1600px] mx-auto">
      <main className="flex-1 flex flex-col bg-[#f8fafc]">
        <div className="px-4 md:px-6 py-4 bg-white border-b border-[#e2e8f0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/conversations")}
              className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#1e293b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center"
            >
              <i className="fas fa-arrow-left"></i>
            </button>

            <div className="relative">
              <div
                className={`w-11 h-11 rounded-full bg-gradient-to-br ${getColorFromString(conversation.customerName)} flex items-center justify-center font-bold text-lg text-white`}
              >
                {getInitials(conversation.customerName)}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00C853] border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-[#1e293b]">{conversation.customerName}</h3>
              <p className="text-sm text-[#64748b]">{conversation.customerPhone || phone}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#64748b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
              <i className="fas fa-search"></i>
            </button>
            <button className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#64748b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
              <i className="fas fa-user"></i>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
          <div className="text-center my-2">
            <span className="bg-[#e2e8f0] text-[#64748b] px-4 py-1 rounded-full text-xs font-semibold">
              Today
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[#64748b]">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[70%] md:max-w-[65%] ${
                  msg.sender === "customer" ? "self-start" : "self-end"
                }`}
              >
                <div
                  className={`p-4 rounded-2xl ${
                    msg.sender === "customer"
                      ? "bg-white border border-[#e2e8f0] rounded-bl-4"
                      : "bg-[#DCF8C6] rounded-br-4"
                  }`}
                >
                  <p className="text-sm leading-relaxed text-[#1e293b]">{msg.text}</p>
                </div>
                <div
                  className={`flex items-center gap-1 text-xs text-[#64748b] mt-1 ${
                    msg.sender === "business" ? "justify-end" : ""
                  }`}
                >
                  {formatTime(msg.timestamp)}
                  {msg.sender === "business" && (
                    <i
                      className={`fas fa-check-double ${
                        msg.status === "read" ? "text-[#25D366]" : "text-[#3b82f6]"
                      }`}
                    ></i>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 md:p-6 bg-white border-t border-[#e2e8f0]">
          <div className="flex items-end gap-3 bg-[#f8fafc] rounded-2xl p-3">
            <div className="flex gap-1">
              <button className="w-10 h-10 rounded-full text-[#64748b] hover:text-[#25D366] hover:bg-[rgba(37,211,102,0.1)] transition-all flex items-center justify-center">
                <i className="fas fa-paperclip"></i>
              </button>
              <button className="w-10 h-10 rounded-full text-[#64748b] hover:text-[#25D366] hover:bg-[rgba(37,211,102,0.1)] transition-all flex items-center justify-center">
                <i className="fas fa-image"></i>
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent border-none text-sm p-2 resize-none focus:outline-none max-h-30"
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            ></textarea>
            <button className="w-10 h-10 rounded-full text-[#64748b] hover:text-[#25D366] hover:bg-[rgba(37,211,102,0.1)] transition-all flex items-center justify-center">
              <i className="far fa-smile"></i>
            </button>
            <button
              onClick={sendMessage}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white flex items-center justify-center hover:scale-105 transition-all"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
