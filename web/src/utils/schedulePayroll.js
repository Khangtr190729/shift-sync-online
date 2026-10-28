import { getUserId, getShiftId } from './scheduleTimeHelpers';

/**
 * Tính toán tổng hợp bảng lương theo ca trong tuần
 * Tự động trừ tiền phạt và giảm lương đối với ca MISSED (không hoàn thành) hoặc PARTIAL (chưa tốt)
 */
export const calculateWeeklyPayrollSummary = (members, assignments, shifts) => {
  const employeeMap = {};
  members.forEach((m) => {
    const uId = getUserId(m.user?._id || m.userId);
    employeeMap[uId] = {
      name: m.user?.name || m.fullName || 'Nhân viên',
      email: m.user?.email || m.email,
      hourlyWage: m.hourlyWage || 20000,
      totalHours: 0,
      totalShifts: 0,
      completedShifts: 0,
      partialShifts: 0,
      missedShifts: 0,
      totalWage: 0,
    };
  });

  assignments.forEach((a) => {
    const uId = getUserId(a.userId);
    const sId = getShiftId(a.shiftId);
    const shift = shifts.find((s) => getShiftId(s._id) === sId) || a.shiftObj;
    const hours = a.hours || shift?.durationHours || 4;
    const wage = a.hourlyWage || employeeMap[uId]?.hourlyWage || 20000;
    const fullPay = Math.round(hours * wage);

    if (!employeeMap[uId]) {
      const uName = a.userObj?.name || 'Nhân viên';
      employeeMap[uId] = {
        name: uName,
        email: '',
        hourlyWage: wage,
        totalHours: 0,
        totalShifts: 0,
        completedShifts: 0,
        partialShifts: 0,
        missedShifts: 0,
        totalWage: 0,
      };
    }

    employeeMap[uId].totalShifts += 1;

    if (a.attendanceStatus === 'MISSED') {
      employeeMap[uId].missedShifts += 1;
    } else if (a.attendanceStatus === 'PARTIAL') {
      employeeMap[uId].partialShifts += 1;
      employeeMap[uId].completedShifts += 1;
      const effectiveHours = Math.max(0, hours - (a.deductedHours || 0));
      employeeMap[uId].totalHours += effectiveHours;
      const shiftPay = a.totalPay !== undefined ? a.totalPay : Math.max(0, fullPay - (a.deductedPay || 0));
      employeeMap[uId].totalWage += shiftPay;
    } else {
      employeeMap[uId].completedShifts += 1;
      employeeMap[uId].totalHours += hours;
      const shiftPay = a.totalPay !== undefined ? a.totalPay : fullPay;
      employeeMap[uId].totalWage += shiftPay;
    }
  });

  let storeTotalPayroll = 0;
  let storeTotalHours = 0;
  let storeTotalShifts = assignments.length;
  let storeTotalMissedShifts = 0;
  let storeTotalPartialShifts = 0;

  const list = Object.values(employeeMap)
    .filter((e) => e.totalShifts > 0)
    .map((e) => {
      storeTotalPayroll += e.totalWage;
      storeTotalHours += e.totalHours;
      storeTotalMissedShifts += e.missedShifts;
      storeTotalPartialShifts += e.partialShifts;
      return e;
    });

  return {
    employees: list,
    storeTotalPayroll,
    storeTotalHours,
    storeTotalShifts,
    storeTotalMissedShifts,
    storeTotalPartialShifts,
  };
};

