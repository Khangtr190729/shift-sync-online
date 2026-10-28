import Shift from '../../models/Shift.js';
import StoreMember from '../../models/StoreMember.js';
import {
  extractId,
  getTodayDateString,
  isShiftTimePassed,
} from '../../utils/timeScheduleHelpers.js';

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
        const member = memberMap[uId];
        const empName = member?.userId?.fullName || 'nhân viên';
        const err = new Error(
          `Không thể thêm mới hoặc thay đổi ca làm việc đã kết thúc: Ca "${shift.name}" (${shift.startTime} - ${shift.endTime}) ngày ${item.date} của nhân viên "${empName}" đã diễn ra trong quá khứ!`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }
};

