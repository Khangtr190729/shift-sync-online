import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ Email và Mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const data = await login(email, password);
      // If user is employee and hasn't joined store, navigate to mobile-preview or app
      if (data?.user?.role === 'EMPLOYEE') {
        navigate('/mobile-preview');
      } else {
        navigate('/schedules');
      }
    } catch (err) {
      setError(err.message || 'Email hoặc mật khẩu không chính xác.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-3 hover:opacity-90 transition">
          <Logo size="lg" />
        </Link>
        <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
          Đăng nhập vào hệ thống
        </h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Xếp ca nhanh chóng — Bảng lương chuẩn xác cho cửa hàng
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-[#e5e5e7] sm:px-10 animate-modal-pop">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Địa chỉ Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@quan.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-normal focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-normal focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end -mt-1">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-medium text-[#0066cc] hover:underline transition cursor-pointer"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Helper Hint */}
          <div className="mt-6 pt-4 border-t border-[#e5e5e7] text-center">
            <p className="text-xs text-[#6e6e73]">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-medium text-[#0066cc] hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modal Quên mật khẩu qua OTP 6 số */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        initialEmail={email}
        onSuccess={(resetEmail) => {
          setEmail(resetEmail);
          setPassword('');
          setError('');
        }}
      />
    </div>
  );
};

export default LoginPage;
