import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  Bell,
  User,
  KeyRound,
  Store,
  CheckCircle2,
  AlertCircle,
  LogOut,
  MapPin,
  Sparkles,
  ArrowRight,
  Info,
  Copy,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { scheduleApi, storeApi, userApi } from '../services/api';
import {
  getMondayOfWeek,
  getDaysOfWeek,
  addWeeks,
  formatWeekRange,
  formatVND,
  formatDateToISO,
  getWeekNumberAndYear
} from '../utils/formatters';
import { EmployeeShiftDetailModal } from '../components/employee/EmployeeShiftDetailModal';

export const MySchedulePage = () => {
  const { user, store, roleInStore, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  // Chủ cửa hàng (ADMIN) không được phân ca và không có lịch cá nhân -> Redirect ngay về /dashboard
  const isOwner =
    roleInStore === 'ADMIN' ||
    user?.role === 'ADMIN' ||
    (store?.ownerId && String(store.ownerId) === String(user?._id));
  const isManager = roleInStore === 'MANAGER' || user?.role === 'MANAGER';

  if (isOwner) {
    return <Navigate to="/dashboard" replace />;
  }

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
    age: user?.age || ''
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
            estimatedWage: res.totalSalary || 0
          }
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
    const char = value.slice(-1); // only keep last character
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...inviteCodeDigits];
    newDigits[index] = char;
    setInviteCodeDigits(newDigits);

    // Auto-focus next input
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
    const fullCode = inviteCodeDigits.join('');
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
          message: `Tham gia thành công quán "${res.data?.store?.name}"!`
        });
        await refreshUser();
      }
    } catch (err) {
      setJoinFeedback({
        type: 'error',
        message: err.message || 'Mã mời không đúng hoặc đã hết hạn (60 phút).'
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
        age: Number(profileForm.age)
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
    // Find today's or future shift
    const upcoming = scheduleData.shifts.find((s) => s.date >= today);
    return upcoming || scheduleData.shifts[0];
  }, [scheduleData]);

  return (
    <div className="flex-1 flex flex-col bg-[#FFF7F0] text-[#252525] min-h-full font-['Be_Vietnam_Pro',sans-serif] w-full max-w-lg md:max-w-4xl lg:max-w-5xl mx-auto md:py-8 md:px-4">
      {/* CASE 1: Employee Has Not Joined Any Store Yet */}
      {!store ? (
        <div className="flex-1 p-6 md:p-8 flex flex-col justify-between bg-white md:rounded-3xl md:border md:border-orange-200/80 md:shadow-md my-auto">
          <div>
            {/* Header branding */}
            <div className="text-center pt-2 pb-6 md:pb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF7F0] shadow-sm mx-auto p-2 flex items-center justify-center mb-3 border border-orange-100">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Tham gia Cửa hàng
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                Nhập <b>Mã mời 6 chữ số</b> do Chủ quán cấp, hoặc gửi <b>Email tài khoản</b> của bạn để Chủ quán thêm trực tiếp.
              </p>
            </div>

            {/* 2-Column Responsive Layout on Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
              {/* CÁCH 1: NHẬP MÃ MỜI 6 SỐ */}
              <div className="bg-[#FFFDFB] p-5 md:p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#EA701B] text-white flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="text-sm font-bold text-slate-900">Nhập mã mời 6 chữ số</h3>
                </div>

                <form onSubmit={handleJoinStore} className="space-y-4">
                  <div className="flex justify-center gap-2 sm:gap-2.5">
                    {inviteCodeDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`digit-${idx}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        className="w-11 h-13 text-center text-xl font-extrabold font-mono rounded-xl bg-white border-2 border-slate-200 focus:border-[#EA701B] focus:ring-2 focus:ring-orange-100 text-slate-800 shadow-xs focus:outline-none transition"
                      />
                    ))}
                  </div>

                  {joinFeedback && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        joinFeedback.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {joinFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{joinFeedback.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={joining}
                    className="w-full py-3 bg-[#EA701B] hover:bg-[#D55E0D] text-white font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {joining ? 'Đang xác thực...' : 'Xác nhận mã mời'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="p-3 bg-[#FFF0E5] rounded-xl border border-orange-200/60 text-xs text-slate-600 flex gap-2.5">
                  <Info className="w-4 h-4 text-[#EA701B] shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-600">
                    Mã mời có hiệu lực trong <b>60 phút</b>. Nếu hết hạn, hãy nhờ Chủ quán tạo lại mã mới.
                  </p>
                </div>
              </div>

              {/* CÁCH 2: GỬI EMAIL CHO CHỦ QUÁN */}
              <div className="bg-[#FFFDFB] p-5 md:p-6 rounded-2xl border border-orange-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="text-sm font-bold text-slate-900">Hoặc gửi Email cho Chủ quán</h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-500 mb-1">Email đăng ký của bạn:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-mono text-xs font-bold text-slate-800 select-all truncate">
                        {user?.email || 'N/A'}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUserEmail}
                        className="px-3.5 py-2.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#EA701B] font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition"
                      >
                        {copiedEmail ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Sao chép Email</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-xs text-amber-900 flex gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      Bạn chỉ cần gửi <b>Email ({user?.email})</b> này cho Chủ quán để được thêm vào danh sách nhân sự ngay lập tức!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom user logout */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Đang đăng nhập: <b className="text-slate-800">{user?.name}</b></span>
            <button
              type="button"
              onClick={logout}
              className="text-red-600 font-bold hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      ) : (
        /* CASE 2: Employee Is A Member of Store */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Mobile Top Bar for Manager (quick jump back to dashboard) */}
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
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-orange-300 rounded-lg text-xs font-bold transition"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Trang Quản lý</span>
              </button>
            </div>
          )}

          {/* Desktop Top Header & Tabs (Visible only on md: screens and above) */}
          <div className="hidden md:flex items-center justify-between bg-white px-6 py-3.5 rounded-2xl border border-slate-200/80 shadow-xs mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-[#EA701B] font-bold text-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-extrabold text-slate-900">{store.name}</h1>
                  {isManager && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      Quản lý
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {isManager ? 'Lịch làm việc cá nhân của Quản lý' : 'Kênh nhân viên'}
                </p>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('schedule')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'schedule'
                    ? 'bg-[#EA701B] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Lịch làm việc</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'notifications'
                    ? 'bg-[#EA701B] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>Thông báo</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
                  activeTab === 'profile'
                    ? 'bg-[#EA701B] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-white'
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
                  className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  title="Quay lại Bảng điều khiển quản lý"
                >
                  <LayoutDashboard className="w-4 h-4 text-orange-400" />
                  <span>Về trang Quản lý</span>
                </button>
              )}

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]" title={user?.email}>
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserEmail}
                  className="text-[10px] font-bold text-[#EA701B] hover:underline"
                  title="Sao chép Email"
                >
                  {copiedEmail ? 'Đã chép' : 'Chép'}
                </button>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
            
            {/* TAB 1: LỊCH LÀM VIỆC (MY SCHEDULE) */}
            {activeTab === 'schedule' && (
              <div className="space-y-4 animate-fade-in">
                {/* Store Greeting & Week navigation */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#EA701B]">
                        {store.name}
                      </p>
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        <span>Xin chào, {user?.name?.split(' ').pop() || 'bạn'}!</span>
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      </h2>
                    </div>

                    {/* Week nav arrows */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setCurrentMonday((prev) => addWeeks(prev, -1))}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonday(getMondayOfWeek())}
                        className="px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg"
                      >
                        Hôm nay
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonday((prev) => addWeeks(prev, 1))}
                        className="p-1 hover:bg-white rounded-lg text-slate-600 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    Tuần: {formatWeekRange(currentMonday)}
                  </p>

                  {/* Horizontal 7-Day Date Strip */}
                  <div className="grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    {daysOfWeek.map((day) => {
                      const isSelected = selectedDate === day.dateStr;
                      const hasShift = scheduleData?.shifts?.some((s) => s.date === day.dateStr);

                      return (
                        <button
                          key={day.dateStr}
                          type="button"
                          onClick={() => setSelectedDate(day.dateStr)}
                          className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all duration-150 btn-press ${
                            isSelected
                              ? 'bg-[#EA701B] text-white shadow-md shadow-orange-500/30 scale-105'
                              : 'bg-slate-50 text-slate-700 hover:bg-orange-50 hover:scale-102'
                          }`}
                        >
                          <span className={`text-[10px] font-semibold ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                            {day.shortDayName}
                          </span>
                          <span className="text-xs font-bold font-mono mt-0.5">
                            {day.displayDate.split('/')[0]}
                          </span>
                          {/* Dot indicator if has shift */}
                          <div
                            className={`w-1.5 h-1.5 rounded-full mt-1 ${
                              hasShift
                                ? isSelected
                                  ? 'bg-white'
                                  : 'bg-[#EA701B]'
                                : 'opacity-0'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Bank-Card Style Wage Summary Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-5 rounded-2xl shadow-lg shadow-slate-900/10 hover-lift cursor-default transition-all duration-300">
                  {/* Decorative curved glow */}
                  <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#EA701B]/20 blur-xl pointer-events-none" />

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#EA701B]" />
                      Bảng lương ước tính tuần này
                    </span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono">
                      {formatVND(scheduleData?.stats?.hourlyWage || 0)}/h
                    </span>
                  </div>

                  <div className="text-2xl font-extrabold tracking-tight font-mono text-white mb-3">
                    {formatVND(scheduleData?.stats?.estimatedWage || 0)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Số ca đã nhận:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {scheduleData?.stats?.totalShifts || 0} ca
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Tổng số giờ làm:</span>
                      <span className="font-bold text-slate-200 font-mono">
                        {scheduleData?.stats?.totalHours || 0} giờ
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hero / Next Upcoming Shift Card */}
                {nextUpcomingShift && (
                  <div className="bg-[#FFF0E5] border border-orange-200/80 p-4 rounded-2xl shadow-xs hover-lift transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EA701B] text-white px-2 py-0.5 rounded-md">
                        Ca làm tiếp theo
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-700">
                        {nextUpcomingShift.date}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {nextUpcomingShift.shift?.name || nextUpcomingShift.shiftName || 'Ca làm việc'}
                        </h4>
                        <p className="text-xs text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#EA701B]" />
                          <span>
                            {(nextUpcomingShift.shift?.startTime || nextUpcomingShift.startTime) && (nextUpcomingShift.shift?.endTime || nextUpcomingShift.endTime)
                              ? `${nextUpcomingShift.shift?.startTime || nextUpcomingShift.startTime} — ${nextUpcomingShift.shift?.endTime || nextUpcomingShift.endTime} (${nextUpcomingShift.shift?.durationHours || nextUpcomingShift.hours}h)`
                              : '-'}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveShiftDetail(nextUpcomingShift)}
                        className="px-3 py-1.5 bg-white text-[#EA701B] border border-orange-200 rounded-xl text-xs font-bold shadow-xs hover:bg-orange-50 transition"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                )}

                {/* Shifts For Selected Day Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
                    Lịch ngày {daysOfWeek.find((d) => d.dateStr === selectedDate)?.fullDisplay || selectedDate}
                  </h3>

                  {shiftsForSelectedDate.length === 0 ? (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-700">Không có ca làm trong ngày này</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bạn có thể chọn ngày khác trên thanh thứ hoặc nghỉ ngơi nạp năng lượng!
                      </p>
                    </div>
                  ) : (
                    shiftsForSelectedDate.map((item, idx) => {
                      const isMissed = item.attendanceStatus === 'MISSED';
                      const isPartial = item.attendanceStatus === 'PARTIAL';

                      return (
                        <div
                          key={idx}
                          onClick={() => setActiveShiftDetail(item)}
                          className={`p-4 rounded-2xl border shadow-xs hover:border-[#EA701B] transition cursor-pointer flex items-center justify-between ${
                            isMissed
                              ? 'bg-rose-50/50 border-rose-200'
                              : isPartial
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-white border-slate-200/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isMissed
                                  ? 'bg-rose-100 text-rose-600'
                                  : isPartial
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-orange-100 text-[#EA701B]'
                              }`}
                            >
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4
                                  className={`text-xs font-bold ${
                                    isMissed
                                      ? 'line-through text-slate-400'
                                      : 'text-slate-900'
                                  }`}
                                >
                                  {item.shift?.name || item.shiftName}
                                </h4>
                                {isMissed && (
                                  <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                                    Không hoàn thành
                                  </span>
                                )}
                                {isPartial && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                    Trừ -{formatVND(item.deductedPay || 0)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                {item.shift?.startTime || item.startTime} — {item.shift?.endTime || item.endTime} ({item.shift?.durationHours || item.hours}h)
                                {isPartial && (
                                  <span className="text-emerald-700 font-bold ml-1.5">
                                    • Nhận: {formatVND(item.totalPay !== undefined ? item.totalPay : 0)}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Coworkers badge */}
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.coworkers?.length || 0} đồng nghiệp</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: THÔNG BÁO (NOTIFICATIONS) */}
            {activeTab === 'notifications' && (
              <div className="space-y-3 animate-fade-in">
                <h3 className="text-sm font-bold text-slate-800 px-1">Thông báo & Cập nhật</h3>
                
                {/* Clean notifications mock matching API capabilities */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#EA701B] uppercase tracking-wider">
                      Lịch làm việc
                    </span>
                    <span className="text-[10px] text-slate-400">Vừa xong</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Lịch tuần {formatWeekRange(currentMonday)} đã xuất bản
                  </h4>
                  <p className="text-xs text-slate-500">
                    Chủ quán đã cập nhật và gửi email xác nhận chi tiết ca làm và lương dự toán.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                      Cửa hàng
                    </span>
                    <span className="text-[10px] text-slate-400">Gần đây</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Chào mừng bạn gia nhập {store.name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Tài khoản của bạn đã được kết nối vào hệ thống xếp ca của quán.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: HỒ SƠ CÁ NHÂN (PROFILE) */}
            {activeTab === 'profile' && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 text-[#EA701B] font-extrabold text-xl mx-auto flex items-center justify-center border-2 border-orange-200 mb-2">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{user?.name}</h3>
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-600 font-mono bg-slate-100 px-3 py-1 rounded-lg">
                      {user?.email}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyUserEmail}
                      className="text-[11px] font-bold text-[#EA701B] hover:underline flex items-center gap-1"
                    >
                      {copiedEmail ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Chép Email</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="mt-2 inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                    Nhân viên tại {store.name}
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleUpdateProfile} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Thông tin cá nhân
                  </h4>

                  {profileMsg && (
                    <div className={`p-2.5 rounded-xl text-xs font-semibold ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                      {profileMsg.message}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Họ và tên</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Giới tính</label>
                      <select
                        value={profileForm.gender}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                        <option value="Khác">Khác</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tuổi</label>
                      <input
                        type="number"
                        value={profileForm.age}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, age: e.target.value }))}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full py-2.5 bg-[#EA701B] hover:bg-[#D55E0D] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
                  >
                    {savingProfile ? 'Đang lưu...' : 'Lưu cập nhật'}
                  </button>
                </form>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={logout}
                  className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border border-red-100"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất tài khoản
                </button>
              </div>
            )}

          </div>

          {/* iOS Bottom Navigation Bar (Hidden on desktop md:hidden) */}
          <div className="md:hidden bg-white border-t border-slate-200/80 px-6 py-2 flex items-center justify-around select-none">
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`flex flex-col items-center py-1 transition ${
                activeTab === 'schedule' ? 'text-[#EA701B]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">Lịch làm</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notifications')}
              className={`flex flex-col items-center py-1 transition ${
                activeTab === 'notifications' ? 'text-[#EA701B]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Bell className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">Thông báo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex flex-col items-center py-1 transition ${
                activeTab === 'profile' ? 'text-[#EA701B]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-bold mt-1">Cá nhân</span>
            </button>

            {isManager && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex flex-col items-center py-1 text-slate-500 hover:text-[#EA701B] transition"
                title="Về Trang Quản lý"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span className="text-[10px] font-bold mt-1">Quản lý</span>
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
