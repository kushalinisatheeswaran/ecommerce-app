import api from './api';

export const orderService = {
  createOrder: async (orderData) => {
    const response = await api.post('/api/orders', orderData);
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/api/orders');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  getAllAdminOrders: async (params = {}) => {
    const response = await api.get('/api/admin/orders', { params });
    return response.data;
  },

  getAdminOrderById: async (id) => {
    const response = await api.get(`/api/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/api/admin/orders/${id}/status`, { status });
    return response.data;
  },

  updatePaymentStatus: async (id, paymentStatus) => {
    const response = await api.patch(`/api/admin/orders/${id}/payment-status`, { paymentStatus });
    return response.data;
  },
};
