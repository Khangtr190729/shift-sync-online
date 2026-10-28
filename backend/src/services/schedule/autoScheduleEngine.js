import Store from '../../models/Store.js';
import StoreMember from '../../models/StoreMember.js';
import Shift from '../../models/Shift.js';
import Schedule from '../../models/Schedule.js';
import {
  extractId,
  getTodayDateString,
  isShiftTimePassed,
  checkShiftOverlap,
  getCurrentVNTime,
  timeToMinutes,
} from '../../utils/timeScheduleHelpers.js';
import { validatePassedShiftImmutability } from './scheduleValidation.js';
import { processAssignmentsAndSalary } from './payrollProcessor.js';

/**
 * Thuật toán tính toán số lượng nhân sự mục tiêu cho từng ca:
 * Dựa trên mức độ cao điểm (1-3 sao) của từng ca và quy mô nhân sự quán.
 */
export const calculateShiftStaffTargets = ({
  shifts,
  totalStaffCount,
  maxShiftsPerDay = 1,
  staffPerShift = 'AUTO_BY_STARS',
}) => {
  const targets = {};
  if (!Array.isArray(shifts) || shifts.length === 0) return targets;

  // Nếu người dùng chọn cố định số nhân viên (ví dụ: fixed 1, 2, 3)
  const numericMode = parseInt(staffPerShift, 10);
  if (!isNaN(numericMode) && numericMode > 0 && staffPerShift !== 'AUTO_BY_STARS') {
    shifts.forEach((s) => {
      targets[s._id.toString()] = numericMode;
    });
    return targets;
  }

  const shiftCount = shifts.length;
  const dailyCapacity = totalStaffCount * Math.max(1, maxShiftsPerDay);

  shifts.forEach((s) => {
    targets[s._id.toString()] = 0;
  });

  if (totalStaffCount <= 0) return targets;

  // Sắp xếp các ca theo mức độ cao điểm giảm dần (3 sao -> 2 sao -> 1 sao)
  const sortedShifts = [...shifts].sort((a, b) => (b.peakLevel || 1) - (a.peakLevel || 1));

  // Trường hợp quán quá ít nhân sự (ít hơn số ca):
  if (dailyCapacity < shiftCount) {
    for (let i = 0; i < dailyCapacity; i++) {
      targets[sortedShifts[i]._id.toString()] = 1;
    }
    return targets;
  }

  // Bước 1: Đảm bảo cơ số tối thiểu: Mỗi ca nhận 1 nhân viên
  shifts.forEach((s) => {
    targets[s._id.toString()] = 1;
  });
  let remainingCapacity = dailyCapacity - shiftCount;

  // Bước 2: Thiết lập trần nhân sự tối đa cho mỗi mức sao:
  const getCap = (peak) => {
    if (peak >= 3) return totalStaffCount >= shiftCount * 3 ? 4 : 3;
    if (peak === 2) return totalStaffCount >= shiftCount * 3 ? 3 : 2;
    return totalStaffCount >= shiftCount * 4 ? 2 : 1;
  };

  // Bước 3: Phân bổ nhân sự dôi dư theo thứ tự ưu tiên số sao:
  while (remainingCapacity > 0) {
    const eligibleShifts = sortedShifts.filter((s) => {
      const p = s.peakLevel || 1;
      const current = targets[s._id.toString()] || 0;
      return current < getCap(p);
    });

    if (eligibleShifts.length === 0) {
      break;
    }

    const highestPeakInPool = Math.max(...eligibleShifts.map((s) => s.peakLevel || 1));
    const pool = eligibleShifts.filter((s) => (s.peakLevel || 1) === highestPeakInPool);

    pool.sort((a, b) => targets[a._id.toString()] - targets[b._id.toString()]);
    const chosen = pool[0];

    targets[chosen._id.toString()] += 1;
    remainingCapacity--;
  }

  return targets;
};

