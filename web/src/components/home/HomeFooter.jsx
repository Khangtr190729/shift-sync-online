import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';
import { AppleLogo, GooglePlayLogo } from './HomeDownloadSection';

export const HomeFooter = ({ scrollToSection }) => {
  return (
    <footer className="bg-white border-t border-[#e5e5e7] py-12 text-xs text-[#86868b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
          </div>

          {/* App Store & CH Play Badges in Footer */}
          <div className="flex items-center gap-3">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full text-[11px] font-medium shadow-xs active:scale-[0.98] transition"
            >
              <AppleLogo className="w-4 h-4 fill-current" />
              <span>App Store</span>
            </a>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1d1d1f] hover:bg-black text-white rounded-full text-[11px] font-medium shadow-xs active:scale-[0.98] transition"
            >
              <GooglePlayLogo className="w-3.5 h-3.5" />
              <span>Google Play (CH Play)</span>
            </a>
          </div>
        </div>

        <div className="pt-6 border-t border-[#e5e5e7] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} Ca Làm Online. Nền tảng Xếp ca & Quản lý Lương cửa hàng.</p>
          <div className="flex items-center gap-6 font-medium">
            <button
              type="button"
              onClick={() => scrollToSection('features')}
              className="text-[#6e6e73] hover:text-[#0066cc] transition cursor-pointer"
            >
              Tính năng
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('download-app')}
              className="text-[#6e6e73] hover:text-[#0066cc] transition cursor-pointer"
            >
              Tải App
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('faq')}
              className="text-[#6e6e73] hover:text-[#0066cc] transition cursor-pointer"
            >
              Hỏi đáp
            </button>
            <Link to="/login" className="text-[#6e6e73] hover:text-[#0066cc] transition">
              Đăng nhập
            </Link>
            <Link to="/register" className="text-[#0066cc] font-semibold hover:underline transition">
              Đăng ký
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
