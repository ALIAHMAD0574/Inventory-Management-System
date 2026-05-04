export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: 'admin' | 'manager' | 'viewer';
  description: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: number;
  role_name: string;
  tenant: number;
  tenant_name: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  tenant: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  category: number;
  category_name: string;
  price: string;
  purchase_price: string;
  is_active: boolean;
  tenant: number;
}

export interface Warehouse {
  id: number;
  name: string;
  location: string;
  is_active: boolean;
  tenant: number;
}

export interface Stock {
  id: number;
  product: number;
  product_name: string;
  warehouse: number;
  warehouse_name: string;
  quantity: number;
  min_stock_level: number;
}

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  warehouse: number;
  warehouse_name: string;
  movement_type: 'IN' | 'OUT';
  quantity: number;
  reference_number: string;
  notes: string;
  created_at: string;
  created_by_name: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface Customer {
  id: number;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  is_active: boolean;
}

export interface OrderItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: string;
  total_price?: string;
}

export interface PurchaseOrder {
  id: number;
  order_number: string;
  supplier: number;
  supplier_name: string;
  warehouse: number;
  warehouse_name: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  total_amount: string;
  items: OrderItem[];
  date: string;
}

export interface SalesOrder {
  id: number;
  order_number: string;
  customer: number;
  customer_name: string;
  warehouse: number;
  warehouse_name: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  total_amount: string;
  items: OrderItem[];
  date: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
