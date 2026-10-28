import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, AlertCircle, Store, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'Nam',
    age: 22,
    role: 'ADMIN' // Only 'ADMIN' or 'EMPLOYEE'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const payload = {
        fullName: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        gender: formData.gender,
        age: Number(formData.age),
        systemRole: formData.role // 'ADMIN' or 'EMPLOYEE'
      };

      const data = await register(payload);
      if (formData.role === 'EMPLOYEE') {
        navigate('/mobile-preview');
      } else {
        navigate('/store-management');
      }
    } catch (err) {
      setError(err.message || 'Đăng ký không thành công. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-3 hover:opacity-90 transition">
          <Logo size="lg" />
        </Link>
        <h2 className="text-2xl font-semibold text-[#1d1d1f] tracking-tight">
          Tạo tài khoản mới
        </h2>
        <p className="mt-1 text-xs text-[#6e6e73]">
          Chọn vai trò của bạn để bắt đầu trải nghiệm Ca Làm Online
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-[#e5e5e7] sm:px-10 animate-modal-pop">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200/60 text-rose-700 text-xs font-medium rounded-xl flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* ROLE SELECTION CARDS (CHỦ CỬA HÀNG VS NGƯỜI ĐI LÀM) */}
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-2">
                Bạn đăng ký với vai trò gì? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: Chủ cửa hàng (ADMIN) */}
                <div
                  onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 active:scale-[0.99] flex flex-col justify-between ${
                    formData.role === 'ADMIN'
                      ? 'border-[#0066cc] bg-blue-50/40 ring-1 ring-[#0066cc]/30 shadow-xs'
                      : 'border-[#e5e5e7] bg-white hover:border-[#d2d2d7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                      formData.role === 'ADMIN' ? 'bg-[#0066cc] text-white shadow-xs' : 'bg-[#f5f5f7] text-[#6e6e73]'
                    }`}>
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1d1d1f]">Chủ cửa hàng</h4>
                      <span className="text-[10px] text-[#86868b]">Quản trị & Xếp lịch</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6e6e73] leading-tight">
                    Tạo cửa hàng, tạo mã mời nhân viên, xếp ca làm việc và tính dự toán lương.
                  </p>
                </div>

                {/* Option 2: Người đi làm (EMPLOYEE) */}
                <div
                  onClick={() => setFormData({ ...formData, role: 'EMPLOYEE' })}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 active:scale-[0.99] flex flex-col justify-between ${
                    formData.role === 'EMPLOYEE'
                      ? 'border-[#0066cc] bg-blue-50/40 ring-1 ring-[#0066cc]/30 shadow-xs'
                      : 'border-[#e5e5e7] bg-white hover:border-[#d2d2d7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
                      formData.role === 'EMPLOYEE' ? 'bg-[#0066cc] text-white shadow-xs' : 'bg-[#f5f5f7] text-[#6e6e73]'
                    }`}>
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#1d1d1f]">Người đi làm</h4>
                      <span className="text-[10px] text-[#86868b]">Nhân viên cửa hàng</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6e6e73] leading-tight">
                    Nhập mã mời 6 chữ số để tham gia quán, xem lịch làm và tiền lương cá nhân.
                  </p>
                </div>
              </div>
            </div>

            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                  Địa chỉ Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Gender & Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Giới tính</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                >
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Tuổi</label>
                <input
                  type="number"
                  min="16"
                  max="80"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full p-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs font-mono font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                  required
                />
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                  Mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Ít nhất 6 ký tự"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                  Xác nhận mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 px-4 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Đang tạo tài khoản...' : 'Hoàn tất đăng ký'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#e5e5e7] text-center">
            <p className="text-xs text-[#6e6e73]">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-[#0066cc] hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
