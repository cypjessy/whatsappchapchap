"use client";

import { useState, useEffect } from "react";
import { useMode } from "@/context/ModeContext";
import { useAuth } from "@/context/AuthContext";
import { clientService, Client } from "@/lib/db";
import AddClientModal from "./components/AddClientModal";
import EditClientModal from "./components/EditClientModal";
import { sendEvolutionWhatsAppMessage } from "@/utils/sendWhatsApp";

export default function ClientsPage() {
  const { mode } = useMode();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "info">("info");

  useEffect(() => {
    if (mode === "service" && user) {
      loadClients();
    }
  }, [mode, user, statusFilter]);

  const loadClients = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await clientService.getClients(user, statusFilter);
      setClients(data);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const displayToast = (type: "success" | "info", message: string) => {
    setToastType(type);
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Calculate stats
  const totalClients = clients.length;
  const newClients = clients.filter(c => c.status === "new").length;
  const returningRate = totalClients > 0 ? Math.round(((totalClients - newClients) / totalClients) * 100) : 0;
  const lifetimeValue = totalClients > 0 ? Math.round(clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / totalClients) : 0;

  // Filter and sort clients
  const filteredClients = clients
    .filter(client => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          client.name.toLowerCase().includes(query) ||
          client.phone.toLowerCase().includes(query) ||
          (client.email && client.email.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.createdAt?.toDate()).getTime() - new Date(a.createdAt?.toDate()).getTime();
        case "visits":
          return (b.visits || 0) - (a.visits || 0);
        case "spent":
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleClientCreated = () => {
    loadClients();
    displayToast("success", "Client added successfully!");
  };

  const handleClientUpdated = () => {
    loadClients();
    displayToast("success", "Client updated successfully!");
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!user) return;
    try {
      await clientService.deleteClient(user, clientId);
      loadClients();
      setShowDeleteConfirm(null);
      setBulkSelected(bulkSelected.filter(id => id !== clientId));
      displayToast("success", "Client deleted successfully!");
    } catch (error) {
      console.error("Error deleting client:", error);
      alert("Failed to delete client");
    }
  };

  const whatsappClient = async (client: Client) => {
    const message = `Hello ${client.name},\n\nThis is a message from our team. How can we help you today?`;
    
    try {
      if (user) {
        await sendEvolutionWhatsAppMessage(client.phone, message, `tenant_${user.uid}`);
        displayToast("success", `Opening WhatsApp chat with ${client.name}...`);
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      window.open(`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const callClient = (client: Client) => {
    window.location.href = `tel:${client.phone}`;
    displayToast("info", `Calling ${client.name}...`);
  };

  const toggleBulkSelect = (clientId: string) => {
    if (bulkSelected.includes(clientId)) {
      setBulkSelected(bulkSelected.filter(id => id !== clientId));
    } else {
      setBulkSelected([...bulkSelected, clientId]);
    }
  };

  const selectAllClients = () => {
    if (bulkSelected.length === filteredClients.length) {
      setBulkSelected([]);
    } else {
      setBulkSelected(filteredClients.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!user || bulkSelected.length === 0) return;
    try {
      await Promise.all(bulkSelected.map(id => clientService.deleteClient(user, id)));
      loadClients();
      setBulkSelected([]);
      setBulkMode(false);
      displayToast("success", `${bulkSelected.length} clients deleted!`);
    } catch (error) {
      console.error("Error deleting clients:", error);
      alert("Failed to delete some clients");
    }
  };

  const handleBulkMessage = async () => {
    if (bulkSelected.length === 0) return;
    const selectedClients = clients.filter(c => bulkSelected.includes(c.id));
    for (const client of selectedClients) {
      await whatsappClient(client);
    }
    setBulkSelected([]);
    setBulkMode(false);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Location', 'Status', 'Visits', 'Total Spent', 'Rating', 'Last Visit'];
    const rows = filteredClients.map(c => [
      c.name,
      c.phone,
      c.email || '',
      c.location || '',
      c.status,
      c.visits || 0,
      c.totalSpent || 0,
      c.rating || 0,
      c.lastVisit || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    displayToast("success", "Clients exported to CSV!");
  };

  if (mode !== "service") {
    return (
      <div className="p-4 md:p-6 text-center">
        <p className="text-[#64748b]">Switch to Service Mode to view clients</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 animate-fadeIn">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-[#1e293b] flex items-center gap-2">
          <i className="fas fa-users text-[#8b5cf6]"></i>
          My Clients
        </h1>
        <p className="text-[#64748b] text-sm mt-1">Manage your client relationships and history</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 md:p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-1">Total Clients</h3>
              <div className="text-2xl md:text-3xl font-extrabold text-[#1e293b]">{totalClients}</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981] mt-1">
                <i className="fas fa-users"></i> All time
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[#8b5cf6]">
              <i className="fas fa-users"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 md:p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-1">New Clients</h3>
              <div className="text-2xl md:text-3xl font-extrabold text-[#1e293b]">{newClients}</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981] mt-1">
                <i className="fas fa-user-plus"></i> First-timers
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(37,211,102,0.1)] flex items-center justify-center text-[#25D366]">
              <i className="fas fa-user-plus"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 md:p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-1">Returning</h3>
              <div className="text-2xl md:text-3xl font-extrabold text-[#1e293b]">{returningRate}%</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981] mt-1">
                <i className="fas fa-check"></i> Retention rate
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center text-[#3b82f6]">
              <i className="fas fa-redo"></i>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 md:p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wide mb-1">Lifetime Value</h3>
              <div className="text-2xl md:text-3xl font-extrabold text-[#1e293b]">${lifetimeValue}</div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#10b981] mt-1">
                <i className="fas fa-coins"></i> Average
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center text-[#f59e0b]">
              <i className="fas fa-coins"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]"></i>
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:border-[#8b5cf6] focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 border-2 border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] focus:outline-none focus:border-[#8b5cf6]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="new">New</option>
              <option value="vip">VIP</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 border-2 border-[#e2e8f0] rounded-lg text-sm bg-[#f8fafc] focus:outline-none focus:border-[#8b5cf6]"
            >
              <option value="recent">Most Recent</option>
              <option value="visits">Most Visits</option>
              <option value="spent">Most Spent</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 mb-5 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`px-4 py-2 border-2 rounded-lg font-semibold text-sm transition-all ${
              bulkMode
                ? "border-[#8b5cf6] text-[#8b5cf6] bg-[rgba(139,92,246,0.05)]"
                : "border-[#e2e8f0] text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            }`}
          >
            <i className="fas fa-check-square mr-2"></i>
            {bulkMode ? "Exit Bulk Mode" : "Bulk Actions"}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border-2 border-[#e2e8f0] rounded-lg font-semibold text-sm text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
          >
            <i className="fas fa-download mr-2"></i>
            Export CSV
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadClients}
            className="w-9 h-9 border-2 border-[#e2e8f0] rounded-lg flex items-center justify-center text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          >
            <i className="fas fa-sync-alt"></i>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-lg font-bold text-sm shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            Add Client
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {bulkMode && bulkSelected.length > 0 && (
        <div className="bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold">{bulkSelected.length} selected</span>
            <button onClick={selectAllClients} className="text-sm underline hover:no-underline">
              {bulkSelected.length === filteredClients.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkMessage}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold"
            >
              <i className="fab fa-whatsapp mr-1"></i> Message
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 bg-[#ef4444] rounded-lg hover:bg-[#dc2626] transition-all text-sm font-semibold"
            >
              <i className="fas fa-trash mr-1"></i> Delete
            </button>
            <button
              onClick={() => { setBulkMode(false); setBulkSelected([]); }}
              className="px-3 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-sm font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Clients Grid */}
      {loading ? (
        <div className="text-center py-12">
          <i className="fas fa-spinner fa-spin text-4xl text-[#8b5cf6] mb-4"></i>
          <p className="text-[#64748b]">Loading clients...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-12">
          <i className="fas fa-users text-6xl text-[#e2e8f0] mb-4"></i>
          <h3 className="text-xl font-bold text-[#64748b] mb-2">No clients found</h3>
          <p className="text-[#64748b] mb-4">
            {searchQuery || statusFilter !== "all" ? "Try adjusting your filters" : "Start by adding your first client"}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm hover:shadow-md hover:border-[#8b5cf6] transition-all hover:translate-y-[-2px]"
            >
              {bulkMode && (
                <div className="mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bulkSelected.includes(client.id)}
                      onChange={() => toggleBulkSelect(client.id)}
                      className="w-4 h-4 rounded border-[#e2e8f0] text-[#8b5cf6] focus:ring-[#8b5cf6]"
                    />
                    <span className="text-sm text-[#64748b]">Select</span>
                  </label>
                </div>
              )}
              
              <div
                onClick={() => !bulkMode && setSelectedClient(client)}
                className={!bulkMode ? "cursor-pointer" : ""}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shrink-0 ${client.verified ? "relative" : ""}`}
                    style={{ background: client.avatarGradient || "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)", color: client.avatarText || "#7c3aed" }}
                  >
                    {client.initials}
                    {client.verified && (
                      <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#10b981] rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#1e293b] truncate">{client.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase shrink-0 ${
                          client.status === "vip"
                            ? "bg-[rgba(245,158,11,0.1)] text-[#f59e0b]"
                            : client.status === "new"
                            ? "bg-[rgba(139,92,246,0.1)] text-[#8b5cf6]"
                            : client.status === "inactive"
                            ? "bg-[rgba(100,116,139,0.1)] text-[#64748b]"
                            : "bg-[rgba(37,211,102,0.1)] text-[#10b981]"
                        }`}
                      >
                        {client.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#64748b]">
                      <i className="fab fa-whatsapp text-[#25D366]"></i>
                      {client.phone}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 p-3 bg-[#f8fafc] rounded-lg mb-4">
                  <div className="text-center">
                    <div className="font-extrabold text-[#1e293b] text-lg">{client.visits || 0}</div>
                    <div className="text-xs text-[#64748b] uppercase tracking-wide">Visits</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-[#1e293b] text-lg">${client.totalSpent || 0}</div>
                    <div className="text-xs text-[#64748b] uppercase tracking-wide">Total Spent</div>
                  </div>
                  <div className="text-center">
                    <div className="font-extrabold text-[#1e293b] text-lg">{client.rating || "-"}</div>
                    <div className="text-xs text-[#64748b] uppercase tracking-wide">Rating</div>
                  </div>
                </div>

                {client.services && client.services.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {client.services.slice(0, 3).map((service) => (
                      <span
                        key={service}
                        className="px-3 py-1 bg-[#f8fafc] rounded-full text-sm font-semibold text-[#64748b] border border-[#e2e8f0]"
                      >
                        {service}
                      </span>
                    ))}
                    {client.services.length > 3 && (
                      <span className="px-3 py-1 bg-[#f8fafc] rounded-full text-sm font-semibold text-[#64748b] border border-[#e2e8f0]">
                        +{client.services.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-[#e2e8f0]">
                  <span className="text-sm text-[#64748b]">
                    <i className="far fa-clock mr-1"></i>
                    Last visit: {client.lastVisit || "Never"}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        whatsappClient(client);
                      }}
                      className="w-10 h-10 rounded-lg bg-[rgba(37,211,102,0.1)] flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all shadow-sm"
                    >
                      <i className="fab fa-whatsapp text-base"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClient(client);
                        setShowEditModal(true);
                      }}
                      className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center text-[#3b82f6] hover:bg-[#3b82f6] hover:text-white transition-all shadow-sm"
                    >
                      <i className="fas fa-edit text-base"></i>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        callClient(client);
                      }}
                      className="w-10 h-10 rounded-lg bg-[#f5f3ff] flex items-center justify-center text-[#8b5cf6] hover:bg-[#8b5cf6] hover:text-white transition-all shadow-sm"
                    >
                      <i className="fas fa-phone text-base"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile: Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white flex items-center justify-center text-2xl shadow-lg z-50"
      >
        <i className="fas fa-plus"></i>
      </button>

      {/* Client Detail Modal */}
      {selectedClient && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] p-4 overflow-y-auto flex items-start justify-center"
          onClick={() => setSelectedClient(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-xl my-4 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-gradient-to-r from-[rgba(139,92,246,0.05)] to-[rgba(124,58,237,0.05)]">
              <h2 className="text-xl font-extrabold text-[#1e293b] flex items-center gap-2">
                <i className="fas fa-user-circle text-[#8b5cf6]"></i>
                Client Profile
              </h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="w-9 h-9 rounded-full bg-[#f8fafc] flex items-center justify-center text-[#64748b] hover:bg-[#ef4444] hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#e2e8f0]">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-extrabold text-3xl"
                  style={{ background: selectedClient.avatarGradient || "linear-gradient(135deg, #ede9fe 0%, #e0e7ff 100%)", color: selectedClient.avatarText || "#7c3aed" }}
                >
                  {selectedClient.initials}
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#1e293b] mb-2">{selectedClient.name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-[#64748b]">
                    <span>
                      <i className="fas fa-star text-[#f59e0b] mr-1"></i>
                      {selectedClient.rating || "-"} rating
                    </span>
                    <span>
                      <i className="fas fa-calendar-check mr-1"></i>
                      {selectedClient.visits || 0} visits
                    </span>
                    {selectedClient.status === "vip" && (
                      <span>
                        <i className="fas fa-crown text-[#f59e0b] mr-1"></i>
                        VIP Client
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                  <i className="fas fa-address-card"></i>
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">Phone</div>
                    <div className="font-bold text-sm">
                      <i className="fab fa-whatsapp text-[#25D366] mr-1"></i>
                      {selectedClient.phone}
                    </div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">Email</div>
                    <div className="font-bold text-sm">{selectedClient.email || "N/A"}</div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">Location</div>
                    <div className="font-bold text-sm">{selectedClient.location || "N/A"}</div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">Preferred Style</div>
                    <div className="font-bold text-sm">{selectedClient.preferredStyle || "N/A"}</div>
                  </div>
                </div>
              </div>

              {selectedClient.notes && (
                <div className="mb-5">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                    <i className="fas fa-sticky-note"></i>
                    Client Notes
                  </h4>
                  <div className="p-4 bg-[#f8fafc] rounded-lg border-l-4 border-[#8b5cf6]">
                    <p className="text-sm text-[#64748b] leading-relaxed">{selectedClient.notes}</p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-[#64748b] mb-3 flex items-center gap-2">
                  <i className="fas fa-chart-bar"></i>
                  Client Analytics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">First Visit</div>
                    <div className="font-bold text-sm">{selectedClient.firstVisit || "N/A"}</div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">Avg. Booking Gap</div>
                    <div className="font-bold text-sm">{selectedClient.avgGap || "N/A"}</div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">Favorite Service</div>
                    <div className="font-bold text-sm">{selectedClient.favoriteService || "N/A"}</div>
                  </div>
                  <div className="p-3 bg-[#f8fafc] rounded-lg">
                    <div className="text-xs text-[#64748b] mb-1">Referrals Made</div>
                    <div className="font-bold text-sm">{selectedClient.referrals || 0}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#e2e8f0] flex gap-3 justify-end bg-[#f8fafc]">
              <button
                onClick={() => whatsappClient(selectedClient)}
                className="px-4 py-2 bg-[#f8fafc] text-[#1e293b] border-2 border-[#e2e8f0] rounded-lg font-bold text-sm hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors flex items-center gap-2"
              >
                <i className="fab fa-whatsapp"></i>
                Message
              </button>
              <button
                onClick={() => {
                  setSelectedClient(null);
                  setEditingClient(selectedClient);
                  setShowEditModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white rounded-lg font-bold text-sm shadow-md flex items-center gap-2"
              >
                <i className="fas fa-edit"></i>
                Edit Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-3xl text-[#ef4444]"></i>
              </div>
              <h3 className="text-xl font-bold text-[#1e293b] mb-2">Delete Client?</h3>
              <p className="text-[#64748b]">This action cannot be undone. Are you sure you want to delete this client?</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 border-2 border-[#e2e8f0] rounded-xl font-bold text-[#64748b] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClient(showDeleteConfirm)}
                className="flex-1 px-4 py-3 bg-[#ef4444] text-white rounded-xl font-bold hover:bg-[#dc2626] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      <AddClientModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onClientCreated={handleClientCreated}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        open={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingClient(null); }}
        client={editingClient}
        onClientUpdated={handleClientUpdated}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[3000] bg-[#0f172a] text-white px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 min-w-[280px] animate-fadeIn">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center ${
              toastType === "success" ? "bg-[#10b981]/20 text-[#10b981]" : "bg-[#3b82f6]/20 text-[#3b82f6]"
            }`}
          >
            <i className={`fas fa-${toastType === "success" ? "check-circle" : "info-circle"}`}></i>
          </div>
          <div className="flex-1 text-sm">{toastMessage}</div>
          <button onClick={() => setShowToast(false)} className="text-white/70 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
}
