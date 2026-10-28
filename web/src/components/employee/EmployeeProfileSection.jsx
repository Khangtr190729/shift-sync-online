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
            className="text-[11px] font-bold text-[#EA701B] hover:underline flex items-center gap-1 cursor-pointer"
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
          Nhân viên tại {store?.name}
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
          className="w-full py-2.5 bg-[#EA701B] hover:bg-[#D55E0D] text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
        >
          {savingProfile ? 'Đang lưu...' : 'Lưu cập nhật'}
        </button>
      </form>

      {/* Logout Button */}
      <button
        type="button"
        onClick={logout}
        className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border border-red-100 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Đăng xuất tài khoản
      </button>
    </div>
  );
};

