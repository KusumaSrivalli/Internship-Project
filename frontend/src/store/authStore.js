import { create } from 'zustand';
import { authApi } from '../api/services';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('tf_token'),
  isLoading: true,
  error: null,

  initialize: async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) return set({ isLoading: false });
    try {
      const { user } = await authApi.me();
      set({ user, token, isLoading: false });
    } catch {
      localStorage.removeItem('tf_token');
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ error: null });
    try {
      const { user, token } = await authApi.login({ email, password });
      localStorage.setItem('tf_token', token);
      set({ user, token, error: null });
      return { success: true };
    } catch (err) {
      const msg = err.error || 'Login failed';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  signup: async (email, username, password) => {
    set({ error: null });
    try {
      const { user, token } = await authApi.signup({ email, username, password });
      localStorage.setItem('tf_token', token);
      set({ user, token, error: null });
      return { success: true };
    } catch (err) {
      const msg = err.error || 'Signup failed';
      set({ error: msg });
      return { success: false, error: msg };
    }
  },

  logout: () => {
    localStorage.removeItem('tf_token');
    set({ user: null, token: null });
  },
}));

export default useAuthStore;