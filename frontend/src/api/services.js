import api from './client';

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const boardsApi = {
  getAll: () => api.get('/boards'),
  get: (id) => api.get(`/boards/${id}`),
  create: (data) => api.post('/boards', data),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`),
  invite: (id, email) => api.post(`/boards/${id}/members`, { email }),
};

export const listsApi = {
  create: (data) => api.post('/lists', data),
  update: (id, data) => api.put(`/lists/${id}`, data),
  delete: (id) => api.delete(`/lists/${id}`),
};

export const tasksApi = {
  getForBoard: (boardId, params) => api.get(`/tasks/board/${boardId}`, { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  move: (id, data) => api.put(`/tasks/${id}/move`, data),
  assign: (id, userId) => api.post(`/tasks/${id}/assignees`, { userId }),
  unassign: (id, userId) => api.delete(`/tasks/${id}/assignees/${userId}`),
};

export const activitiesApi = {
  getForBoard: (boardId, params) => api.get(`/activities/board/${boardId}`, { params }),
};

export const usersApi = {
  search: (q) => api.get('/users/search', { params: { q } }),
};