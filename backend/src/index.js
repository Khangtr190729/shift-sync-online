import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import { personalScheduleRouter } from './routes/scheduleRoutes.js';
import { globalLimiter } from './middlewares/rateLimiter/globalLimiter.js';

// Nạp cấu hình từ file .env
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Tin tưởng reverse proxy khi deploy lên Render/Railway/Heroku/Vercel
app.set('trust proxy', 1);

// Kết nối cơ sở dữ liệu MongoDB
connectDB();

// Cấu hình danh sách origin được phép gửi Cookie (Web client)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

// Middlewares toàn cục
app.use(
  cors({
    origin: (origin, callback) => {
      // Cho phép requests không có origin (mobile apps, Postman, server-to-server) hoặc origin hợp lệ
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Chặn bởi chính sách CORS'));
    },
    credentials: true, // BẮT BUỘC để trình duyệt chấp nhận và gửi HttpOnly Cookies
  })
);
app.use(cookieParser());
app.use(express.json());

// Giới hạn tần suất toàn cục cho tất cả API /api/*
app.use('/api', globalLimiter);

// Routes chính
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/schedules', personalScheduleRouter);

// Route kiểm tra trạng thái server
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Ca Làm Online Backend API đang hoạt động!',
    time: new Date(),
  });
});

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server đang chạy trên cổng ${PORT} (http://localhost:${PORT})`);
});
