# Thiết Kế Cơ Sở Dữ Liệu (DATABASE.md)

Tài liệu này mô tả chi tiết và đơn giản toàn bộ cấu trúc các bảng (Collections trong MongoDB) cho hệ thống **Ca Làm Online** theo đúng yêu cầu nghiệp vụ của dự án.

---

## 1. Tổng Quan Về Các Bảng (Collections)

Hệ thống sử dụng **MongoDB Atlas** với **5 bảng chính** phục vụ đầy đủ luồng từ đăng ký, tạo cửa hàng, mã mời, xếp lịch dạng slot/tuần đến tính lương tự động và gửi email:

| STT | Tên Bảng (Collection) | Mục Đích Sử Dụng |
|---|---|---|
| 1 | **`users`** | Lưu tài khoản người dùng (chủ quán hoặc nhân viên đi làm) |
| 2 | **`stores`** | Lưu thông tin cửa hàng và mã mời 6 chữ số (hiệu lực 1h) |
| 3 | **`store_members`** | Lưu mối quan hệ nhân viên thuộc cửa hàng, chức vụ, mức lương theo giờ (VNĐ/h) |
| 4 | **`shifts`** | Định nghĩa các ca làm việc / Khung giờ (Slot 1, Slot 2, Ca sáng...) |
| 5 | **`schedules`** | Lưu bảng xếp lịch làm việc theo tuần/tháng, danh sách phân ca, trạng thái Nháp / Đã gửi email |

---

## 2. Chi Tiết Từng Bảng & Ý Nghĩa Các Thuộc Tính

### 2.1. Bảng `users` (Tài khoản người dùng)
> **Mục đích:** Lưu thông tin tài khoản đăng ký của tất cả mọi người trên hệ thống.

| Tên trường (Field) | Kiểu dữ liệu | Bắt buộc | Ý nghĩa / Giải thích |
|---|---|---|---|
| `_id` | ObjectId | Có | Mã định danh duy nhất của người dùng |
| `email` | String | Có | Email dùng để đăng nhập và nhận thông báo lịch làm việc (Không trùng lặp) |
| `password` | String | Có | Mật khẩu tài khoản (Đã được băm an toàn bằng `bcrypt`) |
| `fullName` | String | Có | Họ và tên đầy đủ |
| `gender` | String | Có | Giới tính (`Nam`, `Nu`, `Khac`) |
| `age` | Number | Có | Tuổi của người dùng |
| `systemRole` | String | Có | Vai trò khi đăng ký: chỉ được chọn `ADMIN` (Chủ) hoặc `EMPLOYEE` (Người đi làm). **Không có Quản lý ở đây** |
| `avatar` | String | Không | Đường dẫn ảnh đại diện cá nhân |
| `resetPasswordOtp.code` | String | Không | Mã xác thực OTP 6 số dùng để đặt lại mật khẩu |
| `resetPasswordOtp.expiresAt` | Date | Không | Thời điểm hết hạn của mã OTP (hiệu lực 10 phút) |
| `refreshTokens` | Array<String> | Không | Danh sách các mã `jti` (JWT ID) của các Refresh Token đang hoạt động, phục vụ cơ chế xoay vòng token (RTR) và phát hiện gian lận (Reuse Detection) |
| `createdAt` | Date | Có | Ngày tạo tài khoản |

---

### 2.2. Bảng `stores` (Cửa hàng)
> **Mục đích:** Lưu thông tin cửa hàng do Chủ (Admin) tạo ra, kèm cơ chế sinh mã mời 6 số ngẫu nhiên có hạn 1 giờ.

| Tên trường (Field) | Kiểu dữ liệu | Bắt buộc | Ý nghĩa / Giải thích |
|---|---|---|---|
| `_id` | ObjectId | Có | Mã định danh duy nhất của cửa hàng |
| `name` | String | Có | Tên cửa hàng (Ví dụ: "Tiệm Cà Phê Mộc", "Quán Ăn A") |
| `ownerId` | ObjectId | Có | ID của Chủ cửa hàng (`users._id`) |
| `address` | String | Không | Địa chỉ cửa hàng |
| `inviteCode.code` | String | Không | Mã mời 6 số ngẫu nhiên (Ví dụ: `"582914"`). Chỉ sinh ra khi chủ bấm nút |
| `inviteCode.expiresAt` | Date | Không | Thời điểm mã hết hạn (đúng 1 tiếng kể từ lúc sinh mã) |
| `createdAt` | Date | Có | Ngày tạo cửa hàng |

---

### 2.3. Bảng `store_members` (Thành viên cửa hàng & Mức lương)
> **Mục đích:** Xác định nhân viên nào thuộc cửa hàng nào, giữ chức vụ gì, và **lương mỗi giờ là bao nhiêu**.

| Tên trường (Field) | Kiểu dữ liệu | Bắt buộc | Ý nghĩa / Giải thích |
|---|---|---|---|
| `_id` | ObjectId | Có | Mã định danh bản ghi thành viên |
| `storeId` | ObjectId | Có | Thuộc về cửa hàng nào (`stores._id`) |
| `userId` | ObjectId | Có | Là tài khoản người dùng nào (`users._id`) |
| `roleInStore` | String | Có | Chức vụ trong quán: `MANAGER` (Quản lý do chủ phong) hoặc `EMPLOYEE` (Nhân viên) |
| `employmentType` | String | Có | Hình thức làm việc: `FULL_TIME` (Chính thức) hoặc `PART_TIME` (Bán thời gian) |
| `hourlyWage` | Number | Có | **Mức lương theo giờ** (Ví dụ: `20000` = 20.000 VNĐ/giờ). Dùng để tự động nhân với tổng giờ làm |
| `status` | String | Có | Trạng thái: `ACTIVE` (đang làm việc), `INACTIVE` (đã nghỉ) |
| `joinedAt` | Date | Có | Ngày tham gia vào cửa hàng |

