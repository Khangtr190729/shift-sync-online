/**
 * Utility helper: Tính toán dự toán bảng lương tuần và thống kê ca làm việc
 */

const getShiftId = (shift) => (typeof shift === 'object' && shift !== null ? shift._id : shift);
const getUserId = (user) => (typeof user === 'object' && user !== null ? user._id : user);

export const calculateWeeklyPayroll = (members = [], assignments = [], storeShifts = []) => {
  const employeeMap = {};

  // Khởi tạo map nhân viên
  members.forEach((m) => {
    const uId = getUserId(m.userId?._id || m.userId || m.user?._id);
    if (!uId) return;
    const uName = m.userId?.fullName || m.fullName || m.name || 'Nhân viên';
    employeeMap[uId] = {
      userId: uId,
      name: uName,
      email: m.userId?.email || '',
      hourlyWage: m.hourlyWage || 20000,
      totalHours: 0,
      totalShifts: 0,
      completedShifts: 0,
      partialShifts: 0,
      missedShifts: 0,
      totalWage: 0,
    };
  });

  // Duyệt qua từng ca phân công
  assignments.forEach((a) => {
    const uId = getUserId(a.userId);
    const sId = getShiftId(a.shiftId);
    const shift = storeShifts.find((s) => getShiftId(s._id) === sId);
    const hours = a.hours || shift?.durationHours || 4;
    const wage = a.hourlyWage || employeeMap[uId]?.hourlyWage || 20000;
    const fullPay = Math.round(hours * wage);

    if (!employeeMap[uId]) {
      const uName =
        (typeof a.userId === 'object' && a.userId !== null
          ? a.userId.fullName || a.userId.name
          : '') || 'Nhân viên';
      employeeMap[uId] = {
        userId: uId,
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
