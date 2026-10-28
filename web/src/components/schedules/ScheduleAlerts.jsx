import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X, Sparkles } from 'lucide-react';

export const ScheduleAlerts = ({
  feedback,
  setFeedback,
  scheduleStatus,
  hasAssignments,
  scheduleConflicts,
}) => {
  return (
    <>
      {/* Feedback Toast Notification */}
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm font-medium animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : feedback.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : feedback.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/5 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Draft Schedule Notice Banner */}
      {scheduleStatus === 'DRAFT' && hasAssignments && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-amber-900 flex items-center justify-between text-xs font-medium animate-fade-in shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#ff9500] shrink-0" />
            <span>
              Lịch hiện tại đang ở trạng thái <strong>Bản nháp</strong>. Bạn có thể bấm vào từng ca để xem, thêm/bớt nhân viên, sau đó bấm <strong>"Xác nhận & gửi email"</strong> khi đã sẵn sàng công bố cho nhân viên.
            </span>
          </div>
          <span className="px-2.5 py-1 bg-white text-amber-800 text-[11px] font-medium rounded-full shrink-0 hidden sm:inline-block border border-amber-200/80 shadow-2xs">
            Bản nháp chờ quản lý duyệt
          </span>
        </div>
      )}

      {/* Schedule Conflicts Banner */}
      {scheduleConflicts.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-800 flex items-start gap-3 shadow-xs animate-fade-in">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-extrabold text-sm text-red-900 mb-1 flex items-center gap-1.5">
              <span>Phát hiện {scheduleConflicts.length} ca làm việc bị trùng khung giờ!</span>
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Các ca có nhân viên bị phân công trùng giờ làm đã được <b>đánh dấu viền đỏ</b> trên bảng xếp ca bên dưới.
              Một nhân viên không thể làm 2 ca trong cùng một khoảng thời gian. Vui lòng bấm vào các ô viền đỏ để đổi nhân viên hoặc hủy ca trước khi lưu / xuất bản lịch.
            </p>
            <ul className="mt-2.5 space-y-1.5 bg-white/70 p-2.5 rounded-xl border border-red-100">
              {scheduleConflicts.map((c, i) => (
                <li key={i} className="font-semibold text-red-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  <span>
                    <b>{c.employeeName}</b> ngày {c.date}: Trùng giữa <u>{c.shift1.name}</u> ({c.shift1.startTime} - {c.shift1.endTime}) và <u>{c.shift2.name}</u> ({c.shift2.startTime} - {c.shift2.endTime})
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default ScheduleAlerts;