---

### 2.4. Bảng `shifts` (Mẫu ca làm việc / Slot làm)
> **Mục đích:** Định nghĩa các khung giờ làm việc chuẩn trong ngày của cửa hàng (tương ứng với các Slot trên giao diện thời khóa biểu).

| Tên trường (Field) | Kiểu dữ liệu | Bắt buộc | Ý nghĩa / Giải thích |
|---|---|---|---|
| `_id` | ObjectId | Có | Mã định danh ca làm |
| `storeId` | ObjectId | Có | Thuộc cửa hàng nào (`stores._id`) |
| `name` | String | Có | Tên ca hoặc tên slot (Ví dụ: `"Slot 1"`, `"Slot 2"`, `"Ca Sáng"`) |
| `startTime` | String | Có | Giờ bắt đầu (Ví dụ: `"07:00"`) |
| `endTime` | String | Có | Giờ kết thúc (Ví dụ: `"11:30"`) |
| `durationHours` | Number | Có | Tổng số giờ của ca (Ví dụ: `4.5` tiếng). Dùng để nhân ra tiền lương |
| `color` | String | Không | Màu hiển thị trên bảng thời khóa biểu tuần |
| `peakLevel` | Number | Không | **Mức độ cao điểm của ca (1 đến 3 sao)**: `1` (Bình thường - mặc định), `2` (Khá cao điểm), `3` (Rất cao điểm). Phục vụ thuật toán tự động phân bổ nhân sự |

---

### 2.5. Bảng `schedules` (Bảng phân lịch làm & Tiền lương)
> **Mục đích:** Quản lý toàn bộ lịch làm việc của một tuần/tháng, lưu bản nháp, danh sách nhân viên trực từng ca và tổng tiền lương dự kiến chi trả.

| Tên trường (Field) | Kiểu dữ liệu | Bắt buộc | Ý nghĩa / Giải thích |
|---|---|---|---|
| `_id` | ObjectId | Có | Mã định danh đợt xếp lịch |
| `storeId` | ObjectId | Có | Thuộc cửa hàng nào (`stores._id`) |
| `week` | Number | Có | Tuần thứ mấy trong năm (Ví dụ: Tuần 43) |
| `year` | Number | Có | Năm xếp lịch (Ví dụ: 2026) |
| `startDate` | Date | Có | Ngày đầu tuần (Thứ 2, ví dụ: `2026-10-19`) |
| `endDate` | Date | Có | Ngày cuối tuần (Chủ nhật, ví dụ: `2026-10-25`) |
| `status` | String | Có | `DRAFT` (Bản nháp đang xếp chưa gửi) hoặc `PUBLISHED` (Đã xác nhận & Đã gửi email) |
| `createdBy` | ObjectId | Có | Người xếp lịch (`userId` của Chủ hoặc Quản lý) |
| `assignments` | Array | Có | **Danh sách chi tiết phân công ca** (xem chi tiết cấu trúc bên dưới) |
| `publishedAt` | Date | Không | Ngày giờ bấm nút "Xác nhận & Gửi Email" |

#### Cấu trúc mảng `assignments` (Chi tiết từng ca phân cho nhân viên):
Mỗi phần tử trong mảng đại diện cho một ca làm của một người:
```json
{
  "date": "2026-10-23",          // Ngày làm cụ thể
  "dayOfWeek": "Thứ 6",          // Thứ trong tuần (Thứ 2 -> Chủ nhật)
  "shiftId": "ObjectId(...)",    // Ca làm nào (Slot 1, Slot 2...)
  "userId": "ObjectId(...)",     // Nhân viên được xếp (hoặc chính Quản lý)
  "hourlyWage": 20000,           // Lương/giờ áp dụng tại ca này
  "hours": 4.5,                  // Số giờ làm của ca
  "totalPay": 90000              // Tiền lương ca này = 4.5 * 20.000 = 90.000 VNĐ
}
```

---

## 3. Cách Hệ Thống Tự Động Tính Lương & Gửi Email

1. **Khi Quản lý / Chủ xếp lịch:** 
   - Kéo thả hoặc chọn nhân viên A vào các ô Slot trong tuần.
   - Hệ thống tự lấy `hourlyWage` (ví dụ: 20.000đ) của nhân viên A nhân với số giờ của từng Slot.
   - Cộng tổng lại ra: **Tổng giờ làm trong tuần** và **Tổng tiền lương dự kiến** của nhân viên A.
2. **Khi bấm "Xác nhận & Xuất bản" (Publish):**
   - Trạng thái chuyển từ `DRAFT` sang `PUBLISHED`.
   - Hệ thống kích hoạt dịch vụ Email gửi đồng loạt đến email của từng nhân viên:
     - **Form 1 - Email Lịch làm & Lương:** Bảng chi tiết các ca trực trong tuần + Tổng tiền lương nhận được.
     - **Form 2 - Email Mời tham gia cửa hàng:** Gửi kèm mã mời 6 số (hoặc link) khi chủ quán muốn mời ai đó vào cửa hàng.
