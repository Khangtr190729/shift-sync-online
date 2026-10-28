import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  CalendarClock,
  Users,
  Clock,
  Store,
  UserCheck,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Copy,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { getRoleLabel } from '../utils/formatters';
import StoreSwitcher from '../components/store/StoreSwitcher';

export const WebLayout = () => {
  const { user, store, roleInStore, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    const email = user?.email || '';
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const roleInfo = getRoleLabel(roleInStore || user?.role);
  const isOwner =
    roleInStore === 'ADMIN' ||
    user?.role === 'ADMIN' ||
    (store?.ownerId && String(store.ownerId) === String(user?._id));
  const isShiftEligible = !isOwner; // Quản lý có thể được phân ca và có lịch cá nhân

  const navItems = [
    { name: 'Tổng quan', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Lịch làm việc', path: '/schedules', icon: CalendarDays },
    ...(isShiftEligible ? [{ name: 'Lịch của tôi', path: '/my-schedule', icon: CalendarClock }] : []),
    { name: 'Nhân viên', path: '/employees', icon: Users },
    { name: 'Ca làm', path: '/shifts', icon: Clock },
    ...(isOwner ? [{ name: 'Cơ sở & Chi nhánh', path: '/store-management', icon: Store }] : []),
    { name: 'Hồ sơ cá nhân', path: '/profile', icon: UserCheck }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F7] text-[#1D1D1F]">
      {/* Sidebar for Desktop (Apple Style: Clean, Frosted Glass, Minimalist) */}
      <aside className="hidden lg:flex flex-col w-64 glass-sidebar shrink-0 sticky top-0 h-screen select-none">
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#E5E5E7]">
          <Logo size="md" />
        </div>

        {/* Current Store Switcher */}
        {store && (
          <div className="mx-4 my-3">
            <StoreSwitcher />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 btn-press group ${
                  isActive
                    ? 'bg-[#0066CC] text-white shadow-xs'
                    : 'text-[#1D1D1F] hover:bg-black/5 hover:text-[#0066CC]'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-150 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#0066CC]'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Mini Profile in Sidebar Footer */}
        <div className="p-3.5 mx-2 mb-2 rounded-2xl bg-[#F5F5F7] border border-[#E5E5E7] flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100/80 border border-blue-200/80 flex items-center justify-center text-[#0066CC] font-bold text-xs shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1D1D1F] truncate">{user?.name || 'Người dùng'}</p>
              <span className={`inline-block text-[10px] px-2 py-0.2 rounded-full font-medium ${roleInfo.color}`}>
                {roleInfo.text}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header (Apple Translucent Frosted Glass) */}
        <header className="h-16 glass-header px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-base lg:text-lg font-bold text-[#1D1D1F] tracking-tight">
                {navItems.find((n) => n.path === location.pathname)?.name || 'Ca Làm Online'}
              </h1>
              {store && (
                <p className="text-[11px] text-[#6E6E73] hidden sm:block">
                  Cơ sở: <span className="font-medium text-[#1D1D1F]">{store.name}</span> — {store.address || 'Chưa cập nhật địa chỉ'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Link to Personal Schedule for Manager */}
            {isShiftEligible && (
              <NavLink
                to="/my-schedule"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 hover:bg-blue-100 text-[#0066CC] border border-blue-200/60 text-xs font-semibold transition cursor-pointer"
                title="Xem ca làm việc cá nhân của bạn"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lịch của tôi</span>
              </NavLink>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-full hover:bg-black/5 border border-transparent hover:border-slate-200 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200 text-[#0066CC] font-bold text-xs flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-semibold text-[#1D1D1F]">{user?.name}</div>
                  <div className="text-[10px] text-[#86868B]">{roleInfo.text}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-[#E5E5E7] py-1.5 z-50 animate-dropdown-enter"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-[11px] text-[#86868B]">Đăng nhập bằng</p>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-xs font-semibold text-[#1D1D1F] truncate" title={user?.email}>
                        {user?.email}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-[10px] font-semibold text-[#0066CC] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                        title="Sao chép Email"
                      >
                        {copiedEmail ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Chép</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <NavLink
                    to="/profile"
                    className="block px-4 py-2 text-xs text-[#1D1D1F] hover:bg-slate-50 transition-colors"
                  >
                    Hồ sơ cá nhân
                  </NavLink>
                  {isShiftEligible && (
                    <NavLink
                      to="/my-schedule"
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#0066CC] hover:bg-blue-50/60 transition-colors"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      Lịch làm của tôi
                    </NavLink>
                  )}
                  {isOwner && (
                    <NavLink
                      to="/store-management"
                      className="block px-4 py-2 text-xs text-[#1D1D1F] hover:bg-slate-50 transition-colors"
                    >
                      Cài đặt cửa hàng
                    </NavLink>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile slide-out nav drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex animate-backdrop-fade">
            <div className="w-64 bg-white h-full shadow-2xl flex flex-col p-4 animate-modal-pop border-r border-[#E5E5E7]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Store Switcher */}
              {store && (
                <div className="pt-3 pb-1">
                  <StoreSwitcher isMobile={true} />
                </div>
              )}
              <div className="flex-1 py-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 btn-press ${
                        isActive ? 'bg-[#0066CC] text-white shadow-xs' : 'text-[#1D1D1F] hover:bg-black/5'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs font-semibold text-red-600 p-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Outlet Content with Smooth Page Transition */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div key={location.pathname} className="animate-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default WebLayout;
