export interface User {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'employee' | 'platform_admin';
  companyId: string;
  avatarUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  responsibleName?: string;
  cnpj?: string;
  phone?: string;
  email: string;
  planId: string;
  maxProducts: number;
  maxUsers: number;
  status: 'active' | 'inactive' | 'past_due' | 'canceled';
  deactivatedAt?: string | null;
  adminNotes?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  targetCompanyId: string;
  targetCompanyName: string;
  action: 'deactivate_company' | 'reactivate_company' | 'delete_company' | 'register_company';
  details: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  maxProducts: number;
  maxUsers: number;
  billingCycle: string;
  features: string[];
}

export interface Product {
  id: string;
  companyId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  unit: string;
  quantity: number;
  minStock: number;
  costPrice: number;
  salePrice: number;
  supplierId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  companyId: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  companyId: string;
  productId: string;
  type: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalQuantity: number;
  totalCostValue: number;
  totalSaleValue: number;
  potentialProfit: number;
  marginPercent: number;
  lowStockCount: number;
  outOfStockCount: number;
  entriesThisMonth: number;
  exitsThisMonth: number;
}
