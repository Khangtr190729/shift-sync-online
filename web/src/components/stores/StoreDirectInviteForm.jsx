import React from 'react';
import { UserPlus } from 'lucide-react';

export const StoreDirectInviteForm = ({
  directForm,
  setDirectForm,
  invitingDirect,
  onDirectInvite,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
      <div className="pb-3 border-b border-slate-100 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <UserPlus className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Mời nhân viên bằng Email</h3>
          <p className="text-xs text-slate-500">
            Chủ động thêm nhân viên đã có tài khoản vào danh sách nhân sự của quán qua địa chỉ Email
          </p>
        </div>
      </div>

      <form onSubmit={onDirectInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Email nhân viên <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="nhanvien@gmail.com"
            value={directForm.email}
            onChange={(e) => setDirectForm((prev) => ({ ...prev, email: e.target.value }))}
            required
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Lương theo giờ khởi điểm (VNĐ/giờ)
          </label>
          <input
            type="number"
            step="1000"
            value={directForm.hourlyWage}
            onChange={(e) => setDirectForm((prev) => ({ ...prev, hourlyWage: e.target.value }))}
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#EA701B]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Hình thức làm việc
          </label>
          <select
            value={directForm.employmentType}
            onChange={(e) =>
              setDirectForm((prev) => ({ ...prev, employmentType: e.target.value }))
            }
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 bg-white"
          >
            <option value="PART_TIME">Bán thời gian (Part-time)</option>
            <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
          </select>
        </div>

        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={invitingDirect}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#EA701B]" />
            <span>{invitingDirect ? 'Đang thêm...' : 'Thêm nhân viên ngay'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

