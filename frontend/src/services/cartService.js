import api from './api';

export const cartService = {
  getCart: async () => {
    const response = await api.get('/api/cart');
    return response.data;
  },

  addToCart: async (productId, quantity) => {
    const response = await api.post('/api/cart', { productId, quantity });
    return response.data;
  },

  removeFromCart: async (productId) => {
    const response = await api.delete(`/api/cart/items/${productId}`);
    return response.data;
  },

  updateCartQuantity: async (productId, quantity) => {
    const response = await api.put(`/api/cart/items/${productId}`, null, {
      params: { quantity }
    });
    return response.data;
  },
};

