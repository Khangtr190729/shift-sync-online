import React, { useState } from 'react';
import { Copy, CheckCircle2, LogOut, KeyRound, Lock, AlertCircle } from 'lucide-react';
import { userApi } from '../../services/api';

export const EmployeeProfileSection = ({
  user,
  store,
  copiedEmail,
  handleCopyUserEmail,
  profileForm,
  setProfileForm,
  profileMsg,
  savingProfile,
  handleUpdateProfile,
  logout,
}) => {
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Vui lòng điền đầy đủ các trường mật khẩu.' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu xác nhận không khớp với mật khẩu mới!' });
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordFeedback(null);
      const res = await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.success) {
        setPasswordFeedback({
          type: 'success',
          message: 'Đổi mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới cho các lần đăng nhập sau.',
        });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordFeedback({
        type: 'error',
        message: err.message || 'Mật khẩu hiện tại không chính xác. Vui lòng kiểm tra lại.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Account Info Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e5e5e7] shadow-xs text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0066cc] font-semibold text-xl mx-auto flex items-center justify-center border border-blue-200/60 mb-2">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <h3 className="text-sm font-semibold text-[#1d1d1f]">{user?.name}</h3>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-xs text-[#6e6e73] font-mono bg-[#f5f5f7] border border-[#e5e5e7] px-3 py-1 rounded-full">
            {user?.email}
          </span>
          <button
            type="button"
            onClick={handleCopyUserEmail}
            className="text-[11px] font-medium text-[#0066cc] hover:underline flex items-center gap-1 cursor-pointer btn-press"
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
        <div className="mt-2 inline-block px-3 py-0.5 rounded-full bg-blue-50 text-[#0066cc] border border-blue-200/60 text-xs font-medium">
          Nhân viên tại {store?.name}
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-5 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-3">
        <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
          Thông tin cá nhân
        </h4>

        {profileMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'}`}>
            {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{profileMsg.message}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">Họ và tên</label>
          <input
            type="text"
            value={profileForm.name}
            onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">Giới tính</label>
            <select
              value={profileForm.gender}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
              className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
            >
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">Tuổi</label>
            <input
              type="number"
              value={profileForm.age}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, age: e.target.value }))}
              className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingProfile}
          className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full shadow-xs transition btn-press disabled:opacity-50 cursor-pointer"
        >
          {savingProfile ? 'Đang lưu...' : 'Lưu cập nhật'}
        </button>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="bg-white p-5 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0066cc]" />
          <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
            Đổi mật khẩu
          </h4>
        </div>

        {passwordFeedback && (
          <div className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${passwordFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'}`}>
            {passwordFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
            Mật khẩu hiện tại <span className="text-rose-500">*</span>
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
            autoComplete="current-password"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
              Mật khẩu mới (tối thiểu 6 ký tự) <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
              Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPassword}
          className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full shadow-xs transition btn-press disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>{savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}</span>
        </button>
      </form>

      {/* Logout Button */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100/80 rounded-full text-xs font-medium transition btn-press flex items-center justify-center gap-2 border border-rose-200/60 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất tài khoản
      </button>
    </div>
  );
};

