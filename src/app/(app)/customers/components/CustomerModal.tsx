"use client";

import { useState, useEffect } from "react";
import { Customer, Order, orderService } from "@/lib/db";
import { useAuth } from "@/context/AuthContext";

interface CustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
  onSendWhatsApp: (phone: string, message?: string) => void;
  formatCurrency: (amount: number) => string;
  getColorFromString: (str: string) => string;
  getInitials: (name: string) => string;
}

export default function CustomerModal({
  customer,
  onClose,
  onDelete,
  onUpdateNotes,
  onSendWhatsApp,
  formatCurrency,
  getColorFromString,
  getInitials,
}: CustomerModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [customerNotes, setCustomerNotes] = useState(customer.notes || "");
  const [customerTags, setCustomerTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (activeTab === "orders") {
      loadCustomerOrders();
    }
  }, [activeTab]);

  const loadCustomerOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    try {
      const orders = await orderService.getOrders(user);
      const filtered = orders.filter(o => o.customerId === customer.id);
      setCustomerOrders(filtered);
    } catch (error) {
      console.error("Error loading customer orders:", error);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateNotes = async () => {
    if (!user) return;
    try {
      await onUpdateNotes(customerNotes);
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    if (!customerTags.includes(newTag.trim())) {
      setCustomerTags([...customerTags, newTag.trim()]);
    }
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    setCustomerTags(customerTags.filter(t => t !== tag));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 p-8 overflow-y-auto flex items-start justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl my-8 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-[#e2e8f0] flex justify-between items-center bg-gradient-to-r from-[#f8fafc] to-white">
          <div className="flex items-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getColorFromString(customer.name)} flex items-center justify-center text-3xl font-bold text-white`}>
              {getInitials(customer.name)}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold mb-1">{customer.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
            <div className="flex flex-col gap-4">
              <div className="bg-[#f8fafc] rounded-2xl p-5">
                <button onClick={() => onSendWhatsApp(customer.phone)} className="w-full py-3 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold flex items-center justify-center gap-2 mb-3">
                  <i className="fab fa-whatsapp"></i>Send WhatsApp
                </button>
                <button onClick={() => customer.email && window.open(`mailto:${customer.email}`)} className="w-full py-3 bg-[#f1f5f9] text-[#1e293b] rounded-xl font-bold border-2 border-[#e2e8f0] flex items-center justify-center gap-2">
                  <i className="fas fa-envelope"></i>Send Email
                </button>
                <button onClick={onDelete} className="w-full py-3 bg-[rgba(239,68,68,0.1)] text-[#ef4444] rounded-xl font-bold border-2 border-[#ef4444] flex items-center justify-center gap-2 mt-2">
                  <i className="fas fa-trash"></i>Delete
                </button>
                <div className="mt-4 pt-4 border-t border-[#e2e8f0] space-y-3">
                  <div><div className="text-xs text-[#64748b]">Phone</div><div className="font-bold">{customer.phone}</div></div>
                  <div><div className="text-xs text-[#64748b]">Email</div><div className="font-bold">{customer.email || "N/A"}</div></div>
                  <div><div className="text-xs text-[#64748b]">Location</div><div className="font-bold">{customer.location || "N/A"}</div></div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-[#e2e8f0]">
                <h4 className="font-bold mb-3">Customer Notes</h4>
                <textarea 
                  className="w-full bg-[#f8fafc] p-3 rounded-xl text-sm text-[#64748b] mb-3 resize-none min-h-[80px] focus:outline-none focus:border-[#25D366] border border-[#e2e8f0]"
                  placeholder="Add notes about this customer..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                ></textarea>
                <button onClick={handleUpdateNotes} className="w-full py-2 border-2 border-[#e2e8f0] rounded-xl font-semibold text-sm hover:border-[#25D366]">
                  <i className="fas fa-save mr-2"></i>Save Note
                </button>
              </div>
            </div>

            <div>
              <div className="flex gap-2 border-b-2 border-[#e2e8f0] mb-4">
                {["orders", "messages", "activity", "preferences"].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-3 font-bold capitalize ${activeTab === tab ? "text-[#25D366] border-b-2 border-[#25D366]" : "text-[#64748b]"}`}>{tab}</button>
                ))}
              </div>

              {activeTab === "orders" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">{customer.visits || 0} Visits • {formatCurrency(customer.totalSpent || 0)} Total</h3>
                  </div>
                  {loadingOrders ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-[#25D366]/30 border-t-[#25D366] rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : customerOrders.length === 0 ? (
                    <p className="text-[#64748b]">No orders found for this customer</p>
                  ) : (
                    <div className="space-y-2">
                      {customerOrders.map(order => (
                        <div key={order.id} className="flex justify-between items-center p-3 bg-[#f8fafc] rounded-xl">
                          <div>
                            <div className="font-semibold text-sm">Order #{order.id.substring(0, 8)}</div>
                            <div className="text-xs text-[#64748b]">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : "N/A"}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatCurrency(order.total)}</div>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${order.status === "pending" ? "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]" : order.status === "processing" ? "bg-[rgba(59,130,246,0.1)] text-[#3b82f6]" : order.status === "delivered" ? "bg-[rgba(37,211,102,0.1)] text-[#10b981]" : "bg-[rgba(239,68,68,0.1)] text-[#ef4444]"}`}>{order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "messages" && (
                <div className="bg-[#f8fafc] rounded-2xl p-8 text-center">
                  <i className="fab fa-whatsapp text-5xl text-[#25D366] mb-4"></i>
                  <h3 className="font-bold mb-2">WhatsApp Chat History</h3>
                  <p className="text-[#64748b] mb-4">View all WhatsApp conversations with this customer</p>
                  <button onClick={() => onSendWhatsApp(customer.phone)} className="px-4 py-2 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl font-bold"><i className="fab fa-whatsapp mr-2"></i>Open Chat</button>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f8fafc]">
                    <div className="w-10 h-10 rounded-full bg-[rgba(37,211,102,0.1)] text-[#25D366] flex items-center justify-center"><i className="fas fa-user-plus"></i></div>
                    <div><div className="font-semibold">Customer created</div><div className="text-xs text-[#64748b]">Customer added to system</div></div>
                  </div>
                </div>
              )}

              {activeTab === "preferences" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#f8fafc] p-4 rounded-xl">
                    <h4 className="font-bold mb-3"><i className="fas fa-tags text-[#ef4444] mr-2"></i>Tags</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {customerTags.map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-[#f1f5f9] rounded-full text-xs font-semibold text-[#64748b] flex items-center gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="ml-1 hover:text-[#ef4444]"><i className="fas fa-times"></i></button>
                        </span>
                      ))}
                      {customerTags.length === 0 && <span className="text-sm text-[#64748b]">No tags</span>}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && addTag()}
                        className="flex-1 px-3 py-2 border border-[#e2e8f0] rounded-lg text-sm"
                        placeholder="Add tag..."
                      />
                      <button onClick={addTag} className="px-3 py-2 bg-[#25D366] text-white rounded-lg text-sm">
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
