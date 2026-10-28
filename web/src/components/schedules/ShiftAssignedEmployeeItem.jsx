import React from 'react';
import {
  Clock3,
  XCircle,
  RotateCcw,
  Edit2,
  Trash2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import { ShiftEvaluationForm } from './ShiftEvaluationForm';

/**
 * Component hiển thị 1 Nhân viên trong ca làm việc:
 * - Thông tin nhân viên, lương, trạng thái (COMPLETED, PARTIAL, MISSED)
 * - Nút Đánh giá ca (Chưa tốt - Trừ 1 phần, Không hoàn thành, Khôi phục, Sửa mức trừ)
 * - Nhúng ShiftEvaluationForm khi đang đánh giá
 */
const ShiftAssignedEmployeeItemComponent = ({
  assignment,
  member,
  targetShift,
  conflictShift,
  isShiftPassed,
  isShiftStarted,
  isEvaluating,
  evaluatingMode,
  onStartEvaluatePartial,
  onStartEvaluateMissed,
  onCancelEvaluate,
  onSubmitEvaluation,
  onRestoreCompleted,
  onRemoveAssignment,
  submittingEvaluation = false,
  saving = false,
}) => {
  const name =
    member?.fullName ||
    member?.name ||
    member?.user?.fullName ||
    member?.user?.name ||
    (typeof assignment.userId === 'object' && (assignment.userId?.fullName || assignment.userId?.name)) ||
    assignment.userObj?.fullName ||
    assignment.userObj?.name ||
    'Nhân viên';
  const wage = assignment.hourlyWage || member?.hourlyWage || 20000;
  const shiftHours = assignment.hours || targetShift?.durationHours || 4;
  const fullShiftPay = Math.round(shiftHours * wage);

  const isMissed = assignment.attendanceStatus === 'MISSED';
  const isPartial = assignment.attendanceStatus === 'PARTIAL';

  return (
    <div
      className={`p-3 rounded-xl border transition flex flex-col gap-2 ${isMissed
          ? 'bg-rose-50/70 border-rose-300'
          : isPartial
            ? 'bg-amber-50/70 border-amber-300'
            : conflictShift
              ? 'bg-red-50 border-red-300'
              : 'bg-slate-50 border-slate-200/80'
        }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${isMissed
                ? 'bg-rose-500'
                : isPartial
                  ? 'bg-amber-500'
                  : conflictShift
                    ? 'bg-red-500'
                    : isShiftPassed
                      ? 'bg-slate-500'
                      : 'bg-[#0066cc]'
              }`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p
                className={`text-xs font-bold truncate ${isMissed
                    ? 'line-through text-slate-500'
                    : isPartial
                      ? 'text-amber-950'
                      : 'text-slate-800'
                  }`}
              >
                {name}
              </p>
              {isMissed && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                  Không hoàn thành (Trừ cả ca)
                </span>
              )}
              {isPartial && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                  Chưa hoàn thành tốt (Trừ -{formatVND(assignment.deductedPay || 0)})
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              {formatVND(wage)}/h • Ca {shiftHours}h ({formatVND(fullShiftPay)})
              {isPartial && (
                <span className="text-emerald-700 font-bold ml-1.5">
                  → Thực nhận:{' '}
                  {formatVND(
                    assignment.totalPay !== undefined
                      ? assignment.totalPay
                      : fullShiftPay - (assignment.deductedPay || 0)
                  )}
                </span>
              )}
            </p>
            {conflictShift && (
              <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                Trùng giờ với ca "{conflictShift.name}" ({conflictShift.startTime} -{' '}
                {conflictShift.endTime})
              </p>
            )}
          </div>
        </div>

        {/* Nút thao tác bên phải */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nút đánh giá ca: Khi ca đã bắt đầu hoặc đã qua */}
          {isShiftStarted && !isEvaluating && (
            <>
              {isMissed || isPartial ? (
                <div className="flex items-center gap-1">
                  {isPartial && (
                    <button
                      type="button"
                      disabled={submittingEvaluation || saving}
                      onClick={onStartEvaluatePartial}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition disabled:opacity-50"
                      title="Điều chỉnh lại mức phạt hoặc lý do"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Sửa mức trừ</span>
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={submittingEvaluation || saving}
                    onClick={onRestoreCompleted}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition disabled:opacity-50"
                    title="Khôi phục trạng thái ca thành Hoàn thành và tính đủ 100% lương"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Khôi phục ca</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  {/* Nút 1: Chưa hoàn thành tốt (Trừ 1 phần) */}
                  <button
                    type="button"
                    disabled={submittingEvaluation || saving}
                    onClick={onStartEvaluatePartial}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 border border-amber-300 rounded-lg transition disabled:opacity-50 shadow-2xs"
                    title="Ghi nhận nhân viên đi trễ, về sớm hoặc vi phạm nhẹ (trừ một phần lương)"
                  >
                    <Clock3 className="w-3 h-3 text-amber-700" />
                    <span>Chưa tốt</span>
                  </button>

                  {/* Nút 2: Không hoàn thành (Trừ cả ca) */}
                  <button
                    type="button"
                    disabled={submittingEvaluation || saving}
                    onClick={onStartEvaluateMissed}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition disabled:opacity-50 shadow-2xs"
                    title="Đánh dấu nhân viên không đến làm hoặc bỏ ca (trừ 100% lương ca)"
                  >
                    <XCircle className="w-3 h-3 text-rose-600" />
                    <span>Không hoàn thành</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* Xóa khỏi ca: Chỉ khi ca chưa qua */}
          {!isShiftPassed && !isEvaluating && (
            <button
              type="button"
              onClick={onRemoveAssignment}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
              title="Xóa khỏi ca"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Hiển thị lý do và thông tin người đánh giá */}
      {(isMissed || isPartial) && !isEvaluating && (
        <div
          className={`mt-1 px-2.5 py-1.5 rounded-lg border text-[11px] flex items-start gap-1.5 ${isMissed
              ? 'bg-rose-100/60 border-rose-200 text-rose-900'
              : 'bg-amber-100/60 border-amber-300 text-amber-950'
            }`}
        >
          <AlertCircle
            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isMissed ? 'text-rose-600' : 'text-amber-700'
              }`}
          />
          <div className="space-y-0.5 w-full">
            {isPartial && (
              <div className="font-semibold text-amber-900 flex items-center justify-between">
                <span>
                  Khấu trừ: -{formatVND(assignment.deductedPay || 0)} (
                  {assignment.deductedHours ? `-${assignment.deductedHours} giờ` : 'Tiền phạt'})
                </span>
                <span className="text-emerald-700 font-bold">
                  Lương ca:{' '}
                  {formatVND(
                    assignment.totalPay !== undefined
                      ? assignment.totalPay
                      : fullShiftPay - (assignment.deductedPay || 0)
                  )}
                </span>
              </div>
            )}
            {assignment.missedReason && (
              <div>
                <span className="font-semibold">Lý do:</span> {assignment.missedReason}
              </div>
            )}
            {assignment.evaluatedBy && (
              <div
                className={`text-[10px] font-medium ${isMissed ? 'text-rose-700' : 'text-amber-800'
                  }`}
              >
                Đánh giá bởi:{' '}
                <strong>
                  {typeof assignment.evaluatedBy === 'object'
                    ? assignment.evaluatedBy.fullName || assignment.evaluatedBy.name
                    : 'Quản lý'}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nhúng Sub-component Form Đánh giá khi đang đánh giá nhân viên này */}
      {isEvaluating && (
        <ShiftEvaluationForm
          assignment={assignment}
          memberWage={wage}
          shiftHours={shiftHours}
          initialMode={evaluatingMode}
          onSubmit={onSubmitEvaluation}
          onCancel={onCancelEvaluate}
          submitting={submittingEvaluation}
        />
      )}
    </div>
  );
};

export const ShiftAssignedEmployeeItem = React.memo(ShiftAssignedEmployeeItemComponent);
export default ShiftAssignedEmployeeItem;
