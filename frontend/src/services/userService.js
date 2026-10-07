import api from './api';

export const userService = {
  getCurrentProfile: async () => {
    const response = await api.get('/api/users/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await api.put('/api/users/me/profile', profileData);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/api/users/me/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
