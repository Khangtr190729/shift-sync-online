# Danh Sách & Tài Liệu API Backend (API.md)

Tài liệu này tổng hợp toàn bộ các RESTful API hiện có của hệ thống **Ca Làm Online** (Backend chạy tại `http://localhost:5000`).

---

## 📌 Quy Ước Chung
- **Định dạng dữ liệu:** JSON (`Content-Type: application/json`).
- **Cơ chế xác thực & Quản lý Token đa nền tảng (Dual HttpOnly Cookie + Header Fallback):**
  * **Trên Web Client:** Hệ thống áp dụng chuẩn bảo mật cấp ngân hàng **Dual HttpOnly Cookie**:
    * `accessToken` (sống 15 phút, `httpOnly: true`, `sameSite`, `secure`).
    * `refreshToken` (sống 30 ngày, `httpOnly: true`, `sameSite`, `secure`).
    * Trình duyệt tự động đính kèm và gửi cả 2 Cookie trong mọi request mà không cần can thiệp qua mã JavaScript (chống XSS 100%).
    * **CORS & Credentials:** Backend bật `credentials: true` và Whitelist cụ thể các origin (`http://localhost:3000`, `http://localhost:5173`,...). Phía Web Axios bắt buộc cấu hình `withCredentials: true`.
  * **Trên Mobile App:** Sử dụng Header Authorization truyền thống:
    ```http
    Authorization: Bearer <your_access_token>
    ```
    Token được lưu an toàn trong chip bảo mật phần cứng qua `Expo SecureStore` (Apple Keychain trên iOS / Android Keystore trên Android).
  * **Xoay vòng Token tự động (Refresh Token Rotation - RTR):** Khi Access Token 15 phút hết hạn, Axios Interceptor tự động gọi `/api/auth/refresh` bằng Cookie Refresh Token để nhận cặp Cookie mới toanh. Nếu phát hiện Refresh Token cũ bị tái sử dụng (Reuse Detection), server lập tức hủy toàn bộ phiên hoạt động của tài khoản để chống tấn công đánh cắp token.
- **Kiểm thực dữ liệu đầu vào (Zod Validation):** Tất cả request payload được kiểm thực tập trung qua Zod. Nếu dữ liệu không hợp lệ, server trả về mã `HTTP 400 Bad Request` kèm thông báo tiếng Việt chi tiết và mảng `errors`.
- **Giới hạn tần suất gọi (Rate Limiting - HTTP 429):**
  * Toàn bộ hệ thống áp dụng `express-rate-limit` chống Brute-force và DoS.
  * Khi vượt ngưỡng, server phản hồi mã `HTTP 429 Too Many Requests`:
    ```json
    {
      "success": false,
      "message": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
      "retryAfterMinutes": 15
    }
    ```
  * **Các hạn mức cụ thể:**
    | Phạm vi / Nhóm API | Hạn mức cho phép | Mục đích bảo vệ |
    |---|---|---|
    | **Toàn bộ hệ thống (`/api/*`)** | 300 requests / 15 phút / IP | Chống quét và tấn công cào dữ liệu |
    | **Đăng ký & Đăng nhập (`/api/auth/login`, `/register`)** | 10 lần / 15 phút / IP | Chống vét cạn (Brute-force) mật khẩu |
    | **Gửi OTP Email (`/api/auth/forgot-password`)** | 3 lần / 15 phút / IP | Chống spam email & bảo vệ quota Gmail |
    | **Xác thực OTP (`/verify-reset-otp`, `/reset-password`)** | 5 lần / 15 phút / IP | Chống dò quét mã xác thực 6 chữ số |
    | **Nhập mã mời vào quán (`/api/stores/join-by-code`)** | 5 lần / 15 phút / IP | Chống dò quét mã mời cửa hàng 6 số |
    | **Tự động xếp ca (`/api/stores/:storeId/schedules/auto-generate`)** | 10 lần / 5 phút / IP | Chống nghẽn CPU Event Loop |

- **Cấu trúc phản hồi chung:**
  * Thành công: `{ "success": true, "data": ... }` hoặc `{ "success": true, "message": "..." }`
  * Thất bại: `{ "success": false, "message": "Thông báo lỗi tiếng Việt dễ hiểu" }`

---

## 1. Nhóm Xác Thực & Hồ Sơ Cá Nhân (`/api/auth` & `/api/users`)

