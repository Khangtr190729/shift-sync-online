import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const HomeFaqSection = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  const faqs = [
    {
      q: 'Ca Làm Online hoạt động như thế nào?',
      a: 'Chủ cửa hàng tạo tài khoản, tạo quán và các ca làm việc mẫu. Sau đó mời nhân viên qua mã 6 số hoặc email. Quản lý có thể xếp ca thủ công hoặc bấm "Tự động xếp lịch", hệ thống sẽ chia đều ca, chống trùng lịch và tự động gửi email thông báo kèm bảng lương ước tính tới từng nhân viên khi xuất bản.',
    },
    {
      q: 'Làm thế nào để tải ứng dụng về điện thoại cho nhân viên?',
      a: 'Bạn chỉ cần bấm nút "Tải App" trên thanh menu để cuộn nhanh xuống phần tải ứng dụng ngay trên footer, sau đó bấm chọn "App Store (iOS)" hoặc "Google Play (CH Play)" để cài đặt.',
    },
    {
      q: 'Nhân viên có cần phải trả phí để xem lịch làm việc không?',
      a: 'Hoàn toàn miễn phí! Nhân viên chỉ cần tải app hoặc truy cập web, đăng ký vai trò "Người đi làm", nhập mã mời của quán là có thể tra cứu lịch làm cá nhân, xem dự toán lương và nhận thông báo ca trực tự động qua email.',
    },
    {
      q: 'Quản lý cửa hàng có thể được xếp ca làm việc không?',
      a: 'Có! Hệ thống hỗ trợ mô hình Quản lý kiêm nhân viên bán hàng / trực ca. Quản lý vừa có quyền điều phối xếp ca cho quán, vừa có thể được phân ca và theo dõi ca trực riêng trong ứng dụng di động hoặc màn hình "Lịch làm của tôi".',
    },
    {
      q: 'Tính năng đánh giá ca làm và trừ lương hoạt động ra sao?',
      a: 'Khi nhân viên đi trễ hoặc xin về sớm, Quản lý có thể chọn trừ theo số tiếng (0.5h, 1h...) hoặc trừ theo số tiền cố định (bước nhảy 10k, 20k...) và tự do nhập lý do. Nếu nhân viên bỏ ca hoàn toàn, quản lý đánh dấu "Không hoàn thành" để trừ toàn bộ ca. Tiền lương sẽ tự động cập nhật và gửi email giải trình chi tiết về cho nhân viên.',
    },
    {
      q: 'Hệ thống có ngăn chặn việc xếp trùng ca không?',
      a: 'Tuyệt đối có! Hệ thống có 2 lớp bảo vệ: (1) Ngăn không cho tạo các ca làm có khung giờ giao thoa nhau trong cùng cửa hàng; (2) Tự động phát hiện và cảnh báo tức thời nếu vô tình xếp một nhân viên vào 2 ca cùng ngày hoặc vượt quá số ca tối đa.',
    },
  ];

  return (
    <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-3 mb-14">
        <span className="text-xs font-semibold text-[#0066cc] bg-blue-50/80 border border-blue-200/60 px-3 py-1 rounded-full">
          Giải đáp thắc mắc
        </span>
        <h2 className="text-3xl sm:text-4xl font-semibold text-[#1d1d1f] tracking-tight">
          Câu hỏi thường gặp
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = activeFaq === index;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-[#e5e5e7] overflow-hidden transition shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(isOpen ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#86868b] transition-transform duration-200 shrink-0 ml-2 ${
                    isOpen ? 'rotate-180 text-[#0066cc]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-4 pt-1 text-xs text-[#6e6e73] leading-relaxed border-t border-[#e5e5e7] animate-fade-in">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HomeFaqSection;
