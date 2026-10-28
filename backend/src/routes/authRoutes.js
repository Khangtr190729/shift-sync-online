import express from 'express';
import {
  register,
  login,
  getMe,
  refreshTokens,
  logout,
  forgotPassword,
  verifyResetOtp,
  resetPasswordWithOtp,
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validateBody } from '../middlewares/validateMiddleware.js';
import {
  authLimiter,
  forgotPasswordLimiter,
  otpVerifyLimiter,
} from '../middlewares/rateLimiter/index.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';

const router = express.Router();

// Route đăng ký tài khoản (Public - Giới hạn 10 lần/15p chống spam tài khoản)
router.post('/register', authLimiter, validateBody(registerSchema), register);

// Route đăng nhập tài khoản (Public - Giới hạn 10 lần/15p chống brute-force)
router.post('/login', authLimiter, validateBody(loginSchema), login);

// Route lấy thông tin cá nhân hiện tại (Yêu cầu đăng nhập - Token qua Cookie hoặc Header)
router.get('/me', protect, getMe);

// Route làm mới Access Token bằng Refresh Token (Đọc từ Cookie HttpOnly hoặc body)
router.post('/refresh', refreshTokens);

// Route đăng xuất an toàn (Xóa sạch Cookie AT và RT)
router.post('/logout', logout);

// Route Quên mật khẩu: Yêu cầu gửi mã OTP 6 số qua Email (Public - Giới hạn 3 lần/15p bảo vệ Gmail/Nodemailer)
router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validateBody(forgotPasswordSchema),
  forgotPassword
);

// Route Xác thực mã OTP 6 số (Public - Giới hạn 5 lần/15p chống dò mã 6 số)
router.post(
  '/verify-reset-otp',
  otpVerifyLimiter,
  validateBody(verifyResetOtpSchema),
  verifyResetOtp
);

// Route Đổi mật khẩu mới bằng mã OTP (Public - Giới hạn 5 lần/15p)
router.post(
  '/reset-password',
  otpVerifyLimiter,
  validateBody(resetPasswordSchema),
  resetPasswordWithOtp
);

export default router;
