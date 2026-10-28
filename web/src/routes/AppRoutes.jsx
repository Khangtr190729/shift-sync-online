import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import WebLayout from '../layouts/WebLayout';
import ScheduleManagementPage from '../pages/ScheduleManagementPage';
import EmployeeManagementPage from '../pages/EmployeeManagementPage';
import StoreManagementPage from '../pages/StoreManagementPage';
import ShiftManagementPage from '../pages/ShiftManagementPage';
import DashboardPage from '../pages/DashboardPage';
import ProfilePage from '../pages/ProfilePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MySchedulePage from '../pages/MySchedulePage';
import HomePage from '../pages/HomePage';

// Route Guard for Admin & Manager (Web Shell)
const ManagementRoute = ({ children, adminOnly = false }) => {
  const { user, store, roleInStore, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center text-xs font-medium text-[#86868b]">
        Đang tải dữ liệu Ca Làm Online...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isStoreOwner =
    roleInStore === 'ADMIN' ||
    user.role === 'ADMIN' ||
    (store?.ownerId && String(store.ownerId) === String(user._id));
  const isManager = roleInStore === 'MANAGER' || user.role === 'MANAGER';

  // Regular employee cannot access management pages
  if (!isStoreOwner && !isManager) {
    return <Navigate to="/my-schedule" replace />;
  }

  // Admin-only pages like StoreManagementPage
  if (adminOnly && !isStoreOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Route Guard for Personal Schedule (/my-schedule)
// Chủ cửa hàng (ADMIN) tuyệt đối không được phân ca và không có lịch cá nhân -> cấm vào, redirect về /dashboard
const PersonalScheduleRoute = ({ children }) => {
  const { user, store, roleInStore, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center text-xs font-medium text-[#86868b]">
        Đang tải dữ liệu Ca Làm Online...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isStoreOwner =
    roleInStore === 'ADMIN' ||
    user.role === 'ADMIN' ||
    (store?.ownerId && String(store.ownerId) === String(user._id));

  if (isStoreOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-[#86868b]">Đang khởi động Ca Làm Online...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          user ? (
            user.role === 'EMPLOYEE' ? (
              <Navigate to="/my-schedule" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register"
        element={
          user ? (
            user.role === 'EMPLOYEE' ? (
              <Navigate to="/my-schedule" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <RegisterPage />
          )
        }
      />

      {/* Personal Schedule View (For Employee & Manager - Store Owner is blocked) */}
      <Route
        path="/my-schedule"
        element={
          <PersonalScheduleRoute>
            <div className="min-h-screen flex flex-col bg-[#f5f5f7]">
              <MySchedulePage />
            </div>
          </PersonalScheduleRoute>
        }
      />

      {/* Main Web App Shell for Admin & Manager */}
      <Route
        element={
          <ManagementRoute>
            <WebLayout />
          </ManagementRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedules" element={<ScheduleManagementPage />} />
        <Route path="/employees" element={<EmployeeManagementPage />} />
        <Route path="/shifts" element={<ShiftManagementPage />} />
        <Route
          path="/store-management"
          element={
            <ManagementRoute adminOnly>
              <StoreManagementPage />
            </ManagementRoute>
          }
        />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Public Home / Landing Page */}
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
