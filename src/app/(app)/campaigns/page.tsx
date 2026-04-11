"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { campaignService, customerService, Campaign } from "@/lib/db";
import CreateCampaignModal from "@/components/campaigns/CreateCampaignModal";
import ViewCampaignModal from "@/components/campaigns/ViewCampaignModal";

interface CampaignStats {
  total: number;
  active: number;
  scheduled: number;
  completed: number;
  totalReach: number;
}

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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

  const getStats = (): CampaignStats => {
    return {
      total: campaigns.length,
      active: campaigns.filter(c => c.status === "running" || c.status === "sending").length,
      scheduled: campaigns.filter(c => c.status === "scheduled").length,
      completed: campaigns.filter(c => c.status === "completed").length,
      totalReach: campaigns.reduce((acc, c) => acc + (c.recipientCount || 0), 0),
    };
  };

  const stats = getStats();

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = !searchTerm || 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !typeFilter || campaign.type === typeFilter;
    const matchesTab = activeTab === "all" || campaign.status === activeTab || 
      (activeTab === "running" && (campaign.status === "running" || campaign.status === "sending")) ||
      (activeTab === "draft" && campaign.status === "draft");
    return matchesSearch && matchesType && matchesTab;
  });

  const tabs = [
    { id: "all", label: "All Campaigns", count: campaigns.length },
    { id: "running", label: "Running", count: stats.active },
    { id: "scheduled", label: "Scheduled", count: stats.scheduled },
    { id: "completed", label: "Completed", count: stats.completed },
    { id: "draft", label: "Drafts", count: campaigns.filter(c => c.status === "draft").length },
  ];

  const getStatusClass = (status: string) => {
    const classes: Record<string, string> = {
      running: "status-running",
      sending: "status-running",
      scheduled: "status-scheduled",
      paused: "status-paused",
      completed: "status-completed",
      draft: "status-paused",
    };
    return classes[status] || "status-paused";
  };

  const getTypeClass = (type: string) => {
    const classes: Record<string, string> = {
      broadcast: "type-broadcast",
      automated: "type-automated",
      promotional: "type-promo",
      promo: "type-promo",
      followup: "type-automated",
    };
    return classes[type] || "type-broadcast";
  };

  return (
    <div className="campaigns-page">
      <style jsx>{`
        .campaigns-page { max-width: 1600px; margin: 0 auto; }
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }
        .header-content h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
        .header-content p { color: #64748b; font-size: 1rem; }
        .header-stats { display: flex; gap: 1rem; }
        .stat-card-mini { background: #ffffff; border-radius: 12px; padding: 1rem 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 1px 2px rgba(0,0,0,0.05); text-align: center; min-width: 120px; }
        .stat-value-mini { font-size: 1.5rem; font-weight: 800; color: #25D366; }
        .stat-value-mini.info { color: #3b82f6; }
        .stat-value-mini.purple { color: #8b5cf6; }
        .stat-label-mini { font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .header-actions { display: flex; gap: 0.75rem; }
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-primary { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4); }
        .btn-secondary { background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { border-color: #25D366; color: #25D366; }
        .overview-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
        @media (max-width: 1200px) { .overview-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .overview-grid { grid-template-columns: 1fr; } }
        .overview-card { background: #ffffff; border-radius: 16px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 1rem; transition: all 0.2s; }
        .overview-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px rgba(0,0,0,0.1); }
        .overview-icon { width: 60px; height: 60px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
        .overview-icon.active { background: rgba(37, 211, 102, 0.1); color: #25D366; }
        .overview-icon.scheduled { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .overview-icon.completed { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .overview-icon.reach { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
        .overview-content h3 { font-size: 0.875rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
        .overview-value { font-size: 1.75rem; font-weight: 800; color: #1e293b; }
        .overview-change { font-size: 0.875rem; color: #10b981; font-weight: 600; display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem; }
        .quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }
        @media (max-width: 1200px) { .quick-actions { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .quick-actions { grid-template-columns: 1fr; } }
        .action-card { background: #ffffff; border-radius: 12px; padding: 1.25rem; border: 2px solid #e2e8f0; cursor: pointer; transition: all 0.2s; text-align: center; }
        .action-card:hover { border-color: #25D366; transform: translateY(-2px); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .action-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin: 0 auto 0.75rem; }
        .action-icon.broadcast { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; }
        .action-icon.automated { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; }
        .action-icon.promo { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; }
        .action-icon.template { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
        .action-title { font-weight: 700; margin-bottom: 0.25rem; font-size: 0.95rem; }
        .action-desc { font-size: 0.8rem; color: #64748b; }
        .toolbar { background: #ffffff; border-radius: 16px; padding: 1.25rem; margin-bottom: 1.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; }
        .toolbar-left { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; }
        .search-box { position: relative; width: 320px; }
        .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 0.9rem; transition: all 0.2s; background: #f8fafc; }
        .search-box input:focus { outline: none; border-color: #25D366; background: white; box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1); }
        .search-box i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; }
        .filter-select { padding: 0.75rem 2.5rem 0.75rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 0.9rem; background: #f8fafc; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 1rem center; }
        .filter-select:focus { outline: none; border-color: #25D366; }
        .status-tabs { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x auto; padding-bottom: 0.5rem; }
        .status-tab { padding: 0.75rem 1.5rem; background: #ffffff; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: #64748b; transition: all 0.2s; white-space: nowrap; display: flex; align-items: center; gap: 0.5rem; }
        .status-tab:hover { border-color: #25D366; color: #25D366; }
        .status-tab.active { background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border-color: #25D366; box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
        .status-count { background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
        .campaigns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        @media (max-width: 768px) { .campaigns-grid { grid-template-columns: 1fr; } }
        .campaign-card { background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; transition: all 0.3s; position: relative; }
        .campaign-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px rgba(0,0,0,0.1); border-color: #25D366; }
        .campaign-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
        .campaign-type { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.875rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.75rem; }
        .type-broadcast { background: rgba(37, 211, 102, 0.1); color: #128C7E; }
        .type-automated { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .type-promo { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
        .campaign-title { font-size: 1.125rem; font-weight: 800; margin-bottom: 0.25rem; color: #1e293b; }
        .campaign-date { font-size: 0.875rem; color: #64748b; display: flex; align-items: center; gap: 0.5rem; }
        .campaign-menu { background: none; border: none; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; color: #64748b; transition: all 0.2s; }
        .campaign-menu:hover { background: #f8fafc; color: #25D366; }
        .campaign-body { padding: 1.5rem; }
        .campaign-preview { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 8px; padding: 1rem; margin-bottom: 1.25rem; border: 1px solid #e2e8f0; }
        .preview-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
        .preview-content { font-size: 0.9rem; color: #1e293b; line-height: 1.6; }
        .campaign-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        .campaign-stat { text-align: center; padding: 0.75rem; background: #f8fafc; border-radius: 8px; }
        .campaign-stat-value { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 0.25rem; }
        .campaign-stat-label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
        .progress-bar { width: 100%; height: 8px; background: #f8fafc; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #25D366 0%, #00C853 100%); border-radius: 4px; transition: width 0.3s; }
        .progress-text { display: flex; justify-content: space-between; font-size: 0.875rem; color: #64748b; }
        .campaign-footer { padding: 1rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: rgba(248, 250, 252, 0.5); }
        .campaign-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 700; }
        .status-dot { width: 10px; height: 10px; border-radius: 50%; animation: pulse 2s infinite; }
        .status-running .status-dot { background: #10b981; }
        .status-scheduled .status-dot { background: #3b82f6; animation: none; }
        .status-paused .status-dot { background: #f59e0b; animation: none; }
        .status-completed .status-dot { background: #8b5cf6; animation: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .campaign-actions { display: flex; gap: 0.5rem; }
        .action-btn-sm { padding: 0.5rem 1rem; border-radius: 6px; border: none; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
        .btn-pause { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .btn-pause:hover { background: #f59e0b; color: white; }
        .btn-resume { background: rgba(37, 211, 102, 0.1); color: #25D366; }
        .btn-resume:hover { background: #25D366; color: white; }
        .btn-analytics { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .btn-analytics:hover { background: #3b82f6; color: white; }
        .templates-section { background: #ffffff; border-radius: 16px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-bottom: 2rem; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .section-title { font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; }
        .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
        .template-card { background: #f8fafc; border-radius: 8px; padding: 1.25rem; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; position: relative; }
        .template-card:hover { border-color: #25D366; background: white; transform: translateY(-2px); }
        .template-card.featured { border-color: #25D366; background: rgba(37, 211, 102, 0.05); }
        .template-badge { position: absolute; top: -10px; right: 1rem; padding: 0.25rem 0.75rem; background: #25D366; color: white; font-size: 0.75rem; font-weight: 700; border-radius: 20px; }
        .template-icon { width: 50px; height: 50px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 1rem; }
        .template-icon.welcome { background: rgba(37, 211, 102, 0.1); }
        .template-icon.promo { background: rgba(236, 72, 153, 0.1); }
        .template-icon.abandoned { background: rgba(245, 158, 11, 0.1); }
        .template-icon.feedback { background: rgba(59, 130, 246, 0.1); }
        .template-name { font-weight: 700; margin-bottom: 0.5rem; }
        .template-desc { font-size: 0.875rem; color: #64748b; margin-bottom: 1rem; }
        .template-meta { display: flex; justify-content: space-between; font-size: 0.8rem; color: #64748b; }
        .analytics-section { background: #ffffff; border-radius: 16px; padding: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .chart-container { height: 300px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; position: relative; }
        .chart-placeholder { text-align: center; color: #64748b; }
        .chart-placeholder i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; color: #25D366; }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px); z-index: 1000; animation: fadeIn 0.2s; }
        .modal-overlay.active { display: flex; align-items: center; justify-content: center; padding: 2rem; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal { background: #ffffff; border-radius: 16px; width: 100%; max-width: 700px; max-height: 90vh; overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.25); animation: slideUp 0.3s; display: flex; flex-direction: column; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-size: 1.25rem; font-weight: 800; }
        .modal-close { width: 40px; height: 40px; border-radius: 50%; border: none; background: #f8fafc; cursor: pointer; font-size: 1.25rem; color: #64748b; transition: all 0.2s; }
        .modal-close:hover { background: #ef4444; color: white; }
        .modal-body { overflow-y: auto; padding: 1.5rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-label { display: block; margin-bottom: 0.5rem; font-weight: 700; font-size: 0.9rem; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 0.875rem 1rem; border: 2px solid #e2e8f0; border-radius: 8px; font-family: inherit; font-size: 0.9rem; transition: all 0.2s; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #25D366; }
        .form-textarea { resize: vertical; min-height: 120px; }
        .character-count { text-align: right; font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }
        .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 0.75rem; }
        .empty-state { padding: 3rem; text-align: center; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; }
        .empty-icon { width: 64px; height: 64px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.5rem; color: #64748b; }
      `}</style>

      <div className="page-header">
        <div className="header-content">
          <h1><i className="fas fa-bullhorn" style={{ color: "#25D366" }}></i> Marketing Campaigns</h1>
          <p>Create, manage, and track WhatsApp marketing campaigns</p>
        </div>
        <div className="header-stats">
          <div className="stat-card-mini">
            <div className="stat-value-mini">{stats.active}</div>
            <div className="stat-label-mini">Active</div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-value-mini info">{stats.scheduled}</div>
            <div className="stat-label-mini">Scheduled</div>
          </div>
          <div className="stat-card-mini">
            <div className="stat-value-mini purple">{stats.completed}</div>
            <div className="stat-label-mini">Completed</div>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary"><i className="fas fa-chart-line"></i> Analytics</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><i className="fas fa-plus"></i> New Campaign</button>
        </div>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <div className="overview-icon active"><i className="fas fa-paper-plane"></i></div>
          <div className="overview-content">
            <h3>Active Campaigns</h3>
            <div className="overview-value">{stats.active}</div>
            <div className="overview-change"><i className="fas fa-arrow-up"></i> +3 this week</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon scheduled"><i className="fas fa-clock"></i></div>
          <div className="overview-content">
            <h3>Scheduled</h3>
            <div className="overview-value">{stats.scheduled}</div>
            <div className="overview-change"><i className="fas fa-calendar"></i> Next: Tomorrow</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon completed"><i className="fas fa-check-circle"></i></div>
          <div className="overview-content">
            <h3>Completed</h3>
            <div className="overview-value">{stats.completed}</div>
            <div className="overview-change"><i className="fas fa-arrow-up"></i> +24 this month</div>
          </div>
        </div>
        <div className="overview-card">
          <div className="overview-icon reach"><i className="fas fa-users"></i></div>
          <div className="overview-content">
            <h3>Total Reach</h3>
            <div className="overview-value">{stats.totalReach > 1000 ? `${(stats.totalReach / 1000).toFixed(1)}K` : stats.totalReach}</div>
            <div className="overview-change"><i className="fas fa-arrow-up"></i> +18.5% growth</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <div className="action-card" onClick={() => setShowModal(true)}>
          <div className="action-icon broadcast"><i className="fas fa-broadcast-tower"></i></div>
          <div className="action-title">Quick Broadcast</div>
          <div className="action-desc">Send instant message to all customers</div>
        </div>
        <div className="action-card" onClick={() => setShowModal(true)}>
          <div className="action-icon automated"><i className="fas fa-robot"></i></div>
          <div className="action-title">AI Campaign</div>
          <div className="action-desc">Automated personalized campaigns</div>
        </div>
        <div className="action-card" onClick={() => setShowModal(true)}>
          <div className="action-icon promo"><i className="fas fa-percentage"></i></div>
          <div className="action-title">Promo Code</div>
          <div className="action-desc">Discount code distribution</div>
        </div>
        <div className="action-card" onClick={() => alert("Template management coming soon")}>
          <div className="action-icon template"><i className="fas fa-layer-group"></i></div>
          <div className="action-title">Templates</div>
          <div className="action-desc">Manage message templates</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search campaigns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="broadcast">Broadcast</option>
            <option value="automated">Automated</option>
            <option value="promo">Promotional</option>
          </select>
        </div>
        <button className="btn btn-secondary" onClick={loadCampaigns}><i className="fas fa-sync-alt"></i></button>
      </div>

      <div className="status-tabs">
        {tabs.map(tab => (
          <div key={tab.id} className={`status-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            {tab.id === "running" && <i className="fas fa-play-circle"></i>}
            {tab.id === "scheduled" && <i className="fas fa-clock"></i>}
            {tab.id === "completed" && <i className="fas fa-check-circle"></i>}
            {tab.id === "draft" && <i className="fas fa-edit"></i>}
            {tab.label}
            <span className="status-count">{tab.count}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <i className="fas fa-spinner fa-spin" style={{ fontSize: "2rem", color: "#25D366" }}></i>
          <p style={{ marginTop: "1rem", color: "#64748b" }}>Loading campaigns...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><i className="fas fa-bullhorn"></i></div>
          <h3 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>No campaigns found</h3>
          <p style={{ color: "#64748b" }}>Create your first WhatsApp marketing campaign.</p>
          <button className="btn btn-primary" style={{ marginTop: "1rem" }} onClick={() => setShowModal(true)}>
            <i className="fas fa-plus"></i> Create Campaign
          </button>
        </div>
      ) : (
        <div className="campaigns-grid">
          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} className="campaign-card" onClick={() => { setSelectedCampaign(campaign); setShowViewModal(true); }} style={{ cursor: "pointer" }}>
              <div className="campaign-header">
                <div>
                  <span className={`campaign-type ${getTypeClass(campaign.type)}`}>
                    <i className={campaign.type === "broadcast" ? "fas fa-broadcast-tower" : campaign.type === "automated" ? "fas fa-robot" : "fas fa-percentage"}></i>
                    {campaign.type}
                  </span>
                  <div className="campaign-title">{campaign.name}</div>
                  <div className="campaign-date">
                    <i className="fas fa-calendar"></i>
                    {campaign.sentAt ? `Sent ${new Date(campaign.sentAt).toLocaleDateString()}` : campaign.status === "scheduled" ? "Scheduled" : "Created " + new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button className="campaign-menu" onClick={(e) => { e.stopPropagation(); }}><i className="fas fa-ellipsis-v"></i></button>
              </div>
              <div className="campaign-body">
                <div className="campaign-preview">
                  <div className="preview-label">Message Preview</div>
                  <div className="preview-content">{campaign.message || "No message content"}</div>
                </div>
                <div className="campaign-stats">
                  <div className="campaign-stat">
                    <div className="campaign-stat-value">{campaign.recipientCount || 0}</div>
                    <div className="campaign-stat-label">Target</div>
                  </div>
                  <div className="campaign-stat">
                    <div className="campaign-stat-value">{campaign.deliveredCount || 0}</div>
                    <div className="campaign-stat-label">Sent</div>
                  </div>
                  <div className="campaign-stat">
                    <div className="campaign-stat-value">{campaign.responseCount || 0}</div>
                    <div className="campaign-stat-label">Responses</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: campaign.status === "completed" ? "100%" : "50%" }}></div>
                </div>
                <div className="progress-text">
                  <span>{campaign.status === "completed" ? "100% Complete" : "In Progress"}</span>
                  <span>{campaign.recipientCount || 0} recipients</span>
                </div>
              </div>
              <div className="campaign-footer">
                <div className={`campaign-status ${getStatusClass(campaign.status)}`}>
                  <span className="status-dot"></span>
                  {campaign.status}
                </div>
                <div className="campaign-actions">
                  {campaign.status === "running" && (
                    <button className="action-btn-sm btn-pause" onClick={(e) => e.stopPropagation()}><i className="fas fa-pause"></i> Pause</button>
                  )}
                  <button className="action-btn-sm btn-analytics" onClick={(e) => { e.stopPropagation(); setSelectedCampaign(campaign); setShowViewModal(true); }}><i className="fas fa-chart-bar"></i> Stats</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="templates-section">
        <div className="section-header">
          <h3 className="section-title"><i className="fas fa-magic" style={{ color: "#8b5cf6" }}></i> Quick Templates</h3>
          <button className="btn btn-secondary btn-sm">Manage</button>
        </div>
        <div className="templates-grid">
          <div className="template-card featured">
            <span className="template-badge">Popular</span>
            <div className="template-icon welcome">👋</div>
            <div className="template-name">Welcome New Customer</div>
            <div className="template-desc">Warm greeting for first-time buyers with discount code</div>
            <div className="template-meta">
              <span><i className="fas fa-paper-plane"></i> 89% open rate</span>
              <span><i className="fas fa-clock"></i> Auto-send</span>
            </div>
          </div>
          <div className="template-card">
            <div className="template-icon promo">🏷️</div>
            <div className="template-name">Flash Sale Alert</div>
            <div className="template-desc">Urgent promotional message with countdown timer</div>
            <div className="template-meta">
              <span><i className="fas fa-paper-plane"></i> 76% open rate</span>
              <span><i className="fas fa-mouse-pointer"></i> 34% CTR</span>
            </div>
          </div>
          <div className="template-card">
            <div className="template-icon abandoned">🛒</div>
            <div className="template-name">Cart Recovery</div>
            <div className="template-desc">Gentle reminder with incentive to complete purchase</div>
            <div className="template-meta">
              <span><i className="fas fa-undo"></i> 42% recovery</span>
              <span><i className="fas fa-robot"></i> AI-powered</span>
            </div>
          </div>
          <div className="template-card">
            <div className="template-icon feedback">⭐</div>
            <div className="template-name">Review Request</div>
            <div className="template-desc">Request product review 7 days after delivery</div>
            <div className="template-meta">
              <span><i className="fas fa-comment"></i> 23% response</span>
              <span><i className="fas fa-star"></i> 4.8 avg rating</span>
            </div>
          </div>
        </div>
      </div>

      <div className="analytics-section">
        <div className="section-header">
          <h3 className="section-title"><i className="fas fa-chart-line" style={{ color: "#25D366" }}></i> Campaign Performance</h3>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <select className="filter-select">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
              <option>This Year</option>
            </select>
            <button className="btn btn-secondary btn-sm"><i className="fas fa-download"></i> Export</button>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-placeholder">
            <i className="fas fa-chart-area"></i>
            <p>Campaign Performance Analytics</p>
            <small>Delivery rates, open rates, click-through rates, and revenue over time</small>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateCampaignModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            loadCampaigns();
          }}
          onSuccess={() => {
            loadCampaigns();
          }}
        />
      )}

      {showViewModal && selectedCampaign && (
        <ViewCampaignModal
          campaign={selectedCampaign}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setSelectedCampaign(null);
          }}
          onPause={() => {
            alert("Campaign paused!");
          }}
          onStop={() => {
            alert("Campaign stopped!");
          }}
          onDuplicate={() => {
            alert("Campaign duplicated!");
          }}
        />
      )}
    </div>
  );
}
