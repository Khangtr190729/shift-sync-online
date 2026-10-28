/**
 * Định dạng tiền tệ VNĐ chuẩn xác
 */
export const formatVND = (amount) => {
  if (amount === undefined || amount === null) return '0 đ';
  const num = Number(amount);
  if (isNaN(num)) return '0 đ';
  return num.toLocaleString('vi-VN') + ' đ';
};

/**
 * Định dạng ngày sang YYYY-MM-DD
 */
export const formatDateToISO = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Lấy ngày Thứ Hai của tuần chứa ngày được truyền vào
 */
export const getMondayOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Thêm hoặc trừ số tuần từ một ngày mốc
 */
export const addWeeks = (date, weeks) => {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
};

/**
 * Tính số thứ tự của tuần trong năm theo chuẩn ISO 8601
 */
export const getWeekNumberAndYear = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return {
    week: weekNumber,
    year: date.getFullYear(),
  };
};

/**
 * Lấy danh sách 7 ngày trong tuần từ Thứ Hai
 */
export const getDaysOfWeek = (mondayDate) => {
  const days = [];
  const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const fullNames = [
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
    'Chủ Nhật',
  ];
  const todayISO = formatDateToISO(new Date());

  for (let i = 0; i < 7; i++) {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + i);
    const dateStr = formatDateToISO(d);
    days.push({
      date: d,
      dateStr,
      dayOfWeek: dayLabels[i],
      fullName: fullNames[i],
      dayNumber: d.getDate(),
      monthNumber: d.getMonth() + 1,
      isToday: dateStr === todayISO,
      fullDisplay: `${fullNames[i]}, ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  return days;
};

/**
 * Định dạng khoảng thời gian tuần
 */
export const formatWeekRange = (mondayDate) => {
  const sundayDate = new Date(mondayDate);
  sundayDate.setDate(mondayDate.getDate() + 6);
  const m1 = String(mondayDate.getDate()).padStart(2, '0');
  const mo1 = String(mondayDate.getMonth() + 1).padStart(2, '0');
  const m2 = String(sundayDate.getDate()).padStart(2, '0');
  const mo2 = String(sundayDate.getMonth() + 1).padStart(2, '0');
  const y = sundayDate.getFullYear();
  return `${m1}/${mo1} — ${m2}/${mo2}/${y}`;
};

/**
 * Lấy nhãn vai trò và màu sắc hiển thị
 */
export const getRoleLabel = (role) => {
  switch (role) {
    case 'ADMIN':
      return { text: 'Chủ cửa hàng', shortText: 'Chủ quán', color: '#0066CC', bg: '#EBF4FF', border: '#D0E4FF' };
    case 'MANAGER':
      return { text: 'Quản lý cửa hàng', shortText: 'Quản lý', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' };
    case 'EMPLOYEE':
    default:
      return { text: 'Nhân viên cửa hàng', shortText: 'Nhân viên', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
  }
};

/**
 * Lấy nhãn chế độ làm việc
 */
export const getEmploymentTypeLabel = (type) => {
  switch (type) {
    case 'FULL_TIME':
      return { text: 'Toàn thời gian (Full-time)', shortText: 'Full-time', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' };
    case 'PART_TIME':
    default:
      return { text: 'Bán thời gian (Part-time)', shortText: 'Part-time', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
  }
};

/**
 * Tính số giờ làm giữa 2 mốc thời gian "HH:MM"
 */
export const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;
  try {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    const startMin = (startH || 0) * 60 + (startM || 0);
    let endMin = (endH || 0) * 60 + (endM || 0);
    if (endMin < startMin) {
      endMin += 1440; // Ca đêm qua 0h
    } else if (endMin === startMin) {
      return 0;
    }
    return Math.round(((endMin - startMin) / 60) * 10) / 10;
  } catch {
    return 0;
  }
};

/**
 * Chuyển đổi định dạng thời gian "HH:MM" sang số phút
 */
export const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Kiểm tra xem 2 ca làm việc có bị trùng hoặc giao thoa khung giờ hay không
 */
export const checkShiftOverlap = (shift1, shift2) => {
  if (!shift1 || !shift2) return false;
  let start1 = timeToMinutes(shift1.startTime);
  let end1 = timeToMinutes(shift1.endTime);
  let start2 = timeToMinutes(shift2.startTime);
  let end2 = timeToMinutes(shift2.endTime);

  // Xử lý ca qua đêm (vượt mốc 24:00)
  if (end1 <= start1) end1 += 1440;
  if (end2 <= start2) end2 += 1440;

  return start1 < end2 && start2 < end1;
};
