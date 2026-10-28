import React, { useState } from 'react';
import {
  User,
  KeyRound,
  Save,
  CheckCircle2,
  AlertCircle,
  X,
  Shield,
  Mail,
  Calendar,
  Copy
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userApi } from '../services/api';
import { getRoleLabel } from '../utils/formatters';

export const ProfilePage = () => {
  const { user, roleInStore, refreshUser } = useAuth();
  const roleBadge = getRoleLabel(roleInStore || user?.role);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    const email = user?.email || '';
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  // Profile info form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    gender: user?.gender || 'Nam',
    age: user?.age || 22
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState(null);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      setProfileFeedback(null);
      const res = await userApi.updateProfile({
        name: profileForm.name,
        gender: profileForm.gender,
        age: Number(profileForm.age)
      });
      if (res.success) {
        setProfileFeedback({ type: 'success', message: 'Cập nhật thông tin thành công!' });
        await refreshUser();
      }
    } catch (err) {
      setProfileFeedback({ type: 'error', message: err.message || 'Lỗi khi cập nhật thông tin' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu mới nhập lại không khớp!' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
      return;
    }

    try {
      setSavingPassword(true);
      setPasswordFeedback(null);
      const res = await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      if (res.success) {
        setPasswordFeedback({ type: 'success', message: 'Đổi mật khẩu thành công!' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPasswordFeedback({ type: 'error', message: err.message || 'Mật khẩu hiện tại không đúng' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e5e5e7] shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#1d1d1f] tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-[#0066cc]" />
            <span>Hồ sơ cá nhân</span>
          </h2>
          <p className="text-xs text-[#6e6e73] mt-0.5">
            Cập nhật họ tên, giới tính, tuổi và bảo mật tài khoản.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${roleBadge.color}`}>
          <Shield className="w-3.5 h-3.5" />
          {roleBadge.text}
        </span>
      </div>

      {/* SECTION 1: EDIT PROFILE */}
      <div className="bg-white rounded-2xl border border-[#e5e5e7] shadow-xs p-6 space-y-4">
        <h3 className="text-xs font-semibold text-[#1d1d1f] pb-2 border-b border-[#e5e5e7] flex items-center gap-2">
          <User className="w-4 h-4 text-[#0066cc]" />
          <span>Thông tin cá nhân</span>
        </h3>

        {profileFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              profileFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-800 border border-rose-200/60'
            }`}
          >
            {profileFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{profileFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Họ và tên</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#1d1d1f]">Email tài khoản</label>
                <span className="text-[10px] text-[#86868b]">Dùng để Chủ quán mời bạn vào cửa hàng</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-2.5 rounded-xl border border-[#e5e5e7] text-xs font-mono bg-[#f5f5f7] text-[#6e6e73] select-all"
                />
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3.5 py-2.5 bg-blue-50/60 hover:bg-blue-100/60 border border-blue-200/60 text-[#0066cc] rounded-xl text-xs font-medium transition flex items-center gap-1.5 shrink-0"
                  title="Sao chép Email"
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

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Giới tính</label>
              <select
                value={profileForm.gender}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, gender: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-medium text-[#1d1d1f] bg-white focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Tuổi</label>
              <input
                type="number"
                min="16"
                max="80"
                value={profileForm.age}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, age: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-mono font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full transition shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{savingProfile ? 'Đang lưu...' : 'Lưu thông tin'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: CHANGE PASSWORD */}
      <div className="bg-white rounded-2xl border border-[#e5e5e7] shadow-xs p-6 space-y-4">
        <h3 className="text-xs font-semibold text-[#1d1d1f] pb-2 border-b border-[#e5e5e7] flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0066cc]" />
          <span>Đổi mật khẩu</span>
        </h3>

        {passwordFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              passwordFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                : 'bg-rose-50 text-rose-800 border border-rose-200/60'
            }`}
          >
            {passwordFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>{passwordFeedback.message}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Mật khẩu mới</label>
              <input
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Nhập lại mật khẩu mới
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="px-5 py-2.5 bg-[#1d1d1f] hover:bg-[#333333] text-white text-xs font-semibold rounded-full transition shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-2"
            >
              <KeyRound className="w-4 h-4 text-[#0066cc]" />
              <span>{savingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu ngay'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
