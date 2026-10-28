import jwt from 'jsonwebtoken';

/**
 * Middleware bảo vệ các route yêu cầu đăng nhập
 * Hỗ trợ lấy Access Token từ:
 * 1. HttpOnly Cookie: `req.cookies.accessToken` (Dành cho Web, bảo mật cao nhất, chống XSS)
 * 2. Header Authorization: `Bearer <token>` (Dành cho Mobile App Expo / API clients)
 */
export const protect = async (req, res, next) => {
  let token = req.cookies?.accessToken;

  // Nếu không có trong cookie (như mobile app), kiểm tra header Authorization
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_MISSING',
      message: 'Không tìm thấy Token xác thực. Vui lòng đăng nhập.',
    });
  }

  try {
    // Giải mã và xác thực token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Gán thông tin người dùng vào request để các controller tiếp theo sử dụng
    req.user = decoded;
    return next();
  } catch (error) {
    // Trả về mã lỗi TOKEN_EXPIRED để Frontend Axios interceptor tự động kích hoạt refresh token
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng làm mới token.',
    });
  }
};
