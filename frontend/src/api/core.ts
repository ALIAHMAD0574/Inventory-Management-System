import axiosInstance from './axios';

export const coreApi = {
  getDashboardStats: async () => {
    const response = await axiosInstance.get('/core/dashboard-stats/');
    return response.data;
  },
};
