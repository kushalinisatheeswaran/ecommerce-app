import api from './api';

export const productService = {
  getProducts: async (options = {}) => {
    let params = {};
    if (typeof options === 'number') {
      const page = arguments[0] ?? 0;
      const size = arguments[1] ?? 12;
      const sort = arguments[2] ?? 'id,asc';
      params = { page, size, sort };
    } else {
      const { search, category, minPrice, maxPrice, sort, page = 0, size = 12 } = options;
      params = {
        ...(search ? { search } : {}),
        ...(category ? { category } : {}),
        ...(minPrice !== undefined && minPrice !== '' ? { minPrice } : {}),
        ...(maxPrice !== undefined && maxPrice !== '' ? { maxPrice } : {}),
        ...(sort ? { sort } : {}),
        page,
        size,
      };
    }
    const response = await api.get(`/api/products`, { params });
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/api/products/categories');
    return response.data;
  },

  getProductById: async (id) => {
    const response = await api.get(`/api/products/${id}`);
    return response.data;
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
