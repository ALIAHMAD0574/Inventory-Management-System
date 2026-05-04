import axiosInstance from './axios';
import type { Supplier, Customer, PurchaseOrder, SalesOrder, PaginatedResponse } from '../types';

export const ordersApi = {
  // Suppliers
  getSuppliers: async (page = 1): Promise<PaginatedResponse<Supplier>> => {
    const response = await axiosInstance.get(`/orders/suppliers/?page=${page}`);
    return response.data;
  },
  createSupplier: async (data: any): Promise<Supplier> => {
    const response = await axiosInstance.post('/orders/suppliers/', data);
    return response.data;
  },
  updateSupplier: async (id: number, data: any): Promise<Supplier> => {
    const response = await axiosInstance.patch(`/orders/suppliers/${id}/`, data);
    return response.data;
  },
  deleteSupplier: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/orders/suppliers/${id}/`);
  },

  // Customers
  getCustomers: async (page = 1): Promise<PaginatedResponse<Customer>> => {
    const response = await axiosInstance.get(`/orders/customers/?page=${page}`);
    return response.data;
  },
  createCustomer: async (data: any): Promise<Customer> => {
    const response = await axiosInstance.post('/orders/customers/', data);
    return response.data;
  },
  updateCustomer: async (id: number, data: any): Promise<Customer> => {
    const response = await axiosInstance.patch(`/orders/customers/${id}/`, data);
    return response.data;
  },
  deleteCustomer: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/orders/customers/${id}/`);
  },

  // Purchase Orders
  getPurchaseOrders: async (page = 1): Promise<PaginatedResponse<PurchaseOrder>> => {
    const response = await axiosInstance.get(`/orders/purchase-orders/?page=${page}`);
    return response.data;
  },
  createPurchaseOrder: async (data: any): Promise<PurchaseOrder> => {
    const response = await axiosInstance.post('/orders/purchase-orders/', data);
    return response.data;
  },
  updatePurchaseOrder: async (id: number, data: any): Promise<PurchaseOrder> => {
    const response = await axiosInstance.patch(`/orders/purchase-orders/${id}/`, data);
    return response.data;
  },
  deletePurchaseOrder: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/orders/purchase-orders/${id}/`);
  },

  // Sales Orders
  getSalesOrders: async (page = 1): Promise<PaginatedResponse<SalesOrder>> => {
    const response = await axiosInstance.get(`/orders/sales-orders/?page=${page}`);
    return response.data;
  },
  createSalesOrder: async (data: any): Promise<SalesOrder> => {
    const response = await axiosInstance.post('/orders/sales-orders/', data);
    return response.data;
  },
  updateSalesOrder: async (id: number, data: any): Promise<SalesOrder> => {
    const response = await axiosInstance.patch(`/orders/sales-orders/${id}/`, data);
    return response.data;
  },
  deleteSalesOrder: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/orders/sales-orders/${id}/`);
  },

  // Analytics
  getAnalytics: async (period: string): Promise<any[]> => {
    const response = await axiosInstance.get(`/orders/analytics/?period=${period}`);
    return response.data;
  },
};
