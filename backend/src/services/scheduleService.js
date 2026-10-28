import Store from '../models/Store.js';
import StoreMember from '../models/StoreMember.js';
import Shift from '../models/Shift.js';
import Schedule from '../models/Schedule.js';
import User from '../models/User.js';
import {
  extractId,
  getTodayDateString,
  isShiftTimePassed,
  isShiftStartedOrPassed,
  checkShiftOverlap,
  getCurrentVNTime,
  timeToMinutes,
  getWeekNumberAndYear,
} from '../utils/timeScheduleHelpers.js';
import { sendMissedShiftEmail } from './emailService.js';

/**
 * Service: Xác thực bảo toàn ca đã qua (Immutability Validation)
 * TUYỆT ĐỐI KHÔNG THỂ XÓA, SỬA HOẶC THAY ĐỔI CA ĐÃ QUA
 */
export const validatePassedShiftImmutability = async (
  storeId,
  rawAssignments,
  existingAssignments = [],
  isPublishedSchedule = false
) => {
  const shifts = await Shift.find({ storeId });
  const shiftMap = {};
  shifts.forEach((s) => {
    shiftMap[s._id.toString()] = s;
  });

  const members = await StoreMember.find({ storeId }).populate('userId', 'fullName');
  const memberMap = {};
  members.forEach((m) => {
    if (m.userId) {
      memberMap[m.userId._id.toString()] = m;
    }
  });

  const todayStr = getTodayDateString();

  // Danh sách các ca đã qua trong DB
  const existingKeySet = new Set();
  const existingPassedList = [];

  for (const a of existingAssignments) {
    const sId = extractId(a.shiftId);
    const uId = extractId(a.userId);
    const shift = shiftMap[sId];
    const key = `${a.date}_${sId}_${uId}`;
    existingKeySet.add(key);

    if (shift && isShiftTimePassed(a.date, shift)) {
      existingPassedList.push({
        date: a.date,
        shiftId: sId,
        userId: uId,
        shiftName: shift.name,
        timeRange: `${shift.startTime} - ${shift.endTime}`,
        key,
      });
    }
  }

  // Tập hợp các ca mới gửi lên
  const incomingKeySet = new Set();
  for (const item of rawAssignments) {
    const sId = extractId(item.shiftId);
    const uId = extractId(item.userId);
    const key = `${item.date}_${sId}_${uId}`;
    incomingKeySet.add(key);
  }

  // 1. KIỂM TRA BỊ XÓA: Chỉ áp dụng khi lịch ĐÃ XUẤT BẢN (PUBLISHED)
  // Nếu là lịch nháp (DRAFT), quản lý có quyền bỏ các ca nháp ở ngày shop nghỉ mà không bị lỗi
  if (isPublishedSchedule) {
    for (const passed of existingPassedList) {
      if (!incomingKeySet.has(passed.key)) {
        const member = memberMap[passed.userId];
        const empName = member?.userId?.fullName || 'nhân viên';
        const err = new Error(
          `Không thể xóa ca làm việc đã kết thúc của lịch đã xuất bản: Ca "${passed.shiftName}" (${passed.timeRange}) ngày ${passed.date} của nhân viên "${empName}" đã diễn ra. Hệ thống khóa các ca đã qua để bảo toàn giờ làm và tiền lương của nhân viên!`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }

  // 2. KIỂM TRA THÊM MỚI HOẶC SỬA: Tuyệt đối không được phép thêm mới hay đổi nhân viên vào một ca đã qua
  for (const item of rawAssignments) {
    const sId = extractId(item.shiftId);
    const uId = extractId(item.userId);
    const shift = shiftMap[sId];

    if (shift && isShiftTimePassed(item.date, shift)) {
      const key = `${item.date}_${sId}_${uId}`;
      if (!existingKeySet.has(key)) {
        const err = new Error(
          `Không thể sửa hoặc thêm mới vào ca làm việc đã kết thúc: Ca "${shift.name}" (${shift.startTime} - ${shift.endTime}) ngày ${item.date} đã qua giờ làm. Không thể thay đổi người trực ca đã hoàn thành!`
        );
        err.statusCode = 400;
        throw err;
      }
    } else if (item.date && item.date < todayStr) {
      const key = `${item.date}_${sId}_${uId}`;
      if (!existingKeySet.has(key)) {
        const err = new Error(
          `Lỗi xếp lịch: Ngày ${item.date} đã qua trong quá khứ. Hệ thống chỉ cho phép xếp lịch cho ngày hiện tại và tương lai!`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }
};

/**
 * Service: Xử lý tính toán tiền lương cho từng ca và tổng kết lương
 */
export const processAssignmentsAndSalary = async (storeId, rawAssignments, week, year) => {
  // 1. Lấy toàn bộ ca làm việc của quán để map số giờ
  const shifts = await Shift.find({ storeId });
  const shiftMap = {};
  shifts.forEach((s) => {
    shiftMap[s._id.toString()] = s;
  });

  const store = await Store.findById(storeId);

  // 2. Lấy toàn bộ thành viên của quán để map mức lương theo giờ
  const members = await StoreMember.find({ storeId, status: 'ACTIVE' }).populate(
    'userId',
    'fullName email'
  );
  const memberMap = {};
  members.forEach((m) => {
    if (m.userId) {
      memberMap[m.userId._id.toString()] = m;
    }
  });

  // 2.1. Tra cứu các ca làm việc tại các chi nhánh khác trong cùng tuần để chống trùng ca liên chi nhánh
  let weekNum = week;
  let yearNum = year;
  if (!weekNum || !yearNum) {
    const firstDate = rawAssignments.find((a) => a.date)?.date;
    if (firstDate) {
      const computed = getWeekNumberAndYear(firstDate);
      weekNum = computed.week;
      yearNum = computed.year;
    }
  }

  const externalShiftsByUserAndDate = {};
  if (weekNum && yearNum) {
    const memberUserIds = Object.keys(memberMap);
    if (memberUserIds.length > 0) {
      const otherSchedules = await Schedule.find({
        storeId: { $ne: storeId },
        week: Number(weekNum),
        year: Number(yearNum),
        'assignments.userId': { $in: memberUserIds },
      })
        .populate('storeId', 'name')
        .populate('assignments.shiftId', 'name startTime endTime durationHours');

      for (const otherSched of otherSchedules) {
        const extStoreName = otherSched.storeId?.name || 'Chi nhánh khác';
        for (const a of otherSched.assignments || []) {
          const uId = extractId(a.userId);
          const extShift = a.shiftId;
          if (extShift && a.date && memberMap[uId]) {
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
    }
  }

  // 3. Kiểm tra logic trùng giờ làm việc: 1 người không thể làm 2 ca trùng/giao thoa giờ trong 1 ngày
  const userDateShifts = {};
  for (const item of rawAssignments) {
    const sId = extractId(item.shiftId);
    const uId = extractId(item.userId);
    if (!item.date || !sId || !uId) continue;
    const shift = shiftMap[sId];
    const member = memberMap[uId];
    if (!shift || !member) continue;

    // Không cho phép xếp Chủ cửa hàng (ADMIN) vào ca làm việc
    const isOwner = (store && store.ownerId.toString() === uId) || member.roleInStore === 'ADMIN';
    if (isOwner) {
      const memberName = member.userId ? (member.userId.fullName || member.userId.name) : 'Chủ cửa hàng';
      const err = new Error(
        `Lỗi phân công: "${memberName}" là Chủ cửa hàng (ADMIN). Chủ cửa hàng không thể được phân công vào ca làm việc!`
      );
      err.statusCode = 400;
      throw err;
    }

    const key = `${item.date}_${uId}`;
    if (!userDateShifts[key]) {
      userDateShifts[key] = [];
    }

    for (const existingShift of userDateShifts[key]) {
      // 1. Kiểm tra nếu bị phân trùng 2 lần cùng 1 ca
      if (existingShift._id.toString() === shift._id.toString()) {
        const memberName = member.userId ? (member.userId.fullName || member.userId.name) : 'Nhân viên';
        const err = new Error(
          `Lỗi trùng lặp: Nhân viên "${memberName}" đã được phân công vào ca "${shift.name}" ngày ${item.date}. Không thể thêm cùng một nhân viên nhiều lần vào cùng một ca!`
        );
        err.statusCode = 400;
        throw err;
      }

      // 2. Kiểm tra nếu trùng khung giờ giữa 2 ca khác nhau trong cùng một quán
      if (checkShiftOverlap(shift, existingShift)) {
        const memberName = member.userId ? (member.userId.fullName || member.userId.name) : 'Nhân viên';
        const err = new Error(
          `Lỗi trùng ca: Nhân viên "${memberName}" bị trùng giờ làm việc vào ngày ${item.date} giữa ca "${existingShift.name}" (${existingShift.startTime} - ${existingShift.endTime}) và ca "${shift.name}" (${shift.startTime} - ${shift.endTime}). Một người không thể làm 2 ca trong cùng khung giờ!`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Kiểm tra nếu trùng khung giờ với ca ở chi nhánh khác của nhân viên
    const extShifts = externalShiftsByUserAndDate[key] || [];
    for (const ext of extShifts) {
      if (checkShiftOverlap(shift, ext)) {
        const memberName = member.userId ? (member.userId.fullName || member.userId.name) : 'Nhân viên';
        const err = new Error(
          `Lỗi trùng ca liên chi nhánh: Nhân viên "${memberName}" đã có ca làm việc "${ext.name}" (${ext.startTime} - ${ext.endTime}) tại chi nhánh "${ext.storeName}" vào ngày ${item.date}. Một nhân viên không thể làm 2 ca trùng hoặc giao thoa khung giờ dù ở 2 chi nhánh khác nhau!`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    userDateShifts[key].push(shift);
  }

  // 4. Tính toán cho từng ca phân công
  const processedAssignments = [];
  const salaryMap = {};

  for (const item of rawAssignments) {
    const sId = extractId(item.shiftId);
    const uId = extractId(item.userId);
    const shift = shiftMap[sId];
    const member = memberMap[uId];

    if (!shift || !member) continue;

    const isMissed = item.attendanceStatus === 'MISSED';
    const isPartial = item.attendanceStatus === 'PARTIAL';
    const hours = shift.durationHours || 0;
    const wage =
      item.hourlyWage !== undefined && !isNaN(Number(item.hourlyWage))
        ? Number(item.hourlyWage)
        : member.hourlyWage || 0;
    const fullPay = Math.round(hours * wage);

    let deductedHours = Number(item.deductedHours) || 0;
    let deductedPay = Number(item.deductedPay) || 0;
    let totalPay = fullPay;

    if (isMissed) {
      deductedHours = hours;
      deductedPay = fullPay;
      totalPay = 0;
    } else if (isPartial) {
      if (item.penaltyType === 'AMOUNT') {
        deductedPay = Math.min(fullPay, Math.max(0, deductedPay));
        deductedHours = wage > 0 ? Number((deductedPay / wage).toFixed(1)) : 0;
      } else {
        deductedHours = Math.min(hours, Math.max(0, deductedHours));
        deductedPay = Math.min(fullPay, Math.round(deductedHours * wage));
      }
      totalPay = Math.max(0, fullPay - deductedPay);
    } else {
      deductedHours = 0;
      deductedPay = 0;
    }

    processedAssignments.push({
      date: item.date,
      dayOfWeek: item.dayOfWeek,
      shiftId: shift._id,
      userId: member.userId._id,
      hourlyWage: wage,
      hours: hours,
      totalPay: totalPay,
      attendanceStatus: isMissed ? 'MISSED' : isPartial ? 'PARTIAL' : 'COMPLETED',
      penaltyType: item.penaltyType || (isPartial ? 'HOURS' : 'NONE'),
      deductedHours,
      deductedPay,
      missedReason: item.missedReason || '',
      evaluatedAt: item.evaluatedAt || null,
      evaluatedBy: item.evaluatedBy || null,
    });

    // Gom nhóm tổng lương theo nhân viên
    const uid = member.userId._id.toString();
    if (!salaryMap[uid]) {
      salaryMap[uid] = {
        userId: member.userId._id,
        fullName: member.userId.fullName,
        email: member.userId.email,
        hourlyWage: wage,
        totalHours: 0,
        totalSalary: 0,
        shiftCount: 0,
        completedShifts: 0,
        partialShifts: 0,
        missedShifts: 0,
        shifts: [],
      };
    }

    if (isMissed) {
      salaryMap[uid].missedShifts += 1;
    } else if (isPartial) {
      const effectiveHours = Math.max(0, hours - deductedHours);
      salaryMap[uid].totalHours += effectiveHours;
      salaryMap[uid].totalSalary += totalPay;
      salaryMap[uid].partialShifts = (salaryMap[uid].partialShifts || 0) + 1;
      salaryMap[uid].completedShifts += 1;
    } else {
      salaryMap[uid].totalHours += hours;
      salaryMap[uid].totalSalary += totalPay;
      salaryMap[uid].completedShifts += 1;
    }
    salaryMap[uid].shiftCount += 1;
    salaryMap[uid].shifts.push({
      date: item.date,
      dayOfWeek: item.dayOfWeek,
      shiftName: shift.name,
      timeRange: `${shift.startTime} - ${shift.endTime}`,
      hours: hours,
      totalPay: totalPay,
      attendanceStatus: isMissed ? 'MISSED' : isPartial ? 'PARTIAL' : 'COMPLETED',
      penaltyType: item.penaltyType || (isPartial ? 'HOURS' : 'NONE'),
      deductedHours,
      deductedPay,
      missedReason: item.missedReason || '',
    });
  }

  return {
    processedAssignments,
    salarySummary: Object.values(salaryMap),
    salaryMap,
  };
};

/**
 * Service: Tạo bảng tổng kết lương từ danh sách assignments đã lưu trong DB
 */
export const calculateSalarySummaryFromAssignments = (assignments) => {
  const salaryMap = {};
  assignments.forEach((a) => {
    if (!a.userId) return;
    const uid = a.userId._id ? a.userId._id.toString() : a.userId.toString();
    if (!salaryMap[uid]) {
      salaryMap[uid] = {
        userId: a.userId._id || a.userId,
        fullName: a.userId.fullName || a.userId.name || 'Nhân viên',
        email: a.userId.email || '',
        hourlyWage: a.hourlyWage,
        totalHours: 0,
        totalSalary: 0,
        shiftCount: 0,
        completedShifts: 0,
        partialShifts: 0,
        missedShifts: 0,
      };
    }
    const isMissed = a.attendanceStatus === 'MISSED';
    const isPartial = a.attendanceStatus === 'PARTIAL';
    if (isMissed) {
      salaryMap[uid].missedShifts += 1;
    } else if (isPartial) {
      const effectiveHours = Math.max(0, (a.hours || 0) - (a.deductedHours || 0));
      salaryMap[uid].totalHours += effectiveHours;
      salaryMap[uid].totalSalary += Math.max(0, a.totalPay !== undefined ? a.totalPay : 0);
      salaryMap[uid].partialShifts = (salaryMap[uid].partialShifts || 0) + 1;
      salaryMap[uid].completedShifts += 1;
    } else {
      salaryMap[uid].totalHours += a.hours || 0;
      salaryMap[uid].totalSalary += a.totalPay !== undefined ? a.totalPay : Math.round((a.hours || 0) * (a.hourlyWage || 0));
      salaryMap[uid].completedShifts += 1;
    }
    salaryMap[uid].shiftCount += 1;
  });
  return Object.values(salaryMap);
};

/**
 * Thuật toán tính toán số lượng nhân sự mục tiêu cho từng ca:
 * Dựa trên mức độ cao điểm (1-3 sao) của từng ca và quy mô nhân sự quán.
 * Quy tắc:
 * 1. Đảm bảo độ phủ cơ bản (1 nhân viên cho mỗi ca nếu quán đủ người).
 * 2. Nhân sự dôi dư được ưu tiên phân bổ cho ca 3 sao (Rất cao điểm), sau đó đến ca 2 sao (Khá cao điểm).
 * 3. Giới hạn trần hợp lý (sensible cap) theo mức sao để tránh dồn hết nhân sự vào 1 ca không cần thiết.
 * 4. Nếu quán có ít nhân viên hơn số ca trong ngày, ưu tiên ca có số sao cao nhất.
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
  // Khả năng cung cấp nhân sự tối đa trong 1 ngày mà không vượt quá maxShiftsPerDay
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

  // Bước 2: Thiết lập trần nhân sự tối đa cho mỗi mức sao để không nhồi nhét quá tải vào 1 ca:
  // - 1 sao (Bình thường): trần 1 (trừ khi quán rất đông nhân sự >= 4*K thì trần 2)
  // - 2 sao (Khá cao điểm): trần 2 (nếu quán đông nhân sự >= 3*K thì trần 3)
  // - 3 sao (Rất cao điểm): trần 3 (nếu quán đông nhân sự >= 3*K thì trần 4)
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
      // Đã đạt trần hợp lý cho tất cả các ca, dừng phân bổ để tránh nhồi nhét nhân viên vào 1 ca
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

  // Chuẩn bị danh sách 7 ngày trong tuần (chuẩn hóa cả dạng object { date, dayOfWeek } hoặc string 'YYYY-MM-DD')
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

  // Tìm lịch hiện có trong DB để bảo toàn tuyệt đối toàn bộ ca đã qua
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

  // 2. Nếu chọn giữ lại các ca đã xếp thủ công (chỉ áp dụng cho ca chưa qua)
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

  // Tính toán định mức nhân sự cho từng ca dựa trên mức độ cao điểm (sao ⭐)
  const shiftStaffTargets = calculateShiftStaffTargets({
    shifts,
    totalStaffCount: validMembers.length,
    maxShiftsPerDay: maxPerDay,
    staffPerShift,
  });

  // Tra cứu các ca làm việc tại các chi nhánh khác trong cùng tuần của các nhân viên
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

  // 3. Thuật toán phân bổ ca tối ưu
  for (const day of weekDays) {
    // Bỏ qua các ngày đã qua trong quá khứ (ví dụ: đã qua Thứ Hai thì bỏ qua Thứ Hai)
    if (day.date < todayStr) continue;

    // Sắp xếp các ca trong ngày theo mức độ cao điểm giảm dần (3 sao -> 2 sao -> 1 sao)
    // để các ca đông khách nhất được ưu tiên bố trí nhân sự phù hợp trước
    const prioritizedShifts = [...shifts].sort(
      (a, b) => (b.peakLevel || 1) - (a.peakLevel || 1)
    );

    for (const shift of prioritizedShifts) {
      // Bỏ qua các ca đã qua trong quá khứ
      if (isShiftTimePassed(day.date, shift)) continue;

      // Nếu là hôm nay: bỏ qua ca nếu ca đã bắt đầu hoặc kết thúc
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

          // Bắt buộc không trùng giờ với ca ở chi nhánh khác của nhân viên
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

            // Bắt buộc không trùng giờ với ca ở chi nhánh khác của nhân viên
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

/**
 * Service: Đánh giá ca làm việc (Hoàn thành hoặc Không hoàn thành/Vắng)
 * - Chỉ ca đang diễn ra hoặc đã kết thúc mới được đánh giá. Ca tương lai bị chặn.
 * - Khi ca bị đánh dấu MISSED: lương ca đó thành 0, trừ khỏi tổng lương tuần của nhân viên.
 * - Gửi email thông báo cho nhân viên nếu bị đánh dấu MISSED.
 */
export const evaluateShiftAttendance = async ({
  storeId,
  week,
  year,
  date,
  shiftId,
  userId,
  attendanceStatus, // 'COMPLETED' | 'PARTIAL' | 'MISSED'
  missedReason,
  deductedHours = 0,
  deductedPay = 0,
  penaltyType = 'HOURS',
  evaluatorId,
}) => {
  const store = await Store.findById(storeId);
  if (!store) {
    const err = new Error('Không tìm thấy cửa hàng.');
    err.statusCode = 404;
    throw err;
  }

  const shift = await Shift.findById(shiftId);
  if (!shift) {
    const err = new Error('Không tìm thấy thông tin ca làm việc.');
    err.statusCode = 404;
    throw err;
  }

  // 1. Kiểm tra ràng buộc thời gian:
  // "lưu ý chỉ ca đang diễn ra hoặc quá khứ mới được, còn ca tương lai thì không được quyền đánh giá."
  if (!isShiftStartedOrPassed(date, shift)) {
    const err = new Error(
      `Không thể đánh giá ca làm việc trong tương lai: Ca "${shift.name}" (${shift.startTime} - ${shift.endTime}) ngày ${date} chưa diễn ra. Chỉ được đánh giá khi ca đang diễn ra hoặc đã kết thúc!`
    );
    err.statusCode = 400;
    throw err;
  }

  // 2. Tìm lịch làm việc của tuần
  let schedule = await Schedule.findOne({
    storeId,
    week: Number(week),
    year: Number(year),
  });

  if (!schedule) {
    const err = new Error('Không tìm thấy lịch làm việc của tuần này.');
    err.statusCode = 404;
    throw err;
  }

  // 3. Tìm phân công ca cụ thể
  const uIdStr = String(userId);
  const sIdStr = String(shiftId);
  const targetAssignment = schedule.assignments.find(
    (a) => a.date === date && extractId(a.shiftId) === sIdStr && extractId(a.userId) === uIdStr
  );

  if (!targetAssignment) {
    const err = new Error('Nhân viên này không được phân công trong ca làm việc được chọn.');
    err.statusCode = 404;
    throw err;
  }

  const hours = targetAssignment.hours || shift.durationHours || 4;
  const wage = targetAssignment.hourlyWage || 20000;
  const fullPay = Math.round(hours * wage);

  let newStatus = 'COMPLETED';
  if (attendanceStatus === 'MISSED') {
    newStatus = 'MISSED';
  } else if (attendanceStatus === 'PARTIAL') {
    newStatus = 'PARTIAL';
  }

  targetAssignment.attendanceStatus = newStatus;
  targetAssignment.evaluatedAt = new Date();
  targetAssignment.evaluatedBy = evaluatorId;

  if (newStatus === 'MISSED') {
    targetAssignment.penaltyType = 'HOURS';
    targetAssignment.deductedHours = hours;
    targetAssignment.deductedPay = fullPay;
    targetAssignment.totalPay = 0;
    targetAssignment.missedReason = (missedReason || '').trim();
  } else if (newStatus === 'PARTIAL') {
    targetAssignment.penaltyType = penaltyType === 'AMOUNT' ? 'AMOUNT' : 'HOURS';
    let dPay = 0;
    let dHours = 0;
    if (targetAssignment.penaltyType === 'AMOUNT') {
      dPay = Math.min(fullPay, Math.max(0, Math.round(Number(deductedPay) || 0)));
      dHours = wage > 0 ? Number((dPay / wage).toFixed(1)) : 0;
    } else {
      dHours = Math.min(hours, Math.max(0, Number(deductedHours) || 0));
      dPay = Math.min(fullPay, Math.round(dHours * wage));
    }
    targetAssignment.deductedHours = dHours;
    targetAssignment.deductedPay = dPay;
    targetAssignment.totalPay = Math.max(0, fullPay - dPay);
    targetAssignment.missedReason = (missedReason || '').trim();
  } else {
    // COMPLETED
    targetAssignment.penaltyType = 'NONE';
    targetAssignment.deductedHours = 0;
    targetAssignment.deductedPay = 0;
    targetAssignment.totalPay = fullPay;
    targetAssignment.missedReason = '';
  }

  await schedule.save();

  // Populate lại để trả về frontend
  await schedule.populate([
    { path: 'assignments.shiftId', select: 'name startTime endTime durationHours color' },
    { path: 'assignments.userId', select: 'fullName email systemRole' },
    { path: 'assignments.evaluatedBy', select: 'fullName email' },
  ]);

  const salarySummary = calculateSalarySummaryFromAssignments(schedule.assignments);

  // 4. Gửi email thông báo nếu đánh dấu MISSED hoặc PARTIAL
  let emailResult = null;
  if (newStatus === 'MISSED' || newStatus === 'PARTIAL') {
    const targetMember = await User.findById(userId);
    const toEmail = targetMember?.email;
    const employeeName = targetMember?.fullName || 'Nhân viên';

    // Lấy thông tin người đánh giá (Chủ cửa hàng hoặc Quản lý)
    const evaluator = await User.findById(evaluatorId);
    const isStoreOwner = store.ownerId && String(store.ownerId) === String(evaluatorId);
    const evaluatorRole = isStoreOwner ? 'Chủ cửa hàng' : 'Quản lý cửa hàng';
    const evaluatorName = evaluator?.fullName || evaluator?.name || (isStoreOwner ? 'Chủ cửa hàng' : 'Quản lý');

    // Tính lương tuần sau cập nhật của nhân viên này
    const empSalaryInfo = salarySummary.find(
      (s) => String(s.userId._id || s.userId) === uIdStr
    );
    const updatedTotalSalary = empSalaryInfo ? empSalaryInfo.totalSalary : 0;

    if (toEmail) {
      emailResult = await sendMissedShiftEmail({
        toEmail,
        employeeName,
        storeName: store.name,
        evaluatorName,
        evaluatorRole,
        shiftName: shift.name,
        timeRange: `${shift.startTime} - ${shift.endTime}`,
        date: targetAssignment.date,
        dayOfWeek: targetAssignment.dayOfWeek,
        attendanceStatus: newStatus,
        deductedHours: targetAssignment.deductedHours,
        deductedPay: targetAssignment.deductedPay,
        originalPay: fullPay,
        remainingPay: targetAssignment.totalPay,
        reason: targetAssignment.missedReason,
        updatedTotalSalary,
      });
    }
  }

  return {
    schedule,
    salarySummary,
    updatedAssignment: targetAssignment,
    emailResult,
  };
};
