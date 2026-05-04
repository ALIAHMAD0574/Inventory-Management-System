import axiosInstance from './axios';
import type { User } from '../types';

interface LoginResponse {
  access: string;
  refresh: string;
}

export const authApi = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const response = await axiosInstance.post('/token/', credentials);
    return response.data;
  },
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosInstance.get('/users/users/me/');
    return response.data;
  },
};