| Method | Endpoint | Yêu cầu Token | Quyền hạn | Chức năng |
|---|---|:---:|---|---|
| `POST` | `/api/auth/register` | ❌ | Công khai *(10 req/15p)* | Đăng ký tài khoản (Bắt buộc: email, password, fullName, gender, age). Trả về dữ liệu và tự động gán cặp Cookie HttpOnly (AT 15m & RT 30d) |
| `POST` | `/api/auth/login` | ❌ | Công khai *(10 req/15p)* | Đăng nhập tài khoản, tự động gán 2 Cookie HttpOnly cho Web và trả về Token trong body cho Mobile |
| `POST` | `/api/auth/refresh` | 🍪 / Body | Công khai *(Xác thực qua RT)* | **Làm mới phiên làm việc (RTR):** Đổi Refresh Token cũ lấy cặp AT & RT mới toanh. Tự động thu hồi toàn bộ phiên nếu phát hiện mã RT cũ bị dùng lại (Reuse Detection) |
| `POST` | `/api/auth/logout` | ❌ | Công khai | **Đăng xuất an toàn:** Thu hồi phiên làm việc trong database và xóa sạch cả 2 Cookie HttpOnly trên trình duyệt |
| `POST` | `/api/auth/forgot-password` | ❌ | Công khai *(3 req/15p)* | **Yêu cầu gửi mã OTP 6 số qua Email** để đặt lại mật khẩu |
| `POST` | `/api/auth/verify-reset-otp` | ❌ | Công khai *(5 req/15p)* | **Xác thực mã OTP 6 số** (kiểm tra khớp mã và còn trong 10 phút) |
| `POST` | `/api/auth/reset-password` | ❌ | Công khai *(5 req/15p)* | **Đổi mật khẩu mới bằng mã OTP 6 số** |
| `GET` | `/api/auth/me` | ✅ | Đã đăng nhập | Lấy thông tin cá nhân của tài khoản đang đăng nhập |
| `PUT` | `/api/users/profile` | ✅ | Đã đăng nhập | Cập nhật thông tin cá nhân (họ tên, giới tính, tuổi, avatar) |
| `PUT` | `/api/users/change-password` | ✅ | Đã đăng nhập | Đổi mật khẩu tài khoản khi đã đăng nhập |

---

## 2. Nhóm Cửa Hàng & Mã Mời 6 Số (`/api/stores`)

| Method | Endpoint | Yêu cầu Token | Quyền hạn | Chức năng |
|---|---|:---:|---|---|
| `POST` | `/api/stores` | ✅ | `ADMIN` (Chủ) | Tạo cửa hàng mới (Tên quán, địa chỉ) |
| `GET` | `/api/stores/my-store` | ✅ | Mọi thành viên | Xem thông tin cửa hàng hiện tại (Chủ xem quán mình sở hữu, Nhân viên xem quán mình đang làm) |
| `PUT` | `/api/stores/my-store` | ✅ | `ADMIN` (Chủ) | Cập nhật thông tin cửa hàng (Tên, địa chỉ) |
| `POST` | `/api/stores/generate-invite-code` | ✅ | `ADMIN` (Chủ) | **Bấm sinh Mã Mời 6 số ngẫu nhiên** (hạn 1 giờ, tự động hủy mã cũ) |
| `POST` | `/api/stores/join-by-code` | ✅ | `EMPLOYEE` *(5 req/15p)* | **Nhân viên nhập mã 6 số để gia nhập quán** |
| `POST` | `/api/stores/invite-by-id` | ✅ | `ADMIN` (Chủ) | Mời trực tiếp nhân viên qua ID hoặc Email (Tự động gửi email thông báo) |

---

## 3. Nhóm Quản Lý Nhân Sự & Gắn Lương (`/api/stores/:storeId/members`)

| Method | Endpoint | Yêu cầu Token | Quyền hạn | Chức năng |
|---|---|:---:|---|---|
| `GET` | `/api/stores/:storeId/members` | ✅ | `ADMIN` / `MANAGER` | Lấy danh sách nhân viên trong quán kèm mức lương/h và chức vụ |
| `PUT` | `/api/stores/:storeId/members/:memberId/wage` | ✅ | `ADMIN` / `MANAGER` | **Gắn / Cập nhật mức lương theo giờ (VNĐ/h)** (ví dụ: 20.000, 25.000 đ/h) |
| `PUT` | `/api/stores/:storeId/members/:memberId/role` | ✅ | **Chỉ Chủ quán** | Bổ nhiệm nhân viên lên làm **Quản lý (`MANAGER`)** hoặc hạ quyền |
| `PUT` | `/api/stores/:storeId/members/:memberId/type` | ✅ | `ADMIN` / `MANAGER` | Đổi hình thức làm việc: Chính thức (`FULL_TIME`) hoặc Bán thời gian (`PART_TIME`) |
| `DELETE` | `/api/stores/:storeId/members/:memberId` | ✅ | **Chỉ Chủ quán** | Xóa nhân viên khỏi quán (chuyển trạng thái `INACTIVE` để giữ lịch sử) |

---

## 4. Nhóm Khung Giờ / Slot Ca Làm (`/api/stores/:storeId/shifts`)

