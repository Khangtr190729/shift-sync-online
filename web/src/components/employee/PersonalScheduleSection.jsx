import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Users,
} from 'lucide-react';
import { formatWeekRange, formatVND, getMondayOfWeek, addWeeks } from '../../utils/formatters';

export const PersonalScheduleSection = ({
  store,
  user,
  currentMonday,
  setCurrentMonday,
  daysOfWeek,
  selectedDate,
  setSelectedDate,
  scheduleData,
  nextUpcomingShift,
  shiftsForSelectedDate,
  setActiveShiftDetail,
}) => {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Store Greeting & Week navigation */}
      <div className="bg-white p-4 rounded-2xl border border-[#e5e5e7] shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#0066cc]">
              {store.name}
            </p>
            <h2 className="text-base font-semibold text-[#1d1d1f] tracking-tight flex items-center gap-1.5">
              <span>Xin chào, {user?.name?.split(' ').pop() || 'bạn'}!</span>
              <Sparkles className="w-4 h-4 text-[#0066cc]" />
            </h2>
          </div>

          {/* Week nav arrows */}
          <div className="flex items-center gap-1 bg-[#f5f5f7] border border-[#e5e5e7] p-1 rounded-full">
            <button
              type="button"
              onClick={() => setCurrentMonday((prev) => addWeeks(prev, -1))}
              className="p-1 hover:bg-white rounded-full text-[#6e6e73] transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonday(getMondayOfWeek())}
              className="px-2.5 py-0.5 text-[11px] font-medium text-[#1d1d1f] hover:bg-white rounded-full cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonday((prev) => addWeeks(prev, 1))}
              className="p-1 hover:bg-white rounded-full text-[#6e6e73] transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-[#86868b] font-mono mt-1">
          Tuần: {formatWeekRange(currentMonday)}
        </p>

        {/* Horizontal 7-Day Date Strip */}
        <div className="grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-[#e5e5e7]">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            const hasShift = scheduleData?.shifts?.some((s) => s.date === day.dateStr);

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all duration-150 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0066cc] text-white shadow-xs'
                    : 'bg-[#fafafc] text-[#1d1d1f] hover:bg-[#f5f5f7] border border-[#e5e5e7]'
                }`}
              >
                <span className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-[#86868b]'}`}>
                  {day.shortDayName}
                </span>
                <span className="text-xs font-semibold font-mono mt-0.5">
                  {day.displayDate.split('/')[0]}
                </span>
                {/* Dot indicator if has shift */}
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    hasShift
                      ? isSelected
                        ? 'bg-white'
                        : 'bg-[#0066cc]'
                      : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Apple Dark Tile Wage Summary Card */}
      <div className="relative overflow-hidden bg-[#1d1d1f] text-white p-5 rounded-2xl shadow-xs hover-lift cursor-default transition-all duration-300 border border-black/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#cccccc] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2997ff]" />
            Bảng lương ước tính tuần này
          </span>
          <span className="text-[10px] bg-blue-500/20 text-[#2997ff] border border-blue-400/30 px-2.5 py-0.5 rounded-full font-mono font-medium">
            {formatVND(scheduleData?.stats?.hourlyWage || 0)}/h
          </span>
        </div>

        <div className="text-2xl font-semibold tracking-tight font-mono text-white mb-3">
          {formatVND(scheduleData?.stats?.estimatedWage || 0)}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-[11px] text-[#86868b] block font-normal">Số ca đã nhận:</span>
            <span className="font-semibold text-white font-mono">
              {scheduleData?.stats?.totalShifts || 0} ca
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#86868b] block font-normal">Tổng số giờ làm:</span>
            <span className="font-semibold text-white font-mono">
              {scheduleData?.stats?.totalHours || 0} giờ
            </span>
          </div>
        </div>
      </div>

      {/* Hero / Next Upcoming Shift Card */}
      {nextUpcomingShift && (
        <div className="bg-white border border-[#e5e5e7] p-4 rounded-2xl shadow-xs hover-lift transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-medium uppercase tracking-wider bg-blue-50 text-[#0066cc] border border-blue-200/60 px-2.5 py-0.5 rounded-full">
              Ca làm tiếp theo
            </span>
            <span className="text-xs font-mono font-medium text-[#6e6e73]">
              {nextUpcomingShift.date}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-[#1d1d1f]">
                {nextUpcomingShift.shift?.name || nextUpcomingShift.shiftName || 'Ca làm việc'}
              </h4>
              <p className="text-xs text-[#6e6e73] font-mono flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-[#0066cc]" />
                <span>
                  {(nextUpcomingShift.shift?.startTime || nextUpcomingShift.startTime) && (nextUpcomingShift.shift?.endTime || nextUpcomingShift.endTime)
                    ? `${nextUpcomingShift.shift?.startTime || nextUpcomingShift.startTime} — ${nextUpcomingShift.shift?.endTime || nextUpcomingShift.endTime} (${nextUpcomingShift.shift?.durationHours || nextUpcomingShift.hours}h)`
                    : '-'}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveShiftDetail(nextUpcomingShift)}
              className="px-4 py-1.5 bg-white text-[#0066cc] border border-[#e5e5e7] hover:border-blue-200 rounded-full text-xs font-medium shadow-xs transition active:scale-[0.98] cursor-pointer"
            >
              Chi tiết
            </button>
          </div>
        </div>
      )}

      {/* Shifts For Selected Day Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#6e6e73] px-1">
          Lịch ngày {daysOfWeek.find((d) => d.dateStr === selectedDate)?.fullDisplay || selectedDate}
        </h3>

        {shiftsForSelectedDate.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-[#e5e5e7] text-center shadow-xs">
            <Clock className="w-8 h-8 text-[#86868b] mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-[#1d1d1f]">Không có ca làm trong ngày này</p>
            <p className="text-[11px] text-[#86868b] mt-0.5">
              Bạn có thể chọn ngày khác trên thanh thứ hoặc nghỉ ngơi nạp năng lượng!
            </p>
          </div>
        ) : (
          shiftsForSelectedDate.map((item, idx) => {
            const isMissed = item.attendanceStatus === 'MISSED';
            const isPartial = item.attendanceStatus === 'PARTIAL';

            return (
              <div
                key={idx}
                onClick={() => setActiveShiftDetail(item)}
                className={`p-4 rounded-2xl border shadow-xs hover:border-[#0066cc]/40 transition cursor-pointer flex items-center justify-between ${
                  isMissed
                    ? 'bg-rose-50/50 border-rose-200/60'
                    : isPartial
                    ? 'bg-amber-50/50 border-amber-200/60'
                    : 'bg-white border-[#e5e5e7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-medium text-xs shrink-0 ${
                      isMissed
                        ? 'bg-rose-100 text-rose-600'
                        : isPartial
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-50 text-[#0066cc]'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-xs font-semibold ${
                          isMissed
                            ? 'line-through text-[#86868b]'
                            : 'text-[#1d1d1f]'
                        }`}
                      >
                        {item.shift?.name || item.shiftName}
                      </h4>
                      {isMissed && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-200/60">
                          Không hoàn thành
                        </span>
                      )}
                      {isPartial && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200/60">
                          Trừ -{formatVND(item.deductedPay || 0)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#6e6e73] font-mono mt-0.5">
                      {item.shift?.startTime || item.startTime} — {item.shift?.endTime || item.endTime} ({item.shift?.durationHours || item.hours}h)
                      {isPartial && (
                        <span className="text-emerald-700 font-medium ml-1.5">
                          • Nhận: {formatVND(item.totalPay !== undefined ? item.totalPay : 0)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Coworkers badge */}
                <div className="flex items-center gap-1 text-[11px] font-medium text-[#6e6e73] bg-[#fafafc] px-2.5 py-1 rounded-full border border-[#e5e5e7]">
                  <Users className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>{item.coworkers?.length || 0} đồng nghiệp</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

