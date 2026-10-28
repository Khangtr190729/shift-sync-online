import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { authApi } from '../../services/api';

export const ForgotPasswordModal = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess,
}) => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password, 4: Success
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const otpInputsRef = useRef([]);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setEmail(initialEmail || '');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setInfoMsg('');
      setDevOtp('');
      setResendCountdown(0);
    }
  }, [isOpen, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  if (!isOpen) return null;

  // --- BƯỚC 1: GỬI YÊU CẦU OTP QUA EMAIL ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Vui lòng nhập địa chỉ email của bạn.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Định dạng email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setInfoMsg('');
      const res = await authApi.forgotPassword(cleanEmail);
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
      setInfoMsg(res.message || 'Mã xác thực OTP 6 số đã được gửi đến email của bạn.');
      setStep(2);
      setResendCountdown(60);
      // Auto-focus first OTP input after render
      setTimeout(() => {
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
      }, 150);
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || loading) return;
    try {
      setLoading(true);
      setError('');
      const res = await authApi.forgotPassword(email.trim());
      if (res.devOtp) {
        setDevOtp(res.devOtp);
      }
      setInfoMsg('Đã gửi lại mã OTP mới vào email của bạn!');
      setResendCountdown(60);
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ NHẬP 6 Ô OTP ---
  const handleOtpChange = (index, value) => {
    // Only accept numeric characters
    const val = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (!val) {
      newDigits[index] = '';
      setOtpDigits(newDigits);
      return;
    }

    // If user typed or pasted multiple digits
    if (val.length > 1) {
      const chars = val.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || '';
      }
      setOtpDigits(newDigits);
      const nextFocus = Math.min(chars.length, 5);
      if (otpInputsRef.current[nextFocus]) {
        otpInputsRef.current[nextFocus].focus();
      }
      return;
    }

    // Single digit input
    newDigits[index] = val;
    setOtpDigits(newDigits);
    setError('');

    // Auto advance to next box
    if (index < 5 && val) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < pasteData.length; i++) {
      newDigits[i] = pasteData[i];
    }
    setOtpDigits(newDigits);
    const focusIndex = Math.min(pasteData.length, 5);
    otpInputsRef.current[focusIndex]?.focus();
  };

  // --- BƯỚC 2: XÁC THỰC MÃ OTP ---
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await authApi.verifyResetOtp(email.trim(), otpCode);
      setInfoMsg('Mã OTP chính xác. Mời bạn đặt mật khẩu mới.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  // --- BƯỚC 3: ĐẶT MẬT KHẨU MỚI ---
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp với mật khẩu mới.');
      return;
    }

    const otpCode = otpDigits.join('');
    try {
      setLoading(true);
      setError('');
      await authApi.resetPassword(email.trim(), otpCode, newPassword);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  // --- BƯỚC 4: HOÀN TẤT & ĐĂNG NHẬP ---
  const handleFinish = () => {
    if (onSuccess) {
      onSuccess(email.trim());
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in font-['Be_Vietnam_Pro',sans-serif]">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative animate-modal-pop my-8">
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0066cc] flex items-center justify-center mx-auto mb-3">
            {step === 4 ? (
              <CheckCircle2 className="w-6 h-6 text-[#0066cc]" />
            ) : step === 3 ? (
              <ShieldCheck className="w-6 h-6 text-[#0066cc]" />
            ) : step === 2 ? (
              <KeyRound className="w-6 h-6 text-[#0066cc]" />
            ) : (
              <Mail className="w-6 h-6 text-[#0066cc]" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
            {step === 1 && 'Quên mật khẩu?'}
            {step === 2 && 'Xác thực mã OTP'}
            {step === 3 && 'Tạo mật khẩu mới'}
            {step === 4 && 'Đổi mật khẩu thành công!'}
          </h3>
          <p className="text-xs text-[#6e6e73] mt-1 max-w-xs mx-auto">
            {step === 1 && 'Nhập email đã đăng ký tài khoản của bạn để nhận mã OTP 6 số xác thực.'}
            {step === 2 && `Mã xác thực gồm 6 chữ số đã được gửi đến hộp thư ${email}.`}
            {step === 3 && 'Nhập mật khẩu mới an toàn có độ dài tối thiểu từ 6 ký tự.'}
            {step === 4 && 'Tài khoản của bạn đã được cập nhật mật khẩu mới an toàn.'}
          </p>
        </div>

        {/* Thanh tiến trình 3 bước (Pill Stepper) */}
        {step < 4 && (
          <div className="flex items-center justify-between mb-6 px-4">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${step >= 1
                    ? 'bg-[#0066cc] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#86868b]'
                  }`}
              >
                1
              </span>
              <span className={`text-[11px] font-medium ${step >= 1 ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
                Email
              </span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 rounded-full ${step >= 2 ? 'bg-[#0066cc]' : 'bg-[#e5e5e7]'}`} />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${step >= 2
                    ? 'bg-[#0066cc] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#86868b]'
                  }`}
              >
                2
              </span>
              <span className={`text-[11px] font-medium ${step >= 2 ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
                Mã OTP
              </span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 rounded-full ${step >= 3 ? 'bg-[#0066cc]' : 'bg-[#e5e5e7]'}`} />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-6 h-6 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${step >= 3
                    ? 'bg-[#0066cc] text-white shadow-xs'
                    : 'bg-[#f5f5f7] text-[#86868b]'
                  }`}
              >
                3
              </span>
              <span className={`text-[11px] font-medium ${step >= 3 ? 'text-[#1d1d1f]' : 'text-[#86868b]'}`}>
                Đổi MK
              </span>
            </div>
          </div>
        )}

        {/* Thông báo lỗi */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Thông báo thành công / gợi ý */}
        {infoMsg && step !== 4 && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">{infoMsg}</div>
          </div>
        )}

        {/* DEV HINT / QUICK TEST BADGE NẾU GỬI MÔ PHỎNG */}
        {devOtp && step === 2 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div>
              <span className="font-semibold">⚡ Mã OTP thử nghiệm:</span>{' '}
              <span className="font-mono font-bold tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg ml-1">
                {devOtp}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const chars = devOtp.split('');
                setOtpDigits(chars);
                otpInputsRef.current[5]?.focus();
              }}
              className="text-[11px] font-semibold text-[#0066cc] hover:underline"
            >
              Điền nhanh
            </button>
          </div>
        )}

        {/* ===================== STEP 1: NHẬP EMAIL ===================== */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Địa chỉ Email đã đăng ký <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Đang gửi mã OTP...' : 'Gửi mã OTP qua Email'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ===================== STEP 2: NHẬP MÃ OTP 6 SỐ ===================== */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-2 text-center">
                Nhập mã xác thực 6 số (OTP)
              </label>
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono bg-white border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 text-[#1d1d1f] transition shadow-xs"
                  />
                ))}
              </div>
              <p className="text-[11px] text-[#86868b] text-center mt-2">
                Mã xác thực có hiệu lực trong vòng <strong>10 phút</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[#6e6e73] hover:text-[#1d1d1f] font-medium flex items-center gap-1 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Đổi email khác</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCountdown > 0 || loading}
                className={`font-medium flex items-center gap-1 transition ${resendCountdown > 0
                    ? 'text-[#86868b] cursor-not-allowed'
                    : 'text-[#0066cc] hover:text-[#0071e3] hover:underline'
                  }`}
              >
                <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>
                  {resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại mã OTP'}
                </span>
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="w-full py-3 px-4 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Đang xác thực...' : 'Xác thực mã OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ===================== STEP 3: MẬT KHẨU MỚI ===================== */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Xác nhận lại mật khẩu mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-[#d2d2d7] rounded-xl text-xs text-[#1d1d1f] font-medium focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f]"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Đang lưu mật khẩu...' : 'Lưu mật khẩu mới'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ===================== STEP 4: THÀNH CÔNG ===================== */}
        {step === 4 && (
          <div className="text-center space-y-4 py-2">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/60 text-emerald-800 text-xs">
              <p className="font-semibold mb-1">Mật khẩu đã được đặt lại thành công!</p>
              <p className="text-emerald-700">
                Bạn có thể sử dụng mật khẩu mới vừa thiết lập để đăng nhập ngay vào hệ thống Ca Làm Online.
              </p>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3 px-4 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-semibold rounded-full shadow-xs active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <span>Đăng nhập ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
