import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendPasswordResetOtpEmail } from '../services/emailService.js';

/**
 * Thời hạn và cấu hình Cookies bảo mật tối đa (HttpOnly + SameSite)
 */
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 phút
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 ngày
const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000; // 15 phút tính theo ms
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 ngày tính theo ms

/**
 * Tạo Access Token (AT) - Thời gian sống ngắn (15 phút)
 */
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      systemRole: user.systemRole,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || ACCESS_TOKEN_EXPIRY,
    }
  );
};

/**
 * Tạo Refresh Token (RT) - Thời gian sống dài (30 ngày)
 * Kèm định danh jti (JWT ID duy nhất) để thực hiện Refresh Token Rotation & Reuse Detection
 */
export const generateRefreshToken = (user, jti = crypto.randomUUID()) => {
  const token = jwt.sign(
    {
      id: user._id,
      jti,
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || REFRESH_TOKEN_EXPIRY,
    }
  );
  return { token, jti };
};

/**
 * Cấu hình tùy chọn Cookie an toàn (HttpOnly chống tấn công XSS)
 */
const getCookieOptions = (maxAge) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true, // Trình duyệt không cho phép JS (document.cookie) truy cập -> Chống XSS 100%
    secure: isProduction, // Chỉ truyền qua HTTPS khi chạy production
    sameSite: isProduction ? 'none' : 'lax', // Hỗ trợ cross-origin an toàn khi production
    path: '/',
    maxAge,
  };
};

/**
 * Đưa CẢ HAI (AT và RT) vào 2 Cookie HttpOnly riêng biệt
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  // Cookie 1: Access Token (15 phút, HttpOnly)
  res.cookie('accessToken', accessToken, getCookieOptions(ACCESS_COOKIE_MAX_AGE));

  // Cookie 2: Refresh Token (30 ngày, HttpOnly)
  res.cookie('refreshToken', refreshToken, getCookieOptions(REFRESH_COOKIE_MAX_AGE));
};

/**
 * Xóa sạch cả 2 Cookie khi đăng xuất
 */
export const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  };
  res.clearCookie('accessToken', clearOptions);
  res.clearCookie('refreshToken', clearOptions);
};

/**
 * @desc    Đăng ký tài khoản mới (Chủ hoặc Người đi làm)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  try {
    const { email, password, fullName, gender, age, systemRole } = req.body;

    // 1. Kiểm tra email đã tồn tại hay chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.',
      });
    }

    // 2. Băm mật khẩu an toàn với bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Tạo user mới
    const newUser = await User.create({
      email,
      password: hashedPassword,
      fullName,
      gender,
      age,
      systemRole,
    });

    // 4. Tạo cặp token AT (15m) & RT (30d kèm jti) và đưa vào 2 Cookie HttpOnly riêng biệt
    const accessToken = generateAccessToken(newUser);
    const { token: refreshToken, jti } = generateRefreshToken(newUser);
    newUser.refreshTokens = [jti];
    await newUser.save();

    setAuthCookies(res, accessToken, refreshToken);

    // 5. Trả về kết quả (loại bỏ mật khẩu)
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      token: accessToken,
      refreshToken,
      user: {
        _id: newUser._id,
        email: newUser.email,
        fullName: newUser.fullName,
        gender: newUser.gender,
        age: newUser.age,
        systemRole: newUser.systemRole,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi đăng ký: ${error.message}`,
    });
  }
};

/**
 * @desc    Đăng nhập hệ thống
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm người dùng theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    // 2. So khớp mật khẩu đã băm
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email hoặc mật khẩu không chính xác.',
      });
    }

    // 3. Tạo cặp token AT (15m) & RT (30d kèm jti) và đưa vào 2 Cookie HttpOnly riêng biệt
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, jti } = generateRefreshToken(user);

    // Lưu jti phiên đăng nhập (giữ tối đa 10 phiên đồng thời gần nhất)
    user.refreshTokens = [...(user.refreshTokens || []).slice(-9), jti];
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      token: accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        gender: user.gender,
        age: user.age,
        systemRole: user.systemRole,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi đăng nhập: ${error.message}`,
    });
  }
};

/**
 * @desc    Lấy thông tin tài khoản đang đăng nhập
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng.',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin me:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ: ${error.message}`,
    });
  }
};

/**
 * @desc    Làm mới Access Token khi hết hạn 15 phút bằng Cookie Refresh Token (30 ngày)
 *          Tích hợp cơ chế Xoay vòng Token (RTR) & Tự động phát hiện gian lận (Reuse Detection)
 * @route   POST /api/auth/refresh
 * @access  Public (Xác thực qua Cookie refreshToken hoặc body)
 */
