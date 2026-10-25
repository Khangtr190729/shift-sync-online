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
  Store as StoreIcon,
  ShieldCheck,
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
    <div className="min-h-screen flex bg-[#FFF7F0] text-[#252525]">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#E5E7EB] shrink-0 sticky top-0 h-screen select-none">
        {/* Brand Logo Header */}
        <div className="h-20 flex items-center px-6 border-b border-[#F1F5F9]">
          <Logo size="md" />
        </div>

        {/* Current Store Switcher */}
        {store && (
          <div className="mx-4 my-3">
            <StoreSwitcher />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ease-out btn-press group ${
                  isActive
                    ? 'bg-[#EA701B] text-white shadow-lg shadow-orange-500/25 translate-x-1.5'
                    : 'text-slate-600 hover:bg-[#FFF0E5] hover:text-[#EA701B] hover:translate-x-1.5'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-115 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User Mini Profile in Sidebar Footer */}
        <div className="p-4 border-t border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-[#EA701B] font-bold text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Người dùng'}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
                {roleInfo.text}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 lg:h-20 bg-white border-b border-[#E5E7EB] px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <h1 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
                {navItems.find((n) => n.path === location.pathname)?.name || 'Ca Làm Online'}
              </h1>
              {store && (
                <p className="text-xs text-slate-500 hidden sm:block">
                  Cơ sở: <span className="font-semibold text-slate-700">{store.name}</span> — {store.address || 'Chưa cập nhật địa chỉ'}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Link to Personal Schedule for Manager */}
            {isShiftEligible && (
              <NavLink
                to="/my-schedule"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#EA701B] border border-orange-200/80 text-xs font-bold transition shadow-xs"
                title="Xem ca làm việc cá nhân của bạn"
              >
                <CalendarClock className="w-4 h-4" />
                <span className="hidden sm:inline">Lịch của tôi</span>
              </NavLink>
            )}

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition"
              >
                <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 text-[#EA701B] font-bold text-xs flex items-center justify-center">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left text-xs">
                  <div className="font-bold text-slate-800">{user?.name}</div>
                  <div className="text-[10px] text-slate-500">{roleInfo.text}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 z-50 animate-dropdown-enter"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-[11px] text-slate-500">Đăng nhập bằng</p>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-xs font-bold text-slate-800 truncate" title={user?.email}>
                        {user?.email}
                      </p>
                      <button
                        type="button"
                        onClick={handleCopyEmail}
                        className="text-[10px] font-bold text-[#EA701B] hover:underline flex items-center gap-1 shrink-0 btn-press"
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
                    className="block px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-[#EA701B] transition-colors"
                  >
                    Hồ sơ cá nhân
                  </NavLink>
                  {isShiftEligible && (
                    <NavLink
                      to="/my-schedule"
                      className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#EA701B] hover:bg-orange-50 transition-colors"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      Lịch làm của tôi
                    </NavLink>
                  )}
                  {isOwner && (
                    <NavLink
                      to="/store-management"
                      className="block px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-[#EA701B] transition-colors"
                    >
                      Cài đặt cửa hàng
                    </NavLink>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors btn-press"
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
          <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex animate-backdrop-fade">
            <div className="w-64 bg-white h-full shadow-2xl flex flex-col p-4 animate-modal-pop">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Logo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 btn-press"
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
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 btn-press ${
                        isActive ? 'bg-[#EA701B] text-white shadow-md' : 'text-slate-600 hover:bg-orange-50'
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
                className="flex items-center gap-2 text-xs font-semibold text-red-600 p-2 btn-press"
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
