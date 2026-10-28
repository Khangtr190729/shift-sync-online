import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomeNavbar } from '../components/home/HomeNavbar';
import { HomeHeroSection } from '../components/home/HomeHeroSection';
import { HomeMetricsSection } from '../components/home/HomeMetricsSection';
import { HomeSolutionsSection } from '../components/home/HomeSolutionsSection';
import { HomeFeaturesSection } from '../components/home/HomeFeaturesSection';
import { HomeStepsSection } from '../components/home/HomeStepsSection';
import { HomeTestimonialsSection } from '../components/home/HomeTestimonialsSection';
import { HomeFaqSection } from '../components/home/HomeFaqSection';
import { HomeDownloadSection } from '../components/home/HomeDownloadSection';
import { HomeFooter } from '../components/home/HomeFooter';

/**
 * HomePage: Trang chủ / Landing page của Ca Làm Online
 * - Thiết kế theo kiến trúc Modular: mỗi section là một component độc lập
 * - Tự động điều hướng vào Dashboard/MySchedule nếu người dùng đã có token hợp lệ
 */
export const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Máy nào còn thời hạn token thì chuyển thẳng vào trong ứng dụng
  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'EMPLOYEE') {
        navigate('/my-schedule', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Cuộn mượt đến section tương ứng
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Màn hình chờ nếu thiết bị đang có sẵn token và đang xác thực
  if (loading && localStorage.getItem('ca_lam_token')) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center font-sans">
        <div className="w-8 h-8 border-2 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1d1d1f] font-sans selection:bg-[#0066cc] selection:text-white">
      <HomeNavbar scrollToSection={scrollToSection} />
      <HomeHeroSection scrollToSection={scrollToSection} />
      <HomeMetricsSection />
      <HomeSolutionsSection />
      <HomeFeaturesSection />
      <HomeStepsSection />
      <HomeTestimonialsSection />
      <HomeFaqSection />
      <HomeDownloadSection />
      <HomeFooter scrollToSection={scrollToSection} />
    </div>
  );
};

export default HomePage;
