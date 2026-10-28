import React from 'react';
import { Send, Info } from 'lucide-react';
import { formatWeekRange } from '../../utils/formatters';

export const PublishScheduleModal = ({
  isOpen,
  onClose,
  saving,
  onConfirmPublish,
  currentMonday,
  week,
  year,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-[#e5e5e7] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        <div className="p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0066cc] mx-auto flex items-center justify-center">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">
            Xác nhận xuất bản lịch & gửi email?
          </h3>
          <p className="text-xs text-[#6e6e73] leading-relaxed">
            Hệ thống sẽ chuyển trạng thái lịch sang <b>Đã xuất bản</b>, đồng thời tự động gửi email thông báo chi tiết danh sách ca làm và bảng lương ước tính tới từng nhân viên có ca trong tuần này.
          </p>
          <div className="bg-[#fafafc] border border-[#e5e5e7] rounded-xl p-3 text-left text-xs text-[#1d1d1f]">
            <div className="flex items-center gap-1.5 font-semibold text-[#0066cc] mb-1">
              <Info className="w-4 h-4" />
              <span>Tuần áp dụng:</span>
            </div>
            <span className="text-[#6e6e73]">
              {formatWeekRange(currentMonday)} (Tuần {week}/{year})
            </span>
          </div>
        </div>

        <div className="px-6 py-4 bg-[#f5f5f7] border-t border-[#e5e5e7] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white rounded-full transition btn-press cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={onConfirmPublish}
            className="px-5 py-2.5 text-xs font-medium text-white bg-[#0066cc] hover:bg-[#0071e3] rounded-full shadow-xs transition btn-press disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Đang gửi email...' : 'Đồng ý & Xuất bản ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishScheduleModal;