| Method | Endpoint | Yêu cầu Token | Quyền hạn | Chức năng |
|---|---|:---:|---|---|
| `GET` | `/api/stores/:storeId/shifts` | ✅ | Mọi thành viên quán | Lấy danh sách toàn bộ các Slot ca làm của quán kèm `peakLevel` (1 - 3 sao) |
| `POST` | `/api/stores/:storeId/shifts` | ✅ | `ADMIN` / `MANAGER` | Tạo mới Slot ca làm (Tên slot, giờ vào, giờ ra, `peakLevel`: 1-3 sao, tự động tính `durationHours`) |
| `PUT` | `/api/stores/:storeId/shifts/:shiftId` | ✅ | `ADMIN` / `MANAGER` | Chỉnh sửa Slot ca làm việc / Đổi nhanh số sao cao điểm (`peakLevel`) |
| `DELETE` | `/api/stores/:storeId/shifts/:shiftId` | ✅ | `ADMIN` / `MANAGER` | Xóa Slot ca làm việc khỏi quán |

---

## 5. Nhóm Xếp Lịch Thời Khóa Biểu, Tính Lương & Gửi Email

| Method | Endpoint | Yêu cầu Token | Quyền hạn | Chức năng |
|---|---|:---:|---|---|
| `GET` | `/api/stores/:storeId/schedules` | ✅ | Mọi thành viên quán | Lấy bảng lịch tuần theo tham số `?week=43&year=2026`, kèm bảng tổng hợp lương nhân viên |
| `GET` | `/api/stores/:storeId/schedules/monthly-stats` | ✅ | Mọi thành viên quán | Thống kê số ca đã phân và dự toán chi phí lương cả tháng `?month=10&year=2026` |
| `POST` | `/api/stores/:storeId/schedules/save-draft` | ✅ | `ADMIN` / `MANAGER` | **Lưu Bản Nháp (`DRAFT`)**: Xếp ca cho nhân viên (hoặc Quản lý tự xếp cho mình), tự động tính lương tuần |
| `POST` | `/api/stores/:storeId/schedules/auto-generate` | ✅ | `ADMIN` / `MANAGER` *(10 req/5p)* | **Tự động xếp lịch thông minh**: Tự động phân bổ nhân sự theo mức độ sao cao điểm của từng ca (`AUTO_BY_STARS`) và quy mô nhân sự quán |
| `POST` | `/api/stores/:storeId/schedules/publish` | ✅ | `ADMIN` / `MANAGER` | **Xác nhận Xuất bản (`PUBLISHED`)**: Chốt lịch tuần & **Tự động gửi Email** lịch trực kèm tiền lương đến từng nhân viên |
| `PUT` | `/api/stores/:storeId/schedules/evaluate-shift` | ✅ | `ADMIN` / `MANAGER` | **Đánh giá ca làm việc đa cấp độ**: Hoàn thành (`COMPLETED`), Chưa tốt (`PARTIAL` - trừ giờ/tiền), Vắng (`MISSED` - trừ cả ca) kèm gửi email minh bạch |
| `GET` | `/api/schedules/my-schedule` | ✅ | `EMPLOYEE` | **Nhân viên xem lịch cá nhân tuần này**: Xem các ca trực của riêng mình và tổng số tiền lương nhận được |

---

## 6. Mẫu Payload Nhanh Khi Test

### 🔹 Đăng ký tài khoản (`POST /api/auth/register`)
```json
{
  "email": "chuquan@gmail.com",
  "password": "password123",
  "fullName": "Nguyễn Văn Chủ Quán",
  "gender": "Nam",
  "age": 28,
  "systemRole": "ADMIN"
}
```

### 🔹 Đánh giá ca làm việc (`PUT /api/stores/:storeId/schedules/evaluate-shift`)
```json
{
  "date": "2026-10-24",
  "shiftId": "6718d7931c84cb123456789a",
  "userId": "6718d7521c84cb123456789b",
  "attendanceStatus": "PARTIAL",
  "missedReason": "Đi làm muộn 30 phút do sự cố kẹt xe",
  "deductedHours": 0.5,
  "penaltyType": "HOURS"
}
```

### 🔹 Đăng nhập (`POST /api/auth/login`)
```json
{
  "email": "chuquan@gmail.com",
  "password": "password123"
}
```

### 🔹 Nhân viên nhập mã 6 số vào quán (`POST /api/stores/join-by-code`)
```json
{
  "inviteCode": "557736",
  "employmentType": "PART_TIME"
}
```

### 🔹 Lưu bản nháp lịch tuần (`POST /api/stores/:storeId/schedules/save-draft`)
```json
{
  "week": 43,
  "year": 2026,
  "startDate": "2026-10-19",
  "endDate": "2026-10-25",
  "assignments": [
    {
      "date": "2026-10-19",
      "dayOfWeek": "Thứ 2",
      "shiftId": "6adb4d80c6954b3856773bde",
      "userId": "6adb4b57747a495bc51e4dea"
    }
  ]
}
```
