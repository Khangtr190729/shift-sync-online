import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import tokenStorage from '../storage/tokenStorage';
import { authApi, storeApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);
  const [stores, setStores] = useState([]);
  const [roleInStore, setRoleInStore] = useState(null);
  const [employmentType, setEmploymentType] = useState('PART_TIME');
  const [hourlyWage, setHourlyWage] = useState(0);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tải lại thông tin cửa hàng hiện tại của người dùng (Chủ quán hoặc Nhân viên)
  const fetchMyStore = useCallback(async (targetStoreId) => {
    try {
      const activeId = targetStoreId || (await tokenStorage.getActiveStoreId());
      const res = await storeApi.getMyStore(activeId);
      if (res && res.success && res.store) {
        setStore(res.store);
        setStores(res.stores || [res.store]);
        if (res.store?._id) {
          await tokenStorage.saveActiveStoreId(res.store._id);
        }
        const resolvedRole =
          res.roleInStore ||
          (user?.systemRole === 'ADMIN' || String(res.store.ownerId) === String(user?._id || user?.id)
            ? 'ADMIN'
            : 'EMPLOYEE');
        setRoleInStore(resolvedRole);
        setEmploymentType(res.employmentType || 'PART_TIME');
        setHourlyWage(res.hourlyWage || 0);
        return res.store;
      } else {
        setStore(null);
        setStores([]);
        setRoleInStore(user?.systemRole === 'ADMIN' ? 'ADMIN' : null);
        setEmploymentType('PART_TIME');
        setHourlyWage(0);
        return null;
      }
    } catch {
      setStore(null);
      setStores([]);
      setRoleInStore(user?.systemRole === 'ADMIN' ? 'ADMIN' : null);
      setEmploymentType('PART_TIME');
      setHourlyWage(0);
      return null;
    }
  }, [user?._id, user?.id, user?.systemRole]);

  // Khôi phục phiên đăng nhập khi khởi động ứng dụng
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await tokenStorage.getToken();
        if (storedToken) {
          setToken(storedToken);
          const meRes = await authApi.getMe();
          if (meRes && meRes.success && meRes.user) {
            await tokenStorage.saveUser(meRes.user);
            await fetchMyStore();
            setUser(meRes.user);
          } else {
            await tokenStorage.clearAll();
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Bootstrap auth failed:', err.message);
        if (err.message?.includes('401') || err.message?.includes('hết hạn')) {
          await tokenStorage.clearAll();
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [fetchMyStore]);

  // Đăng nhập
  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const res = await authApi.login({ email, password });
      if (res && res.success && res.token) {
        await tokenStorage.saveToken(res.token);
        await tokenStorage.saveUser(res.user);
        setToken(res.token);

        // Fetch store TRƯỚC KHI setUser để tránh chớp màn hình
        try {
          const storeRes = await storeApi.getMyStore();
          if (storeRes && storeRes.success && storeRes.store) {
            setStore(storeRes.store);
            const resolvedRole =
              storeRes.roleInStore ||
              (res.user.systemRole === 'ADMIN' || String(storeRes.store.ownerId) === String(res.user._id || res.user.id)
                ? 'ADMIN'
                : 'EMPLOYEE');
            setRoleInStore(resolvedRole);
            setEmploymentType(storeRes.employmentType || 'PART_TIME');
            setHourlyWage(storeRes.hourlyWage || 0);
          } else {
            setStore(null);
            setRoleInStore(res.user.systemRole === 'ADMIN' ? 'ADMIN' : null);
            setEmploymentType('PART_TIME');
            setHourlyWage(0);
          }
        } catch {
          setStore(null);
          setRoleInStore(res.user.systemRole === 'ADMIN' ? 'ADMIN' : null);
          setEmploymentType('PART_TIME');
          setHourlyWage(0);
        }

        setUser(res.user);
        return res;
      }
      throw new Error(res?.message || 'Đăng nhập không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng ký
  const register = async (data) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res && res.success && res.token) {
        await tokenStorage.saveToken(res.token);
        await tokenStorage.saveUser(res.user);
        setToken(res.token);
        await fetchMyStore();
        setUser(res.user);
        return res;
      }
      throw new Error(res?.message || 'Đăng ký không thành công');
    } finally {
      setIsLoading(false);
    }
  };

  // Tạo thêm chi nhánh / cửa hàng mới (Dành cho Chủ quán ADMIN)
  const createStore = async (storeData) => {
    const res = await storeApi.createStore(storeData);
    if (res && res.success && res.store) {
      await tokenStorage.saveActiveStoreId(res.store._id);
      await fetchMyStore(res.store._id);
      return res.store;
    }
    throw new Error(res?.message || 'Không thể tạo cửa hàng.');
  };

  // Chuyển đổi giữa các cơ sở / chi nhánh
  const switchStore = async (storeId) => {
    if (!storeId) return;
    await tokenStorage.saveActiveStoreId(storeId);
    const target = stores.find((s) => String(s._id) === String(storeId));
    if (target) setStore(target);
    await fetchMyStore(storeId);
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await tokenStorage.clearAll();
    } catch (e) {
      console.warn('Logout clear error:', e);
    }
    setToken(null);
    setUser(null);
    setStore(null);
    setStores([]);
    setRoleInStore(null);
    setEmploymentType('PART_TIME');
    setHourlyWage(0);
  };

  // Refresh user and store
  const refreshUserAndStore = async () => {
    try {
      const meRes = await authApi.getMe();
      if (meRes && meRes.success && meRes.user) {
        setUser(meRes.user);
        await tokenStorage.saveUser(meRes.user);
      }
      await fetchMyStore();
    } catch (e) {
      console.warn('Refresh user error:', e);
    }
  };

  const isAdmin =
    user?.systemRole === 'ADMIN' ||
    roleInStore === 'ADMIN' ||
    (store?.ownerId && String(store.ownerId) === String(user?._id || user?.id));

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        stores,
        roleInStore,
        employmentType,
        hourlyWage,
        isAdmin,
        token,
        isLoading,
        login,
        register,
        createStore,
        switchStore,
        logout,
        fetchMyStore,
        refreshUserAndStore,
        setStore,
        setStores,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
