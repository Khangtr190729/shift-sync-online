import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

export const AppleLogo = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.44c.59-.73 1-1.74.88-2.75-.86.04-1.92.58-2.53 1.3-.54.63-.99 1.66-.86 2.65.96.08 1.93-.49 2.51-1.2z" />
  </svg>
);

export const GooglePlayLogo = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M3.6 1.8c-.2.2-.4.6-.4 1.1v18.2c0 .5.2.9.4 1.1l10.4-10.2L3.6 1.8z"
    />
    <path
      fill="#FBBC04"
      d="M17.5 14.5l-3.5-2.5-10.4 10.2c.4.4 1.1.5 1.8.1l12.1-7.8z"
    />
    <path
      fill="#EA4335"
      d="M17.5 9.5L5.4 1.7C4.7 1.3 4 1.4 3.6 1.8l10.4 10.2 3.5-2.5z"
    />
    <path
      fill="#34A853"
      d="M21.3 11.2l-3.8-2.4-3.5 3.2 3.5 3.2 3.8-2.4c.7-.4.7-1.2 0-1.6z"
    />
  </svg>
);

export const HomeDownloadSection = () => {
  return (
    <section id="download-app" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-[#1d1d1f] rounded-3xl p-8 sm:p-12 lg:p-14 text-white shadow-lg relative overflow-hidden border border-[#333333]">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-bl from-blue-500/20 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left Content */}
          <div className="space-y-4 text-center lg:text-left max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-[#2997ff] text-xs font-semibold border border-white/15">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bắt đầu quản lý ca làm thông minh</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
              Sẵn sàng nâng tầm quản lý ca làm cho cửa hàng?
            </h2>
            <p className="text-xs sm:text-sm text-[#86868b] leading-relaxed max-w-xl">
              Tiết kiệm hàng giờ xếp ca mỗi tuần, tính lương chuẩn xác và gửi thông báo lịch làm tự động. Đăng nhập ngay trên máy tính hoặc tải ứng dụng cho điện thoại di động.
            </p>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full lg:w-auto justify-center">
            <Link
              to="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs active:scale-[0.98] transition-all"
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Nút 1: App Store (iOS) */}
            <a
              id="btn-download-appstore"
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-full active:scale-[0.98] transition-all text-left group"
            >
              <AppleLogo className="w-5 h-5 fill-current text-white shrink-0 group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-[#86868b] font-medium leading-none">
                  Tải về trên
                </span>
                <span className="text-xs font-semibold text-white leading-tight mt-0.5">
                  App Store (iOS)
                </span>
              </div>
            </a>

            {/* Nút 2: Google Play (CH Play) */}
            <a
              id="btn-download-chplay"
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-full active:scale-[0.98] transition-all text-left group"
            >
              <GooglePlayLogo className="w-4 h-4 shrink-0 group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-wider text-[#86868b] font-medium leading-none">
                  Tải về trên
                </span>
                <span className="text-xs font-semibold text-white leading-tight mt-0.5">
                  Google Play (CH Play)
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeDownloadSection;
