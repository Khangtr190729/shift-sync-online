import Store from '../../models/Store.js';
import Shift from '../../models/Shift.js';
import Schedule from '../../models/Schedule.js';
import User from '../../models/User.js';
import {
  extractId,
  isShiftStartedOrPassed,
  isShiftTimePassed,
} from '../../utils/timeScheduleHelpers.js';
import { sendMissedShiftEmail } from '../emailService.js';
import { calculateSalarySummaryFromAssignments } from './payrollProcessor.js';

/**
 * Service: Đánh giá ca làm việc (Hoàn thành, Chưa hoàn thành tốt, hoặc Vắng/Không hoàn thành)
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

  // 1. Kiểm tra ràng buộc thời gian
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

    const evaluator = await User.findById(evaluatorId);
    const isStoreOwner = store.ownerId && String(store.ownerId) === String(evaluatorId);
    const evaluatorRole = isStoreOwner ? 'Chủ cửa hàng' : 'Quản lý cửa hàng';
    const evaluatorName = evaluator?.fullName || evaluator?.name || (isStoreOwner ? 'Chủ cửa hàng' : 'Quản lý');

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

/**
 * Service: Tự động xóa các ca làm việc trong tương lai của nhân viên bị xóa khỏi cửa hàng
 * BẢO TOÀN TUYỆT ĐỐI các ca đã qua trong quá khứ để bảo vệ lịch sử chấm công và tiền lương
 */
export const removeMemberFutureShifts = async (storeId, targetUserId) => {
  if (!storeId || !targetUserId) return 0;

  const shifts = await Shift.find({ storeId });
  const shiftMap = {};
  shifts.forEach((s) => {
    shiftMap[s._id.toString()] = s;
  });

  const targetIdStr = targetUserId.toString();

  const schedules = await Schedule.find({
    storeId,
    'assignments.userId': targetIdStr,
  });

  let totalRemoved = 0;

  for (const schedule of schedules) {
    const originalCount = schedule.assignments.length;

    schedule.assignments = schedule.assignments.filter((a) => {
      const uId = extractId(a.userId);
      if (uId !== targetIdStr) {
        return true;
      }

      const sId = extractId(a.shiftId);
      const shift = shiftMap[sId];

      if (shift && isShiftTimePassed(a.date, shift)) {
        return true;
      }

      return false;
    });

    if (schedule.assignments.length !== originalCount) {
      totalRemoved += originalCount - schedule.assignments.length;
      await schedule.save();
    }
  }

  return totalRemoved;
};

