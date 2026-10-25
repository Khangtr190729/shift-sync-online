import axios from 'axios';
import { Platform, NativeModules } from 'react-native';
import tokenStorage from '../storage/tokenStorage';

// Automatic detection of dev host IP for Android/iOS emulators, LDPlayer, and physical devices
export const getDevHostIp = () => {
  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/https?:\/\/([^:/]+)/);
      if (match && match[1] && match[1] !== 'localhost' && match[1] !== '127.0.0.1') {
        return match[1];
      }
    }
  } catch (e) {
    // fallback
  }
  // Default to user's local network IP on Wi-Fi
  return '192.168.1.135';
};

export const getDefaultApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  const host = getDevHostIp();
  return `http://${host}:5000/api`;
};

let currentBaseUrl = getDefaultApiUrl();

const api = axios.create({
  baseURL: currentBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Update baseURL dynamically
export const setApiBaseUrl = (newUrl) => {
  if (!newUrl) return;
  currentBaseUrl = newUrl;
  api.defaults.baseURL = newUrl;
  tokenStorage.saveCustomApiUrl(newUrl);
};

export const getApiBaseUrl = () => currentBaseUrl;

// Request interceptor: attach token & ensure dynamic dev host URL is used
api.interceptors.request.use(
  async (config) => {
    const customUrl = await tokenStorage.getCustomApiUrl();
    if (customUrl) {
      config.baseURL = customUrl;
    } else {
      config.baseURL = getDefaultApiUrl();
    }
    const token = await tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: standard unwrap & friendly error messages
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new Error('Hết thời gian chờ phản hồi từ máy chủ (Timeout).'));
    }
    if (error.message === 'Network Error' || !error.response) {
      const host = getDevHostIp();
      return Promise.reject(
        new Error(`Không thể kết nối máy chủ backend tại ${host}:5000. Hãy kiểm tra server đã bật chưa.`)
      );
    }
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.';
    return Promise.reject(new Error(message));
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

// --- STORE APIS ---
export const storeApi = {
  createStore: (data) => api.post('/stores', data),
  getMyStore: (storeId) => api.get(`/stores/my-store${storeId ? `?storeId=${storeId}` : ''}`),
  getMyStores: () => api.get('/stores/my-stores'),
  updateMyStore: (data) => api.put('/stores/my-store', data),
  generateInviteCode: (storeId) => api.post('/stores/generate-invite-code', { storeId }),
  joinByCode: (inviteCode) => api.post('/stores/join-by-code', { inviteCode }),
  inviteByIdOrEmail: (data) => api.post('/stores/invite-by-id', data),
};

// --- MEMBER APIS ---
export const memberApi = {
  getMembers: (storeId) => api.get(`/stores/${storeId}/members`),
  updateWage: (storeId, memberId, hourlyWage) =>
    api.put(`/stores/${storeId}/members/${memberId}/wage`, { hourlyWage }),
  updateEmploymentType: (storeId, memberId, employmentType) =>
    api.put(`/stores/${storeId}/members/${memberId}/employment-type`, { employmentType }),
  removeMember: (storeId, memberId) =>
    api.delete(`/stores/${storeId}/members/${memberId}`),
};

// --- SHIFT APIS ---
export const shiftApi = {
  getShifts: (storeId) => api.get(`/stores/${storeId}/shifts`),
  createShift: (storeId, data) => api.post(`/stores/${storeId}/shifts`, data),
  updateShift: (storeId, shiftId, data) => api.put(`/stores/${storeId}/shifts/${shiftId}`, data),
  deleteShift: (storeId, shiftId) => api.delete(`/stores/${storeId}/shifts/${shiftId}`),
};

// --- SCHEDULE APIS ---
export const scheduleApi = {
  getWeeklySchedule: (storeId, week, year) =>
    api.get(`/stores/${storeId}/schedules?week=${week}&year=${year}`),
  saveDraft: (storeId, payload) =>
    api.post(`/stores/${storeId}/schedules/save-draft`, payload),
  autoGenerate: (storeId, payload) =>
    api.post(`/stores/${storeId}/schedules/auto-generate`, payload),
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
    api.get(`/schedules/my-schedule?week=${week}&year=${year}${storeId ? `&storeId=${storeId}` : ''}`),
};

// --- USER APIS ---
export const userApi = {
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
};

export default api;
