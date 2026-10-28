import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Calendar,
  Bell,
  User,
  Store,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { scheduleApi, storeApi, userApi } from '../services/api';
import {
  getMondayOfWeek,
  getDaysOfWeek,
  formatDateToISO,
  getWeekNumberAndYear,
} from '../utils/formatters';
import { EmployeeShiftDetailModal } from '../components/employee/EmployeeShiftDetailModal';
import { JoinStoreByCodeSection } from '../components/employee/JoinStoreByCodeSection';
import { PersonalScheduleSection } from '../components/employee/PersonalScheduleSection';
import { EmployeeProfileSection } from '../components/employee/EmployeeProfileSection';
import { EmployeeNotificationsSection } from '../components/employee/EmployeeNotificationsSection';

export const MySchedulePage = () => {
  const { user, store, roleInStore, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Chủ cửa hàng (ADMIN) không được phân ca và không có lịch cá nhân -> Redirect ngay về /dashboard
  const isOwner =
    roleInStore === 'ADMIN' ||
    user?.role === 'ADMIN' ||
    (store?.ownerId && String(store.ownerId) === String(user?._id));
  const isManager = roleInStore === 'MANAGER' || user?.role === 'MANAGER';

  // Navigation tab: 'schedule' | 'notifications' | 'profile'
  const [activeTab, setActiveTab] = useState('schedule');

  // Schedule states
  const [currentMonday, setCurrentMonday] = useState(() => getMondayOfWeek());
  const [selectedDate, setSelectedDate] = useState(() => formatDateToISO(new Date()));
  const [scheduleData, setScheduleData] = useState(null);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [activeShiftDetail, setActiveShiftDetail] = useState(null);

  // Join store code state (6 digits)
  const [inviteCodeDigits, setInviteCodeDigits] = useState(['', '', '', '', '', '']);
  const [joining, setJoining] = useState(false);
  const [joinFeedback, setJoinFeedback] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyUserEmail = () => {
    const email = user?.email || '';
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Profile modal / state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    gender: user?.gender || 'Nam',
    age: user?.age || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const daysOfWeek = useMemo(() => getDaysOfWeek(currentMonday), [currentMonday]);
  const { week, year } = useMemo(() => getWeekNumberAndYear(currentMonday), [currentMonday]);

  // Load employee's personal schedule
  const loadPersonalSchedule = useCallback(async () => {
    if (!store) return;
    try {
      setLoadingSchedule(true);
      const res = await scheduleApi.getMySchedule(week, year, store?._id);
      if (res.success && (res.shifts || res.data)) {
        setScheduleData({
          shifts: res.shifts || res.data?.shifts || [],
          stats: {
            totalShifts: res.shifts?.length || 0,
            totalHours: res.totalHours || 0,
            hourlyWage: res.hourlyWage || 0,
            estimatedWage: res.totalSalary || 0,
          },
        });
      } else {
        setScheduleData(null);
      }
    } catch (err) {
      console.error('Error fetching personal schedule:', err);
      setScheduleData(null);
    } finally {
      setLoadingSchedule(false);
    }
  }, [store, week, year]);

  useEffect(() => {
    loadPersonalSchedule();
  }, [loadPersonalSchedule]);

  // Handle 6-digit code change
  const handleDigitChange = (index, value) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...inviteCodeDigits];
    newDigits[index] = char;
    setInviteCodeDigits(newDigits);

    if (char && index < 5) {
      const nextInput = document.getElementById(`digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !inviteCodeDigits[index] && index > 0) {
      const prevInput = document.getElementById(`digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Submit Join by 6-digit code
  const handleJoinStore = async (e) => {
    e.preventDefault();
    const fullCode = inviteCodeDigits.join('').trim();
    if (fullCode.length !== 6) {
      setJoinFeedback({ type: 'error', message: 'Vui lòng nhập đủ 6 chữ số mã mời.' });
      return;
    }

    try {
      setJoining(true);
      setJoinFeedback(null);
      const res = await storeApi.joinByCode(fullCode);
      if (res.success) {
        setJoinFeedback({
          type: 'success',
          message: `Tham gia thành công quán "${res.data?.store?.name}"!`,
        });
        await refreshUser();
      }
    } catch (err) {
      setJoinFeedback({
        type: 'error',
        message: err.message || 'Mã mời không đúng hoặc đã hết hạn (60 phút).',
      });
    } finally {
      setJoining(false);
    }
  };

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileMsg(null);
      const res = await userApi.updateProfile({
        name: profileForm.name,
        gender: profileForm.gender,
        age: Number(profileForm.age),
      });
      if (res.success) {
        setProfileMsg({ type: 'success', message: 'Cập nhật thông tin thành công!' });
        await refreshUser();
      }
    } catch (err) {
      setProfileMsg({ type: 'error', message: err.message || 'Lỗi cập nhật' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Get shifts for the currently selected date in the week strip
  const shiftsForSelectedDate = useMemo(() => {
    if (!scheduleData?.shifts) return [];
    return scheduleData.shifts.filter((s) => s.date === selectedDate);
  }, [scheduleData, selectedDate]);

  // Find next upcoming shift (hero card)
  const nextUpcomingShift = useMemo(() => {
    if (!scheduleData?.shifts || scheduleData.shifts.length === 0) return null;
    const today = formatDateToISO(new Date());
    const upcoming = scheduleData.shifts.find((s) => s.date >= today);
    return upcoming || scheduleData.shifts[0];
  }, [scheduleData]);

  if (isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f5f5f7] text-[#1d1d1f] min-h-full font-sans w-full max-w-lg md:max-w-4xl lg:max-w-5xl mx-auto md:py-8 md:px-4">
      {/* CASE 1: Employee Has Not Joined Any Store Yet */}
      {!store ? (
        <JoinStoreByCodeSection
          user={user}
          inviteCodeDigits={inviteCodeDigits}
          handleDigitChange={handleDigitChange}
          handleDigitKeyDown={handleDigitKeyDown}
          handleJoinStore={handleJoinStore}
          joining={joining}
          joinFeedback={joinFeedback}
          copiedEmail={copiedEmail}
          handleCopyUserEmail={handleCopyUserEmail}
          logout={logout}
        />
      ) : (
        /* CASE 2: Employee Is A Member of Store */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Mobile Top Bar for Manager */}
          {isManager && (
            <div className="md:hidden bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between shadow-xs mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  QUẢN LÝ
                </span>
                <span className="text-xs font-bold text-slate-200">Lịch làm của bạn</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-orange-300 rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Trang Quản lý</span>
              </button>
            </div>
          )}

          {/* Desktop Top Header & Tabs */}
          <div className="hidden md:flex items-center justify-between bg-white px-6 py-3.5 rounded-2xl border border-[#e5e5e7] shadow-xs mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#0066cc] font-medium text-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-[#1d1d1f] tracking-tight">{store.name}</h1>
                  {isManager && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#0066cc] border border-blue-200/60">
                      Quản lý
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6e6e73]">
                  {isManager ? 'Lịch làm việc cá nhân của Quản lý' : 'Kênh nhân viên'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="flex items-center gap-1 bg-[#f5f5f7] border border-[#e5e5e7] p-1 rounded-full">
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer btn-press ${
                  activeTab === 'schedule'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Lịch làm việc</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer btn-press ${
                  activeTab === 'notifications'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Thông báo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium transition cursor-pointer btn-press ${
                  activeTab === 'profile'
                    ? 'bg-white text-[#1d1d1f] shadow-xs'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Cá nhân</span>
              </button>
            </div>

            {/* Right: Return to Management (if Manager), User Email & Logout */}
            <div className="flex items-center gap-3">
              {isManager && (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center gap-2 px-4 py-2 bg-[#1d1d1f] hover:bg-[#333333] text-white rounded-full text-xs font-medium transition shadow-xs btn-press cursor-pointer"
                  title="Quay lại Bảng điều khiển quản lý"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#0066cc]" />
                  <span>Về trang Quản lý</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fafafc] border border-[#e5e5e7] rounded-full">
                <span className="text-xs font-normal text-[#1d1d1f] truncate max-w-[200px]" title={user?.email}>
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserEmail}
                  className="text-[10px] font-medium text-[#0066cc] hover:underline cursor-pointer"
                  title="Sao chép Email"
                >
                  {copiedEmail ? 'Đã chép' : 'Chép'}
                </button>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-[#86868b] hover:text-rose-600 hover:bg-rose-50 rounded-full transition cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Scrollable Tab Content with Animated Transition */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            <div key={activeTab} className="animate-page-enter">
              {activeTab === 'schedule' && (
                <PersonalScheduleSection
                  store={store}
                  user={user}
                  currentMonday={currentMonday}
                  setCurrentMonday={setCurrentMonday}
                  daysOfWeek={daysOfWeek}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  scheduleData={scheduleData}
                  nextUpcomingShift={nextUpcomingShift}
                  shiftsForSelectedDate={shiftsForSelectedDate}
                  setActiveShiftDetail={setActiveShiftDetail}
                />
              )}

              {activeTab === 'notifications' && (
                <EmployeeNotificationsSection
                  store={store}
                  currentMonday={currentMonday}
                />
              )}

              {activeTab === 'profile' && (
                <EmployeeProfileSection
                  user={user}
                  store={store}
                  copiedEmail={copiedEmail}
                  handleCopyUserEmail={handleCopyUserEmail}
                  profileForm={profileForm}
                  setProfileForm={setProfileForm}
                  profileMsg={profileMsg}
                  savingProfile={savingProfile}
                  handleUpdateProfile={handleUpdateProfile}
                  logout={logout}
                />
              )}
            </div>
          </div>

          {/* iOS Bottom Navigation Bar (Hidden on desktop) */}
          <div className="md:hidden bg-white border-t border-[#e5e5e7] px-6 py-2 flex items-center justify-around select-none">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center py-1 transition cursor-pointer ${
                activeTab === 'schedule' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">Lịch làm</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex flex-col items-center py-1 transition cursor-pointer ${
                activeTab === 'notifications' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">Thông báo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-1 transition cursor-pointer ${
                activeTab === 'profile' ? 'text-[#0066cc]' : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-1">Cá nhân</span>
            </button>

            {isManager && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex flex-col items-center py-1 text-[#86868b] hover:text-[#0066cc] transition cursor-pointer"
                title="Về Trang Quản lý"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-medium mt-1">Quản lý</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SHIFT DETAILS MODAL */}
      <EmployeeShiftDetailModal
        activeShiftDetail={activeShiftDetail}
        onClose={() => setActiveShiftDetail(null)}
        storeName={store?.name}
      />
    </div>
  );
};

export default MySchedulePage;
