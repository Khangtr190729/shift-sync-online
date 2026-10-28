import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  Mail,
  Users,
} from 'lucide-react';

export const HomeFeaturesSection = () => {
  return (
    <section id="features" className="py-20 bg-[#fafafc] border-y border-[#e5e5e7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-semibold text-[#0066cc] bg-blue-50/80 border border-blue-200/60 px-3 py-1 rounded-full">
            Tính năng vượt trội
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
            Mọi công cụ bạn cần để điều hành nhân sự cửa hàng
          </h2>
          <p className="text-xs sm:text-sm text-[#6e6e73]">
            Được thiết kế tinh gọn, tập trung vào hiệu năng cao nhất và dễ sử dụng nhất cho mọi nhân
            viên và chủ quán.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="p-7 bg-white rounded-2xl border border-[#e5e5e7] space-y-3.5 shadow-2xs hover:shadow-xs transition">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0066cc] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Tự động xếp lịch thông minh</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Thuật toán thông minh tự động phân bổ nhân sự vào các ca còn trống, đảm bảo số ca cân
              bằng và lưu dưới dạng bản nháp để duyệt trước.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-7 bg-white rounded-2xl border border-[#e5e5e7] space-y-3.5 shadow-2xs hover:shadow-xs transition">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#ff9500] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Phát hiện & Chặn trùng ca</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Ngăn chặn tạo ca trùng khung giờ trong quán và tự động cảnh báo khi nhân viên bị xếp
              chồng chéo ca làm việc trong cùng một ngày.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-7 bg-white rounded-2xl border border-[#e5e5e7] space-y-3.5 shadow-2xs hover:shadow-xs transition">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#34c759] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Bảng tính lương theo giờ</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Linh hoạt cài đặt mức lương theo giờ cho từng nhân viên Part-time hoặc Full-time. Tự
              động tổng hợp dự toán tiền lương tuần và tháng.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="p-7 bg-white rounded-2xl border border-[#e5e5e7] space-y-3.5 shadow-2xs hover:shadow-xs transition">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-[#ff3b30] flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Đánh giá ca & Khấu trừ lương linh hoạt</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Ghi nhận ca chưa hoàn thành tốt (đi trễ, về sớm) để trừ một phần lương, hoặc đánh dấu bỏ ca
              để trừ toàn bộ, kèm email thông báo minh bạch.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="p-7 bg-white rounded-2xl border border-[#e5e5e7] space-y-3.5 shadow-2xs hover:shadow-xs transition">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0066cc] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Email thông báo tự động</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Tự động gửi thông báo lịch làm việc đẹp mắt, rõ ràng kèm bảng lương chi tiết đến từng
              nhân sự ngay khi lịch tuần được xuất bản.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="p-7 bg-white rounded-2xl border border-[#e5e5e7] space-y-3.5 shadow-2xs hover:shadow-xs transition">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#af52de] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Phân quyền 3 vai trò rõ ràng</h3>
            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Chủ cửa hàng (toàn quyền quản trị), Quản lý (xếp ca và có thể trực ca), và Nhân viên
              (tra cứu lịch cá nhân trên web và điện thoại).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeFeaturesSection;
