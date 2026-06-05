"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import AdminProtection from "@/components/AdminProtection";
import AddTenantDialog from "@/components/AddTenantDialog";
import { adminService, Tenant, pricingPlanService, PricingPlan } from "@/lib/db";
import { collection, onSnapshot, query, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import IntegrationsTab from "@/components/IntegrationsTab";
import ConnectionTestTab from "@/components/ConnectionTestTab";
import PageHeaderCard from "@/components/PageHeaderCard";

// Toast type
interface Toast {
  id: number;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

// Plan badges
const planBadges: Record<string, React.ReactNode> = {
  free: <span className="badge badge-free"><i className="fas fa-seedling"></i> Free</span>,
  starter: <span className="badge badge-starter"><i className="fas fa-rocket"></i> Starter</span>,
  pro: <span className="badge badge-pro"><i className="fas fa-star"></i> Pro</span>,
  enterprise: <span className="badge badge-enterprise"><i className="fas fa-crown"></i> Enterprise</span>,
};

// Category badges
const catBadges: Record<string, React.ReactNode> = {
  products: <span className="badge badge-products"><i className="fas fa-box"></i> Products</span>,
  services: <span className="badge badge-services"><i className="fas fa-tools"></i> Services</span>,
  both: <span className="badge badge-both"><i className="fas fa-layer-group"></i> Both</span>,
};

// Status pills
const statusPills: Record<string, React.ReactNode> = {
  active: <span className="status-pill status-active"><span className="pulse pulse-green"></span>Active</span>,
  pending: <span className="status-pill status-pending"><span className="pulse pulse-orange"></span>Pending</span>,
  suspended: <span className="status-pill status-suspended"><span className="pulse pulse-red"></span>Suspended</span>,
};

// Helper function to format relative time
function formatRelativeTime(timestamp: any): string {
  if (!timestamp) return "Never";

  let date: Date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

// ─── Trial Badge Component ───────────────────────────────────────────────────
function TrialBadge({ trialEndsAt, trialDays }: { trialEndsAt: any; trialDays?: number }) {
  if (!trialEndsAt) return null;
  try {
    const endDate = trialEndsAt.toDate ? trialEndsAt.toDate() : new Date(trialEndsAt);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return (
        <span className="badge badge-status-expired" style={{ fontSize: "10px", padding: "1px 6px" }}>
          <i className="fas fa-clock" style={{ marginRight: "2px" }}></i>Trial ended
        </span>
      );
    }
    if (diffDays <= 3) {
      return (
        <span className="badge" style={{ fontSize: "10px", padding: "1px 6px", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>
          <i className="fas fa-hourglass-half" style={{ marginRight: "2px" }}></i>{diffDays}d left
        </span>
      );
    }
    return (
      <span className="badge" style={{ fontSize: "10px", padding: "1px 6px", background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0" }}>
        <i className="fas fa-seedling" style={{ marginRight: "2px" }}></i>{diffDays}d trial
      </span>
    );
  } catch {
    return null;
  }
}

export default function AllTenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [activeTab, setActiveTab] = useState("");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [activeModalTab, setActiveModalTab] = useState("overview");
  const [activeMainTab, setActiveMainTab] = useState<"tenants" | "plans" | "diagnostics" | "connection-test" | "settings">("tenants");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState({
    businessName: "",
    name: "",
    email: "",
    phone: "",
    plan: "free" as "free" | "starter" | "pro" | "enterprise",
    status: "pending" as "active" | "suspended" | "pending",
    category: "products" as "products" | "services" | "both",
    country: "",
    trialDays: 14,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tenantNotes, setTenantNotes] = useState("");
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; action: string; details: string; metadata?: Record<string, any>; createdAt: any }>>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [tenantStats, setTenantStats] = useState<{
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    pendingOrders: number;
    completedOrders: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [planEditModalOpen, setPlanEditModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: "",
    price: 0,
    description: "",
    isActive: true,
    isPopular: false,
  });
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false);
  const [createPlanForm, setCreatePlanForm] = useState({
    name: "",
    slug: "",
    price: 0,
    description: "",
    isActive: true,
    isPopular: false,
    features: [
      { name: "Products", included: true, limit: "10" },
      { name: "Messages per month", included: true, limit: "100" },
      { name: "AI Assistant", included: false },
      { name: "Analytics", included: false },
      { name: "API Access", included: false },
      { name: "Priority Support", included: false },
    ],
  });

  const [platformSettings, setPlatformSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    defaultPlan: "free" as "free" | "starter" | "pro" | "enterprise",
    platformFeePercent: 0,
    defaultCurrency: "KSh",
    newTenantStatus: "pending" as "active" | "pending" | "suspended",
  });

  // Bulk plan change modal state
  const [bulkPlanModalOpen, setBulkPlanModalOpen] = useState(false);
  const [bulkPlanTarget, setBulkPlanTarget] = useState<"free" | "starter" | "pro" | "enterprise">("free");
  const [showMobileFilterSheet, setShowMobileFilterSheet] = useState(false);
  const [mobileFilterStatus, setMobileFilterStatus] = useState("");
  const [mobileFilterPlan, setMobileFilterPlan] = useState("");
  const [mobileFilterTab, setMobileFilterTab] = useState("");

  // Fetch tenants from Firebase
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "tenants"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTenants = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Determine last active timestamp
        const lastActive = data.lastActive || data.lastLoginAt || data.updatedAt || data.createdAt;
        return {
          id: doc.id,
          ...data,
          userId: data.userId || "",
          name: data.name || data.businessName || "Unnamed",
          owner: data.ownerName || data.name || "Unknown",
          phone: data.phone || "",
          initials: (data.name || data.businessName || "U").substring(0, 2).toUpperCase(),
          grad: "grad-1",
          cat: (data.businessType as "products" | "services" | "both") || "both",
          rev: 0,
          status: (data.status as "active" | "pending" | "suspended") || "pending",
          last: formatRelativeTime(lastActive),
          lastActive: lastActive,
          online: data.online || false,
        };
      }) as unknown as Tenant[];
      setTenants(fetchedTenants);
      setFilteredTenants(fetchedTenants);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching tenants:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch pricing plans from Firebase
  useEffect(() => {
    const unsubscribe = pricingPlanService.subscribeToPlans((plans) => {
      setPricingPlans(plans);
    });
    return () => unsubscribe();
  }, []);

  // Toast helper
  const showToast = useCallback((type: Toast["type"], title: string, message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  // Filter tenants
  useEffect(() => {
    let filtered = tenants;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.owner || "").toLowerCase().includes(q) ||
          (t.email || "").toLowerCase().includes(q) ||
          (t.phone || "").includes(q)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }
    if (planFilter) {
      filtered = filtered.filter((t) => t.plan === planFilter);
    }
    setFilteredTenants(filtered);
  }, [searchQuery, statusFilter, planFilter, tenants]);

  // Handle row selection
  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Toggle all rows
  const toggleAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredTenants.map((t) => t.id as string));
    }
    setSelectAll(!selectAll);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRows([]);
    setSelectAll(false);
  };

  // Bulk action
  const bulkAction = async (action: string) => {
    try {
      if (action === "suspend") {
        for (const id of selectedRows) {
          await adminService.updateTenantStatus(id, "suspended");
        }
      } else if (action === "activate") {
        for (const id of selectedRows) {
          await adminService.updateTenantStatus(id, "active");
        }
      }
      showToast("success", "Success", `${selectedRows.length} tenant(s) ${action} successfully.`);
      clearSelection();
    } catch (error) {
      showToast("error", "Error", "Failed to perform bulk action.");
    }
  };

  // Activate/Deactivate single tenant
  const toggleTenantStatus = async (tenant: Tenant) => {
    try {
      const newStatus = tenant.status === "active" ? "suspended" : "active";
      await adminService.updateTenantStatus(tenant.id, newStatus);
      // Log activity for audit trail — ensures lockout/activation is fully effective
      await adminService.addActivityLog(tenant.id, {
        action: newStatus === "suspended" ? "Account Locked" : "Account Activated",
        details: `Admin ${newStatus === "suspended" ? "locked out" : "activated"} this account`,
        metadata: { previousStatus: tenant.status, newStatus, adminAction: "toggle_status" },
      });
      showToast("success", "Status Updated", `${tenant.name} is now ${newStatus}.`);
    } catch (error) {
      showToast("error", "Error", "Failed to update tenant status.");
    }
  };

  // Open modal
  const openModal = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setModalOpen(true);
    setActiveModalTab("overview");
    setTenantNotes("");
    setTenantStats(null);
    setLoadingLogs(true);
    setLoadingStats(true);

    try {
      const [logs, stats] = await Promise.all([
        adminService.getActivityLogs(tenant.id),
        adminService.getTenantDetailedStats(tenant.id),
      ]);
      setActivityLogs(logs);
      setTenantStats(stats);
    } catch (error) {
      console.error("Failed to load tenant data:", error);
      setActivityLogs([]);
      setTenantStats({
        totalOrders: 0,
        totalCustomers: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
      });
    } finally {
      setLoadingLogs(false);
      setLoadingStats(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedTenant(null);
    setActivityLogs([]);
  };

  // Open edit modal
  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setEditForm({
      businessName: tenant.businessName || tenant.name || "",
      name: tenant.name || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      plan: tenant.plan || "free",
      status: (tenant.status || "pending") as "active" | "suspended" | "pending",
      category: (tenant.category || tenant.businessType || "products") as "products" | "services" | "both",
      country: tenant.country || "",
      trialDays: tenant.trialDays || 14,
    });
    setEditModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingTenant(null);
  };

  // Save tenant edit
  const saveTenantEdit = async () => {
    if (!editingTenant) return;
    try {
      const planChanged = editForm.plan !== editingTenant.plan;

      const updateData: any = {
        businessName: editForm.businessName,
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        status: editForm.status,
        category: editForm.category,
        businessType: editForm.category,
        country: editForm.country,
      };

      // Only include plan when it actually changed — prevents planStartedAt from resetting on unrelated edits
      if (planChanged) {
        updateData.plan = editForm.plan;
      }

      // If plan is free and trialDays is set, set up the free trial
      if (editForm.plan === "free" && editForm.trialDays > 0) {
        await adminService.setTenantFreeTrial(editingTenant.id, editForm.trialDays);
        // Override status update since setTenantFreeTrial sets status to active
        if (editForm.status !== "active") {
          await adminService.updateTenantStatus(editingTenant.id, editForm.status);
        }
      } else {
        // Clear trial data if switching away from free plan
        if (editingTenant.plan === "free" && editForm.plan !== "free") {
          updateData.trialDays = null;
          updateData.trialEndsAt = null;
        }
        await adminService.updateTenant(editingTenant.id, updateData);
      }

      await adminService.addActivityLog(editingTenant.id, {
        action: "Tenant Updated",
        details: `Admin updated tenant information`,
        metadata: { adminAction: "edit", fieldsChanged: Object.keys(editForm) },
      });
      showToast("success", "Updated", `${editForm.businessName} has been updated.`);
      closeEditModal();
    } catch (error) {
      showToast("error", "Error", "Failed to update tenant.");
    }
  };

  // Export CSV
  const exportCSV = () => {
    const csv = adminService.exportTenantsToCSV(filteredTenants);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tenants_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Exported", `CSV exported with ${filteredTenants.length} tenants.`);
  };

  // Upgrade/Downgrade plan
  const changePlan = async (tenant: Tenant, newPlan: "free" | "starter" | "pro" | "enterprise") => {
    try {
      await adminService.updateTenantPlan(tenant.id, newPlan);
      await adminService.addActivityLog(tenant.id, {
        action: "Plan Changed",
        details: `Plan changed from ${tenant.plan} to ${newPlan}`,
        metadata: { previousPlan: tenant.plan, newPlan },
      });
      showToast("success", "Plan Updated", `${tenant.name} is now on ${newPlan} plan.`);
    } catch (error) {
      showToast("error", "Error", "Failed to change plan.");
    }
  };

  // Save admin note
  const saveAdminNote = async () => {
    if (!selectedTenant || !tenantNotes.trim()) return;
    try {
      await adminService.addTenantNote(selectedTenant.id, tenantNotes, "admin");
      await adminService.addActivityLog(selectedTenant.id, {
        action: "Admin Note Added",
        details: "Admin added a note",
      });
      showToast("success", "Note Saved", "Admin note saved successfully.");
      setTenantNotes("");
    } catch (error) {
      showToast("error", "Error", "Failed to save note.");
    }
  };

  // Bulk change plan
  const bulkChangePlan = async () => {
    if (selectedRows.length === 0) return;
    try {
      for (const id of selectedRows) {
        await adminService.updateTenantPlan(id, bulkPlanTarget);
        await adminService.addActivityLog(id, {
          action: "Bulk Plan Change",
          details: `Plan changed to ${bulkPlanTarget} via bulk action`,
          metadata: { adminAction: "bulk_plan_change", newPlan: bulkPlanTarget },
        });
      }
      showToast("success", "Plans Updated", `${selectedRows.length} tenant(s) changed to ${bulkPlanTarget} plan.`);
      setBulkPlanModalOpen(false);
      clearSelection();
    } catch (error) {
      showToast("error", "Error", "Failed to change plans.");
    }
  };

  // Bulk delete
  const bulkDelete = async () => {
    if (selectedRows.length === 0) return;
    const confirmed = confirm(`Delete ${selectedRows.length} tenant(s)? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      for (const id of selectedRows) {
        await adminService.deleteTenant(id);
      }
      showToast("success", "Deleted", `${selectedRows.length} tenant(s) permanently deleted.`);
      clearSelection();
    } catch (error) {
      showToast("error", "Error", "Failed to delete tenants.");
    }
  };

  // Bulk send message (placeholder)
  const bulkSendMessage = () => {
    showToast("info", "Broadcast", `Messaging ${selectedRows.length} tenant(s)... Feature coming soon.`);
  };

  // Bulk export
  const bulkExport = () => {
    const selectedTenants = tenants.filter(t => selectedRows.includes(t.id));
    const csv = adminService.exportTenantsToCSV(selectedTenants);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tenants_bulk_export_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Exported", `CSV exported for ${selectedTenants.length} tenant(s).`);
    clearSelection();
  };

  // Save platform settings
  const savePlatformSettings = async () => {
    try {
      // Persist platform settings to Firestore
      await setDoc(doc(db, "platformSettings", "global"), {
        ...platformSettings,
        updatedAt: serverTimestamp(),
      });
      showToast("success", "Settings Updated", "Platform settings saved successfully.");
    } catch (error) {
      console.error("Error saving platform settings:", error);
      showToast("error", "Error", "Failed to save settings.");
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredTenants.length / rowsPerPage);
  const paginatedTenants = filteredTenants.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Set tab filter
  const setTab = (tab: string, filterType: "status" | "plan") => {
    setActiveTab(tab);
    if (filterType === "status") {
      setStatusFilter(tab);
      setPlanFilter("");
    } else {
      setPlanFilter(tab);
      setStatusFilter("");
    }
  };

  // Delete confirmation
  const confirmDelete = async (name: string, id: string) => {
    if (confirm(`Delete "${name}"? This action cannot be undone.`)) {
      try {
        await adminService.deleteTenant(id);
        showToast("success", "Deleted", `"${name}" has been permanently deleted.`);
      } catch (error) {
        showToast("error", "Error", "Failed to delete tenant.");
      }
    }
  };

  // Open plan edit modal
  const openPlanEditModal = (plan: PricingPlan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      description: plan.description || "",
      isActive: plan.isActive,
      isPopular: plan.isPopular || false,
    });
    setPlanEditModalOpen(true);
  };

  // Close plan edit modal
  const closePlanEditModal = () => {
    setPlanEditModalOpen(false);
    setEditingPlan(null);
  };

  // Save plan changes
  const savePlanChanges = async () => {
    if (!editingPlan) return;
    try {
      await pricingPlanService.updatePlan(editingPlan.id, {
        name: planForm.name,
        price: planForm.price,
        description: planForm.description,
        isActive: planForm.isActive,
        isPopular: planForm.isPopular,
      });
      showToast("success", "Plan Updated", `${planForm.name} has been updated.`);
      closePlanEditModal();
    } catch (error) {
      showToast("error", "Error", "Failed to update pricing plan.");
    }
  };

  // Toggle plan status
  const togglePlanStatus = async (plan: PricingPlan) => {
    try {
      await pricingPlanService.togglePlanStatus(plan.id, !plan.isActive);
      showToast("success", "Status Updated", `${plan.name} is now ${!plan.isActive ? "active" : "inactive"}.`);
    } catch (error) {
      showToast("error", "Error", "Failed to toggle plan status.");
    }
  };

  // Get tenant count for a plan
  const getPlanTenantCount = (planSlug: string) => {
    return tenants.filter((t) => t.plan === planSlug).length;
  };

  // Initialize default pricing plans
  const initializeDefaultPlans = async () => {
    try {
      showToast("info", "Initializing", "Creating default pricing plans...");
      await pricingPlanService.initializeDefaultPlans();
      showToast("success", "Success", "Default pricing plans created.");
    } catch (error) {
      showToast("error", "Error", "Failed to create default plans.");
    }
  };

  // Open create plan modal
  const openCreatePlanModal = () => {
    setCreatePlanForm({
      name: "",
      slug: "",
      price: 0,
      description: "",
      isActive: true,
      isPopular: false,
      features: [
        { name: "Products", included: true, limit: "10" },
        { name: "Messages per month", included: true, limit: "100" },
        { name: "AI Assistant", included: false },
        { name: "Analytics", included: false },
        { name: "API Access", included: false },
        { name: "Priority Support", included: false },
      ],
    });
    setCreatePlanModalOpen(true);
  };

  // Close create plan modal
  const closeCreatePlanModal = () => {
    setCreatePlanModalOpen(false);
  };

  // Save new plan
  const saveNewPlan = async () => {
    try {
      const newPlan = {
        name: createPlanForm.name,
        slug: createPlanForm.slug as "free" | "starter" | "pro" | "enterprise",
        price: createPlanForm.price,
        currency: "KSh",
        billingPeriod: "monthly" as const,
        description: createPlanForm.description,
        features: createPlanForm.features.map(f => ({
          name: f.name,
          included: f.included,
          limit: f.limit ? Number(f.limit) : undefined,
        })),
        limits: {
          products: createPlanForm.features.find(f => f.name === "Products")?.limit ? Number(createPlanForm.features.find(f => f.name === "Products")?.limit) : 10,
          messages: createPlanForm.features.find(f => f.name === "Messages per month")?.limit ? Number(createPlanForm.features.find(f => f.name === "Messages per month")?.limit) : 100,
          aiAssistant: createPlanForm.features.find(f => f.name === "AI Assistant")?.included || false,
          analytics: createPlanForm.features.find(f => f.name === "Analytics")?.included || false,
          apiAccess: createPlanForm.features.find(f => f.name === "API Access")?.included || false,
          prioritySupport: createPlanForm.features.find(f => f.name === "Priority Support")?.included || false,
        },
        isActive: createPlanForm.isActive,
        isPopular: createPlanForm.isPopular,
      };
      await pricingPlanService.createPlan(newPlan);
      showToast("success", "Plan Created", `${createPlanForm.name} has been created.`);
      closeCreatePlanModal();
    } catch (error) {
      showToast("error", "Error", "Failed to create pricing plan.");
    }
  };

  // Stats
  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const totalRevenue = tenants.reduce((sum, t) => sum + (t.rev || 0), 0);
  const pendingApprovals = tenants.filter((t) => t.status === "pending").length;

  // Calculate growth trends (compare current month vs previous month)
  const calculateGrowth = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTenants = tenants.filter(t => {
      if (!t.createdAt) return false;
      const date = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;

    const prevMonthTenants = tenants.filter(t => {
      if (!t.createdAt) return false;
      const date = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    }).length;

    if (prevMonthTenants === 0) return currentMonthTenants > 0 ? 100 : 0;
    return Math.round(((currentMonthTenants - prevMonthTenants) / prevMonthTenants) * 100);
  };

  const tenantGrowth = calculateGrowth();

  return (
    <AdminProtection>
    <div className="all-tenants-page">
      {loading && tenants.length === 0 ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div style={{ textAlign: "center" }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: "32px", color: "var(--primary)" }}></i>
            <p style={{ marginTop: "12px", color: "var(--text-3)" }}>Loading tenants...</p>
          </div>
        </div>
      ) : (
      <>
      <style>{`
        :root {
          --primary: #25D366;
          --primary-dark: #128C7E;
          --primary-light: #d1fae5;
          --primary-xlight: #f0fdf4;
          --bg: #f0f4f8;
          --bg2: #e8eef5;
          --card: #ffffff;
          --border: #e2e8f0;
          --border-light: #f1f5f9;
          --text: #0f172a;
          --text-2: #475569;
          --text-3: #94a3b8;
          --danger: #ef4444;
          --warning: #f59e0b;
          --info: #3b82f6;
          --success: #10b981;
          --purple: #8b5cf6;
          --amber: #f59e0b;
          --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
          --shadow: 0 4px 16px rgba(0,0,0,0.08);
          --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);
          --radius: 16px;
          --radius-sm: 10px;
          --radius-xs: 7px;
          --transition: 0.2s ease;
        }

        .all-tenants-page {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: var(--bg);
          color: var(--text);
          line-height: 1.5;
          font-size: 14px;
          min-height: 100vh;
          padding: 24px;
          max-width: none;
          margin: 0;
        }

        /* Premium Card Base */
        .premium-card {
          background: var(--card);
          border-radius: var(--radius);
          border: 1px solid var(--border-light);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: var(--transition);
        }
        .premium-card:hover {
          box-shadow: var(--shadow);
        }

        /* Gradient Section Headers */
        .section-header-premium {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-bottom: 1px solid #bbf7d0;
          padding: 16px 22px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: var(--transition);
          user-select: none;
        }
        .section-header-premium:hover {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
        }
        .section-header-premium.open {
          border-bottom: 1px solid var(--border-light);
        }

        /* Stats Row */
        .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
        .stat-card {
          background: var(--card); border-radius: var(--radius); padding: 20px 22px;
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          display: flex; align-items: center; justify-content: space-between;
          transition: var(--transition); cursor: default;
        }
        .stat-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
        .stat-info .stat-label { font-size: 12.5px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.6px; }
        .stat-info .stat-val { font-size: 28px; font-weight: 800; color: var(--text); margin-top: 4px; line-height: 1; }
        .stat-info .stat-trend { font-size: 12px; font-weight: 600; margin-top: 6px; display: flex; align-items: center; gap: 4px; }
        .trend-up { color: var(--success); }
        .trend-warn { color: var(--warning); }
        .stat-icon {
          width: 52px; height: 52px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; font-size: 22px;
          flex-shrink: 0;
        }
        .si-green { background: linear-gradient(135deg, #d1fae5, #a7f3d0); color: var(--primary-dark); }
        .si-emerald { background: linear-gradient(135deg, #d1fae5, #6ee7b7); color: #065f46; }
        .si-purple { background: linear-gradient(135deg, #ede9fe, #c4b5fd); color: #5b21b6; }
        .si-orange { background: linear-gradient(135deg, #fef3c7, #fde68a); color: #92400e; }
        .stat-val.revenue { background: linear-gradient(135deg, var(--purple), #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

        /* Toolbar */
        .toolbar {
          background: var(--card); border-radius: var(--radius); padding: 16px 20px;
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; }
        .toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .tb-input-wrap { position: relative; min-width: 240px; }
        .tb-input-wrap i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-3); font-size: 12.5px; }
        .tb-input {
          width: 100%; height: 36px; padding: 0 14px 0 34px;
          border: 1.5px solid var(--border); border-radius: 9px;
          background: var(--bg); font-family: inherit; font-size: 13px; color: var(--text);
          outline: none; transition: var(--transition);
        }
        .tb-input:focus { border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(37,211,102,0.1); }
        select.tb-select {
          height: 36px; padding: 0 28px 0 12px;
          border: 1.5px solid var(--border); border-radius: 9px;
          background: var(--bg) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E") no-repeat right 10px center;
          font-family: inherit; font-size: 13px; color: var(--text);
          outline: none; cursor: pointer; appearance: none; transition: var(--transition);
        }
        select.tb-select:focus { border-color: var(--primary); background-color: white; }

        .btn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 0 16px; height: 36px; border-radius: 9px;
          font-family: inherit; font-size: 13px; font-weight: 600;
          cursor: pointer; border: none; transition: var(--transition); white-space: nowrap;
        }
        .btn-primary {
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white; box-shadow: 0 3px 10px rgba(37,211,102,0.3);
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(37,211,102,0.4); }
        .btn-secondary { background: white; color: var(--text-2); border: 1.5px solid var(--border); }
        .btn-secondary:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-xlight); }
        .btn-icon { padding: 0; width: 36px; }
        .btn-sm { height: 30px; padding: 0 12px; font-size: 12px; }
        .btn-xs { height: 26px; padding: 0 10px; font-size: 11.5px; border-radius: 7px; }

        /* Filter Tabs */
        .filter-tabs {
          display: flex; gap: 6px; margin-bottom: 14px;
          overflow-x: auto; padding-bottom: 2px;
        }
        .filter-tabs::-webkit-scrollbar { height: 3px; }
        .filter-tabs::-webkit-scrollbar-track { background: transparent; }
        .filter-tabs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        .ftab {
          flex-shrink: 0; display: flex; align-items: center; gap: 6px;
          padding: 7px 14px; border-radius: 9px;
          font-size: 12.5px; font-weight: 600; cursor: pointer;
          border: 1.5px solid transparent; background: var(--card);
          color: var(--text-2); transition: var(--transition);
          border-color: var(--border-light);
        }
        .ftab:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-xlight); }
        .ftab.active { background: var(--primary); color: white; border-color: var(--primary); box-shadow: 0 3px 8px rgba(37,211,102,0.25); }
        .ftab .count {
          padding: 1px 6px; border-radius: 20px; font-size: 11px;
          background: rgba(255,255,255,0.25);
        }
        .ftab:not(.active) .count { background: var(--bg2); color: var(--text-3); }
        .dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .dot-green { background: var(--success); }
        .dot-orange { background: var(--warning); }
        .dot-red { background: var(--danger); }

        /* Table Card - Premium */
        .table-card {
          background: var(--card); border-radius: var(--radius);
          border: 1px solid var(--border-light); box-shadow: var(--shadow-sm);
          overflow: hidden; margin-bottom: 16px;
        }
        .table-header {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-bottom: 1px solid #bbf7d0;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .table-header h3 {
          font-size: 14px;
          font-weight: 700;
          color: #065f46;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; min-width: 900px; }
        thead tr { background: var(--bg); border-bottom: 1.5px solid var(--border); }
        thead th {
          padding: 13px 16px; text-align: left;
          font-size: 11.5px; font-weight: 700; color: var(--text-3);
          text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap;
        }
        thead th:first-child { padding-left: 20px; }
        tbody tr {
          border-bottom: 1px solid var(--border-light); transition: var(--transition);
          cursor: pointer;
        }
        tbody tr:nth-child(even) { background: #fafcff; }
        tbody tr:hover { background: var(--primary-xlight); }
        tbody tr.selected { background: #ecfdf5 !important; border-left: 4px solid var(--primary); }
        tbody td { padding: 14px 16px; vertical-align: middle; }
        tbody td:first-child { padding-left: 20px; }
        tbody tr:last-child { border-bottom: none; }

        .cb { width: 16px; height: 16px; cursor: pointer; accent-color: var(--primary); }

        .tenant-info { display: flex; align-items: center; gap: 12px; }
        .t-avatar {
          width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 800; color: white;
        }
        .t-name { font-weight: 700; font-size: 13.5px; color: var(--text); }
        .t-owner { font-size: 12px; color: var(--text-3); margin-top: 1px; }
        .t-phone { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-2); margin-top: 2px; }
        .t-phone i { color: var(--primary); font-size: 11px; }
        .verified { color: var(--info); font-size: 11px; margin-left: 4px; }

        .badge {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 9px; border-radius: 20px; font-size: 11.5px; font-weight: 600;
        }
        .badge-products { background: #d1fae5; color: #065f46; }
        .badge-services { background: #dbeafe; color: #1e40af; }
        .badge-both { background: #ede9fe; color: #5b21b6; }
        .badge-free { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
        .badge-starter { background: #fef3c7; color: #92400e; }
        .badge-pro { background: #dbeafe; color: #1e40af; }
        .badge-enterprise { background: #fae8ff; color: #86198f; }

        .status-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600;
        }
        .status-active { background: #d1fae5; color: #065f46; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-suspended { background: #fee2e2; color: #991b1b; }
        .status-expired { background: #f1f5f9; color: #64748b; }

        .pulse {
          width: 7px; height: 7px; border-radius: 50%;
          animation: pulse-anim 2s infinite;
        }
        .pulse-green { background: var(--success); box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
        .pulse-orange { background: var(--warning); animation: none; }
        .pulse-red { background: var(--danger); animation: none; }
        .pulse-gray { background: #94a3b8; animation: none; }
        @keyframes pulse-anim {
          0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.5); }
          50% { box-shadow: 0 0 0 5px rgba(16,185,129,0); }
        }

        .last-active { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--text-2); }
        .online-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); }

        .revenue-val { font-weight: 700; font-size: 13.5px; color: var(--text); }
        .revenue-zero { color: var(--text-3); font-weight: 500; }

        .actions-cell { display: flex; align-items: center; gap: 4px; }
        .action-btn {
          width: 30px; height: 30px; border-radius: 7px; border: none;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 12px; transition: var(--transition); background: transparent;
          color: var(--text-3);
        }
        .action-btn:hover { transform: scale(1.1); }
        .ab-view:hover { background: #dbeafe; color: var(--info); }
        .ab-edit:hover { background: var(--primary-xlight); color: var(--primary-dark); }
        .ab-wa:hover { background: #d1fae5; color: var(--primary-dark); }
        .ab-suspend:hover { background: #fef3c7; color: var(--warning); }
        .ab-delete:hover { background: #fee2e2; color: var(--danger); }

        /* Bulk Bar */
        .bulk-bar {
          display: none;
          position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
          background: #0f172a; color: white; border-radius: 14px;
          padding: 12px 20px; box-shadow: var(--shadow-lg);
          z-index: 200; align-items: center; gap: 10px;
          min-width: 680px; max-width: 90vw; flex-wrap: wrap;
          animation: slideUp 0.25s ease;
        }
        .bulk-bar.show { display: flex; }
        @keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .bulk-count { font-weight: 700; font-size: 13px; color: #a7f3d0; flex-shrink: 0; padding-right: 8px; border-right: 1px solid rgba(255,255,255,0.1); }
        .bulk-btn {
          padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
          border: none; cursor: pointer; transition: var(--transition); color: white;
        }
        .bb-approve { background: var(--success); }
        .bb-upgrade { background: var(--info); }
        .bb-downgrade { background: #64748b; }
        .bb-msg { background: var(--primary-dark); }
        .bb-export { background: var(--purple); }
        .bb-suspend { background: var(--warning); }
        .bb-delete { background: var(--danger); }
        .bulk-btn:hover { opacity: 0.85; transform: scale(1.03); }
        .bulk-close { margin-left: auto; cursor: pointer; color: #94a3b8; padding: 4px; }
        .bulk-close:hover { color: white; }

        /* Pagination */
        .pagination-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 20px; border-top: 1px solid var(--border-light);
          flex-wrap: wrap; gap: 10px;
        }
        .pag-info { font-size: 12.5px; color: var(--text-3); }
        .pag-controls { display: flex; align-items: center; gap: 5px; }
        .pag-btn {
          min-width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid var(--border);
          background: white; color: var(--text-2); font-family: inherit; font-size: 13px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: var(--transition); font-weight: 600; padding: 0 6px;
        }
        .pag-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-xlight); }
        .pag-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
        .pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .per-page-wrap { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-3); }

        /* Premium Section Body */
        .section-body {
          background: var(--card); border: 1px solid var(--border-light);
          border-top: none; border-radius: 0 0 var(--radius) var(--radius);
          padding: 24px; box-shadow: var(--shadow-sm);
          overflow: hidden; max-height: 0; opacity: 0;
          transition: max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease;
          padding-top: 0; padding-bottom: 0;
        }
        .section-body.open { max-height: 2000px; opacity: 1; padding: 24px; }
        .section-wrap { margin-bottom: 20px; }

        /* Pricing Cards - Premium */
        .pricing-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; }
        .plan-card {
          border: 2px solid var(--border); border-radius: var(--radius);
          padding: 22px; transition: var(--transition); position: relative; overflow: hidden;
          background: var(--card);
        }
        .plan-card:hover { border-color: var(--primary); box-shadow: var(--shadow); transform: translateY(-2px); }
        .plan-card.popular { border-color: var(--primary); background: linear-gradient(180deg, #f0fdf4, white); }
        .plan-card.popular::before {
          content: "POPULAR"; position: absolute; top: 14px; right: -28px;
          background: var(--primary); color: white; font-size: 9px; font-weight: 800;
          letter-spacing: 1px; padding: 3px 36px; transform: rotate(45deg);
        }
        .plan-name { font-size: 13px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.8px; }
        .plan-price { font-size: 32px; font-weight: 800; color: var(--text); margin: 8px 0 4px; line-height: 1; }
        .plan-price sup { font-size: 16px; font-weight: 700; vertical-align: top; margin-top: 6px; color: var(--text-2); }
        .plan-price span { font-size: 13px; color: var(--text-3); font-weight: 500; }
        .plan-tenants { font-size: 12px; color: var(--text-3); margin-bottom: 14px; padding-bottom: 14px; border-bottom: 1px solid var(--border-light); }
        .plan-features { list-style: none; margin-bottom: 16px; }
        .plan-features li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-2); padding: 4px 0; }
        .plan-features li i { color: var(--success); font-size: 11px; flex-shrink: 0; }
        .plan-features li.off { color: var(--text-3); text-decoration: line-through; }
        .plan-features li.off i { color: var(--border); }
        .plan-actions { display: flex; gap: 8px; }

        /* Settings */
        .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .settings-group h4 { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid var(--border-light); }
        .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
        .settings-row:last-child { border-bottom: none; }
        .settings-label { font-size: 13px; font-weight: 500; color: var(--text); }
        .settings-desc { font-size: 11.5px; color: var(--text-3); margin-top: 1px; }
        .toggle {
          width: 42px; height: 24px; border-radius: 12px;
          background: var(--border); cursor: pointer; transition: var(--transition);
          position: relative; flex-shrink: 0;
        }
        .toggle.on { background: var(--primary); }
        .toggle::after {
          content: ''; width: 18px; height: 18px; border-radius: 50%;
          background: white; position: absolute; top: 3px; left: 3px;
          transition: var(--transition); box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .toggle.on::after { left: 21px; }
        .range-wrap { display: flex; align-items: center; gap: 10px; }
        .range-val { font-weight: 700; font-size: 14px; color: var(--primary-dark); min-width: 30px; }
        input[type=range] { accent-color: var(--primary); cursor: pointer; }
        .settings-input {
          height: 32px; padding: 0 10px; border: 1.5px solid var(--border); border-radius: 8px;
          font-family: inherit; font-size: 13px; color: var(--text); outline: none;
          transition: var(--transition);
        }
        .settings-input:focus { border-color: var(--primary); }
        .maint-banner {
          background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1.5px solid #f59e0b;
          border-radius: 10px; padding: 12px 16px; margin-top: 14px;
          display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 600; color: #92400e;
        }

        /* Premium Modals */
        .modal-overlay {
          display: none; position: fixed; inset: 0; z-index: 300;
          background: rgba(15,23,42,0.5); backdrop-filter: blur(4px);
          align-items: flex-start; justify-content: center; overflow-y: auto; padding: 20px;
        }
        .modal-overlay.open { display: flex; }
        .modal {
          background: var(--card); border-radius: var(--radius);
          width: 100%; max-width: 880px; margin: auto;
          box-shadow: var(--shadow-lg); border: 1px solid var(--border);
          animation: modalIn 0.25s ease;
        }
        @keyframes modalIn { from { opacity:0; transform: translateY(-20px) scale(0.97); } to { opacity:1; transform: none; } }
        .modal-header-premium {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-bottom: 1px solid #bbf7d0;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .modal-header-premium h3 {
          font-size: 17px;
          font-weight: 800;
          color: #065f46;
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .modal-header-premium h3 i {
          color: var(--primary-dark);
        }
        .modal-close { width: 34px; height: 34px; border-radius: 9px; border: none; cursor: pointer; background: rgba(255,255,255,0.8); color: var(--text-2); font-size: 15px; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
        .modal-close:hover { background: #fee2e2; color: var(--danger); }
        .modal-body { padding: 24px; }
        .modal-2col { display: grid; grid-template-columns: 200px 1fr; gap: 24px; }
        .modal-left { text-align: center; }
        .modal-avatar { width: 80px; height: 80px; border-radius: 20px; font-size: 28px; font-weight: 800; color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; box-shadow: var(--shadow); }
        .modal-biz-name { font-size: 17px; font-weight: 800; color: var(--text); }
        .modal-owner { font-size: 13px; color: var(--text-3); margin-top: 3px; }
        .modal-meta { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
        .modal-meta-row { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--text-2); }
        .modal-meta-row i { color: var(--primary-dark); width: 14px; font-size: 12px; }
        .open-chat-btn { margin-top: 14px; width: 100%; justify-content: center; }
        .ver-toggle { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 12.5px; font-weight: 600; color: var(--text-2); cursor: pointer; }

        /* Modal Tabs */
        .m-tabs { display: flex; gap: 2px; margin-bottom: 20px; background: var(--bg); border-radius: 10px; padding: 4px; }
        .m-tab { flex: 1; padding: 8px; text-align: center; font-size: 12.5px; font-weight: 600; cursor: pointer; border-radius: 8px; color: var(--text-3); transition: var(--transition); }
        .m-tab.active { background: white; color: var(--primary-dark); box-shadow: var(--shadow-sm); }
        .m-tab-content { display: none; }
        .m-tab-content.active { display: block; }

        .info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border-light); font-size: 13px; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: var(--text-3); font-weight: 500; }
        .info-val { color: var(--text); font-weight: 600; }

        .usage-bar-wrap { margin-bottom: 14px; }
        .usage-label { display: flex; justify-content: space-between; font-size: 12.5px; margin-bottom: 5px; }
        .usage-label span:first-child { font-weight: 600; color: var(--text); }
        .usage-label span:last-child { color: var(--text-3); }
        .usage-track { height: 7px; background: var(--bg2); border-radius: 4px; overflow: hidden; }
        .usage-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
        .fill-green { background: linear-gradient(90deg, var(--primary), var(--success)); }
        .fill-orange { background: linear-gradient(90deg, var(--warning), #f97316); }
        .fill-red { background: linear-gradient(90deg, var(--danger), #dc2626); }

        .feat-toggle-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
        .feat-toggle-row:last-child { border-bottom: none; }
        .feat-name { font-size: 13px; font-weight: 600; color: var(--text); }
        .feat-desc { font-size: 11.5px; color: var(--text-3); margin-top: 1px; }

        .timeline { position: relative; padding-left: 20px; }
        .tl-item { position: relative; padding: 0 0 18px 18px; }
        .tl-item::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 1px; background: var(--border); }
        .tl-dot { width: 10px; height: 10px; border-radius: 50%; position: absolute; left: -5px; top: 4px; flex-shrink: 0; }
        .tl-dot-green { background: var(--success); }
        .tl-dot-blue { background: var(--info); }
        .tl-dot-orange { background: var(--warning); }
        .tl-dot-red { background: var(--danger); }
        .tl-time { font-size: 11px; color: var(--text-3); margin-bottom: 2px; }
        .tl-text { font-size: 12.5px; color: var(--text); font-weight: 500; }
        .tl-meta { font-size: 11px; color: var(--text-3); margin-top: 2px; }

        /* Premium Toast */
        .toast-container { position: fixed; top: 80px; right: 20px; z-index: 500; display: flex; flex-direction: column; gap: 8px; }
        .toast {
          display: flex; align-items: center; gap: 12px;
          background: white; border-radius: 12px; padding: 12px 16px 12px 12px;
          box-shadow: var(--shadow-lg); border: 1px solid var(--border);
          min-width: 280px; max-width: 360px;
          animation: toastIn 0.3s ease;
        }
        .toast.removing { animation: toastOut 0.3s ease forwards; }
        @keyframes toastIn { from { opacity:0; transform: translateX(40px); } to { opacity:1; transform: none; } }
        @keyframes toastOut { from { opacity:1; transform: none; } to { opacity:0; transform: translateX(40px); } }
        .toast-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
        .t-success .toast-icon { background: #d1fae5; color: var(--success); }
        .t-error .toast-icon { background: #fee2e2; color: var(--danger); }
        .t-warning .toast-icon { background: #fef3c7; color: var(--warning); }
        .t-info .toast-icon { background: #dbeafe; color: var(--info); }
        .toast-content { flex: 1; }
        .toast-title { font-size: 13px; font-weight: 700; color: var(--text); }
        .toast-msg { font-size: 12px; color: var(--text-3); margin-top: 2px; }
        .toast-close { background: none; border: none; cursor: pointer; color: var(--text-3); font-size: 13px; padding: 2px; transition: var(--transition); }
        .toast-close:hover { color: var(--text); }
        .toast-progress { position: absolute; bottom: 0; left: 0; height: 3px; border-radius: 0 0 12px 12px; animation: toastProgress 4s linear forwards; }
        .t-success .toast-progress { background: var(--success); }
        .t-error .toast-progress { background: var(--danger); }
        .t-warning .toast-progress { background: var(--warning); }
        .t-info .toast-progress { background: var(--info); }
        @keyframes toastProgress { from { width: 100%; } to { width: 0%; } }

        /* Responsive */
        @media (max-width: 1200px) {
          .stats-row { grid-template-columns: repeat(2,1fr); }
          .pricing-grid { grid-template-columns: repeat(2,1fr); }
          .settings-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .all-tenants-page { padding: 16px 14px 80px; }
          .stats-row { grid-template-columns: 1fr 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
          .toolbar { flex-direction: column; align-items: stretch; }
          .toolbar-left, .toolbar-right { width: 100%; }
          .bulk-bar { min-width: unset; width: 92vw; }
          .modal-2col { grid-template-columns: 1fr; }
          .modal { border-radius: 12px; }
        }
        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr; }
        }

        /* Gradient helpers */
        .grad-1 { background: linear-gradient(135deg,#16a34a,#15803d); }
        .grad-2 { background: linear-gradient(135deg,#2563eb,#1d4ed8); }
        .grad-3 { background: linear-gradient(135deg,#7c3aed,#6d28d9); }
        .grad-4 { background: linear-gradient(135deg,#d97706,#b45309); }
        .grad-5 { background: linear-gradient(135deg,#0891b2,#0e7490); }
        .grad-6 { background: linear-gradient(135deg,#be185d,#9d174d); }
        .grad-7 { background: linear-gradient(135deg,#059669,#047857); }
        .grad-8 { background: linear-gradient(135deg,#6366f1,#4f46e5); }
        .grad-9 { background: linear-gradient(135deg,#0d9488,#0f766e); }
        .grad-10 { background: linear-gradient(135deg,#dc2626,#b91c1c); }

        .chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
        .empty-row td { text-align: center; padding: 40px; color: var(--text-3); font-size: 13px; }

        .divider { height: 1px; background: var(--border-light); margin: 16px 0; }

        /* Invoice table */
        .inv-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
        .inv-table th { text-align: left; padding: 8px 12px; background: var(--bg); color: var(--text-3); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .inv-table td { padding: 9px 12px; border-bottom: 1px solid var(--border-light); color: var(--text-2); }
        .inv-table tr:last-child td { border-bottom: none; }
        .inv-table tr:hover td { background: var(--bg); }

        /* ===== MOBILE STYLES ===== */
        @media (max-width: 899px) {
          .desktop-only { display: none !important; }
        }
        @media (min-width: 900px) {
          .mobile-only { display: none !important; }
        }

        .m3-appbar {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 4px; margin-bottom: 12px;
        }
        .m3-appbar h1 {
          font-size: 22px; font-weight: 700; color: var(--text);
          flex: 1; margin: 0;
        }
        .m3-appbar-icon {
          width: 44px; height: 44px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; color: var(--text-2);
          background: var(--card); border: none; cursor: pointer;
          transition: background 0.15s ease;
        }
        .m3-appbar-icon:active { background: var(--bg2); }

        .m3-search-wrap {
          position: relative; margin-bottom: 12px;
        }
        .m3-search-wrap i {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          color: var(--text-3); font-size: 16px;
        }
        .m3-search-input {
          width: 100%; height: 48px; padding: 0 48px 0 48px;
          border: none; border-radius: 28px;
          background: var(--card); box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          font-family: inherit; font-size: 15px; color: var(--text);
          outline: none; transition: box-shadow 0.2s ease;
        }
        .m3-search-input::placeholder { color: var(--text-3); }
        .m3-search-input:focus { box-shadow: 0 0 0 2px var(--primary); }

        .m3-stats-scroll {
          display: flex; gap: 10px; overflow-x: auto;
          padding: 0 0 12px; margin-bottom: 4px;
          -webkit-overflow-scrolling: touch;
        }
        .m3-stats-scroll::-webkit-scrollbar { display: none; }
        .m3-stat-chip {
          flex-shrink: 0; display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 20px;
          background: var(--card); box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          min-width: 140px;
        }
        .m3-stat-chip-icon {
          width: 40px; height: 40px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px; flex-shrink: 0;
        }
        .m3-stat-chip-info { flex: 1; min-width: 0; }
        .m3-stat-chip-label { font-size: 11px; font-weight: 600; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.4px; }
        .m3-stat-chip-val { font-size: 18px; font-weight: 800; color: var(--text); line-height: 1.2; margin-top: 1px; }

        .m3-chips-row {
          display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px;
          -webkit-overflow-scrolling: touch;
        }
        .m3-chips-row::-webkit-scrollbar { display: none; }
        .m3-chip {
          flex-shrink: 0; display: flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 20px;
          font-size: 13px; font-weight: 500; color: var(--text-2);
          background: var(--card); border: 1.5px solid var(--border);
          cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
        }
        .m3-chip:active { transform: scale(0.96); }
        .m3-chip.active {
          background: var(--primary-light); border-color: var(--primary);
          color: var(--primary-dark); font-weight: 600;
        }
        .m3-chip .count {
          padding: 1px 7px; border-radius: 12px; font-size: 11px;
          background: rgba(0,0,0,0.06); font-weight: 600;
        }
        .m3-chip.active .count { background: rgba(18,140,126,0.15); color: var(--primary-dark); }
        .m3-chip-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .m3-filter-btn {
          flex-shrink: 0; width: 44px; height: 38px; border-radius: 19px;
          display: flex; align-items: center; justify-content: center;
          background: var(--card); border: 1.5px solid var(--border);
          color: var(--text-2); cursor: pointer; font-size: 15px;
          transition: all 0.15s ease;
        }
        .m3-filter-btn:active { background: var(--bg2); }
        .m3-filter-btn.has-filters { border-color: var(--primary); color: var(--primary); background: var(--primary-xlight); }







        .m3-pulse { width: 8px; height: 8px; border-radius: 50%; }
        .m3-pulse-green { background: var(--success); box-shadow: 0 0 0 0 rgba(16,185,129,0.5); animation: pulse-anim 2s infinite; }
        .m3-pulse-orange { background: var(--warning); }
        .m3-pulse-red { background: var(--danger); }

        .m3-fab {
          position: fixed; bottom: 24px; right: 20px; z-index: 150;
          width: 56px; height: 56px; border-radius: 16px;
          background: linear-gradient(135deg, var(--primary), var(--primary-dark));
          color: white; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; box-shadow: 0 4px 16px rgba(37,211,102,0.4);
          transition: all 0.2s ease;
        }
        .m3-fab:active { transform: scale(0.92); box-shadow: 0 2px 8px rgba(37,211,102,0.3); }

        .m3-sel-bar {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 180;
          background: #1e293b; border-radius: 20px 20px 0 0;
          padding: 14px 16px 20px; box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
          transform: translateY(100%); transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .m3-sel-bar.show { transform: translateY(0); }
        .m3-sel-bar .bulk-count {
          width: 100%; text-align: center;
          border-right: none; padding-right: 0; padding-bottom: 8px;
          margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .m3-sel-bar .bulk-btn { flex: 1; min-width: 0; text-align: center; font-size: 11px; padding: 8px 4px; border-radius: 10px; }

        .m3-bottom-sheet-overlay {
          position: fixed; inset: 0; z-index: 250;
          background: rgba(0,0,0,0.4); opacity: 0;
          pointer-events: none; transition: opacity 0.3s ease;
        }
        .m3-bottom-sheet-overlay.open { opacity: 1; pointer-events: auto; }
        .m3-bottom-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 260;
          background: white; border-radius: 28px 28px 0 0;
          padding: 16px 20px 32px; max-height: 80vh; overflow-y: auto;
          transform: translateY(100%); transition: transform 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .m3-bottom-sheet.open { transform: translateY(0); }
        .m3-bs-handle { width: 40px; height: 4px; border-radius: 2px; background: var(--border); margin: 0 auto 16px; }
        .m3-bs-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 16px; }
        .m3-bs-section { margin-bottom: 16px; }
        .m3-bs-label { font-size: 12px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
        .m3-bs-options { display: flex; flex-wrap: wrap; gap: 8px; }
        .m3-bs-option {
          padding: 9px 16px; border-radius: 20px; font-size: 13px; font-weight: 500;
          border: 1.5px solid var(--border); background: white;
          color: var(--text-2); cursor: pointer; transition: all 0.15s ease;
        }
        .m3-bs-option:active { transform: scale(0.96); }
        .m3-bs-option.active { background: var(--primary-light); border-color: var(--primary); color: var(--primary-dark); font-weight: 600; }

        .m3-empty-state { text-align: center; padding: 60px 20px; }
        .m3-empty-state i { font-size: 48px; color: var(--border); margin-bottom: 16px; }
        .m3-empty-state p { font-size: 15px; color: var(--text-3); font-weight: 500; }

        @media (max-width: 899px) {
          .all-tenants-page { padding: 8px 12px 80px; }
        }

        @media (max-width: 480px) {
          .toast-container { right: 12px; left: 12px; top: 60px; }
          .toast { min-width: unset; max-width: unset; }
        }
      `}</style>

      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast t-${toast.type}`} style={{ position: "relative" }}>
            <div className="toast-icon">
              <i className={`fas fa-${toast.type === "success" ? "check" : toast.type === "error" ? "xmark" : toast.type === "warning" ? "triangle-exclamation" : "info"}`}></i>
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-msg">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}>
              <i className="fas fa-xmark"></i>
            </button>
            <div className="toast-progress"></div>
          </div>
        ))}
      </div>

      {/* Page Header — Premium Card */}
      <PageHeaderCard className="mb-4 md:mb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200 flex-shrink-0">
            <i className="fas fa-shield-alt text-white text-xl md:text-2xl"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Tenant Management</h2>
            <p className="text-sm md:text-base text-gray-600 mt-1">Manage all sellers, service providers, subscriptions and platform settings</p>
          </div>
        </div>
      </PageHeaderCard>

      {/* Main Navigation Tabs */}
      <div className="bg-surface rounded-xl border border-outline-variant shadow-sm p-1 mb-4 md:mb-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
          <button
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeMainTab === "tenants"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-200"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMainTab("tenants")}
          >
            <i className="fas fa-users text-[11px]"></i>
            <span>Tenants</span>
          </button>
          <button
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeMainTab === "plans"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-200"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMainTab("plans")}
          >
            <i className="fas fa-tags text-[11px]"></i>
            <span>Plans</span>
          </button>
          <button
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeMainTab === "diagnostics"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-200"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMainTab("diagnostics")}
          >
            <i className="fas fa-stethoscope text-[11px]"></i>
            <span>Diagnostics</span>
          </button>
          <button
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeMainTab === "connection-test"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-200"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMainTab("connection-test")}
          >
            <i className="fas fa-plug text-[11px]"></i>
            <span>Connect</span>
          </button>
          <button
            className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              activeMainTab === "settings"
                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm shadow-emerald-200"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
            onClick={() => setActiveMainTab("settings")}
          >
            <i className="fas fa-cog text-[11px]"></i>
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* Tenants Tab Content */}
      {activeMainTab === "tenants" && (
        <>
          {/* Stats Row */}
          <div className="stats-row desktop-only">
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Total Tenants</div>
                <div className="stat-val">{totalTenants}</div>
                <div className={`stat-trend ${tenantGrowth >= 0 ? 'trend-up' : 'trend-warn'}`}>
                  <i className={`fas fa-arrow-${tenantGrowth >= 0 ? 'up' : 'down'}`}></i> {tenantGrowth >= 0 ? '+' : ''}{tenantGrowth}% this month
                </div>
              </div>
              <div className="stat-icon si-green"><i className="fas fa-store"></i></div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Active Subscriptions</div>
                <div className="stat-val">{activeTenants}</div>
                <div className="stat-trend trend-up">
                  <i className="fas fa-check-circle"></i> {activeTenants} of {totalTenants} active
                </div>
              </div>
              <div className="stat-icon si-emerald"><i className="fas fa-check-circle"></i></div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Platform Revenue</div>
                <div className="stat-val revenue">KSh {totalRevenue.toLocaleString()}</div>
                <div className="stat-trend trend-up">
                  <i className="fas fa-chart-line"></i> From {tenants.filter(t => (t.rev || 0) > 0).length} paying tenants
                </div>
              </div>
              <div className="stat-icon si-purple"><i className="fas fa-coins"></i></div>
            </div>
            <div className="stat-card">
              <div className="stat-info">
                <div className="stat-label">Pending Approvals</div>
                <div className="stat-val">{pendingApprovals}</div>
                <div className="stat-trend trend-warn"><i className="fas fa-exclamation-circle"></i> Requires attention</div>
              </div>
              <div className="stat-icon si-orange"><i className="fas fa-clock"></i></div>
            </div>
          </div>

          {/* MOBILE: App Bar & Stats Chips */}
          <div className="mobile-only">
            {/* M3 Top App Bar */}
            <div className="m3-appbar">
              <h1>Tenants</h1>
              <button className="m3-appbar-icon" onClick={() => showToast("info", "Sort", "Sort options coming soon")}>
                <i className="fas fa-arrow-up-wide-short"></i>
              </button>
              <button className="m3-appbar-icon" onClick={() => window.location.reload()}>
                <i className="fas fa-rotate"></i>
              </button>
            </div>

            {/* M3 Search Bar */}
            <div className="m3-search-wrap">
              <i className="fas fa-search"></i>
              <input type="text" className="m3-search-input" placeholder="Search tenants..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-store text-green-700 text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Total</div>
                    <div className="text-lg font-bold text-gray-900 leading-tight mt-px">{totalTenants}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check-circle text-emerald-700 text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Active</div>
                    <div className="text-lg font-bold text-gray-900 leading-tight mt-px">{activeTenants}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-coins text-purple-700 text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Revenue</div>
                    <div className="text-lg font-bold text-gray-900 leading-tight mt-px">KSh {totalRevenue.toLocaleString()}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-clock text-amber-700 text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Pending</div>
                    <div className="text-lg font-bold text-gray-900 leading-tight mt-px">{pendingApprovals}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="toolbar desktop-only">
            <div className="toolbar-left">
              <div className="tb-input-wrap">
                <i className="fas fa-search"></i>
                <input type="text" className="tb-input" placeholder="Search tenants by name, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <select className="tb-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setActiveTab(e.target.value); setPlanFilter(""); }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <select className="tb-select" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setActiveTab(e.target.value); setStatusFilter(""); }}>
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div className="toolbar-right">
              <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
                <i className="fas fa-plus"></i> Add Tenant
              </button>
          <button className="btn btn-secondary" onClick={exportCSV}>
            <i className="fas fa-download"></i> Export CSV
          </button>
              <button className="btn btn-icon btn-secondary" onClick={() => showToast("info", "Refresh", "Refreshing tenant list...")} title="Refresh">
                <i className="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="desktop-only mb-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Quick Filters</span>
              {activeTab && (
                <button
                  onClick={() => setTab("", "status")}
                  className="text-[11px] text-emerald-600 hover:text-emerald-700 font-semibold ml-auto"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === ""
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("", "status")}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "" ? "bg-emerald-500" : "bg-green-400"}`}></span>
                All&nbsp;<span className="opacity-60">({tenants.length})</span>
              </button>
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === "active"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("active", "status")}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "active" ? "bg-emerald-500" : "bg-green-400"}`}></span>
                Active&nbsp;<span className="opacity-60">({tenants.filter((t) => t.status === "active").length})</span>
              </button>
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === "pending"
                    ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("pending", "status")}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "pending" ? "bg-amber-500" : "bg-amber-400"}`}></span>
                Pending&nbsp;<span className="opacity-60">({tenants.filter((t) => t.status === "pending").length})</span>
              </button>
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === "suspended"
                    ? "bg-red-50 border-red-200 text-red-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("suspended", "status")}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === "suspended" ? "bg-red-500" : "bg-red-400"}`}></span>
                Suspended&nbsp;<span className="opacity-60">({tenants.filter((t) => t.status === "suspended").length})</span>
              </button>
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === "free"
                    ? "bg-gray-100 border-gray-300 text-gray-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("free", "plan")}
              >
                <i className="fas fa-seedling text-[10px]"></i>
                Free&nbsp;<span className="opacity-60">({tenants.filter((t) => t.plan === "free").length})</span>
              </button>
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === "starter"
                    ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("starter", "plan")}
              >
                <i className="fas fa-rocket text-[10px]"></i>
                Starter&nbsp;<span className="opacity-60">({tenants.filter((t) => t.plan === "starter").length})</span>
              </button>
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === "pro"
                    ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("pro", "plan")}
              >
                <i className="fas fa-star text-[10px]"></i>
                Pro&nbsp;<span className="opacity-60">({tenants.filter((t) => t.plan === "pro").length})</span>
              </button>
              <button
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 border ${
                  activeTab === "enterprise"
                    ? "bg-purple-50 border-purple-200 text-purple-700 shadow-sm"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setTab("enterprise", "plan")}
              >
                <i className="fas fa-crown text-[10px]"></i>
                Enterprise&nbsp;<span className="opacity-60">({tenants.filter((t) => t.plan === "enterprise").length})</span>
              </button>
            </div>
          </div>

          {/* MOBILE: Filter Chips Row */}
          <div className="mobile-only">
            <div className="m3-chips-row">
              <div className={`m3-chip ${statusFilter === "" && planFilter === "" ? "active" : ""}`} onClick={() => { setStatusFilter(""); setPlanFilter(""); setActiveTab(""); }}>
                <span className="m3-chip-dot dot-green"></span> All
                <span className="count">{tenants.length}</span>
              </div>
              <div className={`m3-chip ${statusFilter === "active" ? "active" : ""}`} onClick={() => { setStatusFilter("active"); setPlanFilter(""); setActiveTab("active"); }}>
                <span className="m3-pulse m3-pulse-green"></span> Active
                <span className="count">{tenants.filter(t => t.status === "active").length}</span>
              </div>
              <div className={`m3-chip ${statusFilter === "pending" ? "active" : ""}`} onClick={() => { setStatusFilter("pending"); setPlanFilter(""); setActiveTab("pending"); }}>
                <span className="m3-pulse m3-pulse-orange"></span> Pending
                <span className="count">{tenants.filter(t => t.status === "pending").length}</span>
              </div>
              <div className={`m3-chip ${statusFilter === "suspended" ? "active" : ""}`} onClick={() => { setStatusFilter("suspended"); setPlanFilter(""); setActiveTab("suspended"); }}>
                <span className="m3-chip-dot dot-red"></span> Suspended
                <span className="count">{tenants.filter(t => t.status === "suspended").length}</span>
              </div>
              <div className={`m3-chip ${planFilter === "free" ? "active" : ""}`} onClick={() => { setPlanFilter("free"); setStatusFilter(""); setActiveTab("free"); }}>
                <i className="fas fa-seedling" style={{fontSize:"12px",color:"var(--text-3)"}}></i> Free
                <span className="count">{tenants.filter(t => t.plan === "free").length}</span>
              </div>
              <button className={`m3-filter-btn ${statusFilter || planFilter ? "has-filters" : ""}`} onClick={() => setShowMobileFilterSheet(true)}>
                <i className="fas fa-sliders"></i>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="table-card desktop-only">
            <div className="table-header">
              <h3><i className="fas fa-building text-emerald-600"></i> All Tenants <span className="text-sm font-normal text-gray-500">({tenants.length} total)</span></h3>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">{filteredTenants.length} filtered</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th><input type="checkbox" className="cb" checked={selectAll} onChange={toggleAll} /></th>
                    <th>Tenant Info</th>
                    <th>Category</th>
                    <th>Plan</th>
                    <th>Revenue / Mo</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTenants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="empty-row">
                        <i className="fas fa-magnifying-glass" style={{ fontSize: "24px", marginBottom: "8px", display: "block" }}></i>
                        No tenants match your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedTenants.map((t) => (
                      <tr
                        key={t.id}
                        className={`${selectedRows.includes(t.id) ? "selected" : ""} transition-all duration-150`}
                        onClick={(e) => {
                          if ((e.target as HTMLElement).tagName !== "INPUT") {
                            toggleRow(t.id);
                          }
                        }}
                      >
                        <td><input type="checkbox" className="cb" checked={selectedRows.includes(t.id)} onChange={() => toggleRow(t.id)} /></td>
                        <td>
                          <div className="tenant-info">
                            <div className={`t-avatar ${t.grad}`}>{t.initials}</div>
                            <div>
                              <div className="t-name">{t.name} {t.plan !== "free" ? <i className="fas fa-circle-check verified"></i> : null} {(t.role === "admin" || t.role === "superadmin") && <span className="badge" style={{ fontSize: "10px", padding: "1px 6px", background: "#ede9fe", color: "#5b21b6", border: "1px solid #c4b5fd", marginLeft: "4px" }}><i className="fas fa-shield-halved" style={{ marginRight: "2px" }}></i>Admin</span>}</div>
                              <div className="t-owner">{t.owner}</div>
                              <div className="t-phone"><i className="fab fa-whatsapp"></i>{t.phone}</div>
                              {t.email && <div className="text-[11px] text-gray-400 mt-0.5"><i className="fas fa-envelope mr-1"></i>{t.email}</div>}
                            </div>
                          </div>
                        </td>
                    <td>{catBadges[t.cat || "both"]}</td>
                    <td>
                      <div>{planBadges[t.plan || "free"]}</div>
                      {t.plan === "free" && t.trialEndsAt && t.role !== "admin" && t.role !== "superadmin" && (
                        <div style={{ marginTop: "4px" }}>
                          <TrialBadge trialEndsAt={t.trialEndsAt} trialDays={t.trialDays} />
                        </div>
                      )}
                    </td>
                    <td>{(t.rev || 0) > 0 ? <span className="revenue-val">KSh {(t.rev || 0).toLocaleString()}</span> : <span className="revenue-zero">—</span>}</td>
                    <td>{statusPills[t.status || "pending"]}</td>
                        <td>
                          <div className="last-active">
                            {t.online ? <span className="online-dot"></span> : null}
                            {t.last}
                          </div>
                          {t.country && <div className="text-[11px] text-gray-400 mt-0.5"><i className="fas fa-location-dot mr-1"></i>{t.country}</div>}
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="actions-cell">
                            <button className="action-btn ab-view" onClick={() => openModal(t)} title="View"><i className="fas fa-eye"></i></button>
                        <button className="action-btn ab-edit" onClick={() => openEditModal(t)} title="Edit"><i className="fas fa-pen"></i></button>
                            <button className="action-btn ab-wa" onClick={() => showToast("success", "WhatsApp", "Opening WhatsApp chat...")} title="WhatsApp"><i className="fab fa-whatsapp"></i></button>
                            <button className="action-btn ab-suspend" onClick={() => toggleTenantStatus(t)} title={t.status === "active" ? "Suspend" : "Activate"}><i className={t.status === "active" ? "fas fa-pause" : "fas fa-play"}></i></button>
                            <button className="action-btn ab-delete" onClick={() => confirmDelete(t.name, t.id)} title="Delete"><i className="fas fa-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-bar">
            <div className="pag-info">Showing <strong>{filteredTenants.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–{Math.min(currentPage * rowsPerPage, filteredTenants.length)}</strong> of <strong>{filteredTenants.length}</strong> tenants</div>
            <div className="pag-controls">
              <button className="pag-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}><i className="fas fa-chevron-left"></i></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`pag-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {totalPages > 5 && <span style={{ color: "var(--text-3)", padding: "0 4px", fontSize: "13px" }}>...</span>}
              {totalPages > 5 && (
                <button
                  className={`pag-btn ${currentPage === totalPages ? "active" : ""}`}
                  onClick={() => goToPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
              <button className="pag-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}><i className="fas fa-chevron-right"></i></button>
            </div>
            <div className="per-page-wrap">
              Rows:
              <select
                className="tb-select"
                style={{ height: "30px", fontSize: "12px" }}
                value={rowsPerPage}
                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            </div>
          </div>

          {/* MOBILE: Premium Tenant Cards */}
          <div className="mobile-only">
            {filteredTenants.length === 0 ? (
              <div className="m3-empty-state">
                <i className="fas fa-magnifying-glass"></i>
                <p>No tenants match your filters.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-4">
                {paginatedTenants.map((t) => (
                  <div
                    key={t.id}
                    className={`relative overflow-hidden bg-white rounded-2xl border transition-all duration-200 shadow-sm ${
                      selectedRows.includes(t.id)
                        ? "border-emerald-400 ring-2 ring-emerald-100 shadow-md"
                        : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                    }`}
                    onClick={() => toggleRow(t.id)}
                  >
                    {/* Gradient accent bar at top */}
                    <div className={`h-1 w-full ${t.grad}`}></div>
                    
                    <div className="p-4">
                      {/* Top row: Checkbox + Avatar + Info */}
                      <div className="flex items-start gap-3">
                        <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                          <input type="checkbox" className="cb" checked={selectedRows.includes(t.id)} onChange={() => toggleRow(t.id)} />
                        </div>
                        <div className={`w-11 h-11 rounded-xl ${t.grad} flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0`}>
                          {t.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-gray-900 truncate">{t.name}</span>
                            {t.plan !== "free" && <i className="fas fa-circle-check text-blue-500 text-[10px]"></i>}
                            {(t.role === "admin" || t.role === "superadmin") && <span className="badge" style={{ fontSize: "9px", padding: "1px 5px", background: "#ede9fe", color: "#5b21b6", border: "1px solid #c4b5fd" }}><i className="fas fa-shield-halved" style={{ marginRight: "2px" }}></i>Admin</span>}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5 truncate">{t.owner}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <i className="fab fa-whatsapp text-emerald-500 text-[10px]"></i>
                            <span className="truncate">{t.phone || "—"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badges row */}
                      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        {planBadges[t.plan || "free"]}
                        {t.plan === "free" && t.trialEndsAt && t.role !== "admin" && t.role !== "superadmin" && (
                          <TrialBadge trialEndsAt={t.trialEndsAt} trialDays={t.trialDays} />
                        )}
                        {catBadges[t.cat || "both"]}
                      </div>

                      {/* Dynamic info row: country + email */}
                      {(t.country || t.email) && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5 text-[11px] text-gray-400">
                          {t.country && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-location-dot text-gray-300"></i>
                              {t.country}
                            </span>
                          )}
                          {t.email && (
                            <span className="flex items-center gap-1 truncate max-w-[180px]">
                              <i className="fas fa-envelope text-gray-300"></i>
                              {t.email}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer: status + last active + revenue */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          {t.status === "active" && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>}
                          {t.status === "pending" && <span className="w-2 h-2 rounded-full bg-amber-400"></span>}
                          {t.status === "suspended" && <span className="w-2 h-2 rounded-full bg-red-400"></span>}
                          <span className="text-xs font-semibold text-gray-700 capitalize">{t.status}</span>
                          <span className="text-[11px] text-gray-400">{t.last}</span>
                        </div>
                        <span className="text-xs font-bold text-gray-800">
                          {(t.rev || 0) > 0
                            ? <><span className="text-emerald-600">KSh</span> {(t.rev || 0).toLocaleString()}</>
                            : <span className="text-gray-300">—</span>
                          }
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => openModal(t)} title="View"><i className="fas fa-eye"></i></button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors" onClick={() => openEditModal(t)} title="Edit"><i className="fas fa-pen"></i></button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" onClick={() => showToast("success","WhatsApp","Opening WhatsApp chat...")} title="WhatsApp"><i className="fab fa-whatsapp"></i></button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors" onClick={() => toggleTenantStatus(t)} title={t.status === "active" ? "Suspend" : "Activate"}><i className={t.status === "active" ? "fas fa-pause" : "fas fa-play"}></i></button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" onClick={() => confirmDelete(t.name,t.id)} title="Delete"><i className="fas fa-trash"></i></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bulk Action Bar */}
          <div className={`bulk-bar desktop-only ${selectedRows.length > 0 ? "show" : ""}`}>
            <div className="bulk-count">
              <i className="fas fa-check-circle"></i> {selectedRows.length} selected
            </div>
            <button className="bulk-btn bb-approve" onClick={() => bulkAction("activate")}>
              <i className="fas fa-check"></i> Approve
            </button>
            <button className="bulk-btn bb-suspend" onClick={() => bulkAction("suspend")}>
              <i className="fas fa-pause"></i> Suspend
            </button>
            <button className="bulk-btn bb-upgrade" onClick={() => setBulkPlanModalOpen(true)}>
              <i className="fas fa-tag"></i> Change Plan
            </button>
            <button className="bulk-btn bb-msg" onClick={bulkSendMessage}>
              <i className="fas fa-message"></i> Message
            </button>
            <button className="bulk-btn bb-export" onClick={bulkExport}>
              <i className="fas fa-download"></i> Export
            </button>
            <button className="bulk-btn bb-delete" onClick={bulkDelete}>
              <i className="fas fa-trash"></i> Delete
            </button>
            <span className="bulk-close" onClick={clearSelection}>
              <i className="fas fa-xmark"></i>
            </span>
          </div>

          {/* MOBILE: FAB - Add Tenant */}
          <div className="mobile-only">
            <button className="m3-fab" onClick={() => setAddModalOpen(true)}>
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* MOBILE: Selection Bar (bulk actions) */}
          <div className={`m3-sel-bar mobile-only ${selectedRows.length > 0 ? "show" : ""}`}>
            <div className="bulk-count">
              <i className="fas fa-check-circle"></i> {selectedRows.length} selected
            </div>
            <button className="bulk-btn bb-approve" onClick={() => bulkAction("activate")}>
              <i className="fas fa-check"></i> Approve
            </button>
            <button className="bulk-btn bb-suspend" onClick={() => bulkAction("suspend")}>
              <i className="fas fa-pause"></i> Suspend
            </button>
            <button className="bulk-btn bb-upgrade" onClick={() => setBulkPlanModalOpen(true)}>
              <i className="fas fa-tag"></i> Plan
            </button>
            <button className="bulk-btn bb-delete" onClick={bulkDelete}>
              <i className="fas fa-trash"></i> Delete
            </button>
            <span className="bulk-close" onClick={clearSelection}>
              <i className="fas fa-xmark"></i>
            </span>
          </div>

          {/* MOBILE: Filter Bottom Sheet */}
          {showMobileFilterSheet && (
            <>
              <div className={`m3-bottom-sheet-overlay ${showMobileFilterSheet ? "open" : ""}`} onClick={() => setShowMobileFilterSheet(false)}></div>
              <div className={`m3-bottom-sheet ${showMobileFilterSheet ? "open" : ""}`}>
                <div className="m3-bs-handle"></div>
                <div className="m3-bs-title">Filter Tenants</div>

                <div className="m3-bs-section">
                  <div className="m3-bs-label">Status</div>
                  <div className="m3-bs-options">
                    <div className={`m3-bs-option ${(mobileFilterStatus || statusFilter) === "" ? "active" : ""}`} onClick={() => { setMobileFilterStatus(""); setStatusFilter(""); setActiveTab(""); }}>All</div>
                    <div className={`m3-bs-option ${(mobileFilterStatus || statusFilter) === "active" ? "active" : ""}`} onClick={() => { setMobileFilterStatus("active"); setStatusFilter("active"); setActiveTab("active"); }}>Active</div>
                    <div className={`m3-bs-option ${(mobileFilterStatus || statusFilter) === "pending" ? "active" : ""}`} onClick={() => { setMobileFilterStatus("pending"); setStatusFilter("pending"); setActiveTab("pending"); }}>Pending</div>
                    <div className={`m3-bs-option ${(mobileFilterStatus || statusFilter) === "suspended" ? "active" : ""}`} onClick={() => { setMobileFilterStatus("suspended"); setStatusFilter("suspended"); setActiveTab("suspended"); }}>Suspended</div>
                  </div>
                </div>

                <div className="m3-bs-section">
                  <div className="m3-bs-label">Plan</div>
                  <div className="m3-bs-options">
                    <div className={`m3-bs-option ${(mobileFilterPlan || planFilter) === "" ? "active" : ""}`} onClick={() => { setMobileFilterPlan(""); setPlanFilter(""); setActiveTab(""); }}>All</div>
                    <div className={`m3-bs-option ${(mobileFilterPlan || planFilter) === "free" ? "active" : ""}`} onClick={() => { setMobileFilterPlan("free"); setPlanFilter("free"); setActiveTab("free"); }}>Free</div>
                    <div className={`m3-bs-option ${(mobileFilterPlan || planFilter) === "starter" ? "active" : ""}`} onClick={() => { setMobileFilterPlan("starter"); setPlanFilter("starter"); setActiveTab("starter"); }}>Starter</div>
                    <div className={`m3-bs-option ${(mobileFilterPlan || planFilter) === "pro" ? "active" : ""}`} onClick={() => { setMobileFilterPlan("pro"); setPlanFilter("pro"); setActiveTab("pro"); }}>Pro</div>
                    <div className={`m3-bs-option ${(mobileFilterPlan || planFilter) === "enterprise" ? "active" : ""}`} onClick={() => { setMobileFilterPlan("enterprise"); setPlanFilter("enterprise"); setActiveTab("enterprise"); }}>Enterprise</div>
                  </div>
                </div>

                <div className="m3-bs-section">
                  <div className="m3-bs-label">Filter Tab</div>
                  <div className="m3-bs-options">
                    <div className={`m3-bs-option ${(mobileFilterTab || activeTab) === "" ? "active" : ""}`} onClick={() => { setMobileFilterTab(""); setTab("", "status"); }}>All Tenants</div>
                    <div className={`m3-bs-option ${(mobileFilterTab || activeTab) === "expired" ? "active" : ""}`} onClick={() => { setMobileFilterTab("expired"); setTab("expired", "status"); }}>Expiring Soon</div>
                    <div className={`m3-bs-option ${(mobileFilterTab || activeTab) === "enterprise" ? "active" : ""}`} onClick={() => { setMobileFilterTab("enterprise"); setTab("enterprise", "plan"); }}>Enterprise</div>
                  </div>
                </div>

                <button className="m3-bs-btn m3-bs-btn-primary" onClick={() => setShowMobileFilterSheet(false)}>
                  <i className="fas fa-check"></i> Apply Filters
                </button>
                <button className="m3-bs-btn m3-bs-btn-secondary" onClick={() => { setShowMobileFilterSheet(false); setMobileFilterStatus(""); setMobileFilterPlan(""); setMobileFilterTab(""); setStatusFilter(""); setPlanFilter(""); setActiveTab(""); }}>
                  Clear All Filters
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Connection Test Tab Content */}
      {activeMainTab === "connection-test" && (
        <div className="section-wrap" style={{ marginTop: 0 }}>
          <ConnectionTestTab />
        </div>
      )}

      {/* Settings Tab Content */}
      {activeMainTab === "settings" && (
        <div className="section-wrap" style={{ marginTop: 0 }}>
          <div className="section-header open" style={{ cursor: "default" }}>
            <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-800"><i className="fas fa-cog text-emerald-600"></i> Platform Settings</div>
          </div>
          <div className="section-body open" style={{ maxHeight: "2000px", opacity: 1, padding: "24px" }}>
            <div className="settings-grid">
              <div className="settings-group">
                <h4><i className="fas fa-toggle-on" style={{ color: "var(--primary-dark)", marginRight: "6px" }}></i> General Settings</h4>

                <div className="settings-row">
                  <div>
                    <div className="settings-label">Maintenance Mode</div>
                    <div className="settings-desc">Disable all tenant stores and booking pages</div>
                  </div>
                  <div
                    className={`toggle ${platformSettings.maintenanceMode ? "on" : ""}`}
                    onClick={() => setPlatformSettings({ ...platformSettings, maintenanceMode: !platformSettings.maintenanceMode })}
                  ></div>
                </div>
                {platformSettings.maintenanceMode && (
                  <div className="maint-banner">
                    <i className="fas fa-triangle-exclamation"></i>
                    Maintenance mode is active. All tenant storefronts and booking pages will show a maintenance notice.
                  </div>
                )}

                <div className="settings-row">
                  <div>
                    <div className="settings-label">Allow Registration</div>
                    <div className="settings-desc">Allow new users to sign up as tenants</div>
                  </div>
                  <div
                    className={`toggle ${platformSettings.allowRegistration ? "on" : ""}`}
                    onClick={() => setPlatformSettings({ ...platformSettings, allowRegistration: !platformSettings.allowRegistration })}
                  ></div>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="settings-label">Default Plan for New Tenants</div>
                    <div className="settings-desc">The plan assigned to newly registered tenants</div>
                  </div>
                  <select
                    className="settings-input"
                    style={{ width: "140px" }}
                    value={platformSettings.defaultPlan}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, defaultPlan: e.target.value as any })}
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="settings-label">New Tenant Status</div>
                    <div className="settings-desc">Default status for newly registered tenants</div>
                  </div>
                  <select
                    className="settings-input"
                    style={{ width: "140px" }}
                    value={platformSettings.newTenantStatus}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, newTenantStatus: e.target.value as "active" | "pending" | "suspended" })}
                  >
                    <option value="active">Auto-Active</option>
                    <option value="pending">Pending Approval</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="settings-group">
                <h4><i className="fas fa-chart-simple" style={{ color: "var(--primary-dark)", marginRight: "6px" }}></i> Platform Economics</h4>

                <div className="settings-row">
                  <div>
                    <div className="settings-label">Platform Fee (%)</div>
                    <div className="settings-desc">Commission charged on each transaction</div>
                  </div>
                  <div className="range-wrap">
                    <span className="range-val">{platformSettings.platformFeePercent}%</span>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      value={platformSettings.platformFeePercent}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, platformFeePercent: Number(e.target.value) })}
                      style={{ width: "120px" }}
                    />
                  </div>
                </div>

                <div className="settings-row">
                  <div>
                    <div className="settings-label">Default Currency</div>
                    <div className="settings-desc">Currency for platform-wide pricing</div>
                  </div>
                  <select
                    className="settings-input"
                    style={{ width: "120px" }}
                    value={platformSettings.defaultCurrency}
                    onChange={(e) => setPlatformSettings({ ...platformSettings, defaultCurrency: e.target.value })}
                  >
                    <option value="KSh">KSh (KES)</option>
                    <option value="USD">$ (USD)</option>
                    <option value="EUR">€ (EUR)</option>
                    <option value="GBP">£ (GBP)</option>
                    <option value="NGN">₦ (NGN)</option>
                    <option value="TZS">TSh (TZS)</option>
                    <option value="UGX">USh (UGX)</option>
                    <option value="RWF">FRw (RWF)</option>
                    <option value="ZAR">R (ZAR)</option>
                  </select>
                </div>

                <div className="divider"></div>

                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "8px" }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={savePlatformSettings}
                  >
                    <i className="fas fa-save"></i> Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Tab Content */}
      {activeMainTab === "plans" && (
        <div className="section-wrap" style={{ marginTop: 0 }}>
          <div className="section-header open">
            <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-800"><i className="fas fa-tags text-emerald-600"></i> Pricing Plan Management</div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {pricingPlans.length === 0 ? (
                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); initializeDefaultPlans(); }}><i className="fas fa-magic"></i> Initialize Default Plans</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); openCreatePlanModal(); }}><i className="fas fa-plus"></i> Create Plan</button>
              )}
            </div>
          </div>
          <div className="section-body open">
            <div className="pricing-grid">
              {pricingPlans.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px", color: "var(--text-3)", background: "var(--card)", borderRadius: "var(--radius)", border: "2px dashed var(--border)" }}>
                  <i className="fas fa-cube" style={{ fontSize: "48px", marginBottom: "16px", color: "var(--primary)" }}></i>
                  <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No Pricing Plans Yet</p>
                  <p style={{ fontSize: "13px", marginBottom: "20px" }}>Click "Initialize Default Plans" to create the default pricing plans.</p>
                  <button className="btn btn-primary" onClick={initializeDefaultPlans}>
                    <i className="fas fa-magic"></i> Initialize Default Plans
                  </button>
                </div>
              ) : (
                pricingPlans.map((plan) => (
                  <div key={plan.id} className={`plan-card ${plan.isPopular ? "popular" : ""} ${!plan.isActive ? "opacity-60" : ""}`}>
                    <div className="plan-name">
                      <i className={`fas ${
                        plan.slug === "free" ? "fa-seedling" :
                        plan.slug === "starter" ? "fa-rocket" :
                        plan.slug === "pro" ? "fa-star" : "fa-crown"
                      }`} style={{
                        color: plan.slug === "free" ? "var(--text-3)" :
                               plan.slug === "starter" ? "var(--warning)" :
                               plan.slug === "pro" ? "var(--info)" : "var(--purple)",
                        marginRight: "5px"
                      }}></i>
                      {plan.name}
                      {!plan.isActive && <span className="badge badge-free" style={{ marginLeft: "8px", fontSize: "10px" }}>Inactive</span>}
                    </div>
                    <div className="plan-price"><sup>{plan.currency}</sup>{plan.price.toLocaleString()}<span>/{plan.billingPeriod}</span></div>
                    <div className="plan-tenants"><strong>{getPlanTenantCount(plan.slug)}</strong> active tenants</div>
                    {plan.description && <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "10px" }}>{plan.description}</p>}
                    <ul className="plan-features">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className={feature.included ? "" : "off"}>
                          <i className={feature.included ? "fas fa-check" : "fas fa-times"}></i>
                          {feature.name}
                          {feature.limit && feature.included && <span style={{ color: "var(--text-3)", marginLeft: "4px" }}>({feature.limit})</span>}
                        </li>
                      ))}
                    </ul>
                    <div className="plan-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => openPlanEditModal(plan)}><i className="fas fa-pen"></i> Edit</button>
                      <div className={`toggle ${plan.isActive ? "on" : ""}`} onClick={(e) => { e.stopPropagation(); togglePlanStatus(plan); }}></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Plan Change Modal */}
      {bulkPlanModalOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) { setBulkPlanModalOpen(false); } }}>
          <div className="modal" style={{ maxWidth: "460px" }}>
            <div className="modal-header-premium">
              <h3><i className="fas fa-tags"></i> Change Plan for {selectedRows.length} Tenants</h3>
              <button className="modal-close" onClick={() => setBulkPlanModalOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "13px", color: "var(--text-2)", marginBottom: "16px" }}>
                Select the new plan to apply to <strong>{selectedRows.length} selected tenant(s)</strong>.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {["free", "starter", "pro", "enterprise"].map((plan) => (
                  <div
                    key={plan}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 16px",
                      borderRadius: "12px",
                      border: `2px solid ${bulkPlanTarget === plan ? 'var(--primary)' : 'var(--border)'}`,
                      background: bulkPlanTarget === plan ? 'var(--primary-xlight)' : 'white',
                      cursor: "pointer",
                      transition: "var(--transition)",
                    }}
                    onClick={() => setBulkPlanTarget(plan as any)}
                  >
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      border: `2px solid ${bulkPlanTarget === plan ? 'var(--primary)' : 'var(--border)'}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      {bulkPlanTarget === plan && (
                        <div style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "var(--primary)",
                        }}></div>
                      )}
                    </div>
                    <i className={`fas fa-${
                      plan === "free" ? "seedling" :
                      plan === "starter" ? "rocket" :
                      plan === "pro" ? "star" : "crown"
                    }`} style={{
                      color: plan === "free" ? "var(--text-3)" :
                             plan === "starter" ? "var(--warning)" :
                             plan === "pro" ? "var(--info)" : "var(--purple)",
                      fontSize: "16px",
                      width: "24px",
                    }}></i>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
                        {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
                        {plan === "free" ? "KSh 0/mo" :
                         plan === "starter" ? "KSh 999/mo" :
                         plan === "pro" ? "KSh 2,999/mo" : "KSh 9,999/mo"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button className="btn btn-secondary" onClick={() => setBulkPlanModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={bulkChangePlan}>
                  <i className="fas fa-check"></i> Apply {bulkPlanTarget.charAt(0).toUpperCase() + bulkPlanTarget.slice(1)} Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Tenant Dialog */}
      <AddTenantDialog
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => showToast("success", "Success", "New tenant added successfully")}
      />

      {/* Create Plan Modal */}
      {createPlanModalOpen && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeCreatePlanModal(); }}>
          <div className="modal" style={{ maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}>
            <div className="modal-header-premium">
              <h3><i className="fas fa-plus"></i> Create New Plan</h3>
              <button className="modal-close" onClick={closeCreatePlanModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plan Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={createPlanForm.name}
                      onChange={(e) => setCreatePlanForm({ ...createPlanForm, name: e.target.value })}
                      placeholder="e.g. Premium"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plan Slug</label>
                    <input
                      type="text"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={createPlanForm.slug}
                      onChange={(e) => setCreatePlanForm({ ...createPlanForm, slug: e.target.value })}
                      placeholder="e.g. premium"
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Price (KSh)</label>
                    <input
                      type="number"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={createPlanForm.price}
                      onChange={(e) => setCreatePlanForm({ ...createPlanForm, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Currency</label>
                    <input
                      type="text"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value="KSh"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</label>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ width: "100%", height: "40px" }}
                    value={createPlanForm.description}
                    onChange={(e) => setCreatePlanForm({ ...createPlanForm, description: e.target.value })}
                    placeholder="Brief description of the plan"
                  />
                </div>
                <div style={{ display: "flex", gap: "24px", padding: "12px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      className={`toggle ${createPlanForm.isActive ? "on" : ""}`}
                      onClick={() => setCreatePlanForm({ ...createPlanForm, isActive: !createPlanForm.isActive })}
                    ></div>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{createPlanForm.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      className={`toggle ${createPlanForm.isPopular ? "on" : ""}`}
                      onClick={() => setCreatePlanForm({ ...createPlanForm, isPopular: !createPlanForm.isPopular })}
                    ></div>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>Mark as Popular</span>
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Features</label>
                  {createPlanForm.features.map((feature, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", padding: "10px", background: "var(--bg)", borderRadius: "8px" }}>
                      <div
                        className={`toggle ${feature.included ? "on" : ""}`}
                        onClick={() => {
                          const newFeatures = [...createPlanForm.features];
                          newFeatures[idx].included = !feature.included;
                          setCreatePlanForm({ ...createPlanForm, features: newFeatures });
                        }}
                      ></div>
                      <span style={{ fontSize: "13px", fontWeight: 500, flex: 1 }}>{feature.name}</span>
                      {feature.included && feature.limit !== undefined && (
                        <input
                          type="text"
                          className="settings-input"
                          style={{ width: "80px", height: "32px" }}
                          value={feature.limit}
                          onChange={(e) => {
                            const newFeatures = [...createPlanForm.features];
                            newFeatures[idx].limit = e.target.value;
                            setCreatePlanForm({ ...createPlanForm, features: newFeatures });
                          }}
                          placeholder="Limit"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button className="btn btn-secondary" onClick={closeCreatePlanModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveNewPlan}><i className="fas fa-save"></i> Create Plan</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {planEditModalOpen && editingPlan && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closePlanEditModal(); }}>
          <div className="modal" style={{ maxWidth: "500px" }}>
            <div className="modal-header-premium">
              <h3><i className="fas fa-pen"></i> Edit Pricing Plan</h3>
              <button className="modal-close" onClick={closePlanEditModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plan Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ width: "100%", height: "40px" }}
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Price (KSh)</label>
                    <input
                      type="number"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Currency</label>
                    <input
                      type="text"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value="KSh"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Description</label>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ width: "100%", height: "40px" }}
                    value={planForm.description}
                    onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                    placeholder="Brief description of the plan"
                  />
                </div>
                <div style={{ display: "flex", gap: "24px", padding: "12px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      className={`toggle ${planForm.isActive ? "on" : ""}`}
                      onClick={() => setPlanForm({ ...planForm, isActive: !planForm.isActive })}
                    ></div>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>{planForm.isActive ? "Active" : "Inactive"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      className={`toggle ${planForm.isPopular ? "on" : ""}`}
                      onClick={() => setPlanForm({ ...planForm, isPopular: !planForm.isPopular })}
                    ></div>
                    <span style={{ fontSize: "13px", fontWeight: 500 }}>Mark as Popular</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button className="btn btn-secondary" onClick={closePlanEditModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={savePlanChanges}><i className="fas fa-save"></i> Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Modal */}
      {editModalOpen && editingTenant && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div className="modal" style={{ maxWidth: "600px" }}>
            <div className="modal-header-premium">
              <h3><i className="fas fa-pen"></i> Edit Tenant</h3>
              <button className="modal-close" onClick={closeEditModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Business Name</label>
                  <input
                    type="text"
                    className="settings-input"
                    style={{ width: "100%", height: "40px" }}
                    value={editForm.businessName}
                    onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Owner Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Email</label>
                    <input
                      type="email"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone</label>
                    <input
                      type="text"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Country</label>
                    <input
                      type="text"
                      className="settings-input"
                      style={{ width: "100%", height: "40px" }}
                      value={editForm.country}
                      onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Plan</label>
                    <select
                      className="tb-select"
                      style={{ width: "100%", height: "40px" }}
                      value={editForm.plan}
                      onChange={(e) => setEditForm({ ...editForm, plan: e.target.value as "free" | "starter" | "pro" | "enterprise" })}
                    >
                      <option value="free">Free</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</label>
                    <select
                      className="tb-select"
                      style={{ width: "100%", height: "40px" }}
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as "active" | "suspended" | "pending" })}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Category</label>
                    <select
                      className="tb-select"
                      style={{ width: "100%", height: "40px" }}
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value as "products" | "services" | "both" })}
                    >
                      <option value="products">Products</option>
                      <option value="services">Services</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>
                {editForm.plan === "free" && (
                  <div style={{ marginTop: "16px", padding: "12px", background: "var(--bg)", borderRadius: "10px", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <i className="fas fa-seedling" style={{ color: "var(--primary-dark)", fontSize: "14px" }}></i>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>Free Trial Setup</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Trial Duration (Days)</label>
                        <input
                          type="number"
                          className="settings-input"
                          style={{ width: "100%", height: "40px" }}
                          min={1}
                          max={365}
                          value={editForm.trialDays}
                          onChange={(e) => setEditForm({ ...editForm, trialDays: Math.max(1, Math.min(365, parseInt(e.target.value) || 14)) })}
                        />
                      </div>
                      <div style={{ flex: 1, paddingTop: "22px" }}>
                        <div style={{ fontSize: "12px", color: "var(--text-3)" }}>
                          <i className="fas fa-info-circle" style={{ marginRight: "4px" }}></i>
                          Account will auto-suspend after trial period
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "10px" }}>
                  <button className="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveTenantEdit}><i className="fas fa-save"></i> Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Detail Modal */}
      {modalOpen && selectedTenant && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="modal">
            <div className="modal-header-premium">
              <h3><i className="fas fa-store"></i> Tenant Details</h3>
              <button className="modal-close" onClick={closeModal}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body">
              <div className="modal-2col">
                {/* Left */}
                <div className="modal-left">
                  <div className={`modal-avatar ${selectedTenant.grad}`}>{selectedTenant.initials}</div>
                  <div className="modal-biz-name">{selectedTenant.name}</div>
                  <div className="modal-owner">{selectedTenant.owner}</div>
                  <div className="modal-meta">
                    <div className="modal-meta-row"><i className="fab fa-whatsapp"></i> <span>{selectedTenant.phone}</span></div>
                    <div className="modal-meta-row"><i className="fas fa-calendar"></i> <span>Member since {selectedTenant.createdAt?.toDate ? selectedTenant.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : new Date(selectedTenant.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span></div>
                    <div className="modal-meta-row"><i className="fas fa-clock"></i> <span>Active {formatRelativeTime(selectedTenant.lastActive)}</span></div>
                    <div className="modal-meta-row"><i className="fas fa-tag"></i> <span>{planBadges[selectedTenant.plan]}</span></div>
                  </div>
                  <div className="ver-toggle">
                    <div className="toggle on"></div>
                    <span>Verified</span>
                  </div>
                  <button className="btn btn-primary btn-sm open-chat-btn" onClick={() => showToast("success", "WhatsApp Chat", "Opening WhatsApp conversation...")}>
                    <i className="fab fa-whatsapp"></i> Open Chat
                  </button>
                  <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "5px", justifyContent: "center" }}>
                    {catBadges[selectedTenant.cat || "both"]}
                  </div>
                </div>

                {/* Right Tabs */}
                <div>
                  <div className="m-tabs">
                    <div className={`m-tab ${activeModalTab === "overview" ? "active" : ""}`} onClick={() => setActiveModalTab("overview")}>Overview</div>
                    <div className={`m-tab ${activeModalTab === "billing" ? "active" : ""}`} onClick={() => setActiveModalTab("billing")}>Billing</div>
                    <div className={`m-tab ${activeModalTab === "features" ? "active" : ""}`} onClick={() => setActiveModalTab("features")}>Features</div>
                    <div className={`m-tab ${activeModalTab === "activity" ? "active" : ""}`} onClick={() => setActiveModalTab("activity")}>Activity</div>
                  </div>

                  {/* Overview Tab */}
                  <div className={`m-tab-content ${activeModalTab === "overview" ? "active" : ""}`}>
                    <div className="info-row"><span className="info-label">Current Plan</span><span className="info-val">{planBadges[selectedTenant.plan]}</span></div>
                    <div className="info-row"><span className="info-label">Monthly Revenue</span><span className="info-val">{(selectedTenant.rev || 0) > 0 ? `KSh ${(selectedTenant.rev || 0).toLocaleString()}` : "KSh 0 (Free)"}</span></div>
                    {loadingStats ? (
                      <div style={{ textAlign: "center", padding: "20px" }}><i className="fas fa-spinner fa-spin"></i> Loading stats...</div>
                    ) : tenantStats ? (
                      <>
                        <div className="info-row"><span className="info-label">Total Orders</span><span className="info-val">{tenantStats.totalOrders.toLocaleString()}</span></div>
                        <div className="info-row"><span className="info-label">Total Customers</span><span className="info-val">{tenantStats.totalCustomers.toLocaleString()}</span></div>
                        <div className="info-row"><span className="info-label">Total Revenue</span><span className="info-val" style={{ color: "var(--success)" }}>KSh {tenantStats.totalRevenue.toLocaleString()}</span></div>
                        <div className="info-row"><span className="info-label">Pending Orders</span><span className="info-val">{tenantStats.pendingOrders}</span></div>
                        <div className="info-row"><span className="info-label">Completed Orders</span><span className="info-val">{tenantStats.completedOrders}</span></div>
                      </>
                    ) : (
                      <>
                        <div className="info-row"><span className="info-label">Total Orders</span><span className="info-val">-</span></div>
                        <div className="info-row"><span className="info-label">Total Customers</span><span className="info-val">-</span></div>
                      </>
                    )}
                    <div className="info-row"><span className="info-label">Subscription Status</span><span className="info-val">{statusPills[selectedTenant.status || "pending"]}</span></div>
                    <div className="divider"></div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <select
                        className="tb-select"
                        value={selectedTenant.plan}
                        onChange={(e) => changePlan(selectedTenant, e.target.value as "free" | "starter" | "pro" | "enterprise")}
                        style={{ height: "32px" }}
                      >
                        <option value="free">Free Plan</option>
                        <option value="starter">Starter Plan</option>
                        <option value="pro">Pro Plan</option>
                        <option value="enterprise">Enterprise Plan</option>
                      </select>
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleTenantStatus(selectedTenant)}>
                        <i className={selectedTenant.status === "active" ? "fas fa-pause" : "fas fa-play"}></i> {selectedTenant.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </div>

                  {/* Billing Tab */}
                  <div className={`m-tab-content ${activeModalTab === "billing" ? "active" : ""}`}>
                    <div className="info-row"><span className="info-label">Billing Cycle</span><span className="info-val">Monthly</span></div>
                    <div className="info-row"><span className="info-label">Next Billing</span><span className="info-val">June 1, 2026 (8 days)</span></div>
                    <div className="info-row"><span className="info-label">Payment Method</span><span className="info-val"><i className="fas fa-credit-card" style={{ color: "var(--info)" }}></i> Visa ••••4821</span></div>
                    <div className="info-row"><span className="info-label">Total Paid (All Time)</span><span className="info-val" style={{ color: "var(--success)" }}>KSh 14,400</span></div>
                    <div className="divider"></div>
                    <p style={{ fontSize: "12.5px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Invoice History</p>
                    <table className="inv-table">
                      <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th></th></tr></thead>
                      <tbody>
                        <tr><td>May 1, 2026</td><td>KSh 2,999</td><td><span className="badge badge-products" style={{ fontSize: "10.5px" }}>Paid</span></td><td><button className="btn btn-xs btn-secondary" onClick={() => showToast("info", "Download", "Downloading invoice PDF...")}><i className="fas fa-download"></i></button></td></tr>
                        <tr><td>Apr 1, 2026</td><td>KSh 2,999</td><td><span className="badge badge-products" style={{ fontSize: "10.5px" }}>Paid</span></td><td><button className="btn btn-xs btn-secondary" onClick={() => showToast("info", "Download", "Downloading invoice PDF...")}><i className="fas fa-download"></i></button></td></tr>
                        <tr><td>Mar 1, 2026</td><td>KSh 2,999</td><td><span className="badge badge-products" style={{ fontSize: "10.5px" }}>Paid</span></td><td><button className="btn btn-xs btn-secondary" onClick={() => showToast("info", "Download", "Downloading invoice PDF...")}><i className="fas fa-download"></i></button></td></tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Features Tab */}
                  <div className={`m-tab-content ${activeModalTab === "features" ? "active" : ""}`}>
                    <div className="feat-toggle-row">
                      <div><div className="feat-name">AI Assistant</div><div className="feat-desc">Automated customer conversations</div></div>
                      <div className="toggle on" onClick={() => showToast("success", "Feature Updated", "AI Assistant toggled.")}></div>
                    </div>
                    <div className="feat-toggle-row">
                      <div><div className="feat-name">Bulk Messaging</div><div className="feat-desc">Send broadcasts to all customers</div></div>
                      <div className="toggle on"></div>
                    </div>
                    <div className="feat-toggle-row">
                      <div><div className="feat-name">Analytics Dashboard</div><div className="feat-desc">Sales reports and insights</div></div>
                      <div className="toggle on"></div>
                    </div>
                    <div className="feat-toggle-row">
                      <div><div className="feat-name">API Access</div><div className="feat-desc">Programmatic access to data</div></div>
                      <div className="toggle" onClick={() => showToast("warning", "Feature Updated", "API access requires Enterprise plan.")}></div>
                    </div>
                    <div className="feat-toggle-row">
                      <div><div className="feat-name">Custom Domain</div><div className="feat-desc">Use tenant's own domain</div></div>
                      <div className="toggle"></div>
                    </div>
                    <div className="divider"></div>
                    <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" }}>Usage Limits</p>
                    <div className="usage-bar-wrap">
                      <div className="usage-label"><span>Messages Sent</span><span>8,450 / 10,000</span></div>
                      <div className="usage-track"><div className="usage-fill fill-orange" style={{ width: "84.5%" }}></div></div>
                    </div>
                    <div className="usage-bar-wrap">
                      <div className="usage-label"><span>Products Listed</span><span>45 / 100</span></div>
                      <div className="usage-track"><div className="usage-fill fill-green" style={{ width: "45%" }}></div></div>
                    </div>
                    <div className="usage-bar-wrap">
                      <div className="usage-label"><span>Storage Used</span><span>2.1 GB / 5 GB</span></div>
                      <div className="usage-track"><div className="usage-fill fill-green" style={{ width: "42%" }}></div></div>
                    </div>
                  </div>

                  {/* Activity Tab */}
                  <div className={`m-tab-content ${activeModalTab === "activity" ? "active" : ""}`}>
                    {loadingLogs ? (
                      <div style={{ textAlign: "center", padding: "40px" }}><i className="fas fa-spinner fa-spin"></i> Loading activity...</div>
                    ) : activityLogs.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)" }}>
                        <i className="fas fa-clock-rotate-left" style={{ fontSize: "24px", marginBottom: "8px", display: "block" }}></i>
                        No activity logs yet.
                      </div>
                    ) : (
                      <div className="timeline">
                        {activityLogs.map((log) => (
                          <div className="tl-item" key={log.id}>
                            <div className={`tl-dot tl-dot-${log.action?.includes("Error") || log.action?.includes("Delete") ? "red" : log.action?.includes("Update") || log.action?.includes("Edit") ? "orange" : log.action?.includes("Create") || log.action?.includes("Add") ? "green" : "blue"}`}></div>
                            <div className="tl-time">
                              {log.createdAt?.toDate?.() ? log.createdAt.toDate().toLocaleString() : new Date().toLocaleString()}
                            </div>
                            <div className="tl-text">{log.action}</div>
                            <div className="tl-meta">{log.details}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ marginTop: "14px" }}>
                      <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Admin Notes</p>
                      <textarea
                        style={{ width: "100%", minHeight: "80px", padding: "10px 12px", border: "1.5px solid var(--border)", borderRadius: "9px", fontFamily: "inherit", fontSize: "12.5px", color: "var(--text)", resize: "vertical", outline: "none" }}
                        placeholder="Add internal admin notes about this tenant..."
                        value={tenantNotes}
                        onChange={(e) => setTenantNotes(e.target.value)}
                      ></textarea>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: "8px" }} onClick={saveAdminNote}><i className="fas fa-save"></i> Save Note</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
    </AdminProtection>
  );
}
