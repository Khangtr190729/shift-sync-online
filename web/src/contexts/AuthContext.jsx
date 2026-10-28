import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, storeApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ca_lam_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [store, setStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [roleInStore, setRoleInStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCurrentUser = useCallback(async (requestedStoreId) => {
    try {
      setLoading(true);
      // Gọi API /auth/me - Trình duyệt tự động đính kèm Cookie accessToken (hoặc tự refresh nếu hết hạn)
      const res = await authApi.getMe();
      const rawUser = res.user || res.data?.user;

      if (res.success && rawUser) {
        // Normalize fields
        const actualId = String(rawUser._id || rawUser.id || '');
        const normalizedUser = {
          ...rawUser,
          _id: actualId,
          id: actualId,
          name: rawUser.fullName || rawUser.name,
          role: rawUser.systemRole || rawUser.role
        };
        setUser(normalizedUser);
        localStorage.setItem('ca_lam_user', JSON.stringify(normalizedUser));

        // Fetch store for current user (use saved active branch if available)
        const savedStoreId = localStorage.getItem('ca_lam_active_store_id');
        const activeStoreId = requestedStoreId || (savedStoreId && savedStoreId !== 'undefined' ? savedStoreId : null);
        try {
          const storeRes = await storeApi.getMyStore(activeStoreId);
          if (storeRes.success && storeRes.hasStore) {
            setStore(storeRes.store);
            setStores(storeRes.stores || [storeRes.store]);
            setRoleInStore(storeRes.roleInStore || normalizedUser.role);
            if (storeRes.store?._id) {
              localStorage.setItem('ca_lam_active_store_id', storeRes.store._id);
            }
          } else {
            setStore(null);
            setStores([]);
            setRoleInStore(normalizedUser.role);
          }
        } catch (storeErr) {
          console.warn('Could not fetch store info:', storeErr.message);
        }
      } else {
        localStorage.removeItem('ca_lam_token');
        localStorage.removeItem('ca_lam_user');
        localStorage.removeItem('ca_lam_active_store_id');
        setUser(null);
        setStore(null);
        setStores([]);
        setRoleInStore(null);
      }
    } catch (err) {
      // Khi chưa đăng nhập hoặc cookie hết hạn hoàn toàn
      if (err.status === 401 || err.status === 403 || err.message?.includes('401') || err.message?.includes('hết hạn')) {
        localStorage.removeItem('ca_lam_token');
        localStorage.removeItem('ca_lam_user');
        localStorage.removeItem('ca_lam_active_store_id');
        setUser(null);
        setStore(null);
        setStores([]);
        setRoleInStore(null);
      } else {
        console.warn('Failed to load user session:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, [loadCurrentUser]);

  // Chuyển đổi giữa các cơ sở / chi nhánh
  const switchStore = async (storeId) => {
    if (!storeId) return;
    localStorage.setItem('ca_lam_active_store_id', storeId);
    const targetStore = stores.find((s) => String(s._id) === String(storeId));
    if (targetStore) {
      setStore(targetStore);
    }
    await loadCurrentUser(storeId);
  };

  // Tạo thêm cơ sở / chi nhánh mới cho chủ quán
  const createStore = async (storeData) => {
    setError(null);
    const res = await storeApi.createStore(storeData);
    if (res.success && res.store) {
      localStorage.setItem('ca_lam_active_store_id', res.store._id);
      await loadCurrentUser(res.store._id);
      return res.store;
    }
    throw new Error(res.message || 'Không thể tạo cơ sở mới.');
  };

  const login = async (email, password) => {
    setError(null);
    const res = await authApi.login({ email, password });
    const token = res.token || res.data?.token;
    const rawUser = res.user || res.data?.user;

    if (res.success && token) {
      localStorage.setItem('ca_lam_token', token);
      const normalizedUser = {
        ...rawUser,
        name: rawUser?.fullName || rawUser?.name,
        role: rawUser?.systemRole || rawUser?.role
      };
      localStorage.setItem('ca_lam_user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      await loadCurrentUser();
      return { token, user: normalizedUser };
    }
    throw new Error(res.message || 'Đăng nhập không thành công');
  };

  const register = async (formData) => {
    setError(null);
    const res = await authApi.register(formData);
    const token = res.token || res.data?.token;
    const rawUser = res.user || res.data?.user;

    if (res.success && token) {
      localStorage.setItem('ca_lam_token', token);
      const normalizedUser = {
        ...rawUser,
        name: rawUser?.fullName || rawUser?.name,
        role: rawUser?.systemRole || rawUser?.role
      };
      localStorage.setItem('ca_lam_user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      await loadCurrentUser();
      return { token, user: normalizedUser };
    }
    throw new Error(res.message || 'Đăng ký không thành công');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Lỗi gọi API đăng xuất:', err);
    } finally {
      localStorage.removeItem('ca_lam_token');
      localStorage.removeItem('ca_lam_user');
      localStorage.removeItem('ca_lam_active_store_id');
      setUser(null);
      setStore(null);
      setStores([]);
      setRoleInStore(null);
    }
  };

  const value = {
    user,
    store,
    stores,
    roleInStore,
    loading,
    error,
    login,
    register,
    createStore,
    switchStore,
    logout,
    refreshUser: loadCurrentUser,
    setUser,
    setStore,
    setStores
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
