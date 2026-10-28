import { useMemo, useCallback } from 'react';
import { checkShiftOverlap } from '../utils/formatters';
import { getUserId, getShiftId } from '../utils/scheduleTimeHelpers';

export const useScheduleConflicts = ({ assignments, shifts, members, crossStoreShifts }) => {
  // Kiểm tra xung đột ca làm đối với 1 user cụ thể vào 1 ngày và 1 ca
  const getConflictingShift = useCallback(
    (userId, dateStr, targetShiftId) => {
      if (!userId || !dateStr || !targetShiftId) return null;
      const tShiftId = getShiftId(targetShiftId);
      const uId = getUserId(userId);
      const targetShift = shifts.find((s) => getShiftId(s._id) === tShiftId);
      if (!targetShift) return null;

      const otherAssignments = assignments.filter(
        (a) => a.date === dateStr && getUserId(a.userId) === uId && getShiftId(a.shiftId) !== tShiftId
      );

      for (const a of otherAssignments) {
        const otherShift = shifts.find((s) => getShiftId(s._id) === getShiftId(a.shiftId)) || a.shiftObj;
        if (otherShift && checkShiftOverlap(targetShift, otherShift)) {
          return otherShift;
        }
      }

      // Kiểm tra trùng ca với các chi nhánh khác
      const crossConflict = crossStoreShifts.find((c) => {
        if (getUserId(c.userId) !== uId || c.date !== dateStr) return false;
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
    },
    [assignments, shifts, crossStoreShifts]
  );

  // Kiểm tra xung đột cho 1 phân công cụ thể
  const getAssignmentConflict = useCallback(
    (assignment) => {
      if (!assignment || !assignment.userId || !assignment.date) return null;
      const targetUserId = getUserId(assignment.userId);
      const targetShiftId = getShiftId(assignment.shiftId);
      const targetShift = shifts.find((s) => getShiftId(s._id) === targetShiftId) || assignment.shiftObj;
      if (!targetShift) return null;

      const conflicting = assignments.find((a) => {
        if (
          a === assignment ||
          a.date !== assignment.date ||
          getUserId(a.userId) !== targetUserId
        ) {
          return false;
        }
        if (getShiftId(a.shiftId) === targetShiftId) {
          return true;
        }
        const otherShift = shifts.find((s) => getShiftId(s._id) === getShiftId(a.shiftId)) || a.shiftObj;
        return otherShift && checkShiftOverlap(targetShift, otherShift);
      });

      if (conflicting) {
        return shifts.find((s) => getShiftId(s._id) === getShiftId(conflicting.shiftId)) || conflicting.shiftObj;
      }

      // Kiểm tra trùng ca với các chi nhánh khác
      const crossConflict = crossStoreShifts.find((c) => {
        if (getUserId(c.userId) !== targetUserId || c.date !== assignment.date) return false;
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
    },
    [assignments, shifts, crossStoreShifts]
  );

  // Danh sách toàn bộ xung đột ca trong tuần
  const scheduleConflicts = useMemo(() => {
    const conflicts = [];
    assignments.forEach((a1, idx1) => {
      const uId1 = getUserId(a1.userId);
      const sId1 = getShiftId(a1.shiftId);
      if (!uId1 || !a1.date || !sId1) return;
      const shift1 = shifts.find((s) => getShiftId(s._id) === sId1) || a1.shiftObj;
      if (!shift1) return;

      assignments.forEach((a2, idx2) => {
        if (idx1 >= idx2) return;
        const uId2 = getUserId(a2.userId);
        const sId2 = getShiftId(a2.shiftId);
        if (a1.date !== a2.date || uId1 !== uId2) return;

        const shift2 = shifts.find((s) => getShiftId(s._id) === sId2) || a2.shiftObj;
        if (!shift2) return;

        const emp = members.find((m) => getUserId(m.user?._id || m.userId) === uId1);
        const empName = emp?.user?.name || emp?.fullName || a1.userObj?.name || 'Nhân viên';

        if (sId1 === sId2) {
          conflicts.push({
            date: a1.date,
            userId: uId1,
            employeeName: empName,
            shift1,
            shift2,
            isDuplicate: true,
            message: `Lỗi trùng lặp: Nhân viên "${empName}" đã được phân công 2 lần vào ca "${shift1.name}" ngày ${a1.date}!`,
          });
          return;
        }

        if (checkShiftOverlap(shift1, shift2)) {
          conflicts.push({
            date: a1.date,
            userId: uId1,
            employeeName: empName,
            shift1,
            shift2,
            isDuplicate: false,
            message: `Lỗi trùng ca: Nhân viên "${empName}" bị trùng giờ làm việc vào ngày ${a1.date} giữa ca "${shift1.name}" (${shift1.startTime} - ${shift1.endTime}) và ca "${shift2.name}" (${shift2.startTime} - ${shift2.endTime})!`,
          });
        }
      });

      // Kiểm tra trùng ca với các chi nhánh khác
      const crossConflict = crossStoreShifts.find(
        (c) => getUserId(c.userId) === uId1 && c.date === a1.date && c.shift && checkShiftOverlap(shift1, c.shift)
      );

      if (crossConflict) {
        const emp = members.find((m) => getUserId(m.user?._id || m.userId) === uId1);
        const empName = emp?.user?.name || emp?.fullName || a1.userObj?.name || 'Nhân viên';
        conflicts.push({
          date: a1.date,
          userId: uId1,
          employeeName: empName,
          shift1,
          shift2: crossConflict.shift,
          isDuplicate: false,
          isCrossStore: true,
          storeName: crossConflict.storeName,
          message: `Lỗi trùng ca liên chi nhánh: Nhân viên "${empName}" đã có ca "${crossConflict.shift.name}" (${crossConflict.shift.startTime} - ${crossConflict.shift.endTime}) tại chi nhánh "${crossConflict.storeName}" vào ngày ${a1.date}!`,
        });
      }
    });
    return conflicts;
  }, [assignments, shifts, members, crossStoreShifts]);

  // Kiểm tra hợp lệ trước khi lưu/xuất bản
  const validateAssignmentsNoOverlap = useCallback(() => {
    if (scheduleConflicts.length > 0) {
      const first = scheduleConflicts[0];
      return {
        hasError: true,
        message: first.message || `Lỗi trùng ca: Nhân viên "${first.employeeName}" bị trùng giờ làm việc vào ngày ${first.date}!`,
      };
    }
    return { hasError: false };
  }, [scheduleConflicts]);

  return {
    getConflictingShift,
    getAssignmentConflict,
    scheduleConflicts,
    validateAssignmentsNoOverlap,
  };
};

