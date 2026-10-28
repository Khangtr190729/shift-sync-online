import React from 'react';

export const HomeMetricsSection = () => {
  return (
    <section className="py-12 bg-[#fafafc] border-y border-[#e5e5e7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-semibold text-[#0066cc] font-mono tracking-tight">99.8%</p>
            <p className="text-xs font-semibold text-[#1d1d1f]">Không lo trùng ca</p>
            <p className="text-[11px] text-[#86868b]">Phát hiện xung đột giờ tức thời</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] font-mono tracking-tight">4+ Giờ</p>
            <p className="text-xs font-semibold text-[#1d1d1f]">Tiết kiệm mỗi tuần</p>
            <p className="text-[11px] text-[#86868b]">Xếp lịch tự động chỉ 1 cú click</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-semibold text-[#34c759] font-mono tracking-tight">100%</p>
            <p className="text-xs font-semibold text-[#1d1d1f]">Chuẩn xác tiền lương</p>
            <p className="text-[11px] text-[#86868b]">Tự động tính lương theo giờ & ca</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-semibold text-[#af52de] font-mono tracking-tight">Tức thì</p>
            <p className="text-xs font-semibold text-[#1d1d1f]">Gửi Email thông báo</p>
            <p className="text-[11px] text-[#86868b]">Báo lịch & lương về hộp thư nhân viên</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeMetricsSection;
