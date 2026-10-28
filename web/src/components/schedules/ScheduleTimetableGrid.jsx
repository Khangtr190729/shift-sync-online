import React from 'react';
import { Clock, Plus, Lock, CheckCircle2, AlertTriangle, Star } from 'lucide-react';

const ScheduleTimetableGridComponent = ({
  shifts,
  daysOfWeek,
  assignments,
  members,
  getShiftId,
  getUserId,
  getAssignmentConflict,
  isShiftPassedOrCompleted,
  onOpenAssignModal,
  onUpdateShiftStars,
}) => {
  if (shifts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e5e5e7] shadow-xs p-12 text-center">
        <Clock className="w-12 h-12 text-[#86868b] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#1d1d1f] mb-1">Chưa có khung giờ ca làm nào</h3>
        <p className="text-sm text-[#6e6e73] mb-4 max-w-md mx-auto">
          Bạn cần tạo các khung giờ (ví dụ: Ca Sáng 08:00 - 12:00) trước khi xếp lịch làm việc cho nhân viên.
        </p>
        <a
          href="/shifts"
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#0066cc] hover:bg-[#0071e3] text-white text-xs font-medium rounded-full shadow-xs transition active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          Tạo ca làm ngay
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e5e5e7] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[960px]">
          {/* Header row: Days of the week */}
          <thead>
            <tr className="bg-[#f5f5f7] border-b border-[#e5e5e7] text-[#1d1d1f]">
              <th className="w-48 p-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#6e6e73] border-r border-[#e5e5e7]">
                Khung Giờ / Ca
              </th>
              {daysOfWeek.map((day) => (
                <th
                  key={day.dateStr}
                  className={`p-3 text-center border-r border-[#e5e5e7] last:border-r-0 ${
                    day.isToday ? 'bg-blue-50/70 font-semibold text-[#0066cc]' : day.isPast ? 'bg-[#fafafc]' : ''
                  }`}
                >
                  <div className={`text-xs uppercase font-semibold tracking-tight ${day.isPast && !day.isToday ? 'text-[#86868b]' : 'text-[#1d1d1f]'}`}>
                    {day.dayName}
                  </div>
                  <div className={`text-xs font-mono mt-0.5 font-normal ${day.isPast && !day.isToday ? 'text-[#86868b]' : 'text-[#6e6e73]'}`}>
                    {day.displayDate}
                  </div>
                  {day.isToday ? (
                    <span className="inline-block px-2 py-0.5 text-[10px] bg-[#0066cc] text-white rounded-full mt-0.5 font-medium">
                      Hôm nay
                    </span>
                  ) : day.isPast ? (
                    <span className="inline-block px-2 py-0.5 text-[10px] bg-[#e5e5e7] text-[#6e6e73] rounded-full mt-0.5 font-medium">
                      Đã qua
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body: Shift Slots (Rows) */}
          <tbody className="divide-y divide-slate-100">
            {shifts.map((shift) => (
              <tr key={shift._id} className="hover:bg-slate-50/50 transition">
                {/* Shift Label Header Cell */}
                <td className="p-3.5 bg-slate-50/80 border-r border-slate-200 text-left align-top">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: shift.color || '#0066cc' }}
                    />
                    <span className="font-bold text-sm text-slate-800">{shift.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{shift.startTime} — {shift.endTime}</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {shift.durationHours || 4} tiếng / ca
                  </div>

                  {/* Đánh dấu mức độ cao điểm (1 - 3 sao) - Tối giản */}
                  <div className="mt-2 pt-1.5 flex items-center gap-1.5">
                    <div className="flex items-center">
                      {[1, 2, 3].map((starVal) => {
                        const currentStars = shift.peakLevel || 1;
                        const isFilled = starVal <= currentStars;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUpdateShiftStars) {
                                onUpdateShiftStars(shift._id, starVal);
                              }
                            }}
                            className="p-0.5 hover:scale-110 transition cursor-pointer"
                            title={`${starVal} sao - ${
                              starVal === 1
                                ? 'Bình thường'
                                : starVal === 2
                                ? 'Khá cao điểm'
                                : 'Rất cao điểm'
                            }`}
                          >
                            <Star
                              className={`w-4 h-4 ${
                                isFilled
                                  ? 'fill-amber-400 stroke-amber-500'
                                  : 'fill-slate-100 stroke-slate-300 hover:stroke-amber-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 select-none">
                      {(shift.peakLevel || 1) === 3
                        ? 'Rất cao điểm'
                        : (shift.peakLevel || 1) === 2
                        ? 'Khá cao điểm'
                        : 'Bình thường'}
                    </span>
                  </div>
                </td>

                {/* 7 Daily cells for this shift */}
                {daysOfWeek.map((day) => {
                  const currentShiftId = getShiftId(shift._id);
                  const cellAssignments = assignments.filter(
                    (a) => a.date === day.dateStr && getShiftId(a.shiftId) === currentShiftId
                  );
                  const hasAnyConflict = cellAssignments.some((a) => !!getAssignmentConflict(a));
                  const isPassed = isShiftPassedOrCompleted(day.dateStr, shift);

                  return (
                    <td
                      key={day.dateStr}
                      className="p-1.5 border-r border-[#e5e5e7] last:border-r-0 align-top min-h-24 hover:bg-blue-50/10 transition"
                    >
                      {cellAssignments.length === 0 ? (
                        isPassed ? (
                          <div
                            title="Ca làm việc này đã kết thúc trong quá khứ"
                            className="w-full h-full min-h-[84px] border border-dashed border-[#e5e5e7] bg-[#fafafc] rounded-xl flex flex-col items-center justify-center text-[#86868b] select-none cursor-not-allowed p-2"
                          >
                            <Clock className="w-4 h-4 text-[#86868b]" />
                            <span className="text-[10px] font-medium text-[#86868b] mt-1">Đã kết thúc</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenAssignModal(day.dateStr, shift._id)}
                            className="w-full h-full min-h-[84px] border border-dashed border-[#d2d2d7] hover:border-[#0066cc] hover:bg-blue-50/20 rounded-xl flex flex-col items-center justify-center text-[#86868b] hover:text-[#0066cc] transition group p-2"
                          >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-medium mt-1">+ Phân ca</span>
                          </button>
                        )
                      ) : (
                        <div
                          onClick={() => onOpenAssignModal(day.dateStr, shift._id)}
                          className={`group relative w-full h-full min-h-[84px] rounded-xl p-2 flex flex-col justify-between cursor-pointer transition shadow-xs ${
                            hasAnyConflict
                              ? 'bg-rose-50/90 hover:bg-rose-100/90 border border-rose-300 ring-1 ring-rose-400/30'
                              : isPassed
                              ? 'bg-[#fafafc] hover:bg-[#f5f5f7] border border-[#e5e5e7] text-[#6e6e73]'
                              : 'bg-white hover:bg-blue-50/20 border border-[#e5e5e7] hover:border-[#0066cc]/40'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span
                                className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${
                                  hasAnyConflict ? 'text-rose-700' : isPassed ? 'text-[#86868b]' : 'text-[#0066cc]'
                                }`}
                              >
                                {isPassed && <Lock className="w-3 h-3 text-[#86868b] shrink-0" />}
                                <span>{cellAssignments.length} nhân viên</span>
                              </span>
                              <span
                                className={`px-2 py-0.2 rounded-full text-[10px] font-medium text-white ${
                                  hasAnyConflict ? 'bg-rose-600' : isPassed ? 'bg-[#86868b]' : 'bg-[#0066cc]'
                                }`}
                              >
                                {cellAssignments.length}
                              </span>
                            </div>

                              <div className="space-y-1">
                              {cellAssignments.map((a, idx) => {
                                const aUserId = getUserId(a.userId);
                                const member = members.find(
                                  (m) => getUserId(m.userId?._id || m.userId || m.user?._id) === aUserId
                                );
                                const displayName =
                                  member?.fullName ||
                                  member?.name ||
                                  member?.user?.fullName ||
                                  member?.user?.name ||
                                  (typeof a.userId === 'object' && (a.userId?.fullName || a.userId?.name)) ||
                                  a.userObj?.fullName ||
                                  a.userObj?.name ||
                                  'Nhân viên';
                                const conflictShift = getAssignmentConflict(a);
                                const isMissed = a.attendanceStatus === 'MISSED';
                                const isPartial = a.attendanceStatus === 'PARTIAL';

                                return (
                                  <div
                                    key={`${a.userId}_${idx}`}
                                    className={`flex items-center justify-between gap-1 px-1.5 py-1 rounded-lg border text-xs transition ${
                                      isMissed
                                        ? 'bg-rose-50/80 border-rose-200 text-rose-800'
                                        : isPartial
                                        ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                                        : conflictShift
                                        ? 'bg-red-100/80 border-red-300 text-red-900 font-bold'
                                        : isPassed
                                        ? 'bg-white border-[#e5e5e7] text-[#6e6e73]'
                                        : 'bg-[#fafafc] border-[#e5e5e7] text-[#1d1d1f] hover:border-blue-200'
                                    }`}
                                    title={
                                      isMissed
                                        ? `Vắng mặt / Không hoàn thành (Trừ cả ca)${a.missedReason ? ': ' + a.missedReason : ''}`
                                        : isPartial
                                        ? `Chưa hoàn thành tốt: Trừ -${a.deductedPay ? a.deductedPay.toLocaleString('vi-VN') + 'đ' : ''} (${a.deductedHours ? a.deductedHours + 'h' : ''})${a.missedReason ? ' — ' + a.missedReason : ''}`
                                        : undefined
                                    }
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <div
                                        className={`w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0 ${
                                          isMissed
                                            ? 'bg-rose-500'
                                            : isPartial
                                            ? 'bg-amber-500'
                                            : conflictShift
                                            ? 'bg-red-600'
                                            : isPassed
                                            ? 'bg-[#86868b]'
                                            : 'bg-[#0066cc]'
                                        }`}
                                      >
                                        {displayName ? displayName.charAt(0).toUpperCase() : 'N'}
                                      </div>
                                      <span
                                        className={`truncate font-semibold text-[11px] leading-tight ${
                                          isMissed
                                            ? 'line-through text-slate-400'
                                            : isPartial
                                            ? 'text-amber-950 font-bold'
                                            : ''
                                        }`}
                                      >
                                        {displayName}
                                      </span>
                                    </div>

                                    {isMissed && (
                                      <span className="shrink-0 px-1 py-0.2 rounded bg-rose-200/80 text-rose-800 text-[9px] font-bold">
                                        Vắng
                                      </span>
                                    )}

                                    {isPartial && (
                                      <span
                                        className="shrink-0 px-1 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-extrabold"
                                        title={`Trừ -${a.deductedPay ? a.deductedPay.toLocaleString('vi-VN') + 'đ' : ''}`}
                                      >
                                        {a.deductedHours ? `-${a.deductedHours}h` : 'Trừ lương'}
                                      </span>
                                    )}

                                    {conflictShift && (
                                      <span
                                        title={`Trùng giờ với ca "${conflictShift.name}" (${conflictShift.startTime}-${conflictShift.endTime})`}
                                        className="shrink-0"
                                      >
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="mt-2 pt-1 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{shift.startTime} - {shift.endTime}</span>
                            </span>
                            {isPassed ? (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] flex items-center gap-0.5 border border-emerald-200">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                Đã xong
                              </span>
                            ) : (
                              <span className="text-[#0066cc] font-medium group-hover:underline">
                                + Thêm
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ScheduleTimetableGrid = React.memo(ScheduleTimetableGridComponent);
export default ScheduleTimetableGrid;
