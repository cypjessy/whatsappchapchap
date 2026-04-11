"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { campaignService, Campaign } from "@/lib/db";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (campaign: Campaign) => void;
}

export default function CreateCampaignModal({ isOpen, onClose, onSuccess }: CreateCampaignModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "broadcast" as Campaign["type"],
    segment: "all" as Campaign["segment"],
    message: "",
    schedule: "now",
    scheduledDate: "",
    scheduledTime: "",
    confirmCompliance: false,
  });

  const totalSteps = 5;

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      return formData.name.trim().length > 0;
    }
    if (step === 3) {
      return formData.message.trim().length > 0;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const insertVariable = (variable: string) => {
    const map: Record<string, string> = {
      name: "[Name]",
      order: "[Order ID]",
      discount: "[Discount]",
    };
    const textarea = document.getElementById("messageContent") as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const newValue = formData.message.substring(0, startPos) + map[variable] + formData.message.substring(endPos);
      updateFormData("message", newValue);
    }
  };

  const insertEmoji = (emoji: string) => {
    const textarea = document.getElementById("messageContent") as HTMLTextAreaElement;
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const newValue = formData.message.substring(0, startPos) + emoji + formData.message.substring(endPos);
      updateFormData("message", newValue);
    }
  };

  const toggleEmojiPicker = () => {
    const picker = document.getElementById("emojiPicker");
    if (picker) {
      picker.style.display = picker.style.display === "none" ? "flex" : "none";
    }
  };

  const loadTemplate = () => {
    const templates = [
      "🔥 FLASH SALE! Get 50% OFF everything this weekend only! Use code: WEEKEND50. Don't miss out! 👇 [Link]",
      "🎉 Hi [Name]! We miss you! Come back and get 20% OFF your next order. Code: COMEBACK20",
      "✨ New arrivals just dropped! Be the first to shop our latest collection. Free shipping on orders over $50!",
    ];
    const random = templates[Math.floor(Math.random() * templates.length)];
    updateFormData("message", random);
  };

  const getPreviewMessage = () => {
    return formData.message
      .replace(/\[Name\]/g, "John")
      .replace(/\[Order ID\]/g, "#1234")
      .replace(/\[Discount\]/g, "50%");
  };

  const launchCampaign = async () => {
    if (!formData.confirmCompliance) {
      alert("Please confirm compliance with WhatsApp Business policies");
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      const campaignData = {
        name: formData.name,
        type: formData.type as Campaign["type"],
        segment: formData.segment as Campaign["segment"],
        message: formData.message,
        status: (formData.schedule === "now" ? "running" : "scheduled") as Campaign["status"],
        scheduledAt: formData.schedule === "later" && formData.scheduledDate && formData.scheduledTime
          ? new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toISOString()
          : undefined,
        recipientCount: formData.segment === "all" ? 12456 : formData.segment === "vip" ? 2340 : formData.segment === "new" ? 1890 : formData.segment === "inactive" ? 3240 : 0,
        deliveredCount: 0,
        responseCount: 0,
      };

      const newCampaign = await campaignService.createCampaign(user, campaignData);
      setShowSuccess(true);
      onSuccess?.(newCampaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStepClass = (stepNum: number) => {
    if (stepNum === currentStep) return "step active";
    if (stepNum < currentStep) return "step completed";
    return "step";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      broadcast: "Broadcast Message",
      automated: "AI Automated",
      promo: "Promotional Code",
    };
    return labels[type] || type;
  };

  const getSegmentLabel = (segment: string) => {
    const labels: Record<string, string> = {
      all: "All Customers (12,456)",
      vip: "VIP Customers (2,340)",
      new: "New Customers (1,890)",
      inactive: "Inactive Customers (3,240)",
      custom: "Custom Segment",
    };
    return labels[segment] || segment;
  };

  const getScheduleLabel = (schedule: string) => {
    const labels: Record<string, string> = {
      now: "Immediately",
      later: "Scheduled",
      recurring: "Recurring",
    };
    return labels[schedule] || schedule;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container">
        {!showSuccess ? (
          <>
            <div className="modal-header">
              <div className="modal-header-content">
                <div className="modal-title-section">
                  <h2>
                    <i className="fas fa-rocket"></i>
                    Create New Campaign
                  </h2>
                  <p>Launch your WhatsApp marketing campaign in 5 simple steps</p>
                </div>
                <button className="modal-close" onClick={onClose}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div className="progress-steps">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className={getStepClass(step)} onClick={() => step < currentStep && goToStep(step)}>
                  <div className="step-number">
                    {step < currentStep ? <i className="fas fa-check"></i> : step}
                  </div>
                  <div className="step-label">
                    {step === 1 && "Type"}
                    {step === 2 && "Audience"}
                    {step === 3 && "Message"}
                    {step === 4 && "Schedule"}
                    {step === 5 && "Review"}
                  </div>
                </div>
              ))}
            </div>

            <div className="modal-body">
              {currentStep === 1 && (
                <div className="form-section active" data-section="1">
                  <h3 className="section-title">
                    <i className="fas fa-bullseye"></i>
                    Select Campaign Type
                  </h3>
                  
                  <div className="type-grid">
                    <label className="type-option">
                      <input
                        type="radio"
                        name="campaignType"
                        value="broadcast"
                        checked={formData.type === "broadcast"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                      />
                      <div className="type-card">
                        <div className="type-icon broadcast">
                          <i className="fas fa-broadcast-tower"></i>
                        </div>
                        <div className="type-content">
                          <h4>Broadcast Message</h4>
                          <p>Send a one-time message to your entire customer base or specific segments. Perfect for announcements and promotions.</p>
                          <span className="type-badge">
                            <i className="fas fa-bolt"></i>
                            Instant Delivery
                          </span>
                        </div>
                      </div>
                    </label>

                    <label className="type-option">
                      <input
                        type="radio"
                        name="campaignType"
                        value="automated"
                        checked={formData.type === "automated"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                      />
                      <div className="type-card">
                        <div className="type-icon automated">
                          <i className="fas fa-robot"></i>
                        </div>
                        <div className="type-content">
                          <h4>AI Automated</h4>
                          <p>Set up smart triggers based on customer behavior. Abandoned cart, welcome series, birthday wishes, and more.</p>
                          <span className="type-badge purple">
                            <i className="fas fa-magic"></i>
                            AI-Powered
                          </span>
                        </div>
                      </div>
                    </label>

                    <label className="type-option">
                      <input
                        type="radio"
                        name="campaignType"
                        value="promo"
                        checked={formData.type === "promo"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                      />
                      <div className="type-card">
                        <div className="type-icon promo">
                          <i className="fas fa-percentage"></i>
                        </div>
                        <div className="type-content">
                          <h4>Promotional Code</h4>
                          <p>Distribute unique discount codes to customers. Track redemption rates and measure campaign ROI.</p>
                          <span className="type-badge pink">
                            <i className="fas fa-tag"></i>
                            Trackable Codes
                          </span>
                        </div>
                      </div>
                    </label>

                    <label className="type-option">
                      <input
                        type="radio"
                        name="campaignType"
                        value="sequence"
                        checked={formData.type === "sequence"}
                        onChange={(e) => updateFormData("type", e.target.value)}
                      />
                      <div className="type-card">
                        <div className="type-icon sequence">
                          <i className="fas fa-layer-group"></i>
                        </div>
                        <div className="type-content">
                          <h4>Message Sequence</h4>
                          <p>Create a series of timed messages. Nurture leads with drip campaigns and onboarding flows.</p>
                          <span className="type-badge blue">
                            <i className="fas fa-clock"></i>
                            Multi-Step
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="form-group full-width" style={{ marginTop: "1.5rem" }}>
                    <label className="form-label">Campaign Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className={`form-input ${currentStep === 1 && !formData.name.trim() ? "error" : ""}`}
                      placeholder="e.g., Summer Flash Sale 2026"
                      value={formData.name}
                      onChange={(e) => updateFormData("name", e.target.value)}
                    />
                    {currentStep === 1 && !formData.name.trim() && (
                      <span className="error-message">Please enter a campaign name</span>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="form-section active">
                  <h3 className="section-title">
                    <i className="fas fa-users"></i>
                    Select Your Audience
                  </h3>

                  <div className="audience-options">
                    {["all", "vip", "new", "inactive", "custom"].map((audience) => (
                      <label key={audience} className="audience-option">
                        <input
                          type="radio"
                          name="audience"
                          value={audience}
                          checked={formData.segment === audience}
                          onChange={(e) => updateFormData("segment", e.target.value)}
                        />
                        <div className="audience-card">
                          <div className="audience-check">
                            <i className="fas fa-check"></i>
                          </div>
                          <div className={`audience-icon ${audience === "all" ? "green" : audience === "vip" ? "yellow" : audience === "new" ? "blue" : audience === "inactive" ? "red" : "purple"}`}>
                            <i className={audience === "all" ? "fas fa-users" : audience === "vip" ? "fas fa-crown" : audience === "new" ? "fas fa-user-plus" : audience === "inactive" ? "fas fa-user-clock" : "fas fa-sliders-h"}></i>
                          </div>
                          <div className="audience-info">
                            <div className="audience-name">
                              {audience === "all" && "All Customers"}
                              {audience === "vip" && "VIP Customers"}
                              {audience === "new" && "New Customers"}
                              {audience === "inactive" && "Inactive Customers"}
                              {audience === "custom" && "Custom Segment"}
                            </div>
                            <div className="audience-count">
                              {audience === "all" && "12,456 subscribers"}
                              {audience === "vip" && "2,340 subscribers • High spenders"}
                              {audience === "new" && "1,890 subscribers • Joined in last 30 days"}
                              {audience === "inactive" && "3,240 subscribers • No purchase in 60+ days"}
                              {audience === "custom" && "Create advanced filters"}
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="form-section active">
                  <h3 className="section-title">
                    <i className="fas fa-comment-dots"></i>
                    Compose Your Message
                  </h3>

                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="form-label">Message Content <span className="required">*</span></label>
                      <div className="composer-container">
                        <div className="composer-toolbar">
                          <button type="button" className="toolbar-btn" onClick={() => insertVariable("name")} title="Insert Name">
                            <i className="fas fa-user"></i>
                            Name
                          </button>
                          <button type="button" className="toolbar-btn" onClick={() => insertVariable("order")} title="Insert Order ID">
                            <i className="fas fa-shopping-bag"></i>
                            Order
                          </button>
                          <button type="button" className="toolbar-btn" onClick={() => insertVariable("discount")} title="Insert Discount">
                            <i className="fas fa-tag"></i>
                            Discount
                          </button>
                          <button type="button" className="toolbar-btn" onClick={toggleEmojiPicker} title="Add Emoji">
                            <i className="fas fa-smile"></i>
                            Emoji
                          </button>
                        </div>
                        <textarea
                          id="messageContent"
                          className="composer-textarea"
                          placeholder="Type your message here... Use personalization variables like [Name] to make it unique for each customer."
                          value={formData.message}
                          onChange={(e) => updateFormData("message", e.target.value)}
                        />
                        <div className="composer-footer">
                          <div className="composer-actions">
                            <button type="button" className="toolbar-btn" onClick={loadTemplate}>
                              <i className="fas fa-magic"></i>
                              AI Suggest
                            </button>
                          </div>
                          <div className="character-count">{formData.message.length} / 1000</div>
                        </div>
                      </div>
                      <div className="emoji-picker" id="emojiPicker" style={{ display: "none" }}>
                        {["🔥", "⚡", "💰", "🎁", "🏷️", "⏰", "👇", "✨", "🚀", "💎"].map((emoji) => (
                          <button key={emoji} type="button" className="emoji-btn" onClick={() => insertEmoji(emoji)}>{emoji}</button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="preview-panel">
                    <div className="preview-label">
                      <i className="fas fa-mobile-alt"></i>
                      Live Preview
                    </div>
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
                          {getPreviewMessage() || "Your message preview will appear here..."}
                          <div className="message-time">10:30 AM <i className="fas fa-check-double" style={{ color: "var(--info)" }}></i></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="form-section active">
                  <h3 className="section-title">
                    <i className="fas fa-calendar-alt"></i>
                    When to Send?
                  </h3>

                  <div className="schedule-options">
                    {["now", "later", "recurring"].map((schedule) => (
                      <label key={schedule} className="schedule-option">
                        <input
                          type="radio"
                          name="schedule"
                          value={schedule}
                          checked={formData.schedule === schedule}
                          onChange={(e) => updateFormData("schedule", e.target.value)}
                        />
                        <div className="schedule-card">
                          <div className={`schedule-icon ${schedule === "now" ? "green" : schedule === "later" ? "blue" : "purple"}`}>
                            <i className={schedule === "now" ? "fas fa-paper-plane" : schedule === "later" ? "fas fa-clock" : "fas fa-sync-alt"}></i>
                          </div>
                          <div className="schedule-content">
                            <h4>
                              {schedule === "now" && "Send Immediately"}
                              {schedule === "later" && "Schedule for Later"}
                              {schedule === "recurring" && "Recurring Campaign"}
                            </h4>
                            <p>
                              {schedule === "now" && "Launch your campaign right now. Messages will start delivering within minutes."}
                              {schedule === "later" && "Choose the perfect date and time for maximum engagement."}
                              {schedule === "recurring" && "Set up automated recurring messages. Weekly deals, monthly newsletters, etc."}
                            </p>
                          </div>
                        </div>
                        {schedule === "later" && formData.schedule === "later" && (
                          <div className="datetime-picker">
                            <div className="form-group">
                              <label className="form-label">Date</label>
                              <input
                                type="date"
                                className="form-input"
                                value={formData.scheduledDate}
                                onChange={(e) => updateFormData("scheduledDate", e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Time</label>
                              <input
                                type="time"
                                className="form-input"
                                value={formData.scheduledTime}
                                onChange={(e) => updateFormData("scheduledTime", e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="form-group full-width" style={{ marginTop: "1.5rem" }}>
                    <label className="form-label">
                      <i className="fas fa-lightbulb" style={{ color: "var(--warning)" }}></i>
                      Best Time Recommendation
                    </label>
                    <div className="recommendation-box">
                      <strong>Optimal sending time for your audience: Tuesday - Thursday, 10:00 AM - 2:00 PM</strong>
                      <p>Based on your historical campaign data, messages sent during these times have 34% higher open rates.</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="form-section active">
                  <h3 className="section-title">
                    <i className="fas fa-clipboard-check"></i>
                    Review & Launch
                  </h3>

                  <div className="review-card">
                    <div className="review-header">
                      <div className="review-title">
                        <i className="fas fa-bullseye" style={{ color: "var(--primary)" }}></i>
                        Campaign Details
                      </div>
                      <span className="review-edit" onClick={() => goToStep(1)}>Edit</span>
                    </div>
                    <div className="review-body">
                      <div className="review-row">
                        <div className="review-label">Campaign Name</div>
                        <div className="review-value">{formData.name || "Untitled Campaign"}</div>
                      </div>
                      <div className="review-row">
                        <div className="review-label">Type</div>
                        <div className="review-value">{getTypeLabel(formData.type)}</div>
                      </div>
                      <div className="review-row">
                        <div className="review-label">Audience</div>
                        <div className="review-value">{getSegmentLabel(formData.segment)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="review-card">
                    <div className="review-header">
                      <div className="review-title">
                        <i className="fas fa-comment" style={{ color: "var(--info)" }}></i>
                        Message Preview
                      </div>
                      <span className="review-edit" onClick={() => goToStep(3)}>Edit</span>
                    </div>
                    <div className="review-body">
                      <div className="review-message">
                        {formData.message.length > 100 ? formData.message.substring(0, 100) + "..." : formData.message || "No message"}
                      </div>
                    </div>
                  </div>

                  <div className="review-card">
                    <div className="review-header">
                      <div className="review-title">
                        <i className="fas fa-calendar" style={{ color: "var(--purple)" }}></i>
                        Schedule
                      </div>
                      <span className="review-edit" onClick={() => goToStep(4)}>Edit</span>
                    </div>
                    <div className="review-body">
                      <div className="review-row">
                        <div className="review-label">Sending</div>
                        <div className="review-value">
                          {formData.schedule === "now" ? "Immediately" : formData.schedule === "later" ? `${formData.scheduledDate} at ${formData.scheduledTime}` : "Recurring"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cost-summary">
                    <div className="cost-row">
                      <span>Target Audience</span>
                      <span>
                        {formData.segment === "all" && "12,456 contacts"}
                        {formData.segment === "vip" && "2,340 contacts"}
                        {formData.segment === "new" && "1,890 contacts"}
                        {formData.segment === "inactive" && "3,240 contacts"}
                        {formData.segment === "custom" && "Custom"}
                      </span>
                    </div>
                    <div className="cost-row">
                      <span>Cost per Message</span>
                      <span>$0.02</span>
                    </div>
                    <div className="cost-row">
                      <span>Estimated Total</span>
                      <span>
                        {formData.segment === "all" && "$249.12"}
                        {formData.segment === "vip" && "$46.80"}
                        {formData.segment === "new" && "$37.80"}
                        {formData.segment === "inactive" && "$64.80"}
                        {formData.segment === "custom" && "$0.00"}
                      </span>
                    </div>
                  </div>

                  <div className="form-group full-width" style={{ marginTop: "1.5rem" }}>
                    <label className="form-label" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={formData.confirmCompliance}
                        onChange={(e) => updateFormData("confirmCompliance", e.target.checked)}
                        style={{ marginTop: "0.25rem" }}
                      />
                      <span style={{ fontWeight: 500, lineHeight: 1.5 }}>
                        I confirm that this campaign complies with WhatsApp Business policies and my recipients have opted in to receive marketing messages. I understand that abusive or spam content may result in account suspension.
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <div className="footer-info">
                <i className="fas fa-shield-alt" style={{ color: "var(--success)" }}></i>
                <span>All data is encrypted and secure</span>
              </div>
              <div className="footer-actions">
                <button
                  className="btn btn-secondary"
                  id="prevBtn"
                  onClick={prevStep}
                  style={{ display: currentStep === 1 ? "none" : "inline-flex" }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back
                </button>
                <button
                  className="btn btn-primary"
                  id="nextBtn"
                  onClick={nextStep}
                  style={{ display: currentStep === totalSteps ? "none" : "inline-flex" }}
                >
                  Continue
                  <i className="fas fa-arrow-right"></i>
                </button>
                <button
                  className="btn btn-success"
                  id="launchBtn"
                  onClick={launchCampaign}
                  disabled={loading}
                  style={{ display: currentStep === totalSteps ? "inline-flex" : "none" }}
                >
                  {loading ? (
                    <span className="btn-loading-text">Launching...</span>
                  ) : (
                    <>
                      <i className="fas fa-rocket"></i>
                      Launch Campaign
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="success-animation">
            <div className="success-icon">
              <i className="fas fa-check"></i>
            </div>
            <div className="success-title">Campaign Launched!</div>
            <div className="success-message">
              Your "{formData.name}" campaign is now live.
              <br />
              Messages are being delivered to your customers.
            </div>
            <div className="success-stats">
              <div className="success-stat">
                <div className="success-stat-value">
                  {formData.segment === "all" && "12,456"}
                  {formData.segment === "vip" && "2,340"}
                  {formData.segment === "new" && "1,890"}
                  {formData.segment === "inactive" && "3,240"}
                  {formData.segment === "custom" && "0"}
                </div>
                <div className="success-stat-label">Recipients</div>
              </div>
              <div className="success-stat">
                <div className="success-stat-value">~5 min</div>
                <div className="success-stat-label">Delivery Time</div>
              </div>
              <div className="success-stat">
                <div className="success-stat-value">
                  {formData.segment === "all" && "$249"}
                  {formData.segment === "vip" && "$47"}
                  {formData.segment === "new" && "$38"}
                  {formData.segment === "inactive" && "$65"}
                  {formData.segment === "custom" && "$0"}
                </div>
                <div className="success-stat-label">Total Cost</div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={onClose}>
              <i className="fas fa-chart-line"></i>
              View Campaign Dashboard
            </button>
          </div>
        )}
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
          max-width: 1000px;
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
          padding: 1.75rem 2rem;
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
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .modal-title-section h2 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .modal-title-section p {
          opacity: 0.9;
          font-size: 0.95rem;
        }

        .modal-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          font-size: 1.25rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }

        .progress-steps {
          display: flex;
          padding: 1.5rem 2rem 0;
          background: var(--card);
          border-bottom: 1px solid var(--border);
          gap: 0;
        }

        .step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding-bottom: 1.5rem;
          cursor: pointer;
        }

        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 20px;
          right: -50%;
          width: 100%;
          height: 3px;
          background: var(--border);
          z-index: 0;
        }

        .step.completed:not(:last-child)::after {
          background: var(--primary);
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--bg);
          border: 3px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--text-secondary);
          position: relative;
          z-index: 1;
          transition: all 0.3s;
        }

        .step.active .step-number {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.2);
        }

        .step.completed .step-number {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .step-label {
          margin-top: 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .step.active .step-label {
          color: var(--primary);
        }

        .step.completed .step-label {
          color: var(--success);
        }

        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          background: var(--bg);
        }

        .form-section {
          display: none;
          animation: fadeInSection 0.4s ease;
        }

        .form-section.active {
          display: block;
        }

        @keyframes fadeInSection {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .section-title {
          font-size: 1.125rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-primary);
        }

        .section-title i {
          color: var(--primary);
        }

        .type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 768px) {
          .type-grid {
            grid-template-columns: 1fr;
          }
        }

        .type-option {
          position: relative;
          cursor: pointer;
        }

        .type-option input {
          position: absolute;
          opacity: 0;
        }

        .type-card {
          padding: 1.5rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-xs);
          background: white;
          transition: all 0.2s;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .type-option:hover .type-card {
          border-color: var(--primary);
          transform: translateY(-2px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .type-option input:checked + .type-card {
          border-color: var(--primary);
          background: rgba(37, 211, 102, 0.05);
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
        }

        .type-icon {
          width: 60px;
          height: 60px;
          border-radius: var(--radius-xs);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          flex-shrink: 0;
          background: var(--bg);
        }

        .type-option input:checked + .type-card .type-icon {
          background: var(--primary);
          color: white;
        }

        .type-icon.broadcast { color: var(--primary); }
        .type-icon.automated { color: var(--purple); }
        .type-icon.promo { color: var(--pink); }
        .type-icon.sequence { color: var(--info); }

        .type-content h4 {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }

        .type-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .type-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.75rem;
          background: var(--primary-light);
          color: var(--primary-dark);
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-top: 0.75rem;
        }

        .type-badge.purple {
          background: rgba(139, 92, 246, 0.1);
          color: var(--purple);
        }

        .type-badge.pink {
          background: rgba(236, 72, 153, 0.1);
          color: var(--pink);
        }

        .type-badge.blue {
          background: rgba(59, 130, 246, 0.1);
          color: var(--info);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-weight: 700;
          font-size: 0.875rem;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .required {
          color: var(--danger);
        }

        .form-input,
        .form-select,
        .form-textarea {
          padding: 0.875rem 1rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-xs);
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: white;
        }

        .form-input:focus,
        .form-select:focus,
        .form-textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
        }

        .form-input.error {
          border-color: var(--danger);
          background: #fef2f2;
        }

        .error-message {
          color: var(--danger);
          font-size: 0.8rem;
          display: none;
        }

        .form-input.error + .error-message {
          display: block;
        }

        .audience-options {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .audience-option {
          position: relative;
          cursor: pointer;
        }

        .audience-option input {
          position: absolute;
          opacity: 0;
        }

        .audience-card {
          padding: 1rem 1.25rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-xs);
          background: white;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s;
        }

        .audience-option:hover .audience-card {
          border-color: var(--primary);
        }

        .audience-option input:checked + .audience-card {
          border-color: var(--primary);
          background: rgba(37, 211, 102, 0.05);
        }

        .audience-check {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 2px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.75rem;
          transition: all 0.2s;
        }

        .audience-option input:checked + .audience-card .audience-check {
          background: var(--primary);
          border-color: var(--primary);
        }

        .audience-info {
          flex: 1;
        }

        .audience-name {
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .audience-count {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .audience-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          background: var(--bg);
        }

        .audience-icon.green { background: rgba(37, 211, 102, 0.1); color: var(--primary); }
        .audience-icon.yellow { background: rgba(245, 158, 11, 0.1); color: var(--warning); }
        .audience-icon.blue { background: rgba(59, 130, 246, 0.1); color: var(--info); }
        .audience-icon.red { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
        .audience-icon.purple { background: rgba(139, 92, 246, 0.1); color: var(--purple); }

        .composer-container {
          background: white;
          border-radius: var(--radius-xs);
          border: 2px solid var(--border);
          overflow: hidden;
        }

        .composer-toolbar {
          padding: 0.75rem 1rem;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .toolbar-btn {
          padding: 0.5rem 0.75rem;
          border: none;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .toolbar-btn:hover {
          background: var(--primary);
          color: white;
        }

        .composer-textarea {
          width: 100%;
          padding: 1rem;
          border: none;
          font-family: inherit;
          font-size: 0.95rem;
          resize: vertical;
          min-height: 150px;
        }

        .composer-textarea:focus {
          outline: none;
        }

        .composer-footer {
          padding: 0.75rem 1rem;
          background: var(--bg);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .composer-actions {
          display: flex;
          gap: 0.5rem;
        }

        .character-count {
          text-align: right;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-top: 0.25rem;
        }

        .emoji-picker {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          padding: 0.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-top: 0.5rem;
        }

        .emoji-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: none;
          font-size: 1.25rem;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .emoji-btn:hover {
          background: var(--bg);
          transform: scale(1.2);
        }

        .preview-panel {
          background: #e5ddd5;
          border-radius: var(--radius-xs);
          padding: 1.5rem;
          margin-top: 1.5rem;
        }

        .preview-label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .phone-mockup {
          max-width: 320px;
          margin: 0 auto;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        }

        .phone-header {
          background: #075e54;
          color: white;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .phone-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .phone-contact {
          flex: 1;
        }

        .phone-contact-name {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .phone-contact-status {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .phone-body {
          background: #e5ddd5;
          padding: 1rem;
          min-height: 200px;
        }

        .message-bubble {
          background: var(--primary-light);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border-top-left-radius: 0;
          max-width: 85%;
          font-size: 0.9rem;
          line-height: 1.5;
          position: relative;
          margin-bottom: 0.5rem;
        }

        .message-time {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-align: right;
          margin-top: 0.25rem;
        }

        .schedule-options {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .schedule-option {
          position: relative;
          cursor: pointer;
        }

        .schedule-option input {
          position: absolute;
          opacity: 0;
        }

        .schedule-card {
          padding: 1.25rem;
          border: 2px solid var(--border);
          border-radius: var(--radius-xs);
          background: white;
          display: flex;
          align-items: center;
          gap: 1rem;
          transition: all 0.2s;
        }

        .schedule-option:hover .schedule-card {
          border-color: var(--primary);
        }

        .schedule-option input:checked + .schedule-card {
          border-color: var(--primary);
          background: rgba(37, 211, 102, 0.05);
        }

        .schedule-icon {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          background: var(--bg);
        }

        .schedule-icon.green { background: rgba(37, 211, 102, 0.1); color: var(--primary); }
        .schedule-icon.blue { background: rgba(59, 130, 246, 0.1); color: var(--info); }
        .schedule-icon.purple { background: rgba(139, 92, 246, 0.1); color: var(--purple); }

        .schedule-option input:checked + .schedule-card .schedule-icon {
          background: var(--primary);
          color: white;
        }

        .schedule-content h4 {
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .schedule-content p {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .datetime-picker {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-top: 1rem;
          padding: 1rem;
          background: var(--bg);
          border-radius: var(--radius-xs);
        }

        .recommendation-box {
          background: rgba(245, 158, 11, 0.1);
          border-left: 4px solid var(--warning);
          padding: 1rem;
          border-radius: 0 var(--radius-xs) var(--radius-xs) 0;
        }

        .recommendation-box strong {
          display: block;
        }

        .recommendation-box p {
          font-size: 0.875rem;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }

        .review-card {
          background: white;
          border-radius: var(--radius-xs);
          border: 1px solid var(--border);
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .review-header {
          padding: 1rem 1.25rem;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .review-title {
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .review-edit {
          color: var(--primary);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
        }

        .review-body {
          padding: 1.25rem;
        }

        .review-row {
          display: flex;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
        }

        .review-row:last-child {
          border-bottom: none;
        }

        .review-label {
          width: 150px;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .review-value {
          flex: 1;
          font-weight: 600;
          color: var(--text-primary);
        }

        .review-message {
          background: var(--bg);
          padding: 1rem;
          border-radius: var(--radius-xs);
          font-size: 0.9rem;
          line-height: 1.6;
        }

        .cost-summary {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          color: white;
          padding: 1.5rem;
          border-radius: var(--radius-xs);
          margin-top: 1.5rem;
        }

        .cost-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }

        .cost-row:last-child {
          border-bottom: none;
          font-size: 1.25rem;
          font-weight: 800;
          padding-top: 1rem;
          margin-top: 0.5rem;
        }

        .modal-footer {
          padding: 1.5rem 2rem;
          background: white;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .footer-actions {
          display: flex;
          gap: 0.75rem;
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

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-success {
          background: var(--success);
          color: white;
        }

        .success-animation {
          text-align: center;
          padding: 3rem;
          animation: scaleIn 0.5s ease;
        }

        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .success-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--success) 0%, var(--accent) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          color: white;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .success-message {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .success-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .success-stat {
          text-align: center;
        }

        .success-stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary);
        }

        .success-stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .btn-loading-text {
          color: transparent;
        }

        @media (max-width: 768px) {
          .modal-container {
            max-height: 95vh;
            border-radius: var(--radius-sm);
          }

          .type-grid,
          .form-grid {
            grid-template-columns: 1fr;
          }

          .datetime-picker {
            grid-template-columns: 1fr;
          }

          .modal-footer {
            flex-direction: column;
            gap: 1rem;
          }

          .footer-actions {
            width: 100%;
            justify-content: stretch;
          }

          .footer-actions .btn {
            flex: 1;
            justify-content: center;
          }

          .progress-steps {
            padding: 1rem;
          }

          .step-label {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
