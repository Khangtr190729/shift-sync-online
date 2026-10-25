import { checkShiftOverlap } from './formatters';

const getShiftId = (shift) => (typeof shift === 'object' && shift !== null ? shift._id : shift);
const getUserId = (user) => (typeof user === 'object' && user !== null ? user._id : user);

/**
 * Kiểm tra xem một nhân viên có bị trùng giờ khi gán vào ca cụ thể hay không (cùng quán hoặc chi nhánh khác)
 */
export const checkMemberShiftConflict = (
  userId,
  dateStr,
  targetShiftId,
  assignments = [],
  storeShifts = [],
  crossStoreShifts = [],
  currentStoreName = 'Chi nhánh này'
) => {
  if (!userId || !dateStr || !targetShiftId) return null;
  const tShiftId = (getShiftId(targetShiftId) || '').toString();
  const uId = (getUserId(userId) || '').toString();
  const targetShift = storeShifts.find((s) => (getShiftId(s._id) || '').toString() === tShiftId);
  if (!targetShift) return null;

  // 1. Kiểm tra trùng ca cùng quán trong ngày
  const otherAssignments = assignments.filter((a) => {
    const aShiftId = (getShiftId(a.shiftId) || '').toString();
    const aUserId = (getUserId(a.userId) || '').toString();
    return a.date === dateStr && aUserId === uId && aShiftId !== tShiftId;
  });

  for (const a of otherAssignments) {
    const otherShift =
      storeShifts.find((s) => (getShiftId(s._id) || '').toString() === (getShiftId(a.shiftId) || '').toString()) ||
      a.shiftObj;
    if (otherShift && checkShiftOverlap(targetShift, otherShift)) {
      return {
        ...otherShift,
        isCrossStore: false,
        storeName: currentStoreName,
      };
    }
  }

  // 2. Kiểm tra trùng ca với các chi nhánh khác trong ngày
  const crossConflict = crossStoreShifts.find((c) => {
    const cUserId = (getUserId(c.userId) || '').toString();
    if (cUserId !== uId || c.date !== dateStr) return false;
    return c.shift && checkShiftOverlap(targetShift, c.shift);
  });

  if (crossConflict) {
    return {
      ...crossConflict.shift,
      isCrossStore: true,
      storeName: crossConflict.storeName,
    };
  }

  return null;
};

/**
 * Kiểm tra xung đột của một ca phân công cụ thể đã tồn tại trong bảng lịch
 */
export const checkSingleAssignmentConflict = (
  assignment,
  assignments = [],
  storeShifts = [],
  crossStoreShifts = [],
  currentStoreName = 'Chi nhánh này'
) => {
  if (!assignment || !assignment.userId || !assignment.date) return null;
  const targetUserId = (getUserId(assignment.userId) || '').toString();
  const targetShiftId = (getShiftId(assignment.shiftId) || '').toString();
  const targetShift =
    storeShifts.find((s) => (getShiftId(s._id) || '').toString() === targetShiftId) || assignment.shiftObj;
  if (!targetShift) return null;

  // Kiểm tra trùng trong quán
  const conflicting = assignments.find((a) => {
    if (a === assignment || a.date !== assignment.date) return false;
    if ((getUserId(a.userId) || '').toString() !== targetUserId) return false;
    if ((getShiftId(a.shiftId) || '').toString() === targetShiftId) return true;

    const otherShift =
      storeShifts.find((s) => (getShiftId(s._id) || '').toString() === (getShiftId(a.shiftId) || '').toString()) ||
      a.shiftObj;
    return otherShift && checkShiftOverlap(targetShift, otherShift);
  });

  if (conflicting) {
    const otherShift =
      storeShifts.find((s) => (getShiftId(s._id) || '').toString() === (getShiftId(conflicting.shiftId) || '').toString()) ||
      conflicting.shiftObj;
    return {
      ...(otherShift || {}),
      isCrossStore: false,
      storeName: currentStoreName,
    };
  }

  // Kiểm tra trùng ca chéo chi nhánh khác
  const crossConflict = crossStoreShifts.find((c) => {
    const cUserId = (getUserId(c.userId) || '').toString();
    if (cUserId !== targetUserId || c.date !== assignment.date) return false;
    return c.shift && checkShiftOverlap(targetShift, c.shift);
  });

  if (crossConflict) {
    return {
      ...crossConflict.shift,
      isCrossStore: true,
      storeName: crossConflict.storeName,
    };
  }

  return null;
};

/**
 * Phát hiện toàn bộ danh sách xung đột ca làm việc trong tuần
 */
export const detectScheduleConflicts = (
  assignments = [],
  storeShifts = [],
  members = [],
  crossStoreShifts = []
) => {
  const conflicts = [];
  assignments.forEach((a1, idx1) => {
    const uId1 = (getUserId(a1.userId) || '').toString();
    const sId1 = (getShiftId(a1.shiftId) || '').toString();
    const shift1 = storeShifts.find((s) => (getShiftId(s._id) || '').toString() === sId1) || a1.shiftObj;
    if (!shift1) return;

    // Trùng ca trong cùng quán
    assignments.forEach((a2, idx2) => {
      if (idx2 <= idx1) return;
      if (a1.date !== a2.date) return;
      const uId2 = (getUserId(a2.userId) || '').toString();
      if (uId1 !== uId2) return;

      const sId2 = (getShiftId(a2.shiftId) || '').toString();
      const shift2 = storeShifts.find((s) => (getShiftId(s._id) || '').toString() === sId2) || a2.shiftObj;
      if (!shift2) return;

      const emp = members.find(
        (m) => (getUserId(m.userId?._id || m.userId || m.user?._id) || '').toString() === uId1
      );
      const empName = emp?.userId?.fullName || emp?.fullName || a1.userName || 'Nhân viên';

      if (sId1 === sId2) {
        conflicts.push({
          date: a1.date,
          userId: uId1,
          employeeName: empName,
          isCrossStore: false,
          message: `Nhân viên "${empName}" được phân công 2 lần vào cùng ca "${shift1.name}" ngày ${a1.date}!`,
        });
        return;
      }

      if (checkShiftOverlap(shift1, shift2)) {
        conflicts.push({
          date: a1.date,
          userId: uId1,
          employeeName: empName,
          isCrossStore: false,
          message: `Nhân viên "${empName}" bị trùng giờ ca "${shift1.name}" (${shift1.startTime}-${shift1.endTime}) và ca "${shift2.name}" (${shift2.startTime}-${shift2.endTime}) ngày ${a1.date}!`,
        });
      }
    });

    // Trùng ca với các chi nhánh khác
    const crossConflict = crossStoreShifts.find((c) => {
      const cUserId = (getUserId(c.userId) || '').toString();
      return cUserId === uId1 && c.date === a1.date && c.shift && checkShiftOverlap(shift1, c.shift);
    });

    if (crossConflict) {
      const emp = members.find(
        (m) => (getUserId(m.userId?._id || m.userId || m.user?._id) || '').toString() === uId1
      );
      const empName = emp?.userId?.fullName || emp?.fullName || a1.userName || 'Nhân viên';
      conflicts.push({
        date: a1.date,
        userId: uId1,
        employeeName: empName,
        isCrossStore: true,
        storeName: crossConflict.storeName,
        message: `Lỗi trùng ca liên chi nhánh: Nhân viên "${empName}" đã có ca "${crossConflict.shift.name}" (${crossConflict.shift.startTime}-${crossConflict.shift.endTime}) tại chi nhánh "${crossConflict.storeName}" ngày ${a1.date}!`,
      });
    }
  });
  return conflicts;
};
