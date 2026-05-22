"use client";

import { useState } from "react";

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
}

interface ShippingMethodsModalProps {
  isOpen: boolean;
  onClose: () => void;
  methods?: ShippingMethod[];
  onSave: (methods: ShippingMethod[]) => void;
}

export function ShippingMethodsModal({ isOpen, onClose, methods = [], onSave }: ShippingMethodsModalProps) {
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(
    methods.length > 0 ? methods : [
      { id: "standard", name: "Standard Delivery", price: 500 },
      { id: "express", name: "Express Delivery", price: 1000 },
      { id: "pickup", name: "Store Pickup", price: 0 }
    ]
  );

  const [newMethod, setNewMethod] = useState({ name: "", price: "" });

  const addMethod = () => {
    if (!newMethod.name.trim()) return;
    const method: ShippingMethod = {
      id: newMethod.name.toLowerCase().replace(/\s+/g, "_"),
      name: newMethod.name.trim(),
      price: parseFloat(newMethod.price) || 0
    };
    setShippingMethods([...shippingMethods, method]);
    setNewMethod({ name: "", price: "" });
  };

  const removeMethod = (id: string) => {
    setShippingMethods(shippingMethods.filter(m => m.id !== id));
  };

  const updateMethod = (id: string, field: "name" | "price", value: string) => {
    setShippingMethods(shippingMethods.map(m => 
      m.id === id 
        ? { ...m, [field]: field === "price" ? parseFloat(value) || 0 : value }
        : m
    ));
  };

  const handleSave = () => {
    onSave(shippingMethods);
    onClose();
  };

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
        .modal {
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp { from { transform: translateY(30px) scale(0.95); opacity: 0; } to { transform: translateY(0) scale(1); opacity: 1; } }
        .modal-header {
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          padding: 1.5rem 2rem;
        }
        .modal-header h2 { margin: 0; font-size: 1.5rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; }
        .modal-body { padding: 2rem; max-height: 60vh; overflow-y: auto; }
        .method-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .method-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
        }
        .method-item input {
          padding: 0.75rem;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .method-item input[type="text"] { flex: 1; }
        .method-item input[type="number"] { width: 100px; }
        .method-item input:focus { outline: none; border-color: #25D366; }
        .remove-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          background: #fee2e2;
          color: #ef4444;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .remove-btn:hover { background: #ef4444; color: white; }
        .add-form {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: #f0fdf4;
          border-radius: 12px;
          border: 2px dashed #25D366;
        }
        .add-form input { flex: 1; }
        .add-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }
        .btn-cancel {
          padding: 0.75rem 1.5rem;
          background: white;
          color: #64748b;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-cancel:hover { border-color: #ef4444; color: #ef4444; }
        .btn-save {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }
        .btn-save:hover { box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3); }
        @media (max-width: 640px) {
          .modal-overlay { padding: 1rem; }
          .modal { border-radius: 16px; max-height: 85vh; }
          .modal-header { padding: 1rem 1.5rem; }
          .modal-header h2 { font-size: 1.25rem; }
          .modal-body { padding: 1rem; max-height: 55vh; }
          .method-item { flex-wrap: wrap; gap: 0.5rem; }
          .method-item input[type="number"] { width: 80px; }
          .add-form { flex-direction: column; }
          .add-btn { width: 100%; justify-content: center; }
          .modal-footer { padding: 1rem; flex-direction: column; }
          .btn-cancel, .btn-save { width: 100%; justify-content: center; }
        }
      `}</style>
      
      <div className="modal">
        <div className="modal-header">
          <h2><i className="fas fa-truck"></i> Shipping Methods</h2>
        </div>
        
        <div className="modal-body">
          <div className="method-list">
            {shippingMethods.map((method) => (
              <div key={method.id} className="method-item">
                <input
                  type="text"
                  value={method.name}
                  onChange={(e) => updateMethod(method.id, "name", e.target.value)}
                  placeholder="Method name"
                />
                <input
                  type="number"
                  value={method.price}
                  onChange={(e) => updateMethod(method.id, "price", e.target.value)}
                  placeholder="Price"
                  min="0"
                />
                <span style={{ color: "#64748b", fontWeight: 600 }}>KES</span>
                <button className="remove-btn" onClick={() => removeMethod(method.id)}>
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}
          </div>
          
          <div className="add-form">
            <input
              type="text"
              value={newMethod.name}
              onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
              placeholder="New method name"
            />
            <input
              type="number"
              value={newMethod.price}
              onChange={(e) => setNewMethod({ ...newMethod, price: e.target.value })}
              placeholder="Price"
              min="0"
            />
            <button className="add-btn" onClick={addMethod}>
              <i className="fas fa-plus"></i> Add
            </button>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save Methods</button>
        </div>
      </div>
    </div>
  );
}