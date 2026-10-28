# Quyết Định Thiết Kế Kiến Trúc (DESIGN_DECISIONS)

Tài liệu này ghi nhận các quyết định kiến trúc cốt lõi ban đầu của dự án **Ca Làm Online**, giải thích lý do tổ chức cấu trúc thư mục và xác lập ranh giới trách nhiệm giữa các thành phần.

---

## 1. Tổ Chức Monorepo Độc Lập

### Quyết định
Dự án được cấu trúc dưới dạng **Monorepo đơn giản** chứa ba ứng dụng độc lập trong cùng một kho lưu trữ: `web/`, `mobile/`, và `backend/`.

### Lý do lựa chọn
- **Phù hợp với dự án cá nhân:** Tránh sự phức tạp không cần thiết của các công cụ quản lý monorepo nâng cao (như Turborepo, Nx, Lerna hay Yarn/npm workspaces phức tạp) trong giai đoạn khởi đầu.
- **Dễ dàng theo dõi phiên bản:** Toàn bộ vòng đời phát triển của Web, Mobile và API được đồng bộ trong một git repository, giúp đơn giản hóa việc đối chiếu thay đổi.
- **Độc lập về môi trường chạy:** Mỗi ứng dụng duy trì phạm vi thực thi riêng biệt, không tạo liên kết cứng (tight coupling) giữa frontend và backend.

---

## 2. Phân Tách Ranh Giới Ứng Dụng (Separation of Concerns)

Hệ thống tuân thủ nguyên tắc phân định trách nhiệm rõ ràng:

1. **Ứng dụng Web (`web/`):**
   - Đóng vai trò là client cho quản trị viên và người quản lý.
   - Tập trung vào trải nghiệm hiển thị dữ liệu lớn, bảng biểu và thao tác quản trị ca.
   - Hoàn toàn không chứa logic truy xuất cơ sở dữ liệu hay lưu trữ bí mật cấp hệ thống.

2. **Ứng dụng Mobile (`mobile/`):**
   - Đóng vai trò là client di động cho nhân viên.
   - Tập trung vào tính tiện lợi, khả năng phản hồi mượt mà trên màn hình nhỏ.
   - Lưu trữ token xác thực thông qua giải pháp mã hóa phần cứng (`Expo SecureStore`).

3. **Ứng dụng Backend REST API (`backend/`):**
   - Là nguồn chân lý duy nhất (Single Source of Truth) cho dữ liệu và quy tắc nghiệp vụ.
   - Bảo vệ toàn bộ dữ liệu phía sau các lớp middleware xác thực (JWT), phân quyền vai trò (Role Guards), và xác thực dữ liệu đầu vào (Zod).
   - Đảm bảo các client không phụ thuộc trực tiếp vào cơ chế lưu trữ nội bộ (MongoDB / Mongoose).

---

## 3. Vai Trò Của Từng Thư Mục Thành Phần

### 3.1. Ứng dụng Web — `web/src/`
- **`components/`:** Các UI components dùng chung (buttons, modals, input fields, tables, badges) có tính tái sử dụng cao.
- **`pages/`:** Các trang màn hình hoàn chỉnh dành cho vai trò ADMIN và MANAGER (ví dụ: Dashboard, ScheduleManagement, EmployeeList).
- **`layouts/`:** Bố cục tổng thể (AppShell, Sidebar, Header, AuthLayout) bao bọc các trang.
- **`routes/`:** Khai báo cấu trúc đường dẫn (React Router) và các cơ chế bảo vệ tuyến đường (Route Guards theo vai trò).
- **`services/`:** Đóng gói các hàm gọi API đến Backend thông qua Axios instance tập trung.
- **`contexts/`:** Quản lý state toàn cục (Global State) khi thật sự cần thiết (ví dụ: AuthContext, ThemeContext).

### 3.2. Ứng dụng Mobile — `mobile/src/`
- **`components/`:** Các UI components di động tái sử dụng (CustomButton, ShiftCard, StatusBadge).
- **`screens/`:** Các màn hình hiển thị dành cho EMPLOYEE (ví dụ: MyScheduleScreen, ShiftDetailScreen, ProfileScreen).
- **`navigation/`:** Cấu hình luồng điều hướng (React Navigation: Stack Navigator, Bottom Tab Navigator).
- **`services/`:** Đóng gói giao tiếp REST API qua Axios đến máy chủ.
- **`storage/`:** Nơi quản lý đọc/ghi an toàn vào thiết bị sử dụng `Expo SecureStore` (lưu token, thông tin phiên).

### 3.3. Ứng dụng Backend — `backend/src/`
- **`routes/`:** Chỉ định nghĩa URL endpoints và gắn các middleware/controller tương ứng. Tuyệt đối không chứa logic xử lý nghiệp vụ.
- **`controllers/`:** Tiếp nhận request từ client, trích xuất tham số, gọi services xử lý và trả về HTTP response chuẩn hóa.
- **`services/`:** Nơi thực thi logic nghiệp vụ cốt lõi (Business Logic), tính toán, và tương tác với models.
- **`models/`:** Định nghĩa schema và model tương tác với MongoDB Atlas qua Mongoose.
- **`middlewares/`:** Các hàm chặn giữa request: kiểm tra JWT (`authMiddleware`), kiểm thực & làm sạch dữ liệu đầu vào (`validateMiddleware`), và hệ thống kiểm soát tần suất request đa tầng (`rateLimiter/`).
- **`validators/`:** Các schema kiểm tra tính hợp lệ của request payload bằng thư viện `Zod` (auth, user, store, member, shift, schedule, common).
- **`config/`:** Quản lý cấu hình môi trường, thiết lập kết nối cơ sở dữ liệu MongoDB Atlas.

