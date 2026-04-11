"use client";

import { useState, useEffect } from "react";

interface RequestReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestReviewsModal({ isOpen, onClose }: RequestReviewsModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("recent");
  const [selectedTemplate, setSelectedTemplate] = useState("friendly");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([
    "Alice Johnson", "Bob Smith", "Carol White", "Emma Brown"
  ]);
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sentCount, setSentCount] = useState(0);

  const totalSteps = 4;
  const totalCustomers = selectedCustomers.length;

  const templates = {
    friendly: `Hi {customer_name}! 👋\n\nThank you for your recent purchase of {product_name}! We hope you're loving it. 🎉\n\nWould you mind taking a moment to share your experience? Your feedback helps us improve and helps other shoppers make better decisions.`,
    professional: `Dear {customer_name},\n\nThank you for purchasing {product_name} (Order #{order_id}). We value your business and would appreciate your feedback.\n\nPlease click the link below to leave a review.\n\nBest regards,\n{store_name}`,
    short: `Hi {customer_name}! 🌟\n\nQuick question: How do you like your {product_name}?\n\nTap here to share your thoughts: {review_link}`,
    incentive: `Hi {customer_name}! 🎁\n\nLove your new {product_name}? Leave a review and get 10% off your next order!\n\nYour feedback means the world to us. Click below to get started:\n\n{review_link}\n\nThank you! ❤️`
  };

  const customerData = [
    { id: "1", name: "Alice Johnson", order: "#1234", amount: "$567.00", product: "Nike Air Max 2024", productEmoji: "👟", date: "Apr 5, 2026", status: "eligible", verified: true },
    { id: "2", name: "Bob Smith", order: "#1233", amount: "$340.00", product: "Premium Leather Handbag", productEmoji: "👜", date: "Apr 5, 2026", status: "eligible", verified: false },
    { id: "3", name: "Carol White", order: "#1232", amount: "$299.00", product: "Smart Watch Pro", productEmoji: "⌚", date: "Apr 4, 2026", status: "eligible", verified: true },
    { id: "4", name: "David Miller", order: "#1231", amount: "$448.00", product: "Wireless Headphones", productEmoji: "🎧", date: "Apr 4, 2026", status: "requested", verified: false },
    { id: "5", name: "Emma Brown", order: "#1230", amount: "$890.00", product: "Summer Dress Collection", productEmoji: "👗", date: "Apr 3, 2026", status: "eligible", verified: true },
  ];

  const updateProgress = () => {
    return ((currentStep - 1) / (totalSteps - 1)) * 100;
  };

  const toggleCustomer = (name: string) => {
    setSelectedCustomers(prev => {
      if (prev.includes(name)) {
        return prev.filter(c => c !== name);
      } else {
        return [...prev, name];
      }
    });
  };

  const removeCustomer = (name: string) => {
    setSelectedCustomers(prev => prev.filter(c => c !== name));
  };

  const selectTemplate = (template: string) => {
    setSelectedTemplate(template);
  };

  const insertVariable = (variable: string) => {
    setCustomMessage(prev => prev + variable);
  };

  const handleSend = () => {
    setIsSending(true);
    setSendProgress(0);
    setSentCount(0);

    const interval = setInterval(() => {
      setSendProgress(prev => {
        const newProgress = prev + (100 / (totalCustomers * 2));
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsSending(false);
            setIsSuccess(true);
          }, 500);
          return 100;
        }
        setSentCount(Math.floor((newProgress / 100) * totalCustomers));
        return newProgress;
      });
    }, 600);
  };

  const resetAndClose = () => {
    setCurrentStep(1);
    setSelectedCustomers(["Alice Johnson", "Bob Smith", "Carol White", "Emma Brown"]);
    setCustomMessage("");
    setIsSending(false);
    setIsSuccess(false);
    setSendProgress(0);
    setSentCount(0);
  };

  const getStepClass = (stepNum: number) => {
    if (stepNum === currentStep) return "step active";
    if (stepNum < currentStep) return "step completed";
    return "step";
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      recent: "fas fa-shopping-bag",
      specific: "fas fa-mouse-pointer",
      automated: "fas fa-robot",
      campaign: "fas fa-bullhorn"
    };
    return icons[method] || "fas fa-question";
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon">
              <i className="fas fa-paper-plane"></i>
            </div>
            <div className="header-text">
              <h2>Request Reviews</h2>
              <p>Send WhatsApp messages to collect customer feedback</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="progress-steps">
          <div className="progress-line" style={{ width: `${updateProgress()}%` }}></div>
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={getStepClass(step)} onClick={() => step < currentStep && setCurrentStep(step)}>
              <div className="step-number">
                {step < currentStep ? <i className="fas fa-check"></i> : step}
              </div>
              <span className="step-label">
                {step === 1 && "Method"}
                {step === 2 && "Customers"}
                {step === 3 && "Message"}
                {step === 4 && "Send"}
              </span>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {currentStep === 1 && (
            <div className="step-content active">
              <h3 className="step-heading">Choose Request Method</h3>
              <p className="step-subheading">How would you like to request reviews from your customers?</p>
              
              <div className="selection-grid">
                {[
                  { id: "recent", icon: "fas fa-shopping-bag", title: "Recent Orders", desc: "Request reviews from customers who purchased in the last 30 days" },
                  { id: "specific", icon: "fas fa-mouse-pointer", title: "Select Customers", desc: "Manually choose specific customers from your order history" },
                  { id: "automated", icon: "fas fa-robot", title: "AI Automated", desc: "Set up automatic review requests after delivery confirmation" },
                  { id: "campaign", icon: "fas fa-bullhorn", title: "Bulk Campaign", desc: "Send to all eligible customers with personalized messages" },
                ].map(method => (
                  <div 
                    key={method.id} 
                    className={`selection-card ${selectedMethod === method.id ? 'selected' : ''}`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="selection-icon">
                      <i className={method.icon}></i>
                    </div>
                    <div className="selection-title">{method.title}</div>
                    <div className="selection-desc">{method.desc}</div>
                  </div>
                ))}
              </div>

              <div className="helper-text">
                <i className="fas fa-lightbulb"></i>
                <span>Tip: Recent orders have a 45% higher response rate for reviews</span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="step-content active">
              <h3 className="step-heading">Select Customers</h3>
              <p className="step-subheading">Choose which customers to send review requests to</p>
              
              <div className="customer-list-header">
                <span className="list-stats">
                  <strong>{selectedCustomers.length}</strong> of <strong>{customerData.filter(c => c.status === "eligible").length}</strong> selected
                </span>
                <button className="select-all-btn" onClick={() => {
                  const eligible = customerData.filter(c => c.status === "eligible").map(c => c.name);
                  setSelectedCustomers(eligible);
                }}>
                  <i className="fas fa-check-square"></i>
                  Select All Eligible
                </button>
              </div>

              <div className="customer-list">
                {customerData.map(customer => (
                  <div 
                    key={customer.id} 
                    className={`customer-item ${selectedCustomers.includes(customer.name) ? 'selected' : ''}`}
                    onClick={() => customer.status === "eligible" && toggleCustomer(customer.name)}
                  >
                    <div className="customer-checkbox">
                      <i className="fas fa-check"></i>
                    </div>
                    <div className="customer-avatar">
                      {customer.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="customer-info">
                      <div className="customer-name">
                        {customer.name}
                        {customer.verified && <span className="verified-badge"><i className="fas fa-check"></i> Verified</span>}
                      </div>
                      <div className="customer-order">Order {customer.order} • {customer.amount}</div>
                      <div className="customer-product">
                        <div className="product-thumb">{customer.productEmoji}</div>
                        {customer.product}
                      </div>
                    </div>
                    <div>
                      <div className="customer-date">Delivered<br />{customer.date}</div>
                    </div>
                    <span className={`customer-status status-${customer.status}`}>
                      {customer.status === "eligible" ? "Eligible" : "Requested"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="helper-text">
                <i className="fas fa-info-circle"></i>
                <span>Only customers with delivered orders in the last 30 days are eligible</span>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="step-content active">
              <h3 className="step-heading">Customize Message</h3>
              <p className="step-subheading">Personalize your review request message</p>

              <div className="template-selector">
                <label className="template-label">Choose a Template</label>
                <div className="template-options">
                  {[
                    { id: "friendly", label: "😊 Friendly" },
                    { id: "professional", label: "👔 Professional" },
                    { id: "short", label: "⚡ Short & Sweet" },
                    { id: "incentive", label: "🎁 With Incentive" },
                  ].map(t => (
                    <div 
                      key={t.id} 
                      className={`template-chip ${selectedTemplate === t.id ? 'active' : ''}`}
                      onClick={() => selectTemplate(t.id)}
                    >
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="message-preview-container">
                <div className="preview-header">
                  <div className="preview-icon">
                    <i className="fab fa-whatsapp"></i>
                  </div>
                  <div>
                    <div className="preview-title">WhatsApp Preview</div>
                    <div className="preview-subtitle">How your message will appear</div>
                  </div>
                </div>
                
                <div className="message-bubble">
                  <p className="message-text" dangerouslySetInnerHTML={{ 
                    __html: templates[selectedTemplate as keyof typeof templates]
                      .replace(/{customer_name}/g, "<strong>Alice</strong>")
                      .replace(/{product_name}/g, "<strong>Nike Air Max 2024</strong>")
                      .replace(/{order_id}/g, "1234")
                      .replace(/{store_name}/g, "Your Store")
                      .replace(/{review_link}/g, "Leave a Review")
                      .replace(/\n/g, "<br>")
                  }} />
                  
                  <div className="message-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <i key={star} className="fas fa-star message-star"></i>
                    ))}
                  </div>
                  
                  <a href="#" className="message-link">
                    <i className="fas fa-star"></i>
                    Leave a Review
                  </a>
                </div>
              </div>

              <div className="variables-help">
                <div className="variables-title">
                  <i className="fas fa-magic"></i>
                  Personalization Variables
                </div>
                <div className="variables-list">
                  {["{customer_name}", "{product_name}", "{order_id}", "{store_name}", "{review_link}"].map(v => (
                    <span key={v} className="variable-tag" onClick={() => insertVariable(v)}>{v}</span>
                  ))}
                </div>
              </div>

              <div className="custom-message">
                <div className="input-label">
                  <span>Custom Message (Optional)</span>
                  <span className="char-count">{customMessage.length}/500</span>
                </div>
                <textarea 
                  className="message-textarea"
                  placeholder="Add a personal note to your customers..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>
            </div>
          )}

          {currentStep === 4 && !isSending && !isSuccess && (
            <div className="step-content active" id="summaryView">
              <h3 className="step-heading">Review & Confirm</h3>
              <p className="step-subheading">Double-check your settings before sending</p>

              <div className="summary-card">
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="fas fa-users"></i>
                    Selected Customers
                  </span>
                  <span className="summary-value highlight">{selectedCustomers.length}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="fas fa-paper-plane"></i>
                    Request Method
                  </span>
                  <span className="summary-value">
                    {selectedMethod === "recent" && "Recent Orders"}
                    {selectedMethod === "specific" && "Select Customers"}
                    {selectedMethod === "automated" && "AI Automated"}
                    {selectedMethod === "campaign" && "Bulk Campaign"}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="fas fa-comment"></i>
                    Message Template
                  </span>
                  <span className="summary-value">
                    {selectedTemplate === "friendly" && "Friendly 😊"}
                    {selectedTemplate === "professional" && "Professional 👔"}
                    {selectedTemplate === "short" && "Short & Sweet ⚡"}
                    {selectedTemplate === "incentive" && "With Incentive 🎁"}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">
                    <i className="fas fa-clock"></i>
                    Estimated Delivery
                  </span>
                  <span className="summary-value">Instant</span>
                </div>
              </div>

              <div className="selected-customers-preview">
                {selectedCustomers.map(name => (
                  <div key={name} className="customer-chip">
                    <div className="chip-avatar">{name.split(" ").map(n => n[0]).join("")}</div>
                    <span>{name}</span>
                    <button className="chip-remove" onClick={() => removeCustomer(name)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="helper-text warning">
                <i className="fas fa-exclamation-triangle"></i>
                <span>This will send WhatsApp messages to {selectedCustomers.length} customers. Make sure you have their consent.</span>
              </div>
            </div>
          )}

          {currentStep === 4 && isSending && (
            <div className="sending-animation">
              <div className="animation-icon">
                <div className="whatsapp-circle">
                  <i className="fab fa-whatsapp"></i>
                </div>
              </div>
              <div className="sending-text">Sending Messages...</div>
              <div className="sending-subtext">Please don&apos;t close this window</div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${sendProgress}%` }}></div>
              </div>
              <div style={{ textAlign: "center", color: "#64748b", fontSize: "0.9rem" }}>
                {sentCount} of {selectedCustomers.length} sent
              </div>
            </div>
          )}

          {currentStep === 4 && isSuccess && (
            <div className="success-state">
              <div className="success-icon">
                <i className="fas fa-check"></i>
              </div>
              <div className="success-title">All Done! 🎉</div>
              <div className="success-message">Review requests sent successfully</div>
              
              <div className="success-stats">
                <div className="success-stat">
                  <div className="success-stat-value">{selectedCustomers.length}</div>
                  <div className="success-stat-label">Sent</div>
                </div>
                <div className="success-stat">
                  <div className="success-stat-value" style={{ color: "#3b82f6" }}>{selectedCustomers.length}</div>
                  <div className="success-stat-label">Delivered</div>
                </div>
                <div className="success-stat">
                  <div className="success-stat-value" style={{ color: "#f59e0b" }}>0</div>
                  <div className="success-stat-label">Failed</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!isSending && !isSuccess && (
            <>
              <div className="footer-info">
                <i className="fas fa-shield-alt"></i>
                <span>Messages sent via WhatsApp Business API</span>
              </div>
              <div className="footer-actions">
                <button 
                  className="btn btn-back" 
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  style={{ display: currentStep === 1 ? "none" : "flex" }}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back
                </button>
                <button 
                  className="btn btn-next"
                  onClick={currentStep === 4 ? handleSend : () => setCurrentStep(prev => prev + 1)}
                >
                  {currentStep === 4 ? (
                    <>
                      Send Messages <i className="fas fa-paper-plane"></i>
                    </>
                  ) : (
                    <>
                      Continue <i className="fas fa-arrow-right"></i>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
          {isSuccess && (
            <div className="footer-actions" style={{ width: "100%", justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => { resetAndClose(); onClose(); }}>
                <i className="fas fa-times"></i>
                Close
              </button>
            </div>
          )}
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
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

          .modal {
            background: #ffffff;
            border-radius: 20px;
            width: 100%;
            max-width: 720px;
            max-height: 90vh;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            display: flex;
            flex-direction: column;
          }

          @keyframes slideUp {
            from { transform: translateY(40px) scale(0.96); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }

          .modal-header {
            padding: 1.75rem 2rem;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, rgba(37, 211, 102, 0.05) 0%, rgba(18, 140, 126, 0.05) 100%);
          }

          .header-content {
            display: flex;
            align-items: center;
            gap: 1rem;
          }

          .header-icon {
            width: 56px;
            height: 56px;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.75rem;
            box-shadow: 0 8px 20px rgba(37, 211, 102, 0.3);
          }

          .header-text h2 {
            font-size: 1.5rem;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }

          .header-text p {
            color: #64748b;
            font-size: 0.95rem;
          }

          .modal-close {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 2px solid #e2e8f0;
            background: white;
            cursor: pointer;
            font-size: 1.25rem;
            color: #64748b;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-close:hover {
            border-color: #ef4444;
            color: #ef4444;
            transform: rotate(90deg);
          }

          .progress-steps {
            display: flex;
            justify-content: space-between;
            padding: 1.5rem 2rem 0;
            position: relative;
          }

          .progress-steps::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 50px;
            right: 50px;
            height: 3px;
            background: #e2e8f0;
            z-index: 0;
          }

          .progress-line {
            position: absolute;
            top: 20px;
            left: 50px;
            height: 3px;
            background: linear-gradient(90deg, #25D366 0%, #128C7E 100%);
            z-index: 1;
            transition: width 0.4s ease;
          }

          .step {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.5rem;
            position: relative;
            z-index: 2;
            cursor: pointer;
          }

          .step-number {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: white;
            border: 3px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 1rem;
            color: #64748b;
            transition: all 0.3s;
          }

          .step.active .step-number {
            border-color: #25D366;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.4);
          }

          .step.completed .step-number {
            border-color: #10b981;
            background: #10b981;
            color: white;
          }

          .step-label {
            font-size: 0.875rem;
            font-weight: 600;
            color: #64748b;
          }

          .step.active .step-label {
            color: #25D366;
          }

          .step.completed .step-label {
            color: #10b981;
          }

          .modal-body {
            overflow-y: auto;
            padding: 2rem;
          }

          .step-content {
            display: none;
          }

          .step-content.active {
            display: block;
            animation: fadeIn 0.4s ease;
          }

          .step-heading {
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #1e293b;
          }

          .step-subheading {
            color: #64748b;
            margin-bottom: 1.5rem;
          }

          .selection-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          @media (max-width: 640px) {
            .selection-grid {
              grid-template-columns: 1fr;
            }
          }

          .selection-card {
            padding: 1.5rem;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
            background: white;
          }

          .selection-card:hover {
            border-color: #25D366;
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }

          .selection-card.selected {
            border-color: #25D366;
            background: rgba(37, 211, 102, 0.05);
            box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
          }

          .selection-icon {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 1.75rem;
            color: #64748b;
            transition: all 0.2s;
          }

          .selection-card.selected .selection-icon {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
          }

          .selection-title {
            font-weight: 700;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
            color: #1e293b;
          }

          .selection-desc {
            font-size: 0.875rem;
            color: #64748b;
            line-height: 1.5;
          }

          .helper-text {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #64748b;
            margin-top: 1rem;
            padding: 0.75rem;
            background: rgba(59, 130, 246, 0.05);
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
          }

          .helper-text.warning {
            background: rgba(245, 158, 11, 0.05);
            border-left-color: #f59e0b;
          }

          .customer-list-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }

          .list-stats {
            font-size: 0.9rem;
            color: #64748b;
          }

          .list-stats strong {
            color: #1e293b;
          }

          .select-all-btn {
            background: none;
            border: none;
            color: #25D366;
            font-weight: 700;
            cursor: pointer;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .customer-list {
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            max-height: 320px;
            overflow-y: auto;
          }

          .customer-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid #e2e8f0;
            cursor: pointer;
            transition: all 0.2s;
          }

          .customer-item:last-child {
            border-bottom: none;
          }

          .customer-item:hover {
            background: #f8fafc;
          }

          .customer-item.selected {
            background: rgba(37, 211, 102, 0.05);
          }

          .customer-checkbox {
            width: 22px;
            height: 22px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            flex-shrink: 0;
            color: transparent;
            font-size: 0.75rem;
          }

          .customer-item.selected .customer-checkbox {
            background: #25D366;
            border-color: #25D366;
            color: white;
          }

          .customer-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #128C7E;
            font-size: 0.95rem;
            flex-shrink: 0;
          }

          .customer-info {
            flex: 1;
          }

          .customer-name {
            font-weight: 700;
            font-size: 0.95rem;
            margin-bottom: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .verified-badge {
            background: rgba(37, 211, 102, 0.1);
            color: #10b981;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          .customer-order {
            font-size: 0.875rem;
            color: #64748b;
          }

          .customer-product {
            font-size: 0.8rem;
            color: #64748b;
            margin-top: 0.25rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .product-thumb {
            width: 24px;
            height: 24px;
            border-radius: 4px;
            background: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
          }

          .customer-date {
            font-size: 0.875rem;
            color: #64748b;
            text-align: right;
          }

          .customer-status {
            padding: 0.375rem 0.875rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
          }

          .status-eligible {
            background: rgba(37, 211, 102, 0.1);
            color: #10b981;
          }

          .status-requested {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
          }

          .template-selector {
            margin-bottom: 1.5rem;
          }

          .template-label {
            font-weight: 700;
            font-size: 0.9rem;
            margin-bottom: 0.75rem;
            display: block;
            color: #1e293b;
          }

          .template-options {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
          }

          .template-chip {
            padding: 0.625rem 1.25rem;
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 24px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
            color: #64748b;
            transition: all 0.2s;
          }

          .template-chip:hover {
            border-color: #25D366;
            color: #25D366;
          }

          .template-chip.active {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            border-color: #25D366;
          }

          .message-preview-container {
            background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 2px solid #DCF8C6;
          }

          .preview-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
            padding-bottom: 1rem;
            border-bottom: 1px dashed #e2e8f0;
          }

          .preview-icon {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #25D366;
            font-size: 1.25rem;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          }

          .preview-title {
            font-weight: 700;
            color: #1e293b;
          }

          .preview-subtitle {
            font-size: 0.875rem;
            color: #64748b;
          }

          .message-bubble {
            background: white;
            border-radius: 0 16px 16px 16px;
            padding: 1.25rem;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            position: relative;
            margin-left: 1rem;
          }

          .message-text {
            font-size: 0.95rem;
            line-height: 1.7;
            color: #1e293b;
            margin-bottom: 1rem;
          }

          .message-stars {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }

          .message-star {
            font-size: 1.5rem;
            color: #e2e8f0;
            cursor: pointer;
            transition: all 0.2s;
          }

          .message-star:hover {
            color: #fbbf24;
            transform: scale(1.1);
          }

          .message-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 24px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
          }

          .variables-help {
            background: #f8fafc;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .variables-title {
            font-weight: 700;
            font-size: 0.875rem;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .variables-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }

          .variable-tag {
            padding: 0.375rem 0.75rem;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            font-size: 0.8rem;
            font-family: monospace;
            color: #25D366;
            cursor: pointer;
            transition: all 0.2s;
          }

          .variable-tag:hover {
            background: #25D366;
            color: white;
            border-color: #25D366;
          }

          .custom-message {
            margin-bottom: 1.5rem;
          }

          .input-label {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          }

          .input-label span {
            font-weight: 700;
            font-size: 0.9rem;
            color: #1e293b;
          }

          .char-count {
            font-size: 0.8rem;
            color: #64748b;
          }

          .message-textarea {
            width: 100%;
            min-height: 120px;
            padding: 1rem;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            font-family: inherit;
            font-size: 0.95rem;
            resize: vertical;
            transition: all 0.2s;
          }

          .message-textarea:focus {
            outline: none;
            border-color: #25D366;
            box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
          }

          .summary-card {
            background: #f8fafc;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.875rem 0;
            border-bottom: 1px solid #e2e8f0;
          }

          .summary-row:last-child {
            border-bottom: none;
          }

          .summary-label {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            color: #64748b;
            font-size: 0.95rem;
          }

          .summary-label i {
            color: #25D366;
          }

          .summary-value {
            font-weight: 700;
            color: #1e293b;
          }

          .summary-value.highlight {
            color: #25D366;
            font-size: 1.25rem;
          }

          .selected-customers-preview {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.75rem;
            flex-wrap: wrap;
          }

          .customer-chip {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 0.875rem;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 24px;
            font-size: 0.875rem;
          }

          .chip-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 700;
            color: #128C7E;
          }

          .chip-remove {
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            font-size: 0.8rem;
            padding: 0.25rem;
          }

          .chip-remove:hover {
            color: #ef4444;
          }

          .sending-animation {
            text-align: center;
            padding: 3rem 2rem;
          }

          .animation-icon {
            width: 120px;
            height: 120px;
            margin: 0 auto 2rem;
            position: relative;
          }

          .whatsapp-circle {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            color: white;
            animation: pulse-ring 2s infinite;
          }

          @keyframes pulse-ring {
            0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4); }
            70% { box-shadow: 0 0 0 30px rgba(37, 211, 102, 0); }
            100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
          }

          .sending-text {
            font-size: 1.5rem;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }

          .sending-subtext {
            color: #64748b;
            font-size: 1rem;
          }

          .progress-bar {
            width: 100%;
            max-width: 400px;
            height: 8px;
            background: #e2e8f0;
            border-radius: 4px;
            margin: 2rem auto;
            overflow: hidden;
          }

          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #25D366 0%, #128C7E 100%);
            border-radius: 4px;
            transition: width 0.3s ease;
          }

          .success-state {
            text-align: center;
            padding: 3rem 2rem;
          }

          .success-icon {
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            font-size: 3rem;
            color: white;
            animation: scaleIn 0.5s ease;
          }

          @keyframes scaleIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }

          .success-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }

          .success-message {
            color: #64748b;
            font-size: 1rem;
            margin-bottom: 2rem;
          }

          .success-stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            margin-bottom: 2rem;
          }

          .success-stat {
            text-align: center;
          }

          .success-stat-value {
            font-size: 2.5rem;
            font-weight: 800;
            color: #10b981;
          }

          .success-stat-label {
            font-size: 0.875rem;
            color: #64748b;
          }

          .modal-footer {
            padding: 1.5rem 2rem;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8fafc;
          }

          .footer-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.9rem;
            color: #64748b;
          }

          .footer-info i {
            color: #25D366;
          }

          .footer-actions {
            display: flex;
            gap: 0.75rem;
          }

          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-family: inherit;
            font-weight: 700;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
          }

          .btn-back {
            background: white;
            color: #1e293b;
            border: 2px solid #e2e8f0;
          }

          .btn-back:hover {
            border-color: #64748b;
          }

          .btn-next {
            background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
          }

          .btn-next:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(37, 211, 102, 0.4);
          }

          .btn-secondary {
            background: white;
            color: #1e293b;
            border: 2px solid #e2e8f0;
          }

          @media (max-width: 640px) {
            .modal {
              max-height: 100vh;
              border-radius: 0;
            }

            .modal-body {
              padding: 1.5rem;
            }

            .progress-steps::before {
              display: none;
            }

            .step-label {
              display: none;
            }

            .success-stats {
              gap: 2rem;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
