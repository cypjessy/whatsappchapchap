"use client";

import { useState, useEffect } from "react";
import { Campaign } from "@/lib/db";
import { formatCurrency, CURRENCY_SYMBOL } from "@/lib/currency";

interface ViewCampaignModalProps {
  campaign: Campaign;
  isOpen: boolean;
  onClose: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onDuplicate?: () => void;
}

export default function ViewCampaignModal({ campaign, isOpen, onClose, onPause, onStop, onDuplicate }: ViewCampaignModalProps) {
  const [currentSent, setCurrentSent] = useState(campaign.recipientCount || 0);
  const totalRecipients = campaign.recipientCount || 12456;

  useEffect(() => {
    if (!isOpen) return;
    
    const interval = setInterval(() => {
      setCurrentSent(prev => {
        if (prev >= totalRecipients) return prev;
        const increment = Math.floor(Math.random() * 50) + 10;
        return Math.min(prev + increment, totalRecipients);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, totalRecipients]);

  const getDelivered = () => Math.floor(currentSent * 0.89);
  const getOpened = () => Math.floor(getDelivered() * 0.34);
  const getClicked = () => Math.floor(getDelivered() * 0.12);
  
  const progress = (currentSent / totalRecipients) * 100;
  
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

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      broadcast: "fas fa-broadcast-tower",
      automated: "fas fa-robot",
      promo: "fas fa-percentage",
      promotional: "fas fa-percentage",
    };
    return icons[type] || "fas fa-bullhorn";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      broadcast: "Broadcast Campaign",
      automated: "AI Automated",
      promo: "Promotional Code",
      promotional: "Promotional",
    };
    return labels[type] || type;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="header-top">
              <span className="campaign-badge">
                <i className={getTypeIcon(campaign.type)}></i>
                {getTypeLabel(campaign.type)}
              </span>
              <div className="header-actions">
                <button className="header-btn" title="Refresh">
                  <i className="fas fa-sync-alt"></i>
                </button>
                <button className="header-btn" title="Share">
                  <i className="fas fa-share-alt"></i>
                </button>
                <button className="header-btn" onClick={onClose} title="Close">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <h1 className="campaign-title">
              {campaign.name}
              <span style={{ fontSize: "1rem", fontWeight: 500, opacity: 0.9 }}>| Campaign #{campaign.id.slice(0, 8)}</span>
            </h1>
            <div className="campaign-meta">
              <span>
                <i className="fas fa-calendar"></i>
                Started: {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : new Date(campaign.createdAt).toLocaleDateString()}
              </span>
              <span>
                <i className="fas fa-user"></i>
                Created by: You
              </span>
              <span>
                <i className="fas fa-clock"></i>
                Duration: {Math.ceil((Date.now() - new Date(campaign.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
          </div>
        </div>

        <div className="status-bar">
          <div className={`status-indicator ${getStatusClass(campaign.status)}`}>
            <span className="status-dot"></span>
            {campaign.status === "running" && "Currently Running"}
            {campaign.status === "sending" && "Sending"}
            {campaign.status === "scheduled" && "Scheduled"}
            {campaign.status === "paused" && "Paused"}
            {campaign.status === "completed" && "Completed"}
            {campaign.status === "draft" && "Draft"}
          </div>
          <div className="progress-info">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">{currentSent.toLocaleString()} of {totalRecipients.toLocaleString()} sent ({Math.round(progress)}%)</span>
          </div>
          <div className="action-buttons">
            {campaign.status === "running" && (
              <button className="btn-sm btn-outline" onClick={onPause}>
                <i className="fas fa-pause"></i>
                Pause
              </button>
            )}
            <button className="btn-sm btn-primary-sm" onClick={() => alert("Boost feature coming soon")}>
              <i className="fas fa-rocket"></i>
              Boost
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon sent">
                  <i className="fas fa-paper-plane"></i>
                </div>
                <span className="stat-change">
                  <i className="fas fa-arrow-up"></i>
                  +12%
                </span>
              </div>
              <div className="stat-value">{currentSent.toLocaleString()}</div>
              <div className="stat-label">Messages Sent</div>
              <div className="stat-subtext">of {totalRecipients.toLocaleString()} total recipients</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon delivered">
                  <i className="fas fa-check-double"></i>
                </div>
                <span className="stat-change">
                  <i className="fas fa-arrow-up"></i>
                  +5%
                </span>
              </div>
              <div className="stat-value">{getDelivered().toLocaleString()}</div>
              <div className="stat-label">Delivered</div>
              <div className="stat-subtext">89% delivery rate</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon opened">
                  <i className="fas fa-eye"></i>
                </div>
                <span className="stat-change">
                  <i className="fas fa-arrow-up"></i>
                  +18%
                </span>
              </div>
              <div className="stat-value">{getOpened().toLocaleString()}</div>
              <div className="stat-label">Opened</div>
              <div className="stat-subtext">34% open rate</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-icon clicked">
                  <i className="fas fa-mouse-pointer"></i>
                </div>
                <span className="stat-change negative">
                  <i className="fas fa-arrow-down"></i>
                  -3%
                </span>
              </div>
              <div className="stat-value">{getClicked().toLocaleString()}</div>
              <div className="stat-label">Clicked</div>
              <div className="stat-subtext">12% click-through rate</div>
            </div>
          </div>

          <div className="content-grid">
            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-comment-dots"></i>
                  Message Preview
                </h3>
                <div className="card-actions">
                  <button className="icon-btn" title="Copy" onClick={() => { navigator.clipboard.writeText(campaign.message); alert("Message copied!"); }}>
                    <i className="fas fa-copy"></i>
                  </button>
                </div>
              </div>
              <div className="card-body">
                <div className="preview-container">
                  <div className="phone-mockup">
                    <div className="phone-header">
                      <div className="phone-avatar">C</div>
                      <div className="phone-contact">
                        <div className="phone-contact-name">ChapChap Store</div>
                        <div className="phone-contact-status">online</div>
                      </div>
                    </div>
                    <div className="phone-body">
                      <div className="message-bubble">
                        {campaign.message || "No message content"}
                        <div className="message-time">
                          10:30 AM
                          <i className="fas fa-check-double" style={{ color: "var(--info)", marginLeft: "0.25rem" }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-chart-line"></i>
                  Performance Over Time
                </h3>
              </div>
              <div className="card-body">
                <div className="chart-container">
                  <div className="chart-placeholder">
                    <i className="fas fa-chart-area"></i>
                    <p>Real-time Performance Chart</p>
                    <small>Opens, clicks, and conversions over time</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="full-width-section">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fas fa-filter"></i>
                Conversion Funnel
              </h3>
            </div>
            <div className="card-body">
              <div className="funnel-container">
                <div className="funnel-step">
                  <div className="funnel-label">Sent</div>
                  <div className="funnel-bar sent">
                    <span>{currentSent.toLocaleString()}</span>
                    <span className="funnel-conversion">100%</span>
                  </div>
                </div>
                <div className="funnel-step">
                  <div className="funnel-label">Delivered</div>
                  <div className="funnel-bar delivered">
                    <span>{getDelivered().toLocaleString()}</span>
                    <span className="funnel-conversion">89% of sent</span>
                  </div>
                </div>
                <div className="funnel-step">
                  <div className="funnel-label">Opened</div>
                  <div className="funnel-bar opened">
                    <span>{getOpened().toLocaleString()}</span>
                    <span className="funnel-conversion">34% of delivered</span>
                  </div>
                </div>
                <div className="funnel-step">
                  <div className="funnel-label">Clicked</div>
                  <div className="funnel-bar clicked">
                    <span>{getClicked().toLocaleString()}</span>
                    <span className="funnel-conversion">12% of delivered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="content-grid">
            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-calculator"></i>
                  Detailed Metrics
                </h3>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="details-table">
                  <tbody>
                    <tr>
                      <td>
                        <div className="metric-cell">
                          <div className="metric-icon revenue">
                            <i className="fas fa-dollar-sign"></i>
                          </div>
                          <div>
                            <div className="metric-value">$45,230</div>
                            <div className="metric-label">Revenue Generated</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ color: "var(--success)", fontWeight: 700 }}>
                          <i className="fas fa-arrow-up"></i> 23%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="metric-cell">
                          <div className="metric-icon roi">
                            <i className="fas fa-percentage"></i>
                          </div>
                          <div>
                            <div className="metric-value">1,845%</div>
                            <div className="metric-label">Return on Investment</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ color: "var(--success)", fontWeight: 700 }}>
                          <i className="fas fa-arrow-up"></i> 12%
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="metric-cell">
                          <div className="metric-icon cost">
                            <i className="fas fa-coins"></i>
                          </div>
                          <div>
                            <div className="metric-value">${(currentSent * 0.02).toFixed(2)}</div>
                            <div className="metric-label">Total Cost</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                          $0.02 per msg
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="metric-cell">
                          <div className="metric-icon conversion">
                            <i className="fas fa-shopping-bag"></i>
                          </div>
                          <div>
                            <div className="metric-value">487</div>
                            <div className="metric-label">Conversions</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span style={{ color: "var(--success)", fontWeight: 700 }}>
                          3.9% conv. rate
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-globe-africa"></i>
                  Geographic Distribution
                </h3>
              </div>
              <div className="card-body">
                <div className="geo-grid">
                  <div className="geo-item">
                    <div className="geo-flag">🇰🇪</div>
                    <div className="geo-info">
                      <div className="geo-name">Kenya</div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{ width: "65%" }}></div>
                      </div>
                      <div className="geo-percent">65% ({Math.floor(currentSent * 0.65).toLocaleString()})</div>
                    </div>
                  </div>
                  <div className="geo-item">
                    <div className="geo-flag">🇺🇬</div>
                    <div className="geo-info">
                      <div className="geo-name">Uganda</div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{ width: "20%" }}></div>
                      </div>
                      <div className="geo-percent">20% ({Math.floor(currentSent * 0.2).toLocaleString()})</div>
                    </div>
                  </div>
                  <div className="geo-item">
                    <div className="geo-flag">🇹🇿</div>
                    <div className="geo-info">
                      <div className="geo-name">Tanzania</div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{ width: "10%" }}></div>
                      </div>
                      <div className="geo-percent">10% ({Math.floor(currentSent * 0.1).toLocaleString()})</div>
                    </div>
                  </div>
                  <div className="geo-item">
                    <div className="geo-flag">🇷🇼</div>
                    <div className="geo-info">
                      <div className="geo-name">Rwanda</div>
                      <div className="geo-bar">
                        <div className="geo-fill" style={{ width: "5%" }}></div>
                      </div>
                      <div className="geo-percent">5% ({Math.floor(currentSent * 0.05).toLocaleString()})</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="content-grid">
            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-mobile-alt"></i>
                  Device Breakdown
                </h3>
              </div>
              <div className="card-body">
                <div className="device-list">
                  <div className="device-item">
                    <div className="device-icon">
                      <i className="fab fa-android"></i>
                    </div>
                    <div className="device-info">
                      <div className="device-name">Android</div>
                      <div className="device-bar">
                        <div className="device-fill" style={{ width: "72%" }}></div>
                      </div>
                    </div>
                    <div className="device-percent">72%</div>
                  </div>
                  <div className="device-item">
                    <div className="device-icon">
                      <i className="fab fa-apple"></i>
                    </div>
                    <div className="device-info">
                      <div className="device-name">iPhone</div>
                      <div className="device-bar">
                        <div className="device-fill" style={{ width: "25%" }}></div>
                      </div>
                    </div>
                    <div className="device-percent">25%</div>
                  </div>
                  <div className="device-item">
                    <div className="device-icon">
                      <i className="fas fa-desktop"></i>
                    </div>
                    <div className="device-info">
                      <div className="device-name">WhatsApp Web</div>
                      <div className="device-bar">
                        <div className="device-fill" style={{ width: "3%" }}></div>
                      </div>
                    </div>
                    <div className="device-percent">3%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fas fa-history"></i>
                  Activity Timeline
                </h3>
              </div>
              <div className="card-body">
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot completed"></div>
                    <div className="timeline-content">
                      <h4>Campaign Created</h4>
                      <p>By You</p>
                      <div className="timeline-time">{new Date(campaign.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-dot completed"></div>
                    <div className="timeline-content">
                      <h4>Review & Approved</h4>
                      <p>AI compliance check passed</p>
                      <div className="timeline-time">{new Date(campaign.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {campaign.sentAt && (
                    <div className="timeline-item">
                      <div className="timeline-dot completed"></div>
                      <div className="timeline-content">
                        <h4>Campaign Launched</h4>
                        <p>Started sending messages</p>
                        <div className="timeline-time">{new Date(campaign.sentAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )}
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <h4>First Conversions</h4>
                      <p>Orders starting to come in</p>
                      <div className="timeline-time">In progress</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="comparison-banner">
            <div className="comparison-title">
              <i className="fas fa-trophy" style={{ color: "var(--warning)" }}></i>
              Performing 34% better than your average campaign
            </div>
            <div className="comparison-text">
              This campaign&apos;s open rate (34%) and click-through rate (12%) are significantly higher than your 90-day averages.
            </div>
            <button className="btn-sm btn-primary-sm" onClick={() => alert("Full comparison coming soon")}>
              <i className="fas fa-chart-bar"></i>
              View Full Comparison
            </button>
          </div>

          <div className="full-width-section">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fas fa-robot" style={{ color: "var(--purple)" }}></i>
                AI-Powered Insights
              </h3>
            </div>
            <div className="card-body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                <div style={{ padding: "1rem", background: "rgba(37, 211, 102, 0.05)", borderRadius: "var(--radius-xs)", borderLeft: "4px solid var(--success)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--success)" }}>
                    <i className="fas fa-check-circle"></i> What&apos;s Working
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    The emoji-rich message and urgent discount code are driving high engagement. Fire emoji usage correlates with 23% higher open rates.
                  </p>
                </div>
                <div style={{ padding: "1rem", background: "rgba(245, 158, 11, 0.05)", borderRadius: "var(--radius-xs)", borderLeft: "4px solid var(--warning)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--warning)" }}>
                    <i className="fas fa-lightbulb"></i> Optimization Tip
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Consider A/B testing with personalized product recommendations. AI suggests this could increase click-through by an estimated 15%.
                  </p>
                </div>
                <div style={{ padding: "1rem", background: "rgba(59, 130, 246, 0.05)", borderRadius: "var(--radius-xs)", borderLeft: "4px solid var(--info)" }}>
                  <div style={{ fontWeight: 700, marginBottom: "0.5rem", color: "var(--info)" }}>
                    <i className="fas fa-clock"></i> Best Time
                  </div>
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Your send time is optimal. Historical data shows 28% better engagement for campaigns sent between 10-11 AM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button className="btn btn-secondary" onClick={() => alert("Exporting PDF report...")}>
              <i className="fas fa-download"></i>
              Export Report
            </button>
            <button className="btn btn-secondary" onClick={onDuplicate}>
              <i className="fas fa-copy"></i>
              Duplicate
            </button>
          </div>
          <div className="footer-right">
            <button className="btn btn-danger" onClick={onStop} style={{ marginRight: "0.5rem" }}>
              <i className="fas fa-stop"></i>
              Stop Campaign
            </button>
            <button className="btn btn-primary" onClick={onClose}>
              <i className="fas fa-check"></i>
              Done
            </button>
          </div>
        </div>

        <style jsx>{`
          :global(:root) {
            --primary: #25D366;
            --primary-dark: #128C7E;
            --primary-light: #DCF8C6;
            --accent: #00C853;
            --danger: #ef4444;
            --warning: #f59e0b;
            --info: #3b82f6;
            --success: #10b981;
            --purple: #8b5cf6;
            --pink: #ec4899;
            --orange: #f97316;
            --dark: #0f172a;
            --bg: #f8fafc;
            --card: #ffffff;
            --text-primary: #1e293b;
            --text-secondary: #64748b;
            --border: #e2e8f0;
            --radius: 20px;
            --radius-sm: 12px;
            --radius-xs: 8px;
          }

          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.7);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 2rem;
            animation: fadeIn 0.3s ease;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-container {
            background: var(--card);
            border-radius: var(--radius);
            width: 100%;
            max-width: 1100px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
          }

          @keyframes slideUp {
            from { transform: translateY(30px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }

          .modal-header {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            padding: 1.5rem 2rem;
            position: relative;
            overflow: hidden;
          }

          .modal-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 300px;
            height: 300px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
          }

          .modal-header-content {
            position: relative;
            z-index: 1;
          }

          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
          }

          .campaign-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.375rem 1rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 700;
            text-transform: uppercase;
            backdrop-filter: blur(10px);
          }

          .header-actions {
            display: flex;
            gap: 0.5rem;
          }

          .header-btn {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .header-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
          }

          .campaign-title {
            font-size: 1.75rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .campaign-meta {
            display: flex;
            gap: 2rem;
            font-size: 0.9rem;
            opacity: 0.9;
          }

          .campaign-meta span {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .status-bar {
            display: flex;
            padding: 1rem 2rem;
            background: var(--card);
            border-bottom: 1px solid var(--border);
            gap: 1rem;
            align-items: center;
          }

          .status-indicator {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 700;
            font-size: 0.875rem;
          }

          .status-running {
            background: rgba(37, 211, 102, 0.1);
            color: var(--success);
          }

          .status-scheduled {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info);
          }

          .status-paused {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
          }

          .status-completed {
            background: rgba(139, 92, 246, 0.1);
            color: var(--purple);
          }

          .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: var(--success);
            animation: pulse 2s infinite;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          .progress-info {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .progress-bar {
            flex: 1;
            height: 8px;
            background: var(--bg);
            border-radius: 4px;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
            border-radius: 4px;
            transition: width 0.3s;
          }

          .progress-text {
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-weight: 600;
            white-space: nowrap;
          }

          .action-buttons {
            display: flex;
            gap: 0.5rem;
          }

          .btn-sm {
            padding: 0.5rem 1rem;
            border-radius: var(--radius-xs);
            font-family: inherit;
            font-weight: 700;
            font-size: 0.875rem;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .btn-outline {
            background: transparent;
            color: var(--text-primary);
            border: 2px solid var(--border);
          }

          .btn-outline:hover {
            border-color: var(--primary);
            color: var(--primary);
          }

          .btn-primary-sm {
            background: var(--primary);
            color: white;
          }

          .btn-primary-sm:hover {
            background: var(--primary-dark);
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 2rem;
            background: var(--bg);
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          @media (max-width: 1024px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }

          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: 1fr;
            }
          }

          .stat-card {
            background: var(--card);
            border-radius: var(--radius-sm);
            padding: 1.5rem;
            border: 1px solid var(--border);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            transition: all 0.2s;
          }

          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .stat-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
          }

          .stat-icon {
            width: 48px;
            height: 48px;
            border-radius: var(--radius-xs);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
          }

          .stat-icon.sent {
            background: rgba(59, 130, 246, 0.1);
            color: var(--info);
          }

          .stat-icon.delivered {
            background: rgba(37, 211, 102, 0.1);
            color: var(--success);
          }

          .stat-icon.opened {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
          }

          .stat-icon.clicked {
            background: rgba(139, 92, 246, 0.1);
            color: var(--purple);
          }

          .stat-change {
            font-size: 0.75rem;
            font-weight: 700;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            background: rgba(37, 211, 102, 0.1);
            color: var(--success);
          }

          .stat-change.negative {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
          }

          .stat-value {
            font-size: 1.75rem;
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
          }

          .stat-label {
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-weight: 600;
          }

          .stat-subtext {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
          }

          .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
          }

          @media (max-width: 1024px) {
            .content-grid {
              grid-template-columns: 1fr;
            }
          }

          .content-card {
            background: var(--card);
            border-radius: var(--radius);
            border: 1px solid var(--border);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }

          .card-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .card-title {
            font-size: 1.1rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .card-title i {
            color: var(--primary);
          }

          .card-actions {
            display: flex;
            gap: 0.5rem;
          }

          .icon-btn {
            width: 32px;
            height: 32px;
            border-radius: 6px;
            border: none;
            background: var(--bg);
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
          }

          .icon-btn:hover {
            background: var(--primary);
            color: white;
          }

          .card-body {
            padding: 1.5rem;
          }

          .preview-container {
            background: #e5ddd5;
            border-radius: var(--radius-xs);
            padding: 1.5rem;
          }

          .phone-mockup {
            max-width: 280px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }

          .phone-header {
            background: #075e54;
            color: white;
            padding: 0.75rem 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .phone-avatar {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.875rem;
          }

          .phone-contact {
            flex: 1;
          }

          .phone-contact-name {
            font-weight: 700;
            font-size: 0.875rem;
          }

          .phone-contact-status {
            font-size: 0.7rem;
            opacity: 0.8;
          }

          .phone-body {
            background: #e5ddd5;
            padding: 1rem;
            min-height: 180px;
          }

          .message-bubble {
            background: var(--primary-light);
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border-top-left-radius: 0;
            max-width: 90%;
            font-size: 0.875rem;
            line-height: 1.5;
            position: relative;
          }

          .message-time {
            font-size: 0.65rem;
            color: var(--text-secondary);
            text-align: right;
            margin-top: 0.25rem;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.25rem;
          }

          .chart-container {
            height: 250px;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: var(--radius-xs);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
          }

          .chart-placeholder {
            text-align: center;
            color: var(--text-secondary);
          }

          .chart-placeholder i {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
            opacity: 0.5;
            color: var(--primary);
          }

          .full-width-section {
            background: var(--card);
            border-radius: var(--radius);
            border: 1px solid var(--border);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin-bottom: 1.5rem;
          }

          .funnel-container {
            padding: 1rem 0;
          }

          .funnel-step {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
          }

          .funnel-bar {
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1rem;
            color: white;
            font-weight: 700;
            font-size: 0.9rem;
            transition: all 0.3s;
          }

          .funnel-bar.sent {
            width: 100%;
            background: linear-gradient(90deg, var(--info) 0%, #60a5fa 100%);
          }

          .funnel-bar.delivered {
            width: 89%;
            background: linear-gradient(90deg, var(--success) 0%, #34d399 100%);
          }

          .funnel-bar.opened {
            width: 34%;
            background: linear-gradient(90deg, var(--warning) 0%, #fbbf24 100%);
          }

          .funnel-bar.clicked {
            width: 12%;
            background: linear-gradient(90deg, var(--purple) 0%, #a78bfa 100%);
          }

          .funnel-conversion {
            font-size: 0.75rem;
            opacity: 0.9;
          }

          .funnel-label {
            width: 80px;
            font-size: 0.875rem;
            font-weight: 600;
            color: var(--text-secondary);
          }

          .details-table {
            width: 100%;
            border-collapse: collapse;
          }

          .details-table th {
            text-align: left;
            padding: 1rem;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            border-bottom: 2px solid var(--border);
            background: var(--bg);
          }

          .details-table td {
            padding: 1rem;
            border-bottom: 1px solid var(--border);
          }

          .details-table tr:hover td {
            background: rgba(37, 211, 102, 0.02);
          }

          .metric-cell {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }

          .metric-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
          }

          .metric-icon.revenue {
            background: rgba(37, 211, 102, 0.1);
            color: var(--success);
          }

          .metric-icon.roi {
            background: rgba(139, 92, 246, 0.1);
            color: var(--purple);
          }

          .metric-icon.cost {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger);
          }

          .metric-icon.conversion {
            background: rgba(245, 158, 11, 0.1);
            color: var(--warning);
          }

          .metric-value {
            font-weight: 800;
            font-size: 1.1rem;
            color: var(--text-primary);
          }

          .metric-label {
            font-size: 0.8rem;
            color: var(--text-secondary);
          }

          .geo-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
          }

          @media (max-width: 768px) {
            .geo-grid {
              grid-template-columns: 1fr;
            }
          }

          .geo-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            background: var(--bg);
            border-radius: var(--radius-xs);
          }

          .geo-flag {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-light) 0%, #e0e7ff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
          }

          .geo-info {
            flex: 1;
          }

          .geo-name {
            font-weight: 700;
            font-size: 0.95rem;
            margin-bottom: 0.25rem;
          }

          .geo-bar {
            height: 6px;
            background: var(--border);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 0.25rem;
          }

          .geo-fill {
            height: 100%;
            background: var(--primary);
            border-radius: 3px;
          }

          .geo-percent {
            font-size: 0.8rem;
            color: var(--text-secondary);
            font-weight: 600;
          }

          .device-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }

          .device-item {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .device-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: var(--bg);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.25rem;
            color: var(--text-secondary);
          }

          .device-info {
            flex: 1;
          }

          .device-name {
            font-weight: 700;
            font-size: 0.9rem;
            margin-bottom: 0.25rem;
          }

          .device-bar {
            height: 8px;
            background: var(--border);
            border-radius: 4px;
            overflow: hidden;
          }

          .device-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
            border-radius: 4px;
          }

          .device-percent {
            font-weight: 800;
            font-size: 1rem;
            color: var(--text-primary);
          }

          .timeline {
            position: relative;
            padding-left: 2rem;
          }

          .timeline::before {
            content: '';
            position: absolute;
            left: 0.5rem;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--border);
          }

          .timeline-item {
            position: relative;
            padding-bottom: 1.5rem;
          }

          .timeline-item:last-child {
            padding-bottom: 0;
          }

          .timeline-dot {
            position: absolute;
            left: -1.75rem;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--primary);
            border: 2px solid white;
            box-shadow: 0 0 0 2px var(--primary);
          }

          .timeline-dot.completed {
            background: var(--success);
            box-shadow: 0 0 0 2px var(--success);
          }

          .timeline-content h4 {
            font-weight: 700;
            font-size: 0.95rem;
            margin-bottom: 0.25rem;
          }

          .timeline-content p {
            font-size: 0.875rem;
            color: var(--text-secondary);
          }

          .timeline-time {
            font-size: 0.75rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
          }

          .comparison-banner {
            background: linear-gradient(135deg, rgba(37, 211, 102, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
            border: 2px dashed var(--primary);
            border-radius: var(--radius-xs);
            padding: 1.5rem;
            text-align: center;
            margin-bottom: 1.5rem;
          }

          .comparison-title {
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
          }

          .comparison-text {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }

          .modal-footer {
            padding: 1.5rem 2rem;
            background: white;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .footer-left {
            display: flex;
            gap: 1rem;
          }

          .footer-right {
            display: flex;
          }

          .btn {
            padding: 0.875rem 1.75rem;
            border-radius: var(--radius-xs);
            font-family: inherit;
            font-weight: 700;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .btn-secondary {
            background: var(--bg);
            color: var(--text-primary);
            border: 2px solid var(--border);
          }

          .btn-secondary:hover {
            border-color: var(--primary);
            color: var(--primary);
          }

          .btn-primary {
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
          }

          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
          }

          .btn-danger {
            background: var(--danger);
            color: white;
          }
        `}</style>
      </div>
    </div>
  );
}