---

## 4. Danh Mục Công Nghệ Đã Lựa Chọn

- **Web Frontend:**
  - `React.js` & `Vite`: Nền tảng xây dựng SPA nhanh, hiện đại và nhẹ.
  - `JavaScript`: Ngôn ngữ phát triển thống nhất.
  - `React Router`: Quản lý định tuyến và điều hướng trên trình duyệt.
  - `Tailwind CSS`: Tiện ích tạo kiểu giao diện nhất quán, tốc độ cao.
  - `Lucide React`: Thư viện biểu tượng gọn nhẹ, chuẩn hóa.
  - `FullCalendar`: Thư viện hiển thị lịch và ca làm chuyên sâu, hỗ trợ kéo thả trực quan.
- **Mobile Frontend:**
  - `React Native` & `Expo`: Phát triển ứng dụng di động đa nền tảng ổn định, dễ cấu hình và kiểm thử.
  - `React Navigation`: Bộ điều hướng tiêu chuẩn cho React Native.
  - `Expo SecureStore`: Lưu trữ an toàn dữ liệu nhạy cảm trên iOS Keychain / Android Keystore.
- **Backend API:**
  - `Node.js` & `Express.js`: Hệ sinh thái máy chủ REST API phổ biến, linh hoạt và quen thuộc.
  - `MongoDB Atlas` & `Mongoose`: Cơ sở dữ liệu NoSQL linh hoạt, phù hợp với mô hình dữ liệu ca làm việc đa dạng.
  - `JWT (JSON Web Token)` & `bcrypt`: Cơ chế xác thực không trạng thái (stateless) và mã hóa mật khẩu an toàn.
  - `Zod`: Thư viện khai báo và kiểm thực schema dữ liệu đầu vào chặt chẽ, loại bỏ field thừa và chống NoSQL injection.
  - `express-rate-limit`: Giới hạn tần suất gọi API đa tầng nhằm ngăn chặn tấn công Brute-force mật khẩu/OTP và chống nghẽn CPU/DoS.
- **Giao Tiếp Client-Server:**
  - `Axios`: Client HTTP ổn định cho cả Web và Mobile với cơ chế interceptor xử lý token thuận tiện.

---

## 5. Giả Định & Các Quyết Định Kiến Trúc Đang Chờ Xác Nhận (Unresolved)

### Các giả định hiện tại
- **Môi trường:** Các ứng dụng Web và Mobile sẽ kết nối tới cùng một Backend endpoint thông qua cấu hình biến môi trường (`VITE_API_URL`, `EXPO_PUBLIC_API_URL`).
- **Phân vai trò:** Một tài khoản người dùng chỉ thuộc một vai trò chính trong mỗi phiên làm việc (ADMIN, MANAGER, hoặc EMPLOYEE).

### Các quyết định kiến trúc đã phê duyệt & triển khai (Resolved)
1. **Cấu hình Cross-Origin Resource Sharing (CORS & Credentials):** Đã hoàn tất Whitelist origin động (`http://localhost:3000`, `http://localhost:5173`, `CLIENT_URL`) kết hợp `credentials: true` ở Backend và `withCredentials: true` ở Frontend Axios để hỗ trợ truyền nhận Cookie an toàn.
2. **Cơ chế tải mới Token (Refresh Token Rotation - RTR):** Đã triển khai chuẩn bảo mật Dual HttpOnly Cookie: Access Token (15m) + Refresh Token (30d). Kèm cơ chế tự động phát hiện gian lận (Reuse Detection): nếu token cũ bị sử dụng lại, server lập tức thu hồi toàn bộ phiên đăng nhập của người dùng.

### Các quyết định kiến trúc đang chờ phê duyệt (Unresolved)
1. **Chia sẻ Type / Schema giữa các ứng dụng:** Hiện tại chưa tạo package dùng chung (shared library) nhằm giữ cấu trúc tối giản. Khi chuyển sang giai đoạn sau, có thể cân nhắc package dùng chung cho các validation schema/constants giữa Web/Mobile/Backend.

---

## 6. Nguyên Tắc Kiến Trúc Modular & Single Responsibility (Mỗi File Một Việc)

### Quyết định
- **Tuyệt đối không viết dồn toàn bộ giao diện và logic vào một file duy nhất** (tránh các file quá lớn >250–300 dòng).
- Mỗi file thành phần chỉ đảm nhiệm một trách nhiệm duy nhất (**Single Responsibility Principle**):
  - **Trang chính (Page component):** Chỉ giữ vai trò quản lý state cấp cao (top-level state), fetch dữ liệu và điều phối các component con.
  - **Thành phần giao diện (UI components):** Tách riêng từng modal, từng item trong danh sách, form nhập liệu, section giới thiệu thành các sub-components độc lập đặt trong thư mục `components/<feature>/`.
  - **Tái sử dụng & Gọi lẫn nhau:** Các component con giao tiếp qua props và callbacks rõ ràng, dễ đọc, dễ kiểm thử và dễ bảo trì.
- **Quy chuẩn Form & Dữ liệu:**
  - Tránh gắn cứng dữ liệu mẫu (hardcoded options).
  - Cung cấp các công cụ chọn linh hoạt như thẻ `<select>` với bước nhảy rõ ràng (10k, 20k, 30k... hoặc 0.5h, 1h...) và ô nhập văn bản tự do để người dùng chủ động điều chỉnh.


