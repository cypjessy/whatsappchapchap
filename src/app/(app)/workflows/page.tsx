"use client";

import { useState } from "react";

export default function WorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const workflows = [
    { id: "welcome-flow", name: "Welcome Series", desc: "3-step onboarding for new customers • Last edited 2 hours ago", status: "active", icon: "fa-hand-sparkles", iconBg: "from-[#dbeafe] to-[#bfdbfe]", iconColor: "text-[#3b82f6]", trigger: "New Contact Added", triggerIcon: "fab fa-whatsapp", triggered: 1234, complete: "89%" },
    { id: "cart-recovery", name: "Cart Recovery Pro", desc: "3-reminder sequence with discount escalation • Last edited yesterday", status: "active", icon: "fa-shopping-cart", iconBg: "from-[#fef3c7] to-[#fde68a]", iconColor: "text-[#f59e0b]", trigger: "Cart Abandoned (1h)", triggerIcon: "fas fa-clock", triggered: 567, complete: "34%", recovered: true },
    { id: "flash-sale", name: "Flash Sale Alert", desc: "Urgent sale notifications to VIP customers • Scheduled for Black Friday", status: "paused", icon: "fa-bolt", iconBg: "from-[#fce7f3] to-[#fbcfe8]", iconColor: "text-[#ec4899]", trigger: "Scheduled: Nov 24", triggerIcon: "fas fa-calendar", triggered: 0, complete: "-" },
    { id: "loyalty-reward", name: "Loyalty Rewards", desc: "Automated rewards for repeat customers • Not yet published", status: "draft", icon: "fa-gift", iconBg: "from-[#f3e8ff] to-[#e9d5ff]", iconColor: "text-[#8b5cf6]", trigger: "5th Order Completed", triggerIcon: "fas fa-trophy", triggered: null, complete: null },
  ];

  const templates = [
    { id: "welcome", name: "Welcome New Customers", desc: "Automatically send welcome message with catalog to new WhatsApp contacts", icon: "👋", bg: "from-[#dbeafe] to-[#bfdbfe]", uses: "2.3k", time: "5 min", featured: true },
    { id: "abandoned", name: "Abandoned Cart Recovery", desc: "Follow up with customers who left items in cart after 1 hour", icon: "🛒", bg: "from-[#fef3c7] to-[#fde68a]", uses: "1.8k", time: "10 min" },
    { id: "birthday", name: "Birthday Discount", desc: "Send personalized birthday wishes with exclusive discount code", icon: "🎂", bg: "from-[#fce7f3] to-[#fbcfe8]", uses: "956", time: "3 min" },
    { id: "feedback", name: "Post-Purchase Feedback", desc: "Request review 3 days after delivery with incentive for feedback", icon: "⭐", bg: "from-[#dcfce7] to-[#bbf7d0]", uses: "1.2k", time: "7 min" },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "active": return "bg-[#10b981] text-white";
      case "paused": return "bg-[#f59e0b] text-white";
      default: return "bg-[#64748b] text-white";
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case "active": return "bg-[#25D366]";
      case "paused": return "bg-[#e2e8f0]";
      default: return "bg-[#e2e8f0]";
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    if (statusFilter && w.status !== statusFilter) return false;
    if (searchTerm && !w.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="animate-fadeIn">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-project-diagram text-[#25D366]"></i>Automation Workflows
          </h1>
          <p className="text-[#64748b]">Build powerful automations with visual drag-and-drop builder</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
            <i className="fas fa-chart-line mr-2"></i>Analytics
          </button>
          <button className="px-4 py-2 bg-[#8b5cf6] text-white rounded-xl font-semibold text-sm">
            <i className="fas fa-layer-group mr-2"></i>Templates
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] flex items-center gap-4">
          <div className="w-14 h-14 bg-[rgba(37,211,102,0.1)] rounded-2xl flex items-center justify-center text-[#25D366] text-2xl">
            <i className="fas fa-play-circle"></i>
          </div>
          <div><div className="text-3xl font-extrabold">12</div><div className="text-sm text-[#64748b] font-semibold">Active Workflows</div></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] flex items-center gap-4">
          <div className="w-14 h-14 bg-[rgba(59,130,246,0.1)] rounded-2xl flex items-center justify-center text-[#3b82f6] text-2xl">
            <i className="fas fa-bolt"></i>
          </div>
          <div><div className="text-3xl font-extrabold">3.4k</div><div className="text-sm text-[#64748b] font-semibold">Executions Today</div></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] flex items-center gap-4">
          <div className="w-14 h-14 bg-[rgba(139,92,246,0.1)] rounded-2xl flex items-center justify-center text-[#8b5cf6] text-2xl">
            <i className="fas fa-check-circle"></i>
          </div>
          <div><div className="text-3xl font-extrabold">97%</div><div className="text-sm text-[#64748b] font-semibold">Success Rate</div></div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0] flex items-center gap-4">
          <div className="w-14 h-14 bg-[rgba(249,115,22,0.1)] rounded-2xl flex items-center justify-center text-[#f97316] text-2xl">
            <i className="fas fa-clock"></i>
          </div>
          <div><div className="text-3xl font-extrabold">2.1s</div><div className="text-sm text-[#64748b] font-semibold">Avg Execution Time</div></div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-star text-[#f59e0b]"></i>Quick Start Templates
          </h2>
          <button className="px-3 py-2 bg-white border-2 border-[#e2e8f0] rounded-xl text-sm font-semibold hover:border-[#25D366]">Browse All</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map(t => (
            <div key={t.id} className={`bg-white p-5 rounded-2xl border-2 border-[#e2e8f0] cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all ${t.featured ? "border-[#25D366] bg-gradient-to-br from-[rgba(37,211,102,0.05)] to-white relative" : ""}`}>
              {t.featured && <span className="absolute top-3 right-[-2rem] bg-[#25D366] text-white text-[0.65rem] font-bold px-4 py-0.5 rotate-45">POPULAR</span>}
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${t.bg} flex items-center justify-center text-3xl mb-3`}>{t.icon}</div>
              <div className="font-bold text-lg mb-2">{t.name}</div>
              <div className="text-sm text-[#64748b] mb-3">{t.desc}</div>
              <div className="flex gap-4 text-xs text-[#64748b]">
                <span><i className="fas fa-bolt mr-1"></i>{t.uses} uses</span>
                <span><i className="fas fa-clock mr-1"></i>{t.time} setup</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflows List */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden mb-8">
        <div className="p-5 border-b border-[#e2e8f0] flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-list text-[#8b5cf6]"></i>Your Workflows
          </h2>
          <div className="flex gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
              <input type="text" placeholder="Search workflows..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm focus:border-[#25D366] focus:outline-none" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border-2 border-[#e2e8f0] rounded-xl text-sm">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <div>
          {filteredWorkflows.map((workflow, idx) => (
            <div key={workflow.id} className={`p-5 border-b border-[#e2e8f0] grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto_auto] gap-4 items-center hover:bg-[#f8fafc] ${idx === 0 ? "" : ""}`}>
              <label className="relative w-13 h-7 cursor-pointer">
                <input type="checkbox" defaultChecked={workflow.status === "active"} className="sr-only peer" />
                <span className={`absolute inset-0 rounded-full transition-all ${getStatusClass(workflow.status)} peer-checked:bg-[#25D366]`}>
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all left-1 peer-checked:translate-x-6`}></span>
                </span>
              </label>
              
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${workflow.iconBg} flex items-center justify-center text-xl ${workflow.iconColor}`}>
                  <i className={`fas ${workflow.icon}`}></i>
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    {workflow.name}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(workflow.status)}`}>{workflow.status}</span>
                  </div>
                  <div className="text-sm text-[#64748b]">{workflow.desc}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 bg-[#f8fafc] rounded-full text-sm">
                <i className={`${workflow.triggerIcon} ${workflow.trigger.includes("WhatsApp") ? "text-[#25D366]" : workflow.trigger.includes("Clock") ? "text-[#f59e0b]" : "text-[#8b5cf6]"}`}></i>
                {workflow.trigger}
              </div>

              <div className="flex gap-6 text-center">
                <div><div className="font-extrabold text-xl">{workflow.triggered !== null ? workflow.triggered : "-"}</div><div className="text-xs text-[#64748b] uppercase">Triggered</div></div>
                <div><div className="font-extrabold text-xl">{workflow.complete || "-"}</div><div className="text-xs text-[#64748b] uppercase">{workflow.recovered ? "Recovered" : "Complete"}</div></div>
              </div>

              <div className="flex gap-2">
                <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:bg-[#25D366] hover:text-white rounded-lg transition-all"><i className="fas fa-edit"></i></button>
                <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:bg-[#25D366] hover:text-white rounded-lg transition-all"><i className="fas fa-copy"></i></button>
                <button className="w-9 h-9 flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white rounded-lg transition-all"><i className="fas fa-trash"></i></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Visual Builder Preview */}
      <div className="bg-white rounded-2xl p-6 border border-[#e2e8f0]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <i className="fas fa-sitemap text-[#25D366]"></i>Visual Workflow Builder
            </h2>
            <p className="text-[#64748b] mt-1">Drag and drop nodes to create powerful automations</p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm">
            <i className="fas fa-external-link-alt mr-2"></i>Open Full Builder
          </button>
        </div>

        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-xl p-8 min-h-[400px] relative overflow-hidden">
          {/* Trigger Node */}
          <div className="absolute top-[50px] left-[50px] inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md border-2 border-[#25D366] bg-[#DCF8C6]">
            <div className="w-10 h-10 bg-[#DCF8C6] text-[#25D366] rounded-lg flex items-center justify-center"><i className="fab fa-whatsapp"></i></div>
            <div><div className="font-bold text-sm">New Message</div><div className="text-xs text-[#64748b]">Trigger</div></div>
          </div>

          {/* Condition Node */}
          <div className="absolute top-[50px] left-[350px] inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md border-2 border-[#f59e0b] rotate-45">
            <div className="w-10 h-10 bg-[rgba(245,158,11,0.1)] text-[#f59e0b] rounded-lg flex items-center justify-center"><i className="fas fa-question"></i></div>
            <div className="-rotate-45"><div className="font-bold text-sm">Contains "price"?</div><div className="text-xs text-[#64748b]">Condition</div></div>
          </div>

          {/* Action Node */}
          <div className="absolute top-[200px] left-[350px] inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md border-2 border-[#3b82f6]">
            <div className="w-10 h-10 bg-[rgba(59,130,246,0.1)] text-[#3b82f6] rounded-lg flex items-center justify-center"><i className="fas fa-robot"></i></div>
            <div><div className="font-bold text-sm">Send Price List</div><div className="text-xs text-[#64748b]">Action</div></div>
          </div>

          {/* Action Node 2 */}
          <div className="absolute top-[200px] left-[650px] inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md border-2 border-[#3b82f6]">
            <div className="w-10 h-10 bg-[rgba(59,130,246,0.1)] text-[#3b82f6] rounded-lg flex items-center justify-center"><i className="fas fa-tag"></i></div>
            <div><div className="font-bold text-sm">Apply Discount</div><div className="text-xs text-[#64748b]">Action</div></div>
          </div>

          {/* End Node */}
          <div className="absolute top-[50px] left-[650px] inline-flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md border-2 border-[#10b981]">
            <div className="w-10 h-10 bg-[rgba(37,211,102,0.1)] text-[#10b981] rounded-lg flex items-center justify-center"><i className="fas fa-check"></i></div>
            <div><div className="font-bold text-sm">Complete</div><div className="text-xs text-[#64748b]">End</div></div>
          </div>

          {/* Connections */}
          <div className="absolute top-[85px] left-[230px] w-[100px] h-[3px] bg-gradient-to-r from-[#25D366] to-[#3b82f6]"></div>
          <div className="absolute top-[150px] left-[360px] w-[3px] h-[35px] bg-[#3b82f6]"></div>
          <div className="absolute top-[235px] left-[530px] w-[100px] h-[3px] bg-gradient-to-r from-[#3b82f6] to-[#10b981]"></div>
        </div>

        {/* Execution Log */}
        <div className="mt-6 bg-[#0f172a] rounded-xl p-4 text-white font-mono text-sm max-h-[200px] overflow-y-auto">
          <div className="flex gap-4 mb-2"><span className="text-[#25D366]">10:42:15</span><span className="text-[#10b981]">[SUCCESS]</span><span>Workflow "Welcome Series" executed for Alice Johnson</span></div>
          <div className="flex gap-4 mb-2"><span className="text-[#25D366]">10:42:14</span><span className="text-[#3b82f6]">[INFO]</span><span>Condition check: Message contains "price" = true</span></div>
          <div className="flex gap-4 mb-2"><span className="text-[#25D366]">10:42:13</span><span className="text-[#10b981]">[SUCCESS]</span><span>Price list sent via WhatsApp</span></div>
          <div className="flex gap-4 mb-2"><span className="text-[#25D366]">10:42:12</span><span className="text-[#f59e0b]">[WARNING]</span><span>Customer asked for discount - applying VIP 10%</span></div>
          <div className="flex gap-4"><span className="text-[#25D366]">10:42:11</span><span className="text-[#3b82f6]">[INFO]</span><span>Trigger activated: New message received</span></div>
        </div>
      </div>
    </div>
  );
}