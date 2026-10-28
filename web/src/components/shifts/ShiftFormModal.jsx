import React from 'react';
import { Clock, X, Star, AlertTriangle } from 'lucide-react';

export const ShiftFormModal = ({
  shiftModal,
  setShiftModal,
  computedDuration,
  modalConflict,
  handleTimeChange,
  onSaveShift,
}) => {
  if (!shiftModal.isOpen) return null;

  const handleClose = () => {
    setShiftModal((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        <div className="p-5 bg-white border-b border-[#e5e5e7] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#0066cc]" />
            <h3 className="font-semibold text-[#1d1d1f] text-sm">
              {shiftModal.isEdit ? 'Chỉnh sửa ca làm việc' : 'Tạo ca làm việc mới'}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] rounded-full hover:bg-[#f5f5f7] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSaveShift} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
              Tên ca làm việc <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Ca Sáng, Ca Gãy, Slot 1..."
              value={shiftModal.name}
              onChange={(e) => setShiftModal((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-normal text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Giờ bắt đầu</label>
              <input
                type="time"
                value={shiftModal.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-mono font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Giờ kết thúc</label>
              <input
                type="time"
                value={shiftModal.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#d2d2d7] text-xs font-mono font-medium text-[#1d1d1f] focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Thời lượng ca (tự động tính)
              </label>
              <div className="w-full p-2.5 rounded-xl border border-[#e5e5e7] bg-[#fafafc] flex items-center justify-between text-xs font-mono font-medium text-[#1d1d1f]">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#0066cc]" />
                  <span>{computedDuration > 0 ? `${computedDuration} tiếng` : '0 tiếng'}</span>
                </div>
                <span className="text-[10px] font-sans font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Tự động
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">Màu phân biệt</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={shiftModal.color}
                  onChange={(e) => setShiftModal((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-10 h-9 p-0.5 rounded-xl border border-[#d2d2d7] cursor-pointer"
                />
                <span className="text-xs font-mono text-[#86868b] font-medium">{shiftModal.color}</span>
              </div>
            </div>
          </div>

          {/* Mức độ cao điểm (1 - 3 sao) */}
          <div>
            <label className="block text-xs font-medium text-[#1d1d1f] mb-1.5">
              Mức độ cao điểm của ca (phục vụ tự động xếp lịch):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { stars: 1, label: 'Bình thường', desc: '1 sao (Tiêu chuẩn)' },
                { stars: 2, label: 'Khá cao điểm', desc: '2 sao (Đông khách)' },
                { stars: 3, label: 'Rất cao điểm', desc: '3 sao (Giờ vàng)' },
              ].map((opt) => {
                const isSelected = (shiftModal.peakLevel || 1) === opt.stars;
                return (
                  <button
                    key={opt.stars}
                    type="button"
                    onClick={() => setShiftModal((prev) => ({ ...prev, peakLevel: opt.stars }))}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0066cc] bg-blue-50/70 ring-2 ring-blue-200/60 shadow-xs'
                        : 'border-[#e5e5e7] bg-white hover:bg-[#fafafc]'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 mb-1.5">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= opt.stars
                              ? 'fill-amber-400 stroke-amber-500 text-amber-500'
                              : 'fill-slate-100 stroke-slate-300 text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-[#1d1d1f]">{opt.label}</div>
                      <div className="text-[10px] text-[#86868b] mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#86868b] mt-1.5 italic">
              * Thuật toán sẽ ưu tiên phân bổ thêm nhân sự cho ca 2-3 sao dựa trên tổng số nhân viên quán.
            </p>
          </div>

          {/* Conflict warning in modal */}
          {modalConflict && (
            <div className="p-3 bg-rose-50 border border-rose-200/60 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-800">Cảnh báo: Trùng khung giờ ca làm!</p>
                <p className="mt-0.5 text-[#6e6e73]">
                  Khung giờ ({shiftModal.startTime} — {shiftModal.endTime}) bị trùng/giao thoa với ca{' '}
                  <b>
                    "{modalConflict.name}" ({modalConflict.startTime} — {modalConflict.endTime})
                  </b>
                  . Các ca làm việc trong cửa hàng không được phép trùng khung giờ với nhau!
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!!modalConflict || computedDuration <= 0}
              className="px-5 py-2 text-xs font-medium text-white bg-[#0066cc] hover:bg-[#0071e3] rounded-full shadow-xs active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              {shiftModal.isEdit ? 'Lưu cập nhật' : 'Tạo ca làm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

