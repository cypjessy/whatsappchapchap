"use client";

import { AddSupplierModalProps, categoryNames, categoryLogos, getPaymentTermsLabel } from "./types";

export function AddSupplierModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onUpdateField,
  currentStep,
  onNextStep,
  onPrevStep,
  onGoToStep,
}: AddSupplierModalProps) {
  const totalSteps = 5;

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.companyName.trim() || !formData.category) {
        alert("Please fill in company name and select a category");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.contactPerson.trim() || !formData.phone.trim() || !formData.whatsapp.trim()) {
        alert("Please fill in required contact fields");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        onNextStep();
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className={`modal-overlay ${isOpen ? "active" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-title-section">
              <h2><i className="fas fa-user-plus"></i> Add New Supplier</h2>
              <p>Complete the form below to onboard a new supplier to your network</p>
            </div>
            <button className="modal-close" onClick={handleClose}><i className="fas fa-times"></i></button>
          </div>
        </div>

        <div className="progress-steps">
          {[
            { num: 1, label: "Basic Info" },
            { num: 2, label: "Contact" },
            { num: 3, label: "Business" },
            { num: 4, label: "Terms" },
            { num: 5, label: "Review" },
          ].map((step) => (
            <div key={step.num} className={`step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`} data-step={step.num}>
              <div className="step-number">{currentStep > step.num ? <i className="fas fa-check"></i> : step.num}</div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>

        <div className="modal-body">
          <div className={`form-section ${currentStep === 1 ? 'active' : ''}`} data-section="1">
            <h3 className="section-title"><i className="fas fa-building"></i> Basic Information</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Company Name <span className="required">*</span></label>
                <div className="input-with-icon">
                  <i className="fas fa-building"></i>
                  <input type="text" className="form-input" placeholder="Enter registered company name" value={formData.companyName} onChange={(e) => onUpdateField("companyName", e.target.value)} />
                </div>
              </div>
              <div className="form-group full">
                <label className="form-label">Business Category <span className="required">*</span></label>
                <div className="category-grid">
                  {[
                    { value: "fashion", icon: "👔", name: "Fashion" },
                    { value: "electronics", icon: "💻", name: "Electronics" },
                    { value: "home", icon: "🏠", name: "Home" },
                    { value: "beauty", icon: "💄", name: "Beauty" },
                    { value: "sports", icon: "⚽", name: "Sports" },
                    { value: "other", icon: "📦", name: "Other" },
                  ].map((cat) => (
                    <label key={cat.value} className="category-option">
                      <input type="radio" name="category" value={cat.value} checked={formData.category === cat.value} onChange={(e) => onUpdateField("category", e.target.value)} />
                      <div className="category-card">
                        <div className="category-icon">{cat.icon}</div>
                        <div className="category-name">{cat.name}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Business Registration Number</label>
                <input type="text" className="form-input" placeholder="e.g., BRN123456" value={formData.regNumber} onChange={(e) => onUpdateField("regNumber", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tax ID / VAT Number</label>
                <input type="text" className="form-input" placeholder="e.g., VAT987654" value={formData.taxId} onChange={(e) => onUpdateField("taxId", e.target.value)} />
              </div>
            </div>
          </div>

          <div className={`form-section ${currentStep === 2 ? 'active' : ''}`} data-section="2">
            <h3 className="section-title"><i className="fas fa-address-card"></i> Contact Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Contact Person <span className="required">*</span></label>
                <div className="input-with-icon">
                  <i className="fas fa-user"></i>
                  <input type="text" className="form-input" placeholder="Full name" value={formData.contactPerson} onChange={(e) => onUpdateField("contactPerson", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Position / Title</label>
                <input type="text" className="form-input" placeholder="e.g., Sales Manager" value={formData.position} onChange={(e) => onUpdateField("position", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number <span className="required">*</span></label>
                <div className="input-with-icon">
                  <i className="fas fa-phone"></i>
                  <input type="tel" className="form-input" placeholder="+254 700 000 000" value={formData.phone} onChange={(e) => onUpdateField("phone", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp Business <span className="required">*</span></label>
                <div className="input-with-icon">
                  <i className="fab fa-whatsapp" style={{ color: "#25D366" }}></i>
                  <input type="tel" className="form-input" placeholder="+254 700 000 000" value={formData.whatsapp} onChange={(e) => onUpdateField("whatsapp", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-with-icon">
                  <i className="fas fa-envelope"></i>
                  <input type="email" className="form-input" placeholder="email@company.com" value={formData.email} onChange={(e) => onUpdateField("email", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Alternative Phone</label>
                <input type="tel" className="form-input" placeholder="Secondary contact" value={formData.altPhone} onChange={(e) => onUpdateField("altPhone", e.target.value)} />
              </div>
              <div className="form-group full">
                <label className="form-label">Physical Address</label>
                <textarea className="form-textarea" placeholder="Street address, building name, floor..." value={formData.address} onChange={(e) => onUpdateField("address", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input type="text" className="form-input" placeholder="City" value={formData.city} onChange={(e) => onUpdateField("city", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Country</label>
                <select className="form-select" value={formData.country} onChange={(e) => onUpdateField("country", e.target.value)}>
                  <option>Kenya</option>
                  <option>Uganda</option>
                  <option>Tanzania</option>
                  <option>Rwanda</option>
                  <option>Burundi</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`form-section ${currentStep === 3 ? 'active' : ''}`} data-section="3">
            <h3 className="section-title"><i className="fas fa-briefcase"></i> Business Details</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Products / Services Offered</label>
                <textarea className="form-textarea" placeholder="List main products, brands, or services supplied..." value={formData.products} onChange={(e) => onUpdateField("products", e.target.value)} />
              </div>
              <div className="form-group full">
                <label className="form-label">Payment Terms</label>
                <div className="payment-options">
                  {[
                    { value: "cod", label: "Cash on Delivery" },
                    { value: "net15", label: "Net 15" },
                    { value: "net30", label: "Net 30" },
                    { value: "prepaid", label: "Prepaid" },
                  ].map((opt) => (
                    <label key={opt.value} className="payment-option">
                      <input type="radio" name="payment" value={opt.value} checked={formData.paymentTerms === opt.value} onChange={(e) => onUpdateField("paymentTerms", e.target.value)} />
                      <div className="payment-card">
                        <div className="check-icon"><i className="fas fa-check"></i></div>
                        <span>{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Lead Time (Days)</label>
                <input type="number" className="form-input" placeholder="3-5" min="1" max="90" value={formData.leadTime} onChange={(e) => onUpdateField("leadTime", e.target.value)} />
                <div className="input-hint">Average delivery time</div>
              </div>
              <div className="form-group">
                <label className="form-label">Minimum Order Value</label>
                <input type="number" className="form-input" placeholder="100" min="0" value={formData.minOrder} onChange={(e) => onUpdateField("minOrder", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-select" value={formData.currency} onChange={(e) => onUpdateField("currency", e.target.value)}>
                  <option>KES - Kenyan Shilling</option>
                  <option>USD - US Dollar</option>
                  <option>UGX - Ugandan Shilling</option>
                  <option>TZS - Tanzanian Shilling</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Method</label>
                <select className="form-select" value={formData.deliveryMethod} onChange={(e) => onUpdateField("deliveryMethod", e.target.value)}>
                  <option value="supplier">Supplier Delivery</option>
                  <option value="pickup">Pickup</option>
                  <option value="thirdparty">Third-party Logistics</option>
                  <option value="dropshipping">Dropshipping</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Special Requirements / Notes</label>
                <textarea className="form-textarea" placeholder="Any special handling instructions, quality requirements, etc." value={formData.notes} onChange={(e) => onUpdateField("notes", e.target.value)} />
              </div>
            </div>
          </div>

          <div className={`form-section ${currentStep === 4 ? 'active' : ''}`} data-section="4">
            <h3 className="section-title"><i className="fas fa-clipboard-check"></i> Review & Confirm</h3>
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fas fa-building" style={{ color: "#25D366" }}></i> Company Information</div>
                <span style={{ color: "#25D366", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }} onClick={() => onGoToStep(1)}>Edit</span>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Company Name</div><div style={{ flex: 1, fontWeight: 600 }}>{formData.companyName || "-"}</div></div>
                <div style={{ display: "flex", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Category</div><div style={{ flex: 1, fontWeight: 600 }}>{categoryNames[formData.category] || "-"}</div></div>
                <div style={{ display: "flex", padding: "0.75rem 0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Registration</div><div style={{ flex: 1, fontWeight: 600 }}>{formData.regNumber || "-"}</div></div>
              </div>
            </div>
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fas fa-address-card" style={{ color: "#3b82f6" }}></i> Contact Details</div>
                <span style={{ color: "#25D366", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }} onClick={() => onGoToStep(2)}>Edit</span>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Contact Person</div><div style={{ flex: 1, fontWeight: 600 }}>{formData.contactPerson || "-"}</div></div>
                <div style={{ display: "flex", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Phone</div><div style={{ flex: 1, fontWeight: 600 }}>{formData.phone || "-"}</div></div>
                <div style={{ display: "flex", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>WhatsApp</div><div style={{ flex: 1, fontWeight: 600 }}>{formData.whatsapp || "-"}</div></div>
                <div style={{ display: "flex", padding: "0.75rem 0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Location</div><div style={{ flex: 1, fontWeight: 600 }}>{formData.city && formData.country ? `${formData.city}, ${formData.country}` : "-"}</div></div>
              </div>
            </div>
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "1.5rem" }}>
              <div style={{ padding: "1rem 1.5rem", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}><i className="fas fa-briefcase" style={{ color: "#f59e0b" }}></i> Business Terms</div>
                <span style={{ color: "#25D366", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer" }} onClick={() => onGoToStep(3)}>Edit</span>
              </div>
              <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", padding: "0.75rem 0", borderBottom: "1px solid #e2e8f0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Payment Terms</div><div style={{ flex: 1, fontWeight: 600 }}>{getPaymentTermsLabel(formData.paymentTerms)}</div></div>
                <div style={{ display: "flex", padding: "0.75rem 0" }}><div style={{ width: 150, color: "#64748b", fontSize: "0.9rem" }}>Lead Time</div><div style={{ flex: 1, fontWeight: 600 }}>{formData.leadTime ? `${formData.leadTime} days` : "-"}</div></div>
              </div>
            </div>
          </div>

          <div className={`form-section ${currentStep === 5 ? 'active' : ''}`} data-section="5" style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "linear-gradient(135deg, #10b981 0%, #00C853 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", color: "white", margin: "0 auto 1.5rem", boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)" }}>
              <i className="fas fa-check"></i>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.5rem" }}>Ready to Add Supplier!</h2>
            <p style={{ color: "#64748b", marginBottom: "2rem" }}>Click the button below to add this supplier to your network.</p>
            <button className="btn btn-success" style={{ padding: "1rem 2rem", fontSize: "1rem" }} onClick={onSubmit}>
              <i className="fas fa-check"></i>
              Add Supplier
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            <i className="fas fa-shield-alt" style={{ color: "#10b981" }}></i>
            <span>All data is encrypted and secure</span>
          </div>
          <div className="footer-actions">
            <button className="btn btn-secondary" id="prevBtn" onClick={onPrevStep} style={{ display: currentStep === 1 ? "none" : "inline-flex" }}>
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <button className="btn btn-primary" id="nextBtn" onClick={handleNext} style={{ display: currentStep >= 4 ? "none" : "inline-flex" }}>
              Continue
              <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          z-index: 1000;
          padding: 0;
          align-items: flex-end;
          justify-content: center;
        }
        .modal-overlay.active { display: flex; }
        .modal-container {
          background: #ffffff;
          border-radius: 20px 20px 0 0;
          width: 100%;
          max-width: 900px;
          max-height: 95vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .modal-overlay { padding: 2rem; align-items: center; }
          .modal-container { border-radius: 20px; max-height: 90vh; }
        }
        .modal-handle { display: block; width: 40px; height: 4px; background: #e2e8f0; border-radius: 2px; margin: 0.75rem auto; }
        @media (min-width: 768px) { .modal-handle { display: none; } }
        .modal-header {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          padding: 1rem 1rem 1.5rem;
        }
        @media (min-width: 768px) { .modal-header { padding: 1.75rem 2rem; } }
        .modal-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .modal-title-section h2 { font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem; }
        @media (min-width: 768px) { .modal-title-section h2 { font-size: 1.5rem; margin-bottom: 0.5rem; gap: 0.75rem; } }
        .modal-title-section p { opacity: 0.9; font-size: 0.85rem; display: none; }
        @media (min-width: 768px) { .modal-title-section p { display: block; font-size: 0.95rem; } }
        .modal-close {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          font-size: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        @media (min-width: 768px) { .modal-close { width: 40px; height: 40px; font-size: 1.25rem; } }
        .modal-close:hover { background: rgba(255, 255, 255, 0.3); }
        .progress-steps {
          display: flex;
          padding: 1rem 0.75rem 0;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width: 768px) { .progress-steps { padding: 1.5rem 2rem; } }
        .step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding-bottom: 1rem;
          min-width: 60px;
        }
        @media (min-width: 768px) { .step { padding-bottom: 1.5rem; min-width: auto; } }
        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 16px;
          right: -50%;
          width: 100%;
          height: 2px;
          background: #e2e8f0;
          z-index: 0;
        }
        @media (min-width: 768px) { .step:not(:last-child)::after { top: 20px; height: 3px; } }
        .step.completed:not(:last-child)::after { background: #25D366; }
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #f8fafc;
          border: 3px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.8rem;
          color: #64748b;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 768px) { .step-number { width: 40px; height: 40px; font-size: 0.9rem; } }
        .step.active .step-number {
          background: #25D366;
          border-color: #25D366;
          color: white;
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.2);
        }
        .step.completed .step-number {
          background: #25D366;
          border-color: #25D366;
          color: white;
        }
        .step-label {
          margin-top: 0.5rem;
          font-size: 0.65rem;
          font-weight: 600;
          color: #64748b;
          text-align: center;
        }
        @media (min-width: 768px) { .step-label { font-size: 0.875rem; margin-top: 0.75rem; } }
        .step.active .step-label { color: #25D366; }
        .step.completed .step-label { color: #10b981; }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          background: #f8fafc;
          max-height: calc(95vh - 180px);
        }
        @media (min-width: 768px) { .modal-body { padding: 2rem; max-height: none; } }
        .form-section { display: none; animation: fadeIn 0.3s; }
        .form-section.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .section-title { font-size: 1rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; color: #1e293b; }
        @media (min-width: 768px) { .section-title { font-size: 1.125rem; margin-bottom: 1.5rem; gap: 0.75rem; } }
        .section-title i { color: #25D366; }
        .form-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        @media (min-width: 768px) { .form-grid { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; } }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-weight: 700; font-size: 0.8rem; color: #1e293b; display: flex; align-items: center; gap: 0.25rem; }
        @media (min-width: 768px) { .form-label { font-size: 0.875rem; } }
        .required { color: #ef4444; }
        .form-input, .form-select, .form-textarea {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.9rem;
          background: white;
          transition: all 0.2s;
          width: 100%;
        }
        @media (min-width: 768px) { .form-input, .form-select, .form-textarea { padding: 0.875rem 1rem; font-size: 0.95rem; } }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #25D366;
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
        }
        .form-textarea { resize: vertical; min-height: 80px; }
        .input-with-icon { position: relative; }
        .input-with-icon i {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
        }
        @media (min-width: 768px) { .input-with-icon i { left: 1rem; } }
        .input-with-icon .form-input { padding-left: 2.5rem; }
        .input-hint { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }
        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .category-option { position: relative; cursor: pointer; }
        .category-option input { position: absolute; opacity: 0; }
        .category-card {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          text-align: center;
          transition: all 0.2s;
          background: white;
        }
        .category-option:hover .category-card { border-color: #25D366; transform: translateY(-2px); }
        .category-option input:checked + .category-card {
          border-color: #25D366;
          background: rgba(37, 211, 102, 0.05);
          box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
        }
        .category-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin: 0 auto 0.5rem;
          background: #f8fafc;
        }
        .category-option input:checked + .category-card .category-icon { background: #25D366; color: white; }
        .category-name { font-weight: 700; font-size: 0.8rem; color: #1e293b; }
        @media (min-width: 768px) { .category-name { font-size: 0.9rem; } }
        .payment-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .payment-option { position: relative; cursor: pointer; flex: 1; min-width: 120px; }
        .payment-option input { position: absolute; opacity: 0; }
        .payment-card {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          background: white;
          font-size: 0.85rem;
        }
        .payment-option:hover .payment-card { border-color: #25D366; }
        .payment-option input:checked + .payment-card {
          border-color: #25D366;
          background: rgba(37, 211, 102, 0.05);
        }
        .check-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .payment-option input:checked + .payment-card .check-icon { background: #25D366; border-color: #25D366; color: white; }
        .modal-footer {
          padding: 1rem;
          background: white;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
        }
        @media (min-width: 768px) { .modal-footer { padding: 1.5rem 2rem; gap: 0; } }
        .footer-info { display: none; }
        @media (min-width: 768px) { .footer-info { display: flex; align-items: center; gap: 0.75rem; color: #64748b; font-size: 0.9rem; } }
        .footer-actions { display: flex; gap: 0.5rem; width: 100%; }
        @media (min-width: 768px) { .footer-actions { width: auto; gap: 0.75rem; } }
        .btn {
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-family: inherit;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          justify-content: center;
        }
        @media (min-width: 768px) { .btn { padding: 0.75rem 1.5rem; font-size: 0.9rem; flex: unset; } }
        .btn-primary {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
        }
        .btn-success { background: #10b981; color: white; }
        .btn-secondary { background: #ffffff; color: #1e293b; border: 2px solid #e2e8f0; }
      `}</style>
    </div>
  );
}
