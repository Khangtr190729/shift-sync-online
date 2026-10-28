import Shift from '../../models/Shift.js';
import Store from '../../models/Store.js';
import StoreMember from '../../models/StoreMember.js';
import Schedule from '../../models/Schedule.js';
import {
  extractId,
  checkShiftOverlap,
  getWeekNumberAndYear,
} from '../../utils/timeScheduleHelpers.js';

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

