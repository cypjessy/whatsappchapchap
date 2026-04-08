"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { aiService, AITemplate, AutomationRule, AISettings, messageService, Conversation, Message } from "@/lib/db";

interface ChatWithAI {
  id: string;
  customerName: string;
  message: string;
  aiResponse: string;
  time: Date;
  outcome: string;
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [templates, setTemplates] = useState<AITemplate[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [recentChats, setRecentChats] = useState<ChatWithAI[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AITemplate | null>(null);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [aiPaused, setAiPaused] = useState(false);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    trigger: "",
    category: "Welcome",
    response: "",
  });

  const [automationForm, setAutomationForm] = useState({
    name: "",
    trigger: "",
    action: "",
    type: "Auto" as "Auto" | "Smart" | "Trigger",
  });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [templatesData, rulesData, settingsData, conversationsData] = await Promise.all([
        aiService.getTemplates(user!),
        aiService.getAutomationRules(user!),
        aiService.getOrCreateSettings(user!),
        messageService.getConversations(user!),
      ]);
      setTemplates(templatesData);
      setAutomationRules(rulesData);
      setSettings(settingsData);

      const chatsWithAI: ChatWithAI[] = await Promise.all(
        conversationsData.slice(0, 10).map(async (conv) => {
          const messages = await messageService.getMessages(user!, conv.id);
          const lastCustomerMsg = messages.filter(m => m.sender === "customer").pop();
          const lastBusinessMsg = messages.filter(m => m.sender === "business").pop();
          return {
            id: conv.id,
            customerName: conv.customerName,
            message: lastCustomerMsg?.text || "No message",
            aiResponse: lastBusinessMsg?.text || "No response yet",
            time: conv.lastMessageTime?.toDate ? conv.lastMessageTime.toDate() : new Date(),
            outcome: lastBusinessMsg ? "Resolved" : "Pending",
          };
        })
      );
      setRecentChats(chatsWithAI);
    } catch (error) {
      console.error("Error loading AI data:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    if (!user || !templateForm.name || !templateForm.trigger || !templateForm.response) return;
    try {
      if (editingTemplate) {
        await aiService.updateTemplate(user, editingTemplate.id, templateForm);
      } else {
        await aiService.createTemplate(user, templateForm);
      }
      loadData();
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({ name: "", trigger: "", category: "Welcome", response: "" });
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user || !confirm("Delete this template?")) return;
    try {
      await aiService.deleteTemplate(user, templateId);
      loadData();
    } catch (error) {
      console.error("Error deleting template:", error);
    }
  };

  const saveAutomationRule = async () => {
    if (!user || !automationForm.name || !automationForm.trigger || !automationForm.action) return;
    try {
      if (editingRule) {
        await aiService.updateAutomationRule(user, editingRule.id, automationForm);
      } else {
        await aiService.createAutomationRule(user, { ...automationForm, status: "active" });
      }
      loadData();
      setShowAutomationModal(false);
      setEditingRule(null);
      setAutomationForm({ name: "", trigger: "", action: "", type: "Auto" });
    } catch (error) {
      console.error("Error saving automation rule:", error);
    }
  };

  const toggleAutomationStatus = async (rule: AutomationRule) => {
    if (!user) return;
    try {
      await aiService.updateAutomationRule(user, rule.id, { status: rule.status === "active" ? "paused" : "active" });
      loadData();
    } catch (error) {
      console.error("Error toggling automation:", error);
    }
  };

  const deleteAutomationRule = async (ruleId: string) => {
    if (!user || !confirm("Delete this automation rule?")) return;
    try {
      await aiService.deleteAutomationRule(user, ruleId);
      loadData();
    } catch (error) {
      console.error("Error deleting automation rule:", error);
    }
  };

  const updateSetting = async (key: keyof AISettings, value: boolean | string | number) => {
    if (!user) return;
    try {
      await aiService.updateSettings(user, { [key]: value });
      loadData();
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const trainAI = async () => {
    alert("AI training will be available when you connect to Gemini API");
  };

  const stats = {
    messagesProcessed: recentChats.length > 0 ? recentChats.length * 12 : 1247,
    autoReplies: Math.floor(recentChats.length * 8.5),
    avgResponseTime: "2.3s",
    customerSatisfaction: "94%",
    salesGenerated: "$45,230",
    leadsCaptured: 156,
  };

  const defaultTemplates = [
    { id: "1", name: "Greeting", trigger: "Any new message", category: "Welcome", usage: 234, success: 92 },
    { id: "2", name: "Product Inquiry", trigger: "product, price, stock", category: "Sales", usage: 187, success: 88 },
    { id: "3", name: "Order Status", trigger: "order, delivery, shipping", category: "Support", usage: 156, success: 95 },
    { id: "4", name: "Discount Offer", trigger: "discount, offer, deal", category: "Sales", usage: 98, success: 78 },
    { id: "5", name: "Closing Sale", trigger: "thank you, bye", category: "Sales", usage: 76, success: 45 },
  ];

  const defaultAutomationRules = [
    { id: "1", name: "Quick Greeting", trigger: "First message", action: "Send greeting + ask need", status: "active" as const, type: "Auto" as const },
    { id: "2", name: "Product Lookup", trigger: "Product keywords", action: "Search & suggest products", status: "active" as const, type: "Smart" as const },
    { id: "3", name: "Order Inquiry", trigger: "Order-related words", action: "Provide order status", status: "active" as const, type: "Auto" as const },
    { id: "4", name: "Lead Capture", trigger: "No contact info", action: "Ask for phone number", status: "paused" as const, type: "Smart" as const },
    { id: "5", name: "Abandoned Cart", trigger: "Inactivity 30min", action: "Send reminder + discount", status: "active" as const, type: "Trigger" as const },
  ];

  const allTemplates = templates.length > 0 ? templates : defaultTemplates;
  const allRules = automationRules.length > 0 ? automationRules : defaultAutomationRules;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return "Yesterday";
  };

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "fa-robot" },
    { id: "templates", label: "Templates", icon: "fa-file-alt" },
    { id: "automation", label: "Automation", icon: "fa-magic" },
    { id: "analytics", label: "Analytics", icon: "fa-chart-line" },
    { id: "settings", label: "Settings", icon: "fa-cog" },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-robot text-[#8b5cf6]"></i>AI Assistant
          </h1>
          <p className="text-[#64748b]">Automate responses and boost sales with intelligent AI</p>
        </div>
        <div className="flex gap-3">
          <button onClick={trainAI} className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#8b5cf6]">
            <i className="fas fa-play mr-2"></i>Train AI
          </button>
          <button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }} className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm shadow-lg">
            <i className="fas fa-plus mr-2"></i>New Template
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b] mb-1">Messages Processed</div>
          <div className="text-2xl font-extrabold text-[#8b5cf6]">{stats.messagesProcessed.toLocaleString()}</div>
          <div className="text-xs text-[#10b981]">+12% this week</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b] mb-1">Auto Replies</div>
          <div className="text-2xl font-extrabold text-[#25D366]">{stats.autoReplies}</div>
          <div className="text-xs text-[#64748b]">72% of total</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b] mb-1">Avg Response</div>
          <div className="text-2xl font-extrabold text-[#3b82f6]">{stats.avgResponseTime}</div>
          <div className="text-xs text-[#10b981]">-0.5s vs manual</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b] mb-1">Satisfaction</div>
          <div className="text-2xl font-extrabold text-[#f59e0b]">{stats.customerSatisfaction}</div>
          <div className="text-xs text-[#10b981]">+5% this month</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b] mb-1">Sales Generated</div>
          <div className="text-2xl font-extrabold text-[#10b981]">{stats.salesGenerated}</div>
          <div className="text-xs text-[#10b981]">+18% this month</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0]">
          <div className="text-xs text-[#64748b] mb-1">Leads Captured</div>
          <div className="text-2xl font-extrabold text-[#ec4899]">{stats.leadsCaptured}</div>
          <div className="text-xs text-[#64748b]">This month</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex gap-2 bg-white p-2 rounded-2xl border border-[#e2e8f0] overflow-x-auto">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? "bg-[#8b5cf6] text-white" : "text-[#64748b] hover:bg-[#f1f5f9]"}`}>
                <i className={`fas ${tab.icon}`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "dashboard" && (
            <>
              <div className={`bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-6 text-white ${aiPaused ? "opacity-75" : ""}`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-pulse">
                      <i className="fas fa-robot"></i>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{aiPaused ? "AI Assistant Paused" : "AI Assistant Active"}</div>
                      <div className="text-sm opacity-80">{aiPaused ? "Resume to continue monitoring" : "Monitoring all incoming messages"}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAiPaused(!aiPaused)} className="px-4 py-2 bg-white/20 rounded-xl font-semibold text-sm">{aiPaused ? "Resume" : "Pause"}</button>
                    <button onClick={() => setActiveTab("settings")} className="px-4 py-2 bg-white text-[#8b5cf6] rounded-xl font-semibold text-sm">Settings</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">24/7</div>
                    <div className="text-xs opacity-80">Availability</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">0.2s</div>
                    <div className="text-xs opacity-80">Avg Response</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-xs opacity-80">Accuracy</div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#e2e8f0] p-5">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Recent AI Conversations</h3>
                  <button className="text-sm text-[#8b5cf6] font-semibold">View All</button>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-[#8b5cf6]/30 border-t-[#8b5cf6] rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : recentChats.length === 0 ? (
                    <div className="text-center py-8 text-[#64748b]">
                      <i className="fas fa-robot text-4xl mb-4 opacity-50"></i>
                      <p>No conversations yet</p>
                    </div>
                  ) : (
                    recentChats.map(chat => (
                      <div key={chat.id} className="p-4 bg-[#f8fafc] rounded-xl hover:bg-[#f1f5f9] transition-all cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold">{chat.customerName}</div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${chat.outcome === "Sale" ? "bg-[#10b981] text-white" : chat.outcome === "Upsell" ? "bg-[#f59e0b] text-white" : chat.outcome === "Resolved" ? "bg-[#3b82f6] text-white" : "bg-[#64748b] text-white"}`}>{chat.outcome}</span>
                        </div>
                        <div className="text-sm text-[#64748b] mb-2">"{chat.message}"</div>
                        <div className="text-xs text-[#8b5cf6] flex items-center gap-1"><i className="fas fa-robot"></i> {chat.aiResponse.substring(0, 50)}...</div>
                        <div className="text-xs text-[#64748b] mt-2">{formatTime(chat.time)}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === "templates" && (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="p-4 border-b border-[#e2e8f0] flex justify-between items-center">
                <div className="flex gap-3">
                  <input type="text" placeholder="Search templates..." className="px-4 py-2 bg-[#f8fafc] rounded-xl text-sm border-2 border-transparent focus:border-[#8b5cf6] focus:outline-none" />
                  <select className="px-4 py-2 bg-[#f8fafc] rounded-xl text-sm border-2 border-[#e2e8f0]">
                    <option>All Categories</option>
                    <option>Welcome</option>
                    <option>Sales</option>
                    <option>Support</option>
                  </select>
                </div>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f8fafc] text-left text-xs font-bold uppercase text-[#64748b]">
                    <th className="p-4">Template Name</th>
                    <th className="p-4">Trigger</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Usage</th>
                    <th className="p-4">Success</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTemplates.map(t => (
                    <tr key={t.id} className="border-t border-[#e2e8f0] hover:bg-[#f8fafc]">
                      <td className="p-4 font-bold">{t.name}</td>
                      <td className="p-4 text-sm text-[#64748b]">{t.trigger}</td>
                      <td className="p-4"><span className="px-2 py-1 bg-[#f1f5f9] rounded-lg text-xs font-semibold">{t.category}</span></td>
                      <td className="p-4 font-bold">{t.usage}</td>
                      <td className="p-4"><span className={`font-bold ${t.success > 85 ? "text-[#10b981]" : "text-[#f59e0b]"}`}>{t.success}%</span></td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingTemplate(t as AITemplate); setTemplateForm({ name: t.name, trigger: t.trigger, category: t.category, response: (t as AITemplate).response || "" }); setShowTemplateModal(true); }} className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#8b5cf6] hover:bg-[#f1f5f9] rounded-lg"><i className="fas fa-edit"></i></button>
                          <button onClick={() => deleteTemplate(t.id)} className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:text-[#ef4444] hover:bg-[#f1f5f9] rounded-lg"><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "automation" && (
            <div className="space-y-4">
              {allRules.map(rule => (
                <div key={rule.id} className="bg-white rounded-2xl p-5 border border-[#e2e8f0] flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${rule.type === "Smart" ? "bg-[#8b5cf6]/10 text-[#8b5cf6]" : rule.type === "Trigger" ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-[#25D366]/10 text-[#25D366]"}`}>
                      <i className={`fas ${rule.type === "Smart" ? "fa-brain" : rule.type === "Trigger" ? "fa-bolt" : "fa-robot"}`}></i>
                    </div>
                    <div>
                      <div className="font-bold">{rule.name}</div>
                      <div className="text-sm text-[#64748b]"><span className="text-[#8b5cf6]">Trigger:</span> {rule.trigger}</div>
                      <div className="text-sm text-[#64748b]"><span className="text-[#25D366]">Action:</span> {rule.action}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${rule.status === "active" ? "bg-[#10b981]/10 text-[#10b981]" : "bg-[#f1f5f9] text-[#64748b]"}`}>{rule.status}</span>
                    <div className="flex gap-2">
                      <button onClick={() => { const r = rule as AutomationRule; toggleAutomationStatus(r); }} className={`w-10 h-10 rounded-xl flex items-center justify-center ${rule.status === "active" ? "bg-[#f1f5f9] text-[#64748b] hover:bg-[#10b981]/10 hover:text-[#10b981]" : "bg-[#10b981] text-white"}`}>
                        <i className={`fas ${rule.status === "active" ? "fa-pause" : "fa-play"}`}></i>
                      </button>
                      <button onClick={() => { setEditingRule(rule as AutomationRule); setAutomationForm({ name: rule.name, trigger: rule.trigger, action: rule.action, type: rule.type }); setShowAutomationModal(true); }} className="w-10 h-10 rounded-xl bg-[#f1f5f9] text-[#64748b] flex items-center justify-center hover:text-[#8b5cf6]">
                        <i className="fas fa-cog"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={() => { setEditingRule(null); setShowAutomationModal(true); }} className="w-full py-4 border-2 border-dashed border-[#e2e8f0] rounded-2xl text-[#64748b] font-bold hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all">
                <i className="fas fa-plus mr-2"></i>Add Automation Rule
              </button>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
                <h4 className="font-bold mb-4">Response Accuracy</h4>
                <div className="text-4xl font-extrabold text-[#8b5cf6] mb-2">94%</div>
                <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden"><div className="h-full w-[94%] bg-[#8b5cf6] rounded-full"></div></div>
                <div className="text-sm text-[#64748b] mt-2">Based on {stats.messagesProcessed} responses</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
                <h4 className="font-bold mb-4">Sales Conversion</h4>
                <div className="text-4xl font-extrabold text-[#10b981] mb-2">23%</div>
                <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden"><div className="h-full w-[23%] bg-[#10b981] rounded-full"></div></div>
                <div className="text-sm text-[#64748b] mt-2">+5% from last month</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
                <h4 className="font-bold mb-4">Time Saved</h4>
                <div className="text-4xl font-extrabold text-[#3b82f6] mb-2">48h</div>
                <div className="text-sm text-[#64748b]">This month alone</div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
                <h4 className="font-bold mb-4">Customer Satisfaction</h4>
                <div className="text-4xl font-extrabold text-[#f59e0b] mb-2">4.8/5</div>
                <div className="flex gap-1 text-[#f59e0b]">
                  <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star-half-alt"></i>
                </div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-6">
              <div>
                <h4 className="font-bold mb-4">AI Behavior</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Auto-reply to all messages</div><div className="text-sm text-[#64748b]">AI will respond automatically</div></div>
                    <button onClick={() => settings && updateSetting("autoReply", !settings.autoReply)} className={`w-12 h-6 rounded-full relative transition-all ${settings?.autoReply ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings?.autoReply ? "right-0.5" : "left-0.5"}`}></div>
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Learn from conversations</div><div className="text-sm text-[#64748b]">Improve responses over time</div></div>
                    <button onClick={() => settings && updateSetting("learnFromConversations", !settings.learnFromConversations)} className={`w-12 h-6 rounded-full relative transition-all ${settings?.learnFromConversations ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings?.learnFromConversations ? "right-0.5" : "left-0.5"}`}></div>
                    </button>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-[#f8fafc] rounded-xl">
                    <div><div className="font-bold">Escalate to human</div><div className="text-sm text-[#64748b]">Transfer complex queries to you</div></div>
                    <button onClick={() => settings && updateSetting("escalateToHuman", !settings.escalateToHuman)} className={`w-12 h-6 rounded-full relative transition-all ${settings?.escalateToHuman ? "bg-[#25D366]" : "bg-[#e2e8f0]"}`}>
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${settings?.escalateToHuman ? "right-0.5" : "left-0.5"}`}></div>
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-bold mb-4">Response Settings</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#f8fafc] rounded-xl">
                    <div className="text-sm text-[#64748b] mb-1">Response Tone</div>
                    <select value={settings?.responseTone || "Friendly & Professional"} onChange={(e) => updateSetting("responseTone", e.target.value)} className="w-full bg-transparent font-bold focus:outline-none">
                      <option>Friendly & Professional</option>
                      <option>Casual</option>
                      <option>Formal</option>
                    </select>
                  </div>
                  <div className="p-4 bg-[#f8fafc] rounded-xl">
                    <div className="text-sm text-[#64748b] mb-1">Max Response Length</div>
                    <select value={settings?.maxResponseLength || 150} onChange={(e) => updateSetting("maxResponseLength", parseInt(e.target.value))} className="w-full bg-transparent font-bold focus:outline-none">
                      <option value={100}>100 words</option>
                      <option value={150}>150 words</option>
                      <option value={200}>200 words</option>
                      <option value={300}>300 words</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
            <h4 className="font-bold mb-4">Quick Actions</h4>
            <div className="space-y-2">
              <button onClick={() => setShowTemplateModal(true)} className="w-full py-3 bg-[#8b5cf6]/10 text-[#8b5cf6] rounded-xl font-semibold text-sm text-left px-4 hover:bg-[#8b5cf6] hover:text-white transition-all">
                <i className="fas fa-magic mr-2"></i>Create Template
              </button>
              <button onClick={() => setShowAutomationModal(true)} className="w-full py-3 bg-[#25D366]/10 text-[#25D366] rounded-xl font-semibold text-sm text-left px-4 hover:bg-[#25D366] hover:text-white transition-all">
                <i className="fas fa-bolt mr-2"></i>New Automation
              </button>
              <button onClick={() => setActiveTab("analytics")} className="w-full py-3 bg-[#f59e0b]/10 text-[#f59e0b] rounded-xl font-semibold text-sm text-left px-4 hover:bg-[#f59e0b] hover:text-white transition-all">
                <i className="fas fa-chart-pie mr-2"></i>View Reports
              </button>
              <button onClick={() => setActiveTab("settings")} className="w-full py-3 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-sm text-left px-4 hover:bg-[#64748b] hover:text-white transition-all">
                <i className="fas fa-cog mr-2"></i>Settings
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] rounded-2xl p-5 text-white">
            <h4 className="font-bold mb-2">Train Your AI</h4>
            <p className="text-sm opacity-80 mb-4">Upload conversation logs to improve AI responses</p>
            <button className="w-full py-3 bg-white text-[#8b5cf6] rounded-xl font-bold text-sm">
              <i className="fas fa-upload mr-2"></i>Upload Data
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
            <h4 className="font-bold mb-4">Today's Performance</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748b]">Messages Handled</span>
                <span className="font-bold">{recentChats.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748b]">Auto Replies</span>
                <span className="font-bold text-[#25D366]">{Math.floor(recentChats.length * 0.72)} (72%)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748b]">Sales Assisted</span>
                <span className="font-bold text-[#10b981]">$3,420</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#64748b]">Time Saved</span>
                <span className="font-bold text-[#3b82f6]">4.2 hrs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTemplateModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <i className="fas fa-file-alt text-[#8b5cf6]"></i>{editingTemplate ? "Edit Template" : "New Template"}
              </h2>
              <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl" onClick={() => setShowTemplateModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-sm mb-2">Template Name</label>
                <input type="text" value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6]" placeholder="e.g., Greeting" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Trigger Keywords</label>
                <input type="text" value={templateForm.trigger} onChange={(e) => setTemplateForm({...templateForm, trigger: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6]" placeholder="e.g., hello, hi, hey" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Category</label>
                <select value={templateForm.category} onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6]">
                  <option>Welcome</option>
                  <option>Sales</option>
                  <option>Support</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Response</label>
                <textarea value={templateForm.response} onChange={(e) => setTemplateForm({...templateForm, response: e.target.value})} rows={4} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6] resize-none" placeholder="AI response..."></textarea>
              </div>
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={() => setShowTemplateModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={saveTemplate}>
                <i className="fas fa-check mr-2"></i>{editingTemplate ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAutomationModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAutomationModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <i className="fas fa-magic text-[#8b5cf6]"></i>{editingRule ? "Edit Automation" : "New Automation"}
              </h2>
              <button className="w-10 h-10 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-xl" onClick={() => setShowAutomationModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block font-semibold text-sm mb-2">Rule Name</label>
                <input type="text" value={automationForm.name} onChange={(e) => setAutomationForm({...automationForm, name: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6]" placeholder="e.g., Quick Greeting" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Trigger</label>
                <input type="text" value={automationForm.trigger} onChange={(e) => setAutomationForm({...automationForm, trigger: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6]" placeholder="e.g., First message" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Action</label>
                <input type="text" value={automationForm.action} onChange={(e) => setAutomationForm({...automationForm, action: e.target.value})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6]" placeholder="e.g., Send greeting + ask need" />
              </div>
              <div>
                <label className="block font-semibold text-sm mb-2">Type</label>
                <select value={automationForm.type} onChange={(e) => setAutomationForm({...automationForm, type: e.target.value as "Auto" | "Smart" | "Trigger"})} className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#8b5cf6]">
                  <option value="Auto">Auto</option>
                  <option value="Smart">Smart</option>
                  <option value="Trigger">Trigger</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#64748b]" onClick={() => setShowAutomationModal(false)}>Cancel</button>
              <button className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-semibold text-sm hover:shadow-lg" onClick={saveAutomationRule}>
                <i className="fas fa-check mr-2"></i>{editingRule ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
