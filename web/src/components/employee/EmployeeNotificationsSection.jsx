import React from 'react';
import { formatWeekRange } from '../../utils/formatters';

export const EmployeeNotificationsSection = ({ store, currentMonday }) => {
  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-sm font-bold text-slate-800 px-1">Thông báo & Cập nhật</h3>

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
          Chào mừng bạn gia nhập {store?.name || 'cửa hàng'}
        </h4>
        <p className="text-xs text-slate-500">
          Tài khoản của bạn đã được kết nối vào hệ thống xếp ca của quán.
        </p>
      </div>
    </div>
  );
};

