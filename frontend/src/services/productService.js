import api from './api';

export const productService = {
  getProducts: async (page = 0, size = 10, sort = 'price,asc') => {
    const response = await api.get(`/api/products`, {
      params: { page, size, sort },
    });
    return response.data;
  },

  getProductById: async (id) => {
    // Client-side filtering as fallback since backend lacks single product GET endpoint
    const response = await api.get('/api/products', { params: { size: 1000 } });
    const products = response.data.content || [];
    return products.find((p) => String(p.id) === String(id));
  },

  searchProducts: async (keyword) => {
    const response = await api.get('/api/products/search', {
      params: { keyword },
    });
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/api/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/api/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/api/products/${id}`);
    return response.data;
  },
};
