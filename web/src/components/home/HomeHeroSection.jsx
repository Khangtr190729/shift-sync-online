import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export const HomeHeroSection = ({ scrollToSection }) => {
  return (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden bg-white">
      {/* Subtle decorative background gradient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-blue-100/40 via-sky-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/60 text-[#0066cc] text-xs font-semibold shadow-xs animate-stagger-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Nền tảng Quản trị & Tự động Xếp ca</span>
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-[#1d1d1f] tracking-tight leading-[1.08] max-w-4xl mx-auto animate-stagger-2">
          Xếp ca thông minh — Tự động tính lương{' '}
          <span className="text-[#0066cc]">
            chuẩn xác từng phút
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#6e6e73] max-w-2xl mx-auto leading-relaxed animate-stagger-3">
          Giải pháp thay thế hoàn toàn việc xếp ca bằng giấy bút và bảng tính thủ công. Tối ưu thời gian,
          ngăn chặn trùng ca thời gian thực, đánh giá ca làm và tự động gửi email lịch trực kèm bảng
          lương chỉ với 1 cú nhấp chuột.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 animate-stagger-4">
          <Link
            to="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs btn-press transition-all"
          >
            <span>Đăng nhập ngay</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => scrollToSection('interactive-preview')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#f5f5f7] hover:bg-[#e5e5e7] text-[#1d1d1f] text-xs font-semibold rounded-full border border-[#e5e5e7] btn-press transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-[#0066cc] fill-[#0066cc]" />
            <span>Xem giao diện thực tế</span>
          </button>
        </div>

        {/* Value check pills */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-[#6e6e73]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
            <span>Không cần cài đặt phức tạp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
            <span>Tự động gửi email thông báo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#34c759]" />
            <span>Dễ dàng dùng trên điện thoại & máy tính</span>
          </div>
        </div>

        {/* Interactive Timetable Mockup Preview */}
        <div
          id="interactive-preview"
          className="pt-8 max-w-5xl mx-auto relative group animate-page-enter"
        >
          <div className="bg-white rounded-2xl shadow-sm border border-[#e5e5e7] overflow-hidden text-left">
            {/* Window Header */}
            <div className="px-6 py-3.5 bg-[#f5f5f7] border-b border-[#e5e5e7] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <span className="text-xs font-medium text-[#86868b] ml-3">
                  Lịch làm việc tuần
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold flex items-center gap-1 border border-emerald-200/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Đã xuất bản & Đã gửi email
                </span>
              </div>
            </div>

            {/* Mockup Timetable Content */}
            <div className="p-6 overflow-x-auto space-y-4">
              <div className="grid grid-cols-4 gap-3 min-w-[650px]">
                {/* Column 1: Shift Info */}
                <div className="p-4 bg-blue-50/40 border border-blue-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#0066cc]">Ca Sáng</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#1d1d1f] font-medium border border-[#e5e5e7]">
                      07:00 - 12:00
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#1d1d1f]">2 Nhân viên:</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-[#e5e5e7]/80 shadow-2xs">
                      <span className="font-medium text-[#1d1d1f]">Nguyễn Văn A</span>
                      <span className="text-emerald-700 font-mono font-semibold">125.000đ</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-[#e5e5e7]/80 shadow-2xs">
                      <span className="font-medium text-[#1d1d1f]">Trần Thị B</span>
                      <span className="text-emerald-700 font-mono font-semibold">125.000đ</span>
                    </div>
                  </div>
                </div>

                {/* Column 2: Shift Info */}
                <div className="p-4 bg-indigo-50/40 border border-indigo-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-700">Ca Chiều</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#1d1d1f] font-medium border border-[#e5e5e7]">
                      12:30 - 17:30
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#1d1d1f]">2 Nhân viên:</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-[#e5e5e7]/80 shadow-2xs">
                      <span className="font-medium text-[#1d1d1f]">Lê Hoàng C</span>
                      <span className="text-emerald-700 font-mono font-semibold">125.000đ</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-[#e5e5e7]/80 shadow-2xs">
                      <span className="font-medium text-[#1d1d1f]">Phạm Quỳnh D</span>
                      <span className="text-emerald-700 font-mono font-semibold">125.000đ</span>
                    </div>
                  </div>
                </div>

                {/* Column 3: Shift Info */}
                <div className="p-4 bg-purple-50/40 border border-purple-200/60 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-700">Ca Tối</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-[#1d1d1f] font-medium border border-[#e5e5e7]">
                      18:00 - 22:30
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#1d1d1f]">2 Nhân viên:</p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-[#e5e5e7]/80 shadow-2xs">
                      <span className="font-medium text-[#1d1d1f]">Vũ Minh E</span>
                      <span className="text-emerald-700 font-mono font-semibold">112.500đ</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-[#e5e5e7]/80 shadow-2xs">
                      <span className="font-medium text-[#1d1d1f]">Hoàng Thu F</span>
                      <span className="text-emerald-700 font-mono font-semibold">112.500đ</span>
                    </div>
                  </div>
                </div>

                {/* Column 4: Payroll & Metric Card */}
                <div className="p-4 bg-[#1d1d1f] text-white rounded-xl flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-[#2997ff] uppercase tracking-wider">
                      Dự toán tuần này
                    </span>
                    <h4 className="text-xl font-mono font-semibold text-white mt-1">3.450.000đ</h4>
                    <p className="text-[11px] text-[#86868b] mt-1">28 lượt ca • 6 nhân sự</p>
                  </div>
                  <div className="pt-3 border-t border-[#333333] flex items-center justify-between text-[11px]">
                    <span className="text-emerald-400 font-medium">● 0 xung đột</span>
                    <span className="text-[#86868b]">100% tự động</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSection;
