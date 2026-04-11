import { Supplier } from "@/lib/db";

export interface SupplierFormData {
  companyName: string;
  category: string;
  regNumber: string;
  taxId: string;
  contactPerson: string;
  position: string;
  phone: string;
  whatsapp: string;
  email: string;
  altPhone: string;
  address: string;
  city: string;
  country: string;
  products: string;
  paymentTerms: string;
  leadTime: string;
  minOrder: string;
  currency: string;
  deliveryMethod: string;
  notes: string;
}

export interface SupplierCardProps {
  supplier: Supplier;
  onView: (supplier: Supplier) => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
}

export interface AddSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: SupplierFormData;
  onUpdateField: (field: string, value: string) => void;
  currentStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
  onGoToStep: (step: number) => void;
}

export interface ViewSupplierModalProps {
  isOpen: boolean;
  supplier: Supplier | null;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplierId: string) => void;
}

export interface SupplierStatsProps {
  total: number;
  active: number;
  pending: number;
  rating: number;
}

export interface SuppliersToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onRefresh: () => void;
}

export interface SupplierCategoryTabsProps {
  activeCategory: string;
  onFilter: (category: string) => void;
  count: number;
}

export const categoryLogos: Record<string, string> = {
  fashion: "👔",
  electronics: "💻",
  home: "🏠",
  beauty: "💄",
  sports: "⚽",
  general: "📦",
  other: "📦",
};

export const categoryNames: Record<string, string> = {
  fashion: "Fashion",
  electronics: "Electronics",
  home: "Home",
  beauty: "Beauty",
  sports: "Sports",
  general: "General",
  other: "Other",
};

export const getPaymentTermsLabel = (terms?: string): string => {
  const labels: Record<string, string> = {
    cod: "Cash on Delivery",
    net15: "Net 15",
    net30: "Net 30",
    net60: "Net 60",
    prepaid: "Prepaid",
  };
  return labels[terms || "cod"] || terms || "COD";
};
