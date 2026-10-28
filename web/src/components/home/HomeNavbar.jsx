import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, Download, Menu, X } from 'lucide-react';
import Logo from '../Logo';

export const HomeNavbar = ({ scrollToSection }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (sectionId) => {
    setMobileMenuOpen(false);
    scrollToSection(sectionId);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#e5e5e7]/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <Logo size="md" />
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-medium text-[#6e6e73]">
          <button
            type="button"
            onClick={() => handleNavClick('features')}
            className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            Tính năng
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('how-it-works')}
            className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            Quy trình
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('download-app')}
            className="hover:text-[#0066cc] transition-colors cursor-pointer flex items-center gap-1.5 text-[#0066cc] font-medium"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Tải App</span>
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('solutions')}
            className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            Giải pháp
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('testimonials')}
            className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            Đánh giá
          </button>
          <button
            type="button"
            onClick={() => handleNavClick('faq')}
            className="hover:text-[#1d1d1f] transition-colors cursor-pointer"
          >
            Hỏi đáp
          </button>
        </nav>

        {/* Desktop Auth CTAs */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            id="btn-nav-download"
            type="button"
            onClick={() => handleNavClick('download-app')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#d2d2d7] hover:border-[#86868b] text-xs font-medium text-[#1d1d1f] bg-white active:scale-[0.98] transition cursor-pointer"
            title="Cuộn xuống để tải ứng dụng cho điện thoại"
          >
            <Download className="w-3.5 h-3.5 text-[#0066cc]" />
            <span>Tải App</span>
          </button>

          <Link
            to="/login"
            className="flex items-center gap-2 px-4 py-1.5 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs active:scale-[0.98] transition-all"
          >
            <span>Đăng nhập</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#6e6e73] hover:bg-[#f5f5f7] rounded-xl transition cursor-pointer"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-[#e5e5e7] px-6 py-5 space-y-4 animate-dropdown-enter">
          <nav className="flex flex-col space-y-3 text-xs font-medium text-[#1d1d1f]">
            <button
              type="button"
              onClick={() => handleNavClick('features')}
              className="text-left py-2 hover:text-[#0066cc] cursor-pointer"
            >
              Tính năng nổi bật
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('download-app')}
              className="text-left py-2 text-[#0066cc] font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải ứng dụng di động (iOS & Android)</span>
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('how-it-works')}
              className="text-left py-2 hover:text-[#0066cc] cursor-pointer"
            >
              Cách thức hoạt động
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('solutions')}
              className="text-left py-2 hover:text-[#0066cc] cursor-pointer"
            >
              Giải pháp cho cửa hàng
            </button>
            <button
              type="button"
              onClick={() => handleNavClick('faq')}
              className="text-left py-2 hover:text-[#0066cc] cursor-pointer"
            >
              Câu hỏi thường gặp
            </button>
          </nav>
          <div className="pt-4 border-t border-[#e5e5e7] flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 bg-[#0066cc] text-white text-center text-xs font-semibold rounded-full shadow-xs active:scale-[0.98]"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default HomeNavbar;
