import React from 'react';
import { UserPlus } from 'lucide-react';

export const StoreDirectInviteForm = ({
  directForm,
  setDirectForm,
  invitingDirect,
  onDirectInvite,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e7] shadow-xs p-6 space-y-4">
      <div className="pb-3 border-b border-[#e5e5e7] flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center">
          <UserPlus className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#1d1d1f]">Mời nhân viên bằng Email</h3>
          <p className="text-xs text-[#6e6e73]">
            Chủ động thêm nhân viên đã có tài khoản vào danh sách nhân sự của quán qua địa chỉ Email
          </p>
        </div>
      </div>

      <form onSubmit={onDirectInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
            Email nhân viên <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            placeholder="nhanvien@gmail.com"
            value={directForm.email}
            onChange={(e) => setDirectForm((prev) => ({ ...prev, email: e.target.value }))}
            required
            className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
            Lương theo giờ khởi điểm (VNĐ/giờ)
          </label>
          <input
            type="number"
            step="1000"
            value={directForm.hourlyWage}
            onChange={(e) => setDirectForm((prev) => ({ ...prev, hourlyWage: e.target.value }))}
            className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-mono font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
            Hình thức làm việc
          </label>
          <select
            value={directForm.employmentType}
            onChange={(e) =>
              setDirectForm((prev) => ({ ...prev, employmentType: e.target.value }))
            }
            className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-normal text-[#1d1d1f] bg-white focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
          >
            <option value="PART_TIME">Bán thời gian (Part-time)</option>
            <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
          </select>
        </div>

        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            disabled={invitingDirect}
            className="px-5 py-2.5 bg-[#1d1d1f] hover:bg-[#333333] text-white text-xs font-medium rounded-full transition shadow-xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-white" />
            <span>{invitingDirect ? 'Đang thêm...' : 'Thêm nhân viên ngay'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