/**
 * Service: Thuật toán tự động xếp ca làm việc thông minh & cân bằng tải (Fair Scheduling)
 */
export const generateAutoSchedule = async ({
  storeId,
  week,
  year,
  startDate,
  endDate,
  days,
  staffPerShift = 'AUTO_BY_STARS',
  maxShiftsPerDay = 1,
  preserveExisting = false,
  existingAssignments = [],
  userId,
}) => {
  const shifts = await Shift.find({ storeId, isActive: { $ne: false } }).sort({ startTime: 1 });
  if (!shifts || shifts.length === 0) {
    const err = new Error('Cửa hàng chưa có ca làm việc nào. Vui lòng tạo ca làm việc trước khi tự động chia ca.');
    err.statusCode = 400;
    throw err;
  }

  const store = await Store.findById(storeId);
  const activeMembers = await StoreMember.find({ storeId, status: 'ACTIVE' }).populate(
    'userId',
    'fullName email systemRole'
  );
  const validMembers = activeMembers.filter(
    (m) =>
      m.userId &&
      m.userId._id &&
      m.roleInStore !== 'ADMIN' &&
      store.ownerId.toString() !== m.userId._id.toString()
  );

  if (validMembers.length === 0) {
    const err = new Error('Cửa hàng chưa có nhân viên hoặc quản lý nào để chia ca làm việc. Vui lòng thêm nhân viên trước khi tự động chia ca.');
    err.statusCode = 400;
    throw err;
  }

  // Chuẩn bị danh sách 7 ngày trong tuần
  let weekDays = days;
  const dayNames = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  if (Array.isArray(weekDays) && weekDays.length > 0) {
    weekDays = weekDays.map((item, index) => {
      if (typeof item === 'string') {
        return { date: item, dayOfWeek: dayNames[index % 7] };
      }
      return {
        date: item.date || item.dateStr,
        dayOfWeek: item.dayOfWeek || item.dayName || dayNames[index % 7],
      };
    });
  } else {
    const baseDate = new Date(startDate);
    weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      weekDays.push({
        date: `${y}-${m}-${dayNum}`,
        dayOfWeek: dayNames[i],
      });
    }
  }

  const memberStats = {};
  validMembers.forEach((m) => {
    const uId = m.userId._id.toString();
    memberStats[uId] = {
      member: m,
      userId: m.userId._id,
      hourlyWage: m.hourlyWage || 20000,
      shiftCount: 0,
      totalHours: 0,
      shiftsByDate: {},
    };
  });

  const shiftMap = {};
  shifts.forEach((s) => {
    shiftMap[s._id.toString()] = s;
  });

  let workingAssignments = [];

  const existingSchedule = await Schedule.findOne({
    storeId,
    week: Number(week),
    year: Number(year),
  });

  const isPublishedSchedule = existingSchedule?.status === 'PUBLISHED';
  const passedKeySet = new Set();

  if (isPublishedSchedule || preserveExisting) {
    const sourceAssignments = isPublishedSchedule
      ? (existingSchedule?.assignments || [])
      : (existingAssignments || []);

    for (const item of sourceAssignments) {
      const uId = extractId(item.userId);
      const sId = extractId(item.shiftId);
      const shift = shiftMap[sId];
      const stat = memberStats[uId];
      if (shift && isShiftTimePassed(item.date, shift)) {
        const key = `${item.date}_${sId}_${uId}`;
        if (!passedKeySet.has(key)) {
          passedKeySet.add(key);
          if (stat) {
            if (!stat.shiftsByDate[item.date]) stat.shiftsByDate[item.date] = [];
            stat.shiftsByDate[item.date].push(shift);
            stat.shiftCount += 1;
            stat.totalHours += shift.durationHours || 4;
          }
          workingAssignments.push({
            date: item.date,
            dayOfWeek: item.dayOfWeek,
            shiftId: shift._id,
            userId: uId,
            hourlyWage: item.hourlyWage || (stat ? stat.hourlyWage : 20000),
          });
        }
      }
    }
  }

  // 2. Nếu chọn giữ lại các ca đã xếp thủ công
  if (preserveExisting && Array.isArray(existingAssignments) && existingAssignments.length > 0) {
    for (const item of existingAssignments) {
      const uId = extractId(item.userId);
      const sId = extractId(item.shiftId);
      const shift = shiftMap[sId];
      const stat = memberStats[uId];
      const key = `${item.date}_${sId}_${uId}`;
      if (passedKeySet.has(key)) continue;

      if (shift && stat && item.date && !isShiftTimePassed(item.date, shift)) {
        if (!stat.shiftsByDate[item.date]) stat.shiftsByDate[item.date] = [];
        stat.shiftsByDate[item.date].push(shift);
        stat.shiftCount += 1;
        stat.totalHours += shift.durationHours || 4;
        workingAssignments.push({
          date: item.date,
          dayOfWeek: item.dayOfWeek,
          shiftId: shift._id,
          userId: stat.userId,
          hourlyWage: stat.hourlyWage,
        });
      }
    }
  }

  const maxPerDay = Math.max(1, parseInt(maxShiftsPerDay, 10) || 1);
  const todayStr = getTodayDateString();
  const currentVNTime = getCurrentVNTime();
  const currentVNMins = timeToMinutes(currentVNTime);

  const shiftStaffTargets = calculateShiftStaffTargets({
    shifts,
    totalStaffCount: validMembers.length,
    maxShiftsPerDay: maxPerDay,
    staffPerShift,
  });

  const memberUserIds = validMembers.map((m) => m.userId._id);
  const otherSchedules = await Schedule.find({
    storeId: { $ne: storeId },
    week: Number(week),
    year: Number(year),
    'assignments.userId': { $in: memberUserIds },
  })
    .populate('storeId', 'name')
    .populate('assignments.shiftId', 'name startTime endTime durationHours');

  const externalShiftsByUserAndDate = {};
  for (const otherSched of otherSchedules) {
    const extStoreName = otherSched.storeId?.name || 'Chi nhánh khác';
    for (const a of otherSched.assignments || []) {
      const uId = extractId(a.userId);
      const extShift = a.shiftId;
      if (extShift && a.date) {
        const key = `${uId}_${a.date}`;
        if (!externalShiftsByUserAndDate[key]) {
          externalShiftsByUserAndDate[key] = [];
        }
        externalShiftsByUserAndDate[key].push({
          shiftId: extShift._id,
          name: extShift.name,
          startTime: extShift.startTime,
          endTime: extShift.endTime,
          durationHours: extShift.durationHours,
          storeName: extStoreName,
        });
      }
    }
  }

  // 3. Phân bổ ca
  for (const day of weekDays) {
    if (day.date < todayStr) continue;

    const prioritizedShifts = [...shifts].sort(
      (a, b) => (b.peakLevel || 1) - (a.peakLevel || 1)
    );

    for (const shift of prioritizedShifts) {
      if (isShiftTimePassed(day.date, shift)) continue;

      if (day.date === todayStr) {
        const startMins = timeToMinutes(shift.startTime);
        if (currentVNMins >= startMins) continue;
      }

      const sId = shift._id.toString();
      const currentAssigned = workingAssignments.filter(
        (a) => a.date === day.date && a.shiftId.toString() === sId
      );
      const targetForThisShift = shiftStaffTargets[sId] || 1;
      let needed = targetForThisShift - currentAssigned.length;

      while (needed > 0) {
        const eligibleCandidates = validMembers.filter((m) => {
          const uId = m.userId._id.toString();
          const stat = memberStats[uId];
          const dateShifts = stat.shiftsByDate[day.date] || [];

          if (dateShifts.some((s) => s._id.toString() === sId)) return false;
          if (dateShifts.length >= maxPerDay) return false;
          if (dateShifts.some((s) => checkShiftOverlap(shift, s))) return false;

          const extShifts = externalShiftsByUserAndDate[`${uId}_${day.date}`] || [];
          if (extShifts.some((ext) => checkShiftOverlap(shift, ext))) return false;

          return true;
        });

        let candidatePool = eligibleCandidates;
        if (candidatePool.length === 0 && maxPerDay < shifts.length) {
          candidatePool = validMembers.filter((m) => {
            const uId = m.userId._id.toString();
            const stat = memberStats[uId];
            const dateShifts = stat.shiftsByDate[day.date] || [];

            if (dateShifts.some((s) => s._id.toString() === sId)) return false;
            if (dateShifts.some((s) => checkShiftOverlap(shift, s))) return false;

            const extShifts = externalShiftsByUserAndDate[`${uId}_${day.date}`] || [];
            if (extShifts.some((ext) => checkShiftOverlap(shift, ext))) return false;

            return true;
          });
        }

        if (candidatePool.length === 0) break;

        candidatePool.sort((a, b) => {
          const statA = memberStats[a.userId._id.toString()];
          const statB = memberStats[b.userId._id.toString()];

          if (statA.shiftCount !== statB.shiftCount) {
            return statA.shiftCount - statB.shiftCount;
          }
          if (statA.totalHours !== statB.totalHours) {
            return statA.totalHours - statB.totalHours;
          }
          const todayA = (statA.shiftsByDate[day.date] || []).length;
          const todayB = (statB.shiftsByDate[day.date] || []).length;
          if (todayA !== todayB) {
            return todayA - todayB;
          }
          return Math.random() - 0.5;
        });

        const chosenMember = candidatePool[0];
        const chosenUId = chosenMember.userId._id.toString();
        const chosenStat = memberStats[chosenUId];

        workingAssignments.push({
          date: day.date,
          dayOfWeek: day.dayOfWeek,
          shiftId: shift._id,
          userId: chosenMember.userId._id,
          hourlyWage: chosenStat.hourlyWage,
        });

        if (!chosenStat.shiftsByDate[day.date]) {
          chosenStat.shiftsByDate[day.date] = [];
        }
        chosenStat.shiftsByDate[day.date].push(shift);
        chosenStat.shiftCount += 1;
        chosenStat.totalHours += shift.durationHours || 4;

        needed--;
      }
    }
  }

  // Xác thực bảo toàn ca đã qua & tính toán lại lương chi tiết
  const baselineAssignments = [...(existingSchedule?.assignments || [])];
  if (Array.isArray(existingAssignments)) {
    const baselineKeys = new Set(
      baselineAssignments.map((a) => `${a.date}_${extractId(a.shiftId)}_${extractId(a.userId)}`)
    );
    for (const ea of existingAssignments) {
      const key = `${ea.date}_${extractId(ea.shiftId)}_${extractId(ea.userId)}`;
      if (!baselineKeys.has(key)) {
        baselineAssignments.push(ea);
      }
    }
  }

  await validatePassedShiftImmutability(
    storeId,
    workingAssignments,
    baselineAssignments,
    isPublishedSchedule
  );

  const { processedAssignments, salarySummary } = await processAssignmentsAndSalary(
    storeId,
    workingAssignments
  );

  let schedule = await Schedule.findOne({
    storeId,
    week: Number(week),
    year: Number(year),
  });

  if (schedule) {
    schedule.startDate = new Date(startDate);
    schedule.endDate = new Date(endDate);
    schedule.assignments = processedAssignments;
    schedule.status = 'DRAFT';
    schedule.createdBy = userId;
  } else {
    schedule = new Schedule({
      storeId,
      week: Number(week),
      year: Number(year),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'DRAFT',
      createdBy: userId,
      assignments: processedAssignments,
    });
  }

  await schedule.save();

  await schedule.populate([
    { path: 'assignments.shiftId', select: 'name startTime endTime durationHours color' },
    { path: 'assignments.userId', select: 'fullName email systemRole' },
  ]);

  return { schedule, salarySummary };
};

