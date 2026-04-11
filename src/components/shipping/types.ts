export interface ShippingFormData {
  orderId: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  country: string;
  deliveryType: string;
  notes: string;
}

export interface ShippingCardProps {
  label: string;
  value: number | string;
  icon: string;
  change?: string;
  color: "pending" | "transit" | "delivered" | "returns";
}

export interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ShippingFormData) => void;
  formData: ShippingFormData;
  onUpdateField: (field: string, value: string) => void;
}

export interface ShippingToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  carrierFilter: string;
  onCarrierFilterChange: (carrier: string) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export interface ShippingStatsProps {
  pending: number;
  inTransit: number;
  delivered: number;
  returns: number;
  onTimeRate: number;
  avgDays: number;
  activeDrivers: number;
  todayRevenue: number;
}

export const carrierOptions = [
  { value: "g4s", label: "G4S Kenya", icon: "G4" },
  { value: "sendy", label: "Sendy", icon: "SD" },
  { value: "bolt", label: "Bolt Delivery", icon: "BL" },
  { value: "inhouse", label: "In-House", icon: "IH" },
];

export const deliveryTypeOptions = [
  { value: "same_day", label: "Same Day Delivery", icon: "fa-motorcycle" },
  { value: "express", label: "Express Delivery", icon: "fa-bolt" },
  { value: "standard", label: "Standard Delivery", icon: "fa-truck" },
];

export const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "In Transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const getStatusLabel = (status: string): string => statusLabels[status] || status;
