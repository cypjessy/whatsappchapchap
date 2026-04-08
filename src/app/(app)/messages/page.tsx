"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { messageService, Conversation, Message, Customer, customerService } from "@/lib/db";

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showSidebar, setShowSidebar] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    loadCustomers();
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await messageService.getConversations(user);
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    if (!user) return;
    try {
      const data = await customerService.getCustomers(user);
      setCustomers(data);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    if (!user) return;
    setLoadingMessages(true);
    try {
      const data = await messageService.getMessages(user, conversationId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!user) return;
    try {
      await messageService.markAsRead(user, conversationId);
      loadConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async () => {
    if (!user || !messageText.trim() || !selectedConversation) return;
    try {
      await messageService.sendMessage(user, selectedConversation.id, messageText.trim(), "business");
      setMessageText("");
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const startNewChat = async () => {
    if (!user || !newChatPhone.trim()) return;
    const phone = newChatPhone.replace(/[^0-9]/g, "");
    const customer = customers.find(c => c.phone.includes(phone) || phone.includes(c.phone.replace(/[^0-9]/g, "")));
    
    if (customer) {
      const conversation = await messageService.getOrCreateConversation(user, customer.id, customer.name, customer.phone);
      setSelectedConversation(conversation);
      setShowNewChat(false);
      setNewChatPhone("");
      loadConversations();
    } else {
      const conversation = await messageService.createConversation(user, "new", "New Customer", newChatPhone);
      setSelectedConversation(conversation);
      setShowNewChat(false);
      setNewChatPhone("");
      loadConversations();
    }
  };

  const archiveConversation = async (conversationId: string) => {
    if (!user) return;
    try {
      await messageService.archiveConversation(user, conversationId);
      setSelectedConversation(null);
      loadConversations();
    } catch (error) {
      console.error("Error archiving conversation:", error);
    }
  };

  const filteredConversations = conversations.filter((chat) => {
    if (activeFilter === "unread" && chat.unreadCount === 0) return false;
    if (searchTerm && !chat.customerName.toLowerCase().includes(searchTerm.toLowerCase()) && !chat.customerPhone.includes(searchTerm)) return false;
    return true;
  });

  const selectedChatData = selectedConversation;

  const formatTime = (createdAt: any) => {
    if (!createdAt) return "";
    try {
      const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return "";
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  const getColorFromString = (str: string) => {
    const colors = ["from-[#25D366] to-[#128C7E]", "from-[#3b82f6] to-[#2563eb]", "from-[#ec4899] to-[#db2777]", "from-[#8b5cf6] to-[#7c3aed]", "from-[#10b981] to-[#059669]", "from-[#f59e0b] to-[#d97706]"];
    const hash = str.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "ai", label: "AI Handled" },
  ];

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl overflow-hidden max-w-[1600px] mx-auto">
      {/* Sidebar - Conversation List */}
      <aside
        className={`w-[360px] border-r border-[#e2e8f0] flex flex-col bg-white transition-transform duration-300 md:relative ${
          !showSidebar ? "fixed inset-0 z-50 translate-x-[-100%] md:translate-x-0 md:relative" : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#e2e8f0]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-xl flex items-center justify-center text-white text-xl">
                <i className="fab fa-whatsapp"></i>
              </div>
              <h1 className="text-xl font-extrabold text-[#1e293b]">
                Chap<span className="text-[#25D366]">Chap</span>
              </h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowNewChat(true)} className="w-10 h-10 rounded-xl bg-[#f8fafc] text-[#64748b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
                <i className="fas fa-edit"></i>
              </button>
              <button className="w-10 h-10 rounded-xl bg-[#f8fafc] text-[#64748b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
                <i className="fas fa-ellipsis-v"></i>
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] bg-[#f8fafc] focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 py-3 border-b border-[#e2e8f0] overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? "bg-[#25D366] text-white"
                  : "bg-[#f8fafc] text-[#64748b] hover:text-[#1e293b]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[#64748b]">
              <i className="fas fa-comments text-4xl mb-4 opacity-50"></i>
              <p>No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => { setSelectedConversation(chat); if (window.innerWidth <= 768) setShowSidebar(false); }}
                className={`flex items-center gap-3 p-4 cursor-pointer border-b border-[#e2e8f0] hover:bg-[#f8fafc] transition-all ${
                  selectedConversation?.id === chat.id
                    ? "bg-gradient-to-r from-[rgba(37,211,102,0.1)] to-[rgba(18,140,126,0.05)] border-l-4 border-l-[#25D366]"
                    : ""
                }`}
              >
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full bg-gradient-to-br ${getColorFromString(chat.customerName)} flex items-center justify-center font-bold text-lg text-white`}
                  >
                    {getInitials(chat.customerName)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00C853] border-2 border-white rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[#1e293b] truncate">{chat.customerName}</span>
                    <span className="text-xs text-[#64748b] flex-shrink-0">{formatTime(chat.lastMessageTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-sm truncate ${
                        chat.unreadCount > 0 ? "text-[#1e293b] font-semibold" : "text-[#64748b]"
                      }`}
                    >
                      {chat.lastMessage || "No messages yet"}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="px-2 py-0.5 bg-[#25D366] text-white text-xs font-bold rounded-full min-w-[20px] text-center flex-shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat Area */}
      <main className={`flex-1 flex flex-col bg-[#f8fafc] ${showSidebar ? "" : "w-full"}`}>
        {selectedChatData ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-6 py-4 bg-white border-b border-[#e2e8f0] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#1e293b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center md:hidden"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>

                <div className="relative">
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br ${getColorFromString(selectedChatData.customerName)} flex items-center justify-center font-bold text-lg text-white`}
                  >
                    {getInitials(selectedChatData.customerName)}
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#00C853] border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-bold text-[#1e293b]">{selectedChatData.customerName}</h3>
                  <p className="text-sm text-[#00C853] flex items-center gap-1">
                    <i className="fas fa-circle" style={{ fontSize: "8px" }}></i> Online
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#64748b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
                  <i className="fas fa-search"></i>
                </button>
                <button className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#64748b] hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
                  <i className="fas fa-user"></i>
                </button>
                <button onClick={() => archiveConversation(selectedChatData.id)} className="w-10 h-10 rounded-full bg-[#f8fafc] text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-all flex items-center justify-center">
                  <i className="fas fa-archive"></i>
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
              <div className="text-center my-2">
                <span className="bg-[#e2e8f0] text-[#64748b] px-4 py-1 rounded-full text-xs font-semibold">
                  Today
                </span>
              </div>

              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
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
                      {formatTime(msg.createdAt)}
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

            {/* Input Area */}
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#DCF8C6] to-[#e0e7ff] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-whatsapp text-5xl text-[#25D366]"></i>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1e293b] mb-2">WhatsApp Messages</h2>
              <p className="text-[#64748b]">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </main>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewChat(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <i className="fas fa-plus text-[#25D366]"></i>New Chat
              </h2>
              <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl" onClick={() => setShowNewChat(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6">
              <label className="block font-semibold text-sm mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={newChatPhone}
                onChange={(e) => setNewChatPhone(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && startNewChat()}
                className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                placeholder="+254 712 345 678"
              />
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={() => setShowNewChat(false)}>Cancel</button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={startNewChat}>
                <i className="fas fa-paper-plane mr-2"></i>Start Chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
