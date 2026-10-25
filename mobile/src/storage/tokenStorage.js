import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ca_lam_online_token';
const USER_KEY = 'ca_lam_online_user';
const API_URL_KEY = 'ca_lam_online_api_url';
const ACTIVE_STORE_KEY = 'ca_lam_online_active_store_id';

// In-memory fallback if SecureStore is not available (e.g. web preview)
const memoryStorage = {};

const isSecureStoreAvailable = async () => {
  if (Platform.OS === 'web') return false;
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
};

export const tokenStorage = {
  // --- TOKEN ---
  saveToken: async (token) => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        memoryStorage[TOKEN_KEY] = token;
      }
    } catch (e) {
      console.warn('Error saving token:', e);
      memoryStorage[TOKEN_KEY] = token;
    }
  },

  getToken: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        return await SecureStore.getItemAsync(TOKEN_KEY);
      } else if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
      } else {
        return memoryStorage[TOKEN_KEY] || null;
      }
    } catch (e) {
      console.warn('Error getting token:', e);
      return memoryStorage[TOKEN_KEY] || null;
    }
  },

  deleteToken: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
      }
      delete memoryStorage[TOKEN_KEY];
    } catch (e) {
      console.warn('Error deleting token:', e);
      delete memoryStorage[TOKEN_KEY];
    }
  },

  // --- USER DATA ---
  saveUser: async (user) => {
    try {
      const json = JSON.stringify(user);
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.setItemAsync(USER_KEY, json);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(USER_KEY, json);
      } else {
        memoryStorage[USER_KEY] = json;
      }
    } catch (e) {
      console.warn('Error saving user data:', e);
    }
  },

  getUser: async () => {
    try {
      let json = null;
      const available = await isSecureStoreAvailable();
      if (available) {
        json = await SecureStore.getItemAsync(USER_KEY);
      } else if (typeof localStorage !== 'undefined') {
        json = localStorage.getItem(USER_KEY);
      } else {
        json = memoryStorage[USER_KEY] || null;
      }
      return json ? JSON.parse(json) : null;
    } catch (e) {
      console.warn('Error reading user data:', e);
      return null;
    }
  },

  // --- CUSTOM API BASE URL ---
  saveCustomApiUrl: async (url) => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.setItemAsync(API_URL_KEY, url);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(API_URL_KEY, url);
      } else {
        memoryStorage[API_URL_KEY] = url;
      }
    } catch (e) {
      console.warn('Error saving custom API URL:', e);
    }
  },

  getCustomApiUrl: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        return await SecureStore.getItemAsync(API_URL_KEY);
      } else if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(API_URL_KEY);
      } else {
        return memoryStorage[API_URL_KEY] || null;
      }
    } catch (e) {
      return null;
    }
  },

  // --- ACTIVE STORE ID ---
  saveActiveStoreId: async (storeId) => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.setItemAsync(ACTIVE_STORE_KEY, String(storeId));
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(ACTIVE_STORE_KEY, String(storeId));
      } else {
        memoryStorage[ACTIVE_STORE_KEY] = String(storeId);
      }
    } catch (e) {
      console.warn('Error saving active store ID:', e);
      memoryStorage[ACTIVE_STORE_KEY] = String(storeId);
    }
  },

  getActiveStoreId: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        return await SecureStore.getItemAsync(ACTIVE_STORE_KEY);
      } else if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(ACTIVE_STORE_KEY);
      } else {
        return memoryStorage[ACTIVE_STORE_KEY] || null;
      }
    } catch {
      return memoryStorage[ACTIVE_STORE_KEY] || null;
    }
  },

  deleteActiveStoreId: async () => {
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.deleteItemAsync(ACTIVE_STORE_KEY);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(ACTIVE_STORE_KEY);
      }
      delete memoryStorage[ACTIVE_STORE_KEY];
    } catch {
      delete memoryStorage[ACTIVE_STORE_KEY];
    }
  },

  clearAll: async () => {
    await tokenStorage.deleteToken();
    await tokenStorage.deleteActiveStoreId();
    try {
      const available = await isSecureStoreAvailable();
      if (available) {
        await SecureStore.deleteItemAsync(USER_KEY);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(USER_KEY);
      }
      delete memoryStorage[USER_KEY];
    } catch (e) {
      console.warn('Error clearing storage:', e);
    }
  },
};

export default tokenStorage;
