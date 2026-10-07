import api from './api';

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get('/api/wishlist');
    return response.data;
  },

  addToWishlist: async (productId) => {
    const response = await api.post(`/api/wishlist/${productId}`);
    return response.data;
  },

  removeFromWishlist: async (productId) => {
    const response = await api.delete(`/api/wishlist/${productId}`);
    return response.data;
  },

  checkWishlisted: async (productId) => {
    const response = await api.get(`/api/wishlist/check/${productId}`);
    return response.data.wishlisted;
  },
};