export const refreshTokens = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_MISSING',
        message: 'Không tìm thấy Refresh Token trong Cookie. Vui lòng đăng nhập lại.',
      });
    }

    // 1. Xác thực chữ ký số của Refresh Token
    let decoded;
    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );
    } catch (err) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Phiên Refresh Token đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
      });
    }

    // 2. Tìm người dùng
    const user = await User.findById(decoded.id);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'Người dùng không còn tồn tại trên hệ thống.',
      });
    }

    // 3. --- CƠ CHẾ PHÁT HIỆN TÁI SỬ DỤNG GIAN LẬN (AUTOMATIC REUSE DETECTION) ---
    const presentedJti = decoded.jti;
    const isTokenValid = presentedJti && Array.isArray(user.refreshTokens) && user.refreshTokens.includes(presentedJti);

    if (!isTokenValid) {
      // CẢNH BÁO BẢO MẬT ĐỎ: Mã token này đã từng bị sử dụng hoặc đã bị thu hồi!
      // Khả năng token đã bị kẻ gian đánh cắp và đang cố sử dụng lại.
      // HÀNH ĐỘNG KHẨN CẤP: Hủy sạch toàn bộ mọi phiên đăng nhập của tài khoản này!
      console.warn(
        `[CẢNH BÁO BẢO MẬT] Phát hiện tái sử dụng Refresh Token của user ${user.email} (jti: ${presentedJti}). Đang thu hồi toàn bộ các phiên hoạt động!`
      );
      user.refreshTokens = [];
      await user.save();
      clearAuthCookies(res);

      return res.status(403).json({
        success: false,
        code: 'REFRESH_TOKEN_REUSE_DETECTED',
        message:
          'Cảnh báo bảo mật: Phát hiện mã Refresh Token đã từng được sử dụng. Để bảo vệ tài khoản, toàn bộ phiên đăng nhập đã bị hủy. Vui lòng đăng nhập lại.',
      });
    }

    // 4. --- XOAY VÒNG TOKEN HỢP LỆ (REFRESH TOKEN ROTATION - RTR) ---
    // Hủy ngay jti vừa dùng khỏi danh sách
    const remainingTokens = user.refreshTokens.filter((tokenJti) => tokenJti !== presentedJti);

    // Cấp mới cặp token (AT 15m và RT 30d với jti hoàn toàn mới)
    const newAccessToken = generateAccessToken(user);
    const { token: newRefreshToken, jti: newJti } = generateRefreshToken(user);

    // Cập nhật jti mới vào danh sách phiên hợp lệ
    user.refreshTokens = [...remainingTokens.slice(-9), newJti];
    await user.save();

    // Cập nhật lại cả 2 Cookie HttpOnly cho trình duyệt
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: 'Xoay vòng phiên đăng nhập thành công!',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        gender: user.gender,
        age: user.age,
        systemRole: user.systemRole,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Lỗi làm mới token:', error.message);
    clearAuthCookies(res);
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: `Lỗi máy chủ khi làm mới token: ${error.message}`,
    });
  }
};

