import React from 'react';
import { DollarSign, AlertCircle } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

const PayrollSummaryCardComponent = ({ payrollSummary }) => {
  const hasMissedShifts = (payrollSummary.storeTotalMissedShifts || 0) > 0;
  const hasPartialShifts = (payrollSummary.storeTotalPartialShifts || 0) > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e7] p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e5e5e7]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#f5f5f7] text-[#0066cc] flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1d1d1f]">Dự toán bảng lương theo ca (Tuần này)</h3>
            <p className="text-xs text-[#6e6e73]">
              Tính toán dựa trên ca làm việc thực tế (đã khấu trừ ca vắng mặt và ca vi phạm/đi trễ/về sớm)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div>
            <span className="text-xs text-[#86868b] block">Tổng ca phân công:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-[#1d1d1f] font-mono">{payrollSummary.storeTotalShifts} ca</span>
              {hasMissedShifts && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-200/60">
                  Trừ {payrollSummary.storeTotalMissedShifts} ca vắng
                </span>
              )}
              {hasPartialShifts && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200/60">
                  {payrollSummary.storeTotalPartialShifts} ca trừ 1 phần
                </span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-[#86868b] block">Tổng giờ tính lương:</span>
            <span className="font-semibold text-[#1d1d1f] font-mono">{payrollSummary.storeTotalHours} giờ</span>
          </div>
          <div className="bg-blue-50/70 px-3.5 py-1.5 rounded-xl border border-blue-200/60">
            <span className="text-[11px] text-[#0066cc] font-medium block uppercase tracking-wider">
              Tổng thực nhận dự kiến:
            </span>
            <span className="text-base font-semibold text-[#0066cc] font-mono">
              {formatVND(payrollSummary.storeTotalPayroll)}
            </span>
          </div>
        </div>
      </div>

      {/* Employee breakdown list */}
      {payrollSummary.employees.length === 0 ? (
        <p className="text-xs text-[#86868b] italic text-center py-2">
          Chưa có nhân viên nào được phân ca trong tuần này.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {payrollSummary.employees.map((emp) => {
            const hasEmpMissed = (emp.missedShifts || 0) > 0;
            const hasEmpPartial = (emp.partialShifts || 0) > 0;

            return (
              <div
                key={emp.email || emp.name}
                className="bg-[#fafafc] border border-[#e5e5e7] rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0066cc] font-medium text-xs flex items-center justify-center shrink-0">
                    {emp.name ? emp.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-semibold text-[#1d1d1f] truncate">{emp.name}</p>
                      {hasEmpMissed && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[9px] font-medium border border-rose-200/60 shrink-0">
                          Trừ {emp.missedShifts} ca vắng
                        </span>
                      )}
                      {hasEmpPartial && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[9px] font-medium border border-amber-200/60 shrink-0">
                          {emp.partialShifts} ca vi phạm
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6e6e73] font-mono">
                      {emp.completedShifts || 0}/{emp.totalShifts} ca ({emp.totalHours}h) × {formatVND(emp.hourlyWage)}/h
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 font-semibold text-xs text-[#0066cc] font-mono">
                  {formatVND(emp.totalWage)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PayrollSummaryCard = React.memo(PayrollSummaryCardComponent);
export default PayrollSummaryCard;
