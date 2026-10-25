import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ca_lam_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors cleanly
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Đã có lỗi xảy ra';
    const err = new Error(message);
    err.status = error.response?.status;
    err.response = error.response;
    return Promise.reject(err);
  }
);

// --- AUTH APIS ---
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetOtp: (email, otp) => api.post('/auth/verify-reset-otp', { email, otp }),
  resetPassword: (email, otp, newPassword) =>
    api.post('/auth/reset-password', { email, otp, newPassword }),
};

// --- USER APIS ---
export const userApi = {
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data)
};

// --- STORE APIS ---
export const storeApi = {
  createStore: (data) => api.post('/stores', data),
  getMyStore: (storeId) => api.get(`/stores/my-store${storeId ? `?storeId=${storeId}` : ''}`),
  getMyStores: () => api.get('/stores/my-stores'),
  updateMyStore: (data) => api.put('/stores/my-store', data),
  generateInviteCode: (storeId) => api.post('/stores/generate-invite-code', { storeId }),
  joinByCode: (inviteCode) => api.post('/stores/join-by-code', { inviteCode }),
  inviteByIdOrEmail: (data) => api.post('/stores/invite-by-id', data)
};

// --- MEMBER APIS ---
export const memberApi = {
  getMembers: (storeId) => api.get(`/stores/${storeId}/members`),
  updateWage: (storeId, memberId, hourlyWage) =>
    api.put(`/stores/${storeId}/members/${memberId}/wage`, { hourlyWage }),
  updateRole: (storeId, memberId, roleInStore) =>
    api.put(`/stores/${storeId}/members/${memberId}/role`, { roleInStore }),
  updateEmploymentType: (storeId, memberId, employmentType) =>
    api.put(`/stores/${storeId}/members/${memberId}/employment-type`, { employmentType }),
  removeMember: (storeId, memberId) =>
    api.delete(`/stores/${storeId}/members/${memberId}`)
};

// --- SHIFT APIS ---
export const shiftApi = {
  getShifts: (storeId) => api.get(`/stores/${storeId}/shifts`),
  createShift: (storeId, data) => api.post(`/stores/${storeId}/shifts`, data),
  updateShift: (storeId, shiftId, data) => api.put(`/stores/${storeId}/shifts/${shiftId}`, data),
  deleteShift: (storeId, shiftId) => api.delete(`/stores/${storeId}/shifts/${shiftId}`)
};

// --- SCHEDULE APIS ---
export const scheduleApi = {
  getWeeklySchedule: (storeId, week, year) =>
    api.get(`/stores/${storeId}/schedules?week=${week}&year=${year}`),
  getWeekSchedule: (storeId, week, year) =>
    api.get(`/stores/${storeId}/schedules?week=${week}&year=${year}`),
  saveDraft: (storeId, payload) =>
    api.post(`/stores/${storeId}/schedules/save-draft`, payload),
  autoGenerate: (storeId, payload) =>
    api.post(`/stores/${storeId}/schedules/auto-generate`, payload),
  publish: (storeId, payload) =>
    api.post(`/stores/${storeId}/schedules/publish`, payload),
  publishSchedule: (storeId, payload) =>
    api.post(`/stores/${storeId}/schedules/publish`, payload),
  evaluateShift: (storeId, payload) =>
    api.put(`/stores/${storeId}/schedules/evaluate-shift`, payload),
  getMonthlyStats: (storeId, month, year) => {
    let url = `/stores/${storeId}/schedules/monthly-stats`;
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    return api.get(url);
  },
  getMySchedule: (week, year, storeId) =>
    api.get(`/schedules/my-schedule?week=${week}&year=${year}${storeId ? `&storeId=${storeId}` : ''}`)
};

export default api;
