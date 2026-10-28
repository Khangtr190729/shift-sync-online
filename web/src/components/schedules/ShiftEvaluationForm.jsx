import React, { useState, useMemo } from 'react';
import { Send, Clock3, DollarSign, AlertCircle } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

/**
 * Component xử lý Form Đánh giá ca làm việc (PARTIAL hoặc MISSED)
 * - PARTIAL: Chọn trừ theo số tiếng (0.5h, 1h...) hoặc theo số tiền (bước nhảy 10k, 20k... đến giới hạn trần lương ca)
 * - Tự do nhập lý do vi phạm, không gắn cứng
 * - Xem trước tính toán lương thực nhận
 */
const ShiftEvaluationFormComponent = ({
  assignment,
  memberWage = 20000,
  shiftHours = 4,
  initialMode = 'PARTIAL',
  onSubmit,
  onCancel,
  submitting = false,
}) => {
  const fullShiftPay = Math.round(shiftHours * memberWage);

  const [mode, setMode] = useState(initialMode); // 'PARTIAL' | 'MISSED'
  const [deductMethod, setDeductMethod] = useState(
    assignment.penaltyType === 'AMOUNT' ? 'AMOUNT' : 'HOURS'
  ); // 'HOURS' | 'AMOUNT'

  // Trừ theo giờ: Mặc định 1h hoặc theo assignment đã có
  const [selectedHours, setSelectedHours] = useState(() => {
    if (assignment.deductedHours > 0) return Math.min(shiftHours, assignment.deductedHours);
    return Math.min(shiftHours, 1);
  });

  // Trừ theo tiền: Mặc định theo bước nhảy 10k hoặc theo assignment
  const [selectedAmount, setSelectedAmount] = useState(() => {
    if (assignment.deductedPay > 0) return Math.min(fullShiftPay, assignment.deductedPay);
    return Math.min(fullShiftPay, Math.round(selectedHours * memberWage) || 20000);
  });

  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [reason, setReason] = useState(assignment.missedReason || '');

  // Tạo danh sách các nấc giờ từ 0.5h đến shiftHours (bước nhảy 0.5h)
  const hourOptions = useMemo(() => {
    const options = [];
    for (let h = 0.5; h <= shiftHours; h += 0.5) {
      const roundedH = Number(h.toFixed(1));
      const pay = Math.min(fullShiftPay, Math.round(roundedH * memberWage));
      options.push({
        value: roundedH,
        label: `Trừ ${roundedH} giờ (-${formatVND(pay)})`,
        pay,
      });
    }
    return options;
  }, [shiftHours, memberWage, fullShiftPay]);

  // Tạo danh sách các mức tiền bước nhảy 10k, 20k, 30k... đến trần lương ca
  const amountOptions = useMemo(() => {
    const options = [];
    const step = 10000;
    for (let amt = step; amt < fullShiftPay; amt += step) {
      options.push({
        value: amt,
        label: `Trừ ${formatVND(amt)} (còn nhận ${formatVND(fullShiftPay - amt)})`,
      });
    }
    // Nấc trần cả ca
    options.push({
      value: fullShiftPay,
      label: `Trừ tối đa cả ca: -${formatVND(fullShiftPay)} (thực nhận 0đ)`,
    });
    return options;
  }, [fullShiftPay]);

  // Tính toán lương thực tế trước khi gửi
  const previewDeductedPay = useMemo(() => {
    if (mode === 'MISSED') return fullShiftPay;
    if (deductMethod === 'AMOUNT') {
      return Math.min(fullShiftPay, Math.max(0, Number(selectedAmount) || 0));
    }
    return Math.min(fullShiftPay, Math.round(selectedHours * memberWage));
  }, [mode, deductMethod, selectedAmount, selectedHours, memberWage, fullShiftPay]);

  const previewDeductedHours = useMemo(() => {
    if (mode === 'MISSED') return shiftHours;
    if (deductMethod === 'HOURS') return selectedHours;
    return memberWage > 0 ? Number((previewDeductedPay / memberWage).toFixed(1)) : 0;
  }, [mode, deductMethod, selectedHours, previewDeductedPay, memberWage, shiftHours]);

  const previewRemainingPay = Math.max(0, fullShiftPay - previewDeductedPay);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'MISSED') {
      onSubmit({
        attendanceStatus: 'MISSED',
        penaltyType: 'NONE',
        deductedHours: shiftHours,
        deductedPay: fullShiftPay,
        missedReason: reason.trim() || 'Không hoàn thành ca làm',
      });
    } else {
      onSubmit({
        attendanceStatus: 'PARTIAL',
        penaltyType: deductMethod,
        deductedHours: previewDeductedHours,
        deductedPay: previewDeductedPay,
        missedReason: reason.trim() || 'Chưa hoàn thành tốt ca làm',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mt-2 p-3.5 bg-white border rounded-xl shadow-xs space-y-3 animate-fade-in ${
        mode === 'PARTIAL' ? 'border-amber-300' : 'border-rose-300'
      }`}
    >
      {/* Mode Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode('PARTIAL')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              mode === 'PARTIAL'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Chưa hoàn thành tốt (Trừ 1 phần)
          </button>
          <button
            type="button"
            onClick={() => setMode('MISSED')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              mode === 'MISSED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Không hoàn thành (Trừ cả ca)
          </button>
        </div>
        <span className="text-[10px] text-slate-400">Tự động gửi email thông báo</span>
      </div>

      {mode === 'PARTIAL' ? (
        <div className="space-y-3">
          {/* Lựa chọn hình thức: Theo số tiếng vs Theo số tiền */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">Hình thức khấu trừ:</span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
              <button
                type="button"
                onClick={() => setDeductMethod('HOURS')}
                className={`flex items-center gap-1 px-2.5 py-0.5 font-bold rounded-md transition ${
                  deductMethod === 'HOURS'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock3 className="w-3 h-3 text-amber-600" />
                <span>Theo số tiếng</span>
              </button>
              <button
                type="button"
                onClick={() => setDeductMethod('AMOUNT')}
                className={`flex items-center gap-1 px-2.5 py-0.5 font-bold rounded-md transition ${
                  deductMethod === 'AMOUNT'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <DollarSign className="w-3 h-3 text-amber-600" />
                <span>Theo số tiền (VNĐ)</span>
              </button>
            </div>
          </div>

          {/* DEDUCT BY HOURS (SELECT) */}
          {deductMethod === 'HOURS' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                Chọn số tiếng muốn trừ (tối đa {shiftHours} giờ của ca):
              </label>
              <select
                value={selectedHours}
                onChange={(e) => setSelectedHours(Number(e.target.value))}
                className="w-full p-2 text-xs font-semibold text-slate-800 bg-amber-50/40 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {hourOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* DEDUCT BY AMOUNT (SELECT 10k, 20k... ĐẾN TRẦN CA) */}
          {deductMethod === 'AMOUNT' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">
                  Chọn mức tiền muốn trừ (bước nhảy 10.000đ):
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomAmount(!isCustomAmount)}
                  className="text-[10px] text-amber-700 hover:underline font-bold"
                >
                  {isCustomAmount ? '← Chọn từ danh sách' : 'Tự nhập số lẻ →'}
                </button>
              </div>

              {isCustomAmount ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1000"
                    min="1000"
                    max={fullShiftPay}
                    value={selectedAmount}
                    onChange={(e) =>
                      setSelectedAmount(Math.min(fullShiftPay, Math.max(0, Number(e.target.value))))
                    }
                    placeholder="Nhập số tiền..."
                    className="flex-1 p-2 text-xs font-mono font-bold border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="text-xs font-bold text-slate-500">VNĐ</span>
                </div>
              ) : (
                <select
                  value={selectedAmount}
                  onChange={(e) => setSelectedAmount(Number(e.target.value))}
                  className="w-full p-2 text-xs font-semibold text-slate-800 bg-amber-50/40 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {amountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Real-time Calculation Summary Box */}
          <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-600">
              <span>Lương cả ca ({shiftHours}h × {formatVND(memberWage)}):</span>
              <span className="font-mono font-bold text-slate-800">{formatVND(fullShiftPay)}</span>
            </div>
            <div className="flex items-center justify-between text-amber-900 font-semibold">
              <span>Khấu trừ do vi phạm:</span>
              <span className="font-mono font-bold text-rose-600">
                -{formatVND(previewDeductedPay)} ({previewDeductedHours > 0 ? `-${previewDeductedHours}h` : ''})
              </span>
            </div>
            <div className="flex items-center justify-between text-emerald-900 font-bold pt-1 border-t border-amber-200">
              <span>Lương ca thực nhận:</span>
              <span className="font-mono text-xs text-emerald-700 font-extrabold">
                {formatVND(previewRemainingPay)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
          Nhân viên sẽ bị đánh dấu <strong>Không hoàn thành ca làm</strong> và khấu trừ toàn bộ{' '}
          <strong>100% tiền lương ca ({formatVND(fullShiftPay)})</strong>.
        </div>
      )}

      {/* Free-form Reason Input (Tự do nhập lý do, không gắn cứng) */}
      <div>
        <label className="block text-[11px] font-bold text-slate-700 mb-1">
          Lý do cụ thể <span className="text-slate-400 font-normal">(tự nhập, gửi trực tiếp vào email nhân viên)</span>:
        </label>
        <textarea
          rows={2}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            mode === 'PARTIAL'
              ? 'Nhập lý do đi trễ, xin về sớm hoặc vi phạm (ví dụ: Đi trễ 20 phút do mưa lớn, xin về sớm 1 tiếng vì việc gia đình...)'
              : 'Nhập lý do không hoàn thành ca (ví dụ: Vắng mặt không phép, tự ý bỏ ca giữa chừng...)'
          }
          className={`w-full p-2 text-xs border rounded-lg focus:outline-none focus:ring-2 resize-none ${
            mode === 'PARTIAL'
              ? 'border-amber-300 focus:ring-amber-400'
              : 'border-rose-300 focus:ring-rose-400'
          }`}
          autoFocus
        />
      </div>

      {/* Form Action Buttons */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition btn-press cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 text-white text-xs font-bold rounded-lg transition shadow-xs btn-press disabled:opacity-50 cursor-pointer ${
            mode === 'PARTIAL'
              ? 'bg-amber-600 hover:bg-amber-700'
              : 'bg-rose-600 hover:bg-rose-700'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>
            {submitting
              ? 'Đang xử lý...'
              : mode === 'PARTIAL'
              ? 'Xác nhận & Khấu trừ lương'
              : 'Xác nhận & Trừ cả ca'}
          </span>
        </button>
      </div>
    </form>
  );
};

export const ShiftEvaluationForm = React.memo(ShiftEvaluationFormComponent);
export default ShiftEvaluationForm;
