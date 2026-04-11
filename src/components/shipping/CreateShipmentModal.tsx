"use client";

import { useState } from "react";
import { ShippingFormData } from "./types";

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function CreateShipmentModal({ isOpen, onClose, onSubmit }: CreateShipmentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    carrier: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    packages: "1",
    fragile: "no",
    insurance: "",
    speed: "standard",
    deliveryDate: "",
    timeWindow: "anytime",
    instructions: "",
    confirm: false,
  });

  const totalSteps = 5;

  const toggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (selectedOrders.size === 0) {
        alert("Please select at least one order to ship");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.carrier) {
        alert("Please select a shipping carrier");
        return false;
      }
    }
    if (step === 3) {
      if (!formData.weight || parseFloat(formData.weight) <= 0) {
        alert("Please enter a valid weight");
        return false;
      }
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

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateTrackingNumber = () => {
    const prefix = "WS";
    const year = new Date().getFullYear();
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}-${year}-${random}`;
  };

  const handleSubmit = () => {
    if (!formData.confirm) {
      alert("Please confirm the shipment details");
      return;
    }
    
    const shipmentData = {
      orders: Array.from(selectedOrders),
      carrier: formData.carrier,
      package: {
        weight: parseFloat(formData.weight),
        dimensions: {
          length: parseInt(formData.length) || 0,
          width: parseInt(formData.width) || 0,
          height: parseInt(formData.height) || 0,
        },
        fragile: formData.fragile === "yes",
        insurance: parseFloat(formData.insurance) || 0,
      },
      shipping: {
        speed: formData.speed,
        deliveryDate: formData.deliveryDate,
        timeWindow: formData.timeWindow,
        instructions: formData.instructions,
      },
      trackingNumber: generateTrackingNumber(),
    };
    
    onSubmit(shipmentData);
    onClose();
  };

  const mockOrders = [
    { id: "1234", customer: "Alice Johnson", items: "Nike Air Max, Leather Bag + 2 more", destination: "Nairobi, Kenya" },
    { id: "1233", customer: "Bob Smith", items: "Premium Leather Handbag x2", destination: "Mombasa, Kenya" },
    { id: "1232", customer: "Carol White", items: "Smart Watch Pro", destination: "Kisumu, Kenya" },
    { id: "1231", customer: "David Miller", items: "Wireless Headphones, Keyboard", destination: "Nakuru, Kenya" },
  ];

  const carriers = [
    { value: "g4s", name: "G4S Logistics", price: 12.00, time: "1-2 business days", color: "#1e40af", icon: "G4" },
    { value: "sendy", name: "Sendy", price: 8.50, time: "Same day delivery", color: "#00d384", icon: "S" },
    { value: "aramex", name: "Aramex", price: 15.00, time: "2-3 business days", color: "#e31937", icon: "A" },
    { value: "maramoja", name: "Maramoja", price: 6.00, time: "1-3 business days", color: "#ff6b00", icon: "M" },
    { value: "bolt", name: "Bolt Delivery", price: 10.00, time: "Within 4 hours", color: "#34d186", icon: "B" },
    { value: "pickup", name: "Customer Pickup", price: 0.00, time: "Flexible", color: "#8b5cf6", icon: "PH" },
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <style jsx>{`
        .modal-overlay {
          display: flex;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          z-index: 1000;
          padding: 2rem;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal-container {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 1000px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .modal-header {
          background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
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
        .modal-title-section h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.75rem; }
        .modal-title-section p { opacity: 0.9; font-size: 0.95rem; }
        .modal-close {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-close:hover { background: rgba(255, 255, 255, 0.3); transform: rotate(90deg); }
        .progress-steps {
          display: flex;
          padding: 1.5rem 2rem 0;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          gap: 0;
        }
        .step {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          padding-bottom: 1.5rem;
        }
        .step:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 20px;
          right: -50%;
          width: 100%;
          height: 3px;
          background: #e2e8f0;
          z-index: 0;
        }
        .step.completed:not(:last-child)::after { background: #3b82f6; }
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f8fafc;
          border: 3px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          color: #64748b;
          position: relative;
          z-index: 1;
        }
        .step.active .step-number { background: #3b82f6; border-color: #3b82f6; color: white; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2); }
        .step.completed .step-number { background: #3b82f6; border-color: #3b82f6; color: white; }
        .step-label { margin-top: 0.75rem; font-size: 0.875rem; font-weight: 600; color: #64748b; }
        .step.active .step-label { color: #3b82f6; }
        .step.completed .step-label { color: #3b82f6; }
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          background: #f8fafc;
        }
        .form-section { display: none; animation: fadeInSection 0.4s ease; }
        .form-section.active { display: block; }
        @keyframes fadeInSection { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .section-title { font-size: 1.125rem; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem; color: #1e293b; }
        .section-title i { color: #3b82f6; }
        .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { font-weight: 700; font-size: 0.875rem; color: #1e293b; }
        .required { color: #ef4444; }
        .form-input, .form-select, .form-textarea {
          padding: 0.875rem 1rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-family: inherit;
          font-size: 0.95rem;
          transition: all 0.2s;
          background: white;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .form-textarea { resize: vertical; min-height: 100px; }
        .input-with-icon { position: relative; }
        .input-with-icon i { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; }
        .input-with-icon .form-input { padding-left: 2.75rem; }
        .input-hint { font-size: 0.8rem; color: #64748b; margin-top: 0.25rem; }
        .order-selection { background: white; border-radius: 8px; border: 2px solid #e2e8f0; overflow: hidden; }
        .order-search { padding: 1rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc; position: relative; }
        .order-search input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.5rem; border: 2px solid #e2e8f0; border-radius: 8px; background: white; }
        .order-search input:focus { outline: none; border-color: #3b82f6; }
        .order-search i { position: absolute; left: 1.5rem; top: 50%; transform: translateY(-50%); color: #64748b; }
        .order-list { max-height: 300px; overflow-y: auto; }
        .order-item { display: flex; align-items: center; gap: 1rem; padding: 1rem; border-bottom: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
        .order-item:hover { background: rgba(59, 130, 246, 0.05); }
        .order-item.selected { background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; }
        .order-checkbox { width: 22px; height: 22px; border: 2px solid #e2e8f0; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
        .order-item.selected .order-checkbox { background: #3b82f6; border-color: #3b82f6; color: white; }
        .order-info { flex: 1; }
        .order-id { font-weight: 700; color: #3b82f6; font-size: 0.95rem; }
        .order-customer { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
        .order-items { font-size: 0.8rem; color: #64748b; }
        .order-destination { text-align: right; }
        .destination-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.375rem 0.875rem; background: #f8fafc; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #64748b; }
        .carrier-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .carrier-option { position: relative; cursor: pointer; }
        .carrier-option input { position: absolute; opacity: 0; }
        .carrier-card { padding: 1.5rem; border: 2px solid #e2e8f0; border-radius: 8px; text-align: center; transition: all 0.2s; background: white; }
        .carrier-option:hover .carrier-card { border-color: #3b82f6; transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .carrier-option input:checked + .carrier-card { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .carrier-logo { width: 60px; height: 60px; border-radius: 8px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 800; margin: 0 auto 1rem; }
        .carrier-name { font-weight: 700; font-size: 1rem; color: #1e293b; margin-bottom: 0.25rem; }
        .carrier-price { font-size: 1.25rem; font-weight: 800; color: #3b82f6; }
        .carrier-time { font-size: 0.875rem; color: #64748b; margin-top: 0.5rem; }
        .carrier-features { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-top: 0.75rem; }
        .feature-tag { padding: 0.25rem 0.5rem; background: #f8fafc; border-radius: 4px; font-size: 0.75rem; font-weight: 600; color: #64748b; }
        .package-visual { background: white; border-radius: 8px; border: 2px solid #e2e8f0; padding: 1.5rem; text-align: center; }
        .package-icon { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white; margin: 0 auto 1rem; }
        .package-dimensions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem; }
        .dimension-input label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; font-weight: 700; }
        .shipping-options { display: flex; flex-direction: column; gap: 1rem; }
        .shipping-option { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border: 2px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .shipping-option:hover { border-color: #3b82f6; }
        .shipping-option input { width: 20px; height: 20px; accent-color: #3b82f6; }
        .shipping-option-content { flex: 1; }
        .shipping-option-title { font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .shipping-option-desc { font-size: 0.875rem; color: #64748b; margin-top: 0.25rem; }
        .shipping-option-price { font-weight: 800; font-size: 1.25rem; color: #3b82f6; }
        .summary-card { background: white; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
        .summary-header { padding: 1rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .summary-title { font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
        .summary-edit { color: #3b82f6; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
        .summary-body { padding: 1.5rem; }
        .summary-row { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid #e2e8f0; }
        .summary-row:last-child { border-bottom: none; }
        .summary-label { color: #64748b; font-size: 0.9rem; }
        .summary-value { font-weight: 600; color: #1e293b; }
        .summary-total { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; margin: 1rem -1.5rem -1.5rem; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; }
        .summary-total-label { font-weight: 700; }
        .summary-total-value { font-size: 1.5rem; font-weight: 800; }
        .tracking-preview { background: linear-gradient(135deg, #DCF8C6 0%, #e0e7ff 100%); border-radius: 8px; padding: 1.5rem; text-align: center; border: 2px dashed #25D366; }
        .tracking-icon { width: 60px; height: 60px; border-radius: 50%; background: #25D366; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1rem; }
        .tracking-number { font-family: monospace; font-size: 1.5rem; font-weight: 800; color: #128C7E; letter-spacing: 2px; margin-bottom: 0.5rem; }
        .tracking-label { font-size: 0.875rem; color: #64748b; }
        .modal-footer { padding: 1.5rem 2rem; background: white; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
        .footer-info { display: flex; align-items: center; gap: 0.75rem; color: #64748b; font-size: 0.9rem; }
        .footer-actions { display: flex; gap: 0.75rem; }
        .btn { padding: 0.875rem 1.75rem; border-radius: 8px; font-family: inherit; font-weight: 700; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; border: none; display: inline-flex; align-items: center; gap: 0.5rem; }
        .btn-secondary { background: #f8fafc; color: #1e293b; border: 2px solid #e2e8f0; }
        .btn-secondary:hover { border-color: #3b82f6; color: #3b82f6; }
        .btn-primary { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #059669; }
        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; }
          .carrier-grid { grid-template-columns: 1fr; }
          .progress-steps { padding: 1rem; }
          .step-label { display: none; }
        }
      `}</style>

      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-header-content">
            <div className="modal-title-section">
              <h2><i className="fas fa-shipping-fast"></i> Create New Shipment</h2>
              <p>Arrange delivery for your orders with trusted carriers</p>
            </div>
            <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
          </div>
        </div>

        <div className="progress-steps">
          {[
            { num: 1, label: "Select Orders" },
            { num: 2, label: "Choose Carrier" },
            { num: 3, label: "Package Details" },
            { num: 4, label: "Shipping Options" },
            { num: 5, label: "Review & Confirm" },
          ].map((step) => (
            <div key={step.num} className={`step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}>
              <div className="step-number">{currentStep > step.num ? <i className="fas fa-check"></i> : step.num}</div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>

        <div className="modal-body">
          {/* Step 1: Select Orders */}
          <div className={`form-section ${currentStep === 1 ? 'active' : ''}`}>
            <h3 className="section-title"><i className="fas fa-shopping-bag"></i> Select Orders to Ship</h3>
            <div className="form-group full">
              <div className="order-selection">
                <div className="order-search">
                  <i className="fas fa-search"></i>
                  <input type="text" placeholder="Search by order ID, customer name, or product..." />
                </div>
                <div className="order-list">
                  {mockOrders.map((order) => (
                    <div
                      key={order.id}
                      className={`order-item ${selectedOrders.has(order.id) ? 'selected' : ''}`}
                      onClick={() => toggleOrder(order.id)}
                    >
                      <div className="order-checkbox">
                        {selectedOrders.has(order.id) && <i className="fas fa-check"></i>}
                      </div>
                      <div className="order-info">
                        <div className="order-id">#{order.id}</div>
                        <div className="order-customer">{order.customer}</div>
                        <div className="order-items">{order.items}</div>
                      </div>
                      <div className="order-destination">
                        <span className="destination-badge">
                          <i className="fas fa-map-marker-alt"></i>
                          {order.destination}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="input-hint">
                <i className="fas fa-info-circle"></i>
                Selected: <strong>{selectedOrders.size}</strong> orders | Total items: <strong>{selectedOrders.size * 2 + 1}</strong>
              </div>
            </div>
          </div>

          {/* Step 2: Choose Carrier */}
          <div className={`form-section ${currentStep === 2 ? 'active' : ''}`}>
            <h3 className="section-title"><i className="fas fa-truck"></i> Select Shipping Carrier</h3>
            <div className="form-group full">
              <div className="carrier-grid">
                {carriers.map((carrier) => (
                  <label key={carrier.value} className="carrier-option">
                    <input
                      type="radio"
                      name="carrier"
                      value={carrier.value}
                      checked={formData.carrier === carrier.value}
                      onChange={(e) => updateField("carrier", e.target.value)}
                    />
                    <div className="carrier-card">
                      <div className="carrier-logo" style={{ background: carrier.color, color: "white" }}>{carrier.icon}</div>
                      <div className="carrier-name">{carrier.name}</div>
                      <div className="carrier-price">${carrier.price.toFixed(2)}</div>
                      <div className="carrier-time"><i className="fas fa-clock"></i> {carrier.time}</div>
                      <div className="carrier-features">
                        {carrier.value === "g4s" && <><span className="feature-tag">Insured</span><span className="feature-tag">Tracking</span></>}
                        {carrier.value === "sendy" && <><span className="feature-tag">Express</span><span className="feature-tag">Live tracking</span></>}
                        {carrier.value === "aramex" && <><span className="feature-tag">International</span><span className="feature-tag">COD</span></>}
                        {carrier.value === "pickup" && <><span className="feature-tag">Free</span><span className="feature-tag">Store</span></>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Package Details */}
          <div className={`form-section ${currentStep === 3 ? 'active' : ''}`}>
            <h3 className="section-title"><i className="fas fa-box-open"></i> Package Information</h3>
            <div className="form-grid">
              <div className="form-group full">
                <div className="package-visual">
                  <div className="package-icon"><i className="fas fa-cube"></i></div>
                  <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>Package Dimensions</div>
                  <div style={{ fontSize: "0.875rem", color: "#64748b" }}>Enter measurements in centimeters</div>
                  <div className="package-dimensions">
                    <div className="dimension-input">
                      <label>Length (cm)</label>
                      <input type="number" className="form-input" placeholder="0" min="1" value={formData.length} onChange={(e) => updateField("length", e.target.value)} />
                    </div>
                    <div className="dimension-input">
                      <label>Width (cm)</label>
                      <input type="number" className="form-input" placeholder="0" min="1" value={formData.width} onChange={(e) => updateField("width", e.target.value)} />
                    </div>
                    <div className="dimension-input">
                      <label>Height (cm)</label>
                      <input type="number" className="form-input" placeholder="0" min="1" value={formData.height} onChange={(e) => updateField("height", e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Total Weight (kg) <span className="required">*</span></label>
                <div className="input-with-icon">
                  <i className="fas fa-weight-hanging"></i>
                  <input type="number" className="form-input" placeholder="0.00" step="0.01" min="0.1" value={formData.weight} onChange={(e) => updateField("weight", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Number of Packages</label>
                <input type="number" className="form-input" value={formData.packages} onChange={(e) => updateField("packages", e.target.value)} min="1" max="50" />
              </div>
              <div className="form-group">
                <label className="form-label">Fragile Items?</label>
                <select className="form-select" value={formData.fragile} onChange={(e) => updateField("fragile", e.target.value)}>
                  <option value="no">No - Standard handling</option>
                  <option value="yes">Yes - Fragile stickers required</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Insurance Value ($)</label>
                <div className="input-with-icon">
                  <i className="fas fa-shield-alt"></i>
                  <input type="number" className="form-input" placeholder="0.00" value={formData.insurance} onChange={(e) => updateField("insurance", e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Shipping Options */}
          <div className={`form-section ${currentStep === 4 ? 'active' : ''}`}>
            <h3 className="section-title"><i className="fas fa-cog"></i> Shipping Options</h3>
            <div className="form-group full">
              <label className="form-label">Delivery Speed</label>
              <div className="shipping-options">
                <label className="shipping-option">
                  <input type="radio" name="speed" value="standard" checked={formData.speed === "standard"} onChange={(e) => updateField("speed", e.target.value)} />
                  <div className="shipping-option-content">
                    <div className="shipping-option-title"><i className="fas fa-truck" style={{ color: "#3b82f6" }}></i> Standard Delivery</div>
                    <div className="shipping-option-desc">Regular shipping with tracking</div>
                  </div>
                  <div className="shipping-option-price">Base price</div>
                </label>
                <label className="shipping-option">
                  <input type="radio" name="speed" value="express" checked={formData.speed === "express"} onChange={(e) => updateField("speed", e.target.value)} />
                  <div className="shipping-option-content">
                    <div className="shipping-option-title">
                      <i className="fas fa-shipping-fast" style={{ color: "#f59e0b" }}></i> Express Delivery
                      <span style={{ background: "#f59e0b", color: "white", padding: "0.125rem 0.5rem", borderRadius: "4px", fontSize: "0.75rem" }}>POPULAR</span>
                    </div>
                    <div className="shipping-option-desc">Priority handling and faster delivery</div>
                  </div>
                  <div className="shipping-option-price">+$5.00</div>
                </label>
                <label className="shipping-option">
                  <input type="radio" name="speed" value="overnight" checked={formData.speed === "overnight"} onChange={(e) => updateField("speed", e.target.value)} />
                  <div className="shipping-option-content">
                    <div className="shipping-option-title"><i className="fas fa-bolt" style={{ color: "#10b981" }}></i> Overnight Delivery</div>
                    <div className="shipping-option-desc">Next business day guaranteed</div>
                  </div>
                  <div className="shipping-option-price">+$12.00</div>
                </label>
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: "1.5rem" }}>
              <div className="form-group">
                <label className="form-label">Preferred Delivery Date</label>
                <input type="date" className="form-input" value={formData.deliveryDate} onChange={(e) => updateField("deliveryDate", e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Time Window</label>
                <select className="form-select" value={formData.timeWindow} onChange={(e) => updateField("timeWindow", e.target.value)}>
                  <option value="anytime">Anytime</option>
                  <option value="morning">Morning (8AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                  <option value="evening">Evening (5PM - 8PM)</option>
                </select>
              </div>
              <div className="form-group full">
                <label className="form-label">Special Delivery Instructions</label>
                <textarea className="form-textarea" placeholder="Gate codes, landmarks, or specific delivery instructions..." value={formData.instructions} onChange={(e) => updateField("instructions", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Step 5: Review & Confirm */}
          <div className={`form-section ${currentStep === 5 ? 'active' : ''}`}>
            <h3 className="section-title"><i className="fas fa-clipboard-check"></i> Review Shipment Details</h3>
            
            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-title"><i className="fas fa-shopping-bag" style={{ color: "#3b82f6" }}></i> Orders to Ship</div>
                <span className="summary-edit" onClick={() => goToStep(1)}>Edit</span>
              </div>
              <div className="summary-body">
                <div className="summary-row">
                  <span className="summary-label">Selected Orders</span>
                  <span className="summary-value">{selectedOrders.size} orders</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Total Items</span>
                  <span className="summary-value">{selectedOrders.size * 2 + 1} items</span>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-title"><i className="fas fa-truck" style={{ color: "#3b82f6" }}></i> Shipping Method</div>
                <span className="summary-edit" onClick={() => goToStep(2)}>Edit</span>
              </div>
              <div className="summary-body">
                <div className="summary-row">
                  <span className="summary-label">Carrier</span>
                  <span className="summary-value">{carriers.find(c => c.value === formData.carrier)?.name || "Not selected"}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Service</span>
                  <span className="summary-value">{formData.speed === "standard" ? "Standard" : formData.speed === "express" ? "Express" : "Overnight"} Delivery</span>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-header">
                <div className="summary-title"><i className="fas fa-box" style={{ color: "#3b82f6" }}></i> Package Details</div>
                <span className="summary-edit" onClick={() => goToStep(3)}>Edit</span>
              </div>
              <div className="summary-body">
                <div className="summary-row">
                  <span className="summary-label">Dimensions</span>
                  <span className="summary-value">{formData.length || 0} x {formData.width || 0} x {formData.height || 0} cm</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Weight</span>
                  <span className="summary-value">{formData.weight || 0} kg</span>
                </div>
              </div>
              <div className="summary-total">
                <span className="summary-total-label">Total Shipping Cost</span>
                <span className="summary-total-value">${(carriers.find(c => c.value === formData.carrier)?.price || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="tracking-preview">
              <div className="tracking-icon"><i className="fas fa-qrcode"></i></div>
              <div className="tracking-number">{generateTrackingNumber()}</div>
              <div className="tracking-label">Tracking Number (Auto-generated)</div>
            </div>

            <div className="form-group full" style={{ marginTop: "1.5rem" }}>
              <label className="form-label" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
                <input type="checkbox" style={{ marginTop: "0.25rem" }} checked={formData.confirm} onChange={(e) => updateField("confirm", e.target.checked)} />
                <span style={{ fontWeight: 500, lineHeight: 1.5 }}>
                  I confirm that all shipment details are correct and I authorize the carrier to collect the packages.
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-info">
            <i className="fas fa-shield-alt" style={{ color: "#10b981" }}></i>
            <span>Insured shipping up to $1,000</span>
          </div>
          <div className="footer-actions">
            <button className="btn btn-secondary" onClick={prevStep} style={{ display: currentStep === 1 ? "none" : "inline-flex" }}>
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <button className="btn btn-primary" onClick={nextStep} style={{ display: currentStep >= totalSteps ? "none" : "inline-flex" }}>
              Continue <i className="fas fa-arrow-right"></i>
            </button>
            <button className="btn btn-success" onClick={handleSubmit} style={{ display: currentStep === totalSteps ? "inline-flex" : "none" }}>
              <i className="fas fa-check"></i> Create Shipment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
