# Ca Làm Online — Tech Stack & Hướng Dẫn Cài Đặt

Tài liệu chi tiết về danh mục công nghệ lựa chọn, mục đích sử dụng và các lệnh cài đặt cụ thể cho từng ứng dụng trong hệ thống **Ca Làm Online**.

---

## 1. Frontend Web — `web/` (Admin & Manager)

Môi trường ứng dụng web quản trị chạy trên máy tính, được quản lý độc lập tại thư mục `web/`.

### 1.1. Bảng Công Nghệ & Lệnh Cài Đặt

| Công nghệ | Mục đích sử dụng | Lệnh cài đặt (Chạy tại `web/`) |
|---|---|---|
| **Vite** | Build tool và dev server siêu tốc | `npm install -D vite @vitejs/plugin-react` |
| **React.js & React DOM** | Xây dựng giao diện người dùng SPA | `npm install react react-dom` |
| **React Router** | Quản lý định tuyến và route guard theo role | `npm install react-router-dom` |
| **Tailwind CSS** | Tiện ích tạo kiểu giao diện, responsive | `npm install -D tailwindcss @tailwindcss/vite` |
| **Lucide React** | Thư viện icons hiện đại, trực quan | `npm install lucide-react` |
| **FullCalendar** | Hiển thị và quản lý lịch phân ca làm việc | `npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction` |
| **Axios** | Gửi HTTP request đến Backend REST API | `npm install axios` |

### 1.2. Lệnh Cài Đặt Tổng Hợp Cho Web
```bash
cd web

# 1. Cài đặt các thư viện ứng dụng (dependencies)
npm install react react-dom react-router-dom lucide-react axios @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# 2. Cài đặt các công cụ phát triển (devDependencies)
npm install -D vite @vitejs/plugin-react tailwindcss @tailwindcss/vite
```

### 1.3. Lệnh Khởi Chạy Web
```bash
npm run dev      # Khởi động máy chủ phát triển Vite
npm run build    # Đóng gói sản phẩm production
npm run preview  # Xem trước bản đóng gói
```

---

## 2. Mobile App — `mobile/` (Employee)

Ứng dụng di động dành cho nhân viên tra cứu lịch làm việc, được quản lý tại thư mục `mobile/`.

### 2.1. Bảng Công Nghệ & Lệnh Cài Đặt

| Công nghệ | Mục đích sử dụng | Lệnh cài đặt (Chạy tại `mobile/`) |
|---|---|---|
| **Expo** | Nền tảng và bộ công cụ chạy ứng dụng React Native | `npm install expo` |
| **React & React Native** | Core framework phát triển ứng dụng di động đa nền tảng | `npm install react react-native` |
| **React Navigation** | Điều hướng màn hình (Stack, Bottom Tab) | `npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context` |
| **Expo SecureStore** | Lưu trữ mã token JWT bảo mật trên phần cứng thiết bị | `npm install expo-secure-store` |
| **Expo Notifications** | Hỗ trợ tính năng thông báo đẩy (push notification) | `npm install expo-notifications` |
| **Axios** | Gọi REST API từ thiết bị di động | `npm install axios` |

### 2.2. Lệnh Cài Đặt Tổng Hợp Cho Mobile
```bash
cd mobile

# Cài đặt toàn bộ dependencies cho Mobile
npm install expo react react-native @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context axios expo-secure-store expo-notifications
```

### 2.3. Lệnh Khởi Chạy Mobile
```bash
npm start            # Mở Expo CLI / Metro bundler (quét mã QR qua app Expo Go)
npm run android      # Chạy trên máy ảo/thiết bị Android
npm run ios          # Chạy trên máy ảo iOS (yêu cầu macOS)
```

---

## 3. Backend REST API — `backend/`

Máy chủ REST API xử lý nghiệp vụ, xác thực và lưu trữ dữ liệu, được quản lý tại thư mục `backend/`.

### 3.1. Bảng Công Nghệ & Lệnh Cài Đặt