/**
 * @desc    Đăng xuất: Xóa jti khỏi cơ sở dữ liệu và dọn sạch cả 2 Cookie HttpOnly (AT & RT)
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = jwt.decode(refreshToken);
        if (decoded?.id && decoded?.jti) {
          await User.findByIdAndUpdate(decoded.id, {
            $pull: { refreshTokens: decoded.jti },
          });
        }
      } catch (e) {
        // Bỏ qua lỗi giải mã khi đăng xuất
      }
    }

    clearAuthCookies(res);
    return res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công. Đã dọn sạch Cookies an toàn!',
    });
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi đăng xuất: ${error.message}`,
    });
  }
};

/**
 * @desc    Yêu cầu mã xác thực OTP 6 số để đặt lại mật khẩu qua Email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản nào gắn với địa chỉ email này.',
      });
    }

    // Sinh mã OTP 6 số ngẫu nhiên (từ 100000 đến 999999)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Có hiệu lực 10 phút

    user.resetPasswordOtp = {
      code: otp,
      expiresAt,
    };
    await user.save();

    // Gửi email chứa OTP
    const emailResult = await sendPasswordResetOtpEmail({
      toEmail: user.email,
      userName: user.fullName,
      otp,
    });

    return res.status(200).json({
      success: true,
      message: 'Mã xác thực OTP 6 số đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư!',
      simulated: emailResult.simulated || false,
      devOtp: emailResult.simulated ? otp : undefined,
    });
  } catch (error) {
    console.error('Lỗi yêu cầu quên mật khẩu:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi xử lý yêu cầu quên mật khẩu: ${error.message}`,
    });
  }
};

/**
 * @desc    Kiểm tra / Xác nhận mã OTP 6 số hợp lệ
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản tương ứng với email này.',
      });
    }

    if (
      !user.resetPasswordOtp ||
      !user.resetPasswordOtp.code ||
      !user.resetPasswordOtp.expiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: 'Chưa có yêu cầu đặt lại mật khẩu nào cho email này hoặc mã đã bị hủy.',
      });
    }

    if (new Date() > new Date(user.resetPasswordOtp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết thời hạn hiệu lực (chỉ có giá trị trong 10 phút). Vui lòng yêu cầu mã mới.',
      });
    }

    if (user.resetPasswordOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực OTP không chính xác. Vui lòng kiểm tra kỹ hộp thư email!',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xác thực mã OTP thành công! Bạn có thể đặt mật khẩu mới ngay.',
    });
  } catch (error) {
    console.error('Lỗi xác thực mã OTP:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi xác thực OTP: ${error.message}`,
    });
  }
};

/**
 * @desc    Xác nhận OTP và đổi mật khẩu mới cho tài khoản
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản người dùng.',
      });
    }

    if (
      !user.resetPasswordOtp ||
      !user.resetPasswordOtp.code ||
      !user.resetPasswordOtp.expiresAt
    ) {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu đặt lại mật khẩu không hợp lệ hoặc đã hoàn tất trước đó.',
      });
    }

    if (new Date() > new Date(user.resetPasswordOtp.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: 'Mã OTP đã hết hạn hiệu lực. Vui lòng gửi yêu cầu mã mới.',
      });
    }

    if (user.resetPasswordOtp.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Mã xác thực OTP không chính xác. Không thể đổi mật khẩu.',
      });
    }

    // Băm mật khẩu mới an toàn
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Hủy mã OTP sau khi đổi mật khẩu thành công và thu hồi toàn bộ phiên đăng nhập cũ
    user.resetPasswordOtp = {
      code: null,
      expiresAt: null,
    };
    user.refreshTokens = []; // Buộc tất cả các thiết bị phải đăng nhập lại với mật khẩu mới

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể sử dụng mật khẩu mới để đăng nhập ngay bây giờ.',
    });
  } catch (error) {
    console.error('Lỗi đặt lại mật khẩu:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ khi đặt lại mật khẩu: ${error.message}`,
    });
  }
};
