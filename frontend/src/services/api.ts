import axios from 'axios';

// Base API URI (proxied through Vite, but explicit during fallback)
const API_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('intellihr_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API Mappings
export const api = {
  // Auth
  auth: {
    login: async (credentials: any) => {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    },
    signup: async (data: any) => {
      const response = await apiClient.post('/auth/signup', data);
      return response.data;
    },
    register: async (data: any) => {
      const response = await apiClient.post('/auth/register', data);
      return response.data;
    },
    getMe: async () => {
      const response = await apiClient.get('/auth/me');
      return response.data;
    },
  },

  // Employees
  employees: {
    list: async (filters: { search?: string; department?: string; status?: string; page?: number; limit?: number }) => {
      const response = await apiClient.get('/employees', { params: filters });
      return response.data;
    },
    get: async (id: string) => {
      const response = await apiClient.get(`/employees/${id}`);
      return response.data;
    },
    create: async (formData: FormData) => {
      const response = await apiClient.post('/employees', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    update: async (id: string, formData: FormData) => {
      const response = await apiClient.put(`/employees/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/employees/${id}`);
      return response.data;
    },
    invite: async (data: { name: string; email: string; phone?: string; position: string; department: string; salary?: number }) => {
      const response = await apiClient.post('/employees/invite', data);
      return response.data;
    },
    verifyInvite: async (token: string) => {
      const response = await apiClient.get('/employees/invite/verify', { params: { token } });
      return response.data;
    },
    promote: async (id: string, data: { toPosition: string; date?: string; reason: string }) => {
      const response = await apiClient.post(`/employees/${id}/promote`, data);
      return response.data;
    },
    transfer: async (id: string, data: { toDept: string; date?: string; reason: string }) => {
      const response = await apiClient.post(`/employees/${id}/transfer`, data);
      return response.data;
    },
    warn: async (id: string, data: { type: 'verbal' | 'written' | 'final'; date?: string; reason: string }) => {
      const response = await apiClient.post(`/employees/${id}/warning`, data);
      return response.data;
    },
    suspend: async (id: string, data: { startDate: string; endDate: string; reason: string; paid: boolean }) => {
      const response = await apiClient.post(`/employees/${id}/suspend`, data);
      return response.data;
    },
    terminate: async (id: string, data: { type: 'layoff' | 'fired'; reason: string; date?: string }) => {
      const response = await apiClient.post(`/employees/${id}/terminate`, data);
      return response.data;
    },
    resign: async (data: { reason: string; lastWorkingDay: string }) => {
      const response = await apiClient.post('/employees/resign', data);
      return response.data;
    },
    resignations: async () => {
      const response = await apiClient.get('/employees/resignations');
      return response.data;
    },
    reviewResignation: async (id: string, status: 'approved' | 'rejected') => {
      const response = await apiClient.put(`/employees/resignations/${id}/review`, { status });
      return response.data;
    },
  },

  leaveTypes: {
    list: async () => {
      const response = await apiClient.get('/leave-types');
      return response.data;
    },
    create: async (data: { name: string; allowedDays: number; carryOver: boolean; requiresApproval: boolean }) => {
      const response = await apiClient.post('/leave-types', data);
      return response.data;
    },
    update: async (id: string, data: { name: string; allowedDays: number; carryOver: boolean; requiresApproval: boolean }) => {
      const response = await apiClient.put(`/leave-types/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await apiClient.delete(`/leave-types/${id}`);
      return response.data;
    },
  },

  // Attendance
  attendance: {
    checkIn: async () => {
      const response = await apiClient.post('/attendance/checkin');
      return response.data;
    },
    checkOut: async () => {
      const response = await apiClient.post('/attendance/checkout');
      return response.data;
    },
    getReport: async (params: { month: number; year: number; employeeId?: string }) => {
      const response = await apiClient.get('/attendance/report', { params });
      return response.data;
    },
  },

  // Leaves
  leaves: {
    list: async (params?: { status?: string; employeeId?: string }) => {
      const response = await apiClient.get('/leave', { params });
      return response.data;
    },
    submit: async (data: { leaveTypeId: string; startDate: string; endDate: string; reason: string }) => {
      const response = await apiClient.post('/leave/request', data);
      return response.data;
    },
    approve: async (id: string, status: 'approved' | 'rejected') => {
      const response = await apiClient.put(`/leave/${id}/approve`, { status });
      return response.data;
    },
    reject: async (id: string) => {
      const response = await apiClient.put(`/leave/${id}/reject`);
      return response.data;
    },
  },

  // Payroll
  payroll: {
    list: async (params: { month: number; year: number }) => {
      const response = await apiClient.get('/payroll', { params });
      return response.data;
    },
    run: async (data: { month: number; year: number }) => {
      const response = await apiClient.post('/payroll/run', data);
      return response.data;
    },
  },

  // AI Agent
  ai: {
    ask: async (question: string) => {
      const response = await apiClient.post('/ai/ask', { question });
      return response.data;
    },
  },

  profile: {
    get: async () => {
      const response = await apiClient.get('/profile');
      return response.data;
    },
    update: async (data: any) => {
      const response = await apiClient.put('/profile', data);
      return response.data;
    },
    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await apiClient.post('/profile/change-password', data);
      return response.data;
    },
  },
};
