"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { campaignService, customerService, Campaign } from "@/lib/db";

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    type: "broadcast" as Campaign["type"],
    segment: "all" as Campaign["segment"],
    message: "",
    scheduledAt: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadCampaigns();
    loadCustomers();
  }, [user]);

  const loadCampaigns = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await campaignService.getCampaigns(user);
      setCampaigns(data);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setCampaigns([]);
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

  const createCampaign = async () => {
    if (!user) return;
    if (!newCampaign.name || !newCampaign.message) {
      alert("Please fill in campaign name and message");
      return;
    }

    try {
      const segmentCustomers = getSegmentCustomers(newCampaign.segment);
      const campaignData = {
        ...newCampaign,
        recipientCount: segmentCustomers.length,
        status: "draft" as Campaign["status"],
        deliveredCount: 0,
        responseCount: 0,
        scheduledAt: newCampaign.scheduledAt ? new Date(newCampaign.scheduledAt) : undefined,
      };

      await campaignService.createCampaign(user, campaignData);
      loadCampaigns();
      setShowModal(false);
      setNewCampaign({
        name: "",
        description: "",
        type: "broadcast",
        segment: "all",
        message: "",
        scheduledAt: "",
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Error creating campaign");
    }
  };

  const sendCampaign = async (campaign: Campaign) => {
    if (!user) return;
    setSending(true);
    try {
      const segmentCustomers = getSegmentCustomers(campaign.segment);
      let delivered = 0;
      let responses = 0;

      for (const customer of segmentCustomers) {
        if (customer.phone) {
          // Send WhatsApp message
          const message = campaign.message.replace("{{name}}", customer.name);
          const cleanPhone = customer.phone.replace(/[^0-9]/g, "");
          const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, "_blank");
          
          delivered++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
        }
      }

      await campaignService.updateCampaign(user, campaign.id, {
        status: "completed",
        sentAt: new Date(),
        deliveredCount: delivered,
        responseCount: responses,
      });

      loadCampaigns();
    } catch (error) {
      console.error("Error sending campaign:", error);
    } finally {
      setSending(false);
    }
  };

  const getSegmentCustomers = (segment: Campaign["segment"]) => {
    switch (segment) {
      case "vip":
        return customers.filter(c => c.segment === "vip");
      case "frequent":
        return customers.filter(c => c.segment === "frequent");
      case "new":
        return customers.filter(c => c.segment === "new");
      case "inactive":
        return customers.filter(c => c.segment === "inactive");
      default:
        return customers;
    }
  };

  const getStatusBadge = (status: Campaign["status"]) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      draft: { bg: "bg-gray-100", color: "text-gray-600", label: "Draft" },
      scheduled: { bg: "bg-blue-100", color: "text-blue-600", label: "Scheduled" },
      sending: { bg: "bg-yellow-100", color: "text-yellow-600", label: "Sending" },
      completed: { bg: "bg-green-100", color: "text-green-600", label: "Completed" },
      cancelled: { bg: "bg-red-100", color: "text-red-600", label: "Cancelled" },
    };
    return styles[status] || styles.draft;
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    if (activeTab === "all") return true;
    return campaign.status === activeTab;
  });

  const tabs = [
    { id: "all", label: "All Campaigns", count: campaigns.length },
    { id: "draft", label: "Drafts", count: campaigns.filter(c => c.status === "draft").length },
    { id: "scheduled", label: "Scheduled", count: campaigns.filter(c => c.status === "scheduled").length },
    { id: "completed", label: "Completed", count: campaigns.filter(c => c.status === "completed").length },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
            <i className="fas fa-bullhorn text-[#25D366]"></i>Marketing Campaigns
          </h1>
          <p className="text-[#64748b]">Create and manage WhatsApp marketing campaigns</p>
        </div>
        <button 
          className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus mr-2"></i>Create Campaign
        </button>
      </div>

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={`px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white" 
                : "bg-white border-2 border-[#e2e8f0] text-[#64748b] hover:border-[#25D366]"
            }`}
          >
            {tab.label}
            <span className="px-2 py-0.5 rounded-full text-xs bg-white/20">{tab.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#64748b]">Loading campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#e2e8f0]">
          <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-bullhorn text-2xl text-[#64748b]"></i>
          </div>
          <h4 className="font-bold text-[#1e293b] mb-2">No campaigns yet</h4>
          <p className="text-sm text-[#64748b]">Create your first WhatsApp marketing campaign.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map(campaign => {
            const statusStyle = getStatusBadge(campaign.status);
            const segmentCustomers = getSegmentCustomers(campaign.segment);
            
            return (
              <div key={campaign.id} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-2">{campaign.name}</h3>
                    <p className="text-sm text-[#64748b] mb-3 line-clamp-2">{campaign.description}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.bg} ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                      <span className="text-xs text-[#64748b] capitalize">{campaign.type}</span>
                    </div>
                  </div>
                  <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg">
                    <i className="fas fa-ellipsis-v"></i>
                  </button>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Target Segment:</span>
                    <span className="font-semibold capitalize">{campaign.segment}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748b]">Recipients:</span>
                    <span className="font-semibold">{segmentCustomers.length}</span>
                  </div>
                  {campaign.sentAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[#64748b]">Sent:</span>
                      <span className="font-semibold">{new Date(campaign.sentAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {campaign.status === "draft" && (
                    <button 
                      className="flex-1 py-2 bg-[#25D366] text-white rounded-lg font-semibold text-sm hover:bg-[#128C7E] transition-all"
                      onClick={() => sendCampaign(campaign)}
                      disabled={sending}
                    >
                      {sending ? "Sending..." : "Send Now"}
                    </button>
                  )}
                  {campaign.status === "completed" && (
                    <button className="flex-1 py-2 bg-[#f1f5f9] text-[#64748b] rounded-lg font-semibold text-sm">
                      View Results
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center">
              <h2 className="text-xl font-extrabold">Create New Campaign</h2>
              <button className="w-8 h-8 flex items-center justify-center text-[#64748b] hover:bg-[#f1f5f9] rounded-lg" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Campaign Name</label>
                  <input 
                    type="text" 
                    value={newCampaign.name} 
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                    placeholder="e.g., New Product Launch"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Description</label>
                  <textarea 
                    value={newCampaign.description} 
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" 
                    placeholder="Brief description of the campaign"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Campaign Type</label>
                    <select 
                      value={newCampaign.type} 
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, type: e.target.value as Campaign["type"] }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                    >
                      <option value="broadcast">Broadcast</option>
                      <option value="promotional">Promotional</option>
                      <option value="followup">Follow-up</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#1e293b] mb-2">Target Segment</label>
                    <select 
                      value={newCampaign.segment} 
                      onChange={(e) => setNewCampaign(prev => ({ ...prev, segment: e.target.value as Campaign["segment"] }))}
                      className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]"
                    >
                      <option value="all">All Customers</option>
                      <option value="vip">VIP Customers</option>
                      <option value="frequent">Frequent Buyers</option>
                      <option value="new">New Customers</option>
                      <option value="inactive">Inactive Customers</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Message</label>
                  <textarea 
                    value={newCampaign.message} 
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366] resize-none" 
                    placeholder="Hi {{name}}! Check out our amazing new products..."
                  />
                  <p className="text-xs text-[#64748b] mt-1">Use &#123;&#123;name&#125;&#125; to personalize messages</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[#1e293b] mb-2">Schedule (Optional)</label>
                  <input 
                    type="datetime-local" 
                    value={newCampaign.scheduledAt} 
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-[#e2e8f0] rounded-xl text-sm focus:outline-none focus:border-[#25D366]" 
                  />
                </div>

                <div className="bg-[#f8fafc] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm">Target Recipients</div>
                      <div className="text-sm text-[#64748b]">{getSegmentCustomers(newCampaign.segment).length} customers</div>
                    </div>
                    <div className="w-12 h-12 bg-[#25D366] rounded-full flex items-center justify-center text-white">
                      <i className="fas fa-users"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-[#e2e8f0] flex justify-end gap-3">
              <button 
                className="px-6 py-2 bg-[#f1f5f9] text-[#64748b] rounded-xl font-semibold text-sm hover:bg-[#e2e8f0]" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-semibold text-sm shadow-lg" 
                onClick={createCampaign}
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}