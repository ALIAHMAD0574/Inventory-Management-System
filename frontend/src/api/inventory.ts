import axiosInstance from './axios';
import type { Product, Category, Warehouse, Stock, StockMovement, PaginatedResponse } from '../types';

export const inventoryApi = {
  // Products
  getProducts: async (page = 1): Promise<PaginatedResponse<Product>> => {
    const response = await axiosInstance.get(`/inventory/products/?page=${page}`);
    return response.data;
  },
  getProduct: async (id: number): Promise<Product> => {
    const response = await axiosInstance.get(`/inventory/products/${id}/`);
    return response.data;
  },
  createProduct: async (data: any): Promise<Product> => {
    const response = await axiosInstance.post('/inventory/products/', data);
    return response.data;
  },
  updateProduct: async (id: number, data: any): Promise<Product> => {
    const response = await axiosInstance.patch(`/inventory/products/${id}/`, data);
    return response.data;
  },
  deleteProduct: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/inventory/products/${id}/`);
  },

  // Categories
  getCategories: async (page = 1): Promise<PaginatedResponse<Category>> => {
    const response = await axiosInstance.get(`/inventory/categories/?page=${page}`);
    return response.data;
  },
  createCategory: async (data: any): Promise<Category> => {
    const response = await axiosInstance.post('/inventory/categories/', data);
    return response.data;
  },
  updateCategory: async (id: number, data: any): Promise<Category> => {
    const response = await axiosInstance.patch(`/inventory/categories/${id}/`, data);
    return response.data;
  },
  deleteCategory: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/inventory/categories/${id}/`);
  },

  // Warehouses
  getWarehouses: async (page = 1): Promise<PaginatedResponse<Warehouse>> => {
    const response = await axiosInstance.get(`/inventory/warehouses/?page=${page}`);
    return response.data;
  },
  createWarehouse: async (data: any): Promise<Warehouse> => {
    const response = await axiosInstance.post('/inventory/warehouses/', data);
    return response.data;
  },
  updateWarehouse: async (id: number, data: any): Promise<Warehouse> => {
    const response = await axiosInstance.patch(`/inventory/warehouses/${id}/`, data);
    return response.data;
  },
  deleteWarehouse: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/inventory/warehouses/${id}/`);
  },

  // Stock
  getStock: async (page = 1): Promise<PaginatedResponse<Stock>> => {
    const response = await axiosInstance.get(`/inventory/stocks/?page=${page}`);
    return response.data;
  },
  getStockByProductAndWarehouse: async (productId: number, warehouseId: number): Promise<Stock | null> => {
    const response = await axiosInstance.get(`/inventory/stocks/?product=${productId}&warehouse=${warehouseId}`);
    return response.data.results[0] || null;
  },

  // Stock Movements
  getStockMovements: async (page = 1): Promise<PaginatedResponse<StockMovement>> => {
    const response = await axiosInstance.get(`/inventory/movements/?page=${page}`);
    return response.data;
  },
  createStockMovement: async (data: any): Promise<StockMovement> => {
    const response = await axiosInstance.post('/inventory/movements/', data);
    return response.data;
  },
};
