import React from 'react';
import { formatWeekRange } from '../../utils/formatters';

export const EmployeeNotificationsSection = ({ store, currentMonday }) => {
  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-sm font-semibold text-[#1d1d1f] px-1 tracking-tight">Thông báo & Cập nhật</h3>

      <div className="bg-white p-4 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-[#0066cc] uppercase tracking-wider">
            Lịch làm việc
          </span>
          <span className="text-[10px] text-[#86868b]">Vừa xong</span>
        </div>
        <h4 className="text-xs font-semibold text-[#1d1d1f]">
          Lịch tuần {formatWeekRange(currentMonday)} đã xuất bản
        </h4>
        <p className="text-xs text-[#6e6e73]">
          Chủ quán đã cập nhật và gửi email xác nhận chi tiết ca làm và lương dự toán.
        </p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-[#e5e5e7] shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-[#34c759] uppercase tracking-wider">
            Cửa hàng
          </span>
          <span className="text-[10px] text-[#86868b]">Gần đây</span>
        </div>
        <h4 className="text-xs font-semibold text-[#1d1d1f]">
          Chào mừng bạn gia nhập {store?.name || 'cửa hàng'}
        </h4>
        <p className="text-xs text-[#6e6e73]">
          Tài khoản của bạn đã được kết nối vào hệ thống xếp ca của quán.
        </p>
      </div>
    </div>
  );
};

