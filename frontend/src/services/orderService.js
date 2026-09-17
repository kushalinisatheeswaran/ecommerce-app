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
};
