import axios from 'axios';
import { AuthResponse, Artifact, Condition, Notification, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  me: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export const artifactsAPI = {
  getAll: async (): Promise<Artifact[]> => {
    const response = await api.get('/artifacts');
    return response.data;
  },
  getById: async (id: string): Promise<Artifact> => {
    const response = await api.get(`/artifacts/${id}`);
    return response.data;
  },
  create: async (data: {
    title: string;
    content: string;
    category: string;
    conditions: unknown[];
  }): Promise<Artifact> => {
    const response = await api.post('/artifacts', data);
    return response.data;
  },
  getConditions: async (id: string): Promise<Condition[]> => {
    const response = await api.get(`/artifacts/${id}/conditions`);
    return response.data;
  },
  satisfyCondition: async (id: string, conditionId: string): Promise<void> => {
    await api.post(`/artifacts/${id}/satisfy-condition`, { condition_id: conditionId });
  },
  transitionState: async (
    id: string,
    newState: string,
    reason: string,
    transformedContent?: string
  ): Promise<Artifact> => {
    const response = await api.post(`/artifacts/${id}/transition`, {
      new_state: newState,
      reason,
      transformed_content: transformedContent
    });
    return response.data;
  }
};

export const notificationsAPI = {
  getAll: async (unreadOnly: boolean = false): Promise<Notification[]> => {
    const response = await api.get(`/notifications?unread=${unreadOnly}`);
    return response.data;
  },
  markRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  }
};

export default api;
