import React from 'react';
import { Copy, CheckCircle2, LogOut } from 'lucide-react';

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
  return (
    <div className="space-y-4 animate-fade-in">
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
            className="text-[11px] font-medium text-[#0066cc] hover:underline flex items-center gap-1 cursor-pointer"
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

      {/* Edit Form */}
      <form onSubmit={handleUpdateProfile} className="bg-white p-5 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-3">
        <h4 className="text-xs font-semibold text-[#1d1d1f] uppercase tracking-wider">
          Thông tin cá nhân
        </h4>

        {profileMsg && (
          <div className={`p-2.5 rounded-xl text-xs font-medium ${profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'}`}>
            {profileMsg.message}
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
          className="w-full py-2.5 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full shadow-xs transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {savingProfile ? 'Đang lưu...' : 'Lưu cập nhật'}
        </button>
      </form>

      {/* Logout Button */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100/80 rounded-full text-xs font-medium transition active:scale-[0.98] flex items-center justify-center gap-2 border border-rose-200/60 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất tài khoản
      </button>
    </div>
  );
};

