import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, storeApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [roleInStore, setRoleInStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCurrentUser = useCallback(async (requestedStoreId) => {
    const token = localStorage.getItem('ca_lam_token');
    if (!token) {
      setUser(null);
      setStore(null);
      setStores([]);
      setRoleInStore(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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

        // Fetch store for current user (use saved active branch if available)
        const activeStoreId = requestedStoreId || localStorage.getItem('ca_lam_active_store_id');
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
        } catch {
          setStore(null);
          setStores([]);
          setRoleInStore(normalizedUser.role);
        }
      } else {
        localStorage.removeItem('ca_lam_token');
        localStorage.removeItem('ca_lam_active_store_id');
        setUser(null);
        setStore(null);
        setStores([]);
        setRoleInStore(null);
      }
    } catch (err) {
      console.error('Failed to load user session:', err);
      localStorage.removeItem('ca_lam_token');
      localStorage.removeItem('ca_lam_active_store_id');
      setUser(null);
      setStore(null);
      setStores([]);
      setRoleInStore(null);
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
      setUser(normalizedUser);
      await loadCurrentUser();
      return { token, user: normalizedUser };
    }
    throw new Error(res.message || 'Đăng ký không thành công');
  };

  const logout = () => {
    localStorage.removeItem('ca_lam_token');
    localStorage.removeItem('ca_lam_active_store_id');
    setUser(null);
    setStore(null);
    setStores([]);
    setRoleInStore(null);
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
