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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#EA701B]">
              {store.name}
            </p>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Xin chào, {user?.name?.split(' ').pop() || 'bạn'}!</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </h2>
          </div>

          {/* Week nav arrows */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setCurrentMonday((prev) => addWeeks(prev, -1))}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonday(getMondayOfWeek())}
              className="px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-white rounded-lg cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonday((prev) => addWeeks(prev, 1))}
              className="p-1 hover:bg-white rounded-lg text-slate-600 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 font-mono mt-1">
          Tuần: {formatWeekRange(currentMonday)}
        </p>

        {/* Horizontal 7-Day Date Strip */}
        <div className="grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-slate-100">
          {daysOfWeek.map((day) => {
            const isSelected = selectedDate === day.dateStr;
            const hasShift = scheduleData?.shifts?.some((s) => s.date === day.dateStr);

            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDate(day.dateStr)}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all duration-150 btn-press cursor-pointer ${
                  isSelected
                    ? 'bg-[#EA701B] text-white shadow-md shadow-orange-500/30 scale-105'
                    : 'bg-slate-50 text-slate-700 hover:bg-orange-50 hover:scale-102'
                }`}
              >
                <span className={`text-[10px] font-semibold ${isSelected ? 'text-orange-100' : 'text-slate-400'}`}>
                  {day.shortDayName}
                </span>
                <span className="text-xs font-bold font-mono mt-0.5">
                  {day.displayDate.split('/')[0]}
                </span>
                {/* Dot indicator if has shift */}
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    hasShift
                      ? isSelected
                        ? 'bg-white'
                        : 'bg-[#EA701B]'
                      : 'opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bank-Card Style Wage Summary Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-5 rounded-2xl shadow-lg shadow-slate-900/10 hover-lift cursor-default transition-all duration-300">
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-[#EA701B]/20 blur-xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#EA701B]" />
            Bảng lương ước tính tuần này
          </span>
          <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono">
            {formatVND(scheduleData?.stats?.hourlyWage || 0)}/h
          </span>
        </div>

        <div className="text-2xl font-extrabold tracking-tight font-mono text-white mb-3">
          {formatVND(scheduleData?.stats?.estimatedWage || 0)}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-700/60 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Số ca đã nhận:</span>
            <span className="font-bold text-slate-200 font-mono">
              {scheduleData?.stats?.totalShifts || 0} ca
            </span>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Tổng số giờ làm:</span>
            <span className="font-bold text-slate-200 font-mono">
              {scheduleData?.stats?.totalHours || 0} giờ
            </span>
          </div>
        </div>
      </div>

      {/* Hero / Next Upcoming Shift Card */}
      {nextUpcomingShift && (
        <div className="bg-[#FFF0E5] border border-orange-200/80 p-4 rounded-2xl shadow-xs hover-lift transition-all duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EA701B] text-white px-2 py-0.5 rounded-md">
              Ca làm tiếp theo
            </span>
            <span className="text-xs font-mono font-bold text-slate-700">
              {nextUpcomingShift.date}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">
                {nextUpcomingShift.shift?.name || nextUpcomingShift.shiftName || 'Ca làm việc'}
              </h4>
              <p className="text-xs text-slate-600 font-mono flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-[#EA701B]" />
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
              className="px-3 py-1.5 bg-white text-[#EA701B] border border-orange-200 rounded-xl text-xs font-bold shadow-xs hover:bg-orange-50 transition cursor-pointer"
            >
              Chi tiết
            </button>
          </div>
        </div>
      )}

      {/* Shifts For Selected Day Section */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          Lịch ngày {daysOfWeek.find((d) => d.dateStr === selectedDate)?.fullDisplay || selectedDate}
        </h3>

        {shiftsForSelectedDate.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">Không có ca làm trong ngày này</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
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
                className={`p-4 rounded-2xl border shadow-xs hover:border-[#EA701B] transition cursor-pointer flex items-center justify-between ${
                  isMissed
                    ? 'bg-rose-50/50 border-rose-200'
                    : isPartial
                    ? 'bg-amber-50/50 border-amber-200'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isMissed
                        ? 'bg-rose-100 text-rose-600'
                        : isPartial
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-orange-100 text-[#EA701B]'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4
                        className={`text-xs font-bold ${
                          isMissed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900'
                        }`}
                      >
                        {item.shift?.name || item.shiftName}
                      </h4>
                      {isMissed && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                          Không hoàn thành
                        </span>
                      )}
                      {isPartial && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Trừ -{formatVND(item.deductedPay || 0)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {item.shift?.startTime || item.startTime} — {item.shift?.endTime || item.endTime} ({item.shift?.durationHours || item.hours}h)
                      {isPartial && (
                        <span className="text-emerald-700 font-bold ml-1.5">
                          • Nhận: {formatVND(item.totalPay !== undefined ? item.totalPay : 0)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Coworkers badge */}
                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
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

