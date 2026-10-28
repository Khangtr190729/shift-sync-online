import React, { useMemo } from 'react';
import { Sparkles, X, Info, AlertCircle, Clock, Users, Star } from 'lucide-react';

export const AutoScheduleModal = ({
  isOpen,
  onClose,
  autoConfig,
  setAutoConfig,
  autoGenerating,
  onAutoSchedule,
  isPastWeek,
  daysOfWeek,
  todayDateStr,
  shifts = [],
  shiftsCount,
  membersCount,
}) => {
  // Tính toán trước định mức dự kiến cho từng ca theo số sao và số nhân viên của quán
  const previewTargets = useMemo(() => {
    if (!Array.isArray(shifts) || shifts.length === 0) return {};
    const mode = autoConfig.staffPerShift;
    const numeric = parseInt(mode, 10);
    if (!isNaN(numeric) && numeric > 0 && mode !== 'AUTO_BY_STARS') {
      const res = {};
      shifts.forEach((s) => {
        res[s._id] = numeric;
      });
      return res;
    }

    const targets = {};
    shifts.forEach((s) => {
      targets[s._id] = 0;
    });
    if (membersCount <= 0) return targets;

    const dailyCap = membersCount * Math.max(1, autoConfig.maxShiftsPerDay || 1);
    const sorted = [...shifts].sort((a, b) => (b.peakLevel || 1) - (a.peakLevel || 1));

    if (dailyCap < shifts.length) {
      for (let i = 0; i < dailyCap; i++) {
        targets[sorted[i]._id] = 1;
      }
      return targets;
    }

    shifts.forEach((s) => {
      targets[s._id] = 1;
    });
    let remaining = dailyCap - shifts.length;

    const getCap = (peak) => {
      if (peak >= 3) return membersCount >= shifts.length * 3 ? 4 : 3;
      if (peak === 2) return membersCount >= shifts.length * 3 ? 3 : 2;
      return membersCount >= shifts.length * 4 ? 2 : 1;
    };

    while (remaining > 0) {
      const eligible = sorted.filter((s) => {
        const p = s.peakLevel || 1;
        return (targets[s._id] || 0) < getCap(p);
      });
      if (eligible.length === 0) break;
      const highestPeak = Math.max(...eligible.map((s) => s.peakLevel || 1));
      const pool = eligible.filter((s) => (s.peakLevel || 1) === highestPeak);
      pool.sort((a, b) => (targets[a._id] || 0) - (targets[b._id] || 0));
      targets[pool[0]._id] += 1;
      remaining--;
    }
    return targets;
  }, [shifts, membersCount, autoConfig.maxShiftsPerDay, autoConfig.staffPerShift]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-backdrop-fade">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-modal-pop">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#e5e5e7] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0066cc] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1d1d1f] tracking-tight">
                Tự động xếp lịch thông minh
              </h3>
              <p className="text-xs text-[#6e6e73]">
                Phân chia ca làm tối ưu theo mức độ cao điểm & lưu bản nháp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* How it works note */}
          <div className="bg-[#fafafc] border border-[#e5e5e7] rounded-xl p-3.5 text-xs text-[#1d1d1f] space-y-1.5">
            <div className="font-semibold flex items-center gap-1.5 text-[#0066cc]">
              <Info className="w-4 h-4 shrink-0" />
              <span>Quy tắc tối ưu tự động:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#6e6e73] pl-1 font-normal">
              <li>Ưu tiên phân bổ thêm nhân sự cho <b>ca cao điểm (nhiều sao ⭐)</b> dựa trên số nhân viên quán.</li>
              <li>Cân bằng công bằng số ca và tổng số giờ làm việc đều giữa các nhân viên.</li>
              <li>Tuyệt đối không trùng ca và không giao thoa khung giờ trong cùng ngày.</li>
              <li>Lưu dưới dạng <b>Bản nháp (DRAFT)</b> — quản lý có thể xem lại, tinh chỉnh từng ca và xác nhận sau.</li>
            </ul>
          </div>

          {/* Past week / Past days notice */}
          {isPastWeek ? (
            <div className="bg-rose-50 border border-rose-200/60 rounded-xl p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Tuần này đã kết thúc trong quá khứ. Bạn không thể tự động xếp ca cho tuần trong quá khứ.</span>
            </div>
          ) : daysOfWeek.some((d) => d.isPast) ? (
            <div className="bg-blue-50 border border-blue-200/60 rounded-xl p-3 text-xs text-[#0066cc] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0066cc] shrink-0" />
              <span>
                Tuần này có ngày hoặc ca đã qua. Hệ thống sẽ tự động bỏ qua các ngày/ca đã qua (ví dụ Thứ Hai hoặc ca sáng đã qua), giữ nguyên người trực cũ và chỉ tự động xếp ca cho các ca sắp tới.
              </span>
            </div>
          ) : null}

          {/* Store context stats */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#fafafc] rounded-xl border border-[#e5e5e7] text-xs">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0066cc]" />
              <span className="text-[#6e6e73]">Tổng ca/ngày: <strong className="text-[#1d1d1f] font-semibold">{shiftsCount} ca</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0066cc]" />
              <span className="text-[#6e6e73]">Nhân viên sẵn sàng: <strong className="text-[#1d1d1f] font-semibold">{membersCount} người</strong></span>
            </div>
          </div>

          {/* Form Options */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Phương thức phân bổ nhân sự:
              </label>
              <select
                value={autoConfig.staffPerShift}
                onChange={(e) =>
                  setAutoConfig((prev) => ({ ...prev, staffPerShift: e.target.value }))
                }
                className="w-full px-3.5 py-2.5 text-xs font-normal text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              >
                <option value="AUTO_BY_STARS">
                  ⭐ Phân bổ theo mức độ cao điểm (sao ⭐) — Khuyên dùng
                </option>
                <option value="1">Cố định 1 nhân viên / ca (Tiêu chuẩn)</option>
                <option value="2">Cố định 2 nhân viên / ca (Quán đông)</option>
                <option value="3">Cố định 3 nhân viên / ca</option>
              </select>
            </div>

            {/* Chi tiết dự kiến phân bổ theo số sao cao điểm */}
            {autoConfig.staffPerShift === 'AUTO_BY_STARS' && shifts && shifts.length > 0 && (
              <div className="bg-[#fafafc] border border-[#e5e5e7] rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-[#1d1d1f] font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>Dự kiến phân bổ nhân sự theo ca:</span>
                  </span>
                  <span className="text-[11px] text-[#86868b] font-normal">
                    (Quán có {membersCount} nhân viên)
                  </span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {shifts.map((s) => {
                    const peak = s.peakLevel || 1;
                    const target = previewTargets[s._id] || 1;
                    return (
                      <div
                        key={s._id}
                        className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-[#e5e5e7] text-[#1d1d1f]"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.color || '#0066cc' }}
                          />
                          <span className="font-medium">{s.name}</span>
                          <span className="text-[10px] text-[#86868b] font-mono">
                            {s.startTime} - {s.endTime}
                          </span>
                          <span className="flex items-center text-amber-500 text-[11px]">
                            {'★'.repeat(peak)}{'☆'.repeat(3 - peak)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${
                              peak === 3
                                ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                                : peak === 2
                                ? 'bg-amber-50 text-amber-800 border-amber-200/60'
                                : 'bg-[#f5f5f7] text-[#6e6e73] border-[#e5e5e7]'
                            }`}
                          >
                            {peak === 3 ? 'Rất cao điểm' : peak === 2 ? 'Khá cao điểm' : 'Bình thường'}
                          </span>
                          <span className="font-semibold text-[#0066cc] text-xs">
                            → {target} nhân viên
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-[#86868b] italic pt-0.5">
                  💡 Bạn có thể bấm trực tiếp vào số sao ở cột "Khung Giờ / Ca" ngoài màn hình lịch để chỉnh mức cao điểm cho từng ca.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#1d1d1f] mb-1">
                Tối đa số ca làm / ngày của 1 nhân viên:
              </label>
              <select
                value={autoConfig.maxShiftsPerDay}
                onChange={(e) =>
                  setAutoConfig((prev) => ({ ...prev, maxShiftsPerDay: Number(e.target.value) }))
                }
                className="w-full px-3.5 py-2.5 text-xs font-normal text-[#1d1d1f] bg-white border border-[#d2d2d7] rounded-xl focus:outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 transition"
              >
                <option value={1}>Tối đa 1 ca / ngày (Khuyên dùng - Tránh quá tải)</option>
                <option value={2}>Tối đa 2 ca / ngày (Ca không trùng giờ)</option>
              </select>
            </div>

            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoConfig.preserveExisting}
                  onChange={(e) =>
                    setAutoConfig((prev) => ({ ...prev, preserveExisting: e.target.checked }))
                  }
                  className="mt-0.5 rounded border-[#d2d2d7] text-[#0066cc] focus:ring-[#0066cc]"
                />
                <div className="text-xs">
                  <span className="font-medium text-[#1d1d1f]">
                    Giữ lại các ca đã xếp thủ công hiện tại
                  </span>
                  <p className="text-[#6e6e73] text-[11px] mt-0.5">
                    Hệ thống sẽ giữ nguyên những ai đã được xếp ca và chỉ tự động chia vào các vị trí còn trống.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#f5f5f7] border-t border-[#e5e5e7] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-white rounded-full transition"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={autoGenerating || shiftsCount === 0 || membersCount === 0 || isPastWeek}
            onClick={onAutoSchedule}
            className="px-5 py-2.5 text-xs font-medium text-white bg-[#0066cc] hover:bg-[#0071e3] rounded-full shadow-xs disabled:opacity-50 flex items-center gap-2 transition active:scale-[0.98] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{autoGenerating ? 'Đang tự động tính toán & xếp ca...' : 'Bắt đầu tự động xếp ca'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoScheduleModal;
