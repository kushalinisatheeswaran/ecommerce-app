import api from './api';

export const orderService = {
  createOrder: async () => {
    const response = await api.post('/api/orders');
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get('/api/orders');
    return response.data;
  },
};