| Công nghệ | Mục đích sử dụng | Lệnh cài đặt (Chạy tại `backend/`) |
|---|---|---|
| **Node.js** | Môi trường runtime JavaScript phía server | *(Đã có sẵn trên máy, yêu cầu v18+)* |
| **Express.js** | Framework máy chủ định tuyến REST API | `npm install express` |
| **Mongoose** | ODM mô hình hóa dữ liệu MongoDB | `npm install mongoose` |
| **JSON Web Token (JWT)** | Tạo và xác thực access token không trạng thái | `npm install jsonwebtoken` |
| **bcryptjs / bcrypt** | Băm mật khẩu một chiều an toàn | `npm install bcryptjs` |
| **Zod** | Schema kiểm tra tính hợp lệ của dữ liệu đầu vào | `npm install zod` |
| **express-rate-limit** | Giới hạn tần suất request nhiều tầng chống Brute-force & DoS | `npm install express-rate-limit` |
| **Nodemailer** | Gửi email tự động (lịch làm việc, mã mời vào quán) | `npm install nodemailer` |
| **Dotenv & Cors** | Đọc biến môi trường và cấu hình CORS Whitelist credentials | `npm install dotenv cors` |
| **cookie-parser** | Trích xuất và giải mã HttpOnly Cookies bảo mật (AT & RT) | `npm install cookie-parser` |
| **Nodemon** | Tự động tải lại máy chủ khi sửa code | `npm install -D nodemon` |

### 3.2. Lệnh Cài Đặt Tổng Hợp Cho Backend
```bash
cd backend

# 1. Cài đặt các thư viện ứng dụng (dependencies)
npm install express mongoose jsonwebtoken bcryptjs zod express-rate-limit nodemailer dotenv cors cookie-parser

# 2. Cài đặt công cụ phát triển (devDependencies)
npm install -D nodemon
```

### 3.3. Lệnh Khởi Chạy Backend
```bash
npm run dev    # Chạy server ở chế độ dev với nodemon tự reload
npm start      # Chạy server production thông thường với node
```

---

## 4. Dịch Vụ Đám Mây & Công Cụ (Yêu Cầu Tự Chuẩn Bị Trước)

Các dịch vụ và công cụ bên dưới **không cài đặt qua lệnh npm** mà lập trình viên cần chủ động tạo tài khoản hoặc cài đặt extension/phần mềm trước khi kết nối vào dự án:

| Công cụ / Dịch vụ | Loại hình | Hướng dẫn chuẩn bị trước |
|---|---|---|
| **MongoDB Atlas** | Database Cloud | **Phải tự đăng ký trước:**<br>1. Truy cập [mongodb.com/atlas](https://www.mongodb.com/atlas) tạo tài khoản miễn phí.<br>2. Tạo Cluster M0 (Free), tạo Database User & Password.<br>3. Cấu hình Network Access (Allow IP `0.0.0.0/0` hoặc IP hiện tại).<br>4. Lấy Connection String (dạng `mongodb+srv://...`) để sau này điền vào file `.env` của `backend/`. |
| **GitHub** | Quản lý mã nguồn | **Phải tự cài đặt trước:**<br>1. Cài Git trên máy tính.<br>2. Tạo repository trên [github.com](https://github.com) và push mã nguồn theo dõi lịch sử commit. |
| **Thunder Client / Postman** | Kiểm thử REST API | **Phải tự cài đặt trước:**<br>- **Thunder Client:** Cài trực tiếp từ Extensions tab của VS Code (gõ tìm "Thunder Client" và bấm Install). Tiện lợi để test nhanh ngay trong editor.<br>- **Postman:** Tải phần mềm độc lập từ [postman.com/downloads](https://www.postman.com/downloads) nếu cần chia sẻ collection API. |
| **Expo Go** | Ứng dụng test Mobile | **Phải tự cài đặt trước:**<br>Cài ứng dụng **Expo Go** từ Google Play Store (Android) hoặc Apple App Store (iOS) trên điện thoại cá nhân để quét mã QR chạy thử app mobile. |